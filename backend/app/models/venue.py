from pydantic import BaseModel, Field
from typing import List, Optional

class CourtSlot(BaseModel):
    slot_id: str
    court_id: str
    court_name: str
    sport: str
    date: str              # YYYY-MM-DD
    start_time: str        # e.g. "18:00"
    end_time: str          # e.g. "19:00"
    base_price: float      # e.g. 1200
    dynamic_price: float   # e.g. 850 (discounted) or 1400 (surge)
    discount_pct: int = 0  # e.g. 30
    is_peak: bool = False
    status: str = "available"  # "available", "booked"
    booked_by: Optional[str] = None
    booked_at: Optional[str] = None

class Court(BaseModel):
    court_id: str
    name: str
    sport: str
    surface: str           # e.g. "Synthetic Turf", "Maple Wood", "Clay"
    default_price: float

class Venue(BaseModel):
    id: str
    name: str
    tagline: str
    sports: List[str]      # ["Cricket", "Football", "Badminton", "Pickleball"]
    city: str              # "Gandhinagar" or "Ahmedabad"
    area: str              # "Infocity", "Kudasan", "Bodakdev", "Sindhu Bhavan"
    address: str
    rating: float = 4.8
    total_reviews: int = 120
    courts: List[Court]
    amenities: List[str]   # ["Floodlights", "Locker Room", "Free Parking", "Rental Gear", "Cafeteria"]
    image_url: str
    verified: bool = True
