#!/usr/bin/env python3
"""
ArenaIQ Hadoop Streaming Reducer
Input: Sorted Key \t Value streams (Key: Hour, Value: 1 \t amount \t is_booking)
Output: Aggregated JSON / Summary per hour
"""
import sys

def main():
    current_hour = None
    total_events = 0
    total_revenue = 0.0
    total_bookings = 0

    results = []

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            parts = line.split("\t")
            if len(parts) < 4:
                continue
            hour, count, amount, is_booking = parts[0], int(parts[1]), float(parts[2]), int(parts[3])

            if current_hour == hour:
                total_events += count
                total_revenue += amount
                total_bookings += is_booking
            else:
                if current_hour:
                    # Emit previous hour
                    avg_price = round(total_revenue / max(1, total_bookings), 0)
                    # Simulated occupancy calculation
                    occ_pct = min(100, int((total_bookings / max(1, total_events)) * 320))
                    demand_tier = "Super Peak" if occ_pct >= 85 else ("Moderate" if occ_pct >= 45 else "Off-Peak")
                    print(f"{current_hour}\t{total_events}\t{total_bookings}\t{avg_price}\t{occ_pct}\t{demand_tier}")

                current_hour = hour
                total_events = count
                total_revenue = amount
                total_bookings = is_booking
        except Exception:
            continue

    if current_hour:
        avg_price = round(total_revenue / max(1, total_bookings), 0)
        occ_pct = min(100, int((total_bookings / max(1, total_events)) * 320))
        demand_tier = "Super Peak" if occ_pct >= 85 else ("Moderate" if occ_pct >= 45 else "Off-Peak")
        print(f"{current_hour}\t{total_events}\t{total_bookings}\t{avg_price}\t{occ_pct}\t{demand_tier}")

if __name__ == "__main__":
    main()
