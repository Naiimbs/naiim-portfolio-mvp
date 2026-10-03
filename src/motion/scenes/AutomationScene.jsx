import React from 'react';
import Cursor from '../components/Cursor';
import MotionText from '../components/MotionText';

export default function AutomationScene({ progress = 0, active = true }) {
  // progress: 0 -> 1 inside 15-20s
  const stage1 = progress >= 0.15;
  const stage2 = progress >= 0.45;
  const stage3 = progress >= 0.75;
  const showText = progress >= 0.2;

  let cursorX = 35;
  let cursorY = 45;
  let cursorClick = false;
  let cursorLabel = 'Event Trigger';

  if (progress < 0.4) {
    cursorX = 20 + progress * 50;
    cursorY = 45;
  } else if (progress < 0.75) {
    cursorX = 55;
    cursorY = 45;
    cursorClick = progress > 0.55;
    cursorLabel = 'Parallel Routing';
  } else {
    cursorX = 80;
    cursorY = 45;
    cursorLabel = 'Resolved in 24ms';
  }

  return (
    <div className={`motion-scene ${active ? 'active' : ''}`}>
      {/* Background Architectural Grid */}
      <div className="motion-grid-overlay" aria-hidden="true" />

      {/* Sleek Circuit Telemetry Canvas */}
      <div className="motion-artifact-stage">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
          }}
        >
          {/* SVG Animated Circuit Cables */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox="0 0 680 180"
            preserveAspectRatio="none"
          >
            {/* Wires from Input to 3 Branches */}
            <path d="M 160 90 C 230 90, 230 35, 300 35" fill="none" stroke="var(--motion-line)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 160 90 C 230 90, 230 90, 300 90" fill="none" stroke="var(--motion-line)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 160 90 C 230 90, 230 145, 300 145" fill="none" stroke="var(--motion-line)" strokeWidth="2" strokeDasharray="4 4" />

            {/* Wires from 3 Branches to Output */}
            <path d="M 430 35 C 490 35, 490 90, 520 90" fill="none" stroke="var(--motion-line)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 430 90 C 490 90, 490 90, 520 90" fill="none" stroke="var(--motion-line)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 430 145 C 490 145, 490 90, 520 90" fill="none" stroke="var(--motion-line)" strokeWidth="2" strokeDasharray="4 4" />

            {/* Glowing Signal Pulses */}
            {stage1 && (
              <path
                d="M 160 90 C 230 90, 230 90, 300 90"
                fill="none"
                stroke="var(--motion-green)"
                strokeWidth="3"
                strokeDasharray="20 200"
                style={{ animation: 'motionPulseWire 1.2s linear infinite' }}
              />
            )}
            {stage2 && (
              <>
                <path
                  d="M 160 90 C 230 90, 230 35, 300 35"
                  fill="none"
                  stroke="var(--motion-yellow)"
                  strokeWidth="3"
                  strokeDasharray="20 200"
                  style={{ animation: 'motionPulseWire 1s linear infinite' }}
                />
                <path
                  d="M 430 90 C 490 90, 490 90, 520 90"
                  fill="none"
                  stroke="var(--motion-green)"
                  strokeWidth="3"
                  strokeDasharray="20 200"
                  style={{ animation: 'motionPulseWire 1s linear infinite' }}
                />
              </>
            )}
          </svg>

          {/* Node 1: Event Trigger */}
          <div
            className={`motion-circuit-node ${stage1 ? 'active' : ''}`}
            style={{ zIndex: 5, width: '150px' }}
          >
            <i className="bi bi-qr-code-scan" style={{ fontSize: '1.2rem', color: stage1 ? 'var(--motion-green)' : 'var(--motion-muted)' }}></i>
            <div>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--motion-font-mono)', color: 'var(--motion-muted)' }}>EVENT TRIGGER</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--motion-ink)' }}>Finder Scan</div>
            </div>
          </div>

          {/* Central 3-Tier Micro-Nodes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 5, width: '140px' }}>
            <div className={`motion-circuit-node ${stage2 ? 'highlight-gold' : ''}`} style={{ padding: '0.4rem 0.65rem' }}>
              <i className="bi bi-stars" style={{ fontSize: '0.9rem', color: stage2 ? 'var(--motion-yellow)' : 'var(--motion-muted)' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>AI Reasoning</span>
            </div>
            <div className={`motion-circuit-node ${stage2 ? 'active' : ''}`} style={{ padding: '0.4rem 0.65rem' }}>
              <i className="bi bi-database" style={{ fontSize: '0.9rem', color: stage2 ? 'var(--motion-green)' : 'var(--motion-muted)' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Supabase Sync</span>
            </div>
            <div className={`motion-circuit-node ${stage2 ? 'active' : ''}`} style={{ padding: '0.4rem 0.65rem' }}>
              <i className="bi bi-send" style={{ fontSize: '0.9rem', color: stage2 ? 'var(--motion-green)' : 'var(--motion-muted)' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Webhook Alert</span>
            </div>
          </div>

          {/* Node 3: Realtime Resolution */}
          <div
            className={`motion-circuit-node ${stage3 ? 'active' : ''}`}
            style={{ zIndex: 5, width: '150px' }}
          >
            <i className="bi bi-shield-check" style={{ fontSize: '1.2rem', color: stage3 ? 'var(--motion-green)' : 'var(--motion-muted)' }}></i>
            <div>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--motion-font-mono)', color: 'var(--motion-muted)' }}>RESOLVED</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--motion-ink)' }}>Owner Alert</div>
            </div>
          </div>
        </div>
      </div>

      {/* Kinetic Cursor */}
      <Cursor
        x={cursorX}
        y={cursorY}
        label={cursorLabel}
        isClicking={cursorClick}
        visible={active && progress > 0.08 && progress < 0.95}
      />

      {/* Kinetic Typography */}
      <MotionText
        eyebrow="04 · SYSTEMS & AUTOMATION"
        heading="AUTOMATION."
        subtext="Less repetition. More thinking. Connecting interfaces, APIs and distributed logic."
        visible={showText}
      />
    </div>
  );
}
