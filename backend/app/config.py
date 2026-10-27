import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ArenaIQ - Big Data Analytics Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # MongoDB
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "arenaiq")
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    TOPIC_BOOKINGS: str = "arenaiq.bookings"
    TOPIC_USER_ACTIVITY: str = "arenaiq.user-activity"
    TOPIC_TELEMETRY: str = "arenaiq.telemetry"
    
    # Storage & Hadoop
    HDFS_LAKE_PATH: str = os.getenv("HDFS_LAKE_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../hadoop/data/hdfs_lake")))

settings = Settings()
