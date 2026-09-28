import React from 'react';

export default function ImageBlock({ content = {} }) {
  const { media_url, url, alt, caption } = content;
  const imageSrc = media_url || url;

  if (!imageSrc) {
    return (
      <div className="case-block p-4 bg-light text-center rounded border my-4 text-muted small">
        <i className="bi bi-image fs-3 d-block mb-1"></i>
        <span>Media asset unavailable</span>
      </div>
    );
  }

  return (
    <figure className="case-hero-image">
      <img
        src={imageSrc}
        alt={alt || 'Case study visual evidence'}
        loading="lazy"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
