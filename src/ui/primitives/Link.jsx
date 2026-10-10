import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Universal Link Primitive.
 * Automatically chooses between react-router Link and native <a> tag based on target.
 */
export default function Link({
  href,
  to,
  children,
  className = '',
  external = false,
  openInNewTab = false,
  style = {},
  onClick,
  ...props
}) {
  const targetUrl = to || href || '#';
  const isHttp = typeof targetUrl === 'string' && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('mailto:'));
  const isForceExternal = external || openInNewTab || isHttp;

  if (isForceExternal) {
    return (
      <a
        href={targetUrl}
        className={className}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        style={style}
        onClick={onClick}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Anchor inside hash
  if (typeof targetUrl === 'string' && targetUrl.startsWith('#')) {
    return (
      <a
        href={targetUrl}
        className={className}
        style={style}
        onClick={onClick}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <RouterLink
      to={targetUrl}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </RouterLink>
  );
}
