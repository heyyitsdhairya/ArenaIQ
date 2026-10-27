import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, db_manager
from app.kafka_producer import kafka_producer
from app.kafka_consumer import speed_layer_consumer
from app.seed_data import SAMPLE_VENUES, generate_slots, generate_sample_squads, seed_hdfs_historical_logs
from app.routers import venues, bookings, squad, analytics, simulation, auth

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("arenaiq.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up ArenaIQ Big Data Analytics Backend...")
    
    # 1. Connect MongoDB
    await connect_to_mongo()
    
    # 2. Connect Kafka
    kafka_producer.connect()
    speed_layer_consumer.start()
    
    # 3. Seed in-memory and database
    for v in SAMPLE_VENUES:
        db_manager.memory_store["venues"][v["id"]] = v
        
    slots = generate_slots(days_ahead=3)
    for s in slots:
        db_manager.memory_store["slots"][s["slot_id"]] = s
        
    squads = generate_sample_squads()
    for sq in squads:
        db_manager.memory_store["squad_requests"][sq["id"]] = sq
        
    # Seed cold lake HDFS partitioned files
    seed_hdfs_historical_logs(count=360)

    # 4. Sync initial data to MongoDB if connected
    if db_manager.is_connected and db_manager.db is not None:
        try:
            for v in SAMPLE_VENUES:
                await db_manager.db["venues"].update_one({"id": v["id"]}, {"$set": v}, upsert=True)
            for s in slots:
                await db_manager.db["slots"].update_one({"slot_id": s["slot_id"]}, {"$set": s}, upsert=True)
            for sq in squads:
                await db_manager.db["squad_requests"].update_one({"id": sq["id"]}, {"$set": sq}, upsert=True)
            for uid, user in db_manager.memory_store.get("users", {}).items():
                await db_manager.db["users"].update_one({"id": uid}, {"$set": user}, upsert=True)
            logger.info("Synchronized initial collections into MongoDB (venues, slots, squad_requests, users).")
        except Exception as e:
            logger.warning(f"Could not sync seed data to MongoDB: {e}")
    
    logger.info(f"ArenaIQ initialized with {len(SAMPLE_VENUES)} venues, {len(slots)} court slots, and {len(squads)} squad requests.")
    yield
    # Shutdown
    logger.info("Shutting down ArenaIQ...")
    speed_layer_consumer.is_running = False
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(venues.router, prefix=settings.API_PREFIX)
app.include_router(bookings.router, prefix=settings.API_PREFIX)
app.include_router(squad.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(simulation.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "project": "ArenaIQ - Big Data Analytics Platform",
        "description": "Sports Venue Booking & Demand Intelligence Engine",
        "docs": "/docs",
        "health": "/api/analytics/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
