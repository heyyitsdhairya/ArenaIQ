from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class SquadPlayer(BaseModel):
    user_id: str
    name: str
    phone: Optional[str] = None
    role: str = "Player"  # "Captain", "Player", "Substitute Player"
    reliability_score: int = 100
    fairplay_score: int = 100
    karma_score: Optional[int] = 100

class SquadRequestCreate(BaseModel):
    booking_id: str
    venue_id: str
    venue_name: str
    city: Optional[str] = "Ahmedabad"
    area: Optional[str] = None
    sport: str
    date: str
    time_slot: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    captain_name: str
    captain_phone: str
    subs_needed: int
    base_price: Optional[float] = None
    per_person_share: float
    skill_level: str = "All Levels Welcome"
    notes: Optional[str] = "Casual match, need fun players!"

class SquadRequest(SquadRequestCreate):
    id: str = Field(default_factory=lambda: f"SQ-{uuid.uuid4().hex[:6].upper()}")
    subs_joined: int = 0
    players: List[SquadPlayer] = Field(default_factory=list)
    status: str = "open"  # "open", "filled", "cancelled"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
