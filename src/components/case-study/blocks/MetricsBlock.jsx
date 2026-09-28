import React from 'react';

export default function MetricsBlock({ content = {} }) {
  const { items = [] } = content;

  if (!items || items.length === 0) return null;

  return (
    <div className="case-block my-5">
      <div className={`row g-4 ${items.length <= 2 ? 'row-cols-1 row-cols-md-2' : 'row-cols-1 row-cols-md-3'}`}>
        {items.map((m, idx) => (
          <div className="col" key={idx}>
            <div className="p-4 rounded-4 border bg-white h-100 shadow-sm">
              <div
                className="fs-1 fw-bold text-success mb-1"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {m.value}
              </div>
              <div className="fw-bold fs-6 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {m.label}
              </div>
              {m.description && <p className="text-muted small mb-0">{m.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
