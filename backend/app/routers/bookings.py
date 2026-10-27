from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from app.database import db_manager
from app.models.booking import Booking, BookingRequest
from app.models.event import ArenaEvent
from app.models.squad import SquadRequest
from app.kafka_producer import kafka_producer
from app.kafka_consumer import speed_layer_consumer

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=Booking)
async def create_booking(req: BookingRequest):
    # 1. Verify slot exists and is available
    slot = db_manager.memory_store["slots"].get(req.slot_id)
    if slot and slot.get("status") == "booked":
        raise HTTPException(status_code=400, detail="This time slot has already been booked by another user!")
    
    # 2. Reserve slot
    if slot:
        slot["status"] = "booked"
        slot["booked_by"] = req.user_name
        slot["booked_at"] = datetime.utcnow().isoformat() + "Z"
        
    booking = Booking(**req.dict())
    
    # 3. Store in MongoDB and memory
    db_manager.memory_store["bookings"][booking.booking_id] = booking.dict()
    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["bookings"].insert_one(booking.dict())
            if slot:
                await db_manager.db["slots"].update_one(
                    {"slot_id": req.slot_id},
                    {"$set": {"status": "booked", "booked_by": req.user_name}}
                )
        except Exception as e:
            pass

    # 4. Update user profile FairPlay and stats
    user = db_manager.memory_store["users"].get(req.user_id)
    if user:
        user["fairplay_score"] = user.get("fairplay_score", 100) + 10
        user["reliability_score"] = user["fairplay_score"]
        user["karma_score"] = user["fairplay_score"]
        user["total_bookings"] += 1

    # 5. If user requested emergency squad subs, publish to squad radar
    if req.need_squad_subs and req.subs_needed_count > 0:
        squad_req = SquadRequest(
            booking_id=booking.booking_id,
            venue_id=req.venue_id,
            venue_name=req.venue_name,
            sport=req.sport,
            date=req.date,
            time_slot=f"{req.start_time} - {req.end_time}",
            captain_name=req.user_name,
            captain_phone=req.user_phone,
            subs_needed=req.subs_needed_count,
            subs_joined=0,
            per_person_share=req.per_person_cost,
            notes=f"Need {req.subs_needed_count} players for {req.sport}! Split cost: ₹{req.per_person_cost}/person.",
            players=[{"user_id": req.user_id, "name": f"{req.user_name} (Captain)", "phone": req.user_phone, "role": "Captain", "reliability_score": user.get("reliability_score", 100) if user else 100, "fairplay_score": user.get("fairplay_score", 100) if user else 100, "karma_score": user.get("karma_score", 100) if user else 100}]
        )
        db_manager.memory_store["squad_requests"][squad_req.id] = squad_req.dict()
        
        # Emit SUB_REQUEST event to Kafka
        kafka_producer.emit_event(ArenaEvent(
            event_type="SUB_REQUEST",
            user_id=req.user_id,
            venue_id=req.venue_id,
            venue_name=req.venue_name,
            sport=req.sport,
            amount=req.per_person_cost,
            payload={"squad_id": squad_req.id, "subs_needed": req.subs_needed_count}
        ))

    # 6. Stream BOOKING_CONFIRMED to Kafka & Speed Layer
    event = ArenaEvent(
        event_type="BOOKING_CONFIRMED",
        user_id=req.user_id,
        venue_id=req.venue_id,
        venue_name=req.venue_name,
        sport=req.sport,
        slot_id=req.slot_id,
        amount=req.amount_paid,
        payload={
            "booking_id": booking.booking_id,
            "split_players": req.split_players_count,
            "per_person_cost": req.per_person_cost,
            "hour": int(req.start_time.split(":")[0])
        }
    )
    kafka_producer.emit_event(event)
    speed_layer_consumer.record_event_manually(event.dict())

    return booking

@router.get("/my")
async def get_my_bookings(user_id: str = "player_dhairya"):
    if user_id == "player_kartik":
        user_id = "player_dhairya"
    all_bookings = list(db_manager.memory_store["bookings"].values())
    my_bookings = [b for b in all_bookings if b.get("user_id") in (user_id, "player_kartik", "player_dhairya")]
    user_info = db_manager.memory_store["users"].get(user_id, {
        "id": user_id,
        "name": "Dhairya Shah",
        "reliability_score": 105,
        "fairplay_score": 105,
        "badges": ["Verified Team Captain", "Weekend Regular", "Punctual Player"],
        "total_bookings": len(my_bookings),
        "cancelled_bookings": 0
    })
    return {
        "user": user_info,
        "bookings_count": len(my_bookings),
        "bookings": sorted(my_bookings, key=lambda x: x.get("created_at", ""), reverse=True)
    }

@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str):
    booking = db_manager.memory_store["bookings"].get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    booking["status"] = "cancelled"
    
    # Release slot back to available
    slot = db_manager.memory_store["slots"].get(booking["slot_id"])
    if slot:
        slot["status"] = "available"
        slot["booked_by"] = None

    # Penalty on FairPlay Reliability Rating
    user = db_manager.memory_store["users"].get(booking["user_id"])
    if user:
        user["fairplay_score"] = max(0, user.get("fairplay_score", 100) - 15)
        user["reliability_score"] = user["fairplay_score"]
        user["karma_score"] = user["fairplay_score"]
        user["cancelled_bookings"] += 1

    # Stream event to Kafka
    event = ArenaEvent(
        event_type="BOOKING_CANCELLED",
        user_id=booking["user_id"],
        venue_id=booking["venue_id"],
        venue_name=booking["venue_name"],
        sport=booking["sport"],
        slot_id=booking["slot_id"],
        amount=booking["amount_paid"],
        payload={"booking_id": booking_id}
    )
    kafka_producer.emit_event(event)
    speed_layer_consumer.record_event_manually(event.dict())

    return {
        "message": "Booking successfully cancelled",
        "fairplay_penalty": -15,
        "new_fairplay_score": user["fairplay_score"] if user else 85
    }
