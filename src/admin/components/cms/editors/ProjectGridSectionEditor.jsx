import React from 'react';
import ProjectSelector from '../ProjectSelector';

export default function ProjectGridSectionEditor({ config = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="project-grid-section-editor">
      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. PORTFOLIO"
          value={config.eyebrow || ''}
          onChange={(e) => handleChange('eyebrow', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Grid Title</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Selected Projects"
          value={config.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Description</label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="2"
          placeholder="Subtitle narrative for the projects grid..."
          value={config.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="row g-2 mb-3">
        <div className="col-4">
          <label className="form-label small fw-semibold">Columns</label>
          <select
            className="form-select form-select-sm rounded-3"
            value={config.columns || 3}
            onChange={(e) => handleChange('columns', Number(e.target.value))}
          >
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
        </div>
        <div className="col-8 d-flex align-items-end gap-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="show_excerpt"
              checked={config.show_excerpt !== false}
              onChange={(e) => handleChange('show_excerpt', e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="show_excerpt">
              Show Excerpt
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="show_tags"
              checked={config.show_tags !== false}
              onChange={(e) => handleChange('show_tags', e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="show_tags">
              Show Tags
            </label>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold d-block">Select & Order Projects</label>
        <ProjectSelector
          selectedIds={config.projectIds || []}
          onChange={(projectIds) => handleChange('projectIds', projectIds)}
        />
      </div>
    </div>
  );
}
