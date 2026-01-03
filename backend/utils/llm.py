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
        openai_api_key="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",
        model="google/gemini-2.0-flash-exp:free", # Free high-quality model
        temperature=0.7,
        max_tokens=1024
    )
    
    return llm
