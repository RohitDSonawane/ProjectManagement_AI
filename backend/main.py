import os
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
from dotenv import load_dotenv

from services.llm_service import llm_service
from services.supabase_service import supabase_service
from models.card import CaseStudyCard
from middleware.auth import AuthMiddleware
import uvicorn

# Load Environment Variables
load_dotenv()

def validate_env():
    required_keys = [
        "OPENROUTER_API_KEY", 
        "TAVILY_API_KEY", 
        "SUPABASE_URL", 
        "SUPABASE_SERVICE_ROLE_KEY"
    ]
    missing = [key for key in required_keys if not os.getenv(key)]
    if missing:
        print(f"[CRITICAL] Missing environment variables: {', '.join(missing)}")
        # In production, we might exit here
        # sys.exit(1)

validate_env()

app = FastAPI(title="PM Learning Agent API")

# Add Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

# --- Models ---

class GenerateRequest(BaseModel):
    query: str
    user_id: Optional[str] = "anonymous"

class GenerateResponse(BaseModel):
    type: str  # "chat" or "case_study"
    content: Any  # CaseStudyCard dict or str
    status: str = "success"

# --- Routes ---

@app.get("/")
async def root():
    return {"message": "PM Learning Agent API is online"}

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_card(request: GenerateRequest):
    """
    Core endpoint to generate a case study card or conversational response.
    """
    try:
        # LLM Service now handles internal Supabase DB tracking natively
        result = llm_service.process_query(request.query, user_id=request.user_id or "anonymous")
        
        if isinstance(result, str):
            return GenerateResponse(type="chat", content=result)
        else:
            return GenerateResponse(type="case_study", content=result)
            
    except Exception as e:
        print(f"[ERROR] Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(request: Request):
    """
    Retrieves history for the authenticated user.
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required for history")
    
    try:
        history = supabase_service.get_user_history(user.id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
