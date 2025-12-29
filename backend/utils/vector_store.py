import chromadb
from chromadb.utils import embedding_functions
import os

# Initialize local ChromaDB
# Persistent directory for the database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

def get_vector_store():
    # Use sentence-transformers for free local embeddings
    # This might take a moment to download the first time
    embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    client = chromadb.PersistentClient(path=DB_PATH)
    
    # Create or get the collection
    collection = client.get_or_create_collection(
        name="assignments",
        embedding_function=embedding_func
    )
    
    return collection

def add_assignment(collection, student_id, filename, text):
    """Adds a single assignment to the vector store."""
    collection.add(
        documents=[text],
        metadatas=[{"student_id": student_id, "filename": filename}],
        ids=[f"{student_id}_{filename}"]
    )

def search_similar(collection, query_text, n_results=5):
    """Searches for similar segments/documents."""
    return collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
