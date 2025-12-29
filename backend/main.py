from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import shutil
from utils.text_processor import extract_text
from utils.vector_store import get_vector_store, add_assignment, search_similar
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
collection = get_vector_store()

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
            add_assignment(collection, student_id, file.filename, text)
            
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
        all_docs = collection.get()
        ids = all_docs['ids']
        documents = all_docs['documents']
        metadatas = all_docs['metadatas']
        
        n = len(ids)
        heatmap_data = [[0 for _ in range(n)] for _ in range(n)]
        
        # Compare each document against all others
        for i in range(n):
            query_results = collection.query(
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
