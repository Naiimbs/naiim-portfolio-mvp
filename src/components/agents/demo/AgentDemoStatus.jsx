import React from 'react';
import { Link } from 'react-router-dom';

export default function AgentDemoStatus({
  error,
  status, // 'idle' | 'loading' | 'success' | 'error' | 'disabled'
  agentSlug,
  onRetry,
}) {
  if (!error && status !== 'disabled') return null;

  if (status === 'disabled') {
    return (
      <div className="agent-demo-alert warning mb-4">
        <div className="d-flex align-items-start gap-3">
          <i className="bi bi-info-circle-fill fs-4 text-warning"></i>
          <div>
            <h4 className="fs-6 fw-bold mb-1">Live Demo Inactive</h4>
            <p className="mb-2 small text-muted">
              This agent operates as an autonomous background pipeline and does not currently accept synchronous user prompts.
            </p>
            <Link to={`/agents/${agentSlug}`} className="btn btn-sm btn-dark rounded-pill px-3">
              <i className="bi bi-journal-text me-1"></i> Read Case Study
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const errorMessage = error?.message || 'The demo is temporarily unavailable. Please try again in a few moments.';
  const errorCode = error?.code || 'ERROR';

  return (
    <div className="agent-demo-alert danger mb-4">
      <div className="d-flex align-items-start gap-3">
        <i className="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h4 className="fs-6 fw-bold mb-0">Agent Execution Failed</h4>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle small font-monospace">
              {errorCode}
            </span>
          </div>
          <p className="mb-3 small text-muted">{errorMessage}</p>

          <div className="d-flex gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="btn btn-sm btn-outline-danger rounded-pill px-3"
              >
                <i className="bi bi-arrow-repeat me-1"></i> Try Again
              </button>
            )}
            <Link to={`/agents/${agentSlug}`} className="btn btn-sm btn-outline-secondary rounded-pill px-3">
              <i className="bi bi-journal-text me-1"></i> View Case Study
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
