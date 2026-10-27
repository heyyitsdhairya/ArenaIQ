const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/analytics/health`);
  return res.json();
}

export async function loginUser(emailOrPhone, password = "password123") {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email_or_phone: emailOrPhone, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Authentication failed");
  }
  return res.json();
}

export async function fetchUserProfile(userId = "player_dhairya") {
  const res = await fetch(`${API_BASE}/auth/user/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateUserProfile(userId, profileData) {
  const res = await fetch(`${API_BASE}/auth/user/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update profile");
  }
  return res.json();
}

export async function fetchVenues(sport = "", city = "", search = "", minPrice = "", maxPrice = "", sortBy = "", verifiedOnly = false) {
  const params = new URLSearchParams();
  if (sport) params.append("sport", sport);
  if (city) params.append("city", city);
  if (search) params.append("search", search);
  if (minPrice !== "" && minPrice !== null && minPrice !== undefined) params.append("min_price", minPrice);
  if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) params.append("max_price", maxPrice);
  if (sortBy) params.append("sort_by", sortBy);
  if (verifiedOnly) params.append("verified_only", "true");
  const res = await fetch(`${API_BASE}/venues?${params.toString()}`);
  return res.json();
}

export async function fetchVenueDetails(venueId) {
  const res = await fetch(`${API_BASE}/venues/${venueId}`);
  return res.json();
}

export async function fetchSlots(venueId, date) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  const res = await fetch(`${API_BASE}/venues/${venueId}/slots?${params.toString()}`);
  return res.json();
}

export async function createBooking(bookingData) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Booking failed");
  }
  return res.json();
}

export async function fetchMyBookings(userId = "player_dhairya") {
  const res = await fetch(`${API_BASE}/bookings/my?user_id=${userId}`);
  return res.json();
}

export async function cancelBooking(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchSquadRadar(sport = "", city = "", includeExpired = false) {
  const params = new URLSearchParams();
  if (sport) params.append("sport", sport);
  if (city) params.append("city", city);
  if (includeExpired) params.append("include_expired", "true");
  const res = await fetch(`${API_BASE}/squad-radar?${params.toString()}`);
  return res.json();
}

export async function joinSquadRequest(squadId, userData, agreedPrice = null) {
  const params = new URLSearchParams(userData);
  if (agreedPrice) params.append("agreed_price", agreedPrice);
  const res = await fetch(`${API_BASE}/squad-radar/${squadId}/join?${params.toString()}`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to join squad");
  }
  return res.json();
}

export async function createSquadBroadcast(squadData) {
  const res = await fetch(`${API_BASE}/squad-radar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(squadData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to broadcast squad request");
  }
  return res.json();
}

export async function fetchRealtimeMetrics() {
  const res = await fetch(`${API_BASE}/analytics/realtime`);
  return res.json();
}

export async function fetchBatchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/batch`);
  return res.json();
}

export async function simulateTrafficBurst(count = 50, sport = "") {
  const params = new URLSearchParams({ count });
  if (sport) params.append("sport", sport);
  const res = await fetch(`${API_BASE}/simulate/traffic?${params.toString()}`, {
    method: "POST"
  });
  return res.json();
}

export async function triggerHadoopMapReduce() {
  const res = await fetch(`${API_BASE}/simulate/mapreduce`, {
    method: "POST"
  });
  return res.json();
}

// =========================================================================
// VENUE PARTNER DEDICATED APIS
// =========================================================================

export async function loginPartner(emailOrPhone, password = "partner123") {
  const res = await fetch(`${API_BASE}/auth/partner/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email_or_phone: emailOrPhone, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Partner authentication failed");
  }
  return res.json();
}

export async function registerPartner(partnerData) {
  const res = await fetch(`${API_BASE}/auth/partner/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partnerData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Partner registration failed");
  }
  return res.json();
}

export async function fetchPartners() {
  const res = await fetch(`${API_BASE}/auth/partners`);
  return res.json();
}

export async function fetchPartnerProfile(partnerId) {
  const res = await fetch(`${API_BASE}/auth/partner/${partnerId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createVenueListing(venueData) {
  const res = await fetch(`${API_BASE}/venues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(venueData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to list venue");
  }
  return res.json();
}

export async function fetchPartnerVenues(partnerId) {
  const res = await fetch(`${API_BASE}/venues/partner/${partnerId}`);
  return res.json();
}

export async function fetchPartnerBookings(partnerId) {
  const res = await fetch(`${API_BASE}/venues/partner/${partnerId}/bookings`);
  return res.json();
}

export async function updateVenueDetails(venueId, venueData) {
  const res = await fetch(`${API_BASE}/venues/${venueId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(venueData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update venue");
  }
  return res.json();
}

export async function updateVenueSlot(venueId, slotId, slotData) {
  const res = await fetch(`${API_BASE}/venues/${venueId}/slots/${slotId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slotData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update slot");
  }
  return res.json();
}

export async function addCourtToVenue(venueId, courtData) {
  const res = await fetch(`${API_BASE}/venues/${venueId}/courts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courtData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add court");
  }
  return res.json();
}


