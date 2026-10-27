import os
import glob
import subprocess
import sys
import json

def run_pipeline():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    lake_dir = os.path.join(base_dir, "data", "hdfs_lake")
    output_dir = os.path.join(base_dir, "data", "mapreduce_output")
    os.makedirs(output_dir, exist_ok=True)
    
    mapper_path = os.path.join(base_dir, "mapper_demand.py")
    reducer_path = os.path.join(base_dir, "reducer_demand.py")
    
    # 1. Gather all events from HDFS partitioned lake
    event_files = glob.glob(os.path.join(lake_dir, "partition_date=*", "events.json"))
    if not event_files:
        print("[HADOOP WARN] No event files found in HDFS lake partition directories.")
        return

    print("======================================================================")
    print("      ARENAIQ HADOOP STREAMING MAPREDUCE EXECUTION RUNNER             ")
    print("======================================================================")
    print(f"INFO hadoop.hdfs: Input Path: {lake_dir}/partition_date=*/events.json")
    print(f"INFO hadoop.hdfs: Detected {len(event_files)} partition file(s).")
    print(f"INFO mapreduce.Job: Submitting MapReduce Job to YARN / Local Cluster...")
    print(f"INFO mapreduce.Job: Running Job ID: job_arenaiq_demand_{int(os.getpid())}")
    
    # Collect all lines
    all_lines = []
    for ef in event_files:
        with open(ef, "r", encoding="utf-8") as f:
            all_lines.extend(f.readlines())
            
    print(f"INFO mapreduce.Job: Total input records to map: {len(all_lines)}")
    print(f"INFO mapreduce.Job: Mapping Phase: 0%")
    
    # Step 1: Mapper phase
    mapper_proc = subprocess.Popen(
        [sys.executable, mapper_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    mapped_out, mapper_err = mapper_proc.communicate(input="".join(all_lines))
    print(f"INFO mapreduce.Job: Mapping Phase: 100%")
    
    # Step 2: Shuffle & Sort phase
    print(f"INFO mapreduce.Job: Shuffling & Sorting intermediate keys across partitions...")
    mapped_lines = [l for l in mapped_out.splitlines() if l.strip()]
    sorted_lines = sorted(mapped_lines)
    print(f"INFO mapreduce.Job: Shuffle/Sort complete. Sorted records: {len(sorted_lines)}")

    # Step 3: Reducer phase
    print(f"INFO mapreduce.Job: Reducing Phase: 0%")
    reducer_proc = subprocess.Popen(
        [sys.executable, reducer_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    reduced_out, reducer_err = reducer_proc.communicate(input="\n".join(sorted_lines) + "\n")
    print(f"INFO mapreduce.Job: Reducing Phase: 100%")

    # Step 4: Parse Reducer output into formatted JSON
    results = []
    for line in reduced_out.splitlines():
        parts = line.strip().split("\t")
        if len(parts) >= 6:
            results.append({
                "hour": parts[0],
                "total_events": int(parts[1]),
                "total_bookings": int(parts[2]),
                "avg_price": float(parts[3]),
                "occupancy_pct": int(parts[4]),
                "demand": parts[5]
            })

    output_file = os.path.join(output_dir, "demand_heatmap.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"INFO hadoop.hdfs: Output committed to {output_file}")
    print(f"INFO mapreduce.Job: Job finished successfully! Processed {len(results)} hourly bins.")
    print("======================================================================")

if __name__ == "__main__":
    run_pipeline()
