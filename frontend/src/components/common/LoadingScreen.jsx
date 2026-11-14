import React from 'react'

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      gap: '20px',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 56,
        height: 56,
        background: 'var(--brand-primary)',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
        fontWeight: 900,
        color: 'white',
        letterSpacing: '-2px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        SB
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</p>
      </div>
    </div>
  )
}
