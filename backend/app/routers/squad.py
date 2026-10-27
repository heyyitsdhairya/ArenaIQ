from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from app.database import db_manager
from app.models.squad import SquadRequest, SquadRequestCreate, SquadPlayer
from app.models.event import ArenaEvent
from app.kafka_producer import kafka_producer

router = APIRouter(prefix="/squad-radar", tags=["Fill-My-Squad Radar"])

def _calculate_squad_urgency(squad: dict, now: datetime):
    """
    Dynamically computes proximity surge pricing based on the time remaining until match starts.
    - < 45 mins: Emergency Sub Surge (2.0x base price, e.g. ₹120 -> ₹240)
    - 45 - 90 mins: High Urgency (1.6x base price, e.g. ₹120 -> ₹190)
    - 90 - 240 mins: Moderate Urgency (1.25x base price, e.g. ₹120 -> ₹150)
    - > 240 mins (or tomorrow): Early Bird Normal (1.0x base price, e.g. ₹120 -> ₹120)
    """
    date_str = squad.get("date", "")
    time_str = squad.get("start_time")
    
    if not time_str and squad.get("time_slot"):
        parts = squad["time_slot"].split("-")
        time_str = parts[0].strip()

    base_price = float(squad.get("base_price") or squad.get("per_person_share") or 120.0)

    try:
        # Parse match start datetime
        if ":" in str(time_str):
            h, m = [int(x) for x in time_str.split(":")[:2]]
        else:
            h, m = 19, 0
            
        y, mo, d = [int(x) for x in date_str.split("-")[:3]]
        match_start_dt = datetime(y, mo, d, h, m)
        match_end_dt = match_start_dt + timedelta(hours=1)

        diff_seconds = (match_start_dt - now).total_seconds()
        minutes_until = int(diff_seconds // 60)
        end_diff_seconds = (match_end_dt - now).total_seconds()

        if end_diff_seconds < 0:
            # Match has already ended
            return {
                "dynamic_price": base_price,
                "surge_multiplier": 1.0,
                "urgency_level": "expired",
                "urgency_label": "⏰ Match Completed",
                "minutes_until": minutes_until,
                "is_expired": True,
                "is_live_now": False
            }
        elif diff_seconds <= 0:
            # Match currently in progress
            return {
                "dynamic_price": round(base_price * 2.0, -1),
                "surge_multiplier": 2.0,
                "urgency_level": "live_now",
                "urgency_label": "🔴 Match In Progress (Emergency Join)",
                "minutes_until": minutes_until,
                "is_expired": False,
                "is_live_now": True
            }
        elif minutes_until <= 45:
            # Under 45 minutes: Emergency Sub Surge!
            return {
                "dynamic_price": round(base_price * 2.0, -1),
                "surge_multiplier": 2.0,
                "urgency_level": "emergency",
                "urgency_label": f"🚨 Emergency Sub ({minutes_until}m left)",
                "minutes_until": minutes_until,
                "is_expired": False,
                "is_live_now": False
            }
        elif minutes_until <= 90:
            # 45 - 90 minutes: High Demand
            return {
                "dynamic_price": round(base_price * 1.6, -1),
                "surge_multiplier": 1.6,
                "urgency_level": "high",
                "urgency_label": f"🔥 Match Imminent (~{minutes_until // 60}h {minutes_until % 60}m)",
                "minutes_until": minutes_until,
                "is_expired": False,
                "is_live_now": False
            }
        elif minutes_until <= 240:
            # 1.5 - 4 hours: Moderate Urgency
            return {
                "dynamic_price": round(base_price * 1.25, -1),
                "surge_multiplier": 1.25,
                "urgency_level": "moderate",
                "urgency_label": f"⚡ Moderate Urgency ({minutes_until // 60}h away)",
                "minutes_until": minutes_until,
                "is_expired": False,
                "is_live_now": False
            }
        else:
            # > 4 hours away or future date: Early Bird
            hours = minutes_until // 60
            days = hours // 24
            time_txt = f"{days}d away" if days > 0 else f"{hours}h away"
            return {
                "dynamic_price": base_price,
                "surge_multiplier": 1.0,
                "urgency_level": "early_bird",
                "urgency_label": f"🟢 Early Bird Rate ({time_txt})",
                "minutes_until": minutes_until,
                "is_expired": False,
                "is_live_now": False
            }
    except Exception:
        return {
            "dynamic_price": base_price,
            "surge_multiplier": 1.0,
            "urgency_level": "early_bird",
            "urgency_label": "🟢 Standard Rate",
            "minutes_until": 999,
            "is_expired": False,
            "is_live_now": False
        }

@router.get("")
async def get_squad_requests(
    sport: Optional[str] = Query(None, description="Filter by sport: Cricket, Football, Badminton, Pickleball"),
    city: Optional[str] = Query(None, description="Filter by city: Ahmedabad, Gandhinagar"),
    include_expired: bool = Query(False, description="Whether to include matches that have already passed")
):
    now = datetime.now()
    raw_squads = list(db_manager.memory_store["squad_requests"].values())
    
    enriched_squads = []
    for sq in raw_squads:
        # City filter
        if city and city.lower() != "all":
            sq_city = (sq.get("city") or "").lower()
            if city.lower() not in sq_city:
                continue

        # Sport filter
        if sport and sport.lower() != "all":
            if sq.get("sport", "").lower() != sport.lower():
                continue

        # Calculate dynamic proximity surge
        urgency_meta = _calculate_squad_urgency(sq, now)
        
        # Filter out past/ended matches unless requested
        if urgency_meta["is_expired"] and not include_expired:
            continue

        item = dict(sq)
        item.update(urgency_meta)
        # Ensure per_person_share reflects current dynamic price for presentation
        item["current_dynamic_price"] = urgency_meta["dynamic_price"]
        item["base_price"] = float(sq.get("base_price") or sq.get("per_person_share") or 120.0)
        enriched_squads.append(item)

    # Sort: open matches first, then by urgency (closest to starting first)
    enriched_squads.sort(key=lambda x: (
        x.get("status") != "open",
        x.get("is_expired", False),
        x.get("minutes_until", 9999)
    ))

    open_spots = sum(
        s.get("subs_needed", 0) - s.get("subs_joined", 0) 
        for s in enriched_squads if s.get("status") == "open" and not s.get("is_expired")
    )

    return {
        "count": len(enriched_squads),
        "open_spots": open_spots,
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "squads": enriched_squads
    }

@router.post("")
async def create_squad_request(req: SquadRequestCreate):
    """Allows players/captains to broadcast a new missing-player sub request directly to the radar"""
    squad = SquadRequest(**req.dict())
    
    # Calculate base price from per_person_share
    squad.base_price = req.per_person_share
    
    # Initialize roster with captain
    squad.players = [
        SquadPlayer(
            user_id="player_dhairya",
            name=f"{req.captain_name} (Captain)",
            phone=req.captain_phone,
            role="Captain",
            reliability_score=105,
            fairplay_score=105,
            karma_score=105
        )
    ]
    
    db_manager.memory_store["squad_requests"][squad.id] = squad.dict()
    
    # Sync to MongoDB if connected
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["squad_requests"].insert_one(squad.dict())
        except Exception:
            pass

    # Emit SUB_REQUEST event to Kafka
    kafka_producer.emit_event(ArenaEvent(
        event_type="SUB_REQUEST",
        user_id="player_dhairya",
        venue_id=squad.venue_id,
        venue_name=squad.venue_name,
        sport=squad.sport,
        amount=squad.per_person_share,
        payload={"squad_id": squad.id, "subs_needed": squad.subs_needed, "city": squad.city}
    ))

    return {
        "message": "Broadcast created successfully! Solo players across the city have been notified.",
        "squad": squad.dict()
    }

@router.post("/{squad_id}/join")
async def join_squad(
    squad_id: str,
    user_id: str = "player_dhairya",
    name: str = "Dhairya Shah",
    phone: str = "+91 98765 43210",
    agreed_price: Optional[float] = None
):
    if user_id == "player_kartik":
        user_id = "player_dhairya"
        name = "Dhairya Shah"
        
    squad = db_manager.memory_store["squad_requests"].get(squad_id)
    if not squad:
        raise HTTPException(status_code=404, detail="Squad request not found")
        
    if squad["status"] != "open":
        raise HTTPException(status_code=400, detail="This squad is already fully packed!")
        
    # Check if user already joined
    if any(p.get("user_id") in (user_id, "player_kartik", "player_dhairya") for p in squad.get("players", [])):
        raise HTTPException(status_code=400, detail="You are already in this squad roster!")

    now = datetime.now()
    urgency_meta = _calculate_squad_urgency(squad, now)
    final_price = agreed_price if agreed_price else urgency_meta["dynamic_price"]

    user_fairplay = db_manager.memory_store["users"].get(user_id, {}).get("fairplay_score", 105)
    
    new_player = {
        "user_id": user_id,
        "name": name,
        "phone": phone,
        "role": "Substitute Player",
        "fairplay_score": user_fairplay,
        "joined_at": now.isoformat() + "Z",
        "price_paid": final_price
    }
    squad["players"].append(new_player)
    squad["subs_joined"] += 1
    
    if squad["subs_joined"] >= squad["subs_needed"]:
        squad["status"] = "filled"

    # Sync to MongoDB if connected
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["squad_requests"].update_one(
                {"id": squad_id},
                {"$set": squad}
            )
        except Exception:
            pass

    # Emit event to Kafka
    event = ArenaEvent(
        event_type="SUB_JOINED",
        user_id=user_id,
        venue_id=squad.get("venue_id"),
        venue_name=squad.get("venue_name"),
        sport=squad.get("sport"),
        amount=final_price,
        payload={
            "squad_id": squad_id,
            "subs_remaining": squad["subs_needed"] - squad["subs_joined"],
            "urgency_level": urgency_meta["urgency_level"],
            "surge_multiplier": urgency_meta["surge_multiplier"],
            "dynamic_price": final_price
        }
    )
    kafka_producer.emit_event(event)

    return {
        "message": f"Successfully joined {squad['captain_name']}'s squad at ₹{final_price}!",
        "squad": squad,
        "price_paid": final_price,
        "urgency_level": urgency_meta["urgency_level"]
    }
