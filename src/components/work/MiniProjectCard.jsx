import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * MiniProjectCard — Compact project card for catalog presentation.
 * Authoritative source: Content Registry metadata via normalized project object.
 */
export default function MiniProjectCard({ project }) {
  const { i18n } = useTranslation();
  if (!project) return null;

  const currentLang = i18n.language?.startsWith('fr')
    ? 'fr'
    : (i18n.language?.startsWith('ar') ? 'ar' : 'en');

  const tx = project.i18n?.[currentLang] || project.metadata?.i18n?.[currentLang] || {};

  const {
    title,
    badge,
    subtitle,
    public_route,
    slug,
    card,
  } = project;

  const displayTitle = tx.title || title || card?.title || '';
  const displayBadge = tx.badge || badge || card?.badge || '';
  const displaySubtitle = tx.subtitle || subtitle || card?.subtitle || '';
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
