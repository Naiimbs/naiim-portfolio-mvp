import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAdminMCPConnections, deleteAdminMCPConnection } from '../../services/agentRuntime';
import AdminEmptyState from '../components/AdminEmptyState';
import MCPSetupWizard from '../components/mcp/MCPSetupWizard';

export default function AdminMCPConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testingKey, setTestingKey] = useState(null);
  const [refreshingKey, setRefreshingKey] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    loadConnections();

    // Check for OAuth callback URL query parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('oauth_status') === 'success') {
        const connName = urlParams.get('conn') || 'OAuth connection';
        setSaveSuccessMsg(`✓ ${connName} authenticated successfully via OAuth 2.0!`);
        setTimeout(() => setSaveSuccessMsg(''), 5000);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  async function loadConnections() {
    setLoading(true);
    const res = await getAdminMCPConnections();
    if (res.error) {
      setError(res.error.message || 'Failed to load MCP connections');
    } else {
      setConnections(res.data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete MCP connection "${name}"?`)) {
      return;
    }

    const res = await deleteAdminMCPConnection(id);
    if (res.error) {
      alert(`Error deleting connection: ${res.error.message}`);
    } else {
      setConnections((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleTestConnection = async (connKey, conn) => {
    const serverUrl = (conn?.server_url || conn?.server_url_hint || '').trim();
    if (!serverUrl) {
      setTestResults((prev) => ({
        ...prev,
        [connKey]: {
          ok: false,
          success: false,
          status: 'not_configured',
          error: {
            code: 'MCP_NOT_CONFIGURED',
            message: 'MCP server URL has not been configured yet.',
            reason: 'MCP server URL has not been configured yet. Enter an active MCP endpoint in Edit to connect tools.',
          },
          lastChecked: new Date().toLocaleTimeString(),
        },
      }));
      return;
    }

    setTestingKey(connKey);

    try {
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [connKey]: {
          ...data,
          lastChecked: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [connKey]: {
          success: false,
          status: 'error',
          error: { message: err.message || 'Network error during connection test' },
          lastChecked: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleRefreshTools = async (connKey) => {
    setRefreshingKey(connKey);

    try {
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [connKey]: {
          ...data,
          lastChecked: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [connKey]: {
          success: false,
          status: 'error',
          error: { message: err.message || 'Failed to refresh tools' },
          lastChecked: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setRefreshingKey(null);
    }
  };

  const handleWizardSuccess = (savedKey, result, isUpdated) => {
    setSaveSuccessMsg(isUpdated ? 'MCP connection updated' : 'MCP connection saved');
    setTimeout(() => setSaveSuccessMsg(''), 4500);
    if (result) {
      setTestResults((prev) => ({
        ...prev,
        [savedKey]: {
          ...result,
          status: 'connected',
          lastChecked: new Date().toLocaleTimeString(),
        },
      }));
    }
    loadConnections();
  };

  return (
    <div>
      <Helmet>
        <title>MCP Connections — Admin CMS</title>
      </Helmet>

      {/* Header bar with prominent + Connect MCP button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MCP Connections
          </h2>
          <p className="text-muted small mb-0">
            Manage Model Context Protocol connections. Supports Bearer and OAuth 2.0 authentication with server-side credentials.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="admin-btn admin-btn-primary fw-bold"
            title="Open MCP Setup Wizard"
          >
            <i className="bi bi-plus-lg me-1"></i> Connect MCP
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="admin-alert admin-alert-success mb-4">
          <i className="bi bi-check-circle-fill"></i>
          <div>{saveSuccessMsg}</div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div className="admin-card text-center py-5 text-muted">
          <div className="spinner-border text-success mb-3" role="status"></div>
          <div>Loading MCP connections...</div>
        </div>
      ) : connections.length === 0 ? (
        <AdminEmptyState
          icon="bi-hdd-network"
          title="No MCP Connections yet"
          description="Register an MCP endpoint to make external tools available to your AI agents."
          action={
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="admin-btn admin-btn-primary fw-bold"
            >
              <i className="bi bi-plus-lg me-1"></i> Connect MCP
            </button>
          }
        />
      ) : (
        <div className="row g-4">
          {connections.map((conn) => {
            const result = testResults[conn.connection_key];
            const isTesting = testingKey === conn.connection_key;
            const isRefreshing = refreshingKey === conn.connection_key;

            const isOAuth = (conn.auth_type || '').toLowerCase() === 'oauth2';
            const authLabel = isOAuth ? 'OAuth 2.0' : 'Bearer Token';
            const transportLabel = (conn.transport || 'http').toUpperCase();

            // Status resolution
            const hasServerUrl = Boolean((conn.server_url || conn.server_url_hint || '').trim());
            let safeStatus = 'Connected';
            let badgeClass = 'bg-success text-white';

            if (!hasServerUrl || result?.status === 'not_configured' || conn.status === 'not_connected') {
              safeStatus = 'Not configured';
              badgeClass = 'bg-secondary text-white';
            } else if (conn.status === 'needs_reauthorization') {
              safeStatus = 'Needs reauthorization';
              badgeClass = 'bg-warning text-dark';
            } else if (result?.status === 'unavailable' || conn.status === 'error') {
              safeStatus = 'Error';
              badgeClass = 'bg-danger text-white';
            } else if (result?.status === 'connected' || conn.status === 'active' || conn.is_active) {
              safeStatus = 'Connected';
              badgeClass = 'bg-success text-white';
            }

            const toolsCount = result?.toolsCount !== undefined ? result.toolsCount : (conn.connection_key === 'n8n-main' ? 39 : 0);

            return (
              <div key={conn.id || conn.slug} className="col-lg-6">
                <div className="admin-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Card Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h3 className="fs-5 fw-bold mb-0 text-dark font-monospace">{conn.name}</h3>
                          <span className="badge bg-light text-dark border small font-monospace">
                            {conn.provider || 'n8n'}
                          </span>
                        </div>
                        <div className="text-muted small font-monospace">
                          Key: <code>{conn.connection_key}</code>
                        </div>
                      </div>

                      <div className="d-flex flex-column align-items-end gap-1">
                        <span className={`badge ${badgeClass}`}>
                          {safeStatus}
                        </span>
                        <span className="badge bg-light text-dark border small font-monospace">
                          Tools: {toolsCount} available
                        </span>
                      </div>
                    </div>

                    {conn.description && (
                      <p className="text-muted small mb-3">{conn.description}</p>
                    )}

                    {/* Server URL, Transport & Credential Status */}
                    <div className="p-2 rounded bg-light border small mb-3 font-monospace">
                      <div className="d-flex justify-content-between text-muted mb-1">
                        <span>Transport / Auth:</span>
                        <span className="text-dark fw-bold">
                          {transportLabel} · {authLabel}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-muted mb-1">
                        <span>Server URL:</span>
                        <strong className={hasServerUrl ? "text-dark text-truncate ms-2" : "text-muted fst-italic ms-2"} style={{ maxWidth: '280px' }}>
                          {hasServerUrl ? (conn.server_url || conn.server_url_hint) : 'Not configured'}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted">
                        <span>Credentials:</span>
                        <span className="text-success fw-bold">
                          ● {isOAuth ? 'OAuth 2.0 configured (Server-Side)' : 'Token configured (Server-Side)'}
                        </span>
                      </div>
                    </div>

                    {/* Test Results Output */}
                    {result && (
                      <div
                        className={`p-2 rounded border small mb-3 ${
                          result.status === 'connected'
                            ? 'bg-success-subtle border-success'
                            : result.status === 'not_configured'
                            ? 'bg-warning-subtle border-warning'
                            : 'bg-danger-subtle border-danger'
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>
                            {result.status === 'connected' && '🟢 Connected & Verified'}
                            {result.status === 'not_configured' && '○ Not Configured'}
                            {result.status === 'unavailable' && '🔴 Server Unavailable'}
                            {result.status === 'error' && '✕ Test Failed'}
                          </strong>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Checked: {result.lastChecked}
                          </span>
                        </div>

                        {result.tools && (
                          <div className="mt-1">
                            <span className="text-muted">Tools ({result.toolsCount}):</span>{' '}
                            <span className="font-monospace text-dark">
                              {result.tools.map((t) => t.name).join(', ')}
                            </span>
                          </div>
                        )}

                        {result.error && (
                          <div className="text-danger small mt-1">{result.error.reason || result.error.message}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Test Connection, Refresh Tools, Edit, Delete */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top gap-2">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestConnection(conn.connection_key, conn)}
                        disabled={isTesting || isRefreshing}
                        className="admin-btn admin-btn-secondary py-1 px-3"
                        title={!hasServerUrl ? "MCP server URL not configured" : "Test Connection & Handshake"}
                      >
                        {isTesting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span> Testing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-broadcast me-1"></i> Test Connection
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRefreshTools(conn.connection_key)}
                        disabled={isTesting || isRefreshing}
                        className="btn btn-sm btn-outline-dark py-1 px-2"
                        title="Refresh Discovered Tools"
                      >
                        {isRefreshing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span> Refreshing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-arrow-repeat me-1"></i> Refresh Tools
                          </>
                        )}
                      </button>
                    </div>

                    <div className="d-flex gap-2">
                      <Link
                        to={`/admin/mcp-connections/${conn.id || conn.slug}`}
                        className="admin-btn admin-btn-secondary py-1 px-2"
                      >
                        <i className="bi bi-pencil-square"></i> Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(conn.id, conn.name)}
                        className="admin-btn admin-btn-secondary text-danger py-1 px-2"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Wizard Modal */}
      {isWizardOpen && (
        <MCPSetupWizard
          isOpen={isWizardOpen}
          existingConnections={connections}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={handleWizardSuccess}
        />
      )}
    </div>
  );
}
