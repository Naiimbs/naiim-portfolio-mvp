import React from 'react';

export default function WorkflowNode({
  id,
  title,
  subtitle,
  icon = 'bi-gear-wide-connected',
  status = 'active',
  statusLabel = 'READY',
  x = 0,
  y = 0,
  highlight = false,
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'var(--motion-green)';
      case 'warning':
      case 'processing':
        return 'var(--motion-yellow)';
      default:
        return 'var(--motion-muted)';
    }
  };

  return (
    <div
      className="motion-workflow-node"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        background: 'rgba(16, 36, 42, 0.92)',
        border: `1px solid ${highlight ? 'var(--motion-green)' : 'var(--motion-line)'}`,
        boxShadow: highlight
          ? '0 0 20px rgba(8, 127, 102, 0.35)'
          : '0 8px 24px rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        minWidth: '150px',
        maxWidth: '180px',
        zIndex: 20,
        transition: 'all 0.4s ease',
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span
          style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--motion-font-mono)',
            color: 'var(--motion-muted)',
          }}
        >
          {id}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6rem',
            fontFamily: 'var(--motion-font-mono)',
            color: getStatusColor(),
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
            }}
          ></span>
          {statusLabel}
        </span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <i
          className={`bi ${icon}`}
          style={{
            fontSize: '1.1rem',
            color: highlight ? 'var(--motion-yellow)' : 'var(--motion-ink)',
          }}
        ></i>
        <div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'var(--motion-font-heading)',
              color: 'var(--motion-ink)',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--motion-muted)',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
