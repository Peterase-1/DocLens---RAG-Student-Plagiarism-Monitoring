import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# Initialize local ChromaDB
# Persistent directory for the database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

def get_vector_store():
    # Use HuggingFace embeddings via LangChain
    # This uses the same model "all-MiniLM-L6-v2" which is free and runs locally
    embedding_func = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Initialize Chroma vector store with persistence
    vector_store = Chroma(
        collection_name="assignments",
        embedding_function=embedding_func,
        persist_directory=DB_PATH
    )
    
    return vector_store

def add_assignment(vector_store, student_id, filename, text):
    """Adds a single assignment to the vector store."""
    vector_store.add_texts(
        texts=[text],
        metadatas=[{"student_id": student_id, "filename": filename}],
        ids=[f"{student_id}_{filename}"]
    )

def search_similar(vector_store, query_text, n_results=5):
    """Searches for similar segments/documents."""
    # Returns list of Document objects
    return vector_store.similarity_search(query_text, k=n_results)
