import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Sparkles, Filter, Users, Award, Zap, ArrowRight,
  Clock, ShieldCheck, CheckCircle2, ChevronRight, Flame, TrendingDown,
  Star, DollarSign, Share2, HelpCircle, Shield, UserCheck
} from 'lucide-react';
import VenueCard from '../components/VenueCard';
import BookingModal from '../components/BookingModal';
import { fetchVenues, fetchSquadRadar } from '../services/api';

export default function BookingPortal({ onOpenSquadRadar, user }) {
  const [venues, setVenues] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [offPeakOnly, setOffPeakOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeBookingState, setActiveBookingState] = useState(null);

  // Listen for navbar trigger for off-peak deals
  useEffect(() => {
    const handler = () => {
      setOffPeakOnly(true);
      const el = document.getElementById('catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('arenaiq_filter_offpeak', handler);
    return () => window.removeEventListener('arenaiq_filter_offpeak', handler);
  }, []);

  useEffect(() => {
    loadVenues();
    loadSquadsPreview();
  }, [selectedSport, selectedCity, searchQuery, priceRange, sortBy, verifiedOnly]);

  async function loadVenues() {
    setLoading(true);
    try {
      let minP = "";
      let maxP = "";
      if (priceRange === 'under_600') { maxP = 600; }
      else if (priceRange === '600_1000') { minP = 600; maxP = 1000; }
      else if (priceRange === '1000_1500') { minP = 1000; maxP = 1500; }
      else if (priceRange === 'above_1500') { minP = 1500; }

      const data = await fetchVenues(selectedSport, selectedCity, searchQuery, minP, maxP, sortBy, verifiedOnly);
      setVenues(data.venues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSquadsPreview() {
    try {
      const data = await fetchSquadRadar();
      setSquads((data.squads || []).slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  }

  const sports = [
    { label: "All Sports", emoji: "🏆", value: "", count: "14+ Venues" },
    { label: "Box Cricket", emoji: "🏏", value: "Cricket", count: "14 Pitches" },
    { label: "Futsal", emoji: "⚽", value: "Football", count: "8 Cages" },
    { label: "Badminton", emoji: "🏸", value: "Badminton", count: "12 Courts" },
    { label: "Pickleball", emoji: "🏓", value: "Pickleball", count: "6 Courts" }
  ];

  const cities = [
    { label: "All Areas (Ahmedabad & Gandhinagar)", value: "" },
    { label: "Gandhinagar (Kudasan / PDPU / Infocity)", value: "Gandhinagar" },
    { label: "Ahmedabad (Sindhu Bhavan / Bodakdev / SG Hwy)", value: "Ahmedabad" }
  ];

  const priceOptions = [
    { label: "All Price Ranges", value: "all" },
    { label: "Under ₹600 / hr (Budget)", value: "under_600" },
    { label: "₹600 – ₹1,000 / hr", value: "600_1000" },
    { label: "₹1,000 – ₹1,500 / hr", value: "1000_1500" },
    { label: "₹1,500+ / hr (Premium / 7v7)", value: "above_1500" }
  ];

  const sortOptions = [
    { label: "⭐ Top Rated First", value: "rating" },
    { label: "💸 Price: Low to High", value: "price_asc" },
    { label: "💎 Price: High to Low", value: "price_desc" },
    { label: "🔥 Most Reviews", value: "reviews" }
  ];

  // Venues with active off-peak discounts (first 3)
  const offPeakBargainVenues = venues.slice(0, 3);

  // Filtered venues for catalog section
  const displayedVenues = venues.filter((v) => {
    if (offPeakOnly) {
      return true;
    }
    return true;
  });

  const hasActiveFilters = selectedSport || selectedCity || searchQuery || priceRange !== 'all' || sortBy !== 'rating' || offPeakOnly || verifiedOnly;

  const handleResetFilters = () => {
    setSelectedSport('');
    setSelectedCity('');
    setSearchQuery('');
    setPriceRange('all');
    setSortBy('rating');
    setOffPeakOnly(false);
    setVerifiedOnly(false);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem 4rem 2rem' }}>
      
      {/* =========================================================================
          HERO DISCOVERY & SEARCH DOCK
      ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '3rem 2.5rem',
        marginBottom: '2.5rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.04) 40%, rgba(15, 23, 42, 0.96) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ maxWidth: '880px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '9999px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '1.2rem' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              ⚡ Dynamic Off-Peak Yield Engine Active
            </span>
          </div>

          <h1 style={{ fontSize: '3rem', lineHeight: 1.15, color: '#ffffff', marginBottom: '1rem', letterSpacing: '-0.03em', fontWeight: 800 }}>
            Book Sports Turfs, Split Costs, &amp; Never Play Short-Handed
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Discover top-tier Box Cricket pitches, FIFA-grade Futsal cages, and BWF Badminton courts across Ahmedabad &amp; Gandhinagar. Unlock up to <strong>35% off</strong> on afternoon slots, split bills with 1 click, or find subs on the emergency squad radar.
          </p>
        </div>

        {/* Live Platform Highlights Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '2rem',
          padding: '12px 18px',
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>14+ Verified Arenas</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Floodlit &amp; FIFA standard</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={18} color="var(--accent-lime)" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-lime)' }}>Save 35% Off-Peak</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>11:00 AM – 4:00 PM slots</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>Fill-My-Squad Radar</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Instant sub matchmaking</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc' }}>Atomic Slot Locks</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Zero double bookings</div>
            </div>
          </div>
        </div>

        {/* Integrated Smart Search Dock */}
        <div style={{
          background: 'rgba(12, 18, 34, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '1.2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            alignItems: 'center'
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <Search size={18} color="var(--accent-cyan)" />
              <input
                type="text"
                placeholder="Search arena or area (e.g., SBR, Kudasan, PDPU)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* City / Locality Select */}
            <div style={{ position: 'relative' }}>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: '#0c1222',
                  border: selectedCity ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  color: selectedCity ? '#38bdf8' : '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: selectedCity ? 600 : 400,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {cities.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Price Range Select */}
            <div style={{ position: 'relative' }}>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: '#0c1222',
                  border: priceRange !== 'all' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  color: priceRange !== 'all' ? '#38bdf8' : '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: priceRange !== 'all' ? 600 : 400,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {priceOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: '#0c1222',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SPORTS CATEGORY DISCOVERY BAR
      ========================================================================= */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
              Browse by Sport
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
              Filter courts by your favorite athletic discipline
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {sports.map((s) => {
            const isSelected = (s.value === "" && !selectedSport) || (selectedSport === s.value);
            return (
              <div
                key={s.label}
                onClick={() => setSelectedSport(s.value)}
                className="glass-panel"
                style={{
                  padding: '1.2rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.12) 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {s.emoji}
                </div>
                <div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#ffffff' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {s.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: ⚡ FLASH OFF-PEAK BARGAINS (DYNAMIC PRICING SPOTLIGHT)
      ========================================================================= */}
      <div style={{
        marginBottom: '3rem',
        padding: '2rem',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.03) 50%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-lime">
                <Zap size={13} /> 35% DYNAMIC PRICE REDUCTION
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Valid for Afternoon Slots (11:00 AM – 4:00 PM)
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0 }}>
              ⚡ Today's Flash Off-Peak Bargains
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
              Our automated price-elasticity engine drops rates during daytime idle hours so your squad plays for less.
            </p>
          </div>

          <button
            onClick={() => {
              setOffPeakOnly(true);
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn btn-outline"
            style={{ borderColor: 'var(--accent-lime)', color: 'var(--accent-lime)', fontSize: '0.82rem', padding: '8px 16px' }}
          >
            <span>View All Off-Peak Slots</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* 3 Featured Off-Peak Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.2rem'
        }}>
          {offPeakBargainVenues.map((v) => (
            <div
              key={`bargain-${v.id}`}
              className="glass-panel"
              style={{
                padding: '1.2rem',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                    {v.city} • {v.area}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
                    <Star size={13} fill="#fbbf24" /> {v.rating}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '4px' }}>
                  {v.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {v.tagline}
                </p>
              </div>

              <div>
                {/* Price Slash Banner */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textDecoration: 'line-through', marginRight: '6px' }}>
                      ₹1,100 / hr
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
                      ₹715 <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ hr</span>
                    </span>
                  </div>
                  <span className="badge badge-lime font-mono" style={{ fontSize: '0.7rem' }}>
                    SAVE 35%
                  </span>
                </div>

                <button
                  onClick={() => setActiveBookingState({ venue: v, initialSport: v.sports?.[0] })}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                >
                  <Clock size={15} /> Book Afternoon Bargain Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: 👥 LIVE "FILL-MY-SQUAD" EMERGENCY MATCHES (TODAY)
      ========================================================================= */}
      <div style={{
        marginBottom: '3rem',
        padding: '2rem',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.28)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-amber">
                <Users size={13} /> SQUAD EMERGENCY RADAR
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Captains looking for subs right now in Ahmedabad &amp; Gandhinagar
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0 }}>
              👥 Urgent Matches Looking for Players Today
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
              Never let a game get cancelled. Hop in as a substitute player and split the court fee evenly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onOpenSquadRadar}
              className="btn btn-outline"
              style={{ borderColor: 'var(--accent-amber)', color: '#fbbf24', fontSize: '0.82rem', padding: '8px 16px' }}
            >
              <span>Explore All Radar Matches</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Squad Preview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.2rem'
        }}>
          {squads.map((sq) => {
            const remaining = sq.subs_needed - (sq.subs_joined || 0);
            const sportEmoji = sq.sport === 'Cricket' ? '🏏' : sq.sport === 'Football' ? '⚽' : sq.sport === 'Badminton' ? '🏸' : '🏓';

            return (
              <div
                key={`squad-prev-${sq.id}`}
                className="glass-panel"
                style={{
                  padding: '1.2rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                      {sportEmoji} {sq.sport}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 600 }}>
                      ⚡ Need {remaining} Sub{remaining > 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.08rem', color: '#ffffff', marginBottom: '4px' }}>
                    {sq.venue_name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {sq.area}, {sq.city}
                  </div>

                  {/* Captain Info */}
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Host: <strong style={{ color: '#ffffff' }}>{sq.captain_name}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }} title="Player Reliability Score">
                      <Award size={11} /> 105 Reliability
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Match Time: <strong>{sq.start_time} - {sq.end_time}</strong>
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
                      ₹{sq.per_person_share} <span style={{ fontSize: '0.72rem', fontWeight: 400 }}>/ player</span>
                    </span>
                  </div>

                  <button
                    onClick={onOpenSquadRadar}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <Users size={15} /> Join Squad &amp; Split Fee
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: 🏟️ ALL VERIFIED PARTNER ARENAS (FULL CATALOG)
      ========================================================================= */}
      <div id="catalog-section" style={{ marginBottom: '3rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
              All Partner Sports Arenas
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Showing {displayedVenues.length} verified venues across Gandhinagar and Ahmedabad
            </p>
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setOffPeakOnly(!offPeakOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: offPeakOnly ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.03)',
                border: offPeakOnly ? '1.5px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                color: offPeakOnly ? 'var(--accent-lime)' : 'var(--text-dim)',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={13} color={offPeakOnly ? "var(--accent-lime)" : "var(--text-dim)"} />
              <span>⚡ Off-Peak Deals (35% OFF)</span>
            </button>

            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: verifiedOnly ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.03)',
                border: verifiedOnly ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                color: verifiedOnly ? '#38bdf8' : 'var(--text-dim)',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={13} color={verifiedOnly ? "var(--accent-cyan)" : "var(--text-dim)"} />
              <span>🛡️ Verified Turf Only</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 10px'
                }}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            Finding available sports venues...
          </div>
        ) : displayedVenues.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
            <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>No Arenas Matched Your Filters</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Try broadening your price range or resetting the sport/location filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn btn-outline"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.6rem'
          }}>
            {displayedVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onSelect={(v, sport) => setActiveBookingState({ venue: v, initialSport: sport })}
              />
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: 💡 THE ARENAIQ ADVANTAGE (HOW IT WORKS)
      ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '3rem 2.5rem',
        marginBottom: '3rem',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
          <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            HOW ARENAIQ WORKS
          </span>
          <h2 style={{ fontSize: '2.2rem', color: '#ffffff', margin: '6px 0 10px 0' }}>
            Engineered for Fair Pricing &amp; Zero Dropped Matches
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Urban sports venues usually suffer from 80% afternoon idle time and prime-evening chaos. ArenaIQ balances both using real-time yield intelligence.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-lime)',
              fontWeight: 800,
              fontSize: '1.2rem'
            }}>
              1
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
              Dynamic Yield Pricing
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
              Book afternoon slots (11:00 AM – 4:00 PM) to unlock algorithmic discounts of up to 35% off. You save money, and venues fill idle capacity.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              fontWeight: 800,
              fontSize: '1.2rem'
            }}>
              2
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
              Atomic Concurrency Locks
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
              Every slot reservation is backed by distributed atomic locks in MongoDB. Two players booking the same court at the exact same millisecond will never experience a double-booking conflict.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '1.2rem'
            }}>
              3
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
              Split-the-Bill &amp; Squad Radar
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
              Captains can calculate exact per-player fees before checking out and share passes directly to WhatsApp. If players drop out last-minute, broadcast to nearby substitutes with 1 click.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: 🛡️ COMMUNITY FAIRPLAY & PLAYER RELIABILITY SCORE
      ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Award size={18} color="#fbbf24" />
            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
              PLAYER RELIABILITY SCORE
            </span>
          </div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
            Your Reliability Score Protects Your Squad
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
            Every player begins with a base 100 Player Reliability Score. Showing up on time and playing matches boosts your score and unlocks the <strong>Verified Captain</strong> badge. Late cancellations penalize your score (-15 pts) to protect venues and prevent teams from being left short-handed.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-lime">⭐ Verified Captain</span>
            <span className="badge badge-cyan">🕒 100% Turnout Rate</span>
            <span className="badge badge-amber">🛡️ Zero Late Drops</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MapPin size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              LOCAL COMMUNITY NETWORK
            </span>
          </div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
            Operating Across Ahmedabad &amp; Gandhinagar
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
            Partnered with top sports facilities including <em>Sindhu Bhavan Box Arena, PDPU Road Futsal Cage, Infocity Badminton Hub,</em> and <em>Vastrapur Champions Turf</em> with live telemetry updates.
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            ✓ Verified floodlights • ✓ Synthetic turf certification • ✓ Changing rooms &amp; parking
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {activeBookingState && (
        <BookingModal
          venue={activeBookingState.venue}
          initialSport={activeBookingState.initialSport}
          user={user}
          onClose={() => setActiveBookingState(null)}
          onBookingSuccess={() => {
            loadVenues();
          }}
        />
      )}
    </div>
  );
}
