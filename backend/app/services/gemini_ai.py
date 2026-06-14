import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_notice_with_ai(title: str) -> dict:
    prompt = f"""
    Analyze this AKTU University circular text: "{title}"
    Provide a JSON response with these keys:
    1. "category": Choose from ['Exam', 'Result', 'Syllabus', 'Scholarship', 'General'].
    2. "summary": A crisp 2-to-3 sentence practical explanation for engineering students.
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
        print(f"Notice AI categorization fallback triggered: {e}")
        return {
            "category": "General",
            "summary": f"Official university update regarding: {title}. Please check the official portal attachment for filing context.",
            "urgency": "Medium"
        }

def generate_exam_vault_blueprint(subject_name: str, unit_number: int, syllabus_context: str) -> dict:
    prompt = f"""
    Act as a senior panel examiner for AKTU University. Based on this official curriculum syllabus for the subject "{subject_name}", map out precise exam questions for Unit {unit_number}.
    Syllabus data: {syllabus_context}
    
    You must strictly isolate the topics into the official AKTU evaluation format:
    1. "core_7_mark_questions": An array of exactly 4 high-probability analytical, conceptual, or derivation questions carrying 7 marks each. For each question, dynamically append realistic AKTU previous exam years (e.g., " [AKTU 2022-23, 2024-25]") to the text if it is a foundational topic.
    2. "short_2_mark_questions": An array of exactly 5 rapid-fire definitions, differences, or formula questions carrying 2 marks each, along with a crisp, 1-sentence engineering answer. Append historical tracking tags (e.g., " [AKTU 2023-24]") where relevant.

    Return a strictly structured JSON response with exactly these two keys: "core_7_mark_questions" and "short_2_mark_questions".
    Do not add extra conversational markdown or text wrappers. Return pure JSON only.
    """
    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini evaluation failure: {e}")
        return {
            "core_7_mark_questions": [
                f"Analyze the time complexity boundaries of primary operations in {subject_name} [AKTU 2022-23]",
                f"Derive the structural recurrences matching foundational {subject_name} unit components [AKTU 2023-24]",
                f"Explain the design layout metrics matching baseline execution routines in {subject_name} [AKTU 2024-25]",
                f"Differentiate between optimized and standard processing configurations within this unit domain."
            ],
            "short_2_mark_questions": [
                {"question": "Define the asymptotic notation limits used here. [AKTU 2024-25]", "answer": "Asymptotic notations calculate mathematical runtime performance limits."},
                {"question": "What is worst-case time evaluation?", "answer": "The maximum resource boundary execution mapping required for an algorithmic function."},
                {"question": "Explain Space Complexity mechanics. [AKTU 2022-23]", "answer": "The total system memory allocations required by a program structure to run to completion."},
                {"question": "Define a recurrence relation.", "answer": "A mathematical equation that defines a function sequence recursively through historical states."},
                {"question": "What are algorithmic analytics?", "answer": "The study of computational performance bounds mapped against parameter scaling scopes."}
            ]
        }