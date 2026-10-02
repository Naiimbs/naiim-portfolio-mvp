import React from 'react';
import HeroSectionEditor from './HeroSectionEditor';
import RichTextSectionEditor from './RichTextSectionEditor';
import ProjectGridSectionEditor from './ProjectGridSectionEditor';
import AgentGridSectionEditor from './AgentGridSectionEditor';
import CtaSectionEditor from './CtaSectionEditor';
import { normalizeSectionConfig } from '../../../../components/cms/sectionSchemas';

export default function SectionPropertyEditor({ section, onChange, onSave, onCancel, dirty }) {
  if (!section) {
    return (
      <div className="p-4 text-center text-muted">
        <i className="bi bi-cursor display-6 mb-2 d-block"></i>
        Select a section from the left list to edit its properties.
      </div>
    );
  }

  const type = String(section.section_type || '').toLowerCase().trim();
  const config = normalizeSectionConfig(type, section.config || {});

  const handleConfigChange = (updatedConfig) => {
    onChange({
      ...section,
      config: updatedConfig,
    });
  };

  const renderEditorContent = () => {
    switch (type) {
      case 'hero':
        return <HeroSectionEditor config={config} onChange={handleConfigChange} />;
      case 'rich_text':
      case 'text':
        return <RichTextSectionEditor config={config} onChange={handleConfigChange} />;
      case 'project_grid':
        return <ProjectGridSectionEditor config={config} onChange={handleConfigChange} />;
      case 'agent_grid':
        return <AgentGridSectionEditor config={config} onChange={handleConfigChange} />;
      case 'cta':
        return <CtaSectionEditor config={config} onChange={handleConfigChange} />;
      default:
        return (
          <div className="alert alert-secondary text-center py-4 rounded-3 border-0 my-3">
            <i className="bi bi-tools display-6 text-muted mb-2 d-block"></i>
            <h6 className="fw-bold mb-1">Editor Not Available Yet</h6>
            <p className="small text-muted mb-0">
              Structured form property editor for <code>{type}</code> is reserved for future phases. Missing or default config will render safely.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="section-property-editor h-100 d-flex flex-column">
      <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
        <div>
          <h6 className="fw-bold mb-0 text-truncate">{section.label || 'Section Properties'}</h6>
          <small className="text-muted">
            Type: <code>{section.section_type}</code>
          </small>
        </div>
        {dirty && <span className="badge bg-warning text-dark">Unsaved Changes</span>}
      </div>

      <div className="p-3 flex-grow-1 overflow-auto">
        <div className="mb-3">
          <label className="form-label small fw-semibold">Section Label (Internal)</label>
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            value={section.label || ''}
            onChange={(e) => onChange({ ...section, label: e.target.value })}
          />
        </div>

        {/* Layout & CSS Customization Panel */}
        <div className="card border-0 bg-light rounded-3 p-3 mb-3">
          <div className="fw-bold small text-uppercase tracking-wider text-muted mb-2 d-flex align-items-center">
            <i className="bi bi-sliders me-2 text-primary"></i> Layout & CSS Styling
          </div>

          <div className="mb-2">
            <label className="form-label small fw-semibold">Column Layout Split</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={config.columnLayout || '12'}
              onChange={(e) => handleConfigChange({ ...config, columnLayout: e.target.value })}
            >
              <option value="12">12 (Full Width - 100%)</option>
              <option value="6:6">6 : 6 (50% / 50% Split)</option>
              <option value="4:8">4 : 8 (1/3 & 2/3 Split)</option>
              <option value="8:4">8 : 4 (2/3 & 1/3 Split)</option>
              <option value="4:4:4">4 : 4 : 4 (3 Equal Columns)</option>
              <option value="3:3:3:3">3 : 3 : 3 : 3 (4 Equal Columns)</option>
            </select>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              Applies responsive grid column wrapping for section content blocks.
            </small>
          </div>

          <div>
            <label className="form-label small fw-semibold">Custom CSS Class Name(s)</label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3 font-monospace"
              placeholder="e.g. my-custom-section py-5 bg-dark text-white rounded-4"
              value={config.customClassName || ''}
              onChange={(e) => handleConfigChange({ ...config, customClassName: e.target.value })}
            />
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              Add custom class names. Define CSS rules in Admin Settings → Custom CSS.
            </small>
          </div>
        </div>

        {renderEditorContent()}
      </div>

      <div className="p-3 border-top bg-light d-flex justify-content-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-sm btn-light rounded-pill" onClick={onCancel}>
            Reset
          </button>
        )}
        <button type="button" className="btn btn-sm btn-primary rounded-pill px-4" onClick={onSave} disabled={!dirty}>
          Save Section
        </button>
      </div>
    </div>
  );
}
