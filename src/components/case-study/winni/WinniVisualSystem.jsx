import React from 'react';

export default function WinniVisualSystem() {
  const colorTokens = [
    { name: 'Graphite Black', hex: '#111418', role: '#111418 · Text & Primary' },
    { name: 'Muted Slate', hex: '#45575e', role: '#45575E · Body Copy' },
    { name: 'Warm Neutral', hex: '#dfe5e1', role: '#DFE5E1 · Borders' },
    { name: 'Soft Paper', hex: '#f8f9f6', role: '#F8F9F6 · Background' },
    { name: 'Status Emerald', hex: '#087f66', role: '#087F66 · Active State' },
  ];

  const icons = [
    { name: 'Voiture', icon: 'bi-car-front', colorClass: 'text-dark' },
    { name: 'Moto', icon: 'bi-bicycle', colorClass: 'text-dark' },
    { name: 'Bagage', icon: 'bi-suitcase', colorClass: 'text-dark' },
    { name: 'Scan', icon: 'bi-qr-code-scan', colorClass: 'text-dark' },
    { name: 'Privé', icon: 'bi-shield-check', colorClass: 'text-success' },
    { name: 'Lieu', icon: 'bi-geo-alt', colorClass: 'text-dark' },
  ];

  return (
    <section className="winni-section" id="visual-system">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">10 · VISUAL SYSTEM</span>
          <h2 className="winni-section-title">Quiet technology.</h2>
          <p className="winni-copy-lg">
            Designed around black, white, graphite, and warm neutrals. Functional color is introduced only when it
            communicates a verified system state.
          </p>
        </div>

        {/* Color Tokens */}
        <h3 className="fs-5 fw-bold mb-3">Color Foundations</h3>
        <div className="winni-token-grid winni-roles-grid">
          {colorTokens.map((token, idx) => (
            <div className="winni-token-card" key={idx}>
              <div className="winni-token-swatch" style={{ background: token.hex }}></div>
              <div className="winni-token-info">
                <strong>{token.name}</strong>
                <span>{token.role}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Typography & Icon System */}
        <div className="row g-4 mt-1">
          <div className="col-lg-6">
            <div className="p-4 bg-white rounded-3 border h-100">
              <h4 className="fs-6 fw-bold text-muted mb-3">TYPOGRAPHY HIERARCHY</h4>
              <div className="mb-3">
                <span className="badge bg-light text-dark border mb-1">Display &amp; Headings</span>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  Space Grotesk Bold
                </div>
                <div className="text-muted small">Geometric, modern, highly legible numbers and acronyms.</div>
              </div>
              <div className="pt-3 border-top">
                <span className="badge bg-light text-dark border mb-1">Body &amp; Micro-copy</span>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem', lineHeight: 1.5 }}>
                  DM Sans Regular &amp; Medium
                </div>
                <div className="text-muted small">Humanist proportion, warm curves, optimized for mobile screens.</div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="p-4 bg-white rounded-3 border h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fs-6 fw-bold text-muted mb-0">ICON SYSTEM (24 × 24 GRID · 1.75PX STROKE)</h4>
                <span className="badge bg-dark text-white">Consistent Geometry</span>
              </div>
              <div className="winni-icons-showcase">
                {icons.map((item, idx) => (
                  <div className="winni-icon-item" key={idx}>
                    <div className="winni-icon-box">
                      <i className={`bi ${item.icon} fs-5 ${item.colorClass}`}></i>
                    </div>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted small mt-3 mb-0">
                Non-directional object icons remain invariant in RTL (Arabic) contexts, maintaining immediate visual
                recognition across language barriers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
