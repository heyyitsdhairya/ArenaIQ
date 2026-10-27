import React from 'react';
import { Layers, Activity, Clock, TrendingUp } from 'lucide-react';

export default function PipelineHealthBar({ realtime }) {
  const speed = realtime?.speed_layer || {};

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '1.2rem auto 0 auto',
      padding: '0 2rem'
    }}>
      <div className="glass-panel" style={{
        padding: '0.9rem 1.4rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.65)'
      }}>
        {/* Metric 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <Layers size={18} color="#34d399" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6' }}>Venue Network</span>
              <span className="badge badge-lime" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Online</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
              4 Multi-Sport Arenas • 11 Courts
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.25)'
          }}>
            <Activity size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6' }}>Live Throughput</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Active</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
              Current: <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{speed.events_per_sec || 0} req/s</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            <Clock size={18} color="#fbbf24" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6' }}>Historical Records</span>
              <span className="badge badge-amber" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Synchronized</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
              Archived Logs: <span className="font-mono" style={{ color: 'var(--accent-amber)' }}>{speed.total_processed || 360}+ Events</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(168, 85, 247, 0.25)'
          }}>
            <TrendingUp size={18} color="#c084fc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6' }}>Yield Engine</span>
              <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Optimized</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
              Smart Off-Peak & Surge Pricing Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
