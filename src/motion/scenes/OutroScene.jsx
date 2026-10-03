import React from 'react';

export default function OutroScene({ progress = 0, active = true }) {
  // progress: 0 -> 1 inside 20-24s
  return (
    <div className={`motion-scene ${active ? 'active' : ''}`}>
      {/* Background Architectural Grid */}
      <div className="motion-grid-overlay" aria-hidden="true" />

      {/* Final Editorial Signature Manifesto */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: '680px',
          zIndex: 10,
          animation: 'floatGentle 4s ease-in-out infinite',
        }}
      >
        <div
          className="motion-eyebrow"
          style={{ justifyContent: 'center', marginBottom: '0.8rem' }}
        >
          <span className="motion-eyebrow-dot"></span>
          UX · PRODUCT · AI · AUTOMATION
        </div>

        <h1
          style={{
            fontFamily: 'var(--motion-font-heading)',
            fontSize: '3.2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: '0 0 0.6rem 0',
            color: 'var(--motion-ink)',
            lineHeight: 1.05,
          }}
        >
          NAÏM BSILI
        </h1>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.2rem',
            margin: '1.2rem 0',
            fontFamily: 'var(--motion-font-heading)',
            fontSize: '1.15rem',
            fontWeight: 700,
          }}
        >
          <span style={{ color: 'var(--motion-ink)' }}>I DESIGN.</span>
          <span style={{ color: 'var(--motion-line-active)' }}>—</span>
          <span style={{ color: 'var(--motion-ink)' }}>I BUILD.</span>
          <span style={{ color: 'var(--motion-line-active)' }}>—</span>
          <span style={{ color: 'var(--motion-yellow)' }}>I EXPERIMENT.</span>
        </div>

        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--motion-muted)',
            maxWidth: '460px',
            margin: '0 auto',
            lineHeight: 1.45,
          }}
        >
          Turning ambiguous problems into usable, high-performance digital products.
        </p>
      </div>
    </div>
  );
}
