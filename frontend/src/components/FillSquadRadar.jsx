import React, { useState, useEffect } from 'react';
import {
  Users, Clock, MapPin, Award, CheckCircle, ShieldAlert, Sparkles,
  Flame, AlertTriangle, Zap, Plus, X, Radio, RefreshCw, Send, Check
} from 'lucide-react';
import { fetchSquadRadar, joinSquadRequest, createSquadBroadcast, fetchVenues } from '../services/api';
import { formatSlotRange, calculateSquadUrgency, formatTime12h } from '../utils/timeFormat';

export default function FillSquadRadar({ user }) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem('arenaiq_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })() || {
    id: "player_guest",
    name: "Player",
    phone: ""
  };

  const [squads, setSquads] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [notification, setNotification] = useState('');
  const [clockTick, setClockTick] = useState(Date.now());
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [venuesList, setVenuesList] = useState([]);

  // Broadcast modal form state
  const [broadcastForm, setBroadcastForm] = useState({
    venue_id: '',
    venue_name: '',
    city: 'Ahmedabad',
    area: '',
    sport: 'Cricket',
    date: new Date().toISOString().split('T')[0],
    start_time: '21:00',
    end_time: '22:00',
    subs_needed: 2,
    per_person_share: 120,
    skill_level: 'All Levels Welcome',
    notes: 'Urgent sub needed for friendly evening match! Balls provided.'
  });
  const [broadcasting, setBroadcasting] = useState(false);

  // Periodic clock tick to continuously refresh urgency countdowns & dynamic proximity prices
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(Date.now());
    }, 15000); // Re-calculate every 15s
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSquads();
  }, [selectedSport, selectedCity]);

  useEffect(() => {
    // Load venues for broadcast dropdown
    fetchVenues().then(d => {
      const vList = d.venues || [];
      setVenuesList(vList);
      if (vList.length > 0 && !broadcastForm.venue_id) {
        setBroadcastForm(prev => ({
          ...prev,
          venue_id: vList[0].id,
          venue_name: vList[0].name,
          city: vList[0].city,
          area: vList[0].area
        }));
      }
    }).catch(console.error);
  }, []);

  async function loadSquads() {
    setLoading(true);
    try {
      const data = await fetchSquadRadar(selectedSport, selectedCity);
      setSquads(data.squads || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(sq, currentDynamicPrice) {
    setJoiningId(sq.id);
    setNotification('');
    try {
      const res = await joinSquadRequest(
        sq.id,
        {
          user_id: activeUser.id || "player_guest",
          name: activeUser.name || "Player",
          phone: activeUser.phone || ""
        },
        currentDynamicPrice
      );
      setNotification(`🎉 Match joined! Confirmed sub spot at ₹${currentDynamicPrice} for ${sq.venue_name}.`);
      loadSquads();
    } catch (err) {
      setNotification(`⚠️ ${err.message}`);
    } finally {
      setJoiningId(null);
    }
  }

  async function handleCreateBroadcast(e) {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const selectedV = venuesList.find(v => v.id === broadcastForm.venue_id);
      const payload = {
        booking_id: `BK-USER-${Date.now().toString(36).toUpperCase()}`,
        venue_id: broadcastForm.venue_id,
        venue_name: selectedV ? selectedV.name : broadcastForm.venue_name,
        city: selectedV ? selectedV.city : broadcastForm.city,
        area: selectedV ? selectedV.area : broadcastForm.area,
        sport: broadcastForm.sport,
        date: broadcastForm.date,
        time_slot: `${broadcastForm.start_time} - ${broadcastForm.end_time}`,
        start_time: broadcastForm.start_time,
        end_time: broadcastForm.end_time,
        captain_name: activeUser.name || "Player Captain",
        captain_phone: activeUser.phone || "",
        captain_id: activeUser.id || "player_captain",
        subs_needed: Number(broadcastForm.subs_needed),
        per_person_share: Number(broadcastForm.per_person_share),
        skill_level: broadcastForm.skill_level,
        notes: broadcastForm.notes
      };

      await createSquadBroadcast(payload);
      setNotification("📢 Broadcast published! Solo players nearby in Ahmedabad & Gandhinagar have been notified.");
      setShowBroadcastModal(false);
      loadSquads();
    } catch (err) {
      alert(err.message || "Failed to broadcast");
    } finally {
      setBroadcasting(false);
    }
  }

  const sportsFilter = ["All", "Cricket", "Football", "Badminton", "Pickleball"];
  const citiesFilter = [
    { label: "All Cities", value: "" },
    { label: "📍 Ahmedabad", value: "Ahmedabad" },
    { label: "📍 Gandhinagar", value: "Gandhinagar" }
  ];

  // Compute live open count
  const openCount = squads.filter(s => s.status === 'open').length;
  const totalOpenSpots = squads.reduce((acc, s) => {
    if (s.status === 'open') {
      return acc + (s.subs_needed - (s.subs_joined || 0));
    }
    return acc;
  }, 0);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
      {/* Hero Banner with Live Dynamic Pricing Explanation */}
      <div className="glass-panel" style={{
        padding: '2.4rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.09) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-lime">
                <Radio size={13} className="animate-pulse" /> LIVE COMMUNITY RADAR
              </span>
              <span className="badge badge-cyan">
                AHMEDABAD &amp; GANDHINAGAR CORRIDOR
              </span>
            </div>

            <h1 style={{ fontSize: '2.3rem', color: '#ffffff', marginBottom: '0.6rem', fontWeight: 800 }}>
              ⚡ Fill-My-Squad: Emergency Player Radar &amp; Sub Matchmaking
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, margin: 0 }}>
              Never cancel a match due to last-minute team dropouts. Join verified games as a substitute player across Ahmedabad and Gandhinagar with <strong>Dynamic Proximity Pricing</strong>—rates adjust smoothly based on how close the match is to starting.
            </p>
          </div>

          {/* Quick Action: Broadcast Missing Player Request */}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)'
            }}
          >
            <Plus size={18} /> Broadcast Missing Players
          </button>
        </div>


        {/* 3-Step Matchmaking Workflow Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          marginTop: '1.4rem',
          paddingTop: '1.2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>1</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#ffffff' }}>Captain Broadcasts:</strong> Team short of 1-2 players posts game details.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>2</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#ffffff' }}>Dynamic Split:</strong> Cost per player adjusts dynamically based on kickoff time.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>3</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#ffffff' }}>1-Click Join:</strong> Solo players join instantly, preserving match integrity.
            </div>
          </div>
        </div>

        {/* Filter Controls: Cities & Sports */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.4rem',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '1.2rem',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* City Selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {citiesFilter.map((c) => {
              const isSelected = selectedCity === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setSelectedCity(c.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.04)',
                    border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Sport Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {sportsFilter.map((s) => {
              const isSelected = (s === "All" && !selectedSport) || (selectedSport === s);
              const emoji = s === 'Cricket' ? '🏏' : s === 'Football' ? '⚽' : s === 'Badminton' ? '🏸' : s === 'Pickleball' ? '🏓' : '🏆';
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSport(s === "All" ? "" : s)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#34d399' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{emoji}</span>
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--accent-lime)',
          color: '#ffffff',
          fontWeight: 600,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="var(--accent-lime)" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Roster & Stats Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.2rem',
        padding: '0 4px'
      }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Showing <strong>{squads.length}</strong> active matches across Ahmedabad &amp; Gandhinagar • <strong style={{ color: 'var(--accent-lime)' }}>{totalOpenSpots} open player spots</strong>
        </div>
        <button
          onClick={loadSquads}
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} /> Refresh Radar
        </button>
      </div>

      {/* Grid of Open Squads */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          Scanning Ahmedabad &amp; Gandhinagar radar frequencies for matches...
        </div>
      ) : squads.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Users size={52} color="var(--text-dim)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#ffffff', marginBottom: '0.4rem', fontSize: '1.3rem' }}>No Active Sub Requests Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
            No matches matching these filters currently need players. You can click <strong>"Broadcast Missing Players"</strong> above to request subs for your own game!
          </p>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="btn btn-primary"
            style={{ padding: '10px 24px' }}
          >
            <Plus size={16} /> Post New Squad Match
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {squads.map((sq) => {
            // Live urgency calculation based on current system time
            const urgency = calculateSquadUrgency(sq);
            const isFull = sq.subs_joined >= sq.subs_needed;
            const remaining = sq.subs_needed - sq.subs_joined;
            const alreadyJoined = sq.players?.some(p =>
              p.user_id === activeUser.id
            );

            const hasSurge = urgency.surgeMultiplier > 1.0;
            const sportEmoji = sq.sport === 'Cricket' ? '🏏' : sq.sport === 'Football' ? '⚽' : sq.sport === 'Badminton' ? '🏸' : sq.sport === 'Pickleball' ? '🏓' : '🏆';

            return (
              <div
                key={sq.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: urgency.urgencyLevel === 'emergency'
                    ? '1.5px solid rgba(239, 68, 68, 0.45)'
                    : urgency.urgencyLevel === 'high'
                      ? '1.5px solid rgba(249, 115, 22, 0.4)'
                      : (isFull ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16, 185, 129, 0.25)'),
                  background: urgency.urgencyLevel === 'emergency'
                    ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)'
                    : (isFull ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.78)'),
                  boxShadow: urgency.urgencyLevel === 'emergency' ? '0 0 25px rgba(239, 68, 68, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header: Sport, Urgency Badge, Squad ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-lime" style={{ fontSize: '0.72rem' }}>
                      {sportEmoji} {sq.sport}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-dim)',
                      fontWeight: 600
                    }}>
                      {sq.skill_level}
                    </span>
                  </div>

                  <span className="badge badge-amber font-mono" style={{ fontSize: '0.7rem' }}>
                    {sq.id}
                  </span>
                </div>

                {/* Venue Name & City / Area */}
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '4px 0 2px 0', fontWeight: 700 }}>
                  {sq.venue_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontSize: '0.78rem', marginBottom: '12px' }}>
                  <MapPin size={12} />
                  <span>{sq.area ? `${sq.area}, ${sq.city || ''}` : (sq.city || 'Ahmedabad')}</span>
                </div>

                {/* Urgency Proximity Live Alert Banner */}
                <div style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: urgency.urgencyLevel === 'emergency'
                    ? 'rgba(239, 68, 68, 0.18)'
                    : urgency.urgencyLevel === 'high'
                      ? 'rgba(249, 115, 22, 0.15)'
                      : urgency.urgencyLevel === 'moderate'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${urgency.urgencyBadgeColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: urgency.urgencyBadgeColor
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {urgency.urgencyLevel === 'emergency' && <Flame size={14} className="animate-pulse" />}
                    {urgency.urgencyLevel === 'high' && <AlertTriangle size={14} />}
                    {urgency.urgencyLevel === 'moderate' && <Zap size={14} />}
                    {urgency.urgencyLevel === 'early_bird' && <CheckCircle size={14} />}
                    {urgency.urgencyLabel}
                  </span>
                  <span style={{ opacity: 0.9 }}>
                    {urgency.timeRemainingText}
                  </span>
                </div>

                {/* Match Schedule & Dynamic Share Pricing */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Date &amp; Schedule
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Clock size={13} color="var(--accent-cyan)" />
                      {sq.date} • {formatSlotRange(sq.time_slot)}
                    </span>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px', minWidth: '100px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Player Share
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '5px', marginTop: '2px' }}>
                      {hasSurge && (
                        <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-dim)' }}>
                          ₹{urgency.basePrice}
                        </span>
                      )}
                      <span style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: hasSurge ? urgency.urgencyBadgeColor : 'var(--accent-lime)'
                      }}>
                        ₹{urgency.dynamicPrice}
                      </span>
                    </div>
                    {hasSurge && (
                      <span style={{ fontSize: '0.62rem', color: urgency.urgencyBadgeColor, fontWeight: 700, display: 'block' }}>
                        +{Math.round((urgency.surgeMultiplier - 1) * 100)}% Urgency Surge
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes from captain */}
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  minHeight: '2.5rem'
                }}>
                  "{sq.notes}"
                </p>

                {/* Captain Info & Players Roster */}
                <div style={{ marginBottom: '1.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                      Current Squad Lineup:
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.66rem' }}>
                      {remaining > 0 ? `${remaining} spot${remaining > 1 ? 's' : ''} left` : 'Fully Packed'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {sq.players?.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.74rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {p.role === "Captain" && "👑"} {p.name}
                        {(p.reliability_score || p.fairplay_score) && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', fontWeight: 700 }} title={`Player Reliability Score: ${p.reliability_score || p.fairplay_score}`}>
                            ★{p.reliability_score || p.fairplay_score} Reliability Score
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  {urgency.isExpired ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                      ⏰ Match Schedule Completed
                    </div>
                  ) : isFull ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                      ✅ Squad Roster Full
                    </div>
                  ) : alreadyJoined ? (
                    <div style={{ textAlign: 'center', color: 'var(--accent-lime)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Check size={16} /> You are registered in this squad!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(sq, urgency.dynamicPrice)}
                      disabled={joiningId === sq.id}
                      className={urgency.urgencyLevel === 'emergency' ? 'btn btn-primary' : 'btn btn-lime'}
                      style={{
                        width: '100%',
                        padding: '11px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        background: urgency.urgencyLevel === 'emergency' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : undefined,
                        boxShadow: urgency.urgencyLevel === 'emergency' ? '0 0 16px rgba(239, 68, 68, 0.4)' : undefined
                      }}
                    >
                      {joiningId === sq.id
                        ? "Locking Spot..."
                        : `Join Squad as Sub (₹${urgency.dynamicPrice})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Missing Player Request Modal */}
      {showBroadcastModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#0c1222',
            padding: '2rem',
            position: 'relative',
            border: '1px solid rgba(6, 182, 212, 0.35)'
          }}>
            <button
              onClick={() => setShowBroadcastModal(false)}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-cyan">COMMUNITY BROADCAST</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: '0 0 6px 0', fontWeight: 800 }}>
              Broadcast Open Squad Slots
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1.5rem' }}>
              Broadcast to verified solo players across Ahmedabad &amp; Gandhinagar so they can jump in and split the court cost.
            </p>

            <form onSubmit={handleCreateBroadcast}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Select Sports Venue:
                  </label>
                  <select
                    value={broadcastForm.venue_id}
                    onChange={(e) => {
                      const v = venuesList.find(x => x.id === e.target.value);
                      setBroadcastForm(prev => ({
                        ...prev,
                        venue_id: e.target.value,
                        venue_name: v ? v.name : '',
                        city: v ? v.city : 'Ahmedabad',
                        area: v ? v.area : ''
                      }));
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    {venuesList.map(v => (
                      <option key={v.id} value={v.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                        {v.name} ({v.city} - {v.area})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Sport:
                  </label>
                  <select
                    value={broadcastForm.sport}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, sport: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Cricket" style={{ background: '#0f172a' }}>🏏 Cricket</option>
                    <option value="Football" style={{ background: '#0f172a' }}>⚽ Football</option>
                    <option value="Badminton" style={{ background: '#0f172a' }}>🏸 Badminton</option>
                    <option value="Pickleball" style={{ background: '#0f172a' }}>🏓 Pickleball</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Match Date:
                  </label>
                  <input
                    type="date"
                    value={broadcastForm.date}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={broadcastForm.start_time}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={broadcastForm.end_time}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Missing Players Needed:
                  </label>
                  <select
                    value={broadcastForm.subs_needed}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, subs_needed: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="1" style={{ background: '#0f172a' }}>1 Player</option>
                    <option value="2" style={{ background: '#0f172a' }}>2 Players</option>
                    <option value="3" style={{ background: '#0f172a' }}>3 Players</option>
                    <option value="4" style={{ background: '#0f172a' }}>4 Players</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Base Share per Player (₹):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="10"
                    value={broadcastForm.per_person_share}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, per_person_share: Number(e.target.value) }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                    Notes &amp; Match Details for Players:
                  </label>
                  <textarea
                    rows="3"
                    value={broadcastForm.notes}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Describe match format, required skill level, equipment provided..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  {broadcasting ? "Broadcasting..." : "Confirm & Broadcast to Radar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
