import React from 'react';
import Cursor from '../components/Cursor';
import MotionText from '../components/MotionText';

export default function BuildScene({ progress = 0, active = true }) {
  // progress: 0 -> 1 inside 5-10s
  // 0.00 - 0.50: Layers separate into 3D isometric stack
  // 0.50 - 1.00: Re-converge into compiled production state

  const isExploded = progress >= 0.15 && progress <= 0.75;
  const isCompiled = progress > 0.75;
  const showText = progress >= 0.2;

  let cursorX = 35;
  let cursorY = 40;
  let cursorClick = false;
  let cursorLabel = 'Inspect Stack';

  if (progress < 0.4) {
    cursorX = 30 + progress * 60;
    cursorY = 38;
  } else if (progress < 0.8) {
    cursorX = 66;
    cursorY = 48;
    cursorClick = progress > 0.6;
    cursorLabel = isCompiled ? '✓ Build Verified' : '3-Tier Architecture';
  } else {
    cursorX = 70;
    cursorY = 60;
  }

  return (
    <div className={`motion-scene ${active ? 'active' : ''}`}>
      {/* Background Architectural Grid */}
      <div className="motion-grid-overlay" aria-hidden="true" />

      {/* Isometric 3D Layered Artifact Stage */}
      <div className="motion-artifact-stage">
        <div
          className="motion-isometric-stack"
          style={{
            transform: isExploded
              ? 'rotateX(52deg) rotateZ(-34deg) scale(0.95)'
              : 'rotateX(0deg) rotateZ(0deg) scale(1)',
          }}
        >
          {/* Layer 1: Data & DB */}
          <div
            className="motion-iso-layer layer-data"
            style={{
              transform: isExploded ? 'translateZ(-60px)' : 'translateZ(0)',
              opacity: isCompiled ? 0 : 1,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span
                className="motion-iso-layer-tag"
                style={{ background: 'var(--motion-yellow-soft)', color: 'var(--motion-yellow)' }}
              >
                DATA TIER · SUPABASE / RLS
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--motion-muted)', fontFamily: 'var(--motion-font-mono)' }}>
                Realtime Channel
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--motion-font-mono)', color: 'var(--motion-muted)' }}>
              Encrypted owner mapping & anonymous finder session token.
            </div>
          </div>

          {/* Layer 2: Logic & State */}
          <div
            className="motion-iso-layer layer-logic"
            style={{
              transform: isExploded ? 'translateZ(0px)' : 'translateZ(0)',
              opacity: isCompiled ? 0 : 1,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span
                className="motion-iso-layer-tag"
                style={{ background: 'var(--motion-green-soft)', color: 'var(--motion-green)' }}
              >
                LOGIC TIER · REACT 18
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--motion-green)', fontFamily: 'var(--motion-font-mono)', fontWeight: 700 }}>
                100% Type-Safe
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--motion-font-mono)', color: 'var(--motion-muted)' }}>
              Deterministic state machine & optimistic mutation rollback.
            </div>
          </div>

          {/* Layer 3: Visual Interface */}
          <div
            className="motion-iso-layer layer-ui"
            style={{
              transform: isExploded ? 'translateZ(60px)' : 'translateZ(0)',
              background: isCompiled ? 'rgba(14, 34, 40, 0.95)' : undefined,
              borderColor: isCompiled ? 'var(--motion-green)' : undefined,
              boxShadow: isCompiled ? '0 24px 60px rgba(8, 127, 102, 0.3)' : undefined,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span
                className="motion-iso-layer-tag"
                style={{
                  background: isCompiled ? 'var(--motion-green-soft)' : 'rgba(255,255,255,0.08)',
                  color: isCompiled ? 'var(--motion-green)' : 'var(--motion-ink)',
                }}
              >
                {isCompiled ? '✓ COMPILED & LIVE' : 'UI SHELL · DESIGN SYSTEM'}
              </span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--motion-green)',
                  boxShadow: '0 0 10px var(--motion-green-glow)',
                }}
              ></span>
            </div>

            <div style={{ fontFamily: 'var(--motion-font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--motion-ink)' }}>
              Production Recovery System
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--motion-muted)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
              End-to-end implementation respecting performance budgets and constraints.
            </p>
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
        eyebrow="02 · IMPLEMENTATION & ARCHITECTURE"
        heading="I BUILD."
        subtext="From component specs to production architecture with real product constraints."
        visible={showText}
      />
    </div>
  );
}
