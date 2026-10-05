import React from 'react';
import { Link } from 'react-router-dom';

/**
 * MiniProjectCard — Compact project card for catalog presentation.
 * Authoritative source: Content Registry metadata via normalized project object.
 */
export default function MiniProjectCard({ project }) {
  if (!project) return null;

  const {
    title,
    badge,
    subtitle,
    public_route,
    slug,
    card,
  } = project;

  const displayTitle = title || card?.title || '';
  const displayBadge = badge || card?.badge || '';
  const displaySubtitle = subtitle || card?.subtitle || '';
  const route = public_route || `/work/${slug}`;

  return (
    <Link className="mini-project-card" to={route}>
      {displayBadge && <span>{displayBadge}</span>}
      <b>{displayTitle}</b>
      {displaySubtitle && <small>{displaySubtitle}</small>}
      <i className="bi bi-arrow-up-right"></i>
    </Link>
  );
}
