import React, { useState, useEffect, useMemo } from 'react';
import { generateCustomCssPreviewDoc, PREVIEW_VIEWPORT_PRESETS } from '../../../ui/theme/customCssPreviewDoc';

/**
 * CustomCssLivePreview
 * Isolated sandboxed preview panel for the Global Custom CSS Editor.
 *
 * Requirements:
 * - Debounces user CSS updates (~200ms) without auto-saving
 * - Sandboxed <iframe> with sandbox="" (no scripts, no navigation)
 * - Visual responsiveness toggle (Desktop 100%, Tablet 768px, Mobile 375px)
 * - Clear "Draft Preview" status and "Revert to Saved" capability
 */
export default function CustomCssLivePreview({
  customCss = '',
  savedCss = '',
  onRevert,
  validationResult,
  themeTokens,
}) {
  const [debouncedCss, setDebouncedCss] = useState(customCss);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [viewportPreset, setViewportPreset] = useState(PREVIEW_VIEWPORT_PRESETS.DESKTOP);

  // Debounce user keystrokes (200ms)
  useEffect(() => {
    if (customCss === debouncedCss) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedCss(customCss);
      setIsDebouncing(false);
    }, 200);

    return () => clearTimeout(handler);
  }, [customCss, debouncedCss]);

  // Generate safe HTML srcdoc string
  const srcDoc = useMemo(() => {
    return generateCustomCssPreviewDoc({
      customCss: debouncedCss,
      themeTokens,
    });
  }, [debouncedCss, themeTokens]);

  const isDirty = customCss !== savedCss;

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column" style={{ background: '#f8fafc' }}>
      {/* Preview Header & Controls */}
      <div className="card-header bg-white border-bottom pt-3 px-3 pb-2 rounded-top-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold small text-uppercase font-heading" style={{ letterSpacing: '0.04em' }}>
              <i className="bi bi-display text-primary me-1"></i> Live Isolated Preview
            </span>
            {isDirty ? (
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: '0.7rem' }}>
                Draft (Not Saved)
              </span>
            ) : (
              <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle" style={{ fontSize: '0.7rem' }}>
                Synced to Saved
              </span>
            )}
            {isDebouncing && (
              <span className="spinner-border spinner-border-sm text-muted" role="status" style={{ width: '0.8rem', height: '0.8rem' }}>
                <span className="visually-hidden">Debouncing...</span>
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Viewport Width Preset Switcher */}
            <div className="btn-group btn-group-sm" role="group" aria-label="Viewport Switcher">
              <button
                type="button"
                className={`btn btn-xs py-1 px-2 ${viewportPreset === PREVIEW_VIEWPORT_PRESETS.DESKTOP ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewportPreset(PREVIEW_VIEWPORT_PRESETS.DESKTOP)}
                title="Desktop Viewport (100%)"
                style={{ fontSize: '0.72rem' }}
              >
                <i className="bi bi-display me-1"></i>Desktop
              </button>
              <button
                type="button"
                className={`btn btn-xs py-1 px-2 ${viewportPreset === PREVIEW_VIEWPORT_PRESETS.TABLET ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewportPreset(PREVIEW_VIEWPORT_PRESETS.TABLET)}
                title="Tablet Viewport (768px)"
                style={{ fontSize: '0.72rem' }}
              >
                <i className="bi bi-tablet me-1"></i>Tablet
              </button>
              <button
                type="button"
                className={`btn btn-xs py-1 px-2 ${viewportPreset === PREVIEW_VIEWPORT_PRESETS.MOBILE ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewportPreset(PREVIEW_VIEWPORT_PRESETS.MOBILE)}
                title="Mobile Viewport (375px)"
                style={{ fontSize: '0.72rem' }}
              >
                <i className="bi bi-phone me-1"></i>Mobile
              </button>
            </div>

            {/* Revert to Saved Button */}
            {isDirty && onRevert && (
              <button
                type="button"
                className="btn btn-xs btn-outline-danger py-1 px-2 rounded-2"
                style={{ fontSize: '0.72rem' }}
                onClick={onRevert}
                title="Discard unsaved preview edits and revert to saved CSS"
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Revert
              </button>
            )}
          </div>
        </div>

        {/* Validation Warning Alert in Preview if syntax is invalid */}
        {validationResult && !validationResult.valid && (
          <div className="alert alert-warning py-1 px-2 mb-1 rounded-2 small d-flex align-items-center gap-2" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"></i>
            <span>
              <strong>Syntax Warning:</strong> Invalid CSS is isolated inside the preview. The Admin UI remains protected.
            </span>
          </div>
        )}
      </div>

      {/* Sandboxed Iframe Container */}
      <div className="card-body p-0 flex-grow-1 d-flex flex-column align-items-center justify-content-center bg-light position-relative overflow-hidden" style={{ minHeight: '440px' }}>
        <div
          className="w-100 h-100 d-flex justify-content-center"
          style={{
            maxWidth: viewportPreset,
            transition: 'max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: viewportPreset !== PREVIEW_VIEWPORT_PRESETS.DESKTOP ? '0 0 20px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <iframe
            title="Global Custom CSS Preview"
            srcDoc={srcDoc}
            sandbox=""
            className="w-100 h-100 border-0"
            style={{
              minHeight: '460px',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      </div>

      {/* Preview Footer Advisory Note */}
      <div className="card-footer bg-white border-top py-2 px-3 rounded-bottom-4">
        <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
          <span>
            <i className="bi bi-shield-check text-success me-1"></i>
            Fully isolated sandbox: scripts disabled, parent Admin CMS safe.
          </span>
          <span className="text-secondary">
            Changes apply to public pages only after clicking <strong>Save All Settings</strong>.
          </span>
        </div>
      </div>
    </div>
  );
}
