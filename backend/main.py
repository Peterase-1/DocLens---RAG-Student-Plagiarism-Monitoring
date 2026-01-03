from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import shutil
from utils.text_processor import extract_text
from utils.vector_store import get_vector_store, add_assignment
from utils.llm import get_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import uuid

app = FastAPI(title="Plagiarism Checker AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Vector Store
vector_store = get_vector_store()

@app.get("/")
async def root():
    return {"message": "Plagiarism Checker API is running!"}

@app.post("/upload")
async def upload_assignments(files: List[UploadFile] = File(...)):
    results = []
    
    # Process each file
    for file in files:
        try:
            content = await file.read()
            text = extract_text(file.filename, content)
            
            # Use filename as student identifier for now (or split by name)
            student_id = file.filename.split('.')[0]
            
            # Store in ChromaDB
            add_assignment(vector_store, student_id, file.filename, text)
            
            results.append({
                "filename": file.filename,
                "status": "processed",
                "char_count": len(text)
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": str(e)
            })
            
    return {"results": results}

@app.get("/analyze")
async def analyze_class():
    """Generates a similarity heatmap for all processed assignments."""
    try:
        # Get all documents from collection
        # Access the underlying Chroma collection for raw operations
        raw_collection = vector_store._collection
        all_docs = raw_collection.get()
        ids = all_docs['ids']
        documents = all_docs['documents']
        metadatas = all_docs['metadatas']
        
        n = len(ids)
        heatmap_data = [[0 for _ in range(n)] for _ in range(n)]
        
        # Compare each document against all others
        for i in range(n):
            query_results = raw_collection.query(
                query_texts=[documents[i]],
                n_results=n
            )
            
            # Map scores to the grid
            for j in range(len(query_results['ids'][0])):
                target_id = query_results['ids'][0][j]
                # Chroma distance (smaller is more similar)
                # Convert to percentage (heuristic: 1.0 distance -> 0% similarity)
                distance = query_results['distances'][0][j]
                similarity = max(0, int((1 - distance) * 100))
                
                # Find index of target_id
                target_idx = ids.index(target_id)
                heatmap_data[i][target_idx] = similarity
                
        return {
            "students": [m['student_id'] for m in metadatas],
            "heatmap": heatmap_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class CompareRequest(BaseModel):
    file1: str
    file2: str

@app.post("/compare")
async def compare_assignments(file1: str, file2: str):
    """
    Compares two specific assignments using the LLM.
    """
    try:
        print(f"DEBUG: Comparing '{file1}' and '{file2}'")
        
        # Retrieve documents by student_id (since frontend sends student_id)
        doc1_res = vector_store.get(where={"student_id": file1})
        doc2_res = vector_store.get(where={"student_id": file2})
        
        print(f"DEBUG: Doc1 found: {bool(doc1_res['documents'])}")
        print(f"DEBUG: Doc2 found: {bool(doc2_res['documents'])}")
        
        if not doc1_res['documents'] or not doc2_res['documents']:
            print("ERROR: One or both files not found in vector store.")
            raise HTTPException(status_code=404, detail="One or both files not found.")
            
        text1 = doc1_res['documents'][0]
        text2 = doc2_res['documents'][0]
        
        # Use LLM to compare
        try:
            llm = get_llm()
            print("DEBUG: LLM initialized")
        except Exception as e:
            print(f"ERROR: LLM initialization failed: {e}")
            raise HTTPException(status_code=500, detail=f"LLM Config Error: {str(e)}")
        
        prompt = PromptTemplate.from_template(
            """
            You are a plagiarism detection expert. Compare the following two texts and explain the similarities and differences.
            
            Text 1 ({file1}):
            {text1}
            
            Text 2 ({file2}):
            {text2}
            
            Analyze the structure, vocabulary, and flow. Are they independent works or is one derived from the other?
            Provide a similarity score (0-100) and a justification.
            """
        )
        
        chain = prompt | llm | StrOutputParser()
        
        print("DEBUG: Invoking LLM chain...")
        # Truncate text to fit context window (approx 2000 chars each for safety)
        result = chain.invoke({
            "file1": file1, 
            "text1": text1[:4000], 
            "file2": file2, 
            "text2": text2[:4000]
        })
        print("DEBUG: LLM response received")
        
        return {"analysis": result}
        
    except Exception as e:
        print(f"CRITICAL ERROR in /compare: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear-db")
async def clear_database():
    """Removes all assignments from the current collection."""
    # Note: Resetting a collection depends on implementation, simplest is to delete and recreate
    # For now, let's just delete by ID if needed or tell user to restart.
    # In a real app, we'd handle sessions.
    return {"message": "Database clear functionality triggered"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
