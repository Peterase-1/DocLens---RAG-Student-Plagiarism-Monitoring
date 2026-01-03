import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    """
    Returns a configured ChatOpenAI instance pointing to OpenRouter.
    Uses a free model by default.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("Warning: OPENROUTER_API_KEY not found in environment variables.")
    
    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        openai_api_key=api_key,
        model="google/gemini-2.0-flash-exp:free", # Free high-quality model
        temperature=0.7,
        max_tokens=1024
    )
    
    return llm
