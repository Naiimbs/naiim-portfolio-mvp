import React, { useState, useEffect } from 'react';

export default function ResourceMarkdownViewerModal({
  isOpen,
  onClose,
  asset,
  title = 'Skill Playbook Viewer',
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (isOpen && asset?.file_url) {
      setLoading(true);
      setError(null);
      fetch(asset.file_url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} when loading ${asset.name}`);
          return res.text();
        })
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('[ResourceMarkdownViewer] Load error:', err);
          setError(err.message || 'Unable to load markdown playbook.');
          setLoading(false);
        });
    }
  }, [isOpen, asset]);

  if (!isOpen) return null;

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="resource-lightbox-modal" onClick={onClose}>
      <div
        className="resource-lightbox-dialog"
        style={{ maxWidth: '860px', height: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="resource-lightbox-header">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <div className="asset-icon-box bg-primary bg-opacity-10 text-primary" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
              <i className="bi bi-file-earmark-code"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-bold text-dark small text-truncate">
                {asset?.name || title}
              </div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                {asset?.description || 'Agent execution playbook and prompt instructions'}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {content && (
              <button
                type="button"
                onClick={() => handleCopyText(content, 'full')}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                style={{ fontSize: '0.75rem' }}
              >
                {copiedIndex === 'full' ? (
                  <>
                    <i className="bi bi-check-lg text-success me-1"></i> Copied Full File
                  </>
                ) : (
                  <>
                    <i className="bi bi-clipboard me-1"></i> Copy Raw Text
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-light rounded-circle"
              style={{ width: '32px', height: '32px', padding: 0 }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto bg-white flex-grow-1">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success mb-3" role="status" style={{ color: 'var(--green)' }}></div>
              <div className="text-muted small">Loading playbook contents...</div>
            </div>
          ) : error ? (
            <div className="alert alert-danger py-3 px-4 rounded-3 small">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          ) : (
            <div className="markdown-prose-wrap">
              <pre
                className="p-3.5 rounded-3 bg-light border text-dark font-monospace"
                style={{
                  fontSize: '0.82rem',
                  lineHeight: '1.65',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
