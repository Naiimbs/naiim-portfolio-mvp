import React from 'react';

export function Badge({
  children,
  variant = 'primary',
  pill = true,
  className = '',
  style = {},
}) {
  const variantClassMap = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary bg-opacity-10 text-secondary border',
    accent: 'bg-warning text-dark',
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    light: 'bg-light text-dark border',
    dark: 'bg-dark text-white',
  };
  const vClass = variantClassMap[variant] || 'bg-primary text-white';
  const pillClass = pill ? 'rounded-pill' : 'rounded-2';

  return (
    <span className={`badge ${vClass} ${pillClass} px-2 py-1 small fw-semibold ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}

export function Divider({
  orientation = 'horizontal',
  spacing = 4,
  label = null,
  className = '',
  style = {},
}) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`vr mx-${spacing} ${className}`.trim()}
        style={{ height: 'auto', minHeight: '1.2em', opacity: 0.25, ...style }}
      />
    );
  }

  if (label) {
    return (
      <div className={`d-flex align-items-center my-${spacing} ${className}`.trim()} style={style}>
        <hr className="flex-grow-1 my-0" style={{ opacity: 0.15 }} />
        <span className="px-3 text-muted small fw-semibold">{label}</span>
        <hr className="flex-grow-1 my-0" style={{ opacity: 0.15 }} />
      </div>
    );
  }

  return <hr className={`my-${spacing} ${className}`.trim()} style={{ opacity: 0.15, ...style }} />;
}

export function Card({
  children,
  elevated = false,
  bordered = true,
  className = '',
  style = {},
  onClick = null,
}) {
  const shadowClass = elevated ? 'shadow-sm' : 'shadow-none';
  const borderClass = bordered ? 'border' : 'border-0';
  const cursorStyle = onClick ? { cursor: 'pointer' } : {};

  return (
    <div
      className={`card bg-white rounded-4 overflow-hidden ${borderClass} ${shadowClass} ${className}`.trim()}
      style={{ ...cursorStyle, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function Alert({
  children,
  variant = 'info',
  icon = null,
  title = null,
  dismissible = false,
  onDismiss = null,
  className = '',
  style = {},
}) {
  const variantClassMap = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger',
    light: 'alert-light border',
  };
  const vClass = variantClassMap[variant] || 'alert-info';

  return (
    <div className={`alert ${vClass} rounded-3 d-flex align-items-start gap-2 ${className}`.trim()} style={style} role="alert">
      {icon && <span className="alert-icon fs-5 lh-1">{icon}</span>}
      <div className="flex-grow-1">
        {title && <h6 className="alert-heading fw-bold mb-1">{title}</h6>}
        <div className="small">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="btn-close btn-sm ms-2"
          aria-label="Close"
          onClick={onDismiss}
        />
      )}
    </div>
  );
}
