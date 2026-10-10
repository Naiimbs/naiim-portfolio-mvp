import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { THEME_DEFAULTS } from '../../ui/theme/themeDefaults';
import {
  validateAndNormalizeTheme,
  isValidCssColor,
  isValidCssDimension,
  applyThemeToDom,
} from '../../ui/theme/themeResolver';
import { getThemeSettings, updateThemeSettings } from '../../services/siteCms';

export default function AdminThemeSettings() {
  const [theme, setTheme] = useState(THEME_DEFAULTS);
  const [initialTheme, setInitialTheme] = useState(THEME_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getThemeSettings();
      if (res.data) {
        const normalized = validateAndNormalizeTheme(res.data);
        setTheme(normalized);
        setInitialTheme(normalized);
        applyThemeToDom(normalized);
      } else {
        setTheme(THEME_DEFAULTS);
        setInitialTheme(THEME_DEFAULTS);
      }
      setIsDirty(false);
      setLoading(false);
    }
    load();
  }, []);

  const handleColorChange = (key, val) => {
    const updated = {
      ...theme,
      colors: {
        ...theme.colors,
        [key]: val,
      },
    };
    setTheme(updated);
    setIsDirty(true);

    if (validationErrors[key]) {
      setValidationErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleTypographyChange = (key, val) => {
    const updated = {
      ...theme,
      typography: {
        ...theme.typography,
        [key]: val,
      },
    };
    setTheme(updated);
    setIsDirty(true);
  };

  const handleRadiusChange = (key, val) => {
    const updated = {
      ...theme,
      radius: {
        ...theme.radius,
        [key]: val,
      },
    };
    setTheme(updated);
    setIsDirty(true);
  };

  const handleButtonChange = (key, val) => {
    const updated = {
      ...theme,
      buttons: {
        ...theme.buttons,
        [key]: val,
      },
    };
    setTheme(updated);
    setIsDirty(true);
  };

  const validate = () => {
    const errors = {};
    for (const [key, val] of Object.entries(theme.colors)) {
      if (!isValidCssColor(val)) {
        errors[key] = `Invalid CSS color: "${val}"`;
      }
    }
    for (const [key, val] of Object.entries(theme.radius)) {
      if (!isValidCssDimension(val)) {
        errors[`radius_${key}`] = `Invalid dimension (e.g. 8px, 1rem): "${val}"`;
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setFeedback(null);

    if (!validate()) {
      setFeedback({ type: 'danger', message: 'Please correct the invalid tokens highlighted below before saving.' });
      return;
    }

    setSaving(true);
    const normalized = validateAndNormalizeTheme(theme);
    const res = await updateThemeSettings(normalized);

    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save theme settings.' });
    } else {
      setInitialTheme(normalized);
      setTheme(normalized);
      setIsDirty(false);
      applyThemeToDom(normalized);
      setFeedback({ type: 'success', message: 'Theme tokens saved successfully and applied to the site!' });
    }
    setSaving(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all theme tokens to default project identity? Any unsaved edits will be discarded.')) {
      setTheme(THEME_DEFAULTS);
      setValidationErrors({});
      setIsDirty(true);
      applyThemeToDom(THEME_DEFAULTS);
    }
  };

  const handleCancel = () => {
    setTheme(initialTheme);
    setValidationErrors({});
    setIsDirty(false);
    applyThemeToDom(initialTheme);
  };

  return (
    <div className="container-fluid py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/admin/settings" className="text-secondary text-decoration-none small">
              Settings
            </Link>
            <i className="bi bi-chevron-right text-muted small" style={{ fontSize: '0.7rem' }}></i>
            <span className="small text-muted">Theme Tokens</span>
          </div>
          <h1 className="h3 mb-1 fw-bold font-heading">Theme &amp; Design Tokens</h1>
          <p className="text-muted small mb-0">Control brand palette, semantic colors, typography, and button primitives safely.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isDirty ? (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-3 py-2 rounded-pill d-inline-flex align-items-center">
              <i className="bi bi-circle-fill me-2 text-warning" style={{ fontSize: '0.5rem' }}></i>
              Unsaved changes
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill d-inline-flex align-items-center">
              <i className="bi bi-check2 me-1"></i>
              Saved
            </span>
          )}
          {isDirty && (
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          )}
          <button type="button" className="btn btn-outline-danger rounded-pill px-3" onClick={handleResetToDefault} disabled={saving}>
            Reset Defaults
          </button>
          <button type="button" className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${feedback.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading theme settings...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Main Controls Form */}
          <div className="col-lg-8">
            {/* 1. BRAND & PALETTE */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="card-title fw-bold mb-1 font-heading">
                  <i className="bi bi-palette me-2 text-primary"></i> Brand &amp; Semantic Colors
                </h5>
                <p className="text-muted small mb-0">Controlled tokens governing primary buttons, highlights, surfaces and status.</p>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Brand Primary</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.brandPrimary}
                        onChange={(e) => handleColorChange('brandPrimary', e.target.value)}
                        title="Choose color"
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.brandPrimary ? 'is-invalid' : ''}`}
                        value={theme.colors.brandPrimary}
                        onChange={(e) => handleColorChange('brandPrimary', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Brand Primary Hover</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.brandPrimaryHover}
                        onChange={(e) => handleColorChange('brandPrimaryHover', e.target.value)}
                        title="Choose color"
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.brandPrimaryHover ? 'is-invalid' : ''}`}
                        value={theme.colors.brandPrimaryHover}
                        onChange={(e) => handleColorChange('brandPrimaryHover', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Accent (Warm Gold / Highlights)</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.accent ? 'is-invalid' : ''}`}
                        value={theme.colors.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Brand Secondary (Dark Charcoal / Ink)</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.brandSecondary}
                        onChange={(e) => handleColorChange('brandSecondary', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.brandSecondary ? 'is-invalid' : ''}`}
                        value={theme.colors.brandSecondary}
                        onChange={(e) => handleColorChange('brandSecondary', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Light Background (Paper)</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.surfaceMuted}
                        onChange={(e) => handleColorChange('surfaceMuted', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.surfaceMuted ? 'is-invalid' : ''}`}
                        value={theme.colors.surfaceMuted}
                        onChange={(e) => handleColorChange('surfaceMuted', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Surface Card Color</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.surface}
                        onChange={(e) => handleColorChange('surface', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.surface ? 'is-invalid' : ''}`}
                        value={theme.colors.surface}
                        onChange={(e) => handleColorChange('surface', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Text Primary</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.textPrimary}
                        onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.textPrimary ? 'is-invalid' : ''}`}
                        value={theme.colors.textPrimary}
                        onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Text Secondary</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.textSecondary}
                        onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.textSecondary ? 'is-invalid' : ''}`}
                        value={theme.colors.textSecondary}
                        onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Border / Divider</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.colors.border}
                        onChange={(e) => handleColorChange('border', e.target.value)}
                      />
                      <input
                        type="text"
                        className={`form-control font-monospace ${validationErrors.border ? 'is-invalid' : ''}`}
                        value={theme.colors.border}
                        onChange={(e) => handleColorChange('border', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TYPOGRAPHY */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="card-title fw-bold mb-1 font-heading">
                  <i className="bi bi-fonts me-2 text-primary"></i> Typography System
                </h5>
                <p className="text-muted small mb-0">Project font stacks for headings and body content.</p>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Heading Font Stack</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.typography.fontHeading}
                      onChange={(e) => handleTypographyChange('fontHeading', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Body Font Stack</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.typography.fontBody}
                      onChange={(e) => handleTypographyChange('fontBody', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RADII & BUTTONS */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="card-title fw-bold mb-1 font-heading">
                  <i className="bi bi-square me-2 text-primary"></i> Border Radius &amp; Buttons
                </h5>
                <p className="text-muted small mb-0">Corner rounding and primary button styling.</p>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Small Radius</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.radius.sm}
                      onChange={(e) => handleRadiusChange('sm', e.target.value)}
                      placeholder="6px"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Medium Radius</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.radius.md}
                      onChange={(e) => handleRadiusChange('md', e.target.value)}
                      placeholder="10px"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Large Radius</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.radius.lg}
                      onChange={(e) => handleRadiusChange('lg', e.target.value)}
                      placeholder="16px"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Pill Radius</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.radius.pill}
                      onChange={(e) => handleRadiusChange('pill', e.target.value)}
                      placeholder="9999px"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Button Primary BG</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={theme.buttons.primaryBg}
                        onChange={(e) => handleButtonChange('primaryBg', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={theme.buttons.primaryBg}
                        onChange={(e) => handleButtonChange('primaryBg', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Button Border Radius</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={theme.buttons.borderRadius}
                      onChange={(e) => handleButtonChange('borderRadius', e.target.value)}
                      placeholder="9999px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview Card */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: '80px' }}>
              <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                <h6 className="card-title fw-bold mb-1 font-heading text-uppercase small text-muted">
                  <i className="bi bi-eye me-1 text-primary"></i> Live Token Preview
                </h6>
              </div>
              <div className="card-body p-4">
                <div
                  className="p-3 rounded-4 mb-3 border"
                  style={{
                    backgroundColor: theme.colors.surfaceMuted,
                    color: theme.colors.textPrimary,
                  }}
                >
                  <div
                    className="fw-bold fs-5 mb-1"
                    style={{ fontFamily: theme.typography.fontHeading, color: theme.colors.textPrimary }}
                  >
                    I DESIGN. I BUILD.
                  </div>
                  <p
                    className="small mb-3"
                    style={{ fontFamily: theme.typography.fontBody, color: theme.colors.textSecondary }}
                  >
                    This live card previews the active theme colors, fonts, and button primitives.
                  </p>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      className="btn btn-sm px-3 shadow-sm fw-semibold"
                      style={{
                        backgroundColor: theme.buttons.primaryBg,
                        color: theme.buttons.primaryText,
                        borderRadius: theme.buttons.borderRadius,
                        border: 'none',
                      }}
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm px-3 fw-semibold"
                      style={{
                        backgroundColor: theme.colors.brandSecondary,
                        color: '#ffffff',
                        borderRadius: theme.buttons.borderRadius,
                        border: 'none',
                      }}
                    >
                      Secondary
                    </button>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="badge px-2 py-1 small"
                      style={{ backgroundColor: theme.colors.accent, color: theme.colors.brandSecondary }}
                    >
                      Accent Pill
                    </span>
                    <span
                      className="badge px-2 py-1 small"
                      style={{ backgroundColor: theme.colors.brandPrimary, color: '#ffffff' }}
                    >
                      Brand Pill
                    </span>
                  </div>
                </div>

                <div className="small text-muted border-top pt-3">
                  <div>Primary: <code>{theme.colors.brandPrimary}</code></div>
                  <div>Secondary: <code>{theme.colors.brandSecondary}</code></div>
                  <div>Accent: <code>{theme.colors.accent}</code></div>
                  <div>Background: <code>{theme.colors.surfaceMuted}</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
