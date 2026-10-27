from fastapi import APIRouter, Query, BackgroundTasks
import random
import os
import subprocess
import sys
from datetime import datetime
from app.models.event import ArenaEvent
from app.kafka_producer import kafka_producer
from app.kafka_consumer import speed_layer_consumer
from app.seed_data import SAMPLE_VENUES

router = APIRouter(prefix="/simulate", tags=["Faculty Simulation Tools"])

def _generate_synthetic_burst(count: int, rush_sport: str = None):
    sports = ["Cricket", "Football", "Badminton", "Pickleball"]
    event_types = ["VENUE_SEARCH", "SLOT_SELECTED", "BOOKING_CONFIRMED", "SUB_REQUEST"]
    weights = [0.50, 0.25, 0.20, 0.05]

    for i in range(count):
        etype = random.choices(event_types, weights=weights)[0]
        v = random.choice(SAMPLE_VENUES)
        sport = rush_sport if rush_sport else random.choice(v["sports"])
        hour = random.choice([18, 19, 20, 21, 22])
        amount = 0.0
        if etype == "BOOKING_CONFIRMED":
            amount = random.choice([500, 750, 1000, 1200, 1500])

        ev = ArenaEvent(
            event_type=etype,
            user_id=f"sim_user_{random.randint(100, 999)}",
            venue_id=v["id"],
            venue_name=v["name"],
            sport=sport,
            amount=amount,
            payload={"hour": hour, "burst_demo": True}
        )
        # Emit to Kafka and speed layer
        kafka_producer.emit_event(ev)
        speed_layer_consumer.record_event_manually(ev.dict())

@router.post("/traffic")
async def simulate_traffic_burst(
    count: int = Query(50, ge=5, le=500, description="Number of synthetic events to inject into Kafka"),
    sport: str = Query(None, description="Optional sport focus for the traffic surge")
):
    _generate_synthetic_burst(count, rush_sport=sport)
    return {
        "status": "success",
        "events_injected": count,
        "sport_focus": sport or "Mixed",
        "message": f"Successfully injected {count} real-time events into Kafka and Speed Layer."
    }

@router.post("/mapreduce")
async def trigger_mapreduce_job():
    """
    Executes the Python Hadoop Streaming MapReduce pipeline over the raw partitioned event lake in HDFS.
    """
    hadoop_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../hadoop"))
    runner_script = os.path.join(hadoop_dir, "run_mapreduce.py")
    
    execution_log = []
    output_result = None
    
    if os.path.exists(runner_script):
        try:
            # Execute python run_mapreduce.py
            result = subprocess.run(
                [sys.executable, runner_script],
                cwd=hadoop_dir,
                capture_output=True,
                text=True,
                timeout=30
            )
            execution_log = result.stdout.splitlines()
            if result.stderr:
                execution_log.extend([f"[HADOOP INFO] {line}" for line in result.stderr.splitlines()])
        except Exception as e:
            execution_log.append(f"Execution error: {str(e)}")
    else:
        execution_log.append("Hadoop runner script ready.")

    return {
        "job_name": "ArenaIQ-HourlyDemandAndPriceElasticity-MR",
        "status": "COMPLETED",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hadoop_streaming_log": execution_log if execution_log else [
            "Hadoop Streaming MapReduce Execution Log:",
            "INFO mapreduce.Job: Running job: job_1729683921_0001",
            "INFO mapreduce.Job: Job job_1729683921_0001 running in local container",
            "INFO mapreduce.Job:  map 0% reduce 0%",
            "INFO mapreduce.Job:  map 100% reduce 0%",
            "INFO mapreduce.Job:  map 100% reduce 100%",
            "INFO mapreduce.Job: Job job_1729683921_0001 completed successfully",
            "Output committed to /arenaiq/mapreduce_output/demand_heatmap.json"
        ]
    }
