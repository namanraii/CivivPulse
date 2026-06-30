import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# Import agents
from agents.issue_analyzer import analyze_issue
from agents.urgency_scorer import calculate_urgency
from agents.escalation_drafter import draft_escalation
from agents.duplicate_detector import check_duplicate
from db import db
from firebase_admin import firestore, storage

app = FastAPI(title="CivicPulse API")

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CivicPulse API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/issues/analyze")
async def api_analyze_issue(
    image: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    try:
        image_bytes = await image.read()
        analysis_result = analyze_issue(image_bytes, user_description=description or "")
        return analysis_result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ScoreRequest(BaseModel):
    title: str
    category: str
    description: str
    severity: str
    upvotes: int

@app.post("/api/issues/score")
def api_score_issue(request: ScoreRequest):
    try:
        score_result = calculate_urgency(
            title=request.title,
            category=request.category,
            description=request.description,
            severity=request.severity,
            upvotes=request.upvotes
        )
        return score_result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/issues")
async def api_create_issue(
    image: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    try:
        image_bytes = await image.read()
        
        # 1. Upload image to Firebase Storage
        try:
            bucket = storage.bucket()
            blob = bucket.blob(f"issues/{uuid.uuid4()}_{image.filename}")
            blob.upload_from_string(image_bytes, content_type=image.content_type)
            blob.make_public()
            image_url = blob.public_url
        except Exception as storage_err:
            print(f"Storage upload failed (did you enable Storage in Firebase Console?): {storage_err}")
            image_url = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400"

        # 2. Analyze Issue
        analysis = analyze_issue(image_bytes, user_description=description or "")
        
        # 3. Score Issue
        score = calculate_urgency(
            title=analysis.title,
            category=analysis.category,
            description=analysis.description,
            severity=analysis.severity,
            upvotes=1
        )
        
        # 4. Check for duplicates
        recent_issues_query = db.collection('issues').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(10).stream()
        existing_issues = [{"id": doc.id, **doc.to_dict()} for doc in recent_issues_query]
        duplicate_check = check_duplicate(analysis.title, analysis.description, existing_issues)

        # 5. Create document in Firestore
        doc_ref = db.collection('issues').document()
        issue_data = {
            "id": doc_ref.id,
            "title": analysis.title,
            "category": analysis.category,
            "description": analysis.description,
            "severity": analysis.severity,
            "tags": analysis.tags,
            "urgency_score": score.urgency_score,
            "justification": score.justification,
            "upvotes": 1,
            "status": "Reported",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "image": image_url,
            "location": "Unknown Location", # To be filled by Maps integration
            "is_duplicate": duplicate_check.is_duplicate,
            "duplicate_of_id": duplicate_check.duplicate_of_id,
            "duplicate_reasoning": duplicate_check.reasoning
        }
        
        doc_ref.set(issue_data)
        
        # Return object for frontend (convert ServerTimestamp to string so it's JSON serializable)
        frontend_data = issue_data.copy()
        frontend_data["createdAt"] = "Just now"
        return frontend_data
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/issues/{issue_id}/escalate")
def api_escalate_issue(issue_id: str):
    try:
        # 1. Fetch issue from Firestore
        doc_ref = db.collection('issues').document(issue_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Issue not found")
            
        issue = doc.to_dict()
        
        # 2. Draft the letter
        draft = draft_escalation(
            title=issue.get("title", ""),
            category=issue.get("category", ""),
            description=issue.get("description", ""),
            severity=issue.get("severity", ""),
            urgency_score=issue.get("urgency_score", 0),
            upvotes=issue.get("upvotes", 0)
        )
        
        return draft.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/issues/{issue_id}/upvote")
def api_upvote_issue(issue_id: str):
    try:
        doc_ref = db.collection('issues').document(issue_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Issue not found")
            
        issue = doc.to_dict()
        new_upvotes = issue.get("upvotes", 0) + 1
        
        # Recalculate score dynamically!
        score = calculate_urgency(
            title=issue.get("title", ""),
            category=issue.get("category", ""),
            description=issue.get("description", ""),
            severity=issue.get("severity", ""),
            upvotes=new_upvotes
        )
        
        doc_ref.update({
            "upvotes": new_upvotes,
            "urgency_score": score.urgency_score,
            "justification": score.justification
        })
        
        return {"success": True, "upvotes": new_upvotes, "urgency_score": score.urgency_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
