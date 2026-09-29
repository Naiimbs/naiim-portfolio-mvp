import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getAdminMCPConnectionById,
  saveAdminMCPConnection,
} from '../../services/agentRuntime';

export default function AdminMCPConnectionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    provider: 'n8n',
    connection_key: 'n8n-main',
    server_url_hint: '',
    description: '',
    status: 'active',
    is_active: true,
  });

  useEffect(() => {
    if (!isNew) {
      loadConnection();
    }
  }, [id]);

  async function loadConnection() {
    setLoading(true);
    const res = await getAdminMCPConnectionById(id);
    if (res.data) {
      const c = res.data;
      setFormData({
        name: c.name || '',
        slug: c.slug || '',
        provider: c.provider || 'n8n',
        connection_key: c.connection_key || 'n8n-main',
        server_url_hint: c.server_url_hint || '',
        description: c.description || '',
        status: c.status || 'active',
        is_active: c.is_active !== false,
      });
    } else {
      setError(res.error?.message || 'Connection not found');
    }
    setLoading(false);
  }

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const connKey = formData.connection_key || 'n8n-main';
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        status: 'error',
        error: { message: err.message || 'Failed to connect to API server' },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveStatus('saving');

    const targetId = isNew ? null : id;
    const res = await saveAdminMCPConnection(targetId, formData);

    if (res.error) {
      setError(res.error.message || 'Failed to save MCP connection');
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
      if (isNew && res.data?.id) {
        navigate(`/admin/mcp-connections/${res.data.id}`);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-card text-center py-5 text-muted">
        <div className="spinner-border text-success mb-3" role="status"></div>
        <div>Loading connection details...</div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{isNew ? 'New MCP Connection — Admin CMS' : `Edit: ${formData.name} — Admin CMS`}</title>
      </Helmet>

      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/mcp-connections" className="text-muted small text-decoration-none mb-1 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to MCP Connections
          </Link>
          <h2 className="fs-4 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isNew ? 'Register New MCP Connection' : `Edit: ${formData.name || 'MCP Connection'}`}
          </h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !formData.connection_key}
            className="admin-btn admin-btn-secondary"
          >
            {testing ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span> Testing...
              </>
            ) : (
              <>
                <i className="bi bi-broadcast"></i> Test Connection
              </>
            )}
          </button>

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
                <i className="bi bi-cloud-check"></i> Save Connection
              </>
            )}
          </button>
        </div>
      </div>

      {saveStatus === 'saved' && (
        <div className="admin-alert admin-alert-success mb-4">
          <i className="bi bi-check-circle-fill"></i>
          <div>MCP connection configuration saved successfully.</div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Live Test Diagnostic Output */}
      {testResult && (
        <div
          className={`admin-alert ${
            testResult.status === 'connected'
              ? 'admin-alert-success'
              : testResult.status === 'not_configured'
              ? 'admin-alert-warning'
              : 'admin-alert-error'
          } mb-4`}
        >
          <div className="w-100">
            <div className="fw-bold mb-1">
              {testResult.status === 'connected' && '✓ Server Handshake Successful & Verified'}
              {testResult.status === 'not_configured' && '⚠ Connection Key Not Configured on Server'}
              {testResult.status === 'unavailable' && '✕ Upstream MCP Server Unreachable'}
              {testResult.status === 'error' && '✕ Diagnostic Request Failed'}
            </div>

            <div className="small mb-2">
              Status: <strong>{testResult.status}</strong>
              {testResult.info?.host && ` · Resolved Host: ${testResult.info.host}`}
              {testResult.info?.hasToken && ' · Access Token: (server-side configured)'}
            </div>

            {testResult.tools && (
              <div className="mt-3">
                <div className="fw-bold small text-dark mb-2">
                  Discovered Live Tools ({testResult.toolsCount}):
                </div>
                <div className="d-flex flex-column gap-2">
                  {testResult.tools.map((t) => (
                    <div key={t.name} className="p-2 bg-white rounded border small">
                      <div className="fw-bold font-monospace text-primary">{t.name}</div>
                      {t.description && <div className="text-muted">{t.description}</div>}
                      {t.parameters && t.parameters.length > 0 && (
                        <div className="text-secondary small mt-1">
                          Params: <code>{t.parameters.join(', ')}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResult.error && (
              <div className="small text-danger mt-2">{testResult.error.message}</div>
            )}
          </div>
        </div>
      )}

      {/* Form Fields Card */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="admin-card">
            <h3 className="fs-5 fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Connection Details
            </h3>

            <div className="mb-3">
              <label className="form-label small fw-bold">Connection Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                required
                className="form-control admin-input"
                placeholder="e.g. n8n Main Instance"
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleFieldChange}
                  required
                  className="form-control admin-input font-monospace"
                  placeholder="e.g. n8n-main"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Provider</label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleFieldChange}
                  className="form-select admin-input"
                >
                  <option value="n8n">n8n Workflow Platform</option>
                  <option value="custom">Custom MCP HTTP Server</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">
                Connection Key (Maps to Server Secret Resolver) *
              </label>
              <input
                type="text"
                name="connection_key"
                value={formData.connection_key}
                onChange={handleFieldChange}
                required
                className="form-control admin-input font-monospace"
                placeholder="e.g. n8n-main"
              />
              <div className="form-text small text-muted">
                The server looks up <code>N8N_MCP_SERVER_URL</code> and <code>N8N_MCP_ACCESS_TOKEN</code> in its environment for this key. Tokens are never stored in the database.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Server URL Hint (Non-Secret)</label>
              <input
                type="text"
                name="server_url_hint"
                value={formData.server_url_hint}
                onChange={handleFieldChange}
                className="form-control admin-input font-monospace"
                placeholder="https://n8n.example.com"
              />
              <div className="form-text small text-muted">
                Public/admin domain hint for reference. Do not put tokens or passwords in this URL.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Description</label>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleFieldChange}
                className="form-control admin-input"
                placeholder="Primary production n8n server hosting agent workflows..."
              ></textarea>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleFieldChange}
                className="form-check-input"
              />
              <label htmlFor="is_active" className="form-check-label small fw-bold">
                Active Connection (Allows Agents to bind to this endpoint)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
