import React from 'react';

export default function AgentDemoResult({
  result,
  onReset,
  loading,
}) {
  if (loading) {
    return (
      <div className="agent-demo-result-card loading-state text-center py-5">
        <div className="spinner-grow text-success mb-3" role="status">
          <span className="visually-hidden">Agent thinking...</span>
        </div>
        <h4 className="fs-5 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Processing with n8n & Gemini...
        </h4>
        <p className="text-muted small mb-0">
          Querying vector memory, executing agent reasoning, and preparing response.
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="agent-demo-result-card">
      <div className="agent-result-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="result-dot">●</span>
          <strong className="fs-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Agent Response
          </strong>
          {result.durationMs && (
            <span className="badge bg-light text-dark border ms-2 small font-monospace">
              {result.durationMs}ms
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          title="Clear response and ask another question"
        >
          <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
        </button>
      </div>

      <div className="agent-result-body">
        <div className="agent-output-text">
          {result.answer ? (
            result.answer.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-3">
                {paragraph}
              </p>
            ))
          ) : (
            <pre className="bg-light p-3 rounded text-dark small font-monospace">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="agent-result-footer d-flex justify-content-between align-items-center small text-muted">
        <div>
          <i className="bi bi-shield-check text-success me-1"></i> Generated via Secure MCP Gateway
        </div>
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
