import React from 'react';
import { Link } from 'react-router-dom';

export default function DemoBlock({ content = {} }) {
  const { demo_type = 'none', demo_url, label, description } = content;

  if (demo_type === 'none' || !demo_url) {
    return null;
  }

  const isInternal = demo_type === 'internal' || demo_url.startsWith('/');

  return (
    <div className="case-block my-4">
      <div className="agent-demo-card">
        <div className="eyebrow text-warning mb-2">
          <span></span> LIVE DEMO
        </div>
        <h3>{label || 'Try this AI Agent'}</h3>
        {description && <p>{description}</p>}

        {isInternal ? (
          <Link to={demo_url} className="btn-try">
            <span>Launch Demo</span> <i className="bi bi-arrow-right"></i>
          </Link>
        ) : (
          <a
            href={demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-try"
          >
            <span>Launch External Demo</span> <i className="bi bi-box-arrow-up-right"></i>
          </a>
        )}
      </div>
    </div>
  );
}
