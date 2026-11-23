import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Optional CMS-authored editorial sections for bespoke case studies.
 * Bespoke React interactions remain in place; these sections are data-driven.
 */
export default function CMSCustomSections({ sections = [] }) {
  const { i18n } = useTranslation();
  const locale = (i18n?.language || 'en').slice(0, 2);
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const visibleSections = Array.isArray(sections)
    ? sections.filter((section) => section && section.is_visible !== false)
    : [];

  if (!visibleSections.length) return null;

  return (
    <div className="cms-custom-case-sections" dir={direction}>
      {visibleSections.map((section, index) => {
        const localized = section.translations?.[locale] || {};
        const title = localized.title || section.title || '';
        const body = localized.body || section.body || '';
        const alt = localized.alt || section.alt || title || 'Case study visual';
        const caption = localized.caption || section.caption || '';
        const isImage = section.type === 'image' && section.image;

        return (
          <section className={`cms-custom-case-section cms-custom-case-section--${section.layout || 'text'}`} key={section.id || index}>
            <div className="container">
              {title && <h2>{title}</h2>}
              {body && <div className="cms-custom-case-section__body">{body.split(String.fromCharCode(10).repeat(2)).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>}
              {isImage && (
                <figure className="cms-custom-case-section__media">
                  <div className="case-image-stage">
                    <img src={section.image} alt={alt} loading="lazy" decoding="async" />
                  </div>
                  {caption && <figcaption>{caption}</figcaption>}
                </figure>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
