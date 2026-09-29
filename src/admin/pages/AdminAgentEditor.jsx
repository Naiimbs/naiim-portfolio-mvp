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
  const [discoveredTools, setDiscoveredTools] = useState([]);
  const [runtimeConfig, setRuntimeConfig] = useState({
    runtime_type: 'none',
    mcp_connection_id: '',
    default_tool: 'search_projects',
    allowed_tools: [
      'search_projects',
      'search_workflows',
      'search_nodes',
      'get_workflow_best_practices',
      'ask_copilot_assistant',
      'query_knowledge_base',
      'get_copilot_summary',
    ],
    timeout_ms: 30000,
    max_input_length: 1000,
    is_enabled: false,
  });

  // Connection & Agent Testing States
  const [connectionStatus, setConnectionStatus] = useState('untested'); // 'untested' | 'connected' | 'not_configured' | 'unavailable'
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingAgent, setTestingAgent] = useState(false);
  const [agentTestResult, setAgentTestResult] = useState(null);

  // Drawer / Modals
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);

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
            default_tool: r.default_tool || 'search_projects',
            allowed_tools: Array.isArray(r.allowed_tools) ? r.allowed_tools : [],
            timeout_ms: r.timeout_ms || 30000,
            max_input_length: r.max_input_length || 1000,
            is_enabled: Boolean(r.is_enabled),
          });
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

  // Tool Selection Toggle
  const handleToggleTool = (toolName) => {
    setRuntimeConfig((prev) => {
      const exists = prev.allowed_tools.includes(toolName);
      const updated = exists
        ? prev.allowed_tools.filter((t) => t !== toolName)
        : [...prev.allowed_tools, toolName];

      // If removed default tool, pick first available
      let defTool = prev.default_tool;
      if (exists && defTool === toolName) {
        defTool = updated.length > 0 ? updated[0] : '';
      }

      return {
        ...prev,
        allowed_tools: updated,
        default_tool: defTool,
      };
    });
    setIsDirty(true);
  };

  // Live Test Connection Handshake & Tool Discovery
  const handleTestConnection = async () => {
    const matchedConn = mcpConnections.find((c) => c.id === runtimeConfig.mcp_connection_id);
    const connKey = matchedConn?.connection_key || 'n8n-main';

    setTestingConnection(true);

    try {
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      setConnectionStatus(data.status || 'unavailable');
      if (data.tools && data.tools.length > 0) {
        setDiscoveredTools(data.tools);
      }
    } catch {
      setConnectionStatus('unavailable');
    } finally {
      setTestingConnection(false);
    }
  };

  // Live Test Agent Execution
  const handleTestAgent = async () => {
    const targetSlug = formData.slug || 'naim-copilot';
    setTestingAgent(true);
    setAgentTestResult(null);

    try {
      const res = await fetch(`/api/agents/${targetSlug}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: 'Give me a short summary of what this agent can do.',
          tool: runtimeConfig.default_tool,
        }),
      });

      const data = await res.json();
      setAgentTestResult({
        success: data.success,
        data: data.data,
        error: data.error,
        tool: runtimeConfig.default_tool,
      });
    } catch (err) {
      setAgentTestResult({
        success: false,
        error: { message: err.message || 'Network exception during test' },
      });
    } finally {
      setTestingAgent(false);
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

    // Validation: Default tool must be included in allowed_tools if MCP is active
    if (
      runtimeConfig.runtime_type === 'mcp' &&
      runtimeConfig.default_tool &&
      !runtimeConfig.allowed_tools.includes(runtimeConfig.default_tool)
    ) {
      setError(`Validation Error: Default tool "${runtimeConfig.default_tool}" must be enabled in Allowed Tools.`);
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setError(null);

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

  // Available Tools Pool (Discovered tools + default fallback list)
  const defaultKnownTools = [
    { name: 'ask_copilot_assistant', description: 'Answers portfolio, skills, and background questions.' },
    { name: 'search_projects', description: 'Performs semantic vector search across portfolio case studies.' },
    { name: 'query_knowledge_base', description: 'Queries deep background information and architecture notes.' },
    { name: 'get_copilot_summary', description: 'Generates structured executive summaries.' },
  ];

  const effectiveToolsPool = discoveredTools.length > 0 ? discoveredTools : defaultKnownTools;
  const activeConnection = mcpConnections.find((c) => c.id === runtimeConfig.mcp_connection_id);

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
          <div>Agent and runtime configuration saved successfully.</div>
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
        {/* Left Column: Core Settings & 3-Step Runtime Builder */}
        <div className="col-lg-5">
          {/* Metadata Card */}
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

          {/* Demo & Presentation Card */}
          <div className="admin-card mb-4">
            <h3 className="fs-5 fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Demo & Presentation</h3>

            <div className="mb-3">
              <label className="form-label small fw-bold">Demo Type</label>
              <select
                name="demo_type"
                value={formData.demo_type}
                onChange={handleFieldChange}
                className="form-select admin-input"
              >
                <option value="none">None (Case Study Only)</option>
                <option value="internal">Internal Route (e.g. /agents/:slug/demo)</option>
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
                  placeholder="/agents/naim-copilot/demo"
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

          {/* ========================================================================= */}
          {/* VISUAL AGENT RUNTIME BUILDER (Phase 14.3.1) */}
          {/* ========================================================================= */}
          <div className="admin-card mb-4 border-2 border-success-subtle">
            {/* Runtime Header & Live Summary Card */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fs-5 fw-bold mb-0 text-dark" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <i className="bi bi-cpu-fill text-success me-2"></i> Agent Runtime Builder
              </h3>
              <span className={`badge ${runtimeConfig.is_enabled ? 'bg-success' : 'bg-secondary'}`}>
                {runtimeConfig.is_enabled ? 'Runtime Active' : 'Runtime Inactive'}
              </span>
            </div>

            {/* Runtime Summary Box */}
            <div className="p-3 mb-4 rounded bg-light border">
              <div className="fw-bold small text-dark mb-2 text-uppercase tracking-wider">
                <i className="bi bi-info-circle me-1"></i> Runtime Summary
              </div>
              <div className="row g-2 small">
                <div className="col-6">
                  <span className="text-muted">Runtime:</span>{' '}
                  <strong className="text-dark">{runtimeConfig.runtime_type === 'mcp' ? 'MCP' : 'None'}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted">Connection:</span>{' '}
                  <strong className="text-dark font-monospace">{activeConnection?.connection_key || 'None'}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted">Tools:</span>{' '}
                  <strong className="text-dark">{runtimeConfig.allowed_tools.length} enabled</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted">Default Tool:</span>{' '}
                  <strong className="text-dark font-monospace text-truncate d-inline-block" style={{ maxWidth: '120px' }}>
                    {runtimeConfig.default_tool || 'None'}
                  </strong>
                </div>
                <div className="col-6">
                  <span className="text-muted">Live Demo:</span>{' '}
                  <strong className="text-dark">{runtimeConfig.is_enabled ? 'Enabled' : 'Disabled'}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted">Status:</span>{' '}
                  <span className="badge bg-light text-dark border">
                    {connectionStatus === 'connected' ? '🟢 Connected' : connectionStatus === 'not_configured' ? '🟡 Missing Secret' : '⚪ Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 01: Runtime Selection */}
            <div className="mb-4 pb-3 border-bottom">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-dark rounded-pill">STEP 01</span>
                <span className="fw-bold small">Runtime Engine</span>
              </div>

              <div className="btn-group w-100 mb-2" role="group">
                <button
                  type="button"
                  onClick={() => setRuntimeConfig((prev) => ({ ...prev, runtime_type: 'none', is_enabled: false }))}
                  className={`btn btn-sm ${runtimeConfig.runtime_type === 'none' ? 'btn-dark' : 'btn-outline-secondary'}`}
                >
                  None (Static / Background)
                </button>
                <button
                  type="button"
                  onClick={() => setRuntimeConfig((prev) => ({ ...prev, runtime_type: 'mcp' }))}
                  className={`btn btn-sm ${runtimeConfig.runtime_type === 'mcp' ? 'btn-success' : 'btn-outline-secondary'}`}
                >
                  <i className="bi bi-hdd-network me-1"></i> Model Context Protocol (MCP)
                </button>
              </div>
              <div className="small text-muted">
                {runtimeConfig.runtime_type === 'mcp'
                  ? '✓ MCP Runtime enabled. Connects to n8n HTTP MCP server to query vector tools.'
                  : 'This agent operates as a background workflow or documented case study without live interactive execution.'}
              </div>
            </div>

            {runtimeConfig.runtime_type === 'mcp' && (
              <>
                {/* STEP 02: Connection Selection */}
                <div className="mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark rounded-pill">STEP 02</span>
                      <span className="fw-bold small">MCP Connection</span>
                    </div>
                    <Link to="/admin/mcp-connections" className="small text-decoration-none">
                      Manage Connections <i className="bi bi-box-arrow-up-right"></i>
                    </Link>
                  </div>

                  <select
                    name="mcp_connection_id"
                    value={runtimeConfig.mcp_connection_id || ''}
                    onChange={handleRuntimeChange}
                    className="form-select admin-input mb-2"
                  >
                    <option value="">-- Select Registered MCP Connection --</option>
                    {mcpConnections.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {conn.name} ({conn.connection_key})
                      </option>
                    ))}
                  </select>

                  {/* Connection Status Indicator & Test Button */}
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light border small">
                    <div>
                      <span className="text-muted me-1">Status:</span>
                      {connectionStatus === 'connected' && <span className="text-success fw-bold">🟢 Connected</span>}
                      {connectionStatus === 'untested' && <span className="text-secondary fw-bold">🟡 Not Tested</span>}
                      {connectionStatus === 'not_configured' && <span className="text-warning fw-bold">⚪ Not Configured (.env)</span>}
                      {connectionStatus === 'unavailable' && <span className="text-danger fw-bold">🔴 Unavailable</span>}
                    </div>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || !runtimeConfig.mcp_connection_id}
                      className="btn btn-sm btn-outline-dark py-0 px-2 small"
                    >
                      {testingConnection ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <>
                          <i className="bi bi-broadcast me-1"></i> Test Connection
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* STEP 03: Tools Selection & Discovery */}
                <div className="mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark rounded-pill">STEP 03</span>
                      <span className="fw-bold small">Available Tools</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="btn btn-sm btn-link text-decoration-none p-0 small"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i> Refresh Tools
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-3">
                    {effectiveToolsPool.map((tool) => {
                      const isAllowed = runtimeConfig.allowed_tools.includes(tool.name);
                      return (
                        <div
                          key={tool.name}
                          onClick={() => handleToggleTool(tool.name)}
                          className={`p-2 rounded border cursor-pointer d-flex align-items-start gap-2 ${
                            isAllowed ? 'bg-success-subtle border-success' : 'bg-light border-light-subtle'
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {}}
                            className="form-check-input mt-1"
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold font-monospace small">{tool.name}</span>
                              {tool.name === runtimeConfig.default_tool && (
                                <span className="badge bg-success text-white small" style={{ fontSize: '0.65rem' }}>
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            {tool.description && <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{tool.description}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Default Tool Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Default Tool</label>
                    <select
                      name="default_tool"
                      value={runtimeConfig.default_tool || ''}
                      onChange={handleRuntimeChange}
                      className="form-select admin-input font-monospace"
                    >
                      <option value="">-- Choose Default Tool --</option>
                      {runtimeConfig.allowed_tools.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {runtimeConfig.default_tool && !runtimeConfig.allowed_tools.includes(runtimeConfig.default_tool) && (
                      <div className="text-danger small mt-1">Default tool must be enabled in Allowed Tools.</div>
                    )}
                  </div>
                </div>

                {/* Execution Settings */}
                <div className="mb-3">
                  <div className="fw-bold small mb-2 text-uppercase tracking-wider">Execution Controls</div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small">Timeout (5–60s)</label>
                      <input
                        type="number"
                        name="timeout_ms"
                        value={runtimeConfig.timeout_ms / 1000}
                        onChange={(e) =>
                          setRuntimeConfig((prev) => ({
                            ...prev,
                            timeout_ms: Math.max(5000, Math.min(60000, Number(e.target.value) * 1000)),
                          }))
                        }
                        className="form-control admin-input font-monospace"
                        min="5"
                        max="60"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Max Input (100–5000)</label>
                      <input
                        type="number"
                        name="max_input_length"
                        value={runtimeConfig.max_input_length}
                        onChange={handleRuntimeChange}
                        className="form-control admin-input font-monospace"
                        min="100"
                        max="5000"
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
                      Live Demo Execution Enabled
                    </label>
                  </div>
                </div>

                {/* Test Agent Action */}
                <div className="pt-2 border-top">
                  <button
                    type="button"
                    onClick={handleTestAgent}
                    disabled={testingAgent || !runtimeConfig.is_enabled}
                    className="btn btn-sm btn-dark w-100 py-2 fw-bold"
                  >
                    {testingAgent ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span> Executing Live Agent Test...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle-fill me-1"></i> Test Agent (Query Live Copilot)
                      </>
                    )}
                  </button>

                  {agentTestResult && (
                    <div className="mt-3 p-3 rounded bg-white border small">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-dark">Agent Test Result</strong>
                        <span className={`badge ${agentTestResult.success ? 'bg-success' : 'bg-danger'}`}>
                          {agentTestResult.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="text-muted font-monospace mb-2" style={{ fontSize: '0.72rem' }}>
                        Tool: {agentTestResult.tool} · Duration: {agentTestResult.data?.durationMs || 0}ms
                      </div>
                      <div
                        className="p-2 rounded bg-light border font-monospace text-dark"
                        style={{ whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}
                      >
                        {agentTestResult.data?.answer || agentTestResult.error?.message || 'No response returned.'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Case Study Sections */}
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

      {/* Section Drawer */}
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
