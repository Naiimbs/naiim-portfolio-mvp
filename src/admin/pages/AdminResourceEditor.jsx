import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getResourceById, createResource, updateResource } from '../../services/resources';
import { RESOURCE_TYPE_LIST, ASSET_TYPES } from '../../config/resourceTypes';
import { uploadMedia } from '../../services/media';
import { getEditorSectionsForType } from '../config/resourceEditorConfig';
import { parseMarkdownSkill } from '../utils/markdownParser';

export default function AdminResourceEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('basics');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [draftPrompt, setDraftPrompt] = useState(null);
  const draftKey = `draft_resource_${isNew ? 'new' : id}`;

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    resource_type: 'skill',
    status: 'published',
    visibility: 'public',
    featured: false,
    sort_order: 10,
    version: '1.0.0',
    author: 'Naïm Bsili',
    license: 'MIT',
    short_description: '',
    description: '',
    purpose: '',
    when_to_use: '',
    when_not_to_use: '',
    how_to_use: '',
    installation: '',
    source_url: '',
    repository_url: '',
    documentation_url: '',
    bundle_download_url: '',
    tags: '',
    related_projects: '',
    related_agents: '',
    show_source_section: true,
    show_source_links: true,
    show_documentation_links: true,
    show_support_card: true,
    support_title: '☕ Support the work behind this resource',
    support_description: 'If this resource saved you some time or helped your workflow, you can support the continuous creation of open tools on Ba9chich.',
    support_label: 'Support my work on Ba9chich →',
    support_url: 'https://ba9chich.com/en/NaiimBsy',
    compatibility: [
      { name: 'Google Antigravity', status: 'verified', notes: 'Full browser and tools integration' },
      { name: 'Claude (Computer Use)', status: 'compatible', notes: 'Compatible with standard browser execution' },
    ],
    assets: [],
  });

  // New Asset Modal / Inline Form State
  const [editingAsset, setEditingAsset] = useState(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetUploadLoading, setAssetUploadLoading] = useState(false);

  // Markdown / ZIP Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState('upload'); // 'upload' | 'preview'
  const [importFile, setImportFile] = useState(null);
  const [importInventory, setImportInventory] = useState(null);
  const [parsedSkill, setParsedSkill] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);

  useEffect(() => {
    if (isNew) {
      const typeParam = searchParams.get('type');
      if (typeParam && RESOURCE_TYPE_LIST.some(t => t.id === typeParam)) {
        setFormData(prev => ({ ...prev, resource_type: typeParam }));
      }
    }
    
    if (!isNew && id) {
      async function load() {
        setLoading(true);
        const { data, error } = await getResourceById(id);
        if (data) {
          setFormData({
            ...data,
            when_to_use: Array.isArray(data.when_to_use) ? data.when_to_use.join('\n') : data.when_to_use || '',
            when_not_to_use: Array.isArray(data.when_not_to_use) ? data.when_not_to_use.join('\n') : data.when_not_to_use || '',
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
            related_projects: Array.isArray(data.related_projects) ? data.related_projects.join(', ') : data.related_projects || '',
            related_agents: Array.isArray(data.related_agents) ? data.related_agents.join(', ') : data.related_agents || '',
            show_source_section: data.show_source_section !== false,
            show_source_links: data.show_source_links !== false,
            show_documentation_links: data.show_documentation_links !== false,
            show_support_card: data.show_support_card !== false,
            compatibility: Array.isArray(data.compatibility) ? data.compatibility : [],
            assets: Array.isArray(data.assets) ? data.assets : [],
          });
        }
        setLoading(false);
      }
      load();
    } else {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setDraftPrompt(JSON.parse(savedDraft));
      }
    }
  }, [id, isNew]);

  // Auto-save draft
  useEffect(() => {
    if (loading) return; // Don't save while initially loading
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, loading, draftKey]);

  const handleRestoreDraft = () => {
    if (draftPrompt) {
      setFormData(draftPrompt);
      setDraftPrompt(null);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftPrompt(null);
  };

  const handleFieldChange = (field, value) => {
    if (field === 'resource_type' && value !== formData.resource_type) {
      const confirmChange = window.confirm(`Changing Resource Type to "${value}" may hide ${formData.resource_type}-specific fields.\n\nExisting data will be preserved and not deleted.\n\nContinue?`);
      if (!confirmChange) return;
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title if new
      if (field === 'title' && isNew && !prev.slug) {
        next.slug = value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: 'danger', message: 'Title is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      ...formData,
      when_to_use: formData.when_to_use.split('\n').map((s) => s.trim()).filter(Boolean),
      when_not_to_use: formData.when_not_to_use.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: formData.tags.split(',').map((s) => s.trim()).filter(Boolean),
      related_projects: formData.related_projects.split(',').map((s) => s.trim()).filter(Boolean),
      related_agents: formData.related_agents.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (isNew) {
        const { data, error } = await createResource(payload);
        if (error) throw error;
        localStorage.removeItem(draftKey);
        setFeedback({ type: 'success', message: 'Resource created successfully!' });
        setTimeout(() => navigate(`/admin/resources/${data.id}`), 600);
      } else {
        const { data, error } = await updateResource(id, payload);
        if (error) throw error;
        localStorage.removeItem(draftKey);
        setFeedback({ type: 'success', message: 'Changes saved' });
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Unable to save changes. Resource could not be updated. Please check the resource ID and try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Asset Management Helpers
  const openNewAssetModal = () => {
    setEditingAsset({
      id: `asset-${Date.now()}`,
      name: '',
      asset_type: 'documentation',
      file_url: '',
      description: '',
      is_required: false,
      is_previewable: true,
      is_downloadable: true,
      sort_order: (formData.assets.length + 1) * 10,
      file_size: '',
      mime_type: '',
    });
    setIsAssetModalOpen(true);
  };

  const openEditAssetModal = (asset) => {
    setEditingAsset({ ...asset });
    setIsAssetModalOpen(true);
  };

  const saveAsset = () => {
    if (!editingAsset.name.trim()) return;
    setFormData((prev) => {
      const existing = prev.assets || [];
      const index = existing.findIndex((a) => a.id === editingAsset.id);
      let updated;
      if (index >= 0) {
        updated = [...existing];
        updated[index] = editingAsset;
      } else {
        updated = [...existing, editingAsset];
      }
      return { ...prev, assets: updated };
    });
    setIsAssetModalOpen(false);
    setEditingAsset(null);
  };

  const deleteAsset = (assetId) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== assetId),
    }));
  };

  const handleAssetFileUpload = async (file) => {
    if (!file) return;
    setAssetUploadLoading(true);
    try {
      const { data, error } = await uploadMedia(file, { folder: 'resources' });
      if (error) {
        alert(`Upload error: ${error.message}`);
      } else if (data) {
        setEditingAsset((prev) => ({
          ...prev,
          name: prev.name || file.name,
          file_url: data.public_url,
          file_size: `${(file.size / 1024).toFixed(1)} KB`,
          mime_type: file.type,
        }));
      }
    } finally {
      setAssetUploadLoading(false);
    }
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportLoading(true);
      setImportError(null);

      // Handle Markdown directly or ZIP
      if (file.name.toLowerCase().endsWith('.zip')) {
        const { analyzeBundle, classifyFiles, parseMarkdown } = await import('../../services/resourceImportService');
        const { data: inventoryData, error: zipError } = await analyzeBundle(file);
        if (zipError) {
          setImportError(zipError);
          setImportLoading(false);
          return;
        }

        const classified = classifyFiles(inventoryData.files);
        setImportInventory(classified);

        const { data: parsedData, textContent } = await parseMarkdown(classified);
        if (parsedData) {
          setParsedSkill(parsedData);
          setImportFile((prev) => {
            // we abuse the state a bit here to store raw text for AI
            prev.rawMarkdownText = textContent;
            return prev;
          });
        }
      } else if (file.name.toLowerCase().endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target.result;
          setParsedSkill(parseMarkdownSkill(text));
          setImportFile((prev) => {
            if (prev) prev.rawMarkdownText = text;
            return prev;
          });
        };
        reader.readAsText(file);
      }

      setImportStep('preview');
      setImportLoading(false);
    }
  };

  const handleEnrichWithAI = async () => {
    setImportLoading(true);
    setImportError(null);
    try {
      const { enrichWithAI } = await import('../../services/resourceImportService');
      const text = importFile?.rawMarkdownText || '';
      const { data, error } = await enrichWithAI(parsedSkill, text);
      if (error) {
        setImportError(error);
      } else if (data) {
        setAiSuggestions(data);
      }
    } catch (err) {
      setImportError('AI Enrichment Failed: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiSuggestions) return;
    setParsedSkill(aiSuggestions);
    setAiSuggestions(null);
  };

  const cancelAiSuggestions = () => {
    setAiSuggestions(null);
  };

  const applyImportedSkill = async () => {
    setImportLoading(true);
    let newAssets = [];
    
    if (importFile && importFile.name.toLowerCase().endsWith('.zip')) {
      const { commitImport } = await import('../../services/resourceImportService');
      const importId = `import_${Date.now()}`;
      const { data: uploadedAssets, error } = await commitImport(importInventory, importFile, importId);
      if (error) {
        setImportError(error);
        setImportLoading(false);
        return;
      }
      if (uploadedAssets) newAssets = uploadedAssets;
    } else if (importFile) {
      // Markdown fallback upload
      try {
        const { data } = await uploadMedia(importFile, { folder: 'resources' });
        if (data) {
          newAssets.push({
            id: `asset-${Date.now()}`,
            asset_type: 'attachment',
            name: importFile.name,
            description: 'Imported Skill Markdown',
            file_url: data.public_url,
            is_previewable: true,
            is_downloadable: true,
            is_required: true,
          });
        }
      } catch (e) {
        console.warn('[resources] Failed to upload imported md file', e);
      }
    }

    setFormData((prev) => ({
      ...prev,
      title: parsedSkill?.title || prev.title,
      version: parsedSkill?.version || prev.version,
      description: parsedSkill?.description || prev.description,
      purpose: parsedSkill?.purpose || prev.purpose,
      how_to_use: parsedSkill?.how_to_use || prev.how_to_use,
      installation: parsedSkill?.installation || prev.installation,
      tags: parsedSkill?.tags?.length ? parsedSkill.tags.join(', ') : prev.tags,
      when_to_use: parsedSkill?.when_to_use?.length ? parsedSkill.when_to_use.join('\n') : prev.when_to_use,
      when_not_to_use: parsedSkill?.when_not_to_use?.length ? parsedSkill.when_not_to_use.join('\n') : prev.when_not_to_use,
      assets: [...(prev.assets || []), ...newAssets],
    }));

    setImportLoading(false);
    setIsImportModalOpen(false);
    setImportStep('upload');
    setImportFile(null);
    setImportInventory(null);
    setParsedSkill(null);
    setAiSuggestions(null);
    setImportError(null);
  };

  if (loading) {
    return (
      <div className="admin-page-container text-center p-5 text-muted">
        <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
        Loading resource details...
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <Helmet>
        <title>{isNew ? 'New Resource' : `Edit: ${formData.title}`} — Admin CMS</title>
      </Helmet>

      {/* Top Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/admin/resources" className="text-decoration-none text-muted small">
              <i className="bi bi-arrow-left me-1"></i>Back to Resources
            </Link>
            <span className="text-muted">/</span>
            <span className="badge bg-light text-dark font-monospace" style={{ fontSize: '0.72rem' }}>
              {formData.resource_type.toUpperCase()}
            </span>
          </div>
          <h1 className="h3 fw-bold mb-0" style={{ color: 'var(--ink, #10242a)' }}>
            {isNew ? 'Create New Resource' : formData.title}
          </h1>
        </div>

        <div className="d-flex gap-2">
          {!isNew && (
            <Link
              to={`/resources/${formData.slug}`}
              target="_blank"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
            >
              <i className="bi bi-eye"></i>
              <span>View Public Page</span>
            </Link>
          )}
          {formData.resource_type === 'skill' && (
            <button
              type="button"
              className="btn btn-outline-dark btn-sm px-3 d-flex align-items-center gap-2"
              onClick={() => setIsImportModalOpen(true)}
            >
              <i className="bi bi-filetype-md"></i>
              <span>Import Skill</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-success btn-sm px-3 d-flex align-items-center gap-2"
            style={{ backgroundColor: 'var(--green, #087f66)' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <i className="bi bi-check-lg"></i>
            )}
            <span>{isNew ? 'Publish Resource' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {draftPrompt && (
        <div className="alert alert-warning py-2 px-3 mb-4 rounded-3 d-flex align-items-center justify-content-between small">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Unsaved Draft Found:</strong> Would you like to restore your last unsaved edits?
          </div>
          <div>
            <button className="btn btn-sm btn-outline-dark me-2 py-0" onClick={handleDiscardDraft}>Discard</button>
            <button className="btn btn-sm btn-warning py-0 fw-bold" onClick={handleRestoreDraft}>Restore</button>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`alert alert-${feedback.type} py-2 px-3 mb-4 rounded-3 small`} role="alert">
          {feedback.message}
        </div>
      )}

      {/* Editor Tabs */}
      <ul className="nav nav-tabs mb-4">
        {getEditorSectionsForType(formData.resource_type).sections.map((section, index) => (
          <li className="nav-item" key={section.id}>
            <button
              className={`nav-link fw-semibold ${activeTab === section.id ? 'active text-success' : 'text-muted'}`}
              onClick={() => setActiveTab(section.id)}
            >
              <i className={`bi ${section.icon} me-2`}></i>
              {index + 1}. {section.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab: Basics */}
      {activeTab === 'basics' && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm p-4 rounded-3 mb-4" style={{ backgroundColor: '#ffffff' }}>
              <h5 className="fw-bold mb-3">Resource Identity</h5>
              <div className="mb-3">
                <label className="form-label fw-bold small">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. App UI/UX & Responsive Design QA Auditor"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Slug (URL identifier) *</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange('slug', e.target.value)}
                  />
                  <div className="form-text small">Public route: /resources/{formData.slug || 'slug'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Resource Type *</label>
                  <select
                    className="form-select"
                    value={formData.resource_type}
                    onChange={(e) => handleFieldChange('resource_type', e.target.value)}
                  >
                    {RESOURCE_TYPE_LIST.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.pluralLabel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Short Description *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="1-2 sentence executive overview for cards and meta descriptions."
                  value={formData.short_description}
                  onChange={(e) => handleFieldChange('short_description', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Full Description / Overview (Markdown)</label>
                <textarea
                  className="form-control font-monospace"
                  rows={5}
                  placeholder="Comprehensive description of the resource..."
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Primary Purpose</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="What core problem does this solve?"
                  value={formData.purpose}
                  onChange={(e) => handleFieldChange('purpose', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Publishing */}
      {activeTab === 'publishing' && (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm p-4 rounded-3 mb-4" style={{ backgroundColor: '#ffffff' }}>
              <h5 className="fw-bold mb-3">Publishing Status</h5>
              <div className="mb-3">
                <label className="form-label fw-bold small">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Visibility</label>
                <select
                  className="form-select"
                  value={formData.visibility}
                  onChange={(e) => handleFieldChange('visibility', e.target.value)}
                >
                  <option value="public">Public (Show in catalog)</option>
                  <option value="private">Private (Admin only)</option>
                  <option value="unlisted">Unlisted (Direct link only)</option>
                </select>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="featuredSwitch"
                  checked={Boolean(formData.featured)}
                  onChange={(e) => handleFieldChange('featured', e.target.checked)}
                />
                <label className="form-check-label fw-semibold small" htmlFor="featuredSwitch">
                  Featured Resource (Showcase badge)
                </label>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Sort Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.sort_order}
                  onChange={(e) => handleFieldChange('sort_order', Number(e.target.value))}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Agent Skill, QA, Heuristics, PDF"
                  value={formData.tags}
                  onChange={(e) => handleFieldChange('tags', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm p-4 rounded-3 mb-4" style={{ backgroundColor: '#ffffff' }}>
              <h5 className="fw-bold mb-3">Cross-Entity Relationships</h5>
              <div className="mb-3">
                <label className="form-label fw-bold small">Related Projects (slugs or IDs)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="winni, unifyapps"
                  value={formData.related_projects}
                  onChange={(e) => handleFieldChange('related_projects', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small">Related AI Agents</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="design-qa-agent, copilot"
                  value={formData.related_agents}
                  onChange={(e) => handleFieldChange('related_agents', e.target.value)}
                />
              </div>
            </div>

            <div className="card border-0 shadow-sm p-4 rounded-3 mb-4" style={{ backgroundColor: '#ffffff' }}>
              <h5 className="fw-bold mb-3">Community Support & Ba9chich</h5>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="supportCardCheck"
                  checked={Boolean(formData.show_support_card)}
                  onChange={(e) => handleFieldChange('show_support_card', e.target.checked)}
                />
                <label className="form-check-label fw-bold small" htmlFor="supportCardCheck">
                  Display Ba9chich Support Card on Resource Detail Page
                </label>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Support Title</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.support_title || ''}
                    onChange={(e) => handleFieldChange('support_title', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Button Label</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.support_label || ''}
                    onChange={(e) => handleFieldChange('support_label', e.target.value)}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold small">Support URL</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace"
                    value={formData.support_url || ''}
                    onChange={(e) => handleFieldChange('support_url', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Skill */}
      {activeTab === 'skill' && (
        <div className="card border-0 shadow-sm p-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
          <h5 className="fw-bold mb-3">Documentation & Playbook Specifications</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold small text-success">
                <i className="bi bi-check-circle me-1"></i>When to Use (one per line)
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Auditing enterprise SaaS platforms...&#10;Testing multi-device responsive collapses..."
                value={formData.when_to_use}
                onChange={(e) => handleFieldChange('when_to_use', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-danger">
                <i className="bi bi-x-circle me-1"></i>When NOT to Use (one per line)
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Auditing native mobile apps...&#10;Backend database load stress testing..."
                value={formData.when_not_to_use}
                onChange={(e) => handleFieldChange('when_not_to_use', e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold small">How to Use / Execution Protocol (Markdown)</label>
            <textarea
              className="form-control font-monospace"
              rows={5}
              placeholder="Step 1: Trigger with prompt...&#10;Step 2: Execution pipeline..."
              value={formData.how_to_use}
              onChange={(e) => handleFieldChange('how_to_use', e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold small">Installation & Setup Instructions (Markdown)</label>
            <textarea
              className="form-control font-monospace"
              rows={4}
              placeholder="1. Global Skill: cp -r skill ~/.gemini/config/skills/&#10;2. Workspace Skill: cp -r skill .agents/skills/"
              value={formData.installation}
              onChange={(e) => handleFieldChange('installation', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Tab: Template */}
      {activeTab === 'template' && (
        <div className="card border-0 shadow-sm p-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
          <h5 className="fw-bold mb-3">Template Details</h5>
          <p className="text-muted small">Template file and preview management. (Specific template fields will appear here).</p>
        </div>
      )}

      {/* Tab: Guide / Content */}
      {(activeTab === 'guide' || activeTab === 'content') && (
        <div className="card border-0 shadow-sm p-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
          <h5 className="fw-bold mb-3">Content</h5>
          <p className="text-muted small">Main guide content and table of contents.</p>
        </div>
      )}

      {/* Tab: Reusable Files */}
      {activeTab === 'reusableFiles' && (
        <div className="card border-0 shadow-sm p-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold mb-1">Reusable Files</h5>
              <p className="text-muted small mb-0">
                A Resource contains first-class assets: documentation, scripts, templates, and ZIP bundles.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-success btn-sm d-flex align-items-center gap-2"
              onClick={openNewAssetModal}
              style={{ backgroundColor: 'var(--green, #087f66)' }}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add File</span>
            </button>
          </div>

          {formData.assets.filter(a => a.asset_type !== 'screenshot').length === 0 ? (
            <div className="text-center p-5 bg-light rounded-3 text-muted">
              <i className="bi bi-paperclip fs-1 mb-2 d-block"></i>
              No files attached yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>File / URL</th>
                    <th>Options</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.assets.filter(a => a.asset_type !== 'screenshot').map((asset) => {
                    const typeCfg = ASSET_TYPES[asset.asset_type] || ASSET_TYPES.attachment;
                    return (
                      <tr key={asset.id}>
                        <td className="fw-bold">
                          <i className={`bi ${typeCfg.icon} me-2`} style={{ color: typeCfg.color }}></i>
                          {asset.name}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="text-muted small" style={{ maxWidth: '280px' }}>
                          {asset.description || '—'}
                        </td>
                        <td className="small font-monospace">
                          {asset.file_url ? (
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {asset.file_url.split('/').pop()}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {asset.is_previewable && <span className="badge bg-info-subtle text-info">Preview</span>}
                            {asset.is_downloadable && <span className="badge bg-success-subtle text-success">Download</span>}
                            {asset.is_required && <span className="badge bg-danger-subtle text-danger">Required</span>}
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={() => openEditAssetModal(asset)}
                              title="Edit Asset"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-light text-danger"
                              onClick={() => deleteAsset(asset.id)}
                              title="Remove Asset"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Evidence */}
      {activeTab === 'evidence' && (
        <div className="card border-0 shadow-sm p-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold mb-1">Example Output & Responsive Evidence</h5>
              <p className="text-muted small mb-0">
                Visual proof and screenshots.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-success btn-sm d-flex align-items-center gap-2"
              onClick={openNewAssetModal}
              style={{ backgroundColor: 'var(--green, #087f66)' }}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Evidence</span>
            </button>
          </div>

          {formData.assets.filter(a => a.asset_type === 'screenshot').length === 0 ? (
            <div className="text-center p-5 bg-light rounded-3 text-muted">
              <i className="bi bi-images fs-1 mb-2 d-block"></i>
              No visual evidence attached yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>File / URL</th>
                    <th>Options</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.assets.filter(a => a.asset_type === 'screenshot').map((asset) => {
                    const typeCfg = ASSET_TYPES[asset.asset_type] || ASSET_TYPES.attachment;
                    return (
                      <tr key={asset.id}>
                        <td className="fw-bold">
                          <i className={`bi ${typeCfg.icon} me-2`} style={{ color: typeCfg.color }}></i>
                          {asset.name}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="text-muted small" style={{ maxWidth: '280px' }}>
                          {asset.description || '—'}
                        </td>
                        <td className="small font-monospace">
                          {asset.file_url ? (
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {asset.file_url.split('/').pop()}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {asset.is_previewable && <span className="badge bg-info-subtle text-info">Preview</span>}
                            {asset.is_downloadable && <span className="badge bg-success-subtle text-success">Download</span>}
                            {asset.is_required && <span className="badge bg-danger-subtle text-danger">Required</span>}
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={() => openEditAssetModal(asset)}
                              title="Edit Asset"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-light text-danger"
                              onClick={() => deleteAsset(asset.id)}
                              title="Remove Asset"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Source & Relationships */}
      {activeTab === 'source' && (
        <div className="card border-0 shadow-sm p-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
          <h5 className="fw-bold mb-3">Source & Documentation Visibility</h5>
          <div className="card border p-3 rounded-3 bg-light mb-4">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showSourceSectionCheck"
                    checked={Boolean(formData.show_source_section)}
                    onChange={(e) => handleFieldChange('show_source_section', e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small" htmlFor="showSourceSectionCheck">
                    Show Source & Documentation
                  </label>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showSourceLinksCheck"
                    checked={Boolean(formData.show_source_links)}
                    onChange={(e) => handleFieldChange('show_source_links', e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small" htmlFor="showSourceLinksCheck">
                    Show Source Links
                  </label>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showDocLinksCheck"
                    checked={Boolean(formData.show_documentation_links)}
                    onChange={(e) => handleFieldChange('show_documentation_links', e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small" htmlFor="showDocLinksCheck">
                    Show Documentation Links
                  </label>
                </div>
              </div>
            </div>
          </div>

          <h5 className="fw-bold mb-3">Source URLs & Versioning</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold small">Version</label>
              <input
                type="text"
                className="form-control"
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => handleFieldChange('version', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small">Author / Maintainer</label>
              <input
                type="text"
                className="form-control"
                placeholder="Naïm Bsili"
                value={formData.author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small">License</label>
              <input
                type="text"
                className="form-control"
                placeholder="MIT"
                value={formData.license}
                onChange={(e) => handleFieldChange('license', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold small">Repository URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://github.com/..."
                value={formData.repository_url}
                onChange={(e) => handleFieldChange('repository_url', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small">ZIP Bundle Download URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="/resources/app-ui-ux-auditor/app-ui-ux-auditor.zip"
                value={formData.bundle_download_url}
                onChange={(e) => handleFieldChange('bundle_download_url', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold small">Figma File URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://www.figma.com/file/..."
                value={formData.metadata?.figma_url || ''}
                onChange={(e) => handleFieldChange('metadata', { ...formData.metadata, figma_url: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small">Figma Embed URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://www.figma.com/embed?embed_host=share&url=..."
                value={formData.metadata?.figma_embed || ''}
                onChange={(e) => handleFieldChange('metadata', { ...formData.metadata, figma_embed: e.target.value })}
              />
            </div>
          </div>

        </div>
      )}

      {/* Asset Modal */}
      {isAssetModalOpen && editingAsset && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingAsset.name ? `Edit Asset: ${editingAsset.name}` : 'Attach New Asset'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsAssetModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label className="form-label fw-bold small">Asset Display Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. SKILL.md or Audit Notes Template.xlsx"
                      value={editingAsset.name}
                      onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Asset Type</label>
                    <select
                      className="form-select"
                      value={editingAsset.asset_type}
                      onChange={(e) => setEditingAsset({ ...editingAsset, asset_type: e.target.value })}
                    >
                      {Object.entries(ASSET_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">Description / Caption</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Brief description or caption for this file/asset."
                    value={editingAsset.description || editingAsset.caption || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value, caption: e.target.value })}
                  />
                </div>

                {editingAsset.asset_type === 'screenshot' && (
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Device / Viewport Label</label>
                      <select
                        className="form-select form-select-sm"
                        value={editingAsset.device || 'Desktop (1440×900)'}
                        onChange={(e) => setEditingAsset({ ...editingAsset, device: e.target.value, viewport: e.target.value })}
                      >
                        <option value="Desktop (1440×900)">Desktop (1440×900)</option>
                        <option value="Laptop (1024×768)">Laptop (1024×768)</option>
                        <option value="Tablet (768×1024)">Tablet (768×1024)</option>
                        <option value="Mobile (390×844)">Mobile (390×844)</option>
                        <option value="Modal / Drawer">Modal / Drawer</option>
                        <option value="Evidence Proof">Evidence Proof</option>
                      </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="featuredScreenshotCheck"
                          checked={Boolean(editingAsset.featured)}
                          onChange={(e) => setEditingAsset({ ...editingAsset, featured: e.target.checked })}
                        />
                        <label className="form-check-label small fw-bold" htmlFor="featuredScreenshotCheck">
                          Featured in Gallery
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold small">File URL / Local Path</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="/resources/... or https://..."
                      value={editingAsset.file_url}
                      onChange={(e) => setEditingAsset({ ...editingAsset, file_url: e.target.value })}
                    />
                    <label className="btn btn-outline-secondary mb-0 cursor-pointer">
                      {assetUploadLoading ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        className="d-none"
                        onChange={(e) => handleAssetFileUpload(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-4 mt-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="previewCheck"
                      checked={Boolean(editingAsset.is_previewable)}
                      onChange={(e) => setEditingAsset({ ...editingAsset, is_previewable: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="previewCheck">
                      Allow Inline Preview
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="downloadCheck"
                      checked={Boolean(editingAsset.is_downloadable)}
                      onChange={(e) => setEditingAsset({ ...editingAsset, is_downloadable: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="downloadCheck">
                      Allow Download
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="requiredCheck"
                      checked={Boolean(editingAsset.is_required)}
                      onChange={(e) => setEditingAsset({ ...editingAsset, is_required: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="requiredCheck">
                      Required Core Asset
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setIsAssetModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-3"
                  style={{ backgroundColor: 'var(--green, #087f66)' }}
                  onClick={saveAsset}
                >
                  Save Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Skill Modal */}
      {isImportModalOpen && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Import Resource Bundle</h5>
                <button type="button" className="btn-close" onClick={() => setIsImportModalOpen(false)}></button>
              </div>
              <div className="modal-body py-4">
                {importError && (
                  <div className="alert alert-danger mb-4">
                    <strong>Error:</strong> {importError}
                  </div>
                )}
                
                {importStep === 'upload' && (
                  <div className="text-center">
                    <i className="bi bi-file-earmark-zip display-1 text-muted mb-3 d-block"></i>
                    <h5 className="fw-bold">Upload ZIP Bundle or Markdown</h5>
                    <p className="text-muted small mb-4">
                      Upload a .zip containing SKILL.md and assets, or a standalone .md file.<br />
                      The system will analyze the contents and extract metadata deterministically.
                    </p>
                    <input
                      type="file"
                      accept=".md,.zip"
                      className="form-control w-75 mx-auto"
                      onChange={handleImportFileChange}
                      disabled={importLoading}
                    />
                    {importLoading && (
                      <div className="mt-3 text-muted small">
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Analyzing bundle...
                      </div>
                    )}
                  </div>
                )}
                {importStep === 'preview' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="fw-bold mb-1 text-success">Import Preview</h5>
                        <p className="text-muted small mb-0">Review the extracted metadata and inventory before committing to storage.</p>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-primary fw-bold"
                        onClick={handleEnrichWithAI}
                        disabled={importLoading}
                      >
                        <i className="bi bi-magic me-2"></i>
                        Enrich with AI
                      </button>
                    </div>
                    
                    {parsedSkill && !aiSuggestions && (
                      <div className="card border-0 bg-light p-3 rounded-3 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <h6 className="fw-bold text-muted small mb-3">EXTRACTED METADATA</h6>
                        <div className="mb-2"><strong>Title:</strong> {parsedSkill.title || '—'}</div>
                        <div className="mb-2"><strong>Version:</strong> {parsedSkill.version || '—'}</div>
                        <div className="mb-2"><strong>Tags:</strong> {parsedSkill.tags?.join(', ') || '—'}</div>
                        <div className="mb-2"><strong>Purpose:</strong> {parsedSkill.purpose || '—'}</div>
                      </div>
                    )}

                    {aiSuggestions && (
                      <div className="card border-0 border-success bg-light p-3 rounded-3 mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-success small mb-0">AI SUGGESTIONS</h6>
                          <div>
                            <button className="btn btn-sm btn-outline-secondary me-2" onClick={cancelAiSuggestions} disabled={importLoading}>Cancel</button>
                            <button className="btn btn-sm btn-success" onClick={applyAiSuggestions} disabled={importLoading}>Apply All</button>
                          </div>
                        </div>
                        <div className="mb-2 text-decoration-line-through text-muted small"><strong>Original Title:</strong> {parsedSkill?.title || '—'}</div>
                        <div className="mb-3 text-success"><strong>Suggested Title:</strong> {aiSuggestions.title || '—'}</div>
                        
                        <div className="mb-2 text-decoration-line-through text-muted small"><strong>Original Purpose:</strong> {parsedSkill?.purpose || '—'}</div>
                        <div className="mb-3 text-success"><strong>Suggested Purpose:</strong> {aiSuggestions.purpose || '—'}</div>
                        
                        <div className="mb-2 text-decoration-line-through text-muted small"><strong>Original Tags:</strong> {parsedSkill?.tags?.join(', ') || '—'}</div>
                        <div className="mb-3 text-success"><strong>Suggested Tags:</strong> {aiSuggestions.tags?.join(', ') || '—'}</div>
                      </div>
                    )}

                    {importInventory && (
                      <div className="card border-0 bg-light p-3 rounded-3 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <h6 className="fw-bold text-muted small mb-3">BUNDLE INVENTORY ({importInventory.length} files)</h6>
                        <ul className="list-unstyled mb-0 small">
                          {importInventory.map((f, i) => (
                            <li key={i} className="mb-1 d-flex justify-content-between border-bottom pb-1">
                              <span className="text-truncate" style={{ maxWidth: '60%' }}>{f.path}</span>
                              <span className="badge bg-secondary">{f.classification}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer border-top-0 bg-light rounded-bottom-3">
                <button type="button" className="btn btn-light" onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStep('upload');
                  setImportFile(null);
                  setParsedSkill(null);
                  setAiSuggestions(null);
                  setImportInventory(null);
                  setImportError(null);
                }} disabled={importLoading}>
                  Cancel
                </button>
                {importStep === 'preview' && (
                  <button type="button" className="btn btn-success fw-bold" onClick={applyImportedSkill} disabled={importLoading} style={{ backgroundColor: 'var(--green, #087f66)' }}>
                    {importLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Extracting & Uploading...</>
                    ) : 'Commit Import'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
