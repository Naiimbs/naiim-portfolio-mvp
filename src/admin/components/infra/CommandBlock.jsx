import React, { useState } from 'react';

const RISK_CONFIG = {
  safe: {
    borderColor: '#dfe7e4',
    badgeBg: '#e8f5f1',
    badgeColor: '#087f66',
    badgeText: 'SAFE',
    icon: 'bi-check-circle',
  },
  caution: {
    borderColor: '#f5d97a',
    badgeBg: '#fef9e7',
    badgeColor: '#9a6c00',
    badgeText: 'CAUTION',
    icon: 'bi-exclamation-triangle',
  },
  destructive: {
    borderColor: '#f5a5a5',
    badgeBg: '#fef0f0',
    badgeColor: '#b91c1c',
    badgeText: 'DESTRUCTIVE',
    icon: 'bi-exclamation-octagon-fill',
  },
};

/**
 * CommandBlock — display-only shell command card.
 * This component NEVER executes commands. It only displays, copies, and explains them.
 */
export default function CommandBlock({
  command,
  purpose,
  arabicExplanation,
  risk = 'safe',
  expectedOutput,
  verificationCommand,
  notes,
  warningText,
  prerequisites,
}) {
  const [copied, setCopied] = useState(false);
  const [arabicOpen, setArabicOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const config = RISK_CONFIG[risk] || RISK_CONFIG.safe;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(command).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const hasDetails = expectedOutput || verificationCommand || notes;

  return (
    <div
      className="mb-3"
      style={{
        border: `1.5px solid ${config.borderColor}`,
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(16, 36, 42, 0.04)',
      }}
    >
      {/* Destructive warning banner */}
      {risk === 'destructive' && warningText && (
        <div
          style={{
            background: '#fef0f0',
            borderBottom: '1.5px solid #f5a5a5',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <i
            className="bi bi-exclamation-octagon-fill text-danger mt-1"
            style={{ fontSize: '0.95rem', flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.82rem', color: '#b91c1c', fontWeight: 500 }}>
            {warningText}
          </span>
        </div>
      )}

      {/* Command terminal block */}
      <div
        style={{
          background: '#0c1518',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <code
          style={{
            color: '#34d399',
            fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.87rem',
            flex: 1,
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}
        >
          {command}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy command to clipboard"
          style={{
            background: copied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '6px',
            color: copied ? '#34d399' : 'rgba(255,255,255,0.7)',
            padding: '4px 10px',
            fontSize: '0.76rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'} me-1`} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Metadata row */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: hasDetails || arabicExplanation ? '1px solid #f0f4f2' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Risk badge */}
          <span
            style={{
              background: config.badgeBg,
              color: config.badgeColor,
              border: `1px solid ${config.borderColor}`,
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '0.08em',
              flexShrink: 0,
            }}
          >
            <i className={`bi ${config.icon} me-1`} />
            {config.badgeText}
          </span>

          {/* Purpose */}
          <span style={{ fontSize: '0.84rem', color: '#42545a', lineHeight: 1.4 }}>{purpose}</span>
        </div>

        {/* Prerequisites */}
        {prerequisites && prerequisites.length > 0 && (
          <div className="mt-2">
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#718187',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Prerequisites:
            </span>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
              {prerequisites.map((prereq, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: '#42545a', marginBottom: '2px' }}>
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {hasDetails && (
        <div style={{ borderBottom: arabicExplanation ? '1px solid #f0f4f2' : 'none' }}>
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 16px',
              fontSize: '0.77rem',
              color: '#718187',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <i className={`bi ${detailsOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
            {detailsOpen ? 'Hide details' : 'Show details'}
          </button>

          {detailsOpen && (
            <div
              style={{
                padding: '0 16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {expectedOutput && (
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#718187',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '4px',
                    }}
                  >
                    Expected output
                  </div>
                  <pre
                    style={{
                      background: '#f5f7f6',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      color: '#10242a',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      border: '1px solid #e8edeb',
                    }}
                  >
                    {expectedOutput}
                  </pre>
                </div>
              )}

              {verificationCommand && (
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#718187',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '4px',
                    }}
                  >
                    Verify with
                  </div>
                  <code
                    style={{
                      background: '#e8f5f1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      color: '#087f66',
                      display: 'block',
                      border: '1px solid #b8e0d4',
                    }}
                  >
                    {verificationCommand}
                  </code>
                </div>
              )}

              {notes && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#718187',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <i className="bi bi-info-circle mt-1" style={{ flexShrink: 0 }} />
                  <span>{notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tunisian Arabic explanation — collapsed by default */}
      {arabicExplanation && (
        <div style={{ padding: '6px 16px 10px' }}>
          <button
            type="button"
            onClick={() => setArabicOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '0.82rem',
              color: '#087f66',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            {arabicOpen ? 'بالدارجة ↑' : 'بالدارجة ↓'}
          </button>

          {arabicOpen && (
            <div
              dir="rtl"
              lang="ar"
              style={{
                marginTop: '8px',
                padding: '10px 14px',
                background: '#f8f9f6',
                borderRadius: '8px',
                fontSize: '0.88rem',
                color: '#10242a',
                lineHeight: 1.75,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                border: '1px solid #e8edeb',
              }}
            >
              {arabicExplanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
