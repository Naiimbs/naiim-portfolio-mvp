import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * ProjectCard — Featured project card for catalog presentation.
 * Authoritative source: Content Registry metadata via normalized project object.
 */
export default function ProjectCard({ project }) {
  const { t, i18n } = useTranslation();
  if (!project) return null;

  const currentLang = i18n.language?.startsWith('fr')
    ? 'fr'
    : (i18n.language?.startsWith('ar') ? 'ar' : 'en');

  const tx = project.i18n?.[currentLang] || project.metadata?.i18n?.[currentLang] || {};

  const {
    title,
    badge,
    kicker,
    description,
    short_description,
    tags,
    heroImage,
    heroImageAlt,
    logoMark,
    public_route,
    slug,
    card,
  } = project;

  const displayTitle = tx.title || title || card?.title || '';
  const displayBadge = tx.badge || badge || card?.badge || '';
  const displayKicker = tx.kicker || kicker || card?.kicker || '';
  const displayDescription = tx.description || tx.short_description || description || short_description || card?.description || '';
  const displayTags = tags || card?.tags || [];
  const displayLogoMark = logoMark || card?.logoMark || null;
  const route = public_route || `/work/${slug}`;

  return (
    <article className="project-card">
      {heroImage && (
        <div className="project-image">
          <img src={heroImage} alt={heroImageAlt || displayTitle} />
          {displayBadge && <span className="project-badge">{displayBadge}</span>}
        </div>
      )}
      <div className="project-body">
        <div className="project-title-row">
          <div>
            {displayKicker && <span className="project-kicker">{displayKicker}</span>}
            <h3>{displayTitle}</h3>
          </div>
          {displayLogoMark && (
            <span className={`logo-mark ${displayLogoMark.className || ''}`}>
              {displayLogoMark.letter}
            </span>
          )}
        </div>
        {displayDescription && <p>{displayDescription}</p>}
        {displayTags && displayTags.length > 0 && (
          <div className="tag-row">
            {displayTags.map((tag, index) => (
              <span key={index}>{tag}</span>
            ))}
          </div>
        )}
        <Link className="card-link" to={route}>
          {t('work.readCaseStudy')} <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </article>
  );
}
