import React from 'react';

export default function GalleryBlock({ content = {} }) {
  const { media = [], caption, layout = 'grid' } = content;
  const visibleMedia = Array.isArray(media)
    ? media.filter((item) => item?.is_visible !== false)
    : [];

  if (visibleMedia.length === 0) return null;

  const layoutClass = ['feature', 'wide', 'split', 'grid'].includes(layout)
    ? layout
    : 'grid';

  return (
    <figure className={`case-block case-gallery-block case-gallery-block--${layoutClass} my-4`}>
      <div className="case-evidence-gallery">
        {visibleMedia.map((item, idx) => {
          const src = item?.media_url || item?.url || item;
          const alt = item?.alt || item?.imageAlt || `Gallery item ${idx + 1}`;
          if (!src || typeof src !== 'string') return null;

          return (
            <figure className="case-evidence-card" key={item?.id || src || idx}>
              <div className="case-image-stage">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {item?.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          );
        })}
      </div>
      {caption && <figcaption className="case-gallery-caption">{caption}</figcaption>}
    </figure>
  );
}
