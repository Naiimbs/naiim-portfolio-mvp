import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getAdminMCPConnectionById,
  saveAdminMCPConnection,
} from '../../services/agentRuntime';
import OAuthCredentialsImporter from '../components/mcp/OAuthCredentialsImporter';

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

  // Sensitive rotation fields (never loaded from server)
  const [newToken, setNewToken] = useState('');
  const [newClientSecret, setNewClientSecret] = useState('');
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [importedOAuthSummary, setImportedOAuthSummary] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    provider: 'n8n',
    transport: 'http',
    auth_type: 'bearer',
    connection_key: 'n8n-main',
    server_url: '',
    server_url_hint: '',
    description: '',
    status: 'active',
    is_active: true,
    metadata: {
      client_id: '',
      authorization_url: '',
      token_url: '',
      scopes: '',
      redirect_uri: '',
    },
  });

  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/oauth/callback`
    : 'http://localhost:5173/api/oauth/callback';

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
      const meta = c.metadata || {};
      setFormData({
        name: c.name || '',
        slug: c.slug || '',
        provider: c.provider || 'n8n',
        transport: c.transport || 'http',
        auth_type: c.auth_type || 'bearer',
        connection_key: c.connection_key || 'n8n-main',
        server_url: c.server_url || '',
        server_url_hint: c.server_url || '',
        description: c.description || '',
        status: c.status || 'active',
        is_active: c.is_active !== false,
        metadata: {
          client_id: meta.client_id || '',
          authorization_url: meta.authorization_url || '',
          token_url: meta.token_url || '',
          scopes: meta.scopes || '',
          redirect_uri: meta.redirect_uri || redirectUri,
        },
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

  const handleMetadataChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }));
  };

  const handleProviderPreset = (providerVal) => {
    setFormData((prev) => {
      const next = { ...prev, provider: providerVal };
      if (providerVal === 'gmail') {
        next.auth_type = 'oauth2';
        next.metadata = {
          ...next.metadata,
          authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth',
          token_url: 'https://oauth2.googleapis.com/token',
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          redirect_uri: redirectUri,
        };
      }
      return next;
    });
  };

  const handleTestConnection = async () => {
    const url = (formData.server_url || '').trim();
    if (!url) {
      setTestResult({
        ok: false,
        success: false,
        status: 'not_configured',
        error: {
          code: 'MCP_NOT_CONFIGURED',
          message: 'MCP server URL is not configured.',
          reason: 'MCP server URL has not been configured yet. Note: Google Cloud OAuth authorizes API access, but an MCP Server URL is required to expose tools to naiimOS.',
        },
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const connKey = formData.connection_key || 'n8n-main';
      const body = {
        serverUrl: url,
      };
      if (newToken.trim()) {
        body.accessToken = newToken.trim();
      }

      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleConnectOAuth = async () => {
    setOauthConnecting(true);
    try {
      // 1. Save credentials server-side first
      await fetch(`/api/admin/mcp-connections/${formData.connection_key}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: formData.server_url || formData.server_url_hint,
          authType: 'oauth2',
          clientId: formData.metadata.client_id,
          clientSecret: newClientSecret.trim() || undefined,
          authorizationUrl: formData.metadata.authorization_url,
          tokenUrl: formData.metadata.token_url,
          scopes: formData.metadata.scopes,
          redirectUri: formData.metadata.redirect_uri || redirectUri,
        }),
      });

      // 2. Request authorization URL
      const res = await fetch(`/api/admin/mcp-connections/${formData.connection_key}/oauth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationUrl: formData.metadata.authorization_url,
          clientId: formData.metadata.client_id,
          scopes: formData.metadata.scopes,
          redirectUri: formData.metadata.redirect_uri || redirectUri,
        }),
      });

      const data = await res.json();
      if (!data.ok || !data.authorizeUrl) {
        throw new Error(data.error?.message || 'Could not initiate OAuth authorization.');
      }

      window.open(data.authorizeUrl, 'mcp_oauth_auth_window', 'width=600,height=700');
    } catch (err) {
      alert(`OAuth authorization error: ${err.message}`);
    } finally {
      setOauthConnecting(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveStatus('saving');

    const targetUrl = (formData.server_url || '').trim();
    const targetId = isNew ? null : id;

    const payload = {
      ...formData,
      server_url: targetUrl,
      server_url_hint: targetUrl,
    };

    const res = await saveAdminMCPConnection(targetId, payload);

    if (res.error) {
      setError(res.error.message || 'Failed to save MCP connection');
      setSaveStatus('error');
    } else {
      // Persist credentials server-side
      try {
        const credsBody = {
          serverUrl: targetUrl,
          authType: formData.auth_type,
        };

        if (formData.auth_type === 'bearer' && newToken.trim()) {
          credsBody.accessToken = newToken.trim();
        } else if (formData.auth_type === 'oauth2') {
          credsBody.clientId = formData.metadata.client_id;
          if (newClientSecret.trim()) credsBody.clientSecret = newClientSecret.trim();
          credsBody.authorizationUrl = formData.metadata.authorization_url;
          credsBody.tokenUrl = formData.metadata.token_url;
          credsBody.scopes = formData.metadata.scopes;
          credsBody.redirectUri = formData.metadata.redirect_uri || redirectUri;
        }

        await fetch(`/api/admin/mcp-connections/${formData.connection_key}/credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credsBody),
        });

        // Clear sensitive inputs
        setNewToken('');
        setNewClientSecret('');
      } catch {
        // Non-blocking
      }

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
              {testResult.status === 'not_configured' && '○ MCP Server URL Not Configured'}
              {testResult.status === 'unavailable' && '✕ Upstream MCP Server Unreachable'}
              {testResult.status === 'error' && '✕ Diagnostic Request Failed'}
            </div>

            <div className="small mb-2">
              Status: <strong>{testResult.status}</strong>
              {testResult.latencyMs !== undefined && ` · Latency: ${testResult.latencyMs}ms`}
              {testResult.serverInfo && ` · Server: ${testResult.serverInfo.name} (${testResult.serverInfo.version})`}
            </div>

            {testResult.tools && (
              <div className="mt-3">
                <div className="fw-bold small text-dark mb-2">
                  Discovered Live Tools ({testResult.toolsCount}):
                </div>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {testResult.tools.map((t) => (
                    <div key={t.name} className="p-2 bg-white rounded border small">
                      <div className="fw-bold font-monospace text-primary">{t.name}</div>
                      {t.description && <div className="text-muted">{t.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResult.error && (
              <div className="small text-danger mt-2">{testResult.error.reason || testResult.error.message}</div>
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
                  onChange={(e) => handleProviderPreset(e.target.value)}
                  className="form-select admin-input"
                >
                  <option value="n8n">n8n Workflow Platform</option>
                  <option value="custom">Custom MCP HTTP Server</option>
                  <option value="gmail">Gmail</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Transport</label>
                <select
                  name="transport"
                  value={formData.transport}
                  onChange={handleFieldChange}
                  className="form-select admin-input"
                >
                  <option value="http">HTTP (SSE / Stream / JSON-RPC)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Authentication Type</label>
                <select
                  name="auth_type"
                  value={formData.auth_type}
                  onChange={handleFieldChange}
                  className="form-select admin-input"
                >
                  <option value="bearer">Bearer Token</option>
                  <option value="oauth2">OAuth 2.0</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">
                Connection Key (Server Secret Resolver) *
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
                Maps to server environment secrets. Tokens and client secrets remain server-side.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Server URL (Endpoint)</label>
              <input
                type="text"
                name="server_url"
                value={formData.server_url || formData.server_url_hint}
                onChange={(e) => {
                  handleFieldChange(e);
                  setFormData((prev) => ({ ...prev, server_url_hint: e.target.value }));
                }}
                className="form-control admin-input font-monospace"
                placeholder="https://your-instance.n8n.cloud/mcp-server/http"
              />
            </div>

            {/* BEARER AUTH SECTION */}
            {formData.auth_type === 'bearer' && (
              <div className="mb-3 p-3 bg-light rounded border">
                <label className="form-label small fw-bold">Access Token</label>
                <div className="p-2 rounded bg-white border small font-monospace d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">••••••••••••</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    <i className="bi bi-shield-lock-fill me-1"></i> Configured (Server-Side)
                  </span>
                </div>
                <input
                  type="password"
                  className="form-control admin-input font-monospace"
                  placeholder="Enter new token only if you wish to rotate it"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* OAUTH 2.0 SECTION */}
            {formData.auth_type === 'oauth2' && (
              <div className="mb-3 p-3 bg-light rounded border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="small fw-bold text-dark">OAuth 2.0 Settings</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleConnectOAuth}
                    disabled={oauthConnecting}
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Connect / Reauthorize OAuth
                  </button>
                </div>

                {/* Generic OAuth JSON Importer */}
                <OAuthCredentialsImporter
                  onImport={(normalized) => {
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        client_id: normalized.clientId,
                        authorization_url: normalized.authorizationUrl,
                        token_url: normalized.tokenUrl,
                        redirect_uris: normalized.redirectUris,
                        app_type: normalized.appType,
                      },
                    }));
                    setNewClientSecret(normalized.clientSecret);
                    setImportedOAuthSummary({
                      appType: normalized.appType,
                      clientId: normalized.clientId,
                      redirectUrisCount: normalized.redirectUris.length,
                      format: normalized.format,
                    });
                  }}
                  importedSummary={importedOAuthSummary}
                  onClearImport={() => {
                    setImportedOAuthSummary(null);
                    setNewClientSecret('');
                  }}
                  disabled={oauthConnecting}
                />

                <div className="mb-2">
                  <label className="form-label small fw-bold">Client ID</label>
                  <input
                    type="text"
                    className="form-control form-control-sm admin-input font-monospace"
                    value={formData.metadata.client_id || ''}
                    onChange={(e) => handleMetadataChange('client_id', e.target.value)}
                    placeholder="Enter Client ID"
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-bold">Client Secret</label>
                  <input
                    type="password"
                    className="form-control form-control-sm admin-input font-monospace"
                    value={newClientSecret}
                    onChange={(e) => setNewClientSecret(e.target.value)}
                    placeholder="Enter Client Secret to rotate/update"
                    autoComplete="new-password"
                  />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Authorization URL</label>
                    <input
                      type="url"
                      className="form-control form-control-sm admin-input font-monospace"
                      value={formData.metadata.authorization_url || ''}
                      onChange={(e) => handleMetadataChange('authorization_url', e.target.value)}
                      placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Token URL</label>
                    <input
                      type="url"
                      className="form-control form-control-sm admin-input font-monospace"
                      value={formData.metadata.token_url || ''}
                      onChange={(e) => handleMetadataChange('token_url', e.target.value)}
                      placeholder="https://oauth2.googleapis.com/token"
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-bold">Scopes</label>
                  <input
                    type="text"
                    className="form-control form-control-sm admin-input font-monospace"
                    value={formData.metadata.scopes || ''}
                    onChange={(e) => handleMetadataChange('scopes', e.target.value)}
                    placeholder="e.g. https://www.googleapis.com/auth/gmail.readonly"
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-bold">Description</label>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleFieldChange}
                className="form-control admin-input"
                placeholder="Describe connection purpose or workflows..."
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
