/**
 * ArenaIQ Time Formatting & Scheduling Utilities
 * Formats 24h military timestamps to 12h AM/PM, syncs with local system time,
 * and identifies high-demand / filling-fast slots.
 */

/**
 * Converts a 24-hour time string (e.g. "06:00", "13:30", "00:00") to 12-hour AM/PM format (e.g. "06:00 AM", "01:30 PM", "12:00 AM").
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  
  // If already formatted with AM/PM, return as is
  if (/am|pm/i.test(clean)) return clean;

  const [hStr, mStr = '00'] = clean.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;

  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  const padH = h < 10 ? `0${h}` : `${h}`;
  const padM = mStr.length === 1 ? `0${mStr}` : mStr;
  return `${padH}:${padM} ${ampm}`;
}

/**
 * Formats a slot start and end time into clean 12h range: "06:00 AM – 07:00 AM"
 * Also accepts a combined string like "06:00 - 07:00" or "06:00-07:00".
 */
export function formatSlotRange(startTime, endTime) {
  if (!endTime && startTime && startTime.includes('-')) {
    const parts = startTime.split('-').map(s => s.trim());
    return `${formatTime12h(parts[0])} - ${formatTime12h(parts[1])}`;
  }
  return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
}

/**
 * Returns true if the provided date string (YYYY-MM-DD) matches today's local date.
 */
export function isToday(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return dateStr === `${year}-${month}-${day}`;
}

/**
 * Determines whether a slot has already started or ended relative to the current local time.
 * For today's date, slots whose start time has already passed are marked as past.
 */
export function isSlotPast(slotDate, startTime, endTime) {
  if (!isToday(slotDate)) return false;
  if (!startTime) return false;

  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const [sH, sM = '0'] = startTime.split(':').map(Number);
  const startTotalMinutes = sH * 60 + sM;

  // If slot start time is earlier or equal to current time, it has already begun or passed
  return startTotalMinutes <= currentTotalMinutes;
}

/**
 * Returns human-readable current local time with AM/PM (e.g. "09:15 PM").
 */
export function getCurrentTime12h() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Checks if a slot has higher chances of booking ("Filling Fast" / "High Demand").
 * Prime evening surge (17:00 - 22:00) or peak-flagged slots.
 */
export function isFillingFast(slot) {
  if (!slot) return false;
  if (slot.is_peak) return true;
  if (slot.start_time) {
    const [h] = slot.start_time.split(':').map(Number);
    if (h >= 17 && h <= 21) return true;
  }
  return false;
}

/**
 * Checks if a slot is in the absolute prime surge window (19:00 - 21:00).
 */
export function isPrimeSurge(slot) {
  if (!slot || !slot.start_time) return false;
  const [h] = slot.start_time.split(':').map(Number);
  return h >= 19 && h <= 20;
}

/**
 * Dynamically computes proximity surge pricing and countdown timing for Fill-My-Squad cards.
 * Mirrors dynamic demand: as match time approaches, emergency sub rate surges.
 */
export function calculateSquadUrgency(squad) {
  const now = new Date();
  const basePrice = Number(squad.base_price || squad.per_person_share || 120);

  let startTimeStr = squad.start_time;
  if (!startTimeStr && squad.time_slot) {
    startTimeStr = squad.time_slot.split('-')[0].trim();
  }
  if (!startTimeStr) startTimeStr = '19:00';

  const [sH = 19, sM = 0] = startTimeStr.split(':').map(Number);
  const [y, mo, d] = (squad.date || '').split('-').map(Number);

  let matchStart;
  if (y && mo && d) {
    matchStart = new Date(y, mo - 1, d, sH, sM, 0);
  } else {
    matchStart = new Date();
    matchStart.setHours(sH, sM, 0, 0);
  }

  const matchEnd = new Date(matchStart.getTime() + 60 * 60 * 1000);
  const diffMs = matchStart.getTime() - now.getTime();
  const minutesUntil = Math.floor(diffMs / (60 * 1000));
  const endDiffMs = matchEnd.getTime() - now.getTime();

  if (endDiffMs < 0) {
    return {
      dynamicPrice: basePrice,
      basePrice,
      surgeMultiplier: 1.0,
      urgencyLevel: 'expired',
      urgencyLabel: '⏰ Match Completed',
      urgencyBadgeColor: 'var(--text-dim)',
      timeRemainingText: 'Match Ended',
      minutesUntil,
      isExpired: true,
      isLiveNow: false
    };
  }

  if (diffMs <= 0) {
    const dynPrice = Math.round((basePrice * 2.0) / 10) * 10;
    return {
      dynamicPrice: dynPrice,
      basePrice,
      surgeMultiplier: 2.0,
      urgencyLevel: 'live_now',
      urgencyLabel: '🔴 Match In Progress (Emergency Join)',
      urgencyBadgeColor: '#f43f5e',
      timeRemainingText: 'Live Right Now!',
      minutesUntil,
      isExpired: false,
      isLiveNow: true
    };
  }

  if (minutesUntil <= 45) {
    // Under 45 minutes: Extreme Last-Minute Emergency Sub!
    const dynPrice = Math.round((basePrice * 2.0) / 10) * 10;
    return {
      dynamicPrice: dynPrice,
      basePrice,
      surgeMultiplier: 2.0,
      urgencyLevel: 'emergency',
      urgencyLabel: `🚨 Emergency Sub (${minutesUntil}m to start)`,
      urgencyBadgeColor: '#ef4444',
      timeRemainingText: `Starts in ${minutesUntil}m`,
      minutesUntil,
      isExpired: false,
      isLiveNow: false
    };
  }

  if (minutesUntil <= 90) {
    // 45 to 90 minutes: High Urgency
    const dynPrice = Math.round((basePrice * 1.6) / 10) * 10;
    const h = Math.floor(minutesUntil / 60);
    const m = minutesUntil % 60;
    return {
      dynamicPrice: dynPrice,
      basePrice,
      surgeMultiplier: 1.6,
      urgencyLevel: 'high',
      urgencyLabel: `🔥 Match Imminent (Starts in ${h > 0 ? `${h}h ` : ''}${m}m)`,
      urgencyBadgeColor: '#f97316',
      timeRemainingText: `Starts in ${h > 0 ? `${h}h ` : ''}${m}m`,
      minutesUntil,
      isExpired: false,
      isLiveNow: false
    };
  }

  if (minutesUntil <= 240) {
    // 1.5 to 4 hours: Moderate Urgency
    const dynPrice = Math.round((basePrice * 1.25) / 10) * 10;
    const h = Math.floor(minutesUntil / 60);
    const m = minutesUntil % 60;
    return {
      dynamicPrice: dynPrice,
      basePrice,
      surgeMultiplier: 1.25,
      urgencyLevel: 'moderate',
      urgencyLabel: `⚡ Moderate Demand (${h}h ${m > 0 ? `${m}m` : ''} away)`,
      urgencyBadgeColor: '#f59e0b',
      timeRemainingText: `Starts in ${h}h ${m > 0 ? `${m}m` : ''}`,
      minutesUntil,
      isExpired: false,
      isLiveNow: false
    };
  }

  // Over 4 hours away or next day: Early Bird Standard
  const hours = Math.floor(minutesUntil / 60);
  const days = Math.floor(hours / 24);
  const timeText = days > 0 ? `${days}d away` : `${hours}h away`;

  return {
    dynamicPrice: basePrice,
    basePrice,
    surgeMultiplier: 1.0,
    urgencyLevel: 'early_bird',
    urgencyLabel: `🟢 Early Bird Rate (${timeText})`,
    urgencyBadgeColor: '#10b981',
    timeRemainingText: days > 0 ? `In ${days} day${days > 1 ? 's' : ''}` : `In ${hours} hours`,
    minutesUntil,
    isExpired: false,
    isLiveNow: false
  };
}
