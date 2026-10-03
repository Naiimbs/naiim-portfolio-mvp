import React from 'react';

export default function Grid({ showGuides = true, activeSection = null }) {
  return (
    <div className="motion-grid-overlay" aria-hidden="true">
      {showGuides && (
        <>
          <div
            className="motion-guide-box"
            style={{
              top: '15%',
              left: '10%',
              width: '80%',
              height: '65%',
              borderColor: activeSection === 'canvas' ? 'var(--motion-green)' : undefined,
            }}
          >
            <span className="motion-guide-tag">LAYOUT_FRAME · 12_COL</span>
          </div>

          <div
            className="motion-guide-box"
            style={{
              top: '25%',
              right: '12%',
              width: '24%',
              height: '45%',
              borderColor: activeSection === 'inspector' ? 'var(--motion-yellow)' : undefined,
            }}
          >
            <span className="motion-guide-tag">PROPERTIES</span>
          </div>
        </>
      )}
    </div>
  );
}
