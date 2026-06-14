import asyncio
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
import app.models as models
from app.services.scraper import scrape_aktu_notices
from app.services.gemini_ai import analyze_notice_with_ai, generate_exam_vault_blueprint, ai_client

# PostgreSQL ke liye Tables Initialize karna
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── PYDANTIC SCHEMAS ───

class VoiceQueryPayload(BaseModel):
    query: str

class ReviewCreateSchema(BaseModel):
    user: str
    rating: int
    comment: str
    image: Optional[str] = None

class ReviewResponseSchema(BaseModel):
    id: int
    user: str # Model mein yeh "user" column se mapped hai
    rating: int
    comment: str
    image: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True) # Pydantic v2 support

class NewsletterCreateSchema(BaseModel):
    email: str

# ─── 💾 DATABASE ROUTING ───

@app.get("/api/reviews", response_model=List[ReviewResponseSchema])
def get_all_stored_reviews(db: Session = Depends(get_db)):
    return db.query(models.Review).order_by(models.Review.id.desc()).all()

@app.post("/api/reviews", response_model=ReviewResponseSchema)
def create_new_student_review(payload: ReviewCreateSchema, db: Session = Depends(get_db)):
    # Yahan 'user' key explicit hai, ye PostgreSQL ke reserved "user" column mein jayega
    db_review = models.Review(
        user=payload.user,
        rating=payload.rating,
        comment=payload.comment,
        image=payload.image
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@app.post("/api/newsletter")
def subscribe_to_newsletter(payload: NewsletterCreateSchema, db: Session = Depends(get_db)):
    existing_sub = db.query(models.Newsletter).filter(models.Newsletter.email == payload.email).first()
    if existing_sub:
        return {"message": "Email address already registered."}
    
    db_sub = models.Newsletter(email=payload.email)
    db.add(db_sub)
    db.commit()
    return {"message": "Subscription synchronized!"}

# ... (Voice chat aur AI notices ke routes wahi rehne do, unme change ki zaroorat nahi hai)