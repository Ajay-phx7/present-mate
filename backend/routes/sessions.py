from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from datetime import datetime
from bson.objectid import ObjectId
from schemas.session import SessionCreate
from pydantic import BaseModel
from services.ai_service import generate_qa_hint

router = APIRouter()

@router.post("/start")
async def start_session(session: SessionCreate, db = Depends(get_db)):
    # Verify presentation exists
    presentation = await db.presentations.find_one({"_id": ObjectId(session.presentation_id)})
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
        
    session_doc = {
        "user_id": session.user_id,
        "presentation_id": session.presentation_id,
        "started_at": datetime.utcnow(),
        "status": "active",
        "extension_connected": False,
        "current_slide": 1
    }
    
    result = await db.sessions.insert_one(session_doc)
    return {"message": "Session started", "session_id": str(result.inserted_id)}

@router.post("/{id}/end")
async def end_session(id: str, db = Depends(get_db)):
    result = await db.sessions.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "ended"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session ended"}

@router.get("/{id}")
async def get_session(id: str, db = Depends(get_db)):
    session = await db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    return session

@router.post("/{id}/slide")
async def update_current_slide(id: str, slide_number: int, db = Depends(get_db)):
    result = await db.sessions.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"current_slide": slide_number}}
    )
    return {"message": "Current slide updated", "slide_number": slide_number}

@router.get("/{id}/hints/current-slide")
async def get_current_slide_hints(id: str, db = Depends(get_db)):
    session = await db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    presentation = await db.presentations.find_one({"_id": ObjectId(session["presentation_id"])})
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
        
    current_slide_num = session.get("current_slide", 1)
    
    # Find the slide details
    slide_details = None
    for slide in presentation.get("slides", []):
        if slide["slide_number"] == current_slide_num:
            slide_details = slide
            break
            
    if not slide_details:
        return {"message": "No hints available for this slide"}
        
    return {
        "slide_number": current_slide_num,
        "total_slides": presentation.get("total_slides", 1),
        "summary": slide_details.get("summary"),
        "key_points": slide_details.get("key_points")
    }

class QuestionRequest(BaseModel):
    questionText: str

@router.post("/{id}/question")
async def process_live_question(id: str, request: QuestionRequest, db = Depends(get_db)):
    session = await db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    presentation = await db.presentations.find_one({"_id": ObjectId(session["presentation_id"])})
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
        
    current_slide_num = session.get("current_slide", 1)
    
    slide_details = None
    for slide in presentation.get("slides", []):
        if slide["slide_number"] == current_slide_num:
            slide_details = slide
            break
            
    if not slide_details:
        slide_details = {"summary": "Unknown context.", "key_points": []}
    
    # Generate hint
    hint = await generate_qa_hint(request.questionText, slide_details)
    
    # Store the latest question and response in session state
    await db.sessions.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "last_question": request.questionText,
            "last_response": hint
        }}
    )
    
    return {
        "question": request.questionText,
        "hint": hint
    }

# ─── Add-in: latest response polling ─────────────────────────────────────────

@router.get("/{id}/latest-response")
async def get_latest_response(id: str, db = Depends(get_db)):
    """
    Called by the PowerPoint Add-in (polling every 2s) to retrieve the most
    recent audience question and AI-generated answer hint captured by the
    Chrome Extension through the /question endpoint.
    """
    session = await db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    last_question = session.get("last_question")
    last_response = session.get("last_response")

    return {
        "question": last_question,
        "hint": last_response,  # dict with answer_hint + talking_points, or None
    }
