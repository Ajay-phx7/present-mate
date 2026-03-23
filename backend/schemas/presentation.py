from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SlideSummary(BaseModel):
    slide_number: int
    raw_text: str
    summary: str
    key_points: List[str]
    likely_questions: List[str]

class PresentationSchema(BaseModel):
    id: str = Field(alias="_id", default=None)
    user_id: str
    title: str
    file_name: str
    file_type: str
    upload_date: datetime
    processing_status: str
    total_slides: int
    overall_summary: Optional[str] = None
    tags: List[str] = []
    slides: List[SlideSummary] = []
