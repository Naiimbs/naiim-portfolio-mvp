import React from 'react';

/**
 * Semantic Text Primitive.
 * Variants: 'body' | 'bodyLarge' | 'bodySmall' | 'caption' | 'label' | 'lead' | 'muted'
 */
export default function Text({
  as: Component = 'p',
  variant = 'body',
  children,
  className = '',
  color = null,
  align = 'left',
  style = {},
  ...props
}) {
  const variantClassMap = {
    body: 'font-body',
    bodyLarge: 'lead font-body',
    bodySmall: 'small font-body',
    caption: 'small text-muted font-body',
    label: 'form-label small fw-semibold font-body',
    lead: 'lead font-body',
    muted: 'text-muted font-body',
  };

  const vClass = variantClassMap[variant] || 'font-body';
  const alignClass = align !== 'left' ? `text-${align}` : '';
  const colorStyle = color ? { color } : {};

  return (
    <Component
      className={`${vClass} ${alignClass} ${className}`.trim()}
      style={{ ...colorStyle, ...style }}
      {...props}
    >
      {children}
    </Component>
  );
}
