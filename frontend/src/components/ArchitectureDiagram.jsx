import React from 'react';
import { ArrowRight, Radio, Database, HardDrive, Cpu, Layout, Sparkles } from 'lucide-react';

export default function ArchitectureDiagram() {
  return (
    <div className="glass-panel" style={{ padding: '1.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
            ArenaIQ Lambda Big Data Architecture Blueprint
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
            Academic Lambda Architecture decoupling Speed Layer from Distributed Batch Layer
          </p>
        </div>
        <span className="badge badge-cyan font-mono" style={{ fontSize: '0.72rem' }}>
          SYSTEM TOPOLOGY
        </span>
      </div>

      {/* Diagram flow */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        alignItems: 'stretch'
      }}>
        {/* Step 1 */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layout size={18} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>1. Client Events</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
            User actions trigger fine-grained events: Searches, Slot selections, Bookings, Sub Requests.
          </p>
          <span className="badge badge-cyan" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>FastAPI REST</span>
        </div>

        {/* Step 2 */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Radio size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>2. Apache Kafka</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
            Distributed broker ingests high-velocity JSON event streams across partitioned topics.
          </p>
          <span className="badge badge-cyan" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>Port 9092</span>
        </div>

        {/* Step 3 (Branch A: Speed Layer) */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="var(--accent-lime)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>3A. Speed Layer</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
            Real-time Kafka Consumer tracks moving average throughput (ev/s), active sports, and live alert feeds.
          </p>
          <span className="badge badge-lime" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>Sub-second Latency</span>
        </div>

        {/* Step 4 (Branch B: Cold Storage Lake) */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HardDrive size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>3B. Hadoop HDFS</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
            Immutable partitioned cold data lake archiving raw records: <code>/partition_date=YYYY-MM-DD</code>.
          </p>
          <span className="badge badge-amber" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>Cold Data Lake</span>
        </div>

        {/* Step 5 (Batch Processing) */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Cpu size={18} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>4. MapReduce</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
            Python Streaming MapReduce (Mapper &gt; Shuffle &gt; Reducer) crunches batch demand &amp; elasticity curves.
          </p>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>Batch Analytics</span>
        </div>

        {/* Step 6 (Serving DB) */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Database size={18} color="var(--accent-lime)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>5. MongoDB OLTP</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
            Operational document store serving fast slot lookups, atomic booking reservations, and Player Reliability scores.
          </p>
          <span className="badge badge-lime" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>Port 27017</span>
        </div>
      </div>
    </div>
  );
}
