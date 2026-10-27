import React, { useState } from 'react';
import {
  Zap, ShieldCheck, Users, Clock, Award, ArrowRight, Lock,
  Mail, Phone, User, CheckCircle2, Building2, FileText, MapPin, Sparkles
} from 'lucide-react';
import { loginUser, loginPartner, registerPartner } from '../services/api';

export default function AuthScreen({ onLoginSuccess, defaultPortal = 'player' }) {
  // Top-level portal mode: 'player' or 'partner'
  const [portalMode, setPortalMode] = useState(defaultPortal);

  // PLAYER PORTAL STATE
  const [playerAuthMode, setPlayerAuthMode] = useState('demo'); // 'demo', 'signin', 'signup'
  const [playerEmailOrPhone, setPlayerEmailOrPhone] = useState('dhairya.shah@arenaiq.in');
  const [playerPassword, setPlayerPassword] = useState('password123');
  const [playerName, setPlayerName] = useState('');
  const [playerCity, setPlayerCity] = useState('Ahmedabad');

  // VENUE PARTNER PORTAL STATE
  const [partnerAuthMode, setPartnerAuthMode] = useState('register'); // 'register', 'signin', 'demo'
  const [partnerBusinessName, setPartnerBusinessName] = useState('');
  const [partnerOwnerName, setPartnerOwnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCity, setPartnerCity] = useState('Ahmedabad');
  const [partnerArea, setPartnerArea] = useState('Sindhu Bhavan / Bodakdev');
  const [partnerGst, setPartnerGst] = useState('');
  const [partnerSports, setPartnerSports] = useState(['Cricket', 'Football']);
  const [partnerPassword, setPartnerPassword] = useState('partner123');

  // Partner Sign-in fields
  const [partnerLoginQuery, setPartnerLoginQuery] = useState('rajesh.patel@bodakdevturf.in');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ----------------------------------------------------
  // PLAYER AUTHENTICATION
  // ----------------------------------------------------
  async function handlePlayerAuth(e, selectedUser = null) {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const targetLogin = selectedUser || playerEmailOrPhone;

    try {
      const res = await loginUser(targetLogin, playerPassword);
      onLoginSuccess(res.user, 'player');
    } catch (err) {
      setErrorMsg(err.message || 'Player authentication failed');
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // PARTNER REGISTRATION (ONE-TIME & REMEMBERED)
  // ----------------------------------------------------
  async function handlePartnerRegister(e) {
    if (e) e.preventDefault();
    if (!partnerBusinessName.trim() || !partnerOwnerName.trim() || !partnerEmail.trim() || !partnerPhone.trim()) {
      setErrorMsg("Please complete all required fields for genuine business verification.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        partner_name: partnerOwnerName.trim(),
        business_name: partnerBusinessName.trim(),
        email: partnerEmail.trim().toLowerCase(),
        phone: partnerPhone.trim(),
        city: partnerCity.trim(),
        area: partnerArea.trim(),
        gst_number: partnerGst.trim(),
        password: partnerPassword,
        sports_hosted: partnerSports,
        operating_hours: "06:00 AM - 01:00 AM"
      };

      const res = await registerPartner(payload);
      onLoginSuccess(res.partner, 'partner');
    } catch (err) {
      setErrorMsg(err.message || "Failed to register partner account");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // PARTNER LOGIN (EXISTING OR DEMO)
  // ----------------------------------------------------
  async function handlePartnerLogin(e, demoPartnerQuery = null) {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const target = demoPartnerQuery || partnerLoginQuery;

    try {
      const res = await loginPartner(target, "partner123");
      onLoginSuccess(res.partner, 'partner');
    } catch (err) {
      setErrorMsg(err.message || "Partner sign in failed");
    } finally {
      setLoading(false);
    }
  }

  function togglePartnerSport(sp) {
    if (partnerSports.includes(sp)) {
      if (partnerSports.length > 1) {
        setPartnerSports(partnerSports.filter(s => s !== sp));
      }
    } else {
      setPartnerSports([...partnerSports, sp]);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        maxWidth: '1120px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '3rem',
        alignItems: 'center'
      }}>

        {/* =========================================================================
            LEFT COLUMN: BRAND & VALUE STORY (ADAPTS TO PORTAL MODE)
        ========================================================================= */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
            <img
              src={portalMode === 'player' ? '/player_logo.jpg' : '/partner_logo.jpg'}
              alt={portalMode === 'player' ? 'ArenaIQ Player Logo' : 'ArenaIQ Partner Logo'}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                objectFit: 'cover',
                border: portalMode === 'player' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                boxShadow: portalMode === 'player' ? '0 0 24px rgba(6, 182, 212, 0.4)' : '0 0 24px rgba(168, 85, 247, 0.4)'
              }}
            />
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
                Arena<span style={{ color: portalMode === 'player' ? 'var(--accent-cyan)' : '#c084fc' }}>IQ</span>
              </span>
              <span style={{
                marginLeft: '8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '6px',
                background: portalMode === 'player' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(168, 85, 247, 0.2)',
                color: portalMode === 'player' ? '#38bdf8' : '#d8b4fe',
                border: portalMode === 'player' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(168, 85, 247, 0.4)'
              }}>
                {portalMode === 'player' ? 'PLAYER PORTAL' : 'EXCLUSIVE PARTNER HUB'}
              </span>
            </div>
          </div>

          {portalMode === 'player' ? (
            <>
              <h1 style={{ fontSize: '2.5rem', lineHeight: 1.18, color: '#ffffff', marginBottom: '1.2rem', letterSpacing: '-0.02em', fontWeight: 800 }}>
                Play More, Spend Less, and Never Fall Short of Players
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Welcome to Gujarat's premier sports turf platform. Book Box Cricket, Futsal, Badminton, and Pickleball courts with dynamic off-peak pricing, automated bill splitting, and instant substitute matchmaking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                  </div>
                  <span style={{ fontSize: '0.92rem', color: '#f3f4f6' }}>
                    <strong>Smart Off-Peak Rates:</strong> Save up to 45% on daytime and late-night bookings
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#38bdf8" />
                  </div>
                  <span style={{ fontSize: '0.92rem', color: '#f3f4f6' }}>
                    <strong>Fill-My-Squad Radar:</strong> Call in reliable substitutes when teammates drop out
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#fbbf24" />
                  </div>
                  <span style={{ fontSize: '0.92rem', color: '#f3f4f6' }}>
                    <strong>FairPlay Reliability Score:</strong> Verified captains, zero cancellations, instant refunds
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '2.5rem', lineHeight: 1.18, color: '#ffffff', marginBottom: '1.2rem', letterSpacing: '-0.02em', fontWeight: 800 }}>
                Fill Idle Afternoon Slots &amp; Grow Venue Revenue
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                The dedicated management suite for arena owners, turf operators, and sports clubs across Ahmedabad and Gandhinagar. List your courts, automate dynamic yield pricing, and access real-time demand intelligence.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#c084fc" />
                  </div>
                  <span style={{ fontSize: '0.92rem', color: '#f3f4f6' }}>
                    <strong>Direct Venue Listing:</strong> Register multiple courts, AstroTurf surfaces, and custom rates
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                  </div>
                  <span style={{ fontSize: '0.92rem', color: '#f3f4f6' }}>
                    <strong>Dynamic Yield Levers:</strong> Boost total daily revenue by +18.4% through off-peak discounts
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#38bdf8" />
                  </div>
                  <span style={{ fontSize: '0.92rem', color: '#f3f4f6' }}>
                    <strong>Big Data Telemetry:</strong> Apache Kafka event streaming &amp; Hadoop MapReduce demand heatmaps
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Bottom Switch Note */}
          <div style={{
            marginTop: '2.5rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            color: 'var(--text-dim)'
          }}>
            {portalMode === 'player' ? (
              <span>
                Are you a sports arena or box cricket turf owner?{' '}
                <button
                  onClick={() => { setPortalMode('partner'); setErrorMsg(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#c084fc', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Enter Venue Partner Hub ↗
                </button>
              </span>
            ) : (
              <span>
                Looking to book a court or join a match?{' '}
                <button
                  onClick={() => { setPortalMode('player'); setErrorMsg(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Switch to Player Portal ↗
                </button>
              </span>
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: DUAL-PORTAL AUTHENTICATION CARD
        ========================================================================= */}
        <div className="glass-panel" style={{
          padding: '2.2rem',
          background: 'rgba(15, 23, 42, 0.95)',
          border: portalMode === 'player' ? '1px solid var(--border-subtle)' : '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          boxShadow: portalMode === 'player' ? '0 20px 50px rgba(0, 0, 0, 0.6)' : '0 20px 50px rgba(168, 85, 247, 0.15)'
        }}>

          {/* TOP PORTAL SELECTOR TOGGLE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.6rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => { setPortalMode('player'); setErrorMsg(''); }}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: portalMode === 'player' ? 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)' : 'transparent',
                color: portalMode === 'player' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              🏃 Player Portal
            </button>

            <button
              type="button"
              onClick={() => { setPortalMode('partner'); setErrorMsg(''); }}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: portalMode === 'partner' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'transparent',
                color: portalMode === 'partner' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              🏢 Venue Partner Hub
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: '#fda4af',
              marginBottom: '1.2rem'
            }}>
              {errorMsg}
            </div>
          )}

          {/* =====================================================================
              MODE A: PLAYER PORTAL LOGIN & SIGNUP
          ===================================================================== */}
          {portalMode === 'player' && (
            <div>
              {/* Secondary Sub-Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPlayerAuthMode('demo')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: playerAuthMode === 'demo' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: playerAuthMode === 'demo' ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                    color: playerAuthMode === 'demo' ? '#38bdf8' : 'var(--text-muted)'
                  }}
                >
                  ⚡ Quick Demo Players
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerAuthMode('signin')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: playerAuthMode === 'signin' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: playerAuthMode === 'signin' ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                    color: playerAuthMode === 'signin' ? '#38bdf8' : 'var(--text-muted)'
                  }}
                >
                  Player Sign In
                </button>
              </div>

              {playerAuthMode === 'demo' && (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    Select a verified player profile to instantly test court booking, bill splitting, and squad radar:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Demo 1 */}
                    <div
                      onClick={() => handlePlayerAuth(null, 'player_dhairya')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#ffffff'
                        }}>
                          D
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.94rem' }}>
                            Dhairya Shah <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>105 Reliability</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            Verified Team Captain • Ahmedabad (Bodakdev)
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} color="var(--accent-cyan)" />
                    </div>

                    {/* Demo 2 */}
                    <div
                      onClick={() => handlePlayerAuth(null, 'player_aman')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#ffffff'
                        }}>
                          A
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.94rem' }}>
                            Aman Varma <span className="badge badge-lime" style={{ fontSize: '0.62rem' }}>102 Reliability</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            Futsal Striker &amp; Singles Badminton • Gandhinagar
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} color="var(--accent-lime)" />
                    </div>
                  </div>
                </div>
              )}

              {playerAuthMode === 'signin' && (
                <form onSubmit={handlePlayerAuth}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Player Email or Phone
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={playerEmailOrPhone}
                      onChange={e => setPlayerEmailOrPhone(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      required
                      value={playerPassword}
                      onChange={e => setPlayerPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In as Player'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =====================================================================
              MODE B: EXCLUSIVE VENUE PARTNER REGISTRATION & SIGNIN
          ===================================================================== */}
          {portalMode === 'partner' && (
            <div>
              {/* Partner Sub-Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPartnerAuthMode('register')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: partnerAuthMode === 'register' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                    border: partnerAuthMode === 'register' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                    color: partnerAuthMode === 'register' ? '#d8b4fe' : 'var(--text-muted)'
                  }}
                >
                  📝 New Partner Registration
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerAuthMode('demo')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: partnerAuthMode === 'demo' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                    border: partnerAuthMode === 'demo' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                    color: partnerAuthMode === 'demo' ? '#d8b4fe' : 'var(--text-muted)'
                  }}
                >
                  ⚡ Verified Partners
                </button>
              </div>

              {/* PARTNER REGISTRATION FORM (ONE-TIME & REMEMBERED) */}
              {partnerAuthMode === 'register' && (
                <form onSubmit={handlePartnerRegister}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Business / Turf Entity Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Sindhu Turf Club"
                        value={partnerBusinessName}
                        onChange={e => setPartnerBusinessName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Owner / Operator Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Nirav Patel"
                        value={partnerOwnerName}
                        onChange={e => setPartnerOwnerName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Business Email *
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="partner@turf.in"
                        value={partnerEmail}
                        onChange={e => setPartnerEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        WhatsApp / Contact Phone *
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="+91 98250 12345"
                        value={partnerPhone}
                        onChange={e => setPartnerPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Operating City *
                      </label>
                      <select
                        className="input-field"
                        value={partnerCity}
                        onChange={e => setPartnerCity(e.target.value)}
                      >
                        <option value="Ahmedabad">Ahmedabad</option>
                        <option value="Gandhinagar">Gandhinagar</option>
                        <option value="Surat">Surat</option>
                        <option value="Vadodara">Vadodara</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Turf Area / Hub *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Sindhu Bhavan / Bodakdev"
                        value={partnerArea}
                        onChange={e => setPartnerArea(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      GSTIN / Business Registration License (Genuine Verification)
                    </label>
                    <input
                      type="text"
                      className="input-field font-mono"
                      placeholder="e.g. 24AAACG9988F1Z2"
                      value={partnerGst}
                      onChange={e => setPartnerGst(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: '1.4rem' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Sports Hosted at Venue:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {["Cricket", "Football", "Badminton", "Pickleball", "Tennis"].map(sp => (
                        <button
                          type="button"
                          key={sp}
                          onClick={() => togglePartnerSport(sp)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: partnerSports.includes(sp) ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.02)',
                            border: partnerSports.includes(sp) ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                            color: partnerSports.includes(sp) ? '#ffffff' : 'var(--text-dim)'
                          }}
                        >
                          {partnerSports.includes(sp) ? '✓ ' : '+ '}{sp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 18px rgba(168, 85, 247, 0.35)'
                    }}
                  >
                    {loading ? 'Verifying & Registering...' : '✨ Register & Unlock Partner Hub'}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px', margin: '8px 0 0 0' }}>
                    Registration is one-time and automatically remembered on this device.
                  </p>
                </form>
              )}

              {/* PARTNER DEMO QUICK-SWITCH ACCOUNTS */}
              {partnerAuthMode === 'demo' && (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    Select an established verified venue partner to test arena management and demand telemetry:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Partner 1 */}
                    <div
                      onClick={() => handlePartnerLogin(null, 'rajesh.patel@bodakdevturf.in')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#ffffff'
                        }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.94rem' }}>
                            Bodakdev Sports Hub &amp; Turf Arena
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            Operator: Rajesh Patel • Ahmedabad (2 Venues, 5 Courts)
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} color="#c084fc" />
                    </div>

                    {/* Partner 2 */}
                    <div
                      onClick={() => handlePartnerLogin(null, 'hardik.shah@infocityturf.in')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#ffffff'
                        }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.94rem' }}>
                            Infocity Turf Hub &amp; Sports Club
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            Operator: Hardik Shah • Gandhinagar (2 Venues, 4 Courts)
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} color="#818cf8" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
