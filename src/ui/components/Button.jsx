import React from 'react';

/**
 * Core Button Component.
 * Variants: 'primary' | 'secondary' | 'outline' | 'dark' | 'light' | 'danger' | 'link'
 * Sizes: 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = true,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const variantClassMap = {
    primary: 'btn-primary',
    secondary: 'btn-dark',
    outline: 'btn-outline-primary',
    outlineDark: 'btn-outline-dark',
    dark: 'btn-dark',
    light: 'btn-light border',
    danger: 'btn-danger',
    link: 'btn-link text-decoration-none',
  };

  const sizeClassMap = {
    sm: 'btn-sm px-3 py-1',
    md: 'px-4 py-2',
    lg: 'btn-lg px-5 py-3',
  };

  const vClass = variantClassMap[variant] || 'btn-primary';
  const sClass = sizeClassMap[size] || 'px-4 py-2';
  const pillClass = pill ? 'rounded-pill' : 'rounded-3';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn ${vClass} ${sClass} ${pillClass} d-inline-flex align-items-center justify-content-center gap-2 fw-semibold transition-all ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
      ) : (
        icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  variant = 'light',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const sizeMap = {
    sm: { width: '32px', height: '32px', fontSize: '0.85rem' },
    md: { width: '40px', height: '40px', fontSize: '1rem' },
    lg: { width: '48px', height: '48px', fontSize: '1.25rem' },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`btn btn-${variant} rounded-circle d-inline-flex align-items-center justify-content-center p-0 ${className}`.trim()}
      style={{ ...s, ...props.style }}
      onClick={onClick}
      {...props}
    >
      {icon}
    </button>
  );
}
