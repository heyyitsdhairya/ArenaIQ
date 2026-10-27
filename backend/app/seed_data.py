import random
import os
import json
from datetime import datetime, timedelta
from app.config import settings

SAMPLE_VENUES = [
    {
        "id": "vn-001",
        "name": "Apex Turf & Sports Arena",
        "tagline": "Gandhinagar's Premier Multisport Floodlit Arena",
        "sports": ["Cricket", "Football", "Pickleball"],
        "city": "Gandhinagar",
        "area": "Infocity / Kudasan",
        "address": "Opp. TCS Infocity Gate 2, Gandhinagar, Gujarat 382007",
        "rating": 4.9,
        "total_reviews": 234,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Floodlights", "Locker Room", "Free Parking", "Rental Bats & Balls", "Cafeteria", "Changing Shower"],
        "courts": [
            {"court_id": "c-01", "name": "Lord's Pitch (Box Cricket)", "sport": "Cricket", "surface": "FIFA Grade 50mm AstroTurf", "default_price": 1200},
            {"court_id": "c-02", "name": "Camp Nou Futsal Cage", "sport": "Football", "surface": "Shock-Absorbing Rubber Infill", "default_price": 1400},
            {"court_id": "c-03", "name": "Pickle Pro Court 1", "sport": "Pickleball", "surface": "Cushioned Acrylic", "default_price": 600}
        ]
    },
    {
        "id": "vn-002",
        "name": "Urban Kicks & Shuttle Hub",
        "tagline": "Professional BWF Wooden Courts & Rooftop Box Cricket",
        "sports": ["Badminton", "Cricket"],
        "city": "Gandhinagar",
        "area": "Bhaijipura / PDPU Road",
        "address": "Near Raysan Circle, PDPU Knowledge Corridor, Gandhinagar 382007",
        "rating": 4.8,
        "total_reviews": 189,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Air Conditioned Lounge", "Yonex Stringing", "BWF Wooden Floors", "Shower Rooms", "EV Charging"],
        "courts": [
            {"court_id": "c-04", "name": "All-England Court A", "sport": "Badminton", "surface": "Maple Hardwood + Yonex Mat", "default_price": 500},
            {"court_id": "c-05", "name": "All-England Court B", "sport": "Badminton", "surface": "Maple Hardwood + Yonex Mat", "default_price": 500},
            {"court_id": "c-06", "name": "Rooftop Cricket Net", "sport": "Cricket", "surface": "High-Density Turf", "default_price": 1000}
        ]
    },
    {
        "id": "vn-003",
        "name": "Sindhu Bhavan Sports Complex",
        "tagline": "Ahmedabad's Flagship Olympic-Grade Turf",
        "sports": ["Football", "Cricket", "Pickleball", "Badminton"],
        "city": "Ahmedabad",
        "area": "Sindhu Bhavan Road (SBR)",
        "address": "Behind Taj Skyline, Off Sindhu Bhavan Marg, Bodakdev, Ahmedabad 380054",
        "rating": 4.95,
        "total_reviews": 412,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60",
        "amenities": ["VIP Lounge", "Digital Scoreboard", "Live Match Streaming", "Physio On-Call", "Starbucks Kiosk"],
        "courts": [
            {"court_id": "c-07", "name": "Maracana Arena (7v7)", "sport": "Football", "surface": "European Monofilament Turf", "default_price": 1800},
            {"court_id": "c-08", "name": "Eden Gardens Cage", "sport": "Cricket", "surface": "Bounce-Optimized AstroTurf", "default_price": 1500},
            {"court_id": "c-09", "name": "Wimbledon Glass Court", "sport": "Pickleball", "surface": "Pro Cushion 8-Layer", "default_price": 750}
        ]
    },
    {
        "id": "vn-004",
        "name": "Skyline Smashers Pickleball Club",
        "tagline": "Ahmedabad's Dedicated 6-Court Pickleball Stadium",
        "sports": ["Pickleball"],
        "city": "Ahmedabad",
        "area": "Prahlad Nagar",
        "address": "Near Anandnagar Cross Roads, Prahlad Nagar, Ahmedabad 380015",
        "rating": 4.7,
        "total_reviews": 96,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Paddle Rentals", "Coaching Clinics", "Spectator Bleachers", "Juice Bar", "Free WiFi"],
        "courts": [
            {"court_id": "c-10", "name": "Center Court 1", "sport": "Pickleball", "surface": "DecoTurf Tournament Blue", "default_price": 600},
            {"court_id": "c-11", "name": "Center Court 2", "sport": "Pickleball", "surface": "DecoTurf Tournament Blue", "default_price": 600}
        ]
    },
    {
        "id": "vn-005",
        "name": "The Pitch Box Cricket Arena",
        "tagline": "High-Tension Enclosed Night Turf for Box Cricket Battles",
        "sports": ["Cricket"],
        "city": "Gandhinagar",
        "area": "Sargasan Cross Roads",
        "address": "Opp. Swagat Flamingo, Near Sargasan Circle, Gandhinagar 382421",
        "rating": 4.88,
        "total_reviews": 164,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Floodlights", "Automated Bowling Machine", "Dugout Seating", "Cricket Gear Rental", "Chilled Beverages"],
        "courts": [
            {"court_id": "c-13", "name": "Melbourne MCG Box Pitch", "sport": "Cricket", "surface": "65mm High-Shock AstroTurf", "default_price": 1100},
            {"court_id": "c-14", "name": "Lord's Pavilion Cage", "sport": "Cricket", "surface": "High-Tension Roof Net & Turf", "default_price": 1200}
        ]
    },
    {
        "id": "vn-006",
        "name": "KhelMahakumbh Olympic Badminton Academy",
        "tagline": "State-of-the-Art Indoor Climate-Controlled Badminton Stadium",
        "sports": ["Badminton"],
        "city": "Gandhinagar",
        "area": "Sector 11 / CH Road",
        "address": "Near Mahatma Mandir, Sector 11, Gandhinagar 382010",
        "rating": 4.92,
        "total_reviews": 278,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Central AC", "BWF Certified Flooring", "Yonex Stringing Pro Shop", "Locker & Steam", "Physio Room"],
        "courts": [
            {"court_id": "c-15", "name": "Padukone Court 1", "sport": "Badminton", "surface": "BWF Certified 8-ply Maple Wood", "default_price": 550},
            {"court_id": "c-16", "name": "Saina Nehwal Court 2", "sport": "Badminton", "surface": "BWF Approved Green Mat", "default_price": 500}
        ]
    },
    {
        "id": "vn-007",
        "name": "Torero Futsal & Football Park",
        "tagline": "Ahmedabad's Premier Fast-Paced 5v5 & 7v7 Futsal Experience",
        "sports": ["Football"],
        "city": "Ahmedabad",
        "area": "Vastrapur / IIM Road",
        "address": "Behind AlphaOne Mall, Vastrapur Lake Road, Ahmedabad 380015",
        "rating": 4.86,
        "total_reviews": 340,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=60",
        "amenities": ["FIFA Approved Turf", "LED Scoreboard", "Changing Showers", "Match Video Recording", "Sports Cafe"],
        "courts": [
            {"court_id": "c-17", "name": "San Siro Futsal Cage (5v5)", "sport": "Football", "surface": "Non-abrasive Monofilament", "default_price": 1300},
            {"court_id": "c-18", "name": "Bernabeu Arena (7v7)", "sport": "Football", "surface": "Shockpad Infill AstroTurf", "default_price": 1900}
        ]
    },
    {
        "id": "vn-008",
        "name": "Dink Masters Pickleball Arena",
        "tagline": "GIFT City's Professional Rooftop & Indoor Pickleball Center",
        "sports": ["Pickleball"],
        "city": "Gandhinagar",
        "area": "GIFT City Knowledge Corridor",
        "address": "Building 14C, GIFT SEZ Road, Gandhinagar 382355",
        "rating": 4.91,
        "total_reviews": 112,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Carbon Paddle Rentals", "Floodlights", "Spectator Deck", "Electronic Scoring", "Pro Coaching"],
        "courts": [
            {"court_id": "c-19", "name": "GIFT Grandstand Court 1", "sport": "Pickleball", "surface": "USAPA Cushioned Acrylic", "default_price": 650},
            {"court_id": "c-20", "name": "Skyline Dink Court 2", "sport": "Pickleball", "surface": "Panoramic View Tournament Court", "default_price": 700}
        ]
    },
    {
        "id": "vn-009",
        "name": "Gulliy Cricket & Futsal Turf",
        "tagline": "High-Energy Multisport Night Arena on SG Highway",
        "sports": ["Cricket", "Football"],
        "city": "Ahmedabad",
        "area": "SG Highway / Gota",
        "address": "Near Silver Oak University, SG Highway, Gota, Ahmedabad 382481",
        "rating": 4.79,
        "total_reviews": 195,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60",
        "amenities": ["High Lux Floodlights", "Boundary Sensors", "Free Parking", "Snack Bar", "Surround Sound"],
        "courts": [
            {"court_id": "c-21", "name": "Eden Box Cricket Pitch", "sport": "Cricket", "surface": "High-Tension Turf Enclosure", "default_price": 1000},
            {"court_id": "c-22", "name": "Anfield Futsal Cage", "sport": "Football", "surface": "Rubber Infill Futsal Turf", "default_price": 1250}
        ]
    },
    {
        "id": "vn-010",
        "name": "SmashPoint Badminton & Pickleball Hub",
        "tagline": "Premium Wooden Badminton Courts & Cushioned Pickleball",
        "sports": ["Badminton", "Pickleball"],
        "city": "Ahmedabad",
        "area": "Prahlad Nagar / Anandnagar",
        "address": "Behind Titanium City Center, 100 Ft Anandnagar Road, Ahmedabad 380015",
        "rating": 4.87,
        "total_reviews": 210,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Fully Air-Conditioned", "Yonex Stringing Station", "Viewing Gallery", "Clean Showers", "Water Station"],
        "courts": [
            {"court_id": "c-23", "name": "Court Alpha Pro (Badminton)", "sport": "Badminton", "surface": "Teak Wood Suspended Floor", "default_price": 600},
            {"court_id": "c-24", "name": "Smash Pickle Court 1", "sport": "Pickleball", "surface": "8-Layer Pro Acrylic", "default_price": 550}
        ]
    },
    {
        "id": "vn-011",
        "name": "Champions Floodlit Turf Club",
        "tagline": "24x7 Night Sports Hub between Ahmedabad and Gandhinagar",
        "sports": ["Football", "Cricket"],
        "city": "Gandhinagar",
        "area": "Koba Circle / Airport Highway",
        "address": "Near PDEU Bridge, Off Airport Highway, Koba Circle, Gandhinagar 382007",
        "rating": 4.93,
        "total_reviews": 460,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=60",
        "amenities": ["24x7 Open", "Olympic Quality Turf", "Dugout Benches", "Gatorade Bar", "Live Drone Cam"],
        "courts": [
            {"court_id": "c-25", "name": "Wembley Futsal Cage", "sport": "Football", "surface": "High Density Monofilament", "default_price": 1350},
            {"court_id": "c-26", "name": "Sharjah Floodlit Pitch", "sport": "Cricket", "surface": "Spin & Pace AstroTurf", "default_price": 1150}
        ]
    },
    {
        "id": "vn-012",
        "name": "Ace Shuttlers Badminton Arena",
        "tagline": "International Standard BWF Wooden Badminton Stadium",
        "sports": ["Badminton"],
        "city": "Ahmedabad",
        "area": "Bopal / South Bopal",
        "address": "Near Gala Gymkhana Road, South Bopal, Ahmedabad 380058",
        "rating": 4.82,
        "total_reviews": 175,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Air-Conditioned Hall", "Anti-Glare Stadium Lighting", "Lockers", "Certified Coaches", "Racket Rentals"],
        "courts": [
            {"court_id": "c-27", "name": "BWF Olympic Court 1", "sport": "Badminton", "surface": "Wooden Suspended Court", "default_price": 500},
            {"court_id": "c-28", "name": "BWF Olympic Court 2", "sport": "Badminton", "surface": "Wooden Suspended Court", "default_price": 500}
        ]
    },
    {
        "id": "vn-013",
        "name": "Sabarmati Riverfront Multisport Hub",
        "tagline": "Scenic Waterfront Sports Complex with Cricket, Futsal & Pickleball",
        "sports": ["Cricket", "Football", "Pickleball", "Badminton"],
        "city": "Ahmedabad",
        "area": "Riverfront West / Ashram Road",
        "address": "Sabarmati Riverfront West Promenade, Near Ellis Bridge, Ahmedabad 380009",
        "rating": 4.96,
        "total_reviews": 520,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Riverfront Breeze View", "Food Truck Zone", "Medical & First Aid", "Shower Rooms", "Ample Parking"],
        "courts": [
            {"court_id": "c-29", "name": "Riverfront Box Cricket", "sport": "Cricket", "surface": "FIFA Grade 50mm AstroTurf", "default_price": 1300},
            {"court_id": "c-30", "name": "Riverfront Futsal Arena", "sport": "Football", "surface": "Shock-Absorbing Rubber Infill", "default_price": 1500},
            {"court_id": "c-31", "name": "Sunset Pickleball Court", "sport": "Pickleball", "surface": "Pro Cushion 8-Layer Acrylic", "default_price": 700},
            {"court_id": "c-32", "name": "Riverview Shuttle Arena", "sport": "Badminton", "surface": "Maple Hardwood + Yonex Mat", "default_price": 600}
        ]
    },
    {
        "id": "vn-014",
        "name": "Nexus Multisport & Box Turf",
        "tagline": "Sector 21's Favorite Community Cricket & Pickleball Turf",
        "sports": ["Cricket", "Pickleball"],
        "city": "Gandhinagar",
        "area": "Sector 21 / Gh-Road",
        "address": "Near Sector 21 Shopping Center, Gh-Road, Gandhinagar 382021",
        "rating": 4.76,
        "total_reviews": 142,
        "verified": True,
        "image_url": "https://images.unsplash.com/photo-1607734834519-d8576ae60ea6?w=800&auto=format&fit=crop&q=60",
        "amenities": ["Night Floodlights", "Spectator Seating", "Cricket Equipment", "Snacks & Refreshment", "UPI / Cashless"],
        "courts": [
            {"court_id": "c-33", "name": "Wankhede Box Pitch", "sport": "Cricket", "surface": "Bounce-Optimized AstroTurf", "default_price": 950},
            {"court_id": "c-34", "name": "Nexus Dink Court", "sport": "Pickleball", "surface": "Anti-Skid Cushioned Acrylic", "default_price": 500}
        ]
    }
]

def generate_slots(days_ahead=3):
    slots = []
    today = datetime.now().date()
    
    time_schedule = [
        ("06:00", "07:00", False, 0.65, 35),  # Off-peak early morning
        ("07:00", "08:00", False, 0.70, 30),
        ("08:00", "09:00", False, 0.70, 30),
        ("10:00", "11:00", False, 0.60, 40),  # Off-peak afternoon
        ("12:00", "13:00", False, 0.55, 45),  # Super saver
        ("15:00", "16:00", False, 0.60, 40),
        ("17:00", "18:00", True, 1.0, 0),     # Peak starts
        ("18:00", "19:00", True, 1.15, 0),    # Prime evening surge
        ("19:00", "20:00", True, 1.25, 0),    # Super peak
        ("20:00", "21:00", True, 1.25, 0),
        ("21:00", "22:00", True, 1.10, 0),
        ("22:00", "23:00", False, 0.75, 25),  # Night owl saver
        ("23:00", "00:00", False, 0.65, 35)
    ]
    
    for venue in SAMPLE_VENUES:
        for court in venue["courts"]:
            for d in range(days_ahead):
                slot_date = (today + timedelta(days=d)).strftime("%Y-%m-%d")
                prebooked_names = [
                    "Aarav Patel (Captain)", "Ahmedabad Futsal Club", "Siddharth Mehta",
                    "Sector 21 Smashers", "Player Rahul", "Hardik Trivedi", "PDPU Box Strikers"
                ]
                for st, et, is_peak, multiplier, discount_pct in time_schedule:
                    base_price = court["default_price"]
                    dynamic_price = round(base_price * multiplier, -1)
                    slot_id = f"sl-{court['court_id']}-{slot_date}-{st.replace(':', '')}"
                    
                    # Realistic pre-booked slots: prime evening hours or some morning hours
                    h_val = int(st.split(":")[0])
                    hash_val = abs(hash(f"{slot_id}"))
                    is_prebooked = False
                    if d == 0:
                        # Today: some morning and evening slots booked
                        if h_val in [8, 18, 19, 20] and (hash_val % 3 == 0):
                            is_prebooked = True
                    elif d == 1:
                        # Tomorrow: evening rush slots booked
                        if h_val in [19, 20] and (hash_val % 4 == 0):
                            is_prebooked = True
                    
                    booked_name = prebooked_names[hash_val % len(prebooked_names)] if is_prebooked else None
                    
                    slots.append({
                        "slot_id": slot_id,
                        "venue_id": venue["id"],
                        "court_id": court["court_id"],
                        "court_name": court["name"],
                        "sport": court["sport"],
                        "date": slot_date,
                        "start_time": st,
                        "end_time": et,
                        "base_price": base_price,
                        "dynamic_price": dynamic_price,
                        "discount_pct": discount_pct if not is_peak else 0,
                        "is_peak": is_peak,
                        "status": "booked" if is_prebooked else "available",
                        "booked_by": booked_name,
                        "booked_at": (datetime.utcnow() - timedelta(hours=3)).isoformat() if is_prebooked else None
                    })
    return slots

def generate_sample_squads():
    now = datetime.now()
    
    # Define realistic match schedule blueprints with relative time offsets from now
    squad_templates = [
        # 1. EMERGENCY SUB: Starts in ~35 mins! (Sindhu Bhavan Road, Bodakdev, Ahmedabad)
        {
            "offset_minutes": 35,
            "duration_hours": 1,
            "venue_id": "vn-003",
            "venue_name": "Sindhu Bhavan Sports Complex",
            "city": "Ahmedabad",
            "area": "Sindhu Bhavan Road (SBR)",
            "sport": "Cricket",
            "captain_name": "Rohan Sharma",
            "captain_phone": "+91 98251 12345",
            "subs_needed": 2,
            "subs_joined": 1,
            "base_price": 120.0,
            "skill_level": "Intermediate",
            "notes": "2 friends had urgent college work! Need 1 batter/all-rounder for high-voltage 7v7 Box Cricket under floodlights. Match starts in ~35 mins!",
            "players": [
                {"user_id": "p-1", "name": "Rohan Sharma (C)", "role": "Captain", "reliability_score": 105},
                {"user_id": "p-2", "name": "Harshil Dave", "role": "Player", "reliability_score": 98}
            ]
        },
        # 2. IMMINENT HIGH URGENCY: Starts in ~70 mins! (Infocity / Kudasan, Gandhinagar)
        {
            "offset_minutes": 70,
            "duration_hours": 1,
            "venue_id": "vn-001",
            "venue_name": "Apex Turf & Sports Arena",
            "city": "Gandhinagar",
            "area": "Infocity / Kudasan",
            "sport": "Football",
            "captain_name": "Aman Varma",
            "captain_phone": "+91 99090 56789",
            "subs_needed": 3,
            "subs_joined": 1,
            "base_price": 140.0,
            "skill_level": "All Levels",
            "notes": "5v5 Futsal friendly. Goalkeeper injured ankle! Need a keeper and 1 midfielder. Fresh energy drinks on captain!",
            "players": [
                {"user_id": "p-3", "name": "Aman Varma (C)", "role": "Captain", "reliability_score": 102},
                {"user_id": "p-4", "name": "Siddharth Jain", "role": "Player", "reliability_score": 95}
            ]
        },
        # 3. HIGH URGENCY: Starts in ~110 mins! (Prahlad Nagar, Ahmedabad)
        {
            "offset_minutes": 110,
            "duration_hours": 1,
            "venue_id": "vn-004",
            "venue_name": "Skyline Smashers Pickleball Club",
            "city": "Ahmedabad",
            "area": "Prahlad Nagar",
            "sport": "Pickleball",
            "captain_name": "Pooja Mehta",
            "captain_phone": "+91 97123 45678",
            "subs_needed": 1,
            "subs_joined": 0,
            "base_price": 150.0,
            "skill_level": "Casual / Intermediate",
            "notes": "Partner got stuck in SG Highway traffic! Need 1 doubles pickleball partner. Extra carbon-fiber paddle provided if you don't have one.",
            "players": [
                {"user_id": "p-5", "name": "Pooja Mehta (C)", "role": "Captain", "reliability_score": 100}
            ]
        },
        # 4. MODERATE URGENCY: Starts in ~160 mins (~2.5h) (PDPU / Bhaijipura, Gandhinagar)
        {
            "offset_minutes": 160,
            "duration_hours": 1,
            "venue_id": "vn-002",
            "venue_name": "Urban Kicks & Shuttle Hub",
            "city": "Gandhinagar",
            "area": "Bhaijipura / PDPU Road",
            "sport": "Badminton",
            "captain_name": "Jay Patel",
            "captain_phone": "+91 98980 11223",
            "subs_needed": 2,
            "subs_joined": 1,
            "base_price": 125.0,
            "skill_level": "Intermediate",
            "notes": "BWF wooden court doubles match. Need 1 player to complete 2v2 lineup. Quality Mavis 350 shuttles ready.",
            "players": [
                {"user_id": "p-6", "name": "Jay Patel (C)", "role": "Captain", "reliability_score": 104},
                {"user_id": "p-7", "name": "Kavya Shah", "role": "Player", "reliability_score": 99}
            ]
        },
        # 5. MODERATE DEMAND: Starts in ~230 mins (~3.8h) (Vastrapur / IIM Road, Ahmedabad)
        {
            "offset_minutes": 230,
            "duration_hours": 1,
            "venue_id": "vn-007",
            "venue_name": "Torero Futsal & Football Park",
            "city": "Ahmedabad",
            "area": "Vastrapur / IIM Road",
            "sport": "Football",
            "captain_name": "Mehul Desai",
            "captain_phone": "+91 97240 33445",
            "subs_needed": 2,
            "subs_joined": 0,
            "base_price": 130.0,
            "skill_level": "Intermediate / Competitive",
            "notes": "Fast-paced 5v5 turf cage match under LED lights. Great team chemistry, need 2 reliable outfield substitutes.",
            "players": [
                {"user_id": "p-8", "name": "Mehul Desai (C)", "role": "Captain", "reliability_score": 108}
            ]
        },
        # 6. TODAY LATE EVENING / NIGHT OWL: Starts in ~320 mins (~5.3h) (Sargasan, Gandhinagar)
        {
            "offset_minutes": 320,
            "duration_hours": 1,
            "venue_id": "vn-005",
            "venue_name": "The Pitch Box Cricket Arena",
            "city": "Gandhinagar",
            "area": "Sargasan Cross Roads",
            "sport": "Cricket",
            "captain_name": "Yash Trivedi",
            "captain_phone": "+91 98240 55667",
            "subs_needed": 3,
            "subs_joined": 1,
            "base_price": 110.0,
            "skill_level": "All Levels",
            "notes": "Enclosed box turf night clash. Hard tennis ball, 8-over innings. Looking for bowlers and aggressive batters!",
            "players": [
                {"user_id": "p-9", "name": "Yash Trivedi (C)", "role": "Captain", "reliability_score": 97},
                {"user_id": "p-10", "name": "Dhruv Parmar", "role": "Player", "reliability_score": 101}
            ]
        },
        # 7. TOMORROW MORNING EARLY BIRD: 07:00 AM (Sabarmati Riverfront, Ahmedabad)
        {
            "target_day_offset": 1,
            "fixed_start": "07:00",
            "fixed_end": "08:00",
            "venue_id": "vn-013",
            "venue_name": "Sabarmati Riverfront Multisport Hub",
            "city": "Ahmedabad",
            "area": "Riverfront West / Ashram Road",
            "sport": "Cricket",
            "captain_name": "Hardik Vyas",
            "captain_phone": "+91 98790 77889",
            "subs_needed": 2,
            "subs_joined": 0,
            "base_price": 100.0,
            "skill_level": "All Levels",
            "notes": "Early morning riverfront breeze match! Refreshing box cricket session before office hours. Ample parking.",
            "players": [
                {"user_id": "p-11", "name": "Hardik Vyas (C)", "role": "Captain", "reliability_score": 103}
            ]
        },
        # 8. TOMORROW MORNING: 08:30 AM (Sector 11, Gandhinagar)
        {
            "target_day_offset": 1,
            "fixed_start": "08:30",
            "fixed_end": "09:30",
            "venue_id": "vn-006",
            "venue_name": "KhelMahakumbh Olympic Badminton Academy",
            "city": "Gandhinagar",
            "area": "Sector 11 / CH Road",
            "sport": "Badminton",
            "captain_name": "Ananya Joshi",
            "captain_phone": "+91 98981 44556",
            "subs_needed": 1,
            "subs_joined": 0,
            "base_price": 120.0,
            "skill_level": "Intermediate",
            "notes": "Air-conditioned indoor arena, wooden suspended court. Need 1 singles or doubles practice partner.",
            "players": [
                {"user_id": "p-12", "name": "Ananya Joshi (C)", "role": "Captain", "reliability_score": 106}
            ]
        },
        # 9. TOMORROW PRIME EVENING: 07:00 PM (South Bopal, Ahmedabad)
        {
            "target_day_offset": 1,
            "fixed_start": "19:00",
            "fixed_end": "20:00",
            "venue_id": "vn-012",
            "venue_name": "Ace Shuttlers Badminton Arena",
            "city": "Ahmedabad",
            "area": "Bopal / South Bopal",
            "sport": "Badminton",
            "captain_name": "Kunal Rawal",
            "captain_phone": "+91 97140 88990",
            "subs_needed": 2,
            "subs_joined": 1,
            "base_price": 125.0,
            "skill_level": "All Levels",
            "notes": "Post-work stress buster shuttle games. Non-marking shoes mandatory on wooden court. Friendly crowd!",
            "players": [
                {"user_id": "p-13", "name": "Kunal Rawal (C)", "role": "Captain", "reliability_score": 100},
                {"user_id": "p-14", "name": "Pranav Bhatt", "role": "Player", "reliability_score": 96}
            ]
        },
        # 10. TOMORROW PRIME EVENING: 08:00 PM (GIFT City, Gandhinagar)
        {
            "target_day_offset": 1,
            "fixed_start": "20:00",
            "fixed_end": "21:00",
            "venue_id": "vn-008",
            "venue_name": "Dink Masters Pickleball Arena",
            "city": "Gandhinagar",
            "area": "GIFT City Knowledge Zone",
            "sport": "Pickleball",
            "captain_name": "Tanya Solanki",
            "captain_phone": "+91 99250 66778",
            "subs_needed": 2,
            "subs_joined": 0,
            "base_price": 135.0,
            "skill_level": "Beginner / Intermediate",
            "notes": "GIFT City tech professional group! 4-court rooftop setup. Come join us for rapid dinking rally rounds.",
            "players": [
                {"user_id": "p-15", "name": "Tanya Solanki (C)", "role": "Captain", "reliability_score": 104}
            ]
        },
        # 11. TOMORROW SUPER PEAK: 08:30 PM (Bodakdev, Ahmedabad)
        {
            "target_day_offset": 1,
            "fixed_start": "20:30",
            "fixed_end": "21:30",
            "venue_id": "vn-003",
            "venue_name": "Sindhu Bhavan Sports Complex",
            "city": "Ahmedabad",
            "area": "Sindhu Bhavan Road (SBR)",
            "sport": "Football",
            "captain_name": "Aarav Patel",
            "captain_phone": "+91 98250 99001",
            "subs_needed": 3,
            "subs_joined": 1,
            "base_price": 150.0,
            "skill_level": "Competitive 7v7",
            "notes": "Maracana Arena 7v7 match under stadium floodlights. Need 2 defensive midfielders or wingers.",
            "players": [
                {"user_id": "p-16", "name": "Aarav Patel (C)", "role": "Captain", "reliability_score": 110},
                {"user_id": "p-17", "name": "Manan Shah", "role": "Player", "reliability_score": 102}
            ]
        },
        # 12. TOMORROW NIGHT OWL: 09:30 PM (Sector 21, Gandhinagar)
        {
            "target_day_offset": 1,
            "fixed_start": "21:30",
            "fixed_end": "22:30",
            "venue_id": "vn-014",
            "venue_name": "Nexus Multisport & Box Turf",
            "city": "Gandhinagar",
            "area": "Sector 21 / Gh-Road",
            "sport": "Cricket",
            "captain_name": "Bhavin Prajapati",
            "captain_phone": "+91 98791 22334",
            "subs_needed": 2,
            "subs_joined": 0,
            "base_price": 105.0,
            "skill_level": "Intermediate",
            "notes": "Late night floodlit box cricket tournament prep. Good bowling lineup, need 2 reliable fielders/batters.",
            "players": [
                {"user_id": "p-18", "name": "Bhavin Prajapati (C)", "role": "Captain", "reliability_score": 99}
            ]
        },
        # 13. DAY AFTER TOMORROW: 07:00 PM (Riverfront West, Ahmedabad)
        {
            "target_day_offset": 2,
            "fixed_start": "19:00",
            "fixed_end": "20:00",
            "venue_id": "vn-013",
            "venue_name": "Sabarmati Riverfront Multisport Hub",
            "city": "Ahmedabad",
            "area": "Riverfront West / Ashram Road",
            "sport": "Pickleball",
            "captain_name": "Divya Merchant",
            "captain_phone": "+91 97120 55443",
            "subs_needed": 1,
            "subs_joined": 0,
            "base_price": 130.0,
            "skill_level": "All Levels",
            "notes": "Sunset pickleball match next to the Sabarmati river. Great view and breeze, looking for doubles partner.",
            "players": [
                {"user_id": "p-19", "name": "Divya Merchant (C)", "role": "Captain", "reliability_score": 101}
            ]
        },
        # 14. DAY AFTER TOMORROW: 08:00 PM (Infocity / Kudasan, Gandhinagar)
        {
            "target_day_offset": 2,
            "fixed_start": "20:00",
            "fixed_end": "21:00",
            "venue_id": "vn-001",
            "venue_name": "Apex Turf & Sports Arena",
            "city": "Gandhinagar",
            "area": "Infocity / Kudasan",
            "sport": "Cricket",
            "captain_name": "Chirag Soni",
            "captain_phone": "+91 98989 33221",
            "subs_needed": 2,
            "subs_joined": 1,
            "base_price": 120.0,
            "skill_level": "All Levels",
            "notes": "Weekend kickoff box cricket match. High energy, friendly banter, snacks after the game on captain!",
            "players": [
                {"user_id": "p-20", "name": "Chirag Soni (C)", "role": "Captain", "reliability_score": 103},
                {"user_id": "p-21", "name": "Devansh Modi", "role": "Player", "reliability_score": 97}
            ]
        }
    ]

    squads = []
    for idx, tmpl in enumerate(squad_templates):
        s_id = f"SQ-{abs(hash(f'{tmpl['venue_id']}_{idx}_{tmpl['sport']}')) % 1000000:06X}"
        b_id = f"BK-SQ{idx+1:03d}"

        if "offset_minutes" in tmpl:
            # Synced dynamically from current time today
            match_start = now + timedelta(minutes=tmpl["offset_minutes"])
            match_end = match_start + timedelta(hours=tmpl.get("duration_hours", 1))
            date_str = match_start.strftime("%Y-%m-%d")
            st_str = match_start.strftime("%H:%M")
            et_str = match_end.strftime("%H:%M")
        else:
            # Future day with fixed time
            target_date = (now + timedelta(days=tmpl["target_day_offset"])).date()
            date_str = target_date.strftime("%Y-%m-%d")
            st_str = tmpl["fixed_start"]
            et_str = tmpl["fixed_end"]

        squads.append({
            "id": s_id,
            "booking_id": b_id,
            "venue_id": tmpl["venue_id"],
            "venue_name": tmpl["venue_name"],
            "city": tmpl["city"],
            "area": tmpl["area"],
            "sport": tmpl["sport"],
            "date": date_str,
            "start_time": st_str,
            "end_time": et_str,
            "time_slot": f"{st_str} - {et_str}",
            "captain_name": tmpl["captain_name"],
            "captain_phone": tmpl["captain_phone"],
            "subs_needed": tmpl["subs_needed"],
            "subs_joined": tmpl["subs_joined"],
            "base_price": tmpl["base_price"],
            "per_person_share": tmpl["base_price"],
            "skill_level": tmpl["skill_level"],
            "notes": tmpl["notes"],
            "status": "open",
            "players": tmpl["players"],
            "created_at": (now - timedelta(minutes=random.randint(10, 120))).isoformat() + "Z"
        })

    return squads

def seed_hdfs_historical_logs(count=350):
    """Generates synthetic historical events across 3 days into HDFS partition folders for MapReduce batch jobs"""
    sports = ["Cricket", "Football", "Badminton", "Pickleball"]
    event_types = ["VENUE_SEARCH", "SLOT_SELECTED", "BOOKING_CONFIRMED", "BOOKING_CANCELLED", "SUB_REQUEST"]
    weights = [0.45, 0.25, 0.20, 0.05, 0.05]
    
    today = datetime.utcnow().date()
    for day_offset in range(3):
        cur_date = today - timedelta(days=day_offset)
        date_str = cur_date.strftime("%Y-%m-%d")
        dir_path = os.path.join(settings.HDFS_LAKE_PATH, f"partition_date={date_str}")
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, "events.json")
        
        events = []
        for i in range(count // 3):
            etype = random.choices(event_types, weights=weights)[0]
            v = random.choice(SAMPLE_VENUES)
            sport = random.choice(v["sports"])
            hour = random.choice(range(6, 24))
            minute = random.choice(range(0, 60))
            ts = f"{date_str}T{hour:02d}:{minute:02d}:00Z"
            
            amount = 0.0
            if etype == "BOOKING_CONFIRMED":
                amount = random.choice([500, 600, 850, 1000, 1200, 1500])
                
            events.append({
                "event_id": f"hist-{cur_date}-{i}",
                "event_type": etype,
                "timestamp": ts,
                "user_id": f"user_{random.randint(100, 150)}",
                "venue_id": v["id"],
                "venue_name": v["name"],
                "sport": sport,
                "hour": hour,
                "amount": amount,
                "payload": {"is_peak": (17 <= hour <= 22)}
            })
            
        with open(file_path, "w", encoding="utf-8") as f:
            for ev in events:
                f.write(json.dumps(ev) + "\n")
