import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAdminMCPConnections, deleteAdminMCPConnection } from '../../services/agentRuntime';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminMCPConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testingKey, setTestingKey] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadConnections();
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

  const handleTestConnection = async (connKey) => {
    setTestingKey(connKey);

    try {
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
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

  return (
    <div>
      <Helmet>
        <title>MCP Connections — Admin CMS</title>
      </Helmet>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MCP Connections
          </h2>
          <p className="text-muted small mb-0">
            Manage external Model Context Protocol and n8n server endpoints. Credentials remain server-side.
          </p>
        </div>
        <Link to="/admin/mcp-connections/new" className="admin-btn admin-btn-primary">
          <i className="bi bi-plus-lg"></i> Add Connection
        </Link>
      </div>

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
          description="Register an MCP endpoint to power AI Agent live demos."
          actionText="Create Connection"
          actionTo="/admin/mcp-connections/new"
        />
      ) : (
        <div className="row g-4">
          {connections.map((conn) => {
            const result = testResults[conn.connection_key];
            const isTesting = testingKey === conn.connection_key;

            return (
              <div key={conn.id || conn.slug} className="col-lg-6">
                <div className="admin-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Card Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h3 className="fs-5 fw-bold mb-0 text-dark">{conn.name}</h3>
                          <span className="badge bg-light text-dark border small font-monospace">
                            {conn.provider || 'n8n'}
                          </span>
                        </div>
                        <div className="text-muted small font-monospace">
                          Key: <code>{conn.connection_key}</code>
                        </div>
                      </div>

                      <span className={`admin-badge ${conn.is_active ? 'published' : 'draft'}`}>
                        {conn.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {conn.description && (
                      <p className="text-muted small mb-3">{conn.description}</p>
                    )}

                    {/* Server URL Hint & Credential Status */}
                    <div className="p-2 rounded bg-light border small mb-3 font-monospace">
                      <div className="d-flex justify-content-between text-muted mb-1">
                        <span>Host Hint:</span>
                        <strong className="text-dark">{conn.server_url_hint || 'N/A'}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted">
                        <span>Credential:</span>
                        <span className="text-success fw-bold">● Configured (Server-Side)</span>
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
                            {result.status === 'not_configured' && '🟡 Secret Missing in .env'}
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
                          <div className="text-danger small mt-1">{result.error.message}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top gap-2">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestConnection(conn.connection_key)}
                        disabled={isTesting}
                        className="admin-btn admin-btn-secondary py-1 px-3"
                        title="Test Connection & Handshake"
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
                        onClick={() => handleTestConnection(conn.connection_key)}
                        disabled={isTesting}
                        className="btn btn-sm btn-outline-dark py-1 px-2"
                        title="Discover Exposed Tools"
                      >
                        <i className="bi bi-tools me-1"></i> Discover Tools
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
    </div>
  );
}
