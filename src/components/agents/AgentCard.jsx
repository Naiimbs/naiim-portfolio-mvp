import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AgentCard({ agent }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr')
    ? 'fr'
    : (i18n.language?.startsWith('ar') ? 'ar' : 'en');

  const tx = agent?.i18n?.[currentLang] || agent?.metadata?.i18n?.[currentLang] || {};

  const {
    slug,
    name,
    short_description,
    category,
    tools = [],
    demo_type = 'none',
    demo_url,
    thumbnail,
    thumbnail_media,
    hero_image,
  } = agent || {};

  const displayName = tx.name || tx.title || name;
  const displayDesc = tx.short_description || tx.description || short_description;
  const displayCategory = tx.category || category;

  const imageSrc = thumbnail_media?.public_url || thumbnail || hero_image;
  const hasDemo = demo_type !== 'none' && Boolean(demo_url);

  return (
    <article className="agent-card">
      <div className="agent-card-image">
        {imageSrc ? (
          <img src={imageSrc} alt={`${name} workflow & interface`} loading="lazy" />
        ) : (
          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
            <i className="bi bi-robot fs-1"></i>
          </div>
        )}
      </div>

      <div className="agent-card-body">
        <div className="agent-badge-row">
          <span className="agent-category">{displayCategory || t('agents.card.category')}</span>
          <span className={`agent-demo-badge ${hasDemo ? 'has-demo' : 'none'}`}>
            <i className={`bi ${hasDemo ? 'bi-play-fill' : 'bi-journal-text'}`}></i>
            {hasDemo ? t('agents.card.demoAvailable') : t('agents.card.caseOnly')}
          </span>
        </div>

        <h3 className="agent-title">{displayName}</h3>
        <p className="agent-description">{displayDesc}</p>

        {tools && tools.length > 0 && (
          <div className="agent-tools">
            {tools.map((tool, idx) => (
              <span key={idx} className="agent-tool-tag">
                {tool}
              </span>
            ))}
          </div>
        )}

        <div className="agent-footer-links">
          <Link to={`/agents/${slug}`} className="agent-link">
            <span>{t('agents.card.explore')}</span> <i className="bi bi-arrow-right"></i>
          </Link>

          {hasDemo && (
            demo_type === 'internal' || demo_url.startsWith('/') ? (
              <Link to={demo_url} className="agent-demo-btn">
                <i className="bi bi-lightning-charge-fill"></i> {t('agents.card.try')}
              </Link>
            ) : (
              <a
                href={demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="agent-demo-btn"
              >
                <i className="bi bi-box-arrow-up-right"></i> {t('agents.card.try')}
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
}
