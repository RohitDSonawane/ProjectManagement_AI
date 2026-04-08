from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from services.llm_service import llm_service
from models.card import CaseStudyCard
import uvicorn

app = FastAPI(title="PM Learning Agent API")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    query: str
    user_id: Optional[str] = "anonymous"

class GenerateResponse(BaseModel):
    card: CaseStudyCard
    status: str = "success"

@app.get("/")
async def root():
    return {"message": "PM Learning Agent API is online"}

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_card(request: GenerateRequest):
    """
    Core endpoint to generate a case study card.
    """
    try:
        card = llm_service.process_query(request.query)
        return GenerateResponse(card=card)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
