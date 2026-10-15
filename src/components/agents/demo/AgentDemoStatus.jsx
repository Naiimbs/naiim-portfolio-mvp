import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AgentDemoStatus({
  error,
  status, // 'idle' | 'loading' | 'success' | 'error' | 'disabled'
  agentSlug,
  onRetry,
}) {
  const { t } = useTranslation();
  if (!error && status !== 'disabled') return null;

  if (status === 'disabled') {
    return (
      <div className="agent-demo-alert warning mb-4">
        <div className="d-flex align-items-start gap-3">
          <i className="bi bi-info-circle-fill fs-4 text-warning"></i>
          <div>
            <h4 className="fs-6 fw-bold mb-1">{t('agents.demo.inactiveTitle')}</h4>
            <p className="mb-2 small text-muted">
              {t('agents.demo.inactiveBody')}
            </p>
            <Link to={`/agents/${agentSlug}`} className="btn btn-sm btn-dark rounded-pill px-3">
              <i className="bi bi-journal-text me-1"></i> {t('agents.demo.readCase')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const errorMessage = error?.message || t('agents.demo.errorDefault');
  const errorCode = error?.code || 'ERROR';

  return (
    <div className="agent-demo-alert danger mb-4">
      <div className="d-flex align-items-start gap-3">
        <i className="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h4 className="fs-6 fw-bold mb-0">{t('agents.demo.failedTitle')}</h4>
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
                <i className="bi bi-arrow-repeat me-1"></i> {t('agents.demo.tryAgain')}
              </button>
            )}
            <Link to={`/agents/${agentSlug}`} className="btn btn-sm btn-outline-secondary rounded-pill px-3">
              <i className="bi bi-journal-text me-1"></i> {t('agents.demo.viewCase')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
