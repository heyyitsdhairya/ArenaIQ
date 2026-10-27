from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class BookingRequest(BaseModel):
    user_id: str = "player_dhairya"
    user_name: str = "Dhairya Shah"
    user_phone: str = "+91 98765 43210"
    venue_id: str
    venue_name: str
    court_id: str
    court_name: str
    sport: str
    slot_id: str
    date: str
    start_time: str
    end_time: str
    amount_paid: float
    split_players_count: int = 1
    per_person_cost: float
    need_squad_subs: bool = False
    subs_needed_count: int = 0

class Booking(BookingRequest):
    booking_id: str = Field(default_factory=lambda: f"BK-{uuid.uuid4().hex[:8].upper()}")
    status: str = "confirmed"  # "confirmed", "cancelled"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    reliability_awarded: int = 10
    karma_awarded: int = 10
