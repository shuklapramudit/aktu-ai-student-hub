from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .services.gemini_ai import generate_ai_questions
from pydantic import BaseModel

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AKTU AI Student Hub Backend", description="Designed & Developed by Pramudit Shukla")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    subject_name: str
    unit_number: int
    syllabus_context: str

@app.get("/")
def home():
    return {"status": "Online", "developer": "Pramudit Shukla"}

@app.post("/api/ai/questions")
def get_unit_questions(payload: QuestionRequest):
    try:
        data = generate_ai_questions(payload.subject_name, payload.unit_number, payload.syllabus_context)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))