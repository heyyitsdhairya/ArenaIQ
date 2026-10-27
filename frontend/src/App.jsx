import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import BookingPortal from './pages/BookingPortal';
import FillSquadRadar from './components/FillSquadRadar';
import MyBookings from './pages/MyBookings';
import PartnerHub from './pages/PartnerHub';
import { fetchHealth, fetchRealtimeMetrics, logoutUser } from './services/api';

export default function App() {
  // Portal Mode: 'player' or 'partner'
  const [portalMode, setPortalMode] = useState(() => {
    return localStorage.getItem('arenaiq_portal') || 'player';
  });

  // Player User Profile - strictly null by default so ANY new visitor is forced to register/login!
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('arenaiq_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        // Cleanse any legacy mock or test sessions
        if (
          parsed?.id === 'player_dhairya' ||
          parsed?.name === 'Dhairya Shah' ||
          parsed?.id === 'player_aman' ||
          parsed?.name === 'Aman Varma'
        ) {
          localStorage.removeItem('arenaiq_user');
          localStorage.removeItem('arenaiq_saved_account');
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse user from localStorage", e);
    }
    return null;
  });

  // Venue Partner Profile
  const [currentPartner, setCurrentPartner] = useState(() => {
    try {
      const saved = localStorage.getItem('arenaiq_partner');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse partner from localStorage", e);
    }
    return null;
  });

  // Active Tab for Player: strictly 'venues', 'squad', or 'bookings'
  const [activeTab, setActiveTab] = useState('venues');
  const [health, setHealth] = useState(null);
  const [realtime, setRealtime] = useState(null);

  // Global portal switch listener
  useEffect(() => {
    window.arenaiq_switch_portal = (mode) => {
      setPortalMode(mode);
      localStorage.setItem('arenaiq_portal', mode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return () => {
      delete window.arenaiq_switch_portal;
    };
  }, []);

  useEffect(() => {
    loadPipelineMetrics();
    const interval = setInterval(loadPipelineMetrics, 2500);
    return () => clearInterval(interval);
  }, []);

  async function loadPipelineMetrics() {
    try {
      const [h, r] = await Promise.all([
        fetchHealth(),
        fetchRealtimeMetrics()
      ]);
      setHealth(h);
      setRealtime(r);
    } catch (err) {
      // Graceful fallback while backend is spinning up
    }
  }

  function handleAuthSuccess(account, mode) {
    if (mode === 'partner') {
      setCurrentPartner(account);
      localStorage.setItem('arenaiq_partner', JSON.stringify(account));
      setPortalMode('partner');
      localStorage.setItem('arenaiq_portal', 'partner');
    } else {
      setCurrentUser(account);
      localStorage.setItem('arenaiq_user', JSON.stringify(account));
      setPortalMode('player');
      localStorage.setItem('arenaiq_portal', 'player');
    }
  }

  async function handlePlayerLogout() {
    if (currentUser) {
      await logoutUser(currentUser).catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem('arenaiq_user');
  }

  async function handlePartnerLogout() {
    if (currentPartner) {
      await logoutUser({ id: currentPartner.id, name: currentPartner.partner_name, email: currentPartner.email, role: 'partner' }).catch(() => {});
    }
    setCurrentPartner(null);
    localStorage.removeItem('arenaiq_partner');
  }

  // =========================================================================
  // ROUTE 1: EXCLUSIVE VENUE PARTNER HUB (SUB-WEBSITE)
  // =========================================================================
  if (portalMode === 'partner') {
    if (!currentPartner) {
      return (
        <div className="app-wrapper">
          <div className="bg-glow-mesh" />
          <AuthScreen
            defaultPortal="partner"
            onLoginSuccess={handleAuthSuccess}
          />
        </div>
      );
    }

    return (
      <PartnerHub
        partner={currentPartner}
        onLogout={handlePartnerLogout}
        onSwitchToPlayerPortal={() => {
          setPortalMode('player');
          localStorage.setItem('arenaiq_portal', 'player');
        }}
      />
    );
  }

  // =========================================================================
  // ROUTE 2: PLAYER / ATHLETE DISCOVERY & BOOKING PORTAL
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="app-wrapper">
        <div className="bg-glow-mesh" />
        <AuthScreen
          defaultPortal="player"
          onLoginSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="bg-glow-mesh" />

      {/* Player Navigation Header */}
      <Navbar
        activeTab={activeTab === 'analytics' ? 'venues' : activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogout={handlePlayerLogout}
        realtime={realtime}
      />

      {/* Main Content View Switcher */}
      <main style={{ flex: 1 }}>
        {activeTab === 'venues' && (
          <BookingPortal user={currentUser} onOpenSquadRadar={() => setActiveTab('squad')} />
        )}
        {activeTab === 'squad' && (
          <FillSquadRadar user={currentUser} />
        )}
        {activeTab === 'bookings' && (
          <MyBookings 
            user={currentUser} 
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('arenaiq_user', JSON.stringify(updated));
            }} 
          />
        )}
      </main>

      {/* Player Footer with discreet Arena Partner Gateway */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 10, 18, 0.95)',
        padding: '1.8rem 2rem',
        marginTop: '3rem',
        fontSize: '0.82rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong style={{ color: '#ffffff' }}>ArenaIQ</strong> — Next-Generation Sports Venue Discovery &amp; Demand Intelligence
            <div style={{ marginTop: '2px', fontSize: '0.74rem' }}>
              © 2026 ArenaIQ Inc. All rights reserved. Operating across Ahmedabad &amp; Gandhinagar.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            <span onClick={() => setActiveTab('venues')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Browse Arenas</span>
            <span onClick={() => setActiveTab('squad')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Squad Radar</span>
            <span onClick={() => setActiveTab('bookings')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>My Passes</span>
            <span
              onClick={() => {
                setPortalMode('partner');
                localStorage.setItem('arenaiq_portal', 'partner');
              }}
              style={{
                color: '#c084fc',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(168, 85, 247, 0.1)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              🏢 Venue Partner Hub ↗
            </span>
            <span onClick={handlePlayerLogout} style={{ color: '#fb7185', cursor: 'pointer' }}>Sign Out</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
