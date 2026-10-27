import React, { useState } from 'react';
import { Radio, Terminal, Eye, Sparkles } from 'lucide-react';

export default function LiveEventTicker({ events = [] }) {
  const [inspectedEvent, setInspectedEvent] = useState(null);

  const getBadgeClass = (etype) => {
    switch (etype) {
      case 'BOOKING_CONFIRMED': return 'badge-lime';
      case 'BOOKING_CANCELLED': return 'badge-rose';
      case 'SUB_REQUEST': return 'badge-amber';
      case 'SUB_JOINED': return 'badge-purple';
      default: return 'badge-cyan';
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '1.4rem',
      display: 'flex',
      flexDirection: 'column',
      height: '420px',
      background: 'rgba(12, 18, 34, 0.85)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0 }}>
            Live Venue Activity & Booking Stream
          </h3>
        </div>
        <span className="badge badge-cyan font-mono" style={{ fontSize: '0.72rem' }}>
          REALTIME INVENTORY FEED
        </span>
      </div>

      {/* Stream List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingRight: '4px'
      }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '3rem 1rem' }}>
            Listening for live platform activity...
          </div>
        ) : (
          events.map((ev, idx) => (
            <div
              key={ev.event_id || idx}
              onClick={() => setInspectedEvent(ev)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge ${getBadgeClass(ev.event_type)}`} style={{ fontSize: '0.66rem', minWidth: '120px', justifyContent: 'center' }}>
                  {ev.event_type}
                </span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  {ev.sport || "Multisport"}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  • {ev.venue_name || "All Arenas"}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {ev.amount > 0 && (
                  <span className="font-mono" style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>
                    +₹{ev.amount}
                  </span>
                )}
                <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  {ev.timestamp ? ev.timestamp.split('T')[1]?.replace('Z', '') : 'just now'}
                </span>
                <Eye size={14} color="var(--text-dim)" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* JSON Payload Inspector Modal / Popover */}
      {inspectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '600px',
            width: '100%',
            background: '#090d16',
            border: '1px solid var(--accent-cyan)',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                  Platform Event Payload Inspector
                </span>
              </div>
              <button
                onClick={() => setInspectedEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <pre className="font-mono" style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: '#38bdf8',
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {JSON.stringify(inspectedEvent, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
