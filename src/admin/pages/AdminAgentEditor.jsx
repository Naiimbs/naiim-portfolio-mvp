import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAdminAgentById, saveAdminAgent } from '../../services/agents';
import SectionList from '../components/case-study-editor/SectionList';
import SectionDrawer from '../components/case-study-editor/SectionDrawer';
import AddSectionModal from '../components/case-study-editor/AddSectionModal';
import MediaPickerModal from '../components/media/MediaPickerModal';

export default function AdminAgentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    category: 'AI Agent',
    year: new Date().getFullYear(),
    role: 'AI Product Designer · AI Workflow Builder',
    tools: ['n8n', 'Google Gemini', 'PostgreSQL', 'Telegram'],
    workflow_platform: 'n8n',
    status: 'draft',
    demo_type: 'none',
    demo_url: '',
    github_url: '',
    n8n_workflow_url: '',
    is_featured: false,
    sort_order: 0,
    seo_title: '',
    seo_description: '',
    canonical_path: '',
    thumbnail_media_id: null,
    hero_media_id: null,
  });

  const [sections, setSections] = useState([]);
  const [toolsInput, setToolsInput] = useState('n8n, Google Gemini, PostgreSQL, Telegram');

  // Drawer / Modals
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null); // 'thumbnail' | 'hero'

  useEffect(() => {
    if (!isNew) {
      loadAgent();
    }
  }, [id]);

  async function loadAgent() {
    setLoading(true);
    const res = await getAdminAgentById(id);
    if (res.data) {
      const a = res.data;
      setFormData({
        name: a.name || '',
        slug: a.slug || '',
        short_description: a.short_description || '',
        description: a.description || '',
        category: a.category || 'AI Agent',
        year: a.year || new Date().getFullYear(),
        role: a.role || '',
        tools: a.tools || [],
        workflow_platform: a.workflow_platform || 'n8n',
        status: a.status || 'draft',
        demo_type: a.demo_type || 'none',
        demo_url: a.demo_url || '',
        github_url: a.github_url || '',
        n8n_workflow_url: a.n8n_workflow_url || '',
        is_featured: Boolean(a.is_featured),
        sort_order: a.sort_order || 0,
        seo_title: a.seo_title || '',
        seo_description: a.seo_description || '',
        canonical_path: a.canonical_path || `/agents/${a.slug}`,
        thumbnail_media_id: a.thumbnail_media_id || null,
        hero_media_id: a.hero_media_id || null,
      });
      setToolsInput((a.tools || []).join(', '));
      setSections(a.sections || []);
    } else {
      setError(res.error?.message || 'Agent not found');
    }
    setLoading(false);
  }

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setIsDirty(true);
  };

  const handleToolsChange = (e) => {
    setToolsInput(e.target.value);
    const parsed = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, tools: parsed }));
    setIsDirty(true);
  };

  // Section Management Handlers
  const handleAddSection = (newSec) => {
    setSections((prev) => [
      ...prev,
      { ...newSec, id: `temp-${Date.now()}`, order_index: prev.length + 1, blocks: [] },
    ]);
    setIsDirty(true);
  };

  const handleUpdateSection = (updatedSec) => {
    setSections((prev) => prev.map((s) => (s.id === updatedSec.id ? updatedSec : s)));
    if (activeSection?.id === updatedSec.id) {
      setActiveSection(updatedSec);
    }
    setIsDirty(true);
  };

  const handleDeleteSection = (secId) => {
    if (!window.confirm('Delete this section and its blocks?')) return;
    setSections((prev) => prev.filter((s) => s.id !== secId));
    if (activeSection?.id === secId) setActiveSection(null);
    setIsDirty(true);
  };

  const handleReorderSections = (reordered) => {
    setSections(reordered);
    setIsDirty(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveStatus('saving');

    const payload = {
      ...formData,
      sections,
    };

    const targetId = isNew ? null : id;
    const res = await saveAdminAgent(targetId, payload);

    if (res.error) {
      setError(res.error.message || 'Failed to save Agent');
      setSaveStatus('error');
    } else {
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
      if (isNew && res.data?.id) {
        navigate(`/admin/agents/${res.data.id}`);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-card text-center py-5 text-muted">
        <div className="spinner-border text-success mb-3" role="status"></div>
        <div>Loading agent details...</div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{isNew ? 'New AI Agent — Admin CMS' : `Edit: ${formData.name || 'Agent'} — Admin CMS`}</title>
      </Helmet>

      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/agents" className="text-muted small text-decoration-none mb-1 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Agents Directory
          </Link>
          <h2 className="fs-4 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isNew ? 'Create New AI Agent' : `Edit: ${formData.name || 'AI Agent'}`}
          </h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!isNew && (
            <Link
              to={`/agents/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
            >
              <i className="bi bi-eye"></i> Preview Public
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span> Saving...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-check"></i> Save Agent
              </>
            )}
          </button>
        </div>
      </div>

      {saveStatus === 'saved' && (
        <div className="admin-alert admin-alert-success mb-4">
          <i className="bi bi-check-circle-fill"></i>
          <div>Agent and case study sections saved successfully.</div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Main Grid: Settings & Case Study Sections */}
      <div className="row g-4">
        {/* Left Column: Core Agent Settings */}
        <div className="col-lg-5">
          <div className="admin-card mb-4">
            <h3 className="fs-5 fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Core Metadata</h3>

            <div className="mb-3">
              <label className="form-label small fw-bold">Agent Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                required
                className="form-control admin-input"
                placeholder="e.g. Naïm Copilot"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleFieldChange}
                required
                className="form-control admin-input font-monospace"
                placeholder="e.g. naim-copilot"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Short Description (Kicker/Lead) *</label>
              <textarea
                name="short_description"
                rows="2"
                value={formData.short_description}
                onChange={handleFieldChange}
                className="form-control admin-input"
                placeholder="Brief summary of agent purpose..."
              ></textarea>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label small fw-bold">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFieldChange}
                  className="form-control admin-input"
                  placeholder="Conversational Agent"
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-bold">Workflow Platform</label>
                <input
                  type="text"
                  name="workflow_platform"
                  value={formData.workflow_platform}
                  onChange={handleFieldChange}
                  className="form-control admin-input"
                  placeholder="n8n"
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label small fw-bold">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFieldChange}
                  className="form-select admin-input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-bold">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleFieldChange}
                  className="form-control admin-input"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Tools / Tech Stack (comma-separated)</label>
              <input
                type="text"
                value={toolsInput}
                onChange={handleToolsChange}
                className="form-control admin-input"
                placeholder="n8n, Google Gemini, PostgreSQL, Telegram"
              />
            </div>

            <div className="form-check form-switch mb-3">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleFieldChange}
                className="form-check-input"
              />
              <label htmlFor="is_featured" className="form-check-label small fw-bold">
                Feature on Public Agents Hub
              </label>
            </div>
          </div>

          {/* Demo & Repository Card */}
          <div className="admin-card mb-4">
            <h3 className="fs-5 fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Demo & Repository</h3>

            <div className="mb-3">
              <label className="form-label small fw-bold">Demo Type</label>
              <select
                name="demo_type"
                value={formData.demo_type}
                onChange={handleFieldChange}
                className="form-select admin-input"
              >
                <option value="none">None (Case Study Only)</option>
                <option value="internal">Internal Route (e.g. /copilot)</option>
                <option value="external">External Link</option>
                <option value="embedded">Embedded Safe Widget</option>
              </select>
            </div>

            {formData.demo_type !== 'none' && (
              <div className="mb-3">
                <label className="form-label small fw-bold">Demo URL / Route</label>
                <input
                  type="text"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleFieldChange}
                  className="form-control admin-input font-monospace"
                  placeholder="/copilot or https://..."
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-bold">GitHub URL</label>
              <input
                type="url"
                name="github_url"
                value={formData.github_url}
                onChange={handleFieldChange}
                className="form-control admin-input font-monospace"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Visual Case Study Sections & Blocks */}
        <div className="col-lg-7">
          <div className="admin-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="fs-5 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Case Study Sections
                </h3>
                <p className="text-muted small mb-0">
                  Build the step-by-step breakdown (Hero, Problem, Workflow, Demo, Technology).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSectionOpen(true)}
                className="admin-btn admin-btn-secondary"
              >
                <i className="bi bi-plus-lg"></i> Add Section
              </button>
            </div>

            <SectionList
              sections={sections}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              onDeleteSection={handleDeleteSection}
              onReorderSections={handleReorderSections}
            />
          </div>
        </div>
      </div>

      {/* Section Drawer for editing blocks inside selected section */}
      {activeSection && (
        <SectionDrawer
          section={activeSection}
          onClose={() => setActiveSection(null)}
          onUpdateSection={handleUpdateSection}
        />
      )}

      {/* Add Section Modal */}
      {isAddSectionOpen && (
        <AddSectionModal
          isOpen={isAddSectionOpen}
          onClose={() => setIsAddSectionOpen(false)}
          onAddSection={handleAddSection}
        />
      )}
    </div>
  );
}
