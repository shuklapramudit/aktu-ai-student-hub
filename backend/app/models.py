from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True) # Yahi column hona chahiye
    phone_number = Column(String(15), unique=True, nullable=False) 
    username = Column(String(50), unique=True, nullable=False)    
    college_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    
class ChatGroup(Base):
    __tablename__ = "chat_groups"

    group_id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(100), nullable=False)
    subject_code = Column(String(20), nullable=True)

class GroupMessage(Base):
    __tablename__ = "group_messages"

    message_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chat_groups.group_id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.user_id"))
    message_text = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    # FIX: "user" reserved keyword hai, isliye column name quote kar diya hai
    user = Column("user", String, index=True) 
    rating = Column(Integer)
    comment = Column(Text)
    image = Column(Text, nullable=True)

class Newsletter(Base):
    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)