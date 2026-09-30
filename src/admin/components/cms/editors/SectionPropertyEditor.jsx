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
