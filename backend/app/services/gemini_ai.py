import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def ai_summarize_notice(raw_title: str):
    prompt = f"""
    Analyze this AKTU University circular text: "{raw_title}"
    Provide a JSON response with these keys:
    1. "category": Choose from ['Exam', 'Result', 'Syllabus', 'Scholarship', 'General'].
    2. "summary": A 2-to-3 sentence explanation for students.
    3. "urgency": Either 'High', 'Medium', or 'Low'.
    Return ONLY valid JSON.
    """
    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        return {"category": "General", "summary": raw_title, "urgency": "Low"}

def generate_ai_questions(subject_name: str, unit: int, syllabus_text: str):
    prompt = f"""
    Based on this syllabus for {subject_name}: {syllabus_text}, extract core questions for Unit {unit}.
    Provide a JSON output containing:
    1. "priority_1_questions": 3 high-probability long-form questions or derivations.
    2. "viva_questions": 5 rapid-fire questions with answers.
    Return ONLY valid JSON.
    """
    response = ai_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)