import threading
import json
import time
import logging
from app.config import settings

logger = logging.getLogger("arenaiq.kafka_consumer")

class SpeedLayerConsumer:
    def __init__(self):
        self.is_running = False
        self.thread = None
        self.metrics = {
            "total_processed": 0,
            "events_per_sec": 0.0,
            "bookings_count": 0,
            "searches_count": 0,
            "sub_requests_count": 0,
            "total_revenue": 0.0,
            "sport_distribution": {
                "Cricket": 0,
                "Football": 0,
                "Badminton": 0,
                "Pickleball": 0
            },
            "last_event_time": None
        }
        self._second_counter = 0
        self._last_calc_time = time.time()

    def start(self):
        self.is_running = True
        self.thread = threading.Thread(target=self._run_consumer_loop, daemon=True)
        self.thread.start()
        logger.info("SpeedLayer Kafka Consumer thread started.")

    def record_event_manually(self, event: dict):
        """Used by speed layer for real-time stats update (both direct and Kafka-consumed)"""
        self.metrics["total_processed"] += 1
        self._second_counter += 1
        
        event_type = event.get("event_type")
        sport = event.get("sport")
        amount = event.get("amount", 0.0)

        if event_type == "BOOKING_CONFIRMED":
            self.metrics["bookings_count"] += 1
            self.metrics["total_revenue"] += float(amount)
        elif event_type == "VENUE_SEARCH":
            self.metrics["searches_count"] += 1
        elif event_type == "SUB_REQUEST":
            self.metrics["sub_requests_count"] += 1

        if sport and sport in self.metrics["sport_distribution"]:
            self.metrics["sport_distribution"][sport] += 1

        self.metrics["last_event_time"] = event.get("timestamp")

        # Periodically compute moving average of events/sec
        now = time.time()
        elapsed = now - self._last_calc_time
        if elapsed >= 1.0:
            self.metrics["events_per_sec"] = round(self._second_counter / elapsed, 1)
            self._second_counter = 0
            self._last_calc_time = now

    def _run_consumer_loop(self):
        try:
            from kafka import KafkaConsumer
            consumer = KafkaConsumer(
                settings.TOPIC_BOOKINGS,
                settings.TOPIC_USER_ACTIVITY,
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS.split(','),
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',
                group_id='arenaiq-speed-layer',
                consumer_timeout_ms=1000
            )
            logger.info("Connected KafkaConsumer to topics.")
            while self.is_running:
                for message in consumer:
                    if not self.is_running:
                        break
                    event = message.value
                    self.record_event_manually(event)
        except Exception as e:
            logger.info(f"Kafka background consumer listener using direct pipeline: {e}")

speed_layer_consumer = SpeedLayerConsumer()
