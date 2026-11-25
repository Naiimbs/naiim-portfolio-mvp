import React, { useEffect, useState } from 'react';
import {
  CASE_STUDY_LOCALES,
  createCaseStudySection,
  getAvailableCaseStudySectionTypes,
  moveCaseStudySection,
  removeCaseStudySection,
  updateCaseStudySectionContent,
} from '../../../services/caseStudyEditorModel';
import { CASE_STUDY_SECTION_REGISTRY } from '../../../components/case-study/SectionRegistry';

const TEXT_FIELDS = [
  { key: 'eyebrow', label: 'Eyebrow' },
  { key: 'title', label: 'Title' },
  { key: 'lead', label: 'Lead / Intro', multiline: true },
  { key: 'body', label: 'Body', multiline: true },
  { key: 'copy', label: 'Copy', multiline: true },
  { key: 'description', label: 'Description', multiline: true },
  { key: 'role', label: 'My role' },
  { key: 'context', label: 'Context' },
  { key: 'image', label: 'Image URL / Storage path' },
  { key: 'imageAlt', label: 'Image alt text' },
  { key: 'alt', label: 'Alt text' },
  { key: 'caption', label: 'Image caption' },
  { key: 'liveProductUrl', label: 'Live product URL' },
];

const JSON_FIELDS = [
  { key: 'metaChips', label: 'Meta chips' },
  { key: 'items', label: 'Items / Feature cards' },
  { key: 'bullets', label: 'Bullets' },
  { key: 'paragraphs', label: 'Paragraphs' },
  { key: 'process', label: 'Process stages' },
  { key: 'gallery', label: 'Image gallery' },
  { key: 'tags', label: 'Technology tags' },
  { key: 'links', label: 'External links' },
];

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

function JsonField({ label, value, onCommit, disabled }) {
  const serialized = JSON.stringify(value ?? [], null, 2);
  const [draft, setDraft] = useState(serialized);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(serialized);
    setError('');
  }, [serialized]);

  const commit = () => {
    if (!draft.trim()) {
      onCommit([]);
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(draft);
      if (!Array.isArray(parsed) && (parsed === null || typeof parsed !== 'object')) {
        setError('Enter a JSON array or object.');
        return;
      }
      onCommit(parsed);
      setError('');
    } catch {
      setError('Invalid JSON. Correct it before leaving this field.');
    }
  };

  return (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <textarea
        className={`form-control form-control-sm font-monospace ${error ? 'is-invalid' : ''}`}
        rows="5"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        spellCheck="false"
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
      <div className="form-text">JSON array/object. Changes are saved when the field loses focus.</div>
    </div>
  );
}

function LocaleEditor({ section, locale, onFieldChange, disabled }) {
  const content = section.content?.[locale] || {};
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="row g-3" dir={direction}>
      <div className="col-12">
        <div className="small text-uppercase fw-bold text-success mb-2">{locale.toUpperCase()}</div>
      </div>
      {TEXT_FIELDS.map((field) => (
        <div className={field.multiline ? 'col-12' : 'col-md-6'} key={field.key}>
          <label className="form-label small">{field.label}</label>
          {field.multiline ? (
            <textarea
              className="form-control form-control-sm"
              rows="3"
              value={typeof content[field.key] === 'string' ? content[field.key] : ''}
              disabled={disabled}
              onChange={(event) => onFieldChange(locale, field.key, event.target.value)}
            />
          ) : (
            <input
              className="form-control form-control-sm"
              value={typeof content[field.key] === 'string' ? content[field.key] : ''}
              disabled={disabled}
              onChange={(event) => onFieldChange(locale, field.key, event.target.value)}
            />
          )}
        </div>
      ))}
      <div className="col-12">
        <div className="row g-3">
          {JSON_FIELDS.map((field) => (
            <div className="col-lg-6" key={field.key}>
              <JsonField
                label={field.label}
                value={content[field.key]}
                disabled={disabled}
                onCommit={(value) => onFieldChange(locale, field.key, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UnifiedCaseStudyEditor({ caseStudy, onChange, disabled = false, slug = '' }) {
  const [newSectionType, setNewSectionType] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const sections = Array.isArray(caseStudy.sections) ? caseStudy.sections : [];
  const metadata = caseStudy.metadata && typeof caseStudy.metadata === 'object' ? caseStudy.metadata : {};
  const availableTypes = getAvailableCaseStudySectionTypes(sections);

  const commit = (patch) => onChange({
    ...clone(caseStudy),
    ...patch,
    version: 3,
    type: 'standard',
  });

  const updateMetadata = (field, value) => {
    let nextSections = sections;
    const overview = sections.find((section) => section.type === 'project-overview');
    if (overview && field === 'title') {
      nextSections = updateCaseStudySectionContent(sections, overview.id, 'en', 'title', value);
    }
    if (overview && field === 'subtitle') {
      nextSections = updateCaseStudySectionContent(sections, overview.id, 'en', 'lead', value);
    }
    commit({
      metadata: { ...metadata, [field]: value },
      sections: nextSections,
    });
  };

  const updateField = (sectionId, locale, field, value) => {
    const target = sections.find((section) => section.id === sectionId);
    const nextSections = updateCaseStudySectionContent(sections, sectionId, locale, field, value);
    const nextMetadata = { ...metadata };
    if (target?.type === 'project-overview' && locale === 'en' && field === 'title') nextMetadata.title = value;
    if (target?.type === 'project-overview' && locale === 'en' && field === 'lead') nextMetadata.subtitle = value;
    commit({ sections: nextSections, metadata: nextMetadata });
  };

  const reorder = (sectionId, targetIndex) => {
    commit({ sections: moveCaseStudySection(sections, sectionId, targetIndex) });
  };

  const addSection = () => {
    if (!newSectionType) return;
    const next = createCaseStudySection(newSectionType, sections.length);
    if (!next) return;
    commit({ sections: [...sections, next] });
    setNewSectionType('');
  };

  const removeSection = (sectionId) => {
    commit({ sections: removeCaseStudySection(sections, sectionId) });
  };

  const toggleSection = (section) => {
    commit({
      sections: sections.map((item) => item.id === section.id ? { ...item, enabled: item.enabled === false } : item),
    });
  };

  const handleDrop = (event, targetIndex) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || draggingId;
    if (sourceId) reorder(sourceId, targetIndex);
    setDraggingId(null);
  };

  return (
    <div className="admin-card mb-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-3 border-bottom">
        <div>
          <h6 className="text-success text-uppercase fw-bold small mb-1">
            <i className="bi bi-layers me-2" /> Unified Case Study Builder
          </h6>
          <p className="text-muted small mb-0">One ordered section list. Add only what this project needs.</p>
        </div>
        <span className="badge bg-success-subtle text-success border">Version 3 · Unified</span>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Case Study Title</label>
          <input className="form-control form-control-sm" value={metadata.title || ''} disabled={disabled}
            onChange={(event) => updateMetadata('title', event.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Subtitle / Description</label>
          <textarea className="form-control form-control-sm" rows="2" value={metadata.subtitle || ''} disabled={disabled}
            onChange={(event) => updateMetadata('subtitle', event.target.value)} />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold">Cover image URL / Storage path</label>
          <input className="form-control form-control-sm" value={metadata.cover || ''} disabled={disabled}
            onChange={(event) => updateMetadata('cover', event.target.value)} />
        </div>
      </div>

      <div className="border rounded p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <strong className="small">Section structure</strong>
          <span className="text-muted small">{sections.length} section{sections.length === 1 ? '' : 's'}</span>
        </div>
        <p className="text-muted small">Drag sections to reorder them, or use the arrow controls. Hidden sections remain saved but are not rendered.</p>
        {sections.map((section, index) => {
          const definition = CASE_STUDY_SECTION_REGISTRY[section.type];
          return (
            <div
              className={`border rounded p-3 mb-3 ${draggingId === section.id ? 'bg-light' : ''}`}
              key={section.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, index)}
            >
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    title="Drag to reorder"
                    aria-label={`Drag ${definition?.label || section.type} to reorder`}
                    draggable={!disabled}
                    disabled={disabled}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', section.id);
                      setDraggingId(section.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                  >
                    <i className="bi bi-grip-vertical" />
                  </button>
                  <span className="badge bg-dark">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong className="small">{definition?.label || section.type}</strong>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{section.type} · {section.category || 'core'}</div>
                  </div>
                  {section.enabled === false && <span className="badge bg-secondary">Hidden</span>}
                </div>
                <div className="d-flex gap-1">
                  <button type="button" className="btn btn-sm btn-light" title="Move up" disabled={disabled || index === 0}
                    onClick={() => reorder(section.id, index - 1)}><i className="bi bi-chevron-up" /></button>
                  <button type="button" className="btn btn-sm btn-light" title="Move down" disabled={disabled || index === sections.length - 1}
                    onClick={() => reorder(section.id, index + 1)}><i className="bi bi-chevron-down" /></button>
                  <button type="button" className="btn btn-sm btn-light" title={section.enabled === false ? 'Show section' : 'Hide section'}
                    disabled={disabled} onClick={() => toggleSection(section)}>
                    <i className={`bi bi-${section.enabled === false ? 'eye' : 'eye-slash'}`} />
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger" title="Remove section" disabled={disabled}
                    onClick={() => removeSection(section.id)}><i className="bi bi-trash" /></button>
                </div>
              </div>
              <details>
                <summary className="small fw-semibold text-success">Edit section content · EN / FR / AR</summary>
                <div className="pt-3">
                  {CASE_STUDY_LOCALES.map((locale) => (
                    <details key={locale} className="border rounded p-3 mb-3" open={locale === 'en'}>
                      <summary className="small fw-bold">{locale.toUpperCase()} content</summary>
                      <div className="pt-3">
                        <LocaleEditor
                          section={section}
                          locale={locale}
                          disabled={disabled}
                          onFieldChange={(language, field, value) => updateField(section.id, language, field, value)}
                        />
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            </div>
          );
        })}
        {sections.length === 0 && (
          <div className="text-center text-muted small border rounded p-4 mb-3">
            No sections yet. Add a section to start building this case study.
          </div>
        )}
        <div className="d-flex gap-2 flex-wrap align-items-end">
          <div className="flex-grow-1">
            <label className="form-label small fw-semibold">Add a section</label>
            <select className="form-select form-select-sm" value={newSectionType} disabled={disabled || availableTypes.length === 0}
              onChange={(event) => setNewSectionType(event.target.value)}>
              <option value="">Choose a section type</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>{CASE_STUDY_SECTION_REGISTRY[type]?.label || type}</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-sm btn-success" disabled={disabled || !newSectionType} onClick={addSection}>
            <i className="bi bi-plus-lg me-1" /> Add section
          </button>
        </div>
        <div className="form-text mt-2">Core sections can be added once. Editorial, image and project-specific modules can be added more than once.</div>
      </div>

      <div className="alert alert-light border small mb-0">
        <strong>Compatibility:</strong> This builder edits V3 records only. Existing Standard V1 and custom WINNI / Assettini editors remain unchanged until their migration is planned separately.
        {slug && <span className="d-block mt-1 text-muted">Project: {slug}</span>}
      </div>
    </div>
  );
}
