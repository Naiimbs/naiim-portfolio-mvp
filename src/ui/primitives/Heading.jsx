import React from 'react';

/**
 * Semantic Heading Primitive.
 * Supports levels 1 to 6 and display/h1-h6 visual classes.
 */
export default function Heading({
  level = 2,
  variant = null,
  children,
  className = '',
  align = 'left',
  style = {},
  id,
  ...props
}) {
  const parsed = parseInt(level, 10);
  const num = Number.isInteger(parsed) ? parsed : 2;
  const safeLevel = Math.min(6, Math.max(1, num));
  const Tag = `h${safeLevel}`;
  const visualClass = variant ? `heading-${variant}` : `h${safeLevel}`;
  const alignClass = align !== 'left' ? `text-${align}` : '';

  return (
    <Tag
      id={id}
      className={`font-heading fw-bold ${visualClass} ${alignClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  );
}
