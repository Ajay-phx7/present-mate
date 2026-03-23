from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from db.database import get_db
from datetime import datetime
import shutil
import os
import asyncio
from bson.objectid import ObjectId

from services.pdf_parser import extract_text_from_pdf
from services.ppt_parser import extract_text_from_pptx
from services.ai_service import generate_slide_summary

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_presentation(file_path: str, presentation_id: str, content_type: str):
    db = await get_db()
    
    print(f"Starting processing for {presentation_id}")
    await db.presentations.update_one(
        {"_id": ObjectId(presentation_id)},
        {"$set": {"processing_status": "processing"}}
    )
    
    raw_slides = []
    if content_type == "application/pdf":
        raw_slides = extract_text_from_pdf(file_path)
    else:
        raw_slides = extract_text_from_pptx(file_path)
        
    total_slides = len(raw_slides)
    await db.presentations.update_one(
        {"_id": ObjectId(presentation_id)},
        {"$set": {"total_slides": total_slides}}
    )
    
    processed_slides = []
    for i, text in enumerate(raw_slides):
        slide_num = i + 1
        summary = await generate_slide_summary(slide_num, text)
        processed_slides.append({
            "slide_number": summary.slide_number,
            "raw_text": summary.raw_text,
            "summary": summary.summary,
            "key_points": summary.key_points,
            "likely_questions": summary.likely_questions
        })
        
        # Incremental save
        await db.presentations.update_one(
            {"_id": ObjectId(presentation_id)},
            {"$set": {"slides": processed_slides}}
        )
        
    await db.presentations.update_one(
        {"_id": ObjectId(presentation_id)},
        {"$set": {"processing_status": "ready"}}
    )
    print(f"Finished processing {presentation_id}")

@router.post("/upload")
async def upload_presentation(user_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...), db = Depends(get_db)):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]:
         raise HTTPException(status_code=400, detail="Only PDF and PPTX files are supported")
    
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    presentation_doc = {
        "user_id": user_id,
        "title": file.filename,
        "file_name": file.filename,
        "file_type": file.content_type,
        "upload_date": datetime.utcnow(),
        "processing_status": "uploaded",
        "total_slides": 0,
        "slides": []
    }
    
    result = await db.presentations.insert_one(presentation_doc)
    presentation_id_str = str(result.inserted_id)
    
    # Trigger processing asynchronously
    background_tasks.add_task(process_presentation, file_path, presentation_id_str, file.content_type)
    
    return {"message": "File uploaded", "presentation_id": presentation_id_str}

@router.get("/")
async def list_presentations(user_id: str, db = Depends(get_db)):
    cursor = db.presentations.find({"user_id": user_id})
    presentations = await cursor.to_list(length=100)
    for p in presentations:
        p["_id"] = str(p["_id"])
    return presentations

@router.get("/{id}")
async def get_presentation(id: str, db = Depends(get_db)):
    from bson.objectid import ObjectId
    presentation = await db.presentations.find_one({"_id": ObjectId(id)})
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    presentation["_id"] = str(presentation["_id"])
    return presentation
