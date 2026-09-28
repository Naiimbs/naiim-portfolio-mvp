import React from 'react';

export default function CTABlock({ content = {} }) {
  const { title, description, label, url } = content;

  if (!title && !label) return null;

  return (
    <div className="case-block my-5 p-4 p-md-5 rounded-4 border bg-white text-center shadow-sm">
      {title && (
        <h3 className="fs-3 fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h3>
      )}
      {description && <p className="text-muted mb-4 max-w-lg mx-auto">{description}</p>}
      {label && url && (
        <a
          href={url}
          target={url.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="btn btn-dark px-4 py-2 rounded-pill fw-semibold"
          style={{ backgroundColor: 'var(--ink, #10242a)' }}
        >
          {label} <i className="bi bi-arrow-up-right ms-1"></i>
        </a>
      )}
    </div>
  );
}
