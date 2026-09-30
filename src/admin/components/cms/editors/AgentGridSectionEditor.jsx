import React from 'react';
import AgentSelector from '../AgentSelector';

export default function AgentGridSectionEditor({ config = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="agent-grid-section-editor">
      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. AUTONOMOUS AGENTS"
          value={config.eyebrow || ''}
          onChange={(e) => handleChange('eyebrow', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Grid Title</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Custom AI Agents"
          value={config.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Description</label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="2"
          placeholder="Subtitle narrative for the AI agents grid..."
          value={config.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="row g-2 mb-3">
        <div className="col-6">
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
        <div className="col-6 d-flex align-items-end">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="show_description"
              checked={config.show_description !== false}
              onChange={(e) => handleChange('show_description', e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="show_description">
              Show Description
            </label>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold d-block">Select & Order AI Agents</label>
        <AgentSelector
          selectedIds={config.agentIds || []}
          onChange={(agentIds) => handleChange('agentIds', agentIds)}
        />
      </div>
    </div>
  );
}
