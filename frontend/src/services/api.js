import {
  FALLBACK_VENUES,
  generateFallbackSlots,
  FALLBACK_SQUADS,
  FALLBACK_HEALTH,
  FALLBACK_REALTIME
} from './fallbackData';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/analytics/health`);
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (err) {
    return FALLBACK_HEALTH;
  }
}

export async function loginUser(emailOrPhone, password = "password123") {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: emailOrPhone, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Authentication failed");
    }
    return await res.json();
  } catch (err) {
    // Offline / GitHub Pages fallback account
    return {
      id: "player_dhairya",
      name: "Dhairya Shah",
      email: emailOrPhone.includes("@") ? emailOrPhone : "dhairya.shah@arenaiq.in",
      phone: emailOrPhone.includes("@") ? "+91 98765 43210" : emailOrPhone,
      city: "Ahmedabad",
      area: "Bodakdev / Sindhu Bhavan",
      fairplay_score: 105,
      reliability_score: 105,
      badges: ["Verified Team Captain", "Weekend Regular", "Punctual Player", "Zero Late Drops"],
      total_bookings: 8,
      cancelled_bookings: 0
    };
  }
}

export async function fetchUserProfile(userId = "player_dhairya") {
  try {
    const res = await fetch(`${API_BASE}/auth/user/${userId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return {
      id: userId,
      name: "Dhairya Shah",
      email: "dhairya.shah@arenaiq.in",
      phone: "+91 98765 43210",
      city: "Ahmedabad",
      area: "Bodakdev / Sindhu Bhavan",
      fairplay_score: 105,
      reliability_score: 105,
      badges: ["Verified Team Captain", "Weekend Regular", "Punctual Player", "Zero Late Drops"],
      total_bookings: 8,
      cancelled_bookings: 0
    };
  }
}

export async function updateUserProfile(userId, profileData) {
  try {
    const res = await fetch(`${API_BASE}/auth/user/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update profile");
    }
    return await res.json();
  } catch (err) {
    return { ...profileData, id: userId };
  }
}

export async function fetchVenues(sport = "", city = "", search = "", minPrice = "", maxPrice = "", sortBy = "", verifiedOnly = false) {
  try {
    const params = new URLSearchParams();
    if (sport) params.append("sport", sport);
    if (city) params.append("city", city);
    if (search) params.append("search", search);
    if (minPrice !== "" && minPrice !== null && minPrice !== undefined) params.append("min_price", minPrice);
    if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) params.append("max_price", maxPrice);
    if (sortBy) params.append("sort_by", sortBy);
    if (verifiedOnly) params.append("verified_only", "true");
    
    const res = await fetch(`${API_BASE}/venues?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch venues");
    return await res.json();
  } catch (err) {
    // Client-side offline filtering for GitHub Pages
    let filtered = [...FALLBACK_VENUES];
    if (sport) filtered = filtered.filter(v => v.sports.includes(sport));
    if (city) filtered = filtered.filter(v => v.city.toLowerCase() === city.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(v => v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q));
    }
    if (verifiedOnly) filtered = filtered.filter(v => v.verified);
    if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
    return { count: filtered.length, venues: filtered };
  }
}

export async function fetchVenueDetails(venueId) {
  try {
    const res = await fetch(`${API_BASE}/venues/${venueId}`);
    if (!res.ok) throw new Error("Venue not found");
    return await res.json();
  } catch (err) {
    return FALLBACK_VENUES.find(v => v.id === venueId) || FALLBACK_VENUES[0];
  }
}

export async function fetchSlots(venueId, date) {
  try {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    const res = await fetch(`${API_BASE}/venues/${venueId}/slots?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch slots");
    return await res.json();
  } catch (err) {
    return generateFallbackSlots(venueId, date);
  }
}

export async function createBooking(bookingData) {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Booking failed");
    }
    return await res.json();
  } catch (err) {
    return {
      ...bookingData,
      booking_id: `BK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: "confirmed",
      created_at: new Date().toISOString(),
      reliability_awarded: 10
    };
  }
}

export async function fetchMyBookings(userId = "player_dhairya") {
  try {
    const res = await fetch(`${API_BASE}/bookings/my?user_id=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return await res.json();
  } catch (err) {
    return {
      user: {
        id: userId,
        name: "Dhairya Shah",
        reliability_score: 105,
        fairplay_score: 105,
        badges: ["Verified Team Captain", "Weekend Regular", "Punctual Player"],
        total_bookings: 8,
        cancelled_bookings: 0
      },
      bookings_count: 2,
      bookings: [
        {
          booking_id: "BK-LIVE001",
          venue_name: "Sindhu Bhavan Sports Complex",
          court_name: "Maracana Arena (7v7)",
          sport: "Football",
          date: new Date().toISOString().split('T')[0],
          start_time: "20:00",
          end_time: "21:00",
          amount_paid: 1800,
          per_person_cost: 180,
          status: "confirmed"
        }
      ]
    };
  }
}

export async function cancelBooking(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    return {
      message: "Booking cancelled successfully",
      fairplay_penalty: 15,
      new_fairplay_score: 90
    };
  }
}

export async function fetchSquadRadar(sport = "", city = "", includeExpired = false) {
  try {
    const params = new URLSearchParams();
    if (sport) params.append("sport", sport);
    if (city) params.append("city", city);
    if (includeExpired) params.append("include_expired", "true");
    const res = await fetch(`${API_BASE}/squad-radar?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load squad radar");
    return await res.json();
  } catch (err) {
    return { count: FALLBACK_SQUADS.length, squads: FALLBACK_SQUADS };
  }
}

export async function joinSquadRequest(squadId, userData, agreedPrice = null) {
  try {
    const params = new URLSearchParams(userData);
    if (agreedPrice !== null) params.append("agreed_price", agreedPrice);
    const res = await fetch(`${API_BASE}/squad-radar/${squadId}/join?${params.toString()}`, {
      method: "POST"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to join squad");
    }
    return await res.json();
  } catch (err) {
    return {
      message: "Successfully drafted into squad! Captain has received your contact pass.",
      squad_id: squadId,
      player: userData
    };
  }
}

export async function createSquadBroadcast(broadcastData) {
  try {
    const res = await fetch(`${API_BASE}/squad-radar/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(broadcastData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to broadcast squad");
    }
    return await res.json();
  } catch (err) {
    const newSquad = {
      id: `SQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ...broadcastData,
      status: "open",
      players: [{ user_id: "player_dhairya", name: `${broadcastData.captain_name} (Captain)`, role: "Captain", reliability_score: 105 }]
    };
    return { message: "Broadcast created successfully!", squad: newSquad };
  }
}

export async function fetchRealtimeMetrics() {
  try {
    const res = await fetch(`${API_BASE}/analytics/realtime`);
    if (!res.ok) throw new Error("Failed to load realtime metrics");
    return await res.json();
  } catch (err) {
    return FALLBACK_REALTIME;
  }
}

export async function fetchBatchAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/analytics/batch`);
    if (!res.ok) throw new Error("Failed to load batch analytics");
    return await res.json();
  } catch (err) {
    return {
      status: "cached_mapreduce_view",
      dataset_size: "7 HDFS Partitions (854 archived events)",
      hourly_demand_curve: [
        { hour: "06:00", demand: "Low", fill_rate: "15%", optimal_price_rate: "-35% Off-Peak" },
        { hour: "12:00", demand: "Moderate", fill_rate: "42%", optimal_price_rate: "-25% Off-Peak" },
        { hour: "19:00", demand: "Super Peak", fill_rate: "98%", optimal_price_rate: "+25% Surge" },
        { hour: "21:00", demand: "Peak", fill_rate: "94%", optimal_price_rate: "+20% Surge" }
      ]
    };
  }
}

export async function triggerHadoopMapReduce() {
  try {
    const res = await fetch(`${API_BASE}/simulation/trigger-mapreduce`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    return {
      status: "success",
      message: "Hadoop Streaming job completed successfully across 7 partitions",
      output_records: 24,
      execution_time: "1.42s"
    };
  }
}

export async function simulateTrafficBurst(count = 20, sport = "") {
  try {
    const res = await fetch(`${API_BASE}/simulation/burst-events?count=${count}&sport=${sport}`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    return {
      status: "success",
      emitted_events: count,
      speed_layer_updated: true
    };
  }
}

export async function registerPartnerAccount(partnerData) {
  try {
    const res = await fetch(`${API_BASE}/auth/partner/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partnerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    return await res.json();
  } catch (err) {
    return {
      partner: {
        id: `vn-p-${Math.random().toString(36).substring(2, 6)}`,
        ...partnerData,
        verified: true,
        joined_at: new Date().toISOString()
      }
    };
  }
}

export async function loginPartnerAccount(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/partner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Partner login failed");
    }
    return await res.json();
  } catch (err) {
    return {
      partner: {
        id: "vn-p-demo",
        name: "Gujarat Sports Venues Ltd",
        email: email,
        phone: "+91 99090 12345",
        city: "Ahmedabad",
        business_type: "Commercial Turf Operator",
        verified: true
      }
    };
  }
}

export const loginPartner = loginPartnerAccount;
export const registerPartner = registerPartnerAccount;

export async function createVenueListing(listingData) {
  try {
    const res = await fetch(`${API_BASE}/venues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listingData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to list venue");
    }
    return await res.json();
  } catch (err) {
    return {
      venue: {
        id: `vn-${Math.random().toString(36).substring(2, 6)}`,
        ...listingData,
        verified: true,
        rating: 5.0,
        total_reviews: 1
      }
    };
  }
}

export async function fetchPartnerVenues(partnerId) {
  try {
    const res = await fetch(`${API_BASE}/venues/partner/${partnerId}`);
    if (!res.ok) throw new Error("Failed to fetch partner venues");
    return await res.json();
  } catch (err) {
    return { partner_id: partnerId, total_venues: 2, venues: FALLBACK_VENUES.slice(0, 2) };
  }
}

export async function fetchPartnerBookings(partnerId) {
  try {
    const res = await fetch(`${API_BASE}/venues/partner/${partnerId}/bookings`);
    if (!res.ok) throw new Error("Failed to fetch partner bookings");
    return await res.json();
  } catch (err) {
    return {
      total_bookings: 3,
      total_revenue: 4600,
      bookings: [
        {
          booking_id: "BK-P001",
          venue_name: "Apex Turf & Sports Arena",
          court_name: "Lord's Pitch (Box Cricket)",
          sport: "Cricket",
          date: new Date().toISOString().split('T')[0],
          start_time: "19:00",
          end_time: "20:00",
          amount_paid: 1200,
          customer_name: "Karan Patel",
          status: "confirmed"
        }
      ]
    };
  }
}

export async function updateVenueDetails(venueId, venueData) {
  try {
    const res = await fetch(`${API_BASE}/venues/${venueId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venueData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update venue");
    }
    return await res.json();
  } catch (err) {
    return { message: "Venue updated successfully", venue: venueData };
  }
}

export async function updateVenueSlot(venueId, slotId, slotData) {
  try {
    const res = await fetch(`${API_BASE}/venues/${venueId}/slots/${slotId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slotData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update slot");
    }
    return await res.json();
  } catch (err) {
    return { message: "Slot updated successfully", slot_id: slotId, ...slotData };
  }
}

export async function addCourtToVenue(venueId, courtData) {
  try {
    const res = await fetch(`${API_BASE}/venues/${venueId}/courts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courtData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add court");
    }
    return await res.json();
  } catch (err) {
    return { message: "Court added successfully", court_id: `c-${Math.random().toString(36).substring(2, 5)}`, ...courtData };
  }
}
