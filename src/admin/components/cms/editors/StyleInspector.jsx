import React, { useState } from 'react';
import {
  SPACING_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  FONT_FAMILY_TOKENS,
  FONT_WEIGHT_TOKENS,
  TEXT_ALIGN_TOKENS,
  normalizeStyleConfig,
  resolvePropertyValue,
  setPropertyValue,
  resetPropertyOverride,
  validateCustomCss,
} from '../../../../components/cms/styleSystem';

export default function StyleInspector({ style = {}, sectionId = '', onChange }) {
  const [activeViewport, setActiveViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const normStyle = normalizeStyleConfig(style);

  const getProp = (prop) => resolvePropertyValue(normStyle, prop, activeViewport);

  const setProp = (prop, val) => {
    const updated = setPropertyValue(normStyle, prop, val, activeViewport);
    onChange(updated);
  };

  const handleResetOverride = (prop) => {
    const updated = resetPropertyOverride(normStyle, prop, activeViewport);
    onChange(updated);
  };

  const handleCustomCssChange = (cssVal) => {
    onChange({
      ...normStyle,
      customCss: cssVal,
    });
  };

  const cssValidation = validateCustomCss(normStyle.customCss);

  // Resolved box model values for visualization
  const pt = getProp('paddingTop').value || '0px';
  const pb = getProp('paddingBottom').value || '0px';
  const pl = getProp('paddingLeft').value || '0px';
  const pr = getProp('paddingRight').value || '0px';
  const mt = getProp('marginTop').value || '0px';
  const mb = getProp('marginBottom').value || '0px';

  return (
    <div className="style-inspector">
      {/* 1. Viewport Selector */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <label className="form-label small fw-bold text-uppercase mb-0 text-muted" style={{ fontSize: '0.72rem' }}>
          Breakpoint Viewport:
        </label>
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className={`btn btn-sm ${activeViewport === 'desktop' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            onClick={() => setActiveViewport('desktop')}
          >
            <i className="bi bi-display me-1" /> Desktop
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeViewport === 'tablet' ? 'btn-primary' : 'btn-outline-secondary bg-white'} ${
              Object.keys(normStyle.tablet || {}).length > 0 ? 'border-warning' : ''
            }`}
            onClick={() => setActiveViewport('tablet')}
          >
            <i className="bi bi-tablet me-1" /> Tablet
            {Object.keys(normStyle.tablet || {}).length > 0 && <span className="badge bg-warning text-dark ms-1 p-1">•</span>}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeViewport === 'mobile' ? 'btn-primary' : 'btn-outline-secondary bg-white'} ${
              Object.keys(normStyle.mobile || {}).length > 0 ? 'border-warning' : ''
            }`}
            onClick={() => setActiveViewport('mobile')}
          >
            <i className="bi bi-phone me-1" /> Mobile
            {Object.keys(normStyle.mobile || {}).length > 0 && <span className="badge bg-warning text-dark ms-1 p-1">•</span>}
          </button>
        </div>
      </div>

      {/* 2. Compact Box Model Visualizer */}
      <div className="card border-0 bg-light rounded-3 p-3 mb-3 text-center">
        <div className="small fw-bold text-uppercase text-secondary mb-2" style={{ fontSize: '0.7rem' }}>
          Box Model Visualization ({activeViewport})
        </div>
        <div
          className="p-2 rounded-3 border border-warning border-dashed mx-auto"
          style={{ maxWidth: '280px', backgroundColor: 'rgba(255, 193, 7, 0.08)' }}
        >
          <span className="small text-muted d-block" style={{ fontSize: '0.65rem' }}>
            MARGIN (T: {mt} · B: {mb})
          </span>
          <div
            className="p-2 rounded-2 border border-info border-dashed my-1"
            style={{ backgroundColor: 'rgba(13, 202, 240, 0.08)' }}
          >
            <span className="small text-muted d-block" style={{ fontSize: '0.65rem' }}>
              PADDING (T: {pt} · B: {pb} · L: {pl} · R: {pr})
            </span>
            <div className="bg-white border rounded py-2 px-3 shadow-xs">
              <span className="fw-semibold text-dark small" style={{ fontSize: '0.72rem' }}>
                Content
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Spacing Controls */}
      <div className="card border-0 bg-light rounded-3 p-3 mb-3">
        <div className="fw-bold small text-uppercase text-secondary mb-2 d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-arrows-expand me-1 text-primary" /> Spacing & Padding
          </span>
          {activeViewport !== 'desktop' && (
            <span className="text-muted" style={{ fontSize: '0.68rem' }}>
              Inherits from Desktop
            </span>
          )}
        </div>

        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Padding Top
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('paddingTop').value || 'none'}
              onChange={(e) => setProp('paddingTop', e.target.value)}
            >
              {Object.entries(SPACING_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Padding Bottom
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('paddingBottom').value || 'none'}
              onChange={(e) => setProp('paddingBottom', e.target.value)}
            >
              {Object.entries(SPACING_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Margin Top
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('marginTop').value || 'none'}
              onChange={(e) => setProp('marginTop', e.target.value)}
            >
              {Object.entries(SPACING_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Margin Bottom
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('marginBottom').value || 'none'}
              onChange={(e) => setProp('marginBottom', e.target.value)}
            >
              {Object.entries(SPACING_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Typography */}
      <div className="card border-0 bg-light rounded-3 p-3 mb-3">
        <div className="fw-bold small text-uppercase text-secondary mb-2">
          <i className="bi bi-fonts me-1 text-primary" /> Typography
        </div>

        <div className="mb-2">
          <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
            Font Family
          </label>
          <select
            className="form-select form-select-sm rounded-2"
            value={getProp('fontFamily').value || 'default'}
            onChange={(e) => setProp('fontFamily', e.target.value)}
          >
            {Object.entries(FONT_FAMILY_TOKENS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Text Alignment
            </label>
            <div className="btn-group btn-group-sm w-100">
              {Object.entries(TEXT_ALIGN_TOKENS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn btn-sm ${getProp('textAlign').value === key ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                  onClick={() => setProp('textAlign', key)}
                  title={item.label}
                >
                  <i className={`bi ${item.icon}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Font Weight
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('fontWeight').value || 'normal'}
              onChange={(e) => setProp('fontWeight', e.target.value)}
            >
              {Object.entries(FONT_WEIGHT_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Colors & Borders */}
      <div className="card border-0 bg-light rounded-3 p-3 mb-3">
        <div className="fw-bold small text-uppercase text-secondary mb-2">
          <i className="bi bi-palette me-1 text-primary" /> Colors, Borders & Shadows
        </div>

        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Background Color
            </label>
            <div className="input-group input-group-sm">
              <input
                type="color"
                className="form-control form-control-color p-0"
                style={{ width: '38px' }}
                value={getProp('backgroundColor').value || '#ffffff'}
                onChange={(e) => setProp('backgroundColor', e.target.value)}
              />
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                placeholder="#ffffff"
                value={getProp('backgroundColor').value || ''}
                onChange={(e) => setProp('backgroundColor', e.target.value)}
              />
            </div>
          </div>

          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Text Color
            </label>
            <div className="input-group input-group-sm">
              <input
                type="color"
                className="form-control form-control-color p-0"
                style={{ width: '38px' }}
                value={getProp('textColor').value || '#10242a'}
                onChange={(e) => setProp('textColor', e.target.value)}
              />
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                placeholder="#10242a"
                value={getProp('textColor').value || ''}
                onChange={(e) => setProp('textColor', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Corner Radius
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('borderRadius').value || 'none'}
              onChange={(e) => setProp('borderRadius', e.target.value)}
            >
              {Object.entries(RADIUS_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
              Box Shadow
            </label>
            <select
              className="form-select form-select-sm rounded-2"
              value={getProp('boxShadow').value || 'none'}
              onChange={(e) => setProp('boxShadow', e.target.value)}
            >
              {Object.entries(SHADOW_TOKENS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. Advanced Custom CSS */}
      <div className="card border-0 bg-light rounded-3 p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="fw-bold small text-uppercase text-secondary">
            <i className="bi bi-code-slash me-1 text-primary" /> Advanced Scoped CSS
          </span>
          <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace" style={{ fontSize: '0.65rem' }}>
            [data-section-id=&quot;{sectionId}&quot;]
          </span>
        </div>
        <small className="text-muted d-block mb-2" style={{ fontSize: '0.7rem' }}>
          Custom CSS rules written here are automatically scoped to this section. Optional @media rules are supported.
        </small>

        {/* Validation Errors & Warnings */}
        {!cssValidation.valid && (
          <div className="alert alert-danger p-2 mb-2 rounded-2 small" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-x-circle-fill me-1" />
            {cssValidation.errors.join(' ')}
          </div>
        )}
        {cssValidation.warnings.length > 0 && (
          <div className="alert alert-warning p-2 mb-2 rounded-2 small" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-exclamation-triangle-fill me-1" />
            {cssValidation.warnings.join(' ')}
          </div>
        )}

        <textarea
          className="form-control form-control-sm font-monospace rounded-3"
          rows="4"
          placeholder={`.my-title {\n  letter-spacing: -0.02em;\n}\n@media (max-width: 768px) {\n  .my-title { font-size: 1.5rem; }\n}`}
          value={normStyle.customCss || ''}
          onChange={(e) => handleCustomCssChange(e.target.value)}
        />
      </div>
    </div>
  );
}
