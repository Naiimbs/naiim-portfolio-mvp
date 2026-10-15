import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PluginCard({ plugin }) {
  const { i18n } = useTranslation();
  const { name, description, icon, linkText, url, i18n: pluginI18n } = plugin;

  const currentLang = i18n.language?.startsWith('fr')
    ? 'fr'
    : (i18n.language?.startsWith('ar') ? 'ar' : 'en');

  const localized = pluginI18n?.[currentLang] || {};
  const displayDescription = localized.description || description;
  const displayLinkText = localized.linkText || linkText;

  return (
    <a className="plugin-card" href={url} target="_blank" rel="noopener noreferrer">
      <div className="plugin-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <strong>{name}</strong>
        <p>{displayDescription}</p>
        <span>
          {displayLinkText} <i className="bi bi-arrow-up-right"></i>
        </span>
      </div>
    </a>
  );
}
