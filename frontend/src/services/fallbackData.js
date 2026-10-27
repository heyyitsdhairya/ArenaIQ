// ==============================================================================
// Client-Side Offline Fallback Data for GitHub Pages Deployment
// Enables 100% interactive discovery, slot booking, and partner management
// even when running statically without an active backend server.
// ==============================================================================

export const FALLBACK_VENUES = [
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
    "verified": true,
    "image_url": "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60",
    "amenities": ["Floodlights", "Locker Room", "Free Parking", "Rental Bats & Balls", "Cafeteria", "Changing Shower"],
    "courts": [
      { "court_id": "c-01", "name": "Lord's Pitch (Box Cricket)", "sport": "Cricket", "surface": "FIFA Grade 50mm AstroTurf", "default_price": 1200 },
      { "court_id": "c-02", "name": "Camp Nou Futsal Cage", "sport": "Football", "surface": "Shock-Absorbing Rubber Infill", "default_price": 1400 },
      { "court_id": "c-03", "name": "Pickle Pro Court 1", "sport": "Pickleball", "surface": "Cushioned Acrylic", "default_price": 600 }
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
    "verified": true,
    "image_url": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60",
    "amenities": ["Air Conditioned Lounge", "Yonex Stringing", "BWF Wooden Floors", "Shower Rooms", "EV Charging"],
    "courts": [
      { "court_id": "c-04", "name": "All-England Court A", "sport": "Badminton", "surface": "Maple Hardwood + Yonex Mat", "default_price": 500 },
      { "court_id": "c-05", "name": "All-England Court B", "sport": "Badminton", "surface": "Maple Hardwood + Yonex Mat", "default_price": 500 },
      { "court_id": "c-06", "name": "Rooftop Cricket Net", "sport": "Cricket", "surface": "High-Density Turf", "default_price": 1000 }
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
    "verified": true,
    "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60",
    "amenities": ["VIP Lounge", "Digital Scoreboard", "Live Match Streaming", "Physio On-Call", "Starbucks Kiosk"],
    "courts": [
      { "court_id": "c-07", "name": "Maracana Arena (7v7)", "sport": "Football", "surface": "European Monofilament Turf", "default_price": 1800 },
      { "court_id": "c-08", "name": "Eden Gardens Cage", "sport": "Cricket", "surface": "Bounce-Optimized AstroTurf", "default_price": 1500 },
      { "court_id": "c-09", "name": "Wimbledon Glass Court", "sport": "Pickleball", "surface": "Pro Cushion 8-Layer", "default_price": 750 }
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
    "verified": true,
    "image_url": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=60",
    "amenities": ["Paddle Rentals", "Coaching Clinics", "Spectator Bleachers", "Juice Bar", "Free WiFi"],
    "courts": [
      { "court_id": "c-10", "name": "Center Court 1", "sport": "Pickleball", "surface": "DecoTurf Tournament Blue", "default_price": 600 },
      { "court_id": "c-11", "name": "Center Court 2", "sport": "Pickleball", "surface": "DecoTurf Tournament Blue", "default_price": 600 }
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
    "verified": true,
    "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60",
    "amenities": ["Floodlights", "Automated Bowling Machine", "Dugout Seating", "Cricket Gear Rental", "Chilled Beverages"],
    "courts": [
      { "court_id": "c-13", "name": "Melbourne MCG Box Pitch", "sport": "Cricket", "surface": "65mm High-Shock AstroTurf", "default_price": 1100 },
      { "court_id": "c-14", "name": "Lord's Pavilion Cage", "sport": "Cricket", "surface": "High-Tension Roof Net & Turf", "default_price": 1200 }
    ]
  },
  {
    "id": "vn-006",
    "name": "Vastrapur Champions Futsal Turf",
    "tagline": "Premium 5v5 & 7v7 Football Turf with LED Stadium Lights",
    "sports": ["Football"],
    "city": "Ahmedabad",
    "area": "Vastrapur / IIM Road",
    "address": "Near AlphaOne Mall, Vastrapur Lake Road, Ahmedabad 380015",
    "rating": 4.92,
    "total_reviews": 340,
    "verified": true,
    "image_url": "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60",
    "amenities": ["Floodlights", "Referee on Call", "Shower Facilities", "Sports Nutrition Counter", "Ample Parking"],
    "courts": [
      { "court_id": "c-15", "name": "Santiago Bernabeu Pitch", "sport": "Football", "surface": "FIFA Quality Pro Synthetic", "default_price": 1600 }
    ]
  }
];

export function generateFallbackSlots(venueId, dateStr) {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const venue = FALLBACK_VENUES.find(v => v.id === venueId) || FALLBACK_VENUES[0];
  const slots = [];

  venue.courts.forEach(court => {
    for (let hour = 6; hour < 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const isPeak = hour >= 18 && hour <= 22;
      const isOffPeak = hour >= 11 && hour <= 16;
      
      let price = court.default_price;
      if (isOffPeak) price = Math.round(price * 0.65);
      else if (isPeak) price = Math.round(price * 1.25);

      slots.push({
        slot_id: `sl-${venueId}-${court.court_id}-${targetDate}-${startTime.replace(':', '')}`,
        venue_id: venueId,
        court_id: court.court_id,
        court_name: court.name,
        sport: court.sport,
        date: targetDate,
        start_time: startTime,
        end_time: endTime,
        base_price: court.default_price,
        current_price: price,
        is_peak: isPeak,
        is_discounted: isOffPeak,
        discount_percentage: isOffPeak ? 35 : 0,
        status: hour % 4 === 0 ? "booked" : "available"
      });
    }
  });

  return { venue_id: venueId, date: targetDate, slots };
}

export const FALLBACK_SQUADS = [
  {
    id: "SQ-074996",
    booking_id: "BK-SQ001",
    venue_id: "vn-003",
    venue_name: "Sindhu Bhavan Sports Complex",
    city: "Ahmedabad",
    area: "Sindhu Bhavan Road (SBR)",
    sport: "Cricket",
    date: new Date().toISOString().split('T')[0],
    time_slot: "20:00 - 21:00",
    start_time: "20:00",
    end_time: "21:00",
    captain_name: "Rohan Sharma",
    captain_phone: "+91 98251 12345",
    subs_needed: 2,
    subs_joined: 1,
    base_price: 120.0,
    per_person_share: 120.0,
    skill_level: "Intermediate",
    notes: "2 friends had urgent college work! Need 1 batter/all-rounder for high-voltage 7v7 Box Cricket under floodlights.",
    status: "open",
    players: [
      { user_id: "p-1", name: "Rohan Sharma (C)", role: "Captain", reliability_score: 105 },
      { user_id: "p-2", name: "Harshil Dave", role: "Player", reliability_score: 98 }
    ],
    urgency_level: "emergency",
    urgency_label: "🚨 Emergency Sub (~45m left)",
    current_dynamic_price: 120.0
  },
  {
    id: "SQ-082143",
    booking_id: "BK-SQ002",
    venue_id: "vn-001",
    venue_name: "Apex Turf & Sports Arena",
    city: "Gandhinagar",
    area: "Infocity / Kudasan",
    sport: "Football",
    date: new Date().toISOString().split('T')[0],
    time_slot: "21:00 - 22:00",
    start_time: "21:00",
    end_time: "22:00",
    captain_name: "Aman Varma",
    captain_phone: "+91 99090 56789",
    subs_needed: 3,
    subs_joined: 1,
    base_price: 140.0,
    per_person_share: 140.0,
    skill_level: "All Levels",
    notes: "5v5 Futsal friendly. Goalkeeper injured ankle! Need a keeper and 1 midfielder. Fresh energy drinks on captain!",
    status: "open",
    players: [
      { user_id: "p-3", name: "Aman Varma (C)", role: "Captain", reliability_score: 102 },
      { user_id: "p-4", name: "Siddharth Jain", role: "Player", reliability_score: 95 }
    ],
    urgency_level: "high",
    urgency_label: "⚡ Urgent Sub (~90m left)",
    current_dynamic_price: 140.0
  }
];

export const FALLBACK_HEALTH = {
  status: "healthy",
  lambda_architecture: {
    operational_db: { name: "MongoDB", status: "online (client-side simulation)", database: "arenaiq" },
    stream_ingestion: { name: "Apache Kafka", status: "speed_layer_active", topics: ["arenaiq.bookings", "arenaiq.user-activity", "arenaiq.telemetry"] },
    cold_storage: { name: "Hadoop HDFS Lake", status: "ready", total_partitions: 7, total_events_archived: 854 },
    batch_processing: { name: "Hadoop MapReduce (Python Streaming)", status: "ready", jobs: ["demand_hourly_heatmap", "price_elasticity_curve", "player_reliability_audit"] }
  }
};

export const FALLBACK_REALTIME = {
  speed_layer: {
    active_venues_monitored: 14,
    total_slots_monitored: 1287,
    live_sub_broadcasts: 2,
    today_confirmed_bookings: 18,
    today_revenue_tracked: 24650,
    peak_hours_active: true,
    off_peak_discount_rate: "35% OFF",
    speed_layer_throughput: "42 msgs/sec",
    active_simulated_users: 124
  },
  recent_kafka_stream: [
    { event_type: "BOOKING_CONFIRMED", venue_name: "Apex Turf & Sports Arena", sport: "Cricket", amount: 1200, timestamp: new Date().toISOString() },
    { event_type: "SUB_REQUEST", venue_name: "Sindhu Bhavan Sports Complex", sport: "Football", amount: 140, timestamp: new Date().toISOString() },
    { event_type: "SLOT_VIEWED", venue_name: "Urban Kicks & Shuttle Hub", sport: "Badminton", amount: 0, timestamp: new Date().toISOString() }
  ],
  total_emitted_since_boot: 854
};
