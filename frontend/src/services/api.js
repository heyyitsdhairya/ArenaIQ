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

// Client-Side Registered User Store (for offline / GitHub Pages persistence)
export function getClientRegisteredUsers() {
  try {
    const saved = localStorage.getItem('arenaiq_client_users');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveClientRegisteredUser(user) {
  try {
    const users = getClientRegisteredUsers();
    const filtered = users.filter(u => u.id !== user.id && u.email !== user.email);
    filtered.push(user);
    localStorage.setItem('arenaiq_client_users', JSON.stringify(filtered));
  } catch (e) {}
}

export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    saveClientRegisteredUser(data.user);
    return data;
  } catch (err) {
    if (err.message && !err.message.includes("fetch") && !err.message.includes("Failed to fetch") && !err.message.includes("Network")) {
      throw err;
    }
    // Offline / GitHub Pages fallback registration
    const userId = `player_${Math.random().toString(36).substring(2, 9)}`;
    const localUser = {
      id: userId,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone.trim(),
      city: userData.city || "Ahmedabad",
      area: userData.area || "Bodakdev",
      skill_tier: "Tournament / Intermediate Tier",
      bio: `Registered player from ${userData.city || 'Ahmedabad'}.`,
      favorite_sports: userData.favorite_sports || ["Cricket", "Football"],
      playing_positions: { Cricket: "All-Rounder", Football: "Midfielder" },
      fairplay_score: 100,
      reliability_score: 100,
      badges: ["Verified Player", "New Member", "Punctual Player"],
      total_bookings: 0,
      cancelled_bookings: 0,
      registered_at: new Date().toISOString()
    };
    saveClientRegisteredUser(localUser);
    return {
      status: "registered",
      message: `Welcome ${localUser.name}! Account created successfully.`,
      token: `bearer_${userId}_token`,
      user: localUser
    };
  }
}

export async function loginUser(emailOrPhone, password = "password123") {
  const query = (emailOrPhone || "").trim().toLowerCase();
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: emailOrPhone, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Authentication failed");
    }
    const data = await res.json();
    saveClientRegisteredUser(data.user);
    return data;
  } catch (err) {
    // If server responded with a genuine 404/401/400 error, preserve the error message!
    if (err.message && !err.message.includes("fetch") && !err.message.includes("Failed to fetch") && !err.message.includes("Network")) {
      throw err;
    }
    // Offline / GitHub Pages mode: search in genuinely registered client users
    const clientUsers = getClientRegisteredUsers();
    const found = clientUsers.find(u => 
      u.email?.toLowerCase() === query || 
      u.phone?.replace(/\s+/g, '') === query.replace(/\s+/g, '') ||
      u.id === query
    );
    if (found) {
      return { status: "authenticated", user: found, token: `bearer_${found.id}_token` };
    }
    throw new Error(`No registered account found for "${emailOrPhone}". Please complete compulsory registration first.`);
  }
}

export async function logoutUser(user) {
  if (!user) return;
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        name: user.name || "Player",
        email: user.email || "",
        role: "player"
      })
    });
  } catch (e) {
    // Graceful offline ignore
  }
}

export async function fetchAdminUsers() {
  try {
    const res = await fetch(`${API_BASE}/auth/admin/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  } catch (e) {
    const clientUsers = getClientRegisteredUsers();
    return { database: "local_storage", count: clientUsers.length, users: clientUsers };
  }
}

export async function fetchAdminAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/auth/admin/logs`);
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return await res.json();
  } catch (e) {
    return { database: "local_storage", count: 0, logs: [] };
  }
}

export async function fetchUserProfile(userId) {
  if (!userId) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/user/${userId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    const clientUsers = getClientRegisteredUsers();
    const found = clientUsers.find(u => u.id === userId);
    return found || null;
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
    const data = await res.json();
    if (data.user) saveClientRegisteredUser(data.user);
    return data;
  } catch (err) {
    const updated = { ...profileData, id: userId };
    saveClientRegisteredUser(updated);
    return { status: "updated", user: updated };
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

export function getClientBookings() {
  try {
    const saved = localStorage.getItem('arenaiq_client_bookings');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveClientBooking(booking) {
  try {
    const list = getClientBookings();
    list.unshift(booking);
    localStorage.setItem('arenaiq_client_bookings', JSON.stringify(list));
  } catch (e) {}
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
    const data = await res.json();
    saveClientBooking(data);
    return data;
  } catch (err) {
    const fallbackBooking = {
      ...bookingData,
      booking_id: `BK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: "confirmed",
      created_at: new Date().toISOString(),
      reliability_awarded: 10
    };
    saveClientBooking(fallbackBooking);
    return fallbackBooking;
  }
}

export async function fetchMyBookings(userId = "") {
  if (!userId) return { user: null, bookings_count: 0, bookings: [] };
  try {
    const res = await fetch(`${API_BASE}/bookings/my?user_id=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return await res.json();
  } catch (err) {
    // Offline / GitHub Pages fallback: only return bookings made by this specific user
    const local = getClientBookings().filter(b => b.user_id === userId);
    return {
      user: {
        id: userId,
        total_bookings: local.length,
        cancelled_bookings: 0
      },
      bookings_count: local.length,
      bookings: local
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
      players: [{ user_id: broadcastData.captain_id || "player_captain", name: `${broadcastData.captain_name} (Captain)`, role: "Captain", reliability_score: 100 }]
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
