import React, { useState } from 'react';
import HeroSectionEditor from './HeroSectionEditor';
import HomeHeroSectionEditor from './HomeHeroSectionEditor';
import RichTextSectionEditor from './RichTextSectionEditor';
import ProjectGridSectionEditor from './ProjectGridSectionEditor';
import AgentGridSectionEditor from './AgentGridSectionEditor';
import CtaSectionEditor from './CtaSectionEditor';
import StoryTimelineSectionEditor from './StoryTimelineSectionEditor';
import MediaUploadField from '../MediaUploadField';
import LayoutInspector from './LayoutInspector';
import StyleInspector from './StyleInspector';
import { normalizeSectionConfig, validateSection } from '../../../../components/cms/sectionSchemas';

export default function SectionPropertyEditor({ section, onChange, onSave, onCancel, dirty }) {
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'layout' | 'style' | 'advanced'
  const [selectedColIndex, setSelectedColIndex] = useState(0);
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
  const validation = validateSection(type, config);

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
      case 'home_hero':
        return <HomeHeroSectionEditor config={config} onChange={handleConfigChange} />;
      case 'work_catalog':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Work Catalog Heading</h6>
            <div className="mb-2">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow || ''}
                placeholder="SELECTED WORK"
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title || ''}
                placeholder="Products, systems & digital experiences"
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-1">
              <label className="form-label small fw-semibold">Intro</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="2"
                value={config.intro || ''}
                placeholder="From startup products and AI systems to…"
                onChange={(e) => handleConfigChange({ ...config, intro: e.target.value })}
              />
            </div>
            <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
              <i className="bi bi-info-circle me-1" /> The case-study cards below the heading are managed in the Content Registry.
            </div>
          </div>
        );
      case 'rich_text':
      case 'text':
        return <RichTextSectionEditor config={config} onChange={handleConfigChange} />;
      case 'project_grid':
        return <ProjectGridSectionEditor config={config} onChange={handleConfigChange} />;
      case 'agent_grid':
        return <AgentGridSectionEditor config={config} onChange={handleConfigChange} />;
      case 'cta':
        return <CtaSectionEditor config={config} onChange={handleConfigChange} />;

      case 'image':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Image Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Image Source</label>
              <MediaUploadField
                value={config.src || config.imageUrl || ''}
                folder="blog"
                placeholder="https://… or upload an image"
                onChange={(url) => handleConfigChange({ ...config, src: url, imageUrl: url })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Image Alt Text <span className="text-muted">(Accessibility)</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="Descriptive alt text for screen readers..."
                value={config.alt || ''}
                onChange={(e) => handleConfigChange({ ...config, alt: e.target.value })}
              />
              {(config.src || config.imageUrl) && !config.alt?.trim() && (
                <div className="small text-warning mt-1" style={{ fontSize: '0.72rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-1" /> Missing alt text hurts accessibility and SEO.
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Caption (Optional)</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="Figure caption..."
                value={config.caption || ''}
                onChange={(e) => handleConfigChange({ ...config, caption: e.target.value })}
              />
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Quote Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Quote Body</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                placeholder="Enter memorable quote or testimonial..."
                value={config.quote || ''}
                onChange={(e) => handleConfigChange({ ...config, quote: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Author</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="e.g. Dieter Rams"
                value={config.author || ''}
                onChange={(e) => handleConfigChange({ ...config, author: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Role / Organization</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="e.g. Industrial Designer"
                value={config.role || ''}
                onChange={(e) => handleConfigChange({ ...config, role: e.target.value })}
              />
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Spacer Settings</h6>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold mb-0">Height</label>
                <span className="badge bg-secondary">{config.height || 40}px</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="10"
                max="200"
                step="5"
                value={config.height || 40}
                onChange={(e) => handleConfigChange({ ...config, height: Number(e.target.value) })}
              />
            </div>
          </div>
        );

      case 'metrics': {
        const metricsList = Array.isArray(config.metrics) ? config.metrics : [];
        const handleAddMetric = () => {
          handleConfigChange({
            ...config,
            metrics: [...metricsList, { value: '100%', label: 'Metric Label' }],
          });
        };
        const handleUpdateMetric = (index, field, val) => {
          const updated = [...metricsList];
          updated[index] = { ...updated[index], [field]: val };
          handleConfigChange({ ...config, metrics: updated });
        };
        const handleRemoveMetric = (index) => {
          const updated = metricsList.filter((_, i) => i !== index);
          handleConfigChange({ ...config, metrics: updated });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Metrics Properties</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddMetric}>
                <i className="bi bi-plus-lg me-1" /> Add Metric
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {metricsList.map((m, idx) => (
                <div key={idx} className="p-2 border rounded-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary-subtle text-secondary small">Metric {idx + 1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => handleRemoveMetric(idx)}
                      title="Remove Metric"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Value</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={m.value || ''}
                        onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                        placeholder="e.g. +140%"
                      />
                    </div>
                    <div className="col-8">
                      <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Label</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={m.label || ''}
                        onChange={(e) => handleUpdateMetric(idx, 'label', e.target.value)}
                        placeholder="e.g. Engagement"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {metricsList.length === 0 && (
                <div className="text-muted small p-2 bg-white rounded border text-center">
                  No metrics added yet. Click &quot;Add Metric&quot; above.
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'story_timeline':
        return <StoryTimelineSectionEditor config={config} onChange={handleConfigChange} />;

      case 'timeline': {
        const items = Array.isArray(config.items) ? config.items : [];
        const handleAddItem = () => {
          handleConfigChange({
            ...config,
            items: [...items, { year: '2026', title: 'New Milestone', description: '' }],
          });
        };
        const handleUpdateItem = (index, field, val) => {
          const updated = [...items];
          updated[index] = { ...updated[index], [field]: val };
          handleConfigChange({ ...config, items: updated });
        };
        const handleMoveItem = (index, dir) => {
          const target = index + dir;
          if (target < 0 || target >= items.length) return;
          const updated = [...items];
          const temp = updated[index];
          updated[index] = updated[target];
          updated[target] = temp;
          handleConfigChange({ ...config, items: updated });
        };
        const handleRemoveItem = (index) => {
          handleConfigChange({ ...config, items: items.filter((_, i) => i !== index) });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Timeline Properties</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddItem}>
                <i className="bi bi-plus-lg me-1" /> Add Milestone
              </button>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Section Heading</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
                placeholder="e.g. Career Milestones"
              />
            </div>
            <div className="d-flex flex-column gap-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-2 border rounded-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-primary-subtle text-primary small">#{idx + 1}</span>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-dark p-0"
                        disabled={idx === 0}
                        onClick={() => handleMoveItem(idx, -1)}
                        title="Move Up"
                      >
                        <i className="bi bi-chevron-up" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-dark p-0"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMoveItem(idx, 1)}
                        title="Move Down"
                      >
                        <i className="bi bi-chevron-down" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 ms-1"
                        onClick={() => handleRemoveItem(idx)}
                        title="Remove Milestone"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.year || ''}
                        onChange={(e) => handleUpdateItem(idx, 'year', e.target.value)}
                        placeholder="Year / Tag"
                      />
                    </div>
                    <div className="col-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.title || ''}
                        onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                        placeholder="Milestone Title"
                      />
                    </div>
                  </div>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={item.description || ''}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    placeholder="Milestone description…"
                  />
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-muted small p-2 bg-white rounded border text-center">
                  No timeline milestones added. Click &quot;Add Milestone&quot; above.
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'workflow': {
        const steps = Array.isArray(config.steps) ? config.steps : [];
        const handleAddStep = () => {
          handleConfigChange({
            ...config,
            steps: [...steps, { title: 'New Process Step', description: '' }],
          });
        };
        const handleUpdateStep = (index, field, val) => {
          const updated = [...steps];
          updated[index] = { ...updated[index], [field]: val };
          handleConfigChange({ ...config, steps: updated });
        };
        const handleMoveStep = (index, dir) => {
          const target = index + dir;
          if (target < 0 || target >= steps.length) return;
          const updated = [...steps];
          const temp = updated[index];
          updated[index] = updated[target];
          updated[target] = temp;
          handleConfigChange({ ...config, steps: updated });
        };
        const handleRemoveStep = (index) => {
          handleConfigChange({ ...config, steps: steps.filter((_, i) => i !== index) });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Workflow Properties</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddStep}>
                <i className="bi bi-plus-lg me-1" /> Add Step
              </button>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Section Heading</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
                placeholder="e.g. Process Framework"
              />
            </div>
            <div className="d-flex flex-column gap-2">
              {steps.map((step, idx) => (
                <div key={idx} className="p-2 border rounded-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-secondary-subtle text-secondary small">Step {idx + 1}</span>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-dark p-0"
                        disabled={idx === 0}
                        onClick={() => handleMoveStep(idx, -1)}
                        title="Move Up"
                      >
                        <i className="bi bi-chevron-up" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-dark p-0"
                        disabled={idx === steps.length - 1}
                        onClick={() => handleMoveStep(idx, 1)}
                        title="Move Down"
                      >
                        <i className="bi bi-chevron-down" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 ms-1"
                        onClick={() => handleRemoveStep(idx)}
                        title="Remove Step"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={step.title || ''}
                      onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                      placeholder="Step Title"
                    />
                  </div>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={step.description || ''}
                    onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                    placeholder="Step details…"
                  />
                </div>
              ))}
              {steps.length === 0 && (
                <div className="text-muted small p-2 bg-white rounded border text-center">
                  No workflow steps added. Click &quot;Add Step&quot; above.
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'gallery': {
        const imagesList = Array.isArray(config.images) ? config.images : [];
        const handleAddImage = () => {
          handleConfigChange({
            ...config,
            images: [...imagesList, { src: '', alt: '', caption: '' }],
          });
        };
        const handleUpdateImage = (index, field, val) => {
          const updated = [...imagesList];
          const curr = typeof updated[index] === 'string' ? { src: updated[index], alt: '', caption: '' } : { ...updated[index] };
          curr[field] = val;
          updated[index] = curr;
          handleConfigChange({ ...config, images: updated });
        };
        const handleMoveImage = (index, dir) => {
          const target = index + dir;
          if (target < 0 || target >= imagesList.length) return;
          const updated = [...imagesList];
          const temp = updated[index];
          updated[index] = updated[target];
          updated[target] = temp;
          handleConfigChange({ ...config, images: updated });
        };
        const handleRemoveImage = (index) => {
          const updated = imagesList.filter((_, i) => i !== index);
          handleConfigChange({ ...config, images: updated });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Gallery Images ({imagesList.length})</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddImage}>
                <i className="bi bi-plus-lg me-1" /> Add Image
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {imagesList.map((img, idx) => {
                const src = typeof img === 'string' ? img : img.src || '';
                const alt = typeof img === 'object' ? img.alt || '' : '';
                const caption = typeof img === 'object' ? img.caption || '' : '';
                return (
                  <div key={idx} className="p-2 border rounded-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-secondary-subtle text-secondary small">Image #{idx + 1}</span>
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark p-0"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, -1)}
                          title="Move Up"
                        >
                          <i className="bi bi-chevron-up" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark p-0"
                          disabled={idx === imagesList.length - 1}
                          onClick={() => handleMoveImage(idx, 1)}
                          title="Move Down"
                        >
                          <i className="bi bi-chevron-down" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 ms-1"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove Image"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Image Source URL</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={src}
                        onChange={(e) => handleUpdateImage(idx, 'src', e.target.value)}
                        placeholder="https://... or /assets/..."
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Alt Text (Accessibility)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={alt}
                          onChange={(e) => handleUpdateImage(idx, 'alt', e.target.value)}
                          placeholder="Image description"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Caption (Optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={caption}
                          onChange={(e) => handleUpdateImage(idx, 'caption', e.target.value)}
                          placeholder="Caption text"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {imagesList.length === 0 && (
                <div className="text-muted small p-2 bg-white rounded border text-center">
                  No gallery images added yet. Click &quot;Add Image&quot; above.
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'video':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Video Embed Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Video Embed Source URL (iframe)</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="https://www.youtube-nocookie.com/embed/... or Vimeo link"
                value={config.src || ''}
                onChange={(e) => handleConfigChange({ ...config, src: e.target.value })}
              />
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                Use an embeddable URL formatted for iframe embedding.
              </small>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Video Title (Accessibility)</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="e.g. Product Demo Walkthrough"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Architecture Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Section Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="e.g. System Topology"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Diagram Image URL</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="https://... or architecture-diagram.png"
                value={config.diagramUrl || ''}
                onChange={(e) => handleConfigChange({ ...config, diagramUrl: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Description</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                placeholder="High-level architecture and subsystem descriptions..."
                value={config.description || ''}
                onChange={(e) => handleConfigChange({ ...config, description: e.target.value })}
              />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Contact Channels</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Heading Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="Get in Touch"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control form-control-sm rounded-3"
                placeholder="hello@example.com"
                value={config.email || ''}
                onChange={(e) => handleConfigChange({ ...config, email: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">LinkedIn Profile URL</label>
              <input
                type="url"
                className="form-control form-control-sm rounded-3"
                placeholder="https://linkedin.com/in/..."
                value={config.linkedin || ''}
                onChange={(e) => handleConfigChange({ ...config, linkedin: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">GitHub Profile URL</label>
              <input
                type="url"
                className="form-control form-control-sm rounded-3"
                placeholder="https://github.com/..."
                value={config.github || ''}
                onChange={(e) => handleConfigChange({ ...config, github: e.target.value })}
              />
            </div>
          </div>
        );

      case 'project_list': {
        const projList = Array.isArray(config.projects) ? config.projects : [];
        const handleAddProj = () => {
          handleConfigChange({
            ...config,
            projects: [...projList, { title: 'New Project', slug: '', category: '', description: '' }],
          });
        };
        const handleUpdateProj = (index, field, val) => {
          const updated = [...projList];
          updated[index] = { ...updated[index], [field]: val };
          handleConfigChange({ ...config, projects: updated });
        };
        const handleMoveProj = (index, dir) => {
          const target = index + dir;
          if (target < 0 || target >= projList.length) return;
          const updated = [...projList];
          const temp = updated[index];
          updated[index] = updated[target];
          updated[target] = temp;
          handleConfigChange({ ...config, projects: updated });
        };
        const handleRemoveProj = (index) => {
          handleConfigChange({ ...config, projects: projList.filter((_, i) => i !== index) });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Project List Items ({projList.length})</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddProj}>
                <i className="bi bi-plus-lg me-1" /> Add Project
              </button>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Section Heading</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
                placeholder="Featured Projects"
              />
            </div>
            <div className="d-flex flex-column gap-2">
              {projList.map((p, idx) => (
                <div key={idx} className="p-2 border rounded-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-secondary-subtle text-secondary small">#{idx + 1}</span>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-dark p-0"
                        disabled={idx === 0}
                        onClick={() => handleMoveProj(idx, -1)}
                        title="Move Up"
                      >
                        <i className="bi bi-chevron-up" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-dark p-0"
                        disabled={idx === projList.length - 1}
                        onClick={() => handleMoveProj(idx, 1)}
                        title="Move Down"
                      >
                        <i className="bi bi-chevron-down" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 ms-1"
                        onClick={() => handleRemoveProj(idx)}
                        title="Remove Project"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-7">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={p.title || ''}
                        onChange={(e) => handleUpdateProj(idx, 'title', e.target.value)}
                        placeholder="Project Title"
                      />
                    </div>
                    <div className="col-5">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={p.slug || ''}
                        onChange={(e) => handleUpdateProj(idx, 'slug', e.target.value)}
                        placeholder="Slug (e.g. winni)"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={p.category || ''}
                    onChange={(e) => handleUpdateProj(idx, 'category', e.target.value)}
                    placeholder="Category / Subtitle"
                  />
                </div>
              ))}
              {projList.length === 0 && (
                <div className="text-muted small p-2 bg-white rounded border text-center">
                  No projects added yet. Click &quot;Add Project&quot; above.
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'heading':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Heading Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Heading Text</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.text || ''}
                onChange={(e) => handleConfigChange({ ...config, text: e.target.value })}
                placeholder="Enter heading text..."
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Semantic Level</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={config.level || 2}
                  onChange={(e) => handleConfigChange({ ...config, level: parseInt(e.target.value, 10) })}
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                  <option value={5}>H5</option>
                  <option value={6}>H6</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Alignment</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={config.align || 'left'}
                  onChange={(e) => handleConfigChange({ ...config, align: e.target.value })}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Button Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Button Label</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.label || ''}
                onChange={(e) => handleConfigChange({ ...config, label: e.target.value })}
                placeholder="e.g. Learn More"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Link URL / Destination</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3 font-monospace"
                value={config.href || ''}
                onChange={(e) => handleConfigChange({ ...config, href: e.target.value })}
                placeholder="/work or https://..."
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Variant</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={config.variant || 'primary'}
                  onChange={(e) => handleConfigChange({ ...config, variant: e.target.value })}
                >
                  <option value="primary">Brand Primary</option>
                  <option value="secondary">Dark Secondary</option>
                  <option value="outline">Outline</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Shape</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={config.pill !== false ? 'pill' : 'square'}
                  onChange={(e) => handleConfigChange({ ...config, pill: e.target.value === 'pill' })}
                >
                  <option value="pill">Pill Rounded</option>
                  <option value="square">Rounded Rect</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Divider Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Label (Optional)</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.label || ''}
                onChange={(e) => handleConfigChange({ ...config, label: e.target.value })}
                placeholder="e.g. OR / Next Section"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Spacing ({config.spacing || 4})</label>
              <input
                type="range"
                className="form-range"
                min="1"
                max="5"
                value={config.spacing || 4}
                onChange={(e) => handleConfigChange({ ...config, spacing: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>
        );

      case 'tabs': {
        const tabsList = Array.isArray(config.tabs) ? config.tabs : [];
        const handleAddTab = () => {
          handleConfigChange({
            ...config,
            tabs: [...tabsList, { key: `tab-${Date.now()}`, label: 'New Tab', content: 'Tab description...' }],
          });
        };
        const handleUpdateTab = (idx, field, val) => {
          const updated = [...tabsList];
          updated[idx] = { ...updated[idx], [field]: val };
          handleConfigChange({ ...config, tabs: updated });
        };
        const handleRemoveTab = (idx) => {
          handleConfigChange({ ...config, tabs: tabsList.filter((_, i) => i !== idx) });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Tabs ({tabsList.length})</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddTab}>
                <i className="bi bi-plus-lg me-1" /> Add Tab
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {tabsList.map((tab, idx) => (
                <div key={idx} className="p-2 border rounded-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary-subtle text-secondary small">Tab #{idx + 1}</span>
                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleRemoveTab(idx)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Tab Label"
                    value={tab.label || ''}
                    onChange={(e) => handleUpdateTab(idx, 'label', e.target.value)}
                  />
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    placeholder="Tab Content..."
                    value={tab.content || ''}
                    onChange={(e) => handleUpdateTab(idx, 'content', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'accordion': {
        const items = Array.isArray(config.items) ? config.items : [];
        const handleAddItem = () => {
          handleConfigChange({
            ...config,
            items: [...items, { title: 'New Topic', content: 'Topic details...' }],
          });
        };
        const handleUpdateItem = (idx, field, val) => {
          const updated = [...items];
          updated[idx] = { ...updated[idx], [field]: val };
          handleConfigChange({ ...config, items: updated });
        };
        const handleRemoveItem = (idx) => {
          handleConfigChange({ ...config, items: items.filter((_, i) => i !== idx) });
        };

        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 small text-uppercase">Accordion Panels ({items.length})</h6>
              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={handleAddItem}>
                <i className="bi bi-plus-lg me-1" /> Add Panel
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-2 border rounded-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary-subtle text-secondary small">Panel #{idx + 1}</span>
                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleRemoveItem(idx)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Title / Question"
                    value={item.title || ''}
                    onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                  />
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    placeholder="Panel Content..."
                    value={item.content || ''}
                    onChange={(e) => handleUpdateItem(idx, 'content', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'form':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Form (Visual Primitive)</h6>
            <div className="alert alert-info py-2 px-3 small rounded-3 mb-3">
              <i className="bi bi-info-circle me-1" /> Visual Form Component · For design/layout testing.
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Form Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title || ''}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
                placeholder="e.g. Contact Form"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Submit Button Text</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.submitLabel || ''}
                onChange={(e) => handleConfigChange({ ...config, submitLabel: e.target.value })}
                placeholder="e.g. Submit"
              />
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 1. About · Hero
      // -----------------------------------------------------------------------
      case 'about_hero':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">About Hero Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? config.heroEyebrow ?? 'PRODUCT DESIGNER · AI BUILDER'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value, heroEyebrow: e.target.value })}
                placeholder="PRODUCT DESIGNER · AI BUILDER"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Headline</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.headline ?? config.heroHeadline ?? 'I DESIGN. I BUILD. I EXPERIMENT.'}
                onChange={(e) => handleConfigChange({ ...config, headline: e.target.value, heroHeadline: e.target.value })}
                placeholder="I DESIGN. I BUILD. I EXPERIMENT."
              />
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                Note: Periods (.) separate headline lines. The 3rd segment receives the italic serif accent.
              </small>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Lead Description</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                value={config.lead ?? config.heroLead ?? ''}
                onChange={(e) => handleConfigChange({ ...config, lead: e.target.value, heroLead: e.target.value })}
                placeholder="I turn complex problems into usable digital products through product design, AI, low-code, and automation."
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Primary CTA Label</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={config.exploreCta?.label ?? 'Explore My Work'}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    exploreCta: { ...(config.exploreCta || {}), label: e.target.value, href: config.exploreCta?.href || '/work' },
                  })}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Primary CTA Href</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3 font-monospace"
                  value={config.exploreCta?.href ?? '/work'}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    exploreCta: { ...(config.exploreCta || {}), href: e.target.value, label: config.exploreCta?.label || 'Explore My Work' },
                  })}
                />
              </div>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Secondary CTA Label</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={config.talkCta?.label ?? "Let's Talk"}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    talkCta: { ...(config.talkCta || {}), label: e.target.value, href: config.talkCta?.href || '/about#contact' },
                  })}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Secondary CTA Href</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3 font-monospace"
                  value={config.talkCta?.href ?? '/about#contact'}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    talkCta: { ...(config.talkCta || {}), href: e.target.value, label: config.talkCta?.label || "Let's Talk" },
                  })}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Currently Building Note</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.buildingNote ?? 'WINNI Identity Ecosystem · Naïm Copilot · AI Agent Protocols'}
                onChange={(e) => handleConfigChange({ ...config, buildingNote: e.target.value })}
                placeholder="WINNI Identity Ecosystem · Naïm Copilot · AI Agent Protocols"
              />
            </div>
            <div className="mb-2">
              <label className="form-label small fw-semibold">Portrait Image URL (Optional)</label>
              <MediaUploadField
                value={config.portraitUrl || ''}
                folder="about"
                placeholder="Leave blank for default portrait, or paste URL"
                onChange={(url) => handleConfigChange({ ...config, portraitUrl: url })}
              />
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 2. About · My Journey
      // -----------------------------------------------------------------------
      case 'about_journey':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">My Journey Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'SIGNATURE EVOLUTION'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'From Mechanical Design to AI'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Subtitle / Summary</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                value={config.subtitle ?? 'A visual progression connecting physical engineering, visual craft, human-centered UX, low-code delivery, and autonomous AI systems.'}
                onChange={(e) => handleConfigChange({ ...config, subtitle: e.target.value })}
              />
            </div>
            <div className="alert alert-info border-0 rounded-3 p-2 small mb-0">
              <i className="bi bi-info-circle me-1"></i>
              The 5 milestone stages (Mechanical, Visual Craft, UX/UI, Low-Code, AI Product Building) are rendered with interactive stage tabs and key lessons on the canvas.
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 3. About · How I Think
      // -----------------------------------------------------------------------
      case 'about_philosophy':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">How I Think Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'HOW I THINK'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'Principles over trends.'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Intro</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                value={config.intro ?? 'Tools evolve every month, but how you approach problems remains your true craft. Here is how I think before touching any tool.'}
                onChange={(e) => handleConfigChange({ ...config, intro: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Signature Statement</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3 font-serif"
                value={config.signatureStatement ?? '"I think. I design. I experiment."'}
                onChange={(e) => handleConfigChange({ ...config, signatureStatement: e.target.value })}
              />
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 4. About · What I Do
      // -----------------------------------------------------------------------
      case 'about_expertise':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Areas of Expertise Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'AREAS OF EXPERTISE'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'What I Bring to Products'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Subtitle</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="2"
                value={config.subtitle ?? 'Structured capability groups reflecting proven hands-on delivery.'}
                onChange={(e) => handleConfigChange({ ...config, subtitle: e.target.value })}
              />
            </div>
            <div className="alert alert-info border-0 rounded-3 p-2 small mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Renders 3 capability clusters: Product & UX/UI Design, Low-Code Product Delivery (Mendix/OutSystems), and AI Product Building & Automation (n8n/MCP).
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 5. About · Selected Work
      // -----------------------------------------------------------------------
      case 'about_proof':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Selected Work (Proof) Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'PROOF, NOT CLAIMS'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'Selected Work & Artifacts'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="alert alert-info border-0 rounded-3 p-2 small mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Renders proof cards for WINNI, Naïm Copilot, Enterprise Product Design, and AI & Automation Lab with direct links to case studies.
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 6. About · Beyond the Portfolio
      // -----------------------------------------------------------------------
      case 'about_share':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Beyond the Portfolio Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'KNOWLEDGE SHARING'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'Beyond the Portfolio'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-4">
                <label className="form-label small fw-semibold">Learning focus</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={config.hours ?? 'Learn'}
                  onChange={(e) => handleConfigChange({ ...config, hours: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold">Building focus</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={config.learners ?? 'Build'}
                  onChange={(e) => handleConfigChange({ ...config, learners: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold">Sharing focus</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={config.articles ?? 'Share'}
                  onChange={(e) => handleConfigChange({ ...config, articles: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 7. About · Currently Building
      // -----------------------------------------------------------------------
      case 'about_building':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Currently Building Spotlight</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Status Badge</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.stage ?? 'ACTIVE DEVELOPMENT'}
                onChange={(e) => handleConfigChange({ ...config, stage: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Project Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'WINNI Identity & Autonomous Agent Protocols'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Description</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                value={config.description ?? 'Refining the physical-to-digital QR/NFC recovery flow and experimenting with autonomous agent orchestration via Model Context Protocol (MCP) to make physical objects interact with intelligent workflows.'}
                onChange={(e) => handleConfigChange({ ...config, description: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small fw-semibold">Destination Link</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3 font-monospace"
                value={config.link ?? '/#lab'}
                onChange={(e) => handleConfigChange({ ...config, link: e.target.value })}
              />
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 8. About · Beyond Work (The Person)
      // -----------------------------------------------------------------------
      case 'about_human':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Beyond Work (The Person)</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'THE PERSON BEHIND'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? 'Curiosity as the continuous thread.'}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Story / Narrative</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="4"
                value={config.story ?? 'Behind every design system and agentic workflow is a deep curiosity about how things work. Whether dismantling a mechanical mechanism, observing how people handle friction in everyday tasks, or writing automation logic, the common thread is transforming ideas into something tangible and useful.'}
                onChange={(e) => handleConfigChange({ ...config, story: e.target.value })}
              />
            </div>
            <div className="alert alert-info border-0 rounded-3 p-2 small mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Renders spoken languages (Arabic, French, English, Italian), certifications (PSM I, ISSAT Design), and core design beliefs.
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 9. About · Closing CTA
      // -----------------------------------------------------------------------
      case 'about_closing':
        return (
          <div className="card border-0 bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3 small text-uppercase">Closing CTA Properties</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Eyebrow</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.eyebrow ?? 'GET IN TOUCH'}
                onChange={(e) => handleConfigChange({ ...config, eyebrow: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                value={config.title ?? "Let's Build Something Meaningful"}
                onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Description</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="3"
                value={config.description ?? "I'm interested in meaningful product challenges where design, technology, and AI come together. Whether you are building an ambitious system or exploring workflow automation, let's talk."}
                onChange={(e) => handleConfigChange({ ...config, description: e.target.value })}
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Button Label</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={config.exploreLabel ?? 'Explore My Work'}
                  onChange={(e) => handleConfigChange({ ...config, exploreLabel: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Contact Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm rounded-3"
                  value={config.email ?? 'contact@naiimbsili.com'}
                  onChange={(e) => handleConfigChange({ ...config, email: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="alert alert-secondary text-center py-4 rounded-3 border-0 my-3">
            <i className="bi bi-tools display-6 text-muted mb-2 d-block"></i>
            <h6 className="fw-bold mb-1">Standard Section</h6>
            <p className="small text-muted mb-0">
              Section <code>{type}</code> uses controlled defaults and renders cleanly on the page canvas.
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

      {/* Editor Tab Navigation */}
      <div className="bg-light border-bottom px-3 pt-2">
        <ul className="nav nav-tabs border-bottom-0 gap-1" style={{ fontSize: '0.82rem' }}>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 transition-all ${
                activeTab === 'content'
                  ? 'active bg-white text-dark fw-bold border-bottom-0 border-top border-3 border-primary shadow-xs'
                  : 'text-secondary fw-semibold border-0'
              }`}
              style={{
                color: activeTab === 'content' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'content' ? 700 : 500,
                backgroundColor: activeTab === 'content' ? '#ffffff' : 'transparent',
              }}
              onClick={() => setActiveTab('content')}
            >
              <i className={`bi bi-pencil-square me-1 ${activeTab === 'content' ? 'text-primary' : 'text-muted'}`} /> Content
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 transition-all ${
                activeTab === 'layout'
                  ? 'active bg-white text-dark fw-bold border-bottom-0 border-top border-3 border-primary shadow-xs'
                  : 'text-secondary fw-semibold border-0'
              }`}
              style={{
                color: activeTab === 'layout' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'layout' ? 700 : 500,
                backgroundColor: activeTab === 'layout' ? '#ffffff' : 'transparent',
              }}
              onClick={() => setActiveTab('layout')}
            >
              <i className={`bi bi-grid-fill me-1 ${activeTab === 'layout' ? 'text-primary' : 'text-muted'}`} /> Layout
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 transition-all ${
                activeTab === 'style'
                  ? 'active bg-white text-dark fw-bold border-bottom-0 border-top border-3 border-primary shadow-xs'
                  : 'text-secondary fw-semibold border-0'
              }`}
              style={{
                color: activeTab === 'style' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'style' ? 700 : 500,
                backgroundColor: activeTab === 'style' ? '#ffffff' : 'transparent',
              }}
              onClick={() => setActiveTab('style')}
            >
              <i className={`bi bi-palette me-1 ${activeTab === 'style' ? 'text-primary' : 'text-muted'}`} /> Style
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 transition-all ${
                activeTab === 'advanced'
                  ? 'active bg-white text-dark fw-bold border-bottom-0 border-top border-3 border-primary shadow-xs'
                  : 'text-secondary fw-semibold border-0'
              }`}
              style={{
                color: activeTab === 'advanced' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'advanced' ? 700 : 500,
                backgroundColor: activeTab === 'advanced' ? '#ffffff' : 'transparent',
              }}
              onClick={() => setActiveTab('advanced')}
            >
              <i className={`bi bi-code-slash me-1 ${activeTab === 'advanced' ? 'text-primary' : 'text-muted'}`} /> Advanced
            </button>
          </li>
        </ul>
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

        {/* Validation Notice Panel */}
        {(!validation.valid || validation.advisories.length > 0) && (
          <div className="mb-3">
            {!validation.valid && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-2" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-x-circle-fill me-1" />
                {validation.errors.join(' ')}
              </div>
            )}
            {validation.advisories.length > 0 && (
              <div className="alert alert-warning py-2 px-3 small rounded-3 mb-0" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-info-circle-fill me-1" />
                {validation.advisories.join(' ')}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CONTENT */}
        {activeTab === 'content' && (
          <div>
            {/* If section has multi-column layout, show column switcher bar */}
            {config.layout?.columns && config.layout.columns.length > 1 && (
              <div className="card border-0 bg-light rounded-3 p-2 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                  <span className="small fw-bold text-uppercase text-secondary" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-layout-three-columns me-1 text-primary" />
                    Columns ({config.layout.columns.join(' / ')})
                  </span>
                  <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                    {config.layout.columns.length} Tracks
                  </span>
                </div>
                <div className="btn-group btn-group-sm w-100">
                  {config.layout.columns.map((span, idx) => {
                    const isSlot = config.columnSlots?.[idx];
                    const isSelected = selectedColIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
                        onClick={() => setSelectedColIndex(idx)}
                      >
                        Col {idx + 1} ({span})
                        {idx === 0 && !isSlot ? ' · Main' : isSlot ? ` · ${isSlot.type}` : ' · Empty'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* When viewing Column 0 without custom slot override, render main section editor */}
            {(!config.layout?.columns || config.layout.columns.length <= 1 || (selectedColIndex === 0 && !config.columnSlots?.[0])) && renderEditorContent()}

            {/* When viewing a column slot (Col 2, Col 3... or custom Col 1) */}
            {config.layout?.columns && config.layout.columns.length > 1 && (selectedColIndex > 0 || config.columnSlots?.[0]) && (
              <div className="column-slot-editor">
                {(() => {
                  const currentSlot = config.columnSlots?.[selectedColIndex];
                  const colSpan = config.layout.columns[selectedColIndex] || 4;

                  const handleSlotTypeChange = (newType) => {
                    const defaultConfigs = {
                      rich_text: { eyebrow: '', title: 'Column Heading', body: 'Add column text here.', alignment: 'left' },
                      image: { src: '', alt: 'Column Image', caption: '' },
                      cta: { eyebrow: 'Action', title: 'Call to Action', description: 'Description', buttonLabel: 'Learn More', buttonHref: '#' },
                      quote: { quote: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci', role: 'Polymath' },
                      metrics: { eyebrow: 'Metrics', title: 'Outcomes', metrics: [{ value: '10x', label: 'Improvement' }, { value: '99%', label: 'Adoption' }] },
                      timeline: { eyebrow: 'Journey', title: 'Timeline', items: [{ year: '2024', title: 'Milestone 1', description: 'Concept' }] },
                      button: { label: 'Click Here', href: '#', variant: 'primary' },
                      heading: { eyebrow: 'Section', title: 'Heading', level: 'h3' },
                    };
                    const nextSlots = [...(config.columnSlots || [])];
                    nextSlots[selectedColIndex] = {
                      type: newType,
                      config: defaultConfigs[newType] || {},
                    };
                    handleConfigChange({ ...config, columnSlots: nextSlots });
                  };

                  const handleUpdateSlot = (patch) => {
                    const nextSlots = [...(config.columnSlots || [])];
                    const existing = nextSlots[selectedColIndex] || { type: 'rich_text', config: {} };
                    nextSlots[selectedColIndex] = {
                      ...existing,
                      config: {
                        ...(existing.config || {}),
                        ...patch,
                      },
                    };
                    handleConfigChange({ ...config, columnSlots: nextSlots });
                  };

                  const handleClearSlot = () => {
                    const nextSlots = [...(config.columnSlots || [])];
                    delete nextSlots[selectedColIndex];
                    handleConfigChange({ ...config, columnSlots: nextSlots });
                  };

                  if (!currentSlot) {
                    return (
                      <div className="card border-dashed p-4 text-center bg-white rounded-3 shadow-xs">
                        <i className="bi bi-plus-circle text-primary fs-3 mb-2" />
                        <h6 className="fw-bold mb-1">Column {selectedColIndex + 1} ({colSpan}/12) is Empty</h6>
                        <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                          Choose a component to insert into this column:
                        </p>
                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => handleSlotTypeChange('rich_text')}
                          >
                            <i className="bi bi-file-text me-1" /> Rich Text
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => handleSlotTypeChange('image')}
                          >
                            <i className="bi bi-image me-1" /> Image Block
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => handleSlotTypeChange('cta')}
                          >
                            <i className="bi bi-megaphone me-1" /> Call to Action
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => handleSlotTypeChange('quote')}
                          >
                            <i className="bi bi-quote me-1" /> Quote
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => handleSlotTypeChange('metrics')}
                          >
                            <i className="bi bi-bar-chart me-1" /> Key Metrics
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => handleSlotTypeChange('timeline')}
                          >
                            <i className="bi bi-clock-history me-1" /> Timeline
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const slotCfg = currentSlot.config || {};

                  return (
                    <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <div>
                          <span className="badge bg-primary me-2">Col {selectedColIndex + 1} ({colSpan}/12)</span>
                          <strong className="text-dark small text-uppercase">{currentSlot.type}</strong>
                        </div>
                        <div className="d-flex gap-2">
                          <select
                            className="form-select form-select-sm rounded-pill"
                            style={{ fontSize: '0.72rem', width: 'auto' }}
                            value={currentSlot.type}
                            onChange={(e) => handleSlotTypeChange(e.target.value)}
                          >
                            <option value="rich_text">Rich Text</option>
                            <option value="image">Image Block</option>
                            <option value="cta">Call to Action</option>
                            <option value="quote">Quote</option>
                            <option value="metrics">Key Metrics</option>
                            <option value="timeline">Timeline</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger rounded-pill px-2"
                            style={{ fontSize: '0.7rem' }}
                            onClick={handleClearSlot}
                            title="Remove component from this column"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-Editor Fields per component type */}
                      {currentSlot.type === 'rich_text' && (
                        <div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Eyebrow</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={slotCfg.eyebrow || ''}
                              placeholder="e.g. SUBTITLE"
                              onChange={(e) => handleUpdateSlot({ eyebrow: e.target.value })}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Title</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={slotCfg.title || ''}
                              placeholder="Column title..."
                              onChange={(e) => handleUpdateSlot({ title: e.target.value })}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Body Content</label>
                            <textarea
                              className="form-control form-control-sm rounded-3 font-monospace"
                              rows="4"
                              value={slotCfg.body || ''}
                              placeholder="Write column content here..."
                              onChange={(e) => handleUpdateSlot({ body: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      {currentSlot.type === 'image' && (
                        <div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Image Source</label>
                            <MediaUploadField
                              value={slotCfg.src || slotCfg.imageUrl || ''}
                              folder="about"
                              placeholder="https://... or upload"
                              onChange={(url) => handleUpdateSlot({ src: url, imageUrl: url })}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Alt Text</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={slotCfg.alt || ''}
                              placeholder="Descriptive alt text"
                              onChange={(e) => handleUpdateSlot({ alt: e.target.value })}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Caption</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={slotCfg.caption || ''}
                              placeholder="Optional image caption"
                              onChange={(e) => handleUpdateSlot({ caption: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      {currentSlot.type === 'cta' && (
                        <div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Title</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={slotCfg.title || ''}
                              placeholder="Action Headline"
                              onChange={(e) => handleUpdateSlot({ title: e.target.value })}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Description</label>
                            <textarea
                              className="form-control form-control-sm rounded-3"
                              rows="2"
                              value={slotCfg.description || ''}
                              placeholder="Supporting description..."
                              onChange={(e) => handleUpdateSlot({ description: e.target.value })}
                            />
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small fw-semibold">Button Label</label>
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3"
                                value={slotCfg.buttonLabel || ''}
                                placeholder="Button Text"
                                onChange={(e) => handleUpdateSlot({ buttonLabel: e.target.value })}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-semibold">Button URL</label>
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3"
                                value={slotCfg.buttonHref || ''}
                                placeholder="/work or https://..."
                                onChange={(e) => handleUpdateSlot({ buttonHref: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {currentSlot.type === 'quote' && (
                        <div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Quote Text</label>
                            <textarea
                              className="form-control form-control-sm rounded-3"
                              rows="3"
                              value={slotCfg.quote || ''}
                              placeholder="Quote..."
                              onChange={(e) => handleUpdateSlot({ quote: e.target.value })}
                            />
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small fw-semibold">Author</label>
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3"
                                value={slotCfg.author || ''}
                                placeholder="Author name"
                                onChange={(e) => handleUpdateSlot({ author: e.target.value })}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-semibold">Role / Title</label>
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3"
                                value={slotCfg.role || ''}
                                placeholder="Role"
                                onChange={(e) => handleUpdateSlot({ role: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {currentSlot.type === 'metrics' && (
                        <div>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Metrics Title</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={slotCfg.title || ''}
                              placeholder="Impact Title"
                              onChange={(e) => handleUpdateSlot({ title: e.target.value })}
                            />
                          </div>
                          <label className="form-label small fw-semibold">Metric Items</label>
                          {(slotCfg.metrics || [{ value: '', label: '' }]).map((m, mIdx) => (
                            <div key={mIdx} className="d-flex gap-2 mb-2">
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3 w-50"
                                value={m.value || ''}
                                placeholder="Value (e.g. 10x)"
                                onChange={(e) => {
                                  const updatedMetrics = [...(slotCfg.metrics || [])];
                                  updatedMetrics[mIdx] = { ...(updatedMetrics[mIdx] || {}), value: e.target.value };
                                  handleUpdateSlot({ metrics: updatedMetrics });
                                }}
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3 w-50"
                                value={m.label || ''}
                                placeholder="Label"
                                onChange={(e) => {
                                  const updatedMetrics = [...(slotCfg.metrics || [])];
                                  updatedMetrics[mIdx] = { ...(updatedMetrics[mIdx] || {}), label: e.target.value };
                                  handleUpdateSlot({ metrics: updatedMetrics });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LAYOUT */}
        {activeTab === 'layout' && (
          <LayoutInspector
            layout={config.layout}
            columnSlots={config.columnSlots || []}
            onSelectColumn={(colIdx) => {
              setSelectedColIndex(colIdx);
              setActiveTab('content');
            }}
            onChange={(updatedLayout) =>
              handleConfigChange({
                ...config,
                layout: updatedLayout,
                columnLayout: updatedLayout.presetId,
              })
            }
          />
        )}

        {/* TAB 3: STYLE */}
        {activeTab === 'style' && (
          <StyleInspector
            style={config.style}
            sectionId={section.id}
            onChange={(updatedStyle) =>
              handleConfigChange({
                ...config,
                style: updatedStyle,
              })
            }
          />
        )}

        {/* TAB 4: ADVANCED */}
        {activeTab === 'advanced' && (
          <div className="advanced-settings-panel">
            <div className="card border-0 bg-light rounded-3 p-3 mb-3">
              <h6 className="fw-bold mb-2 small text-uppercase text-secondary">
                <i className="bi bi-tags me-1 text-primary" /> CSS Class Names
              </h6>
              <label className="form-label small fw-semibold">Custom Class Name(s)</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3 font-monospace"
                placeholder="e.g. my-custom-section py-5 bg-dark text-white rounded-4"
                value={config.customClassName || ''}
                onChange={(e) => handleConfigChange({ ...config, customClassName: e.target.value })}
              />
              <small className="text-muted mt-1 d-block" style={{ fontSize: '0.7rem' }}>
                Space-separated classes applied to the root section wrapper element.
              </small>
            </div>

            <div className="card border-0 bg-light rounded-3 p-3">
              <h6 className="fw-bold mb-2 small text-uppercase text-secondary">
                <i className="bi bi-info-circle me-1 text-primary" /> Section Metadata
              </h6>
              <div className="small text-muted">
                <div>Section ID: <code className="text-dark">{section.id}</code></div>
                <div>Type: <code className="text-dark">{section.section_type}</code></div>
                <div>Sort Order: <code className="text-dark">{section.sort_order}</code></div>
                <div>Visibility: <code className="text-dark">{section.is_visible !== false ? 'Public (Visible)' : 'Hidden'}</code></div>
              </div>
            </div>
          </div>
        )}
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
