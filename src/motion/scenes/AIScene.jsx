import React from 'react';
import Cursor from '../components/Cursor';
import MotionText from '../components/MotionText';

export default function AIScene({ progress = 0, active = true }) {
  // progress: 0 -> 1 inside 10-15s
  const p1 = progress >= 0.15;
  const p2 = progress >= 0.4;
  const p3 = progress >= 0.65;
  const p4 = progress >= 0.85;
  const showText = progress >= 0.2;

  const workflows = [
    { title: 'Research', tag: 'Signals & Context', active: p1, icon: 'bi-search' },
    { title: 'Understand', tag: 'Logic & Constraints', active: p2, icon: 'bi-diagram-2' },
    { title: 'Generate', tag: 'Structured Variants', active: p3, icon: 'bi-cpu' },
    { title: 'Refine', tag: 'Verified UX Solution', active: p4, icon: 'bi-check-all' },
  ];

  let cursorX = 30;
  let cursorY = 40;
  let cursorClick = false;
  let cursorLabel = 'Execute Workflow';

  if (progress < 0.35) {
    cursorX = 25 + progress * 70;
    cursorY = 35;
  } else if (progress < 0.75) {
    cursorX = 65;
    cursorY = 42;
    cursorClick = progress > 0.55;
    cursorLabel = 'Contextual Synthesis';
  } else {
    cursorX = 72;
    cursorY = 58;
  }

  return (
    <div className={`motion-scene ${active ? 'active' : ''}`}>
      {/* Background Architectural Grid */}
      <div className="motion-grid-overlay" aria-hidden="true" />

      {/* Intelligent Workflow Lattice */}
      <div className="motion-artifact-stage">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.85rem',
          }}
        >
          {workflows.map((wf, idx) => (
            <div
              key={idx}
              style={{
                background: wf.active ? 'rgba(14, 34, 40, 0.95)' : 'rgba(7, 18, 22, 0.6)',
                border: `1px solid ${wf.active ? 'var(--motion-green)' : 'var(--motion-line)'}`,
                borderRadius: '10px',
                padding: '1rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '140px',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: wf.active ? '0 12px 30px rgba(8, 127, 102, 0.22)' : 'none',
                opacity: wf.active ? 1 : 0.4,
                transform: wf.active ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span
                    style={{
                      fontFamily: 'var(--motion-font-mono)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: wf.active ? 'var(--motion-yellow)' : 'var(--motion-muted)',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <i
                    className={`bi ${wf.icon}`}
                    style={{
                      fontSize: '0.95rem',
                      color: wf.active ? 'var(--motion-green)' : 'var(--motion-muted)',
                    }}
                  ></i>
                </div>

                <div
                  style={{
                    fontFamily: 'var(--motion-font-heading)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: 'var(--motion-ink)',
                    marginBottom: '2px',
                  }}
                >
                  {wf.title}
                </div>

                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--motion-muted)',
                    lineHeight: 1.3,
                  }}
                >
                  {wf.tag}
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--motion-font-mono)',
                  fontSize: '0.62rem',
                  color: wf.active ? 'var(--motion-green)' : 'var(--motion-muted)',
                  borderTop: '1px solid var(--motion-line)',
                  paddingTop: '6px',
                  fontWeight: 600,
                }}
              >
                {wf.active ? '✓ COMPLETE' : '○ QUEUED'}
              </div>
            </div>
          ))}
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
        eyebrow="03 · APPLIED INTELLIGENCE"
        heading="I EXPERIMENT."
        subtext="Embedding AI reasoning directly into product workflows rather than superficial features."
        visible={showText}
      />
    </div>
  );
}
