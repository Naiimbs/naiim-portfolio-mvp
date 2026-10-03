import React from 'react';

export default function WorkflowConnection({
  from = { x: 0, y: 0 },
  to = { x: 0, y: 0 },
  active = false,
  color = 'var(--motion-green)',
}) {
  // Generate smooth cubic bezier curve between points
  const dx = to.x - from.x;
  const cx1 = from.x + dx * 0.5;
  const cy1 = from.y;
  const cx2 = from.x + dx * 0.5;
  const cy2 = to.y;

  const pathD = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      viewBox="0 0 1000 562.5"
      preserveAspectRatio="none"
    >
      {/* Background wire */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(223, 231, 228, 0.15)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Active pulse signal */}
      {active && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="12 180"
          strokeDashoffset="180"
          style={{
            animation: 'motionDashFlow 1.8s linear infinite',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      )}
    </svg>
  );
}
