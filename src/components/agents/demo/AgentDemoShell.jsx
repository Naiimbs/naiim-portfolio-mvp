import React from 'react';
import { Link } from 'react-router-dom';

export default function AgentDemoShell({
  agent,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="agent-demo-shell">
      {/* Header Bar */}
      <div className="agent-demo-header">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to={`/agents/${agent?.slug || ''}`} className="agent-demo-back">
            <i className="bi bi-arrow-left"></i> <span>Back to Case Study</span>
          </Link>
          <div className="agent-demo-badge-live">
            <span className="live-dot">●</span> <span>Interactive Demo</span>
          </div>
        </div>
      </div>

      {/* Hero Headline */}
      <section className="agent-demo-hero">
        <div className="container">
          <div className="eyebrow mb-2">
            <span></span> LIVE AI SYSTEM DEMO
          </div>
          <h1>{title || agent?.name || 'AI Agent Demo'}</h1>
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
