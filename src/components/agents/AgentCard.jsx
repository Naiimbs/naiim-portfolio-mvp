import React from 'react';
import { Link } from 'react-router-dom';

export default function AgentCard({ agent }) {
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
  } = agent;

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
          <span className="agent-category">{category || 'AI Agent'}</span>
          <span className={`agent-demo-badge ${hasDemo ? 'has-demo' : 'none'}`}>
            <i className={`bi ${hasDemo ? 'bi-play-fill' : 'bi-journal-text'}`}></i>
            {hasDemo ? 'Demo Available' : 'Case Study Only'}
          </span>
        </div>

        <h3 className="agent-title">{name}</h3>
        <p className="agent-description">{short_description}</p>

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
            <span>Explore Agent</span> <i className="bi bi-arrow-right"></i>
          </Link>

          {hasDemo && (
            demo_type === 'internal' || demo_url.startsWith('/') ? (
              <Link to={demo_url} className="agent-demo-btn">
                <i className="bi bi-lightning-charge-fill"></i> Try
              </Link>
            ) : (
              <a
                href={demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="agent-demo-btn"
              >
                <i className="bi bi-box-arrow-up-right"></i> Try
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
}
