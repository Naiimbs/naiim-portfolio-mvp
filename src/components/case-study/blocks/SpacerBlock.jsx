import React from 'react';

export default function SpacerBlock({ content = {} }) {
  const { size = 'medium' } = content;
  const height = size === 'small' ? '24px' : size === 'large' ? '80px' : '48px';

  return <div style={{ height }} aria-hidden="true" />;
}
