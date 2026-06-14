from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# .env file load karo
load_dotenv()

# Yahan sirf key ka naam hona chahiye, URL nahi!
DATABASE_URL = os.getenv("DATABASE_URL")

# PostgreSQL ke liye engine setup
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True, 
    pool_size=10, 
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()