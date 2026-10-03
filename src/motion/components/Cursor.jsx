import React from 'react';

export default function Cursor({
  x = 50,
  y = 50,
  label = 'Naïm • UX',
  isClicking = false,
  visible = true,
}) {
  if (!visible) return null;

  return (
    <div
      className="motion-cursor"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-2px, -2px) scale(${isClicking ? 0.92 : 1})`,
      }}
      aria-hidden="true"
    >
      <svg
        className="motion-cursor-pointer"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0l5.5 14 2.5-5.5L14 6 0 0z" />
      </svg>
      {label && <span className="motion-cursor-badge">{label}</span>}
    </div>
  );
}
