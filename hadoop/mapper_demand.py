#!/usr/bin/env python3
"""
ArenaIQ Hadoop Streaming Mapper
Input: Raw JSON event records from HDFS cold storage
Output: Key \t Value
Key: Hour string (e.g., '19:00')
Value: 1 \t amount \t is_booking (1 or 0)
"""
import sys
import json

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
            ts = event.get("timestamp", "")
            # Extract hour from timestamp "2026-10-23T19:45:00Z" or payload
            hour = event.get("hour")
            if hour is None and "T" in ts:
                try:
                    time_part = ts.split("T")[1]
                    hour = int(time_part.split(":")[0])
                except Exception:
                    hour = 18
            if hour is None:
                hour = 18

            hour_key = f"{int(hour):02d}:00"
            amount = float(event.get("amount", 0.0))
            is_booking = 1 if event.get("event_type") == "BOOKING_CONFIRMED" else 0

            # Emit Key \t Value
            print(f"{hour_key}\t1\t{amount}\t{is_booking}")
        except Exception:
            continue

if __name__ == "__main__":
    main()
