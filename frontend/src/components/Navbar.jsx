import React, { useState } from 'react';
import { Zap, Users, CalendarCheck, BarChart3, Award, LogOut, ChevronDown, MapPin, Shield, Sparkles, Building2, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, realtime, roleMode, setRoleMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fairplay = user?.reliability_score || user?.fairplay_score || 105;

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 10, 18, 0.92)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 2rem'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand & City Quick Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div 
            onClick={() => setActiveTab('venues')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <img 
              src="/player_logo.jpg" 
              alt="ArenaIQ Player Logo" 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                objectFit: 'cover',
                boxShadow: '0 0 18px rgba(6, 182, 212, 0.45)',
                border: '1px solid rgba(6, 182, 212, 0.35)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em', color: '#ffffff' }}>
                  Arena<span style={{ color: 'var(--accent-cyan)' }}>IQ</span>
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px', textTransform: 'uppercase' }}>
                  {roleMode === 'admin' ? 'Partner Console' : 'Live Platform'}
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0 }}>
                Sports Discovery &amp; Demand Intelligence
              </p>
            </div>
          </div>

          {/* Location Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}>
            <MapPin size={13} color="var(--accent-cyan)" />
            <span>Ahmedabad &amp; Gandhinagar</span>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255,255,255,0.03)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('venues')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: activeTab === 'venues' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
              color: activeTab === 'venues' ? '#38bdf8' : 'var(--text-muted)',
              border: activeTab === 'venues' ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              transition: 'all 0.2s ease'
            }}
          >
            🏟️ Explore Arenas
          </button>

          <button
            onClick={() => {
              setActiveTab('venues');
              window.dispatchEvent(new CustomEvent('arenaiq_filter_offpeak'));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'transparent',
              color: '#34d399',
              border: '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              transition: 'all 0.2s ease'
            }}
            title="Jump to 35% discount off-peak afternoon slots"
          >
            ⚡ Off-Peak Deals
          </button>

          <button
            onClick={() => setActiveTab('squad')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: activeTab === 'squad' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              color: activeTab === 'squad' ? '#34d399' : 'var(--text-muted)',
              border: activeTab === 'squad' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={15} /> Squad Radar
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: activeTab === 'bookings' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
              color: activeTab === 'bookings' ? '#fbbf24' : 'var(--text-muted)',
              border: activeTab === 'bookings' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              transition: 'all 0.2s ease'
            }}
          >
            <CalendarCheck size={15} /> My Passes
          </button>
        </nav>

        {/* Right Dock: Role Switcher & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Partner Portal Entry Link */}
          <button
            onClick={() => {
              if (window.arenaiq_switch_portal) {
                window.arenaiq_switch_portal('partner');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#d8b4fe',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            title="Switch to exclusive Venue Partner Hub & B2B Console"
          >
            <Building2 size={13} color="#c084fc" />
            <span>Partner Hub ↗</span>
          </button>

          {/* User Profile Chip with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease'
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'D'}
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f3f4f6', display: 'block', lineHeight: 1.2 }}>
                  {user?.name || 'Dhairya Shah'}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }} title="Player Reliability Score">
                  <Award size={10} /> {fairplay} Reliability
                </span>
              </div>
              <ChevronDown size={13} color="var(--text-dim)" />
            </div>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '240px',
                  background: '#0c1222',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  zIndex: 100
                }}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div 
                  onClick={() => { setActiveTab('bookings'); setDropdownOpen(false); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Award size={15} color="var(--accent-amber)" /> Profile &amp; Reliability Score
                </div>

                <div 
                  onClick={() => { setActiveTab('bookings'); setDropdownOpen(false); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <CalendarCheck size={15} color="var(--accent-cyan)" /> Match Passes &amp; QR Tickets
                </div>

                <div 
                  onClick={() => { 
                    setDropdownOpen(false);
                    if (window.arenaiq_switch_portal) {
                      window.arenaiq_switch_portal('partner');
                    }
                  }}
                  style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Building2 size={15} /> Switch to Partner Hub ↗
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

                <div 
                  onClick={() => { onLogout(); setDropdownOpen(false); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} /> Switch User / Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
