# guestsense-api/app/main.py

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from uuid import uuid4

# Import models and services
from app.models import RawFeedback, SynthesisOutput, TaskTicket, TaskStatusUpdate, AITextDraft, Insight
from app.ai_service import synthesize_feedback 

# 1. CREATE APP FIRST
app = FastAPI(title="GuestSense Synthesis Engine API")

# 2. CONFIGURE CORS (ALLOW EVERYTHING FOR DEV)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

# --- MOCK DATABASES ---
RAW_FEEDBACK_DB: Dict[str, RawFeedback] = {}
TASK_DB: List[TaskTicket] = []
DRAFT_DB: List[AITextDraft] = []
INSIGHT_DB: Dict[str, Insight] = {}

def get_db():
    return {
        "raw_feedback": RAW_FEEDBACK_DB,
        "tasks": TASK_DB,
        "drafts": DRAFT_DB,
        "insights": INSIGHT_DB,
    }

# --- ENDPOINTS ---

@app.post("/api/v1/ingest_and_synthesize", response_model=SynthesisOutput)
async def ingest_and_synthesize(feedback_batch: List[RawFeedback], db: dict = Depends(get_db)):
    # LOGGING: See what's coming in
    print(f"Received batch of {len(feedback_batch)} items")
    
    try:
        if not feedback_batch:
            raise HTTPException(status_code=400, detail="Feedback batch cannot be empty.")

        for item in feedback_batch:
            if not item.id:
                item.id = str(uuid4())
            db["raw_feedback"][item.id] = item 
        
        # This is where the 500 Error likely happens
        synthesis_result = synthesize_feedback(feedback_batch)

        for task in synthesis_result.tasks_to_create:
            task.task_id = str(uuid4())
            db["tasks"].append(task)
        
        for draft in synthesis_result.drafted_responses:
            db["drafts"].append(draft)
            
        for insight in synthesis_result.insights:
            insight.id = str(uuid4()) 
            db["insights"][insight.id] = insight
        
        return synthesis_result
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/tasks", response_model=List[TaskTicket])
def get_all_tasks(db: dict = Depends(get_db)):
    return [task for task in db["tasks"] if task.status != 'Complete']

@app.get("/api/v1/insights", response_model=List[Insight])
def get_all_insights(db: dict = Depends(get_db)):
    return list(db["insights"].values())

@app.get("/api/v1/drafts", response_model=List[AITextDraft])
def get_all_drafts(db: dict = Depends(get_db)):
    return db["drafts"]