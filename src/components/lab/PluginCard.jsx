import React from 'react';

export default function PluginCard({ plugin }) {
  const { name, description, icon, linkText, url } = plugin;

  return (
    <a className="plugin-card" href={url} target="_blank" rel="noopener noreferrer">
      <div className="plugin-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <strong>{name}</strong>
        <p>{description}</p>
        <span>
          {linkText} <i className="bi bi-arrow-up-right"></i>
        </span>
      </div>
    </a>
  );
}
