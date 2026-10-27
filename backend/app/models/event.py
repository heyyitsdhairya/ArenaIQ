from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class ArenaEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # VENUE_SEARCH, SLOT_SELECTED, BOOKING_CONFIRMED, BOOKING_CANCELLED, SUB_REQUEST, DEMAND_SPIKE
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    user_id: Optional[str] = "user_guest"
    venue_id: Optional[str] = None
    venue_name: Optional[str] = None
    sport: Optional[str] = None
    slot_id: Optional[str] = None
    amount: Optional[float] = 0.0
    payload: Dict[str, Any] = Field(default_factory=dict)
