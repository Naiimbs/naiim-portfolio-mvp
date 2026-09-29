import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAdminAgentById, saveAdminAgent } from '../../services/agents';
import {
  getAdminMCPConnections,
  getAgentRuntimeConfig,
  saveAgentRuntimeConfig,
} from '../../services/agentRuntime';
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

  // MCP Connections & Runtime State
  const [mcpConnections, setMcpConnections] = useState([]);
  const [runtimeConfig, setRuntimeConfig] = useState({
    runtime_type: 'none',
    mcp_connection_id: '',
    default_tool: 'ask_copilot_assistant',
    allowed_tools: ['ask_copilot_assistant', 'search_projects', 'query_knowledge_base', 'get_copilot_summary'],
    timeout_ms: 30000,
    max_input_length: 1000,
    is_enabled: false,
  });
  const [allowedToolsInput, setAllowedToolsInput] = useState('ask_copilot_assistant, search_projects, query_knowledge_base, get_copilot_summary');
  const [testingRuntime, setTestingRuntime] = useState(false);
  const [runtimeTestResult, setRuntimeTestResult] = useState(null);

  // Drawer / Modals
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null); // 'thumbnail' | 'hero'

  useEffect(() => {
    loadConnections();
    if (!isNew) {
      loadAgent();
    }
  }, [id]);

  async function loadConnections() {
    const res = await getAdminMCPConnections();
    if (res.data) {
      setMcpConnections(res.data);
    }
  }

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

      // Load Runtime Configuration
      if (a.id) {
        const rRes = await getAgentRuntimeConfig(a.id);
        if (rRes.data) {
          const r = rRes.data;
          setRuntimeConfig({
            runtime_type: r.runtime_type || 'none',
            mcp_connection_id: r.mcp_connection_id || '',
            default_tool: r.default_tool || 'ask_copilot_assistant',
            allowed_tools: Array.isArray(r.allowed_tools) ? r.allowed_tools : [],
            timeout_ms: r.timeout_ms || 30000,
            max_input_length: r.max_input_length || 1000,
            is_enabled: Boolean(r.is_enabled),
          });
          setAllowedToolsInput((r.allowed_tools || []).join(', '));
        }
      }
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

  const handleRuntimeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRuntimeConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setIsDirty(true);
  };

  const handleAllowedToolsChange = (e) => {
    setAllowedToolsInput(e.target.value);
    const parsed = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
    setRuntimeConfig((prev) => ({ ...prev, allowed_tools: parsed }));
    setIsDirty(true);
  };

  const handleTestAgentRuntime = async () => {
    const matchedConn = mcpConnections.find((c) => c.id === runtimeConfig.mcp_connection_id);
    const connKey = matchedConn?.connection_key || 'n8n-main';

    setTestingRuntime(true);
    setRuntimeTestResult(null);

    try {
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      setRuntimeTestResult(data);
    } catch (err) {
      setRuntimeTestResult({
        success: false,
        status: 'error',
        error: { message: err.message || 'Failed to execute test' },
      });
    } finally {
      setTestingRuntime(false);
    }
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
      const savedAgentId = res.data?.id || targetId;

      // Save Runtime Configuration
      if (savedAgentId) {
        await saveAgentRuntimeConfig(savedAgentId, runtimeConfig);
      }

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

          {/* Runtime & MCP Configuration Card */}
          <div className="admin-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Runtime & MCP Connection
              </h3>
              <button
                type="button"
                onClick={handleTestAgentRuntime}
                disabled={testingRuntime || runtimeConfig.runtime_type !== 'mcp'}
                className="admin-btn admin-btn-secondary py-1 px-2 small"
                title="Test Bound MCP Connection"
              >
                {testingRuntime ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <>
                    <i className="bi bi-broadcast"></i> Test MCP
                  </>
                )}
              </button>
            </div>

            {runtimeTestResult && (
              <div
                className={`admin-alert ${
                  runtimeTestResult.status === 'connected'
                    ? 'admin-alert-success'
                    : runtimeTestResult.status === 'not_configured'
                    ? 'admin-alert-warning'
                    : 'admin-alert-error'
                } mb-3`}
              >
                <div className="small w-100">
                  <div className="fw-bold mb-1">
                    {runtimeTestResult.status === 'connected' && '✓ MCP Server Active & Reachable'}
                    {runtimeTestResult.status === 'not_configured' && '⚠ Connection Key Not Configured on Server'}
                    {runtimeTestResult.status === 'unavailable' && '✕ Upstream MCP Server Unreachable'}
                    {runtimeTestResult.status === 'error' && '✕ Test Failed'}
                  </div>
                  {runtimeTestResult.tools && (
                    <div className="mt-1">
                      Tools: <code>{runtimeTestResult.tools.map((t) => t.name).join(', ')}</code>
                    </div>
                  )}
                  {runtimeTestResult.error && (
                    <div className="text-danger mt-1">{runtimeTestResult.error.message}</div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-bold">Runtime Type</label>
              <select
                name="runtime_type"
                value={runtimeConfig.runtime_type}
                onChange={handleRuntimeChange}
                className="form-select admin-input"
              >
                <option value="none">None / Scheduled Cron Pipeline</option>
                <option value="mcp">Model Context Protocol (MCP)</option>
              </select>
            </div>

            {runtimeConfig.runtime_type === 'mcp' && (
              <>
                <div className="mb-3">
                  <label className="form-label small fw-bold">MCP Connection</label>
                  <select
                    name="mcp_connection_id"
                    value={runtimeConfig.mcp_connection_id || ''}
                    onChange={handleRuntimeChange}
                    className="form-select admin-input"
                  >
                    <option value="">-- Select Connection --</option>
                    {mcpConnections.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {conn.name} ({conn.connection_key})
                      </option>
                    ))}
                  </select>
                  {mcpConnections.length === 0 && (
                    <div className="form-text small text-muted">
                      No MCP connections found. <Link to="/admin/mcp-connections/new">Add a connection</Link>.
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Default Tool Name</label>
                  <input
                    type="text"
                    name="default_tool"
                    value={runtimeConfig.default_tool || ''}
                    onChange={handleRuntimeChange}
                    className="form-control admin-input font-monospace"
                    placeholder="e.g. ask_copilot_assistant"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Allowed Tools (comma-separated)</label>
                  <input
                    type="text"
                    value={allowedToolsInput}
                    onChange={handleAllowedToolsChange}
                    className="form-control admin-input font-monospace"
                    placeholder="ask_copilot_assistant, search_projects, query_knowledge_base"
                  />
                  <div className="form-text small text-muted">
                    Only tools listed here can be invoked by the public gateway.
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Timeout (ms)</label>
                    <input
                      type="number"
                      name="timeout_ms"
                      value={runtimeConfig.timeout_ms}
                      onChange={handleRuntimeChange}
                      className="form-control admin-input font-monospace"
                      placeholder="30000"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Max Input (chars)</label>
                    <input
                      type="number"
                      name="max_input_length"
                      value={runtimeConfig.max_input_length}
                      onChange={handleRuntimeChange}
                      className="form-control admin-input font-monospace"
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    type="checkbox"
                    id="is_enabled"
                    name="is_enabled"
                    checked={runtimeConfig.is_enabled}
                    onChange={handleRuntimeChange}
                    className="form-check-input"
                  />
                  <label htmlFor="is_enabled" className="form-check-label small fw-bold">
                    Enable Live Interactive Execution
                  </label>
                </div>
              </>
            )}
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
