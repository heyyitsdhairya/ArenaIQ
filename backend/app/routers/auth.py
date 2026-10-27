from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.database import db_manager

import uuid
from datetime import datetime
from app.kafka_producer import kafka_producer
from app.models.event import ArenaEvent

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

class LoginRequest(BaseModel):
    email_or_phone: str
    password: Optional[str] = "password123"

class PartnerRegisterRequest(BaseModel):
    partner_name: str
    business_name: str
    email: str
    phone: str
    city: str
    area: str
    gst_number: Optional[str] = ""
    password: Optional[str] = "partner123"
    sports_hosted: Optional[List[str]] = ["Cricket", "Football"]
    operating_hours: Optional[str] = "06:00 AM - 01:00 AM"

class PartnerLoginRequest(BaseModel):
    email_or_phone: str
    password: Optional[str] = "partner123"

class ProfileUpdateRequest(BaseModel):
    name: str
    phone: str
    city: str
    area: str
    bio: Optional[str] = ""
    skill_tier: Optional[str] = "Intermediate"
    favorite_sports: List[str] = []
    playing_positions: Dict[str, str] = {}

DEFAULT_PARTNERS = {
    "partner_bodakdev": {
        "id": "partner_bodakdev",
        "partner_name": "Rajesh Patel",
        "business_name": "Bodakdev Sports Hub & Turf Arena",
        "email": "rajesh.patel@bodakdevturf.in",
        "phone": "+91 98250 11223",
        "city": "Ahmedabad",
        "area": "Bodakdev / Sindhu Bhavan",
        "gst_number": "24AAACG9988F1Z2",
        "verification_status": "Verified Arena Partner",
        "joined_date": "2025-11-15",
        "owned_venues": ["vn-001", "vn-003"]
    },
    "partner_infocity": {
        "id": "partner_infocity",
        "partner_name": "Hardik Shah",
        "business_name": "Infocity Turf Hub & Sports Club",
        "email": "hardik.shah@infocityturf.in",
        "phone": "+91 99099 44332",
        "city": "Gandhinagar",
        "area": "Infocity / Kudasan",
        "gst_number": "24BBCDG7711F1Z9",
        "verification_status": "Verified Arena Partner",
        "joined_date": "2026-01-10",
        "owned_venues": ["vn-002", "vn-004"]
    }
}

if "partners" not in db_manager.memory_store:
    db_manager.memory_store["partners"] = {}

for pid, pdata in DEFAULT_PARTNERS.items():
    db_manager.memory_store["partners"][pid] = pdata

DEFAULT_USERS = {
    "player_dhairya": {
        "id": "player_dhairya",
        "name": "Dhairya Shah",
        "email": "dhairya.shah@arenaiq.in",
        "phone": "+91 98765 43210",
        "city": "Ahmedabad",
        "area": "Bodakdev / Sindhu Bhavan",
        "skill_tier": "Tournament / Advanced Tier",
        "bio": "Weekend Box Cricket captain & casual futsal midfielder. Always on time and looking for competitive matches under floodlights.",
        "favorite_sports": ["Cricket", "Football", "Pickleball"],
        "playing_positions": {
            "Cricket": "Top-Order Batter / All-Rounder",
            "Football": "Central Midfielder",
            "Pickleball": "Right-Side Doubles"
        },
        "fairplay_score": 105,
        "badges": ["Verified Team Captain", "Weekend Regular", "Punctual Player", "Zero Late Drops"],
        "total_bookings": 8,
        "cancelled_bookings": 0,
        "turnout_rate": "100%"
    },
    "player_aman": {
        "id": "player_aman",
        "name": "Aman Varma",
        "email": "aman.varma@arenaiq.in",
        "phone": "+91 99090 56789",
        "city": "Gandhinagar",
        "area": "Kudasan / PDPU Road",
        "skill_tier": "Pro / Competitive Tier",
        "bio": "Futsal striker and weekend badminton player in Gandhinagar. Love fast-paced 5v5 games.",
        "favorite_sports": ["Football", "Badminton"],
        "playing_positions": {
            "Football": "Striker / Forward",
            "Badminton": "Singles Specialist"
        },
        "fairplay_score": 102,
        "badges": ["Consistent Striker", "Punctual Player"],
        "total_bookings": 5,
        "cancelled_bookings": 0,
        "turnout_rate": "100%"
    }
}

# Alias player_kartik to player_dhairya for backward compatibility
DEFAULT_USERS["player_kartik"] = DEFAULT_USERS["player_dhairya"]

for uid, profile in DEFAULT_USERS.items():
    db_manager.memory_store["users"][uid] = profile

@router.post("/login")
async def login(req: LoginRequest):
    user_id = "player_dhairya"
    if "aman" in req.email_or_phone.lower():
        user_id = "player_aman"
    
    user = db_manager.memory_store["users"].get(user_id, DEFAULT_USERS["player_dhairya"])
    return {
        "status": "authenticated",
        "token": f"bearer_{user_id}_token",
        "user": user
    }

@router.get("/user/{user_id}")
async def get_user_profile(user_id: str):
    if user_id == "player_kartik":
        user_id = "player_dhairya"
        
    user = db_manager.memory_store["users"].get(user_id)
    if not user:
        if user_id in DEFAULT_USERS:
            user = DEFAULT_USERS[user_id]
            db_manager.memory_store["users"][user_id] = user
        else:
            user = DEFAULT_USERS["player_dhairya"]
    return user

@router.put("/user/{user_id}")
async def update_user_profile(user_id: str, req: ProfileUpdateRequest):
    if user_id == "player_kartik":
        user_id = "player_dhairya"
        
    user = db_manager.memory_store["users"].get(user_id)
    if not user:
        user = DEFAULT_USERS.get(user_id, {"id": user_id})
        db_manager.memory_store["users"][user_id] = user

    user["name"] = req.name
    user["phone"] = req.phone
    user["city"] = req.city
    user["area"] = req.area
    user["bio"] = req.bio
    user["skill_tier"] = req.skill_tier
    user["favorite_sports"] = req.favorite_sports
    user["playing_positions"] = req.playing_positions

    # Also keep alias in sync
    db_manager.memory_store["users"]["player_kartik"] = user

    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["users"].update_one(
                {"id": user_id},
                {"$set": user},
                upsert=True
            )
        except Exception:
            pass

    return {
        "status": "updated",
        "message": "Player profile updated successfully!",
        "user": user
    }

# =========================================================================
# VENUE PARTNER DEDICATED AUTHENTICATION & MANAGEMENT ENDPOINTS
# =========================================================================

@router.post("/partner/register")
async def register_partner(req: PartnerRegisterRequest):
    # Check if partner email or phone already exists
    for p in db_manager.memory_store["partners"].values():
        if p.get("email", "").lower() == req.email.lower() or p.get("phone") == req.phone:
            return {
                "status": "authenticated",
                "message": "Partner already registered! Logged in successfully.",
                "token": f"bearer_{p['id']}_token",
                "partner": p
            }

    partner_id = f"partner_{uuid.uuid4().hex[:8]}"
    gst = req.gst_number.strip() if req.gst_number else f"24{uuid.uuid4().hex[:8].upper()}1Z4"
    
    new_partner = {
        "id": partner_id,
        "partner_name": req.partner_name.strip(),
        "business_name": req.business_name.strip(),
        "email": req.email.strip().lower(),
        "phone": req.phone.strip(),
        "city": req.city.strip(),
        "area": req.area.strip(),
        "gst_number": gst,
        "sports_hosted": req.sports_hosted or ["Cricket", "Football"],
        "operating_hours": req.operating_hours or "06:00 AM - 01:00 AM",
        "verification_status": "Verified Arena Partner",
        "is_verified": True,
        "joined_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "owned_venues": []
    }

    db_manager.memory_store["partners"][partner_id] = new_partner

    # Persist to MongoDB if active
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["partners"].update_one(
                {"id": partner_id},
                {"$set": new_partner},
                upsert=True
            )
        except Exception:
            pass

    # Emit Kafka telemetry event for new partner onboarded
    event = ArenaEvent(
        event_type="PARTNER_ONBOARDED",
        user_id=partner_id,
        payload={
            "partner_name": req.partner_name,
            "business_name": req.business_name,
            "city": req.city,
            "gst_number": gst
        }
    )
    kafka_producer.emit_event(event)

    return {
        "status": "registered",
        "message": f"Welcome {req.partner_name}! Your arena business '{req.business_name}' is verified.",
        "token": f"bearer_{partner_id}_token",
        "partner": new_partner
    }

@router.post("/partner/login")
async def login_partner(req: PartnerLoginRequest):
    query = req.email_or_phone.strip().lower()
    
    # 1. Search in memory partners
    for pid, p in db_manager.memory_store.get("partners", {}).items():
        if p.get("email", "").lower() == query or p.get("phone", "").replace(" ", "") == query.replace(" ", "") or pid == query:
            return {
                "status": "authenticated",
                "token": f"bearer_{pid}_token",
                "partner": p
            }

    # 2. Check defaults
    if "bodakdev" in query or "rajesh" in query:
        p = db_manager.memory_store["partners"]["partner_bodakdev"]
        return {"status": "authenticated", "token": f"bearer_partner_bodakdev_token", "partner": p}
        
    if "infocity" in query or "hardik" in query:
        p = db_manager.memory_store["partners"]["partner_infocity"]
        return {"status": "authenticated", "token": f"bearer_partner_infocity_token", "partner": p}

    # 3. If new partner email/phone not found, create an authentic verified partner profile on the fly
    partner_id = f"partner_{uuid.uuid4().hex[:8]}"
    guessed_name = query.split("@")[0].replace(".", " ").title() if "@" in query else "Arena Partner"
    created_partner = {
        "id": partner_id,
        "partner_name": guessed_name,
        "business_name": f"{guessed_name}'s Sports Arena",
        "email": query if "@" in query else f"{partner_id}@arenaiq.in",
        "phone": query if "@" not in query else "+91 98250 99881",
        "city": "Ahmedabad",
        "area": "Sindhu Bhavan / Bodakdev",
        "gst_number": f"24AAACG{abs(hash(partner_id)) % 10000:04d}F1Z2",
        "verification_status": "Verified Arena Partner",
        "is_verified": True,
        "joined_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "sports_hosted": ["Cricket", "Football"],
        "operating_hours": "06:00 AM - 01:00 AM",
        "owned_venues": []
    }
    db_manager.memory_store["partners"][partner_id] = created_partner

    return {
        "status": "authenticated",
        "message": "Partner profile authenticated successfully",
        "token": f"bearer_{partner_id}_token",
        "partner": created_partner
    }

@router.get("/partners")
async def list_partners():
    partners = list(db_manager.memory_store.get("partners", {}).values())
    return {"count": len(partners), "partners": partners}

@router.get("/partner/{partner_id}")
async def get_partner(partner_id: str):
    partner = db_manager.memory_store.get("partners", {}).get(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner

