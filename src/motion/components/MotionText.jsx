import React from 'react';

export default function MotionText({
  eyebrow = '',
  heading = '',
  highlight = '',
  subtext = '',
  visible = true,
}) {
  if (!visible) return null;

  return (
    <div className="motion-title-area">
      {eyebrow && (
        <div className="motion-eyebrow">
          <span className="motion-eyebrow-dot"></span>
          {eyebrow}
        </div>
      )}
      {heading && (
        <h2 className="motion-heading">
          {heading} {highlight && <em>{highlight}</em>}
        </h2>
      )}
      {subtext && <p className="motion-subtext">{subtext}</p>}
    </div>
  );
}
