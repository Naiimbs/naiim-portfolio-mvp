import React, { useState } from 'react';
import { resolveAsset } from '../../../services/assetRegistry';
import { FDE_STAGE_TYPES, createFdeStage, createStageId, getFdeStageLabel, normalizeProcessStages } from '../../../utils/caseStudyStages';

/**
 * CaseStudyContentEditor.jsx
 *
 * Phase 14 — Case Study CMS Editor.
 *
 * Dedicated editor for `content_registry.metadata.caseStudy` (Version 1).
 * Supports standard case studies (Hero, Challenge, Contribution, Evidence, Technology)
 * and custom case studies (Winni, Assestini) with dedicated presentation notices.
 */

// Helper to safely clone objects
function clone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

export default function CaseStudyContentEditor({
  caseStudy,
  onChange,
  disabled = false,
  isPublishedAndPublic = false,
  slug = '',
}) {
  const isCustom = caseStudy?.type === 'custom' || slug === 'winni' || slug === 'assestini';

  // State for chip / tag inputs
  const [newMetaChip, setNewMetaChip] = useState('');
  const [newTechTag, setNewTechTag] = useState('');
  const [newStageType, setNewStageType] = useState('problem-context');

  // Local image load error tracking
  const [heroImgError, setHeroImgError] = useState(false);
  const [evidenceImgError, setEvidenceImgError] = useState(false);

  // If no caseStudy provided, show empty fallback
  if (!caseStudy) {
    return (
      <div className="admin-card mb-4 text-center py-4 text-muted">
        <i className="bi bi-file-earmark-text fs-3 d-block mb-2 text-secondary" />
        <div>No case study content found for this entry.</div>
      </div>
    );
  }

  // ── Custom Case Study CMS Sections ─────────────────────────────────────────
  if (isCustom) {
    const customTitle = caseStudy.title || '';
    const customSubtitle = caseStudy.subtitle || '';
    const customComponent = caseStudy.customComponent || (slug === 'winni' ? 'WinniCaseStudy' : 'AssestiniCaseStudy');
    const sections = Array.isArray(caseStudy.customSections) ? caseStudy.customSections : [];
    const locales = ['en', 'fr', 'ar'];

    const commitCustom = (next) => onChange({ ...clone(caseStudy), version: 2, type: 'custom', ...next });
    const updateSection = (index, patch) => {
      const next = [...sections];
      next[index] = { ...next[index], ...patch };
      commitCustom({ customSections: next });
    };
    const updateTranslation = (index, locale, field, value) => {
      const next = [...sections];
      const section = { ...next[index] };
      section.translations = { ...(section.translations || {}) };
      section.translations[locale] = { ...(section.translations[locale] || {}), [field]: value };
      next[index] = section;
      commitCustom({ customSections: next });
    };
    const moveSection = (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= sections.length) return;
      const next = [...sections];
      [next[index], next[target]] = [next[target], next[index]];
      commitCustom({ customSections: next });
    };
    const addSection = (type) => {
      const next = [...sections, {
        id: `custom-${Date.now()}`,
        type,
        is_visible: true,
        layout: type === 'image' ? 'wide' : 'text',
        title: '',
        body: '',
        image: '',
        alt: '',
        caption: '',
        translations: {},
      }];
      commitCustom({ customSections: next });
    };
    const removeSection = (index) => commitCustom({ customSections: sections.filter((_, i) => i !== index) });
    const updateNativeField = (sectionId, field, locale, value) => {
      const next = clone(caseStudy);
      if (locale === 'en') {
        next.nativeSections = { ...(next.nativeSections || {}), [sectionId]: { ...(next.nativeSections?.[sectionId] || {}), [field]: value } };
      } else {
        next.translations = { ...(next.translations || {}), [locale]: {
          ...(next.translations?.[locale] || {}),
          nativeSections: { ...(next.translations?.[locale]?.nativeSections || {}), [sectionId]: {
            ...(next.translations?.[locale]?.nativeSections?.[sectionId] || {}), [field]: value
          }}
        }};
      }
      commitCustom(next);
    };
    const nativeFieldGroups = slug === 'winni' ? [
      { id: 'problem', label: '02 · The Problem', fields: ['eyebrow','title','lead','quote'] },
      { id: 'challenge', label: '04 · Product Challenge', fields: ['eyebrow','title','lead','context'] },
      { id: 'privacy', label: '06 · Privacy by Design', fields: ['eyebrow','title','lead','paragraph1','paragraph2'] },
      { id: 'location', label: '07 · Location', fields: ['eyebrow','title','lead'] },
      { id: 'idea', label: '03 · The Idea', fields: ['eyebrow','title','lead'] },
      { id: 'scanExperience', label: '05 · Scan Experience', fields: ['eyebrow','title','lead','screensJson'] },
      { id: 'physicalProduct', label: '08 · Physical Product', fields: ['eyebrow','title','lead'] },
      { id: 'systemMatrix', label: '09 · Unified System', fields: ['eyebrow','title','lead','touchpointLabel','physicalLabel','digitalLabel','matrixRowsJson'] },
      { id: 'visualSystem', label: '10 · Visual System', fields: ['eyebrow','title','lead'] },
      { id: 'motion', label: '11 · Motion', fields: ['eyebrow','title','lead'] },
      { id: 'scope', label: '12 · Scope of Work', fields: ['eyebrow','title','lead'] },
      { id: 'outcome', label: '14 · Outcome', fields: ['eyebrow','title','lead'] },
    ] : [
      { id: 'challenge', label: '01 · The Challenge', fields: ['eyebrow','title','lead','paragraph2'] },
      { id: 'estimation', label: '03 · AI Estimation', fields: ['eyebrow','title','lead','highlightsJson','outputsJson'] },
      { id: 'commercial', label: '04 · Commercial Workflow', fields: ['eyebrow','title','lead','stepsJson'] },
      { id: 'mcp', label: '06 · AI Agents & MCP', fields: ['eyebrow','title','lead','paragraph2'] },
      { id: 'workflow', label: '02 · Connected Workflow', fields: ['eyebrow','title','lead','estimatorImage','estimatorImageAlt','wbsImage','wbsImageAlt'] },
      { id: 'intelligence', label: '05 · Operational Intelligence', fields: ['eyebrow','title','lead'] },
      { id: 'building', label: '07 · Product Building', fields: ['eyebrow','title','lead'] },
    ];
    const defaultNativeOrder = slug === 'winni'
      ? ['problem','idea','challenge','scanExperience','privacy','location','physicalProduct','systemMatrix','visualSystem','motion','scope','outcome']
      : ['challenge','workflow','estimation','commercial','intelligence','mcp','building'];
    const savedNativeOrder = Array.isArray(caseStudy.nativeSectionOrder) ? caseStudy.nativeSectionOrder : [];
    const nativeSectionOrder = [
      ...savedNativeOrder.filter((id) => defaultNativeOrder.includes(id)),
      ...defaultNativeOrder.filter((id) => !savedNativeOrder.includes(id)),
    ];
    const moveNativeSection = (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= nativeSectionOrder.length) return;
      const next = [...nativeSectionOrder];
      [next[index], next[target]] = [next[target], next[index]];
      commitCustom({ nativeSectionOrder: next });
    };
    const setNativeSectionVisibility = (sectionId, isVisible) => commitCustom({
      nativeSectionVisibility: { ...(caseStudy.nativeSectionVisibility || {}), [sectionId]: isVisible },
    });
    const nativeLocales = ['en','fr','ar'];
    const nativeFieldValue = (sectionId, field, locale) => locale === 'en'
      ? (caseStudy.nativeSections?.[sectionId]?.[field] || '')
      : (caseStudy.translations?.[locale]?.nativeSections?.[sectionId]?.[field] || '');


    return (
      <div className="admin-card mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h6 className="text-success text-uppercase fw-bold small mb-0">
            <i className="bi bi-stars me-2" /> Custom Case Study · CMS Sections
          </h6>
          <span className="badge bg-success-subtle text-success border">Version 2 · Editable</span>
        </div>
        <div className="alert alert-light border small">
          <strong>{customComponent}</strong> keeps its bespoke diagrams and interactions. These CMS sections add editable content blocks without replacing the custom experience.
        </div>
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Case Study Title</label>
            <input className="form-control form-control-sm" value={customTitle} disabled={disabled}
              onChange={(e) => commitCustom({ title: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Case Study Subtitle</label>
            <input className="form-control form-control-sm" value={customSubtitle} disabled={disabled}
              onChange={(e) => commitCustom({ subtitle: e.target.value })} />
          </div>
        </div>
        <details className="mb-4">
          <summary className="small fw-semibold text-success">Case study metadata translations · FR / AR</summary>
          <div className="row g-3 mt-1">
            {['fr','ar'].map((locale) => (
              <div className="col-md-6" key={locale}>
                <div className="small fw-bold text-uppercase mb-2">{locale}</div>
                <label className="form-label small">Title</label>
                <input className="form-control form-control-sm mb-2" value={caseStudy.translations?.[locale]?.title || ''} disabled={disabled}
                  onChange={(e) => {
                    const translations = { ...(caseStudy.translations || {}), [locale]: { ...(caseStudy.translations?.[locale] || {}), title: e.target.value } };
                    commitCustom({ translations });
                  }} />
                <label className="form-label small">Subtitle / Description</label>
                <textarea className="form-control form-control-sm" rows="2" value={caseStudy.translations?.[locale]?.subtitle || ''} disabled={disabled}
                  onChange={(e) => {
                    const translations = { ...(caseStudy.translations || {}), [locale]: { ...(caseStudy.translations?.[locale] || {}), subtitle: e.target.value } };
                    commitCustom({ translations });
                  }} />
              </div>
            ))}
          </div>
        </details>
        <div className="border rounded p-3 mb-3">
          <div className="small fw-semibold mb-1">Native section order & visibility</div>
          <p className="text-muted small mb-2">Reorder the original case-study sections or hide a section without removing its content.</p>
          {nativeSectionOrder.map((sectionId, index) => {
            const group = nativeFieldGroups.find((item) => item.id === sectionId);
            const isVisible = caseStudy.nativeSectionVisibility?.[sectionId] !== false;
            return (
              <div className="d-flex align-items-center gap-2 border rounded px-2 py-2 mb-2" key={sectionId}>
                <div className="d-flex flex-column gap-1">
                  <button type="button" className="btn btn-sm btn-light py-0" aria-label={`Move ${group?.label || sectionId} up`}
                    disabled={disabled || index === 0} onClick={() => moveNativeSection(index, -1)}>↑</button>
                  <button type="button" className="btn btn-sm btn-light py-0" aria-label={`Move ${group?.label || sectionId} down`}
                    disabled={disabled || index === nativeSectionOrder.length - 1} onClick={() => moveNativeSection(index, 1)}>↓</button>
                </div>
                <div className="flex-grow-1 small">{group?.label || sectionId}</div>
                <label className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={isVisible} disabled={disabled}
                    onChange={(e) => setNativeSectionVisibility(sectionId, e.target.checked)} />
                  <span className="form-check-label small">{isVisible ? 'Visible' : 'Hidden'}</span>
                </label>
              </div>
            );
          })}
        </div>
        <details className="mb-4 border rounded p-3">
          <summary className="small fw-semibold text-success">Native section content · EN / FR / AR</summary>
          <p className="text-muted small mt-2 mb-3">Edit the original section headings and copy while keeping its existing visual layout, diagrams and interactions.</p>
          {nativeFieldGroups.map((group) => (
            <details className="border rounded p-3 mb-3" key={group.id}>
              <summary className="small fw-bold">{group.label}</summary>
              <div className="row g-3 mt-1">
                {nativeLocales.map((locale) => (
                  <div className="col-lg-4" key={locale}>
                    <div className="small fw-bold text-uppercase mb-2">{locale}</div>
                    {group.fields.map((field) => (
                      <div className="mb-2" key={field}>
                        <label className="form-label small text-muted mb-1">{field}</label>
                        {field.endsWith('Json') ? (
                          <>
                            <textarea className="form-control form-control-sm font-monospace" rows="7"
                              value={nativeFieldValue(group.id, field, locale)} disabled={disabled}
                              onChange={(e) => updateNativeField(group.id, field, locale, e.target.value)}
                              placeholder={field === 'screensJson' ? '[{"step":"01 — SCAN","label":"Recognized"}]' : field === 'matrixRowsJson' ? '[{"num":"01 · Identification","physical":"Physical detail","digital":"Digital detail"}]' : field === 'stepsJson' ? '[{"num":"01","title":"Step title","desc":"Step description"}]' : '["First item","Second item"]'} />
                            <div className="form-text">JSON array. Invalid JSON falls back to the built-in content until corrected.</div>
                          </>
                        ) : ['lead','paragraph1','paragraph2','context'].includes(field) ? (
                          <textarea className="form-control form-control-sm" rows="3"
                            value={nativeFieldValue(group.id, field, locale)} disabled={disabled}
                            onChange={(e) => updateNativeField(group.id, field, locale, e.target.value)} />
                        ) : (
                          <input className="form-control form-control-sm"
                            value={nativeFieldValue(group.id, field, locale)} disabled={disabled}
                            onChange={(e) => updateNativeField(group.id, field, locale, e.target.value)}
                            placeholder={field.toLowerCase().includes('image') ? 'Asset registry path or image URL' : 'Leave empty to keep the built-in content'} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </details>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div><strong className="small">Editable sections</strong><div className="text-muted" style={{fontSize:'0.72rem'}}>Add, reorder, hide and localize text or image sections.</div></div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-success" disabled={disabled} onClick={() => addSection('text')}><i className="bi bi-plus-lg me-1" /> Text</button>
            <button type="button" className="btn btn-sm btn-outline-success" disabled={disabled} onClick={() => addSection('image')}><i className="bi bi-image me-1" /> Image</button>
          </div>
        </div>
        {sections.length === 0 && <div className="text-muted small border rounded p-3">No custom CMS sections yet. The original bespoke case study remains unchanged.</div>}
        {sections.map((section, index) => (
          <div className="border rounded p-3 mb-3" key={section.id || index}>
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-dark">{String(index + 1).padStart(2, '0')}</span>
                <strong className="small text-uppercase">{section.type || 'text'} section</strong>
                {section.is_visible === false && <span className="badge bg-secondary">Hidden</span>}
              </div>
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-sm btn-light" title="Move up" disabled={disabled || index===0} onClick={() => moveSection(index,-1)}><i className="bi bi-chevron-up" /></button>
                <button type="button" className="btn btn-sm btn-light" title="Move down" disabled={disabled || index===sections.length-1} onClick={() => moveSection(index,1)}><i className="bi bi-chevron-down" /></button>
                <button type="button" className="btn btn-sm btn-light" title="Toggle visibility" disabled={disabled} onClick={() => updateSection(index,{is_visible:section.is_visible===false})}><i className={`bi bi-${section.is_visible===false?'eye-slash':'eye'}`} /></button>
                <button type="button" className="btn btn-sm btn-outline-danger" title="Delete section" disabled={disabled} onClick={() => removeSection(index)}><i className="bi bi-trash" /></button>
              </div>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label small">Section type</label>
                <select className="form-select form-select-sm" value={section.type || 'text'} disabled={disabled} onChange={(e) => updateSection(index,{type:e.target.value})}>
                  <option value="text">Text</option><option value="image">Image</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">Image layout</label>
                <select className="form-select form-select-sm" value={section.layout || 'wide'} disabled={disabled || section.type!=='image'} onChange={(e) => updateSection(index,{layout:e.target.value})}>
                  <option value="wide">Wide / contained</option><option value="feature">Feature</option><option value="split">Split</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">Default language</label>
                <span className="form-control form-control-sm bg-light">English (EN)</span>
              </div>
            </div>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">Title · EN</label>
                <input className="form-control form-control-sm" value={section.title || ''} disabled={disabled} onChange={(e)=>updateSection(index,{title:e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Body · EN</label>
                <textarea className="form-control form-control-sm" rows="3" value={section.body || ''} disabled={disabled} onChange={(e)=>updateSection(index,{body:e.target.value})} />
              </div>
              {section.type === 'image' && <>
                <div className="col-12"><label className="form-label small">Image URL / Storage path</label><input className="form-control form-control-sm" value={section.image || ''} disabled={disabled} onChange={(e)=>updateSection(index,{image:e.target.value})} /></div>
                <div className="col-md-6"><label className="form-label small">Alt text · EN</label><input className="form-control form-control-sm" value={section.alt || ''} disabled={disabled} onChange={(e)=>updateSection(index,{alt:e.target.value})} /></div>
                <div className="col-md-6"><label className="form-label small">Caption · EN</label><input className="form-control form-control-sm" value={section.caption || ''} disabled={disabled} onChange={(e)=>updateSection(index,{caption:e.target.value})} /></div>
              </>}
            </div>
            <details className="mt-3">
              <summary className="small fw-semibold text-success">Translations · FR / AR</summary>
              <div className="row g-3 mt-1">
                {locales.filter((locale)=>locale!=='en').map((locale)=>(
                  <div className="col-md-6" key={locale}>
                    <div className="small fw-bold text-uppercase mb-2">{locale}</div>
                    <label className="form-label small">Title</label>
                    <input className="form-control form-control-sm mb-2" value={section.translations?.[locale]?.title || ''} disabled={disabled} onChange={(e)=>updateTranslation(index,locale,'title',e.target.value)} />
                    <label className="form-label small">Body</label>
                    <textarea className="form-control form-control-sm mb-2" rows="3" value={section.translations?.[locale]?.body || ''} disabled={disabled} onChange={(e)=>updateTranslation(index,locale,'body',e.target.value)} />
                    {section.type === 'image' && <>
                      <label className="form-label small">Alt text</label><input className="form-control form-control-sm mb-2" value={section.translations?.[locale]?.alt || ''} disabled={disabled} onChange={(e)=>updateTranslation(index,locale,'alt',e.target.value)} />
                      <label className="form-label small">Caption</label><input className="form-control form-control-sm" value={section.translations?.[locale]?.caption || ''} disabled={disabled} onChange={(e)=>updateTranslation(index,locale,'caption',e.target.value)} />
                    </>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    );
  }

  // ── Standard Case Study Sub-Section Editors ────────────────────────────────
  const hero = caseStudy.hero || {};
  const challenge = caseStudy.challenge || {};
  const contribution = caseStudy.contribution || {};
  const evidence = caseStudy.evidence || {};
  const technology = caseStudy.technology || {};

  // Handlers for updating nested sections
  const updateSection = (sectionKey, fieldKey, value) => {
    const updated = clone(caseStudy);
    updated.version = 1;
    updated.type = 'standard';
    if (!updated[sectionKey]) updated[sectionKey] = {};
    updated[sectionKey][fieldKey] = value;
    onChange(updated);
  };

  // Meta chips handlers
  const handleAddMetaChip = (e) => {
    e?.preventDefault();
    const trimmed = newMetaChip.trim();
    if (!trimmed) return;
    const updated = clone(caseStudy);
    const chips = Array.isArray(updated.hero?.metaChips) ? [...updated.hero.metaChips] : [];
    if (!chips.includes(trimmed)) {
      chips.push(trimmed);
      if (!updated.hero) updated.hero = {};
      updated.hero.metaChips = chips;
      onChange(updated);
    }
    setNewMetaChip('');
  };

  const handleRemoveMetaChip = (index) => {
    const updated = clone(caseStudy);
    const chips = Array.isArray(updated.hero?.metaChips) ? [...updated.hero.metaChips] : [];
    chips.splice(index, 1);
    if (!updated.hero) updated.hero = {};
    updated.hero.metaChips = chips;
    onChange(updated);
  };

  // Contribution items handlers
  const handleAddItem = () => {
    const updated = clone(caseStudy);
    const items = Array.isArray(updated.contribution?.items) ? [...updated.contribution.items] : [];
    items.push('');
    if (!updated.contribution) updated.contribution = {};
    updated.contribution.items = items;
    onChange(updated);
  };

  const handleUpdateItem = (index, value) => {
    const updated = clone(caseStudy);
    const items = Array.isArray(updated.contribution?.items) ? [...updated.contribution.items] : [];
    items[index] = value;
    if (!updated.contribution) updated.contribution = {};
    updated.contribution.items = items;
    onChange(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = clone(caseStudy);
    const items = Array.isArray(updated.contribution?.items) ? [...updated.contribution.items] : [];
    items.splice(index, 1);
    if (!updated.contribution) updated.contribution = {};
    updated.contribution.items = items;
    onChange(updated);
  };

  const handleDuplicateItem = (index) => {
    const updated = clone(caseStudy);
    const items = Array.isArray(updated.contribution?.items) ? [...updated.contribution.items] : [];
    if (items[index] !== undefined) {
      items.splice(index + 1, 0, `${items[index]} (Copy)`);
      if (!updated.contribution) updated.contribution = {};
      updated.contribution.items = items;
      onChange(updated);
    }
  };

  const handleMoveItem = (index, direction) => {
    const updated = clone(caseStudy);
    const items = Array.isArray(updated.contribution?.items) ? [...updated.contribution.items] : [];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    if (!updated.contribution) updated.contribution = {};
    updated.contribution.items = items;
    onChange(updated);
  };

  // Optional process stages use stable IDs so translations survive reordering.
  const commitProcessStages = (process) => {
    const updated = clone(caseStudy);
    if (!updated.contribution) updated.contribution = {};
    updated.contribution.process = process;
    onChange(updated);
  };

  const handleAddStep = (stageType = newStageType) => {
    const process = normalizeProcessStages(contribution.process);
    process.push(createFdeStage(stageType, process.length));
    commitProcessStages(process);
  };

  const handleDuplicateStep = (index) => {
    const process = normalizeProcessStages(contribution.process);
    if (!process[index]) return;
    const duplicated = {
      ...process[index],
      id: createStageId(process[index].stageType || 'custom'),
      step: String(process.length + 1).padStart(2, '0'),
      title: process[index].title ? `${process[index].title} (Copy)` : '',
      media: (process[index].media || []).map((item) => ({ ...item, id: createStageId('media') })),
      links: (process[index].links || []).map((item) => ({ ...item, id: createStageId('link') })),
    };
    process.splice(index + 1, 0, duplicated);
    commitProcessStages(process);
  };

  const handleMoveStep = (index, direction) => {
    const process = normalizeProcessStages(contribution.process);
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= process.length) return;
    [process[index], process[targetIdx]] = [process[targetIdx], process[index]];
    process.forEach((stage, idx) => { stage.step = String(idx + 1).padStart(2, '0'); });
    commitProcessStages(process);
  };

  const handleUpdateStep = (index, field, value) => {
    const process = normalizeProcessStages(contribution.process);
    if (!process[index]) return;
    process[index] = { ...process[index], [field]: value };
    commitProcessStages(process);
  };

  const handleRemoveStep = (index) => {
    const process = normalizeProcessStages(contribution.process);
    process.splice(index, 1);
    process.forEach((stage, idx) => { stage.step = String(idx + 1).padStart(2, '0'); });
    commitProcessStages(process);
  };

  const handleAddStageItem = (stageIndex, field) => {
    const process = normalizeProcessStages(contribution.process);
    if (!process[stageIndex]) return;
    const items = Array.isArray(process[stageIndex][field]) ? [...process[stageIndex][field]] : [];
    items.push(field === 'media'
      ? { id: createStageId('media'), url: '', alt: '', caption: '' }
      : { id: createStageId('link'), label: '', url: '' });
    process[stageIndex] = { ...process[stageIndex], [field]: items };
    commitProcessStages(process);
  };

  const handleUpdateStageItem = (stageIndex, field, itemIndex, itemField, value) => {
    const process = normalizeProcessStages(contribution.process);
    const items = Array.isArray(process[stageIndex]?.[field]) ? [...process[stageIndex][field]] : [];
    if (!items[itemIndex]) return;
    items[itemIndex] = { ...items[itemIndex], [itemField]: value };
    process[stageIndex] = { ...process[stageIndex], [field]: items };
    commitProcessStages(process);
  };

  const handleRemoveStageItem = (stageIndex, field, itemIndex) => {
    const process = normalizeProcessStages(contribution.process);
    const items = Array.isArray(process[stageIndex]?.[field]) ? [...process[stageIndex][field]] : [];
    items.splice(itemIndex, 1);
    process[stageIndex] = { ...process[stageIndex], [field]: items };
    commitProcessStages(process);
  };

  // Evidence gallery handlers
  const handleAddGalleryItem = () => {
    const updated = clone(caseStudy);
    if (!updated.evidence) updated.evidence = {};
    const gallery = Array.isArray(updated.evidence.gallery) ? [...updated.evidence.gallery] : [];
    gallery.push({ image: '', imageAlt: '', caption: '', is_visible: true });
    updated.evidence.gallery = gallery;
    onChange(updated);
  };

  const handleUpdateGalleryItem = (index, field, value) => {
    const updated = clone(caseStudy);
    if (!updated.evidence) updated.evidence = {};
    const gallery = Array.isArray(updated.evidence.gallery) ? [...updated.evidence.gallery] : [];
    if (gallery[index]) {
      gallery[index] = { ...gallery[index], [field]: value };
      updated.evidence.gallery = gallery;
      onChange(updated);
    }
  };

  const handleRemoveGalleryItem = (index) => {
    const updated = clone(caseStudy);
    if (!updated.evidence) updated.evidence = {};
    const gallery = Array.isArray(updated.evidence.gallery) ? [...updated.evidence.gallery] : [];
    gallery.splice(index, 1);
    updated.evidence.gallery = gallery;
    onChange(updated);
  };

  const handleToggleGalleryItemVisibility = (index) => {
    const updated = clone(caseStudy);
    if (!updated.evidence) updated.evidence = {};
    const gallery = Array.isArray(updated.evidence.gallery) ? [...updated.evidence.gallery] : [];
    if (!gallery[index]) return;
    gallery[index] = { ...gallery[index], is_visible: gallery[index].is_visible === false };
    updated.evidence.gallery = gallery;
    onChange(updated);
  };

  const handleMoveGalleryItem = (index, direction) => {
    const updated = clone(caseStudy);
    if (!updated.evidence) updated.evidence = {};
    const gallery = Array.isArray(updated.evidence.gallery) ? [...updated.evidence.gallery] : [];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= gallery.length) return;
    const temp = gallery[index];
    gallery[index] = gallery[targetIdx];
    gallery[targetIdx] = temp;
    updated.evidence.gallery = gallery;
    onChange(updated);
  };

  // Section visibility toggle
  const handleToggleSectionVisibility = (sectionKey) => {
    const updated = clone(caseStudy);
    if (!updated[sectionKey]) updated[sectionKey] = {};
    const current = updated[sectionKey].is_visible !== false;
    updated[sectionKey].is_visible = !current;
    onChange(updated);
  };

  // Section reordering
  const defaultOrder = ['challenge', 'contribution', 'evidence', 'technology'];
  const currentOrder = Array.isArray(caseStudy.sectionOrder)
    ? [...caseStudy.sectionOrder.filter((k) => k !== 'hero')]
    : [...defaultOrder];

  const handleMoveSection = (sectionKey, direction) => {
    const order = [...currentOrder];
    const index = order.indexOf(sectionKey);
    const targetIdx = index + direction;
    if (index === -1 || targetIdx < 0 || targetIdx >= order.length) return;
    const temp = order[index];
    order[index] = order[targetIdx];
    order[targetIdx] = temp;
    const updated = clone(caseStudy);
    updated.sectionOrder = ['hero', ...order];
    onChange(updated);
  };

  // Technology tags handlers
  const handleAddTechTag = (e) => {
    e?.preventDefault();
    const trimmed = newTechTag.trim();
    if (!trimmed) return;
    const updated = clone(caseStudy);
    const tags = Array.isArray(updated.technology?.tags) ? [...updated.technology.tags] : [];
    if (!tags.includes(trimmed)) {
      tags.push(trimmed);
      if (!updated.technology) updated.technology = {};
      updated.technology.tags = tags;
      onChange(updated);
    }
    setNewTechTag('');
  };

  const handleRemoveTechTag = (index) => {
    const updated = clone(caseStudy);
    const tags = Array.isArray(updated.technology?.tags) ? [...updated.technology.tags] : [];
    tags.splice(index, 1);
    if (!updated.technology) updated.technology = {};
    updated.technology.tags = tags;
    onChange(updated);
  };

  // Resolved asset previews
  const resolvedHeroImage = hero.image?.trim() ? resolveAsset(hero.image.trim()) : null;
  const resolvedEvidenceImage = evidence.image?.trim() ? resolveAsset(evidence.image.trim()) : null;

  // Validation checks for header badges
  const heroValid = Boolean(hero.title?.trim() && hero.lead?.trim());
  const challengeValid = Boolean(challenge.title?.trim());
  const contributionValid = Array.isArray(contribution.items) && contribution.items.length > 0;
  const evidenceValid = Boolean(evidence.image?.trim() || evidence.title?.trim());
  const techValid = Array.isArray(technology.tags) && technology.tags.length > 0;

  // Advisory checks (image-has-no-alt)
  const heroImgNeedsAlt = Boolean(hero.image?.trim() && !hero.imageAlt?.trim());
  const evidenceImgNeedsAlt = Boolean(evidence.image?.trim() && !evidence.imageAlt?.trim());

  return (
    <div className="admin-card mb-4">
      {/* Editor Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-3 border-bottom">
        <div>
          <h6
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#087f66',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="bi bi-file-earmark-richtext text-success" />
            Case Study Content
          </h6>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
            Authoritative body content published at <code>/work/{slug}</code>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.68rem' }}>
            Version 1 · Standard
          </span>
          <span
            className={`badge px-2 py-1 border ${heroValid && challengeValid ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning border-warning-subtle'}`}
            style={{ fontSize: '0.68rem' }}
          >
            {heroValid && challengeValid ? '✓ Ready' : '⚠ Required fields missing'}
          </span>
        </div>
      </div>

      {/* Section Status Quick Bar & Quick Jump Navigation */}
      <div className="d-flex gap-2 mb-4 flex-wrap align-items-center" style={{ fontSize: '0.72rem' }}>
        <span className="text-muted fw-semibold small me-1">Jump to:</span>
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 border rounded-pill ${heroValid ? 'btn-outline-success' : 'btn-outline-danger'}`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => document.getElementById('cs-section-hero')?.scrollIntoView({ behavior: 'smooth' })}
          title="Scroll to Hero Section"
        >
          {heroValid ? '✓' : '✕'} Hero
          {heroValid && heroImgNeedsAlt && <span className="ms-1" style={{ opacity: 0.8 }}>⚠alt</span>}
        </button>
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 border rounded-pill ${challengeValid ? 'btn-outline-success' : 'btn-outline-danger'}`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => document.getElementById('cs-section-challenge')?.scrollIntoView({ behavior: 'smooth' })}
          title="Scroll to Challenge Section"
        >
          {challengeValid ? '✓' : '✕'} Challenge
        </button>
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 border rounded-pill ${contributionValid ? 'btn-outline-success' : 'btn-outline-warning'}`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => document.getElementById('cs-section-contribution')?.scrollIntoView({ behavior: 'smooth' })}
          title="Scroll to Contribution Section"
        >
          {contributionValid ? '✓' : '⚠'} Contribution
        </button>
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 border rounded-pill ${evidenceValid ? (evidenceImgNeedsAlt ? 'btn-outline-warning' : 'btn-outline-success') : 'btn-outline-warning'}`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => document.getElementById('cs-section-evidence')?.scrollIntoView({ behavior: 'smooth' })}
          title="Scroll to Evidence Section"
        >
          {evidenceValid ? (evidenceImgNeedsAlt ? '⚠' : '✓') : '⚠'} Evidence
          {evidenceImgNeedsAlt && <span className="ms-1" style={{ opacity: 0.8 }}>alt missing</span>}
        </button>
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 border rounded-pill ${techValid ? 'btn-outline-success' : 'btn-outline-warning'}`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => document.getElementById('cs-section-technology')?.scrollIntoView({ behavior: 'smooth' })}
          title="Scroll to Technology Section"
        >
          {techValid ? '✓' : '⚠'} Technology
        </button>
      </div>

      {/* ── 1. HERO SUBSECTION ────────────────────────────────────────────── */}
      <div id="cs-section-hero" className={`mb-4 pb-4 border-bottom ${hero.is_visible === false ? 'opacity-50' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold small text-uppercase text-dark" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
              <i className="bi bi-layout-text-window me-1 text-primary" /> 1. Hero Section
            </div>
            {hero.is_visible === false && (
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.65rem' }}>
                Hidden from Public Page
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {heroValid ? (
              <span className="text-success small" style={{ fontSize: '0.7rem' }}>✓ Complete</span>
            ) : (
              <span className="text-danger small" style={{ fontSize: '0.7rem' }}>✕ Title & Lead required</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 ms-1"
              title={hero.is_visible === false ? 'Show Section' : 'Hide Section'}
              onClick={() => handleToggleSectionVisibility('hero')}
              disabled={disabled}
            >
              <i className={`bi bi-${hero.is_visible === false ? 'eye-slash' : 'eye'}`} />
            </button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Hero Eyebrow
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={hero.eyebrow || ''}
              onChange={(e) => updateSection('hero', 'eyebrow', e.target.value)}
              placeholder="e.g. AI AGENT · N8N · RAG"
              disabled={disabled}
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Hero Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control form-control-sm ${isPublishedAndPublic && !hero.title?.trim() ? 'is-invalid' : ''}`}
              value={hero.title || ''}
              onChange={(e) => updateSection('hero', 'title', e.target.value)}
              placeholder="Case study display title"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Hero Lead Text <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control form-control-sm ${isPublishedAndPublic && !hero.lead?.trim() ? 'is-invalid' : ''}`}
            rows="2"
            value={hero.lead || ''}
            onChange={(e) => updateSection('hero', 'lead', e.target.value)}
            placeholder="Executive summary of the case study…"
            disabled={disabled}
          />
        </div>

        <div className="mt-3">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Live Product URL
          </label>
          <input
            type="url"
            className="form-control form-control-sm"
            value={hero.liveProductUrl || ''}
            onChange={(e) => updateSection('hero', 'liveProductUrl', e.target.value)}
            placeholder="https://mhaf.naiimbsili.com/"
            disabled={disabled}
          />
          <div className="form-text text-muted" style={{ fontSize: '0.7rem' }}>
            Shown as the case-study product link; external links open in a new tab.
          </div>
        </div>

        {/* Meta Chips */}
        <div className="mt-3">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Meta Chips (Context Pills)
          </label>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {(hero.metaChips || []).map((chip, idx) => (
              <span
                key={idx}
                className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem' }}
              >
                {chip}
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  style={{ fontSize: '0.55rem' }}
                  onClick={() => handleRemoveMetaChip(idx)}
                  disabled={disabled}
                  title="Remove chip"
                />
              </span>
            ))}
            {(!hero.metaChips || hero.metaChips.length === 0) && (
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>No meta chips added yet.</span>
            )}
          </div>
          <div className="input-group input-group-sm" style={{ maxWidth: '380px' }}>
            <input
              type="text"
              className="form-control"
              value={newMetaChip}
              onChange={(e) => setNewMetaChip(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMetaChip(); } }}
              placeholder="e.g. Lead Designer · 2026"
              disabled={disabled}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleAddMetaChip}
              disabled={disabled || !newMetaChip.trim()}
            >
              <i className="bi bi-plus-lg me-1" /> Add Chip
            </button>
          </div>
        </div>

        {/* Hero Image & Live Preview */}
        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Hero Image Reference
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={hero.image || ''}
              onChange={(e) => {
                updateSection('hero', 'image', e.target.value);
                setHeroImgError(false);
              }}
              placeholder="e.g. cover-copilot-naim.png"
              disabled={disabled}
            />
            <div className="form-text text-muted" style={{ fontSize: '0.7rem' }}>
              Bundled asset filename or external https:// image URL.
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Hero Image Alt Text
            </label>
            <input
              type="text"
              className={`form-control form-control-sm ${heroImgNeedsAlt ? 'border-warning' : ''}`}
              value={hero.imageAlt || ''}
              onChange={(e) => updateSection('hero', 'imageAlt', e.target.value)}
              placeholder="Accessibility description of hero image"
              disabled={disabled}
            />
            {heroImgNeedsAlt && (
              <div className="form-text" style={{ fontSize: '0.7rem', color: '#b45309' }}>
                <i className="bi bi-exclamation-triangle me-1" />Image set but alt text is missing (advisory).
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Hero Image Caption (Optional)
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={hero.caption || ''}
            onChange={(e) => updateSection('hero', 'caption', e.target.value)}
            placeholder="e.g. Selected project evidence from production."
            disabled={disabled}
          />
        </div>

        {/* Live Hero Image Preview */}
        <div className="mt-3 p-2 rounded border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.66rem', letterSpacing: '0.04em' }}>
            Hero Image Preview
          </div>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '140px',
                height: '80px',
                borderRadius: '6px',
                background: '#0c1a1e',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #cbd5e1',
                flexShrink: 0,
              }}
            >
              {resolvedHeroImage && !heroImgError ? (
                <img
                  src={resolvedHeroImage}
                  alt="Hero Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setHeroImgError(true)}
                />
              ) : (
                <span className="text-muted text-center px-1" style={{ fontSize: '0.62rem' }}>
                  <i className="bi bi-image d-block fs-5 text-secondary mb-1" />
                  No Image
                </span>
              )}
            </div>
            <div className="small text-muted" style={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
              {resolvedHeroImage && !heroImgError ? (
                <div>
                  <span className="text-success fw-bold">✓ Asset resolved:</span>{' '}
                  <code style={{ fontSize: '0.7rem' }}>{hero.image}</code>
                </div>
              ) : hero.image ? (
                <div className="text-secondary">
                  No image preview available for <code>{hero.image}</code>.<br />
                  Asset reference will be stored as entered.
                </div>
              ) : (
                <div className="text-muted">No hero image reference specified.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CHALLENGE SUBSECTION ──────────────────────────────────────── */}
      <div id="cs-section-challenge" className={`mb-4 pb-4 border-bottom ${challenge.is_visible === false ? 'opacity-50' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold small text-uppercase text-dark" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
              <i className="bi bi-lightning-charge me-1 text-primary" /> Challenge Section
            </div>
            {challenge.is_visible === false && (
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.65rem' }}>
                Hidden from Public Page
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {challengeValid ? (
              <span className="text-success small" style={{ fontSize: '0.7rem' }}>✓ Complete</span>
            ) : (
              <span className="text-danger small" style={{ fontSize: '0.7rem' }}>✕ Title required</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0 ms-1"
              title="Move Section Up"
              disabled={disabled || currentOrder.indexOf('challenge') <= 0}
              onClick={() => handleMoveSection('challenge', -1)}
            >
              <i className="bi bi-chevron-up" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0"
              title="Move Section Down"
              disabled={disabled || currentOrder.indexOf('challenge') >= currentOrder.length - 1}
              onClick={() => handleMoveSection('challenge', 1)}
            >
              <i className="bi bi-chevron-down" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 ms-1"
              title={challenge.is_visible === false ? 'Show Section' : 'Hide Section'}
              onClick={() => handleToggleSectionVisibility('challenge')}
              disabled={disabled}
            >
              <i className={`bi bi-${challenge.is_visible === false ? 'eye-slash' : 'eye'}`} />
            </button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Challenge Eyebrow
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={challenge.eyebrow || ''}
              onChange={(e) => updateSection('challenge', 'eyebrow', e.target.value)}
              placeholder="e.g. THE CHALLENGE"
              disabled={disabled}
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Challenge Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control form-control-sm ${isPublishedAndPublic && !challenge.title?.trim() ? 'is-invalid' : ''}`}
              value={challenge.title || ''}
              onChange={(e) => updateSection('challenge', 'title', e.target.value)}
              placeholder="Core problem statement"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Challenge Copy
          </label>
          <textarea
            className="form-control form-control-sm"
            rows="3"
            value={challenge.copy || ''}
            onChange={(e) => updateSection('challenge', 'copy', e.target.value)}
            placeholder="Detailed description of the challenge, constraints, and objectives…"
            disabled={disabled}
          />
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              My Role
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={challenge.role || ''}
              onChange={(e) => updateSection('challenge', 'role', e.target.value)}
              placeholder="e.g. Product Designer · Front-End Integrator"
              disabled={disabled}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Context
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={challenge.context || ''}
              onChange={(e) => updateSection('challenge', 'context', e.target.value)}
              placeholder="e.g. Production launch · Enterprise client"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* ── 3. CONTRIBUTION SUBSECTION ───────────────────────────────────── */}
      <div id="cs-section-contribution" className={`mb-4 pb-4 border-bottom ${contribution.is_visible === false ? 'opacity-50' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold small text-uppercase text-dark" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
              <i className="bi bi-check2-square me-1 text-primary" /> Contribution & Process
            </div>
            {contribution.is_visible === false && (
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.65rem' }}>
                Hidden from Public Page
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {contributionValid ? (
              <span className="text-success small" style={{ fontSize: '0.7rem' }}>✓ Complete</span>
            ) : (
              <span className="text-warning small" style={{ fontSize: '0.7rem' }}>⚠ Recommended items missing</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0 ms-1"
              title="Move Section Up"
              disabled={disabled || currentOrder.indexOf('contribution') <= 0}
              onClick={() => handleMoveSection('contribution', -1)}
            >
              <i className="bi bi-chevron-up" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0"
              title="Move Section Down"
              disabled={disabled || currentOrder.indexOf('contribution') >= currentOrder.length - 1}
              onClick={() => handleMoveSection('contribution', 1)}
            >
              <i className="bi bi-chevron-down" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 ms-1"
              title={contribution.is_visible === false ? 'Show Section' : 'Hide Section'}
              onClick={() => handleToggleSectionVisibility('contribution')}
              disabled={disabled}
            >
              <i className={`bi bi-${contribution.is_visible === false ? 'eye-slash' : 'eye'}`} />
            </button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Contribution Eyebrow
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={contribution.eyebrow || ''}
              onChange={(e) => updateSection('contribution', 'eyebrow', e.target.value)}
              placeholder="e.g. MY CONTRIBUTION"
              disabled={disabled}
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Contribution Title
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={contribution.title || ''}
              onChange={(e) => updateSection('contribution', 'title', e.target.value)}
              placeholder="e.g. From concept to implementation"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Bullet Items */}
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label fw-semibold small text-dark mb-0" style={{ fontSize: '0.8rem' }}>
              Contribution Items (Bullet Points)
            </label>
            <button
              type="button"
              className="btn btn-sm btn-outline-success py-0 px-2"
              style={{ fontSize: '0.72rem' }}
              onClick={handleAddItem}
              disabled={disabled}
            >
              <i className="bi bi-plus-lg me-1" /> Add Item
            </button>
          </div>

          <div className="d-flex flex-column gap-2">
            {(contribution.items || []).map((item, idx) => (
              <div key={idx} className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted small" style={{ width: '36px', justifyContent: 'center' }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  className="form-control"
                  value={item}
                  onChange={(e) => handleUpdateItem(idx, e.target.value)}
                  placeholder="Contribution achievement or deliverable…"
                  disabled={disabled}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={disabled || idx === 0}
                  onClick={() => handleMoveItem(idx, -1)}
                  title="Move Item Up"
                >
                  <i className="bi bi-chevron-up" />
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={disabled || idx === (contribution.items || []).length - 1}
                  onClick={() => handleMoveItem(idx, 1)}
                  title="Move Item Down"
                >
                  <i className="bi bi-chevron-down" />
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleDuplicateItem(idx)}
                  disabled={disabled}
                  title="Duplicate Item"
                >
                  <i className="bi bi-copy" />
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={disabled}
                  title="Remove item"
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            ))}
            {(!contribution.items || contribution.items.length === 0) && (
              <div className="text-muted small p-2 rounded border bg-light" style={{ fontSize: '0.72rem' }}>
                No contribution bullets added yet. Click &quot;Add Item&quot; to add bullets.
              </div>
            )}
          </div>
        </div>

        {/* Optional public integration code example */}
        <div className="mt-4 p-3 rounded border" style={{ background: '#f8fafc', borderColor: '#dbe4e8' }}>
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Public Code Example Title
          </label>
          <input
            type="text"
            className="form-control form-control-sm mb-3"
            value={contribution.codeExample?.title || ''}
            onChange={(e) => updateSection('contribution', 'codeExample', { ...(contribution.codeExample || {}), title: e.target.value })}
            placeholder="e.g. Generic installation snippet"
            disabled={disabled}
          />
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Public Code Example (HTML)
          </label>
          <textarea
            className="form-control form-control-sm font-monospace mb-3"
            rows="7"
            dir="ltr"
            spellCheck="false"
            value={contribution.codeExample?.code || ''}
            onChange={(e) => updateSection('contribution', 'codeExample', { ...(contribution.codeExample || {}), code: e.target.value })}
            placeholder="Paste a safe, generic example. Do not include customer IDs or secrets."
            disabled={disabled}
          />
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Code Example Caption
          </label>
          <textarea
            className="form-control form-control-sm"
            rows="2"
            value={contribution.codeExample?.caption || ''}
            onChange={(e) => updateSection('contribution', 'codeExample', { ...(contribution.codeExample || {}), caption: e.target.value })}
            placeholder="Explain which values are generated and what the placeholder example means."
            disabled={disabled}
          />
          <div className="form-text">Use public placeholders only; never paste a live client Site ID, token, or private endpoint.</div>
        </div>

        {/* Optional FDE methodology stages */}
        <div className="mt-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <label className="form-label fw-semibold small text-dark mb-0" style={{ fontSize: '0.8rem' }}>
              Optional Methodology Stages
            </label>
            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', maxWidth: '260px' }}
                value={newStageType}
                onChange={(e) => setNewStageType(e.target.value)}
                aria-label="Stage type to add"
                disabled={disabled}
              >
                {FDE_STAGE_TYPES.map((stageType) => (
                  <option key={stageType} value={stageType}>{getFdeStageLabel(stageType, 'en')}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary py-0 px-2"
                style={{ fontSize: '0.72rem' }}
                onClick={() => handleAddStep(newStageType)}
                disabled={disabled}
              >
                <i className="bi bi-plus-lg me-1" /> Add Stage
              </button>
            </div>
          </div>
          <div className="form-text mb-2">
            All stages are optional. Add only substantiated material; hidden stages and empty stages do not render publicly. Evidence, technologies, media and links are optional.
          </div>

          <div className="d-flex flex-column gap-3">
            {normalizeProcessStages(contribution.process).map((proc, idx) => (
              <div key={proc.id} className={`p-3 rounded border bg-light ${proc.is_visible === false ? 'opacity-50' : ''}`} style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-secondary-subtle text-secondary border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                      Step {proc.step || idx + 1}
                    </span>
                    <span className="fw-semibold small text-dark">{proc.title || getFdeStageLabel(proc.stageType || 'custom', 'en')}</span>
                    {proc.is_visible === false && <span className="badge bg-warning-subtle text-warning-emphasis border">Hidden</span>}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" disabled={disabled || idx === 0} onClick={() => handleMoveStep(idx, -1)} title="Move stage up" aria-label="Move stage up">
                      <i className="bi bi-chevron-up" />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" disabled={disabled || idx === normalizeProcessStages(contribution.process).length - 1} onClick={() => handleMoveStep(idx, 1)} title="Move stage down" aria-label="Move stage down">
                      <i className="bi bi-chevron-down" />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => handleDuplicateStep(idx)} disabled={disabled} title="Duplicate stage" aria-label="Duplicate stage">
                      <i className="bi bi-copy" />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => handleUpdateStep(idx, 'is_visible', proc.is_visible === false)} disabled={disabled} title={proc.is_visible === false ? 'Show stage publicly' : 'Hide stage publicly'} aria-label={proc.is_visible === false ? 'Show stage publicly' : 'Hide stage publicly'}>
                      <i className={`bi bi-${proc.is_visible === false ? 'eye-slash' : 'eye'}`} />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => handleRemoveStep(idx)} disabled={disabled} title="Remove stage">
                      <i className="bi bi-trash me-1" /> Remove
                    </button>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Stage type</label>
                    <select
                      className="form-select form-select-sm"
                      value={proc.stageType || 'custom'}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const previousLabel = getFdeStageLabel(proc.stageType || 'custom', 'en');
                        const patch = { stageType: nextType };
                        if (!proc.title || proc.title === previousLabel) patch.title = nextType === 'custom' ? '' : getFdeStageLabel(nextType, 'en');
                        const next = normalizeProcessStages(contribution.process);
                        next[idx] = { ...next[idx], ...patch };
                        commitProcessStages(next);
                      }}
                      disabled={disabled}
                    >
                      {FDE_STAGE_TYPES.map((stageType) => <option key={stageType} value={stageType}>{getFdeStageLabel(stageType, 'en')}</option>)}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label small mb-1">Stage title (English source)</label>
                    <input type="text" className="form-control form-control-sm" value={proc.title || ''} onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)} placeholder={getFdeStageLabel(proc.stageType || 'custom', 'en')} disabled={disabled} />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="form-label small mb-1">Stage description (English source)</label>
                  <textarea className="form-control form-control-sm" rows="2" value={proc.desc || ''} onChange={(e) => handleUpdateStep(idx, 'desc', e.target.value)} placeholder="Describe only verified work for this stage." disabled={disabled} />
                </div>

                <div className="row g-2 mt-1">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Public evidence / reference (optional)</label>
                    <textarea className="form-control form-control-sm" rows="2" value={proc.evidence || ''} onChange={(e) => handleUpdateStep(idx, 'evidence', e.target.value)} placeholder="Name a public artifact or evidence note; do not paste private material." disabled={disabled} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Relevant technologies (optional, one per line)</label>
                    <textarea className="form-control form-control-sm" rows="2" value={(proc.technologies || []).join('\n')} onChange={(e) => handleUpdateStep(idx, 'technologies', e.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} placeholder="Only technologies used in this stage" disabled={disabled} />
                  </div>
                </div>

                <div className="mt-3 pt-2 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">Stage media (optional)</span>
                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => handleAddStageItem(idx, 'media')} disabled={disabled}><i className="bi bi-plus-lg me-1" />Add image</button>
                  </div>
                  {(proc.media || []).map((media, mediaIndex) => (
                    <div className="row g-2 align-items-end mb-2" key={media.id || mediaIndex}>
                      <div className="col-md-4"><label className="form-label small mb-1">Image URL / asset</label><input type="text" className="form-control form-control-sm" value={media.url || media.image || ''} onChange={(e) => handleUpdateStageItem(idx, 'media', mediaIndex, 'url', e.target.value)} placeholder="https://… or registered asset" disabled={disabled} /></div>
                      <div className="col-md-3"><label className="form-label small mb-1">Alt text</label><input type="text" className="form-control form-control-sm" value={media.alt || media.imageAlt || ''} onChange={(e) => handleUpdateStageItem(idx, 'media', mediaIndex, 'alt', e.target.value)} placeholder="Describe the image" disabled={disabled} /></div>
                      <div className="col-md-4"><label className="form-label small mb-1">Caption</label><input type="text" className="form-control form-control-sm" value={media.caption || ''} onChange={(e) => handleUpdateStageItem(idx, 'media', mediaIndex, 'caption', e.target.value)} placeholder="Optional caption" disabled={disabled} /></div>
                      <div className="col-md-1"><button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => handleRemoveStageItem(idx, 'media', mediaIndex)} disabled={disabled} aria-label="Remove image"><i className="bi bi-trash" /></button></div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">Stage links (optional)</span>
                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => handleAddStageItem(idx, 'links')} disabled={disabled}><i className="bi bi-plus-lg me-1" />Add link</button>
                  </div>
                  {(proc.links || []).map((link, linkIndex) => (
                    <div className="row g-2 align-items-end mb-2" key={link.id || linkIndex}>
                      <div className="col-md-5"><label className="form-label small mb-1">Link label</label><input type="text" className="form-control form-control-sm" value={link.label || ''} onChange={(e) => handleUpdateStageItem(idx, 'links', linkIndex, 'label', e.target.value)} placeholder="Public resource" disabled={disabled} /></div>
                      <div className="col-md-6"><label className="form-label small mb-1">HTTPS or site-relative URL</label><input type="url" className="form-control form-control-sm" value={link.url || ''} onChange={(e) => handleUpdateStageItem(idx, 'links', linkIndex, 'url', e.target.value)} placeholder="https://…" disabled={disabled} /></div>
                      <div className="col-md-1"><button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => handleRemoveStageItem(idx, 'links', linkIndex)} disabled={disabled} aria-label="Remove link"><i className="bi bi-trash" /></button></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!contribution.process || contribution.process.length === 0) && (
              <div className="text-muted small p-2 rounded border bg-light" style={{ fontSize: '0.72rem' }}>
                No methodology stages are configured. Add only stages supported by the project evidence.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. EVIDENCE SUBSECTION ────────────────────────────────────────── */}
      <div id="cs-section-evidence" className={`mb-4 pb-4 border-bottom ${evidence.is_visible === false ? 'opacity-50' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold small text-uppercase text-dark" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
              <i className="bi bi-image me-1 text-primary" /> 4. Evidence & Artifacts
            </div>
            {evidence.is_visible === false && (
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.65rem' }}>
                Hidden from Public Page
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {evidenceValid ? (
              <span className="text-success small" style={{ fontSize: '0.7rem' }}>✓ Complete</span>
            ) : (
              <span className="text-warning small" style={{ fontSize: '0.7rem' }}>⚠ Image recommended</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0 ms-1"
              title="Move Section Up"
              disabled={disabled || currentOrder.indexOf('evidence') <= 0}
              onClick={() => handleMoveSection('evidence', -1)}
            >
              <i className="bi bi-chevron-up" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0"
              title="Move Section Down"
              disabled={disabled || currentOrder.indexOf('evidence') >= currentOrder.length - 1}
              onClick={() => handleMoveSection('evidence', 1)}
            >
              <i className="bi bi-chevron-down" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 ms-1"
              title={evidence.is_visible === false ? 'Show Section' : 'Hide Section'}
              onClick={() => handleToggleSectionVisibility('evidence')}
              disabled={disabled}
            >
              <i className={`bi bi-${evidence.is_visible === false ? 'eye-slash' : 'eye'}`} />
            </button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Evidence Eyebrow
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={evidence.eyebrow || ''}
              onChange={(e) => updateSection('evidence', 'eyebrow', e.target.value)}
              placeholder="e.g. DELIVERABLES"
              disabled={disabled}
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Evidence Title
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={evidence.title || ''}
              onChange={(e) => updateSection('evidence', 'title', e.target.value)}
              placeholder="e.g. Production artifacts & responsive verification"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Evidence Image Reference
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={evidence.image || ''}
              onChange={(e) => {
                updateSection('evidence', 'image', e.target.value);
                setEvidenceImgError(false);
              }}
              placeholder="e.g. The-work-behind-the-interface.png"
              disabled={disabled}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Evidence Image Alt Text
            </label>
            <input
              type="text"
              className={`form-control form-control-sm ${evidenceImgNeedsAlt ? 'border-warning' : ''}`}
              value={evidence.imageAlt || ''}
              onChange={(e) => updateSection('evidence', 'imageAlt', e.target.value)}
              placeholder="e.g. Production evidence screenshot"
              disabled={disabled}
            />
            {evidenceImgNeedsAlt && (
              <div className="form-text" style={{ fontSize: '0.7rem', color: '#b45309' }}>
                <i className="bi bi-exclamation-triangle me-1" />Image set but alt text is missing (advisory).
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Evidence Caption (Optional)
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={evidence.caption || ''}
            onChange={(e) => updateSection('evidence', 'caption', e.target.value)}
            placeholder="e.g. Verified responsive across mobile, tablet, and desktop."
            disabled={disabled}
          />
        </div>

        {/* Live Evidence Image Preview */}
        <div className="mt-3 p-2 rounded border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.66rem', letterSpacing: '0.04em' }}>
            Evidence Image Preview
          </div>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '140px',
                height: '80px',
                borderRadius: '6px',
                background: '#0c1a1e',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #cbd5e1',
                flexShrink: 0,
              }}
            >
              {resolvedEvidenceImage && !evidenceImgError ? (
                <img
                  src={resolvedEvidenceImage}
                  alt="Evidence Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setEvidenceImgError(true)}
                />
              ) : (
                <span className="text-muted text-center px-1" style={{ fontSize: '0.62rem' }}>
                  <i className="bi bi-image d-block fs-5 text-secondary mb-1" />
                  No Image
                </span>
              )}
            </div>
            <div className="small text-muted" style={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
              {resolvedEvidenceImage && !evidenceImgError ? (
                <div>
                  <span className="text-success fw-bold">✓ Asset resolved:</span>{' '}
                  <code style={{ fontSize: '0.7rem' }}>{evidence.image}</code>
                </div>
              ) : evidence.image ? (
                <div className="text-secondary">
                  No image preview available for <code>{evidence.image}</code>.<br />
                  Asset reference will be stored as entered.
                </div>
              ) : (
                <div className="text-muted">No evidence image reference specified.</div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Evidence Gallery (Additive, Backward-Compatible) */}
        <div className="mt-4 pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <div className="fw-bold small text-dark" style={{ fontSize: '0.78rem' }}>
                Additional Evidence Gallery ({Array.isArray(evidence.gallery) ? evidence.gallery.length : 0})
              </div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                Optional supplementary artifacts and screenshots displayed in a responsive grid.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill"
              style={{ fontSize: '0.72rem' }}
              onClick={handleAddGalleryItem}
              disabled={disabled}
            >
              <i className="bi bi-plus-lg me-1" /> Add Gallery Image
            </button>
          </div>

          {Array.isArray(evidence.gallery) && evidence.gallery.length > 0 ? (
            <div className="d-flex flex-column gap-3 mt-3">
              {evidence.gallery.map((item, gIdx) => {
                const itemResolved = item.image?.trim() ? resolveAsset(item.image.trim()) : null;
                const itemNeedsAlt = Boolean(item.image?.trim() && !item.imageAlt?.trim());

                return (
                  <div key={gIdx} className={`p-3 border rounded bg-white shadow-sm ${item.is_visible === false ? 'opacity-50' : ''}`}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary-subtle text-secondary small" style={{ fontSize: '0.68rem' }}>
                          Gallery Item #{gIdx + 1}
                        </span>
                        {item.is_visible === false && <span className="badge bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '0.65rem' }}>Hidden from public</span>}
                      </span>
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-muted p-0 me-1"
                          disabled={disabled}
                          onClick={() => handleToggleGalleryItemVisibility(gIdx)}
                          title={item.is_visible === false ? 'Show image publicly' : 'Hide image publicly'}
                          aria-label={item.is_visible === false ? 'Show image publicly' : 'Hide image publicly'}
                        >
                          <i className={`bi bi-${item.is_visible === false ? 'eye-slash' : 'eye'}`} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark p-0"
                          disabled={disabled || gIdx === 0}
                          onClick={() => handleMoveGalleryItem(gIdx, -1)}
                          title="Move Item Up"
                        >
                          <i className="bi bi-chevron-up" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark p-0"
                          disabled={disabled || gIdx === evidence.gallery.length - 1}
                          onClick={() => handleMoveGalleryItem(gIdx, 1)}
                          title="Move Item Down"
                        >
                          <i className="bi bi-chevron-down" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 ms-2"
                          disabled={disabled}
                          onClick={() => handleRemoveGalleryItem(gIdx)}
                          title="Remove Gallery Item"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                          Image Asset Reference
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.image || ''}
                          onChange={(e) => handleUpdateGalleryItem(gIdx, 'image', e.target.value)}
                          placeholder="e.g. artifact-detail.png or https://..."
                          disabled={disabled}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                          Image Alt Text <span className="text-secondary">(Accessibility)</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${itemNeedsAlt ? 'border-warning' : ''}`}
                          value={item.imageAlt || ''}
                          onChange={(e) => handleUpdateGalleryItem(gIdx, 'imageAlt', e.target.value)}
                          placeholder="Descriptive alt text..."
                          disabled={disabled}
                        />
                        {itemNeedsAlt && (
                          <div className="form-text" style={{ fontSize: '0.68rem', color: '#b45309' }}>
                            <i className="bi bi-exclamation-triangle me-1" /> Alt text is missing (advisory).
                          </div>
                        )}
                      </div>
                      <div className="col-12 mt-1">
                        <label className="form-label small text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                          Caption (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.caption || ''}
                          onChange={(e) => handleUpdateGalleryItem(gIdx, 'caption', e.target.value)}
                          placeholder="Artifact caption..."
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    {itemResolved && (
                      <div className="mt-2 d-flex align-items-center gap-2 small text-muted" style={{ fontSize: '0.7rem' }}>
                        <img
                          src={itemResolved}
                          alt="Thumbnail"
                          style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <span>✓ Resolved asset: <code>{item.image}</code></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted small p-2 rounded border bg-light mt-2" style={{ fontSize: '0.72rem' }}>
              No additional gallery images added. The main evidence image above will be rendered alone.
            </div>
          )}
        </div>
      </div>

      {/* ── 5. TECHNOLOGY SUBSECTION ──────────────────────────────────────── */}
      <div id="cs-section-technology" className={`${technology.is_visible === false ? 'opacity-50' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold small text-uppercase text-dark" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
              <i className="bi bi-cpu me-1 text-primary" /> 5. Technology Stack
            </div>
            {technology.is_visible === false && (
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.65rem' }}>
                Hidden from Public Page
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {techValid ? (
              <span className="text-success small" style={{ fontSize: '0.7rem' }}>✓ Complete</span>
            ) : (
              <span className="text-warning small" style={{ fontSize: '0.7rem' }}>⚠ Tags recommended</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0 ms-1"
              title="Move Section Up"
              disabled={disabled || currentOrder.indexOf('technology') <= 0}
              onClick={() => handleMoveSection('technology', -1)}
            >
              <i className="bi bi-chevron-up" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-dark p-0"
              title="Move Section Down"
              disabled={disabled || currentOrder.indexOf('technology') >= currentOrder.length - 1}
              onClick={() => handleMoveSection('technology', 1)}
            >
              <i className="bi bi-chevron-down" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 ms-1"
              title={technology.is_visible === false ? 'Show Section' : 'Hide Section'}
              onClick={() => handleToggleSectionVisibility('technology')}
              disabled={disabled}
            >
              <i className={`bi bi-${technology.is_visible === false ? 'eye-slash' : 'eye'}`} />
            </button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Technology Eyebrow
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={technology.eyebrow || ''}
              onChange={(e) => updateSection('technology', 'eyebrow', e.target.value)}
              placeholder="e.g. TOOLING & STACK"
              disabled={disabled}
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
              Technology Title (Optional)
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={technology.title || ''}
              onChange={(e) => updateSection('technology', 'title', e.target.value)}
              placeholder="e.g. Technologies leveraged in this project"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
            Technology Tags
          </label>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {(technology.tags || []).map((tag, idx) => (
              <span
                key={idx}
                className="badge bg-secondary-subtle text-dark border px-2 py-1 d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem' }}
              >
                {tag}
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  style={{ fontSize: '0.55rem' }}
                  onClick={() => handleRemoveTechTag(idx)}
                  disabled={disabled}
                  title="Remove tag"
                />
              </span>
            ))}
            {(!technology.tags || technology.tags.length === 0) && (
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>No technology tags added yet.</span>
            )}
          </div>
          <div className="input-group input-group-sm" style={{ maxWidth: '380px' }}>
            <input
              type="text"
              className="form-control"
              value={newTechTag}
              onChange={(e) => setNewTechTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTechTag(); } }}
              placeholder="e.g. Next.js, TypeScript, Tailwind"
              disabled={disabled}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleAddTechTag}
              disabled={disabled || !newTechTag.trim()}
            >
              <i className="bi bi-plus-lg me-1" /> Add Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
