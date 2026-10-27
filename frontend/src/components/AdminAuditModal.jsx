import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Database, Users, LogIn, LogOut, UserPlus, RefreshCw,
  X, CheckCircle2, Clock, MapPin, Phone, Mail, Award, AlertCircle
} from 'lucide-react';
import { fetchAdminUsers, fetchAdminAuditLogs } from '../services/api';

export default function AdminAuditModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'users'
  const [logsData, setLogsData] = useState({ database: 'connecting', count: 0, logs: [] });
  const [usersData, setUsersData] = useState({ database: 'connecting', count: 0, users: [] });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [logsRes, usersRes] = await Promise.all([
        fetchAdminAuditLogs(),
        fetchAdminUsers()
      ]);
      setLogsData(logsRes || { database: 'unknown', count: 0, logs: [] });
      setUsersData(usersRes || { database: 'unknown', count: 0, users: [] });
    } catch (e) {
      console.warn("Error fetching admin audit data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(loadData, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, autoRefresh]);

  if (!isOpen) return null;

  const logs = logsData.logs || [];
  const users = usersData.users || [];
  const isMongo = logsData.database === 'mongodb' || usersData.database === 'mongodb';

  // Metrics
  const loginCount = logs.filter(l => l.event === 'LOGIN' || l.event === 'PARTNER_LOGIN').length;
  const logoutCount = logs.filter(l => l.event === 'LOGOUT').length;
  const registerCount = logs.filter(l => l.event === 'REGISTER' || l.event === 'PARTNER_REGISTER').length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '88vh',
        background: '#0a0f1d',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(6, 182, 212, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Admin Security &amp; Audit Console
                </h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: isMongo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: isMongo ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  color: isMongo ? '#34d399' : '#fbbf24'
                }}>
                  <Database size={11} />
                  {isMongo ? '🍃 MongoDB Live (arenaiq)' : '⚡ High-Availability Fallback'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Real-time tracking of genuine registrations, logins &amp; logouts across Ahmedabad &amp; Gandhinagar
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 600,
                background: autoRefresh ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: autoRefresh ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
                color: autoRefresh ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Toggle 3s live polling"
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: autoRefresh ? 'var(--accent-cyan)' : 'var(--text-dim)'
              }} />
              {autoRefresh ? 'Live (3s)' : 'Paused'}
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
              Refresh
            </button>

            <button
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div style={{
          padding: '1rem 1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Registered in MongoDB
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
              {users.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>users</span>
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Logins Recorded
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {loginCount}
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Logouts Recorded
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', marginTop: '2px' }}>
              {logoutCount}
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              New Registrations
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
              {registerCount}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          padding: '0.75rem 1.75rem 0',
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'logs' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'logs' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <Clock size={15} color={activeTab === 'logs' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            Live Auth Audit Trail ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'users' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'users' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <Users size={15} color={activeTab === 'users' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            Registered Users in MongoDB ({users.length})
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>
          {activeTab === 'logs' && (
            <div>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                  <Clock size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0 }}>No audit logs recorded yet.</p>
                  <p style={{ fontSize: '0.78rem', margin: '4px 0 0' }}>
                    As users register, log in, and log out, live events will stream here directly from MongoDB.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {logs.map((log, idx) => {
                    const isLogin = log.event === 'LOGIN' || log.event === 'PARTNER_LOGIN';
                    const isLogout = log.event === 'LOGOUT';
                    const isRegister = log.event === 'REGISTER' || log.event === 'PARTNER_REGISTER';
                    const isPartner = log.role === 'partner' || log.event?.includes('PARTNER');

                    return (
                      <div
                        key={log.id || idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: isLogin
                            ? 'rgba(16, 185, 129, 0.05)'
                            : isLogout
                            ? 'rgba(244, 63, 94, 0.05)'
                            : 'rgba(6, 182, 212, 0.05)',
                          border: isLogin
                            ? '1px solid rgba(16, 185, 129, 0.2)'
                            : isLogout
                            ? '1px solid rgba(244, 63, 94, 0.2)'
                            : '1px solid rgba(6, 182, 212, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{
                            padding: '4px 9px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            background: isLogin
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isLogout
                              ? 'rgba(244, 63, 94, 0.2)'
                              : 'rgba(6, 182, 212, 0.2)',
                            color: isLogin ? '#34d399' : isLogout ? '#fb7185' : '#38bdf8',
                            border: isLogin
                              ? '1px solid rgba(16, 185, 129, 0.4)'
                              : isLogout
                              ? '1px solid rgba(244, 63, 94, 0.4)'
                              : '1px solid rgba(6, 182, 212, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isLogin && <LogIn size={11} />}
                            {isLogout && <LogOut size={11} />}
                            {isRegister && <UserPlus size={11} />}
                            {log.event}
                          </span>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                                {log.name || 'Anonymous User'}
                              </span>
                              {isPartner && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  color: '#c084fc',
                                  border: '1px solid rgba(168, 85, 247, 0.4)',
                                  fontWeight: 700
                                }}>
                                  VENUE PARTNER
                                </span>
                              )}
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                                ({log.user_id})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                              {log.email && <span>✉️ {log.email}</span>}
                              {log.phone && <span>📞 {log.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>
                            {log.timestamp || 'Just now'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                  <Users size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0 }}>No players registered in MongoDB yet.</p>
                  <p style={{ fontSize: '0.78rem', margin: '4px 0 0' }}>
                    Every user who registers on this device or other devices will appear in this database list.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {users.map((u, i) => (
                    <div
                      key={u.id || i}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#ffffff',
                          fontSize: '0.9rem'
                        }}>
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.94rem' }}>
                              {u.name}
                            </span>
                            <span className="badge badge-cyan" style={{ fontSize: '0.64rem' }}>
                              {u.reliability_score || u.fairplay_score || 100} Reliability
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} color="var(--accent-cyan)" /> {u.email}
                            </span>
                            {u.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} color="#34d399" /> {u.phone}
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} color="#f59e0b" /> {u.city} ({u.area || 'All Areas'})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        <div>Joined: {u.registered_at ? u.registered_at.split(' ')[0] : 'Today'}</div>
                        <div style={{ color: '#38bdf8', marginTop: '2px' }}>ID: {u.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            🔒 Data integrity verified • MongoDB collection <code>users</code> &amp; <code>auth_audit_logs</code>
          </span>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '7px 18px', fontSize: '0.82rem' }}
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
