import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ArenaIQ ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070a12',
          color: '#ffffff',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            maxWidth: '540px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '0.8rem' }}>
              Recovering ArenaIQ Session
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
              A temporary display error was caught: <code>{this.state.error?.message || "Unknown error"}</code>.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('arenaiq_user');
                window.location.reload();
              }}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Session &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
