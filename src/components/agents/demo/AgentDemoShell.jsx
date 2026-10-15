import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AgentDemoShell({
  agent,
  title,
  subtitle,
  children,
}) {
  const { t } = useTranslation();
  return (
    <div className="agent-demo-shell">
      {/* Header Bar */}
      <div className="agent-demo-header">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to={`/agents/${agent?.slug || ''}`} className="agent-demo-back">
            <i className="bi bi-arrow-left"></i> <span>{t('agents.demo.backToCase')}</span>
          </Link>
          <div className="agent-demo-badge-live">
            <span className="live-dot">●</span> <span>{t('agents.demo.interactiveDemo')}</span>
          </div>
        </div>
      </div>

      {/* Hero Headline */}
      <section className="agent-demo-hero">
        <div className="container">
          <div className="eyebrow mb-2">
            <span></span> {t('agents.demo.liveEyebrow')}
          </div>
          <h1>{title || agent?.name || t('agents.demo.notFoundTitle')}</h1>
          {subtitle && <p className="agent-demo-lead">{subtitle}</p>}
        </div>
      </section>

      {/* Workspace Container */}
      <main className="container pb-5">
        {children}
      </main>
    </div>
  );
}
