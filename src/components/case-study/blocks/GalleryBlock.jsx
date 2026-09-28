import React from 'react';

export default function GalleryBlock({ content = {} }) {
  const { media = [], caption } = content;

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <figure className="case-block my-4">
      <div className={`row g-3 ${media.length === 1 ? 'row-cols-1' : media.length === 2 ? 'row-cols-1 row-cols-md-2' : 'row-cols-1 row-cols-md-3'}`}>
        {media.map((item, idx) => {
          const src = item.media_url || item.url || item;
          const alt = item.alt || `Gallery item ${idx + 1}`;
          if (!src || typeof src !== 'string') return null;

          return (
            <div className="col" key={idx}>
              <div className="overflow-hidden rounded-3 border" style={{ backgroundColor: '#ffffff' }}>
                <img
                  src={src}
                  alt={alt}
                  className="w-100 h-auto d-block"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </div>
      {caption && (
        <figcaption className="text-center text-muted small mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
