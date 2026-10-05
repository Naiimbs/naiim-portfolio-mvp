import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ProjectCard — Featured project card for catalog presentation.
 * Authoritative source: Content Registry metadata via normalized project object.
 */
export default function ProjectCard({ project }) {
  if (!project) return null;

  const {
    title,
    badge,
    kicker,
    description,
    tags,
    heroImage,
    heroImageAlt,
    logoMark,
    public_route,
    slug,
    card,
  } = project;

  const displayTitle = title || card?.title || '';
  const displayBadge = badge || card?.badge || '';
  const displayKicker = kicker || card?.kicker || '';
  const displayDescription = description || card?.description || '';
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
          Read case study <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </article>
  );
}
