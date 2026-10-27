import React, { useState } from 'react';
import { Zap, Play, Flame, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { simulateTrafficBurst, triggerHadoopMapReduce } from '../services/api';

export default function FacultyDemoPanel({ onActionSuccess }) {
  const [runningSim, setRunningSim] = useState(false);
  const [runningMR, setRunningMR] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  async function handleInjectTraffic(count, sport = null) {
    setRunningSim(true);
    setStatusMessage(`Simulating ${count} concurrent user actions across venues...`);
    try {
      await simulateTrafficBurst(count, sport || '');
      setStatusMessage(`✅ Successfully processed ${count} high-velocity user actions across the network.`);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setRunningSim(false);
    }
  }

  async function handleTriggerMapReduce() {
    setRunningMR(true);
    setStatusMessage("Aggregating historical occupancy and recalculating demand curves...");

    try {
      await triggerHadoopMapReduce();
      setStatusMessage("✅ Demand & Yield Optimization completed: Historical heatmaps and price elasticity curves recalculated successfully.");
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setStatusMessage(`❌ Analytics job encountered an issue: ${err.message}`);
    } finally {
      setRunningMR(false);
    }
  }

  return (
    <div className="glass-panel" style={{
      padding: '1.8rem',
      background: 'rgba(12, 18, 34, 0.95)',
      border: '1px solid rgba(168, 85, 247, 0.35)',
      boxShadow: '0 0 25px rgba(168, 85, 247, 0.08)',
      borderRadius: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={20} color="var(--accent-purple)" />
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
            Simulated Traffic &amp; Yield Optimization Deck
          </h3>
        </div>
        <span className="badge badge-purple font-mono" style={{ fontSize: '0.74rem' }}>
          NETWORK SIMULATION
        </span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1.4rem' }}>
        Trigger controlled high-concurrency traffic bursts or execute batch demand modeling across partner facilities:
      </p>

      {/* Buttons Deck */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.2rem'
      }}>
        <button
          onClick={() => handleInjectTraffic(50)}
          disabled={runningSim}
          className="btn btn-primary"
          style={{ padding: '12px', fontSize: '0.85rem' }}
        >
          <Zap size={16} />
          {runningSim ? "Simulating..." : "Simulate 50 Weekend Bookings"}
        </button>

        <button
          onClick={() => handleInjectTraffic(80, "Football")}
          disabled={runningSim}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            padding: '12px',
            fontSize: '0.85rem'
          }}
        >
          <Flame size={16} />
          {runningSim ? "Simulating..." : "Simulate Sudden Futsal Rush (80)"}
        </button>

        <button
          onClick={handleTriggerMapReduce}
          disabled={runningMR}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
            padding: '12px',
            fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={16} className={runningMR ? "spin" : ""} />
          {runningMR ? "Processing Batch Data..." : "Run Demand & Yield Optimization"}
        </button>
      </div>

      {/* Clean Status Card */}
      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: statusMessage.startsWith('❌') ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: statusMessage.startsWith('❌') ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#ffffff',
          fontWeight: 600
        }}>
          {statusMessage.startsWith('❌') ? null : <CheckCircle size={16} color="var(--accent-lime)" />}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
