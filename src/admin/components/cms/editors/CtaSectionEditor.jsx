import React from 'react';

export default function CtaSectionEditor({ config = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="cta-section-editor">
      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. NEXT STEPS"
          value={config.eyebrow || ''}
          onChange={(e) => handleChange('eyebrow', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">CTA Title</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Ready to collaborate?"
          value={config.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Description</label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="2"
          placeholder="Call to action supporting narrative text..."
          value={config.description || config.text || ''}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="row g-2 mb-3">
        <div className="col-6">
          <label className="form-label small fw-semibold">Button Label</label>
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            placeholder="e.g. Get in Touch"
            value={config.buttonLabel || config.buttonText || ''}
            onChange={(e) => handleChange('buttonLabel', e.target.value)}
          />
        </div>
        <div className="col-6">
          <label className="form-label small fw-semibold">Button Href</label>
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            placeholder="e.g. mailto:contact@example.com"
            value={config.buttonHref || ''}
            onChange={(e) => handleChange('buttonHref', e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Alignment</label>
        <select
          className="form-select form-select-sm rounded-3"
          value={config.alignment || 'centered'}
          onChange={(e) => handleChange('alignment', e.target.value)}
        >
          <option value="centered">Centered</option>
          <option value="left">Left Aligned</option>
        </select>
      </div>
    </div>
  );
}
