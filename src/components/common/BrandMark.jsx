import React from 'react';
import brandMarkImage from '../../assets/images/naim-brand-mark.png';

/**
 * Reusable brand marks sourced from Naïm's supplied identity board.
 * The primary portrait mark is decorative when paired with the adjacent wordmark.
 */
export default function BrandMark({ variant = 'primary', className = '' }) {
  const classes = ['brand-mark', `brand-mark--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  if (variant === 'monogram') {
    return (
      <span className={classes} aria-hidden="true">
        NB
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden="true">
      <img src={brandMarkImage} alt="" width="248" height="262" />
    </span>
  );
}
