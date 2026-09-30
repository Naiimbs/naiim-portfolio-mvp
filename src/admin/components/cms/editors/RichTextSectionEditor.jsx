import React from 'react';

export default function RichTextSectionEditor({ config = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="rich-text-section-editor">
      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. BACKGROUND & APPROACH"
          value={config.eyebrow || ''}
          onChange={(e) => handleChange('eyebrow', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Section Title</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Design Philosophy"
          value={config.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Body Text</label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="6"
          placeholder="Write clean, structured paragraph narrative content here..."
          value={config.body || config.content || ''}
          onChange={(e) => handleChange('body', e.target.value)}
        />
        <small className="text-muted">Plain text or structured narrative paragraph text.</small>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Text Alignment</label>
        <select
          className="form-select form-select-sm rounded-3"
          value={config.alignment || 'left'}
          onChange={(e) => handleChange('alignment', e.target.value)}
        >
          <option value="left">Left Aligned</option>
          <option value="center">Centered</option>
          <option value="right">Right Aligned</option>
        </select>
      </div>
    </div>
  );
}
