import React from 'react';

export function Container({ children, size = 'default', className = '', style = {}, ...props }) {
  const sizeMap = {
    sm: 'max-w-xl mx-auto px-3',
    md: 'max-w-3xl mx-auto px-3',
    lg: 'max-w-5xl mx-auto px-3',
    full: 'w-100 px-3',
    default: 'container',
  };
  const cClass = sizeMap[size] || 'container';
  return (
    <div className={`${cClass} ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}

export function Stack({
  children,
  direction = 'column',
  gap = 3,
  align = 'stretch',
  justify = 'start',
  className = '',
  style = {},
  ...props
}) {
  const dirClass = direction === 'row' ? 'd-flex flex-row' : 'd-flex flex-column';
  const gapClass = `gap-${gap}`;
  const alignClass = `align-items-${align}`;
  const justifyClass = `justify-content-${justify}`;

  return (
    <div className={`${dirClass} ${gapClass} ${alignClass} ${justifyClass} ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}

export function Grid({
  children,
  columns = 3,
  gap = 4,
  className = '',
  style = {},
  ...props
}) {
  const colClassMap = {
    1: 'row-cols-1',
    2: 'row-cols-1 row-cols-md-2',
    3: 'row-cols-1 row-cols-md-2 row-cols-lg-3',
    4: 'row-cols-1 row-cols-md-2 row-cols-lg-4',
  };
  const rowCols = colClassMap[columns] || 'row-cols-1 row-cols-md-3';
  return (
    <div className={`row ${rowCols} g-${gap} ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}
