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
        "users": {},
        "auth_audit_logs": []
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
