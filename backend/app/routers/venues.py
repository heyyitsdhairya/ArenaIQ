from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
from app.database import db_manager
from app.models.event import ArenaEvent
from app.kafka_producer import kafka_producer
from app.seed_data import SAMPLE_VENUES

router = APIRouter(prefix="/venues", tags=["Venues"])

@router.get("")
async def get_venues(
    sport: Optional[str] = Query(None, description="Filter by sport: Cricket, Football, Badminton, Pickleball"),
    city: Optional[str] = Query(None, description="Filter by city: Gandhinagar, Ahmedabad"),
    search: Optional[str] = Query(None, description="Search by name or area"),
    min_price: Optional[float] = Query(None, description="Minimum court price"),
    max_price: Optional[float] = Query(None, description="Maximum court price"),
    sort_by: Optional[str] = Query(None, description="Sort order: rating, price_asc, price_desc, reviews"),
    verified_only: Optional[bool] = Query(None, description="Only show verified arenas")
):
    # Emit search event to Kafka
    event = ArenaEvent(
        event_type="VENUE_SEARCH",
        sport=sport,
        payload={"city": city, "search_term": search, "min_price": min_price, "max_price": max_price}
    )
    kafka_producer.emit_event(event)

    # Fetch from Mongo or memory
    venues = []
    if db_manager.is_connected and db_manager.db is not None:
        try:
            cursor = db_manager.db["venues"].find({}, {"_id": 0})
            venues = await cursor.to_list(length=100)
        except Exception:
            venues = list(db_manager.memory_store["venues"].values())
    else:
        venues = list(db_manager.memory_store["venues"].values())

    if not venues or len(venues) < len(SAMPLE_VENUES):
        venues = SAMPLE_VENUES

    # Filter by sport
    if sport and sport.lower() not in ["all", "all sports"]:
        venues = [v for v in venues if any(sport.lower() in s.lower() for s in v.get("sports", []))]
    
    # Filter by city
    if city and city.lower() not in ["all", "all locations"]:
        venues = [v for v in venues if v.get("city", "").lower() == city.lower()]
        
    # Filter by search query
    if search:
        s = search.lower().strip()
        venues = [
            v for v in venues 
            if s in v.get("name", "").lower() 
            or s in v.get("area", "").lower() 
            or s in v.get("tagline", "").lower()
            or any(s in sp.lower() for sp in v.get("sports", []))
        ]

    # Helper function for starting price
    def get_starting_price(venue):
        courts = venue.get("courts", [])
        return min((c.get("default_price", 9999) for c in courts), default=600)

    # Filter by min/max price
    if min_price is not None:
        venues = [v for v in venues if get_starting_price(v) >= min_price]
    if max_price is not None:
        venues = [v for v in venues if get_starting_price(v) <= max_price]

    # Filter by verified
    if verified_only:
        venues = [v for v in venues if v.get("verified")]

    # Sort order
    if sort_by == "price_asc":
        venues.sort(key=get_starting_price)
    elif sort_by == "price_desc":
        venues.sort(key=get_starting_price, reverse=True)
    elif sort_by == "reviews":
        venues.sort(key=lambda x: x.get("total_reviews", 0), reverse=True)
    else:  # default or "rating"
        venues.sort(key=lambda x: x.get("rating", 0), reverse=True)

    return {"count": len(venues), "venues": venues}

@router.get("/{venue_id}")
async def get_venue_details(venue_id: str):
    venue = db_manager.memory_store["venues"].get(venue_id)
    if not venue:
        for v in SAMPLE_VENUES:
            if v["id"] == venue_id:
                venue = v
                break
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

def format_time_12h(time_str: str) -> str:
    try:
        parts = time_str.split(":")
        h = int(parts[0])
        m = parts[1] if len(parts) > 1 else "00"
        ampm = "PM" if 12 <= h < 24 else "AM"
        h = h % 12
        if h == 0:
            h = 12
        return f"{h:02d}:{m} {ampm}"
    except Exception:
        return time_str

def format_slot_range(st: str, et: str) -> str:
    return f"{format_time_12h(st)} - {format_time_12h(et)}"

@router.get("/{venue_id}/slots")
async def get_venue_slots(venue_id: str, date: Optional[str] = None):
    today_str = datetime.now().strftime("%Y-%m-%d")
    if not date:
        date = today_str
        
    venue_slots = []
    if db_manager.is_connected and db_manager.db is not None:
        try:
            cursor = db_manager.db["slots"].find({"venue_id": venue_id, "date": date}, {"_id": 0})
            venue_slots = await cursor.to_list(length=200)
        except Exception:
            venue_slots = []
            
    if not venue_slots:
        all_slots = list(db_manager.memory_store["slots"].values())
        venue_slots = [
            s for s in all_slots 
            if s["venue_id"] == venue_id and s["date"] == date
        ]
    
    # Sort chronologically by start_time
    venue_slots.sort(key=lambda x: x["start_time"])
    
    # Current server time for time synchronization
    now_time_str = datetime.now().strftime("%H:%M")
    
    for s in venue_slots:
        st = s.get("start_time", "00:00")
        et = s.get("end_time", "00:00")
        s["time_12h"] = format_slot_range(st, et)
        s["start_time_12h"] = format_time_12h(st)
        s["end_time_12h"] = format_time_12h(et)
        
        # Check if filling fast (prime surge 17:00-22:00 or marked peak)
        s_hour = int(st.split(":")[0]) if ":" in st else 0
        s["is_filling_fast"] = bool(s.get("is_peak") or (17 <= s_hour <= 21))
        
        # Check if slot start time has already passed for today
        if date == today_str:
            s["is_past"] = st <= now_time_str
        else:
            s["is_past"] = False
            
    # Off-peak bargain summary
    off_peak_count = sum(1 for s in venue_slots if not s.get("is_peak") and s.get("status") == "available" and not s.get("is_past"))
    peak_count = sum(1 for s in venue_slots if s.get("is_peak") and s.get("status") == "available" and not s.get("is_past"))
    booked_count = sum(1 for s in venue_slots if s.get("status") == "booked")
    available_count = sum(1 for s in venue_slots if s.get("status") == "available" and not s.get("is_past"))
    
    return {
        "venue_id": venue_id,
        "date": date,
        "current_time_12h": format_time_12h(now_time_str),
        "total_slots": len(venue_slots),
        "available_slots_count": available_count,
        "booked_slots_count": booked_count,
        "available_off_peak_bargains": off_peak_count,
        "available_peak_slots": peak_count,
        "slots": venue_slots
    }

# =========================================================================
# VENUE PARTNER LISTING & MANAGEMENT ENDPOINTS
# =========================================================================

class CreateCourtRequest(BaseModel):
    name: str
    sport: str
    surface: Optional[str] = "FIFA Grade AstroTurf"
    default_price: float = 1000.0

class CreateVenueRequest(BaseModel):
    name: str
    tagline: Optional[str] = "Premium Floodlit Sports Arena"
    sports: List[str]
    city: str
    area: str
    address: str
    amenities: Optional[List[str]] = ["Floodlights", "Free Parking", "Locker Room", "Cafeteria"]
    image_url: Optional[str] = "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60"
    courts: List[CreateCourtRequest]
    owner_id: Optional[str] = "partner_bodakdev"

@router.post("")
async def create_new_venue(req: CreateVenueRequest):
    venue_id = f"vn-{uuid.uuid4().hex[:6]}"
    
    # Process courts
    courts_data = []
    for idx, c in enumerate(req.courts):
        c_id = f"c-{venue_id}-{idx+1}"
        courts_data.append({
            "court_id": c_id,
            "name": c.name.strip(),
            "sport": c.sport.strip(),
            "surface": c.surface.strip() if c.surface else "FIFA Grade AstroTurf",
            "default_price": float(c.default_price)
        })

    if not courts_data:
        # Default single court
        courts_data.append({
            "court_id": f"c-{venue_id}-1",
            "name": f"{req.name} Main Arena",
            "sport": req.sports[0] if req.sports else "Cricket",
            "surface": "FIFA Grade 50mm AstroTurf",
            "default_price": 1000.0
        })

    new_venue = {
        "id": venue_id,
        "name": req.name.strip(),
        "tagline": req.tagline.strip() if req.tagline else f"Premier Sports Arena in {req.area}",
        "sports": req.sports if req.sports else ["Cricket"],
        "city": req.city.strip(),
        "area": req.area.strip(),
        "address": req.address.strip(),
        "rating": 5.0,
        "total_reviews": 1,
        "verified": True,
        "image_url": req.image_url or "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60",
        "amenities": req.amenities or ["Floodlights", "Free Parking", "Locker Room"],
        "courts": courts_data,
        "owner_id": req.owner_id or "partner_bodakdev",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    # 1. Save in memory store
    db_manager.memory_store["venues"][venue_id] = new_venue

    # 2. Add venue to partner's owned list
    owner_id = req.owner_id
    if owner_id and owner_id in db_manager.memory_store.get("partners", {}):
        partner = db_manager.memory_store["partners"][owner_id]
        if "owned_venues" not in partner:
            partner["owned_venues"] = []
        if venue_id not in partner["owned_venues"]:
            partner["owned_venues"].append(venue_id)

    # 3. Generate 3 days of court slots with off-peak dynamic pricing schedule
    time_schedule = [
        ("06:00", "07:00", False, 0.65, 35),
        ("07:00", "08:00", False, 0.70, 30),
        ("08:00", "09:00", False, 0.70, 30),
        ("10:00", "11:00", False, 0.60, 40),
        ("12:00", "13:00", False, 0.55, 45),
        ("15:00", "16:00", False, 0.60, 40),
        ("17:00", "18:00", True, 1.0, 0),
        ("18:00", "19:00", True, 1.15, 0),
        ("19:00", "20:00", True, 1.25, 0),
        ("20:00", "21:00", True, 1.25, 0),
        ("21:00", "22:00", True, 1.10, 0),
        ("22:00", "23:00", False, 0.75, 25),
        ("23:00", "00:00", False, 0.65, 35)
    ]
    
    today = datetime.now().date()
    new_slots_count = 0
    for court in courts_data:
        for d in range(3):
            slot_date = (today + timedelta(days=d)).strftime("%Y-%m-%d")
            for st, et, is_peak, mult, disc in time_schedule:
                slot_id = f"sl-{court['court_id']}-{slot_date}-{st.replace(':', '')}"
                base_price = court["default_price"]
                dyn_price = round(base_price * mult, -1)
                
                slot_obj = {
                    "slot_id": slot_id,
                    "venue_id": venue_id,
                    "court_id": court["court_id"],
                    "court_name": court["name"],
                    "sport": court["sport"],
                    "date": slot_date,
                    "start_time": st,
                    "end_time": et,
                    "base_price": base_price,
                    "dynamic_price": dyn_price,
                    "discount_pct": disc if not is_peak else 0,
                    "is_peak": is_peak,
                    "status": "available",
                    "booked_by": None,
                    "booked_at": None
                }
                db_manager.memory_store["slots"][slot_id] = slot_obj
                new_slots_count += 1

    # 4. Sync to MongoDB if connected
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["venues"].insert_one(new_venue)
            if owner_id:
                await db_manager.db["partners"].update_one(
                    {"id": owner_id},
                    {"$push": {"owned_venues": venue_id}}
                )
        except Exception:
            pass

    # 5. Emit Kafka speed layer event
    kafka_producer.emit_event(ArenaEvent(
        event_type="VENUE_LISTED",
        venue_id=venue_id,
        sport=req.sports[0] if req.sports else "Cricket",
        user_id=owner_id or "partner",
        payload={
            "venue_name": req.name,
            "city": req.city,
            "area": req.area,
            "courts_count": len(courts_data),
            "slots_generated": new_slots_count,
            "starting_price": min(c["default_price"] for c in courts_data)
        }
    ))

    return {
        "status": "created",
        "message": f"Venue '{req.name}' successfully listed! {new_slots_count} court slots generated.",
        "venue": new_venue
    }

@router.get("/partner/{partner_id}")
async def get_partner_venues(partner_id: str):
    partner = db_manager.memory_store.get("partners", {}).get(partner_id)
    owned_ids = set()
    if partner:
        owned_ids = set(partner.get("owned_venues", []))

    all_venues = list(db_manager.memory_store.get("venues", {}).values())
    if not all_venues:
        all_venues = SAMPLE_VENUES

    # Filter venues owned by partner or with owner_id matching
    partner_venues = [
        v for v in all_venues 
        if v.get("id") in owned_ids or v.get("owner_id") == partner_id
    ]

    # If partner has no venues yet, return their linked ones or first 2 for demonstration
    if not partner_venues and (partner_id in ["partner_bodakdev", "partner_infocity"]):
        if partner_id == "partner_bodakdev":
            partner_venues = [v for v in all_venues if v.get("id") in ["vn-001", "vn-003"]]
        else:
            partner_venues = [v for v in all_venues if v.get("id") in ["vn-002", "vn-004"]]

    return {
        "partner_id": partner_id,
        "count": len(partner_venues),
        "venues": partner_venues
    }

@router.get("/partner/{partner_id}/bookings")
async def get_partner_venue_bookings(partner_id: str):
    # Find all venues owned by partner
    partner = db_manager.memory_store.get("partners", {}).get(partner_id)
    owned_ids = set(partner.get("owned_venues", [])) if partner else set()
    
    all_venues = list(db_manager.memory_store.get("venues", {}).values())
    for v in all_venues:
        if v.get("owner_id") == partner_id:
            owned_ids.add(v.get("id"))

    if not owned_ids and partner_id == "partner_bodakdev":
        owned_ids = {"vn-001", "vn-003"}
    elif not owned_ids and partner_id == "partner_infocity":
        owned_ids = {"vn-002", "vn-004"}

    all_bookings = list(db_manager.memory_store.get("bookings", {}).values())
    partner_bookings = [
        b for b in all_bookings 
        if b.get("venue_id") in owned_ids
    ]

    total_revenue = sum(float(b.get("amount_paid", 0)) for b in partner_bookings if b.get("status") == "confirmed")

    return {
        "partner_id": partner_id,
        "total_bookings": len(partner_bookings),
        "total_revenue": total_revenue,
        "bookings": partner_bookings
    }

class UpdateVenueRequest(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    sports: Optional[List[str]] = None
    city: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    amenities: Optional[List[str]] = None
    image_url: Optional[str] = None

class UpdateSlotRequest(BaseModel):
    status: Optional[str] = None  # "available", "booked", "maintenance"
    booked_by: Optional[str] = None
    dynamic_price: Optional[float] = None
    is_peak: Optional[bool] = None
    discount_pct: Optional[int] = None

@router.put("/{venue_id}")
async def update_venue(venue_id: str, req: UpdateVenueRequest):
    venue = db_manager.memory_store.get("venues", {}).get(venue_id)
    if not venue:
        for v in SAMPLE_VENUES:
            if v["id"] == venue_id:
                venue = dict(v)
                db_manager.memory_store["venues"][venue_id] = venue
                break

    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    if req.name is not None: venue["name"] = req.name.strip()
    if req.tagline is not None: venue["tagline"] = req.tagline.strip()
    if req.sports is not None: venue["sports"] = req.sports
    if req.city is not None: venue["city"] = req.city.strip()
    if req.area is not None: venue["area"] = req.area.strip()
    if req.address is not None: venue["address"] = req.address.strip()
    if req.amenities is not None: venue["amenities"] = req.amenities
    if req.image_url is not None: venue["image_url"] = req.image_url.strip()

    # Update MongoDB if connected
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["venues"].update_one(
                {"id": venue_id},
                {"$set": venue},
                upsert=True
            )
        except Exception:
            pass

    return {
        "status": "updated",
        "message": f"Venue '{venue.get('name')}' updated successfully!",
        "venue": venue
    }

@router.put("/{venue_id}/slots/{slot_id}")
async def update_venue_slot(venue_id: str, slot_id: str, req: UpdateSlotRequest):
    slot = db_manager.memory_store.get("slots", {}).get(slot_id)
    if not slot:
        # Search all slots
        for s in db_manager.memory_store.get("slots", {}).values():
            if s.get("slot_id") == slot_id and s.get("venue_id") == venue_id:
                slot = s
                break

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if req.status is not None:
        slot["status"] = req.status
        if req.status == "available":
            slot["booked_by"] = None
            slot["booked_at"] = None
        elif req.status == "booked":
            slot["booked_by"] = req.booked_by or "Walk-in Cash Player (Manual Lock)"
            slot["booked_at"] = datetime.utcnow().isoformat() + "Z"
        elif req.status == "maintenance":
            slot["booked_by"] = "Turf Maintenance / Rolling"
            slot["booked_at"] = datetime.utcnow().isoformat() + "Z"

    if req.dynamic_price is not None:
        slot["dynamic_price"] = float(req.dynamic_price)
    if req.is_peak is not None:
        slot["is_peak"] = bool(req.is_peak)
    if req.discount_pct is not None:
        slot["discount_pct"] = int(req.discount_pct)

    # Sync to MongoDB if connected
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["slots"].update_one(
                {"slot_id": slot_id},
                {"$set": slot},
                upsert=True
            )
        except Exception:
            pass

    return {
        "status": "updated",
        "message": f"Slot {slot_id} updated successfully!",
        "slot": slot
    }

@router.post("/{venue_id}/courts")
async def add_court_to_venue(venue_id: str, req: CreateCourtRequest):
    venue = db_manager.memory_store.get("venues", {}).get(venue_id)
    if not venue:
        for v in SAMPLE_VENUES:
            if v["id"] == venue_id:
                venue = dict(v)
                db_manager.memory_store["venues"][venue_id] = venue
                break
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    court_id = f"c-{venue_id}-{len(venue.get('courts', [])) + 1}"
    new_court = {
        "court_id": court_id,
        "name": req.name.strip(),
        "sport": req.sport.strip(),
        "surface": req.surface.strip() if req.surface else "FIFA Grade AstroTurf",
        "default_price": float(req.default_price)
    }

    if "courts" not in venue:
        venue["courts"] = []
    venue["courts"].append(new_court)

    # Generate 3 days of slots for this new court
    time_schedule = [
        ("06:00", "07:00", False, 0.65, 35),
        ("07:00", "08:00", False, 0.70, 30),
        ("08:00", "09:00", False, 0.70, 30),
        ("10:00", "11:00", False, 0.60, 40),
        ("12:00", "13:00", False, 0.55, 45),
        ("15:00", "16:00", False, 0.60, 40),
        ("17:00", "18:00", True, 1.0, 0),
        ("18:00", "19:00", True, 1.15, 0),
        ("19:00", "20:00", True, 1.25, 0),
        ("20:00", "21:00", True, 1.25, 0),
        ("21:00", "22:00", True, 1.10, 0),
        ("22:00", "23:00", False, 0.75, 25),
        ("23:00", "00:00", False, 0.65, 35)
    ]
    
    today = datetime.now().date()
    for d in range(3):
        slot_date = (today + timedelta(days=d)).strftime("%Y-%m-%d")
        for st, et, is_peak, mult, disc in time_schedule:
            s_id = f"sl-{court_id}-{slot_date}-{st.replace(':', '')}"
            base_p = new_court["default_price"]
            dyn_p = round(base_p * mult, -1)
            slot_obj = {
                "slot_id": s_id,
                "venue_id": venue_id,
                "court_id": court_id,
                "court_name": new_court["name"],
                "sport": new_court["sport"],
                "date": slot_date,
                "start_time": st,
                "end_time": et,
                "base_price": base_p,
                "dynamic_price": dyn_p,
                "discount_pct": disc if not is_peak else 0,
                "is_peak": is_peak,
                "status": "available",
                "booked_by": None,
                "booked_at": None
            }
            db_manager.memory_store["slots"][s_id] = slot_obj

    return {
        "status": "added",
        "message": f"Court '{new_court['name']}' added to {venue['name']}!",
        "court": new_court,
        "venue": venue
    }



