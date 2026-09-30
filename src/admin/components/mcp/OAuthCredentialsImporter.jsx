import React, { useState, useRef } from 'react';
import { parseOAuthCredentialsJSON } from '../../../utils/oauthCredentialsParser';

/**
 * Generic OAuth Credentials Importer Component
 *
 * Allows uploading and client-side parsing of OAuth credential JSON files (e.g. Google Cloud).
 * Extracted values populate the parent OAuth form for manual review.
 *
 * CRITICAL SECURITY:
 * - Parsing happens 100% in the browser.
 * - Raw JSON file is never transmitted to the server or stored.
 * - Client secrets are never printed or logged to console.
 * - Only masked tokens are shown in summary UI.
 */
export default function OAuthCredentialsImporter({
  onImport,
  importedSummary,
  onClearImport,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [parseError, setParseError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleButtonClick = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[OAuth Debug] Import file selected:', file.name);

    setParseError('');
    setFileName(file.name);

    // Validate file type
    const isJsonExt = file.name.toLowerCase().endsWith('.json');
    const isJsonMime = file.type === 'application/json' || file.type === 'text/json' || !file.type;

    if (!isJsonExt && !isJsonMime) {
      setParseError('Please select a valid .json file.');
      if (e.target) e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Unable to read selected file.');
        }

        console.log('[OAuth Debug] Parsing OAuth credentials file in browser...');
        // Parse entirely client-side
        const normalized = parseOAuthCredentialsJSON(text);

        console.log('[OAuth Debug] OAuth credentials successfully parsed. Format:', normalized.format, 'AppType:', normalized.appType);

        if (onImport) {
          onImport(normalized);
        }
      } catch (err) {
        console.warn('[OAuth Debug] OAuth credentials parse error:', err.message);
        setParseError(err.message || 'Invalid OAuth credentials file.');
      } finally {
        // Reset file input value to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      console.warn('[OAuth Debug] Failed to read credentials file from disk');
      setParseError('Failed to read the credentials file from disk.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleClear = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('[OAuth Debug] Cleared imported OAuth credentials');
    setFileName('');
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClearImport) {
      onClearImport();
    }
  };

  return (
    <div className="oauth-credentials-importer mb-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="d-none"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
      />

      {/* Success Summary View */}
      {importedSummary ? (
        <div className="p-3 bg-white rounded border border-success-subtle shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2 text-success fw-bold small">
              <i className="bi bi-check-circle-fill"></i>
              <span>OAuth configuration imported</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 text-decoration-none small"
              onClick={handleClear}
              title="Clear imported file and reset fields"
            >
              <i className="bi bi-x-circle me-1"></i> Reset
            </button>
          </div>

          <div className="small font-monospace bg-light p-2 rounded border mb-2">
            <div className="text-secondary mb-1">
              <span className="fw-semibold text-dark">Application type:</span> {importedSummary.appType}
            </div>
            <div className="text-secondary text-truncate mb-1">
              <span className="fw-semibold text-dark">Client ID:</span> {importedSummary.clientId}
            </div>
            <div className="text-secondary mb-1">
              <span className="fw-semibold text-dark">Client Secret:</span> ••••••••••
            </div>
            <div className="text-secondary mb-1">
              <span className="fw-semibold text-dark">Authorization URL:</span> configured
            </div>
            <div className="text-secondary mb-1">
              <span className="fw-semibold text-dark">Token URL:</span> configured
            </div>
            <div className="text-secondary">
              <span className="fw-semibold text-dark">Redirect URIs:</span>{' '}
              {importedSummary.redirectUrisCount > 0
                ? `${importedSummary.redirectUrisCount} configured`
                : '1 configured'}
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between pt-1">
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
              <i className="bi bi-info-circle me-1"></i>
              Review the fields below before connecting.
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-2 py-1"
              style={{ fontSize: '0.75rem' }}
              onClick={handleButtonClick}
              disabled={disabled}
            >
              <i className="bi bi-arrow-repeat me-1"></i> Import different JSON
            </button>
          </div>
        </div>
      ) : (
        /* Default Upload / Choice View */
        <div className="p-3 bg-white rounded border">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div className="small fw-bold text-dark">Import OAuth JSON</div>
              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                Quickly import Google Cloud credentials (<span className="font-monospace">installed</span> or <span className="font-monospace">web</span>).
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary fw-semibold px-3 py-1 d-flex align-items-center gap-1"
              onClick={handleButtonClick}
              disabled={disabled}
            >
              <i className="bi bi-file-earmark-code"></i>
              <span>Import OAuth JSON</span>
            </button>
          </div>

          {/* Validation Error Banner */}
          {parseError && (
            <div className="alert alert-danger py-2 px-3 small mt-2 mb-0 d-flex align-items-start gap-2">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>
              <div>
                <strong>Import failed:</strong> {parseError}
              </div>
            </div>
          )}

          <div className="d-flex align-items-center my-2">
            <div className="flex-grow-1 border-bottom"></div>
            <span className="px-2 text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>
              or configure manually
            </span>
            <div className="flex-grow-1 border-bottom"></div>
          </div>
        </div>
      )}
    </div>
  );
}
