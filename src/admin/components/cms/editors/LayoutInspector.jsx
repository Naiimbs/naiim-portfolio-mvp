import React, { useState } from 'react';
import {
  LAYOUT_PRESETS,
  GAP_TOKENS,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
  validateLayoutColumns,
  normalizeLayoutConfig,
  resolveResponsiveColumns,
  isViewportOverridden,
} from '../../../../components/cms/layoutSystem';

export default function LayoutInspector({ layout = {}, onChange }) {
  const [activeViewport, setActiveViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const normLayout = normalizeLayoutConfig(layout);

  const activeColumns = resolveResponsiveColumns(normLayout, activeViewport);
  const validation = validateLayoutColumns(activeColumns);
  const isOverridden = isViewportOverridden(normLayout, activeViewport);

  const handlePresetSelect = (preset) => {
    if (activeViewport === 'desktop') {
      onChange({
        ...normLayout,
        presetId: preset.id,
        columns: [...preset.columns],
        responsiveRules: {
          desktop: [...preset.columns],
          tablet: normLayout.responsiveRules?.tablet || null,
          mobile: normLayout.responsiveRules?.mobile || null,
        },
      });
    } else {
      // Set override for active viewport
      onChange({
        ...normLayout,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          [activeViewport]: [...preset.columns],
        },
      });
    }
  };

  const handleCustomColumnChange = (index, newSpan) => {
    const val = parseInt(newSpan, 10);
    const updated = [...activeColumns];
    updated[index] = isNaN(val) ? 1 : val;

    if (activeViewport === 'desktop') {
      onChange({
        ...normLayout,
        presetId: 'custom',
        columns: updated,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          desktop: updated,
        },
      });
    } else {
      onChange({
        ...normLayout,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          [activeViewport]: updated,
        },
      });
    }
  };

  const handleAddColumn = () => {
    const sum = activeColumns.reduce((a, b) => a + b, 0);
    const remaining = Math.max(1, 12 - sum);
    const updated = [...activeColumns, remaining];

    if (activeViewport === 'desktop') {
      onChange({
        ...normLayout,
        presetId: 'custom',
        columns: updated,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          desktop: updated,
        },
      });
    } else {
      onChange({
        ...normLayout,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          [activeViewport]: updated,
        },
      });
    }
  };

  const handleRemoveColumn = (index) => {
    if (activeColumns.length <= 1) return;
    const updated = activeColumns.filter((_, idx) => idx !== index);

    if (activeViewport === 'desktop') {
      onChange({
        ...normLayout,
        presetId: 'custom',
        columns: updated,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          desktop: updated,
        },
      });
    } else {
      onChange({
        ...normLayout,
        responsiveRules: {
          ...(normLayout.responsiveRules || {}),
          [activeViewport]: updated,
        },
      });
    }
  };

  const handleResetOverride = () => {
    if (activeViewport === 'desktop') return;
    const nextRules = { ...(normLayout.responsiveRules || {}) };
    delete nextRules[activeViewport];

    onChange({
      ...normLayout,
      responsiveRules: nextRules,
    });
  };

  const handleSettingChange = (field, value) => {
    onChange({
      ...normLayout,
      [field]: value,
    });
  };

  return (
    <div className="layout-inspector">
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
              isViewportOverridden(normLayout, 'tablet') ? 'border-warning' : ''
            }`}
            onClick={() => setActiveViewport('tablet')}
          >
            <i className="bi bi-tablet me-1" /> Tablet
            {isViewportOverridden(normLayout, 'tablet') && <span className="badge bg-warning text-dark ms-1 p-1">•</span>}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeViewport === 'mobile' ? 'btn-primary' : 'btn-outline-secondary bg-white'} ${
              isViewportOverridden(normLayout, 'mobile') ? 'border-warning' : ''
            }`}
            onClick={() => setActiveViewport('mobile')}
          >
            <i className="bi bi-phone me-1" /> Mobile
            {isViewportOverridden(normLayout, 'mobile') && <span className="badge bg-warning text-dark ms-1 p-1">•</span>}
          </button>
        </div>
      </div>

      {/* Viewport Status & Reset Banner */}
      {activeViewport !== 'desktop' && (
        <div className="d-flex justify-content-between align-items-center p-2 mb-3 rounded-3 bg-light border small">
          <div>
            {isOverridden ? (
              <span className="text-warning fw-semibold">
                <i className="bi bi-pencil-square me-1" /> Custom override for {activeViewport}
              </span>
            ) : (
              <span className="text-muted">
                <i className="bi bi-arrow-return-right me-1" /> Inherited from Desktop ({normLayout.columns.join(' : ')})
              </span>
            )}
          </div>
          {isOverridden && (
            <button
              type="button"
              className="btn btn-xs btn-outline-secondary bg-white py-0 px-2 rounded-pill"
              style={{ fontSize: '0.68rem' }}
              onClick={handleResetOverride}
              title="Reset to inherited layout"
            >
              Reset Override
            </button>
          )}
        </div>
      )}

      {/* 2. Visual Layout Presets */}
      <div className="mb-3">
        <label className="form-label small fw-semibold d-block mb-2">Column Presets</label>
        <div className="row g-2">
          {LAYOUT_PRESETS.filter((p) => p.id !== 'custom').map((p) => {
            const isSelected = normLayout.presetId === p.id && !isOverridden;
            return (
              <div key={p.id} className="col-6">
                <button
                  type="button"
                  className={`btn btn-sm w-100 text-start p-2 rounded-3 border transition-all ${
                    isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light-subtle bg-white hover-bg-light'
                  }`}
                  onClick={() => handlePresetSelect(p)}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold small text-dark" style={{ fontSize: '0.75rem' }}>
                      {p.name}
                    </span>
                    {isSelected && <i className="bi bi-check2 text-primary" />}
                  </div>
                  {/* Visual Bar Diagram */}
                  <div className="d-flex gap-1 bg-light p-1 rounded-2" style={{ height: '14px' }}>
                    {p.columns.map((span, idx) => (
                      <div
                        key={idx}
                        className={`rounded-1 ${isSelected ? 'bg-primary' : 'bg-secondary bg-opacity-50'}`}
                        style={{ flex: span, height: '100%' }}
                        title={`Track ${idx + 1}: ${span} cols`}
                      />
                    ))}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 12-Column Track Editor & Validation */}
      <div className="card border-0 bg-light rounded-3 p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label small fw-bold text-uppercase mb-0 text-secondary" style={{ fontSize: '0.72rem' }}>
            Active Column Tracks ({activeColumns.length})
          </label>
          <div className="small">
            Sum:{' '}
            <strong className={validation.sum === 12 ? 'text-success' : 'text-danger'}>
              {validation.sum} / 12
            </strong>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {!validation.valid && (
          <div className="alert alert-danger p-2 mb-2 rounded-2 small" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-exclamation-triangle-fill me-1" />
            {validation.errors.join(' ')}
          </div>
        )}

        {/* Track Pills & Controls */}
        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
          {activeColumns.map((span, idx) => (
            <div key={idx} className="input-group input-group-sm" style={{ width: '105px' }}>
              <span className="input-group-text bg-white px-2 text-muted" style={{ fontSize: '0.72rem' }}>
                #{idx + 1}
              </span>
              <input
                type="number"
                min="1"
                max="12"
                className="form-control px-1 text-center font-monospace"
                value={span}
                onChange={(e) => handleCustomColumnChange(idx, e.target.value)}
              />
              {activeColumns.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger px-1"
                  onClick={() => handleRemoveColumn(idx)}
                  title="Remove column track"
                >
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          ))}
          {activeColumns.length < 12 && validation.sum < 12 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary bg-white rounded-pill px-2 py-0"
              style={{ fontSize: '0.72rem', height: '30px' }}
              onClick={handleAddColumn}
            >
              <i className="bi bi-plus" /> Add Col ({12 - validation.sum})
            </button>
          )}
        </div>

        {/* 12-Column Visual Track Representation */}
        <div className="d-flex gap-1 bg-white p-1 rounded-2 border mt-1" style={{ height: '22px' }}>
          {activeColumns.map((span, idx) => (
            <div
              key={idx}
              className="bg-primary bg-opacity-75 text-white d-flex align-items-center justify-content-center rounded-1 fw-bold"
              style={{ flex: span, fontSize: '0.65rem' }}
            >
              {span}
            </div>
          ))}
          {validation.sum < 12 && (
            <div
              className="bg-danger bg-opacity-25 border border-danger border-dashed text-danger d-flex align-items-center justify-content-center rounded-1"
              style={{ flex: 12 - validation.sum, fontSize: '0.65rem' }}
              title="Missing track space to complete 12 columns"
            >
              +{12 - validation.sum}
            </div>
          )}
        </div>
      </div>

      {/* 4. Gap & Alignment Controls */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <label className="form-label small fw-semibold">Grid Gap</label>
          <select
            className="form-select form-select-sm rounded-3"
            value={normLayout.gap || 'md'}
            onChange={(e) => handleSettingChange('gap', e.target.value)}
          >
            {Object.entries(GAP_TOKENS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6">
          <label className="form-label small fw-semibold">Vertical Align</label>
          <select
            className="form-select form-select-sm rounded-3"
            value={normLayout.alignment || 'stretch'}
            onChange={(e) => handleSettingChange('alignment', e.target.value)}
          >
            {Object.entries(ALIGN_ITEMS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
