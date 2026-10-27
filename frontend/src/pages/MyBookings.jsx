import React, { useState, useEffect } from 'react';
import { Award, CalendarCheck, Clock, MapPin, AlertTriangle, ShieldCheck, CheckCircle2, User, Edit3, Mail, Phone, Sparkles, TrendingUp, ChevronRight, Activity } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import { fetchMyBookings, cancelBooking, fetchUserProfile } from '../services/api';
import { formatSlotRange } from '../utils/timeFormat';

export default function MyBookings({ user: currentUser, onProfileUpdated }) {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(currentUser || null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('upcoming'); // 'upcoming', 'all'
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProfileAndBookings();
  }, [currentUser?.id]);

  async function loadProfileAndBookings() {
    setLoading(true);
    try {
      const targetUid = currentUser?.id;
      if (!targetUid) return;
      const [bookingsRes, userRes] = await Promise.all([
        fetchMyBookings(targetUid),
        fetchUserProfile(targetUid)
      ]);
      setData(bookingsRes);
      if (userRes) {
        setProfile(userRes);
        if (onProfileUpdated) onProfileUpdated(userRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!window.confirm("Are you sure you want to cancel? To prevent last-minute empty turfs, a 15-point FairPlay deduction will be recorded on your profile.")) {
      return;
    }
    setCancellingId(bookingId);
    setMessage('');
    try {
      const res = await cancelBooking(bookingId);
      setMessage(`Reservation cancelled. FairPlay adjustment: ${res.fairplay_penalty} points.`);
      loadProfileAndBookings();
    } catch (err) {
      setMessage(`Error cancelling: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  }

  const user = profile || currentUser || {
    id: currentUser?.id || "player_guest",
    name: currentUser?.name || "Player",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    city: currentUser?.city || "Ahmedabad",
    area: currentUser?.area || "Bodakdev",
    skill_tier: currentUser?.skill_tier || "Tournament / Intermediate Tier",
    bio: currentUser?.bio || "Active sports enthusiast.",
    favorite_sports: currentUser?.favorite_sports || ["Cricket", "Football"],
    playing_positions: currentUser?.playing_positions || {
      "Cricket": "All-Rounder",
      "Football": "Midfielder"
    },
    fairplay_score: currentUser?.fairplay_score || 100,
    reliability_score: currentUser?.reliability_score || 100,
    badges: currentUser?.badges || ["Verified Player", "Punctual Player"],
    total_bookings: 0,
    cancelled_bookings: 0,
    turnout_rate: "100%"
  };

  const bookings = data?.bookings || [];
  const upcomingBookings = bookings.filter(b => b.status === "confirmed");
  const displayedBookings = activeTabFilter === 'upcoming' ? upcomingBookings : bookings;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
      {/* =========================================================================
          SUBPART 1: ATHLETE IDENTITY & VERIFIED PROFILE
      ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '2.4rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          {/* Avatar and Info */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '2rem',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}>
              {user.name ? user.name[0].toUpperCase() : 'K'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.9rem', color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                  {user.name}
                </h1>
                <span className="badge badge-lime" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  <ShieldCheck size={12} /> VERIFIED ATHLETE
                </span>
                <span className="badge badge-cyan font-mono" style={{ fontSize: '0.72rem' }}>
                  {user.skill_tier || "Intermediate Tier"}
                </span>
              </div>

              {/* Contact and Location details */}
              <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} color="var(--text-dim)" /> {user.email || 'player@arenaiq.in'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={14} color="var(--text-dim)" /> {user.phone || '+91 98000 00000'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="var(--text-dim)" /> {user.area}, {user.city}
                </span>
              </div>

              {/* Bio */}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', maxWidth: '680px', margin: 0, lineHeight: 1.5 }}>
                "{user.bio || 'Active multi-sport player. Always looking for good weekend matches!'}"
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-secondary"
            style={{ padding: '9px 18px', fontSize: '0.85rem' }}
          >
            <Edit3 size={15} /> Edit Player Profile
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          {message}
        </div>
      )}

      {/* Grid of Subparts 2, 3 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.8rem',
        marginBottom: '2.5rem'
      }}>
        {/* =========================================================================
            SUBPART 2: FAIRPLAY RELIABILITY SCORE
        ========================================================================= */}
        <div className="glass-panel" style={{
          padding: '1.8rem',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Award size={18} color="#fbbf24" />
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                  FairPlay Reliability Score
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                Platform reputation score based on match attendance & punctuality
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
                {user.reliability_score || user.fairplay_score || 105}
              </div>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                Elite Tier
              </span>
            </div>
          </div>

          {/* Turnout stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.2rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Match Turnout Rate</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-lime)' }}>
                {user.turnout_rate || '100%'} On-Time
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Matches Played</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {user.total_bookings || 8} Matches
              </span>
            </div>
          </div>

          {/* Verified Badges */}
          <div style={{ marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Earned Reliability Badges:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {user.badges?.map((badge, idx) => (
                <span
                  key={idx}
                  className="badge badge-cyan"
                  style={{ fontSize: '0.72rem' }}
                >
                  <ShieldCheck size={11} /> {badge}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            💡 <strong>How FairPlay Works:</strong> Completing matches earns +10 points. Late drops (&lt;3 hrs) incur a -15 penalty to prevent empty courts.
          </div>
        </div>

        {/* =========================================================================
            SUBPART 3: SPORTS PREFERENCES & PLAYING POSITIONS
        ========================================================================= */}
        <div className="glass-panel" style={{
          padding: '1.8rem',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
            <Activity size={18} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                Sports Roles &amp; Court Preferences
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                Your registered playing positions for team matchmaking
              </p>
            </div>
          </div>

          {/* Position Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Box Cricket</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f3f4f6' }}>
                  {user.playing_positions?.Cricket || "Top-Order Batter / All-Rounder"}
                </span>
              </div>
              <span className="badge badge-lime" style={{ fontSize: '0.65rem' }}>Primary</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Futsal / Football</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f3f4f6' }}>
                  {user.playing_positions?.Football || "Central Midfielder"}
                </span>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Active</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Pickleball</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f3f4f6' }}>
                  {user.playing_positions?.Pickleball || "Right-Side Doubles"}
                </span>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Recreational</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Available for match call-outs:</span>
            <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>🟢 Weekday Evenings &amp; Weekends</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUBPART 4: COURT RESERVATIONS & MATCH LEDGER
      ========================================================================= */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
            Court Bookings &amp; Match Passes
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
            View your upcoming confirmed games, split-bill allocations, and past matches
          </p>
        </div>

        {/* Tab Filter */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTabFilter('upcoming')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTabFilter === 'upcoming' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTabFilter === 'upcoming' ? '#38bdf8' : 'var(--text-muted)',
              border: 'none'
            }}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTabFilter === 'all' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTabFilter === 'all' ? '#38bdf8' : 'var(--text-muted)',
              border: 'none'
            }}
          >
            All History ({bookings.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          Loading match history...
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <CalendarCheck size={44} color="var(--text-dim)" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ color: '#ffffff', marginBottom: '0.4rem' }}>No Active Matches Found</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Book a court slot from the browse tab to schedule your next turf game!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedBookings.map((b) => (
            <div
              key={b.booking_id}
              className="glass-panel"
              style={{
                padding: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                border: b.status === "cancelled" ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid var(--border-subtle)',
                opacity: b.status === "cancelled" ? 0.6 : 1
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="font-mono badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                    {b.booking_id}
                  </span>
                  <span className={`badge ${b.status === 'confirmed' ? 'badge-lime' : 'badge-rose'}`} style={{ fontSize: '0.68rem' }}>
                    {b.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    • {b.sport}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '4px 0' }}>
                  {b.venue_name}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  {b.court_name} • {b.date} • {formatSlotRange(b.start_time, b.end_time)}
                </p>
              </div>

              {/* Split Bill & Financials */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Split Across</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f3f4f6' }}>
                    {b.split_players_count} players (₹{b.per_person_cost}/each)
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Total Court Fee</span>
                  <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
                    ₹{b.amount_paid}
                  </span>
                </div>

                {b.status === "confirmed" && (
                  <button
                    onClick={() => handleCancel(b.booking_id)}
                    disabled={cancellingId === b.booking_id}
                    style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#fb7185',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {cancellingId === b.booking_id ? "Cancelling..." : "Cancel (-15 FairPlay)"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={(updated) => {
            setProfile(updated);
            if (onProfileUpdated) onProfileUpdated(updated);
          }}
        />
      )}
    </div>
  );
}
