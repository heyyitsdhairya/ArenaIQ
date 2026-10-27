import json
import logging
import os
from datetime import datetime
from app.config import settings
from app.models.event import ArenaEvent

logger = logging.getLogger("arenaiq.kafka_producer")

class KafkaEventProducer:
    def __init__(self):
        self.producer = None
        self.is_connected = False
        self.event_buffer = []  # Recent events for live streaming UI ticker
        self.total_events_emitted = 0

    def connect(self):
        try:
            from kafka import KafkaProducer
            self.producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS.split(','),
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                request_timeout_ms=2500,
                max_block_ms=2000
            )
            self.is_connected = True
            logger.info(f"Kafka Producer connected to {settings.KAFKA_BOOTSTRAP_SERVERS}")
        except Exception as e:
            logger.warning(f"Kafka Producer connection failed ({e}). Operating in memory/simulation fallback mode.")
            self.producer = None
            self.is_connected = False

    def emit_event(self, event: ArenaEvent):
        event_dict = event.dict()
        self.total_events_emitted += 1
        
        # Keep latest 100 events in memory for live web UI stream
        self.event_buffer.insert(0, event_dict)
        if len(self.event_buffer) > 100:
            self.event_buffer.pop()

        # 1. Send to Kafka broker if online
        topic = settings.TOPIC_USER_ACTIVITY
        if event.event_type in ["BOOKING_CONFIRMED", "BOOKING_CANCELLED"]:
            topic = settings.TOPIC_BOOKINGS
            
        if self.producer and self.is_connected:
            try:
                self.producer.send(topic, key=event.venue_id or "general", value=event_dict)
                self.producer.flush(timeout=1.0)
            except Exception as e:
                logger.error(f"Error publishing to Kafka: {e}")
                self.is_connected = False

        # 2. Append directly to HDFS cold storage partition lake
        self._archive_to_hdfs_lake(event_dict)
        return event_dict

    def _archive_to_hdfs_lake(self, event_dict: dict):
        try:
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            lake_dir = os.path.join(settings.HDFS_LAKE_PATH, f"partition_date={today_str}")
            os.makedirs(lake_dir, exist_ok=True)
            file_path = os.path.join(lake_dir, "events.json")
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(event_dict) + "\n")
        except Exception as e:
            logger.warning(f"Failed to append to HDFS cold lake: {e}")

kafka_producer = KafkaEventProducer()
