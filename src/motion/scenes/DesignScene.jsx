import React from 'react';
import Cursor from '../components/Cursor';
import MotionText from '../components/MotionText';

export default function DesignScene({ progress = 0, active = true }) {
  // progress: 0 -> 1 inside 0-5s
  const showRulers = progress >= 0.15;
  const isLocked = progress >= 0.55;
  const showText = progress >= 0.25;

  let cursorX = 35;
  let cursorY = 30;
  let cursorClick = false;
  let cursorLabel = 'Design System';

  if (progress < 0.35) {
    cursorX = 25 + progress * 80;
    cursorY = 28;
  } else if (progress < 0.75) {
    cursorX = 64;
    cursorY = 44;
    cursorClick = progress > 0.5;
    cursorLabel = isLocked ? 'Token: #087F66' : 'Align: Optical Grid';
  } else {
    cursorX = 72;
    cursorY = 62;
  }

  return (
    <div className={`motion-scene ${active ? 'active' : ''}`}>
      {/* Background Architectural Grid */}
      <div className="motion-grid-overlay" aria-hidden="true" />

      {/* Dynamic Spatial Rulers */}
      {showRulers && (
        <>
          <div className="motion-ruler-tag" style={{ top: '18%', left: '16%' }}>
            8pt GRID LOCKED
          </div>
          <div className="motion-ruler-tag" style={{ top: '18%', right: '16%' }}>
            {isLocked ? 'COLOR: #087F66' : 'DRAFTING'}
          </div>
        </>
      )}

      {/* Frameless Morphing Artifact Stage */}
      <div className="motion-artifact-stage">
        <div
          style={{
            position: 'relative',
            width: '420px',
            background: 'rgba(14, 34, 40, 0.92)',
            border: `1px solid ${isLocked ? 'var(--motion-green)' : 'var(--motion-line)'}`,
            borderRadius: '14px',
            padding: '1.4rem',
            boxShadow: isLocked
              ? '0 20px 50px rgba(8, 127, 102, 0.25), 0 0 0 1px var(--motion-green)'
              : '0 16px 40px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: `scale(${isLocked ? 1 : 0.96})`,
          }}
        >
          {/* Card Meta Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span
              style={{
                fontFamily: 'var(--motion-font-mono)',
                fontSize: '0.65rem',
                color: isLocked ? 'var(--motion-green)' : 'var(--motion-muted)',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              WINNI OBJECT · SPEC #084
            </span>
            <span
              style={{
                fontFamily: 'var(--motion-font-mono)',
                fontSize: '0.6rem',
                padding: '2px 8px',
                borderRadius: '999px',
                background: isLocked ? 'var(--motion-green-soft)' : 'rgba(255,255,255,0.06)',
                color: isLocked ? 'var(--motion-green)' : 'var(--motion-muted)',
                border: `1px solid ${isLocked ? 'var(--motion-green)' : 'var(--motion-line)'}`,
                fontWeight: 600,
              }}
            >
              {isLocked ? 'TOKEN SYNCED' : 'ALIGNING'}
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--motion-font-heading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--motion-ink)',
              margin: '0 0 0.5rem 0',
            }}
          >
            Digital Identity System
          </h3>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--motion-muted)',
              lineHeight: 1.4,
              margin: '0 0 1.2rem 0',
            }}
          >
            Physical-to-digital recovery layer engineered for automotive and luggage tags.
          </p>

          <div
            className="d-flex justify-content-between align-items-center pt-2"
            style={{ borderTop: '1px solid var(--motion-line)' }}
          >
            <span
              style={{
                fontFamily: 'var(--motion-font-mono)',
                fontSize: '0.68rem',
                color: 'var(--motion-muted)',
              }}
            >
              Radius: 14px · Contrast: 12.8:1
            </span>
            <button
              type="button"
              style={{
                background: isLocked ? 'var(--motion-green)' : 'transparent',
                border: `1px solid ${isLocked ? 'var(--motion-green)' : 'var(--motion-line)'}`,
                color: isLocked ? '#fff' : 'var(--motion-muted)',
                borderRadius: '6px',
                fontSize: '0.72rem',
                padding: '5px 12px',
                fontWeight: 600,
                transition: 'all 0.3s ease',
              }}
            >
              Interact
            </button>
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
        eyebrow="01 · PRECISION & FORM"
        heading="I DESIGN."
        subtext="Turning complexity into clarity through scalable product systems."
        visible={showText}
      />
    </div>
  );
}
