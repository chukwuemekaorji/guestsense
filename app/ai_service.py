import os
import json
from google import genai
from google.genai import types
from app.models import SynthesisOutput, RawFeedback, AITextDraft, Insight, TaskTicket
from typing import List

# Initialize the Gemini Client
try:
    client = genai.Client() # This looks for GEMINI_API_KEY
except Exception as e:
    print(f"Warning: Gemini Client failed to initialize: {e}")
    client = None

def synthesize_feedback(feedback_batch: List[RawFeedback]) -> SynthesisOutput:
    """
    Analyzes feedback using Gemini with a safe fallback to Mock Data if the API fails.
    """
    if not feedback_batch:
        return SynthesisOutput(insights=[], tasks_to_create=[], drafted_responses=[])

    # 1. ATTEMPT REAL AI ANALYSIS
    try:
        if not client:
            raise ConnectionError("Gemini client is not initialized.")

        feedback_texts = [f"ID {item.id}: {item.text}" for item in feedback_batch]
        feedback_block = "\n---\n".join(feedback_texts)

        prompt = f"""
        Analyze the following GuestSense feedback.
        1. Identify recurring operational failures as 'insights'.
        2. Suggest 'tasks_to_create'.
        3. Draft 'drafted_responses' for negative feedback.
        Output STRICTLY as JSON.
        
        Feedback:
        {feedback_block}
        """

        # This line will probably hit the 503 Overloaded error
        response = client.models.generate_content(
            model='gemini-2.0-flash', # Fixed model name to a stable version
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SynthesisOutput,
            ),
        )

        json_data = json.loads(response.text)
        return SynthesisOutput(**json_data)

    # 2. FALLBACK TO MOCK DATA IF API IS OVERLOADED OR OFFLINE
    except Exception as e:
        print(f"⚠️ AI SERVICE UNAVAILABLE: {str(e)}. Using Fallback Mock Data.")
        
        # This ensures the frontend gets a '200 OK' and data to display
        return SynthesisOutput(
            insights=[
                Insight(text="System currently using fallback data due to AI load.", sentiment="Neutral")
            ],
            tasks_to_create=[
                TaskTicket(
                    summary="Check AI API Status",
                    details=f"The AI model reported: {str(e)}",
                    priority="Medium",
                    status="Pending",
                    source_feedback_id="system-err"
                )
            ],
            drafted_responses=[
                AITextDraft(
                    topic="System Notice",
                    draft_text="Our AI is currently busy, but we have logged your feedback manually.",
                    source_feedback_id="system-err"
                )
            ]
        )