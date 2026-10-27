import React, { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, DollarSign, Users, Award, CheckCircle,
  AlertCircle, Sparkles, Flame, Lock, Check, ChevronRight, ChevronLeft,
  Eye, CreditCard, QrCode, ShieldCheck, Share2, Smartphone, Download,
  Activity, Zap, MapPin, Coffee, Shield
} from 'lucide-react';
import { fetchSlots, createBooking } from '../services/api';
import {
  formatTime12h,
  formatSlotRange,
  isToday,
  isSlotPast,
  getCurrentTime12h,
  isFillingFast,
  isPrimeSurge
} from '../utils/timeFormat';

export default function BookingModal({ venue, onClose, onBookingSuccess, user, initialSport }) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem('arenaiq_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })() || {
    id: "player_guest",
    name: "Player",
    phone: "",
    email: ""
  };

  // Multi-step booking flow navigation state:
  // 1: 'slots' -> 2: 'addons' -> 3: 'payment' -> 4: 'confirmed'
  const [currentStep, setCurrentStep] = useState(1);

  const defaultSport = initialSport || venue.sports?.[0] || 'All';
  const [selectedSport, setSelectedSport] = useState(defaultSport);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotFilter, setSlotFilter] = useState('available'); // 'available' | 'booked' | 'all'
  const [currentTime, setCurrentTime] = useState(getCurrentTime12h());

  // Step 2: Player & Add-ons state
  const [bookerName, setBookerName] = useState(activeUser.name || "Player");
  const [bookerPhone, setBookerPhone] = useState(activeUser.phone || "");
  const [matchType, setMatchType] = useState("Friendly Match");
  const [selectedAddons, setSelectedAddons] = useState({
    balls_shuttles: true,
    team_bibs: false,
    referee: false,
    video_recording: false,
    hydration_pack: true,
    cancellation_guard: true
  });
  const [specialNotes, setSpecialNotes] = useState("");

  // Step 3: Payment state
  const [paymentMethod, setPaymentMethod] = useState("upi"); // 'upi' | 'card' | 'wallet'
  const [upiId, setUpiId] = useState("arenaiq@okhdfcbank");
  const [upiApp, setUpiApp] = useState("gpay"); // 'gpay' | 'phonepe' | 'paytm'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);

  // Compute default squad split count based on sport
  const getDefaultSplit = (sportName) => {
    const s = (sportName || "").toLowerCase();
    if (s.includes("cricket")) return 11;
    if (s.includes("football")) return 10;
    if (s.includes("badminton") || s.includes("pickleball")) return 4;
    return 8;
  };

  const [splitCount, setSplitCount] = useState(getDefaultSplit(defaultSport));
  const [needSubs, setNeedSubs] = useState(false);
  const [subsCount, setSubsCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time local clock synchronization
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime12h());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Update selectedSport if initialSport changes
  useEffect(() => {
    if (initialSport) {
      setSelectedSport(initialSport);
      setSplitCount(getDefaultSplit(initialSport));
    }
  }, [initialSport]);

  useEffect(() => {
    loadSlots();
  }, [venue.id, selectedDate]);

  async function loadSlots() {
    setLoadingSlots(true);
    setErrorMsg('');
    try {
      const data = await fetchSlots(venue.id, selectedDate);
      setSlots(data.slots || []);
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load slots.');
    } finally {
      setLoadingSlots(false);
    }
  }

  // Equipment add-on prices
  const ADDON_PRICING = {
    balls_shuttles: { label: "🏏 Match Balls / Shuttles Pack", price: 100 },
    team_bibs: { label: "🎽 Team Color Vests / Jerseys (Set of 10)", price: 120 },
    referee: { label: "👨‍⚖️ Certified Umpire / Referee", price: 250 },
    video_recording: { label: "🎥 HD Match Video & Highlight Cam", price: 299 },
    hydration_pack: { label: "🥤 Chilled Hydration & Energy Drink Cooler", price: 120 },
    cancellation_guard: { label: "🛡️ Weather & 100% Refund Shield", price: 49 }
  };

  const addonsTotal = Object.entries(selectedAddons).reduce((acc, [key, active]) => {
    return active ? acc + (ADDON_PRICING[key]?.price || 0) : acc;
  }, 0);

  const baseOrDynamicPrice = selectedSlot ? selectedSlot.dynamic_price : 1000;
  const platformFee = 0; // Waived for registered players
  const gstAmount = Math.round((baseOrDynamicPrice + addonsTotal) * 0.05);
  const finalTotalAmount = baseOrDynamicPrice + addonsTotal + platformFee + gstAmount;
  const perPersonCost = Math.round(finalTotalAmount / splitCount);

  function toggleAddon(key) {
    setSelectedAddons(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleExecutePaymentAndBook() {
    if (!selectedSlot) return;
    setProcessingPayment(true);
    setProcessingStage(1);
    setErrorMsg('');

    try {
      // Realistic multi-stage animation
      await new Promise(r => setTimeout(r, 600));
      setProcessingStage(2);
      await new Promise(r => setTimeout(r, 600));
      setProcessingStage(3);

      const payload = {
        user_id: activeUser.id || "player_guest",
        user_name: bookerName || activeUser.name || "Player",
        user_phone: bookerPhone || activeUser.phone || "",
        venue_id: venue.id,
        venue_name: venue.name,
        court_id: selectedSlot.court_id,
        court_name: selectedSlot.court_name,
        sport: selectedSlot.sport,
        slot_id: selectedSlot.slot_id,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        amount_paid: finalTotalAmount,
        split_players_count: splitCount,
        per_person_cost: perPersonCost,
        need_squad_subs: needSubs,
        subs_needed_count: needSubs ? subsCount : 0
      };

      const result = await createBooking(payload);
      await new Promise(r => setTimeout(r, 500));

      setSuccessResult(result);
      setCurrentStep(4);
      if (onBookingSuccess) onBookingSuccess(result);
      loadSlots();
    } catch (err) {
      setErrorMsg(err.message || "Failed to confirm reservation.");
    } finally {
      setProcessingPayment(false);
    }
  }

  // Filter slots by sport
  const sportMatchedSlots = slots.filter((s) => {
    if (!selectedSport || selectedSport === 'All') return true;
    return s.sport?.toLowerCase() === selectedSport.toLowerCase();
  });

  const isTodaySelected = isToday(selectedDate);
  const availableUpcomingSlots = sportMatchedSlots.filter((s) => {
    if (s.status === 'booked') return false;
    if (isTodaySelected && isSlotPast(selectedDate, s.start_time, s.end_time)) {
      return false;
    }
    return true;
  });

  const bookedSlots = sportMatchedSlots.filter((s) => s.status === 'booked');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="glass-panel-glow" style={{
        maxWidth: '860px',
        width: '100%',
        maxHeight: '94vh',
        overflowY: 'auto',
        background: '#0c1222',
        padding: '2rem',
        position: 'relative',
        borderRadius: '20px',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            zIndex: 10
          }}
        >
          <X size={19} />
        </button>

        {/* Step Navigation Breadcrumbs Bar (Steps 1 to 4) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.8rem',
          paddingBottom: '1.2rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative'
        }}>
          {[
            { step: 1, title: "1. Slot & Squad" },
            { step: 2, title: "2. Details & Add-ons" },
            { step: 3, title: "3. Review & Payment" },
            { step: 4, title: "4. Official Match Pass" }
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <div
                key={item.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isActive ? 'var(--accent-cyan)' : (isCompleted ? 'var(--accent-lime)' : 'var(--text-dim)'),
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.82rem'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : (isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.05)'),
                  border: isCompleted ? '1.5px solid var(--accent-lime)' : (isActive ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)'),
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {isCompleted ? <Check size={14} color="var(--accent-lime)" /> : item.step}
                </div>
                <span>{item.title}</span>
              </div>
            );
          })}
        </div>

        {/* ================= STEP 1: SELECT SLOT & SQUAD CONFIGURATION ================= */}
        {currentStep === 1 && (
          <div>
            {/* Venue Location Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.3rem' }}>
              <span className="badge badge-cyan">{venue.city}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>• {venue.area}</span>
              {venue.verified && (
                <span style={{ color: 'var(--accent-lime)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  ✓ Verified Arena
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.65rem', color: '#ffffff', marginBottom: '0.4rem', fontWeight: 800 }}>
              {venue.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
              Step 1 of 3: Choose your preferred date, sport court, and synchronized time slot.
            </p>

            {/* Date Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} /> Choose Date:
              </label>
              {[0, 1, 2].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = offset === 0 ? "Today" : (offset === 1 ? "Tomorrow" : d.toLocaleDateString('en-US', { weekday: 'short' }));
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSelectedSlot(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{dayName}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      ({d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sport Court Selector */}
            <div style={{
              marginBottom: '1.2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              padding: '0.8rem 1rem',
              borderRadius: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase' }}>
                  Select Sport Court:
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  {selectedSport === 'All' ? 'Showing all courts' : `Filtered to ${selectedSport}`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {venue.sports?.map((sp) => {
                  const isCurrent = selectedSport.toLowerCase() === sp.toLowerCase();
                  const sportCourt = venue.courts?.find(c => c.sport.toLowerCase() === sp.toLowerCase());
                  const defaultPrice = sportCourt?.default_price;
                  const emoji = sp === 'Cricket' ? '🏏' : sp === 'Football' ? '⚽' : sp === 'Badminton' ? '🏸' : sp === 'Pickleball' ? '🏓' : '🏆';

                  return (
                    <button
                      key={sp}
                      onClick={() => {
                        setSelectedSport(sp);
                        setSelectedSlot(null);
                        setSplitCount(getDefaultSplit(sp));
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: isCurrent
                          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.28) 0%, rgba(14, 165, 233, 0.18) 100%)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isCurrent ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: '0.84rem'
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{sp}</span>
                      {defaultPrice && (
                        <span style={{ fontSize: '0.7rem', color: isCurrent ? '#38bdf8' : 'var(--text-dim)', fontWeight: 700 }}>
                          ₹{defaultPrice}/hr
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots Grid */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase' }}>
                  Available Slots ({availableUpcomingSlots.length}):
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Clock: {currentTime}
                </span>
              </div>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  Loading real-time availability...
                </div>
              ) : availableUpcomingSlots.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: 'var(--text-dim)' }}>
                  No available slots remaining for this date/sport. Please try another day or sport!
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '10px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {availableUpcomingSlots.map((s) => {
                    const isSelected = selectedSlot?.slot_id === s.slot_id;
                    const fastFilling = isFillingFast(s);
                    const prime = isPrimeSurge(s);

                    return (
                      <div
                        key={s.slot_id}
                        onClick={() => setSelectedSlot(s)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(6, 182, 212, 0.22)' : 'rgba(15, 23, 42, 0.65)',
                          border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                            {formatSlotRange(s.start_time, s.end_time)}
                          </span>
                          {fastFilling && (
                            <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: prime ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)', color: prime ? '#f87171' : '#f59e0b', fontWeight: 800 }}>
                              🔥 {prime ? 'Surge' : 'Fast'}
                            </span>
                          )}
                          {!fastFilling && s.discount_pct > 0 && (
                            <span className="badge badge-lime" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              -{s.discount_pct}%
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          {s.court_name}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: isSelected ? 'var(--accent-cyan)' : 'var(--accent-lime)' }}>
                            ₹{s.dynamic_price}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                            {isSelected ? '✓ Selected' : 'Available'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Split the Bill Slider */}
            {selectedSlot && (
              <div className="glass-panel" style={{
                padding: '1.2rem',
                marginBottom: '1rem',
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f3f4f6' }}>
                      Split-the-Bill Calculator ({splitCount} Players)
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
                    ₹{perPersonCost} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>/ player</span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Split across:</span>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={splitCount}
                    onChange={(e) => setSplitCount(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                  />
                  <span className="font-mono" style={{ width: '36px', fontWeight: 800, color: 'var(--accent-cyan)', textAlign: 'right' }}>
                    {splitCount}p
                  </span>
                </div>
              </div>
            )}

            {/* Broadcast to Radar Toggle */}
            {selectedSlot && (
              <div className="glass-panel" style={{
                padding: '1rem 1.2rem',
                marginBottom: '1.2rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={needSubs}
                    onChange={(e) => setNeedSubs(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--accent-lime)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f3f4f6' }}>
                      🚨 Broadcast to "Fill-My-Squad" Radar for Substitute Players
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                      Captains lacking full numbers can broadcast here. Verified solo players join and split the court share!
                    </p>
                  </div>
                </label>

                {needSubs && (
                  <div style={{ marginTop: '8px', paddingLeft: '26px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>How many players needed?</span>
                    <select
                      value={subsCount}
                      onChange={(e) => setSubsCount(Number(e.target.value))}
                      style={{
                        background: '#0c1222',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.82rem'
                      }}
                    >
                      <option value="1">1 Player</option>
                      <option value="2">2 Players</option>
                      <option value="3">3 Players</option>
                      <option value="4">4 Players</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Footer Step 1 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!selectedSlot}
                className="btn btn-primary"
                style={{
                  opacity: !selectedSlot ? 0.5 : 1,
                  cursor: !selectedSlot ? 'not-allowed' : 'pointer',
                  padding: '10px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Continue to Add-ons &amp; Details</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PLAYER DETAILS & ADD-ONS ================= */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.3rem' }}>
              <span className="badge badge-cyan">STEP 2 OF 3</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>• MATCH CUSTOMIZATION</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', color: '#ffffff', marginBottom: '0.4rem', fontWeight: 800 }}>
              Lead Booker &amp; Match Add-ons
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1.4rem' }}>
              Confirm your contact details for ticket SMS/WhatsApp and choose authentic turf equipment rentals.
            </p>

            {/* Booker Information Form */}
            <div className="glass-panel" style={{
              padding: '1.2rem',
              marginBottom: '1.3rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 700 }}>
                Primary Booker Contact Information:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Full Name:
                  </label>
                  <input
                    type="text"
                    value={bookerName}
                    onChange={(e) => setBookerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    WhatsApp Mobile Number:
                  </label>
                  <input
                    type="text"
                    value={bookerPhone}
                    onChange={(e) => setBookerPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Match Format / Type:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {["Casual Friendly", "Competitive Match", "Corporate Outing", "Tournament Practice"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMatchType(m)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          background: matchType === m ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                          border: matchType === m ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          color: matchType === m ? '#38bdf8' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment & Amenity Add-ons */}
            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>
                  Equipment Rentals &amp; Arena Services:
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-lime)', fontWeight: 600 }}>
                  Add-ons Total: +₹{addonsTotal}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {Object.entries(ADDON_PRICING).map(([key, item]) => {
                  const isChecked = !!selectedAddons[key];
                  return (
                    <div
                      key={key}
                      onClick={() => toggleAddon(key)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          background: isChecked ? 'var(--accent-lime)' : 'transparent',
                          border: isChecked ? 'none' : '1px solid var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {isChecked && '✓'}
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                          {item.label}
                        </span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-lime)' }}>
                        +₹{item.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Requests */}
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Special Instructions for Turf Manager (Optional):
              </label>
              <input
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Turn on floodlights 10 mins early, provide 2 pairs of batting gloves..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            {/* Navigation Footer Step 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} />
                <span>Back to Slots</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px' }}
              >
                <span>Proceed to Review &amp; Payment</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ORDER SUMMARY & PAYMENT CHECKOUT SIMULATION ================= */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.3rem' }}>
              <span className="badge badge-purple">STEP 3 OF 3</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>• SECURE CHECKOUT</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', color: '#ffffff', marginBottom: '0.4rem', fontWeight: 800 }}>
              Order Review &amp; Payment Gateway
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1.4rem' }}>
              Review your itemized billing statement and authorize the simulated payment transaction.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Left Column: Itemized Cost Breakdown */}
              <div className="glass-panel" style={{
                padding: '1.3rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                  Itemized Match Fare Breakdown:
                </h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Court Fare ({selectedSlot?.sport}):</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>₹{selectedSlot?.base_price || 1200}</span>
                </div>

                {selectedSlot?.discount_pct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--accent-lime)' }}>⚡ Off-Peak Discount ({selectedSlot.discount_pct}% OFF):</span>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>
                      -₹{Math.round((selectedSlot.base_price - selectedSlot.dynamic_price))}
                    </span>
                  </div>
                )}

                {selectedSlot?.is_peak && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--accent-amber)' }}>🔥 Prime Surge Pricing:</span>
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                      +₹{Math.round(selectedSlot.dynamic_price - selectedSlot.base_price)}
                    </span>
                  </div>
                )}

                {addonsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Equipment &amp; Add-ons:</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>+₹{addonsTotal}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Platform Convenience Fee:</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>FREE (Waived 🎉)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST &amp; Municipal Tax (5%):</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>+₹{gstAmount}</span>
                </div>

                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  marginTop: 'auto',
                  paddingTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>Total Amount Payable:</span>
                    <span className="font-mono" style={{ color: 'var(--accent-lime)', fontWeight: 800, fontSize: '1.3rem' }}>
                      ₹{finalTotalAmount}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'rgba(6, 182, 212, 0.1)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{ color: 'var(--accent-cyan)' }}>Split per Player ({splitCount}p):</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                      ₹{perPersonCost} / player
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Method Selection */}
              <div className="glass-panel" style={{
                padding: '1.3rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)'
              }}>
                <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 700 }}>
                  Select Payment Option:
                </h4>

                {/* Method Pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {[
                    { id: 'upi', label: '⚡ Instant UPI', icon: QrCode },
                    { id: 'card', label: '💳 Card', icon: CreditCard },
                    { id: 'wallet', label: '👛 Wallet', icon: ShieldCheck }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        background: paymentMethod === m.id ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.04)',
                        border: paymentMethod === m.id ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        color: paymentMethod === m.id ? '#38bdf8' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* UPI Sub-form */}
                {paymentMethod === 'upi' && (
                  <div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {["gpay", "phonepe", "paytm"].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiApp(app)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: upiApp === app ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                            border: upiApp === app ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                            color: upiApp === app ? '#34d399' : 'var(--text-dim)',
                            cursor: 'pointer'
                          }}
                        >
                          {app === 'gpay' ? 'GPay' : (app === 'phonepe' ? 'PhonePe' : 'Paytm')}
                        </button>
                      ))}
                    </div>

                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Enter Virtual Payment Address (UPI ID):
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        marginBottom: '10px'
                      }}
                    />

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px dashed rgba(16, 185, 129, 0.3)',
                      fontSize: '0.74rem',
                      color: 'var(--accent-lime)'
                    }}>
                      <ShieldCheck size={16} />
                      <span>Verified NPCI UPI Gateway Simulation Active</span>
                    </div>
                  </div>
                )}

                {/* Card Sub-form */}
                {paymentMethod === 'card' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Card Number:
                    </label>
                    <input
                      type="text"
                      defaultValue="4532 9811 4420 8821"
                      disabled
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        marginBottom: '8px',
                        fontFamily: 'monospace'
                      }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                          Expiry:
                        </label>
                        <input
                          type="text"
                          defaultValue="08/29"
                          disabled
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                          CVV:
                        </label>
                        <input
                          type="password"
                          defaultValue="782"
                          disabled
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Sub-form */}
                {paymentMethod === 'wallet' && (
                  <div style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      ArenaIQ Player Wallet Balance:
                    </div>
                    <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-lime)', marginBottom: '6px' }}>
                      ₹2,500.00
                    </div>
                    <span className="badge badge-lime" style={{ fontSize: '0.7rem' }}>
                      ✓ Sufficient funds available
                    </span>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* Simulated Payment Gateway Processing Overlay */}
            {processingPayment && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(7, 10, 18, 0.92)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 150
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '3px solid rgba(6, 182, 212, 0.2)',
                  borderTopColor: 'var(--accent-cyan)',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1.5rem'
                }} />
                <h3 style={{ color: '#ffffff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  Processing Booking Transaction...
                </h3>
                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.88rem', fontWeight: 600 }}>
                  {processingStage === 1 && "1/3: Authorizing simulated banking payment..."}
                  {processingStage === 2 && "2/3: Acquiring atomic slot lock in MongoDB..."}
                  {processingStage === 3 && "3/3: Streaming BOOKING_CONFIRMED to Apache Kafka Speed Layer..."}
                </div>
              </div>
            )}

            {/* Navigation Footer Step 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} />
                <span>Back to Add-ons</span>
              </button>

              <button
                type="button"
                onClick={handleExecutePaymentAndBook}
                disabled={processingPayment}
                className="btn btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
                }}
              >
                <Lock size={16} />
                <span>Pay &amp; Confirm Booking (₹{finalTotalAmount})</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: OFFICIAL MATCH CONFIRMATION & DIGITAL TICKET ================= */}
        {currentStep === 4 && successResult && (
          <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            {/* Animated Celebration Icon */}
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2.5px solid var(--accent-lime)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem auto',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.45)'
            }}>
              <CheckCircle size={44} color="var(--accent-lime)" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="badge badge-lime">RESERVATION LOCKED IN REAL-TIME</span>
            </div>
            <h2 style={{ fontSize: '1.9rem', color: '#ffffff', marginBottom: '0.4rem', fontWeight: 800 }}>
              Match Booking Confirmed!
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem auto', fontSize: '0.88rem' }}>
              Your court is reserved and synchronized across the ArenaIQ operational database and Kafka speed stream.
            </p>

            {/* High-Fidelity Match Pass & Ticket Card */}
            <div className="glass-panel" style={{
              maxWidth: '560px',
              margin: '0 auto 1.8rem auto',
              padding: '1.6rem',
              textAlign: 'left',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Digital Match Pass ID
                  </span>
                  <div className="font-mono" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                    {successResult.booking_id}
                  </div>
                </div>

                <div style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <QrCode size={36} color="#ffffff" style={{ margin: '0 auto' }} />
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    Scan at Reception
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Venue:</span>
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem' }}>{venue.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Location:</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{venue.area}, {venue.city}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Court &amp; Sport:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.86rem' }}>
                    {successResult.court_name} ({successResult.sport})
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Match Schedule:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.86rem' }}>
                    {successResult.date} • {formatSlotRange(successResult.start_time, successResult.end_time)}
                  </span>
                </div>
              </div>

              <div style={{
                borderTop: '1px dashed rgba(255,255,255,0.1)',
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Total Paid:</span>
                  <span style={{ color: 'var(--accent-lime)', fontWeight: 800, fontSize: '1rem' }}>
                    ₹{successResult.amount_paid}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    (₹{successResult.per_person_cost} / person)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                    ⭐ +10 FairPlay Points Awarded
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  alert(`WhatsApp Match Pass:\n\nVenue: ${venue.name}\nTiming: ${successResult.date} ${formatSlotRange(successResult.start_time, successResult.end_time)}\nPass ID: ${successResult.booking_id}\n\nPresent this at the reception!`);
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Smartphone size={15} color="var(--accent-lime)" />
                <span>Send Pass to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.84rem' }}
              >
                Done &amp; Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
