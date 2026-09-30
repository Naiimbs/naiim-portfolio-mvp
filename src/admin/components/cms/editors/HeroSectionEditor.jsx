import React, { useState } from 'react';
import MediaPickerModal from '../MediaPickerModal';

export default function HeroSectionEditor({ config = {}, onChange }) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleCtaChange = (ctaType, field, value) => {
    const currentCta = config[ctaType] || {};
    onChange({
      ...config,
      [ctaType]: {
        ...currentCta,
        [field]: value,
      },
    });
  };

  return (
    <div className="hero-section-editor">
      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. PORTFOLIO & AI SYSTEMS"
          value={config.eyebrow || ''}
          onChange={(e) => handleChange('eyebrow', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Hero Title</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Building Next-Gen Interfaces"
          value={config.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Description</label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="3"
          placeholder="Hero subtitle or description narrative..."
          value={config.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Layout Style</label>
        <select
          className="form-select form-select-sm rounded-3"
          value={config.layout || 'split'}
          onChange={(e) => handleChange('layout', e.target.value)}
        >
          <option value="split">Split (Text Left + Image Right)</option>
          <option value="centered">Centered (Text Center + Image Below)</option>
          <option value="left">Left Aligned (Full Width Text)</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold d-block">Hero Image Asset</label>
        {config.imageUrl ? (
          <div className="d-flex align-items-center gap-2 p-2 border rounded-3 bg-light mb-2">
            <img src={config.imageUrl} alt={config.imageAlt || 'Hero'} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
            <div className="flex-grow-1 text-truncate small">
              <span className="fw-semibold d-block text-truncate">Image Attached</span>
              <span className="text-muted small">Media ID: {config.imageId ? config.imageId.slice(0, 8) : 'Custom URL'}</span>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowMediaPicker(true)}>
              Change
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-sm btn-outline-primary w-100 rounded-3 py-2" onClick={() => setShowMediaPicker(true)}>
            <i className="bi bi-image me-1"></i> Select Media Asset
          </button>
        )}

        <input
          type="text"
          className="form-control form-control-sm rounded-3 mt-2"
          placeholder="Image Alt Text..."
          value={config.imageAlt || ''}
          onChange={(e) => handleChange('imageAlt', e.target.value)}
        />
      </div>

      <hr className="my-3" />
      <h6 className="fw-bold small text-uppercase tracking-wider">Primary Button</h6>
      <div className="row g-2 mb-3">
        <div className="col-6">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            placeholder="Label (e.g. View Work)"
            value={config.primaryCta?.label || ''}
            onChange={(e) => handleCtaChange('primaryCta', 'label', e.target.value)}
          />
        </div>
        <div className="col-6">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            placeholder="Href (e.g. /work)"
            value={config.primaryCta?.href || ''}
            onChange={(e) => handleCtaChange('primaryCta', 'href', e.target.value)}
          />
        </div>
      </div>

      <h6 className="fw-bold small text-uppercase tracking-wider">Secondary Button</h6>
      <div className="row g-2 mb-3">
        <div className="col-6">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            placeholder="Label (e.g. Contact)"
            value={config.secondaryCta?.label || ''}
            onChange={(e) => handleCtaChange('secondaryCta', 'label', e.target.value)}
          />
        </div>
        <div className="col-6">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            placeholder="Href (e.g. /about)"
            value={config.secondaryCta?.href || ''}
            onChange={(e) => handleCtaChange('secondaryCta', 'href', e.target.value)}
          />
        </div>
      </div>

      <MediaPickerModal
        show={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        selectedMediaId={config.imageId}
        onSelectMedia={(media) => {
          onChange({
            ...config,
            imageId: media.id,
            imageUrl: media.public_url,
            imageAlt: media.alt_text || media.filename,
          });
        }}
      />
    </div>
  );
}
