from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SessionCreate(BaseModel):
    user_id: str
    presentation_id: str

class SessionSchema(BaseModel):
    id: str = Field(alias="_id", default=None)
    user_id: str
    presentation_id: str
    started_at: datetime
    status: str # 'active', 'ended'
    extension_connected: bool = False
    last_question: Optional[str] = None
    last_response: Optional[str] = None
    current_slide: int = 1
