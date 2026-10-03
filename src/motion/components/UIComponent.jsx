import React from 'react';

export function CardPreview({
  title = 'Object Identity Card',
  status = 'LIVE',
  category = 'Physical Tag #084',
  highlight = false,
  metrics = { scans: '142', resolved: '99.4%' },
}) {
  return (
    <div className={`motion-card-preview ${highlight ? 'active-spec' : ''}`}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--motion-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--motion-font-mono)',
            }}
          >
            {category}
          </span>
          <h4
            style={{
              margin: '2px 0 0',
              fontSize: '1rem',
              color: 'var(--motion-ink)',
              fontFamily: 'var(--motion-font-heading)',
            }}
          >
            {title}
          </h4>
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: '99px',
            background: 'var(--motion-green-soft)',
            color: 'var(--motion-green)',
            border: '1px solid var(--motion-green)',
            fontFamily: 'var(--motion-font-mono)',
            fontWeight: 700,
          }}
        >
          {status}
        </span>
      </div>

      <div
        className="d-flex gap-3 py-2 my-2"
        style={{
          borderTop: '1px solid var(--motion-line)',
          borderBottom: '1px solid var(--motion-line)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--motion-muted)' }}>Interactions</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--motion-ink)' }}>
            {metrics.scans}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--motion-muted)' }}>Recovery Rate</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--motion-yellow)' }}>
            {metrics.resolved}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--motion-muted)',
            fontFamily: 'var(--motion-font-mono)',
          }}
        >
          Tokens: 16px · #087F66
        </span>
        <button
          type="button"
          style={{
            background: 'var(--motion-green)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '0.7rem',
            padding: '4px 10px',
            fontFamily: 'var(--motion-font-body)',
            fontWeight: 600,
          }}
        >
          Notify Owner
        </button>
      </div>
    </div>
  );
}

export function SpecInspector({
  tokens = [
    { label: 'FRAME', val: '720 × 440' },
    { label: 'RADIUS', val: '12px' },
    { label: 'PALETTE', val: '#087F66 · Primary', accent: 'green' },
    { label: 'ACCENT', val: '#EAB52E · Alert', accent: 'accent' },
    { label: 'TYPO', val: 'Space Grotesk' },
    { label: 'GRID', val: '8pt Dynamic' },
  ],
}) {
  return (
    <div className="motion-spec-inspector">
      <div
        style={{
          color: 'var(--motion-muted)',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          borderBottom: '1px solid var(--motion-line)',
          paddingBottom: '4px',
          marginBottom: '4px',
        }}
      >
        TOKEN INSPECTOR
      </div>
      {tokens.map((t, idx) => (
        <div key={idx} className="motion-spec-row">
          <span>{t.label}</span>
          <span className={`motion-spec-val ${t.accent || ''}`}>{t.val}</span>
        </div>
      ))}
    </div>
  );
}
