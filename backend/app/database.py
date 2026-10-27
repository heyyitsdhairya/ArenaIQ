import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("arenaiq.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False
    
    # In-memory storage for high-availability fallback
    memory_store = {
        "venues": {},
        "slots": {},
        "bookings": {},
        "squad_requests": {},
        "partners": {},
        "users": {
            "player_dhairya": {
                "id": "player_dhairya",
                "name": "Dhairya Shah",
                "phone": "+91 98765 43210",
                "city": "Ahmedabad",
                "area": "Bodakdev / Sindhu Bhavan",
                "fairplay_score": 105,
                "badges": ["Verified Team Captain", "Weekend Regular", "Punctual Player", "Zero Late Drops"],
                "total_bookings": 8,
                "cancelled_bookings": 0
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
    }

db_manager = Database()

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        # Verify connection
        await client.admin.command('ping')
        db_manager.client = client
        db_manager.db = client[settings.MONGO_DB_NAME]
        db_manager.is_connected = True
        logger.info("Successfully connected to MongoDB!")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}. Running in graceful in-memory fallback mode.")
        db_manager.is_connected = False

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")
