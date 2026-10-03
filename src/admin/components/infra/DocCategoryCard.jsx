import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DocCategoryCard — navigation card for a documentation section.
 * Renders as a clickable card linking to a documentation route.
 */
export default function DocCategoryCard({ to, icon, title, description, tags = [] }) {
  return (
    <Link
      to={to}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          marginBottom: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#087f66';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(8, 127, 102, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--line, #dfe7e4)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 36, 42, 0.03)';
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(8, 127, 102, 0.08)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            flexShrink: 0,
          }}
        >
          <i
            className={`bi ${icon}`}
            style={{ fontSize: '1.25rem', color: '#087f66' }}
          />
        </div>

        {/* Title */}
        <h4
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#10242a',
            margin: '0 0 6px 0',
          }}
        >
          {title}
        </h4>

        {/* Description */}
        <p
          style={{
            fontSize: '0.82rem',
            color: '#718187',
            margin: 0,
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: '#f0f4f2',
                  color: '#42545a',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Arrow */}
        <div
          style={{
            marginTop: '14px',
            fontSize: '0.78rem',
            color: '#087f66',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Read guide <i className="bi bi-arrow-right" />
        </div>
      </div>
    </Link>
  );
}
