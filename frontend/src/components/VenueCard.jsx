import React from 'react';
import { Star, MapPin, Zap, CheckCircle2 } from 'lucide-react';

const SPORT_FALLBACK_IMAGES = {
  Cricket: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60",
  Football: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=60",
  Badminton: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60",
  Pickleball: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=60"
};

export default function VenueCard({ venue, onSelect }) {
  const primarySport = venue.sports?.[0] || 'Cricket';
  const fallbackImg = SPORT_FALLBACK_IMAGES[primarySport] || SPORT_FALLBACK_IMAGES.Cricket;

  return (
    <div 
      className="glass-panel venue-card-frame" 
      onClick={() => onSelect(venue, venue.sports?.[0])}
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(6, 182, 212, 0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Venue Image */}
      <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden' }}>
        <img
          src={venue.image_url || fallbackImg}
          alt={venue.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImg;
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(12, 18, 34, 0.9) 0%, transparent 60%)'
        }} />

        {/* Rating Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(7, 10, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#fbbf24'
        }}>
          <Star size={13} fill="#fbbf24" color="#fbbf24" />
          <span>{venue.rating}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>({venue.total_reviews})</span>
        </div>

        {/* Bargain Tag */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          <span className="badge badge-lime" style={{ fontSize: '0.7rem' }}>
            ⚡ Up to 45% OFF Off-Peak
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
            {venue.city}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <MapPin size={12} /> {venue.area}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '4px' }}>
          {venue.name}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>
          {venue.tagline}
        </p>

        {/* Dedicated Sport Selection Buttons */}
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Choose Sport:
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
              Dedicated Courts
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {venue.sports.map((s) => {
              const court = venue.courts?.find(c => c.sport.toLowerCase() === s.toLowerCase());
              const price = court?.default_price;
              const emoji = s === 'Cricket' ? '🏏' : s === 'Football' ? '⚽' : s === 'Badminton' ? '🏸' : s === 'Pickleball' ? '🏓' : '🏆';

              return (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(venue, s);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.76rem',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.22)';
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.color = '#38bdf8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.25)';
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title={`Book dedicated ${s} court at ${venue.name}`}
                >
                  <span>{emoji}</span>
                  <span>{s}</span>
                  {price && (
                    <span style={{ color: 'var(--accent-lime)', fontSize: '0.68rem', fontWeight: 700, marginLeft: '2px' }}>
                      ₹{price}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.9rem',
          marginTop: 'auto'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Starting from</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
              ₹{Math.min(...(venue.courts?.map(c => c.default_price) || [600]))} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>/hr</span>
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(venue, venue.sports?.[0]);
            }}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            View Slots & Book
          </button>
        </div>
      </div>
    </div>
  );
}
