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
  const [testResult, setTestResult] = useState(null);

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
    setTestResult(null);

    try {
      const res = await fetch(`/api/admin/mcp-connections/${connKey}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult({ key: connKey, ...data });
    } catch (err) {
      setTestResult({
        key: connKey,
        success: false,
        status: 'error',
        error: { message: err.message || 'Network error during connection test' },
      });
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
          <div className="d-flex justify-content-between align-items-start w-100">
            <div>
              <div className="fw-bold mb-1">
                {testResult.status === 'connected' && '✓ MCP Connection Active & Verified'}
                {testResult.status === 'not_configured' && '⚠ Server Secret Not Configured in .env'}
                {testResult.status === 'unavailable' && '✕ MCP Connection Unavailable'}
                {testResult.status === 'error' && '✕ Connection Test Failed'}
              </div>
              <div className="small mb-2">
                Connection Key: <code>{testResult.key}</code>
                {testResult.info?.host && ` · Host: ${testResult.info.host}`}
              </div>

              {testResult.tools && (
                <div>
                  <div className="fw-bold small text-dark mb-1">
                    Discovered Tools ({testResult.toolsCount}):
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {testResult.tools.map((t) => (
                      <span key={t.name} className="badge bg-light text-dark border small font-monospace">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {testResult.error && (
                <div className="small text-danger mt-1">{testResult.error.message}</div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0"
              onClick={() => setTestResult(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
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
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Connection Name</th>
                <th>Provider</th>
                <th>Connection Key</th>
                <th>Server URL Hint</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((conn) => (
                <tr key={conn.id || conn.slug}>
                  <td>
                    <strong>{conn.name}</strong>
                    {conn.description && (
                      <div className="text-muted small text-truncate" style={{ maxWidth: '280px', fontSize: '0.75rem' }}>
                        {conn.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                      {conn.provider || 'n8n'}
                    </span>
                  </td>
                  <td>
                    <code className="text-dark font-monospace">{conn.connection_key}</code>
                  </td>
                  <td>
                    <span className="text-muted small font-monospace">
                      {conn.server_url_hint || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${conn.is_active ? 'published' : 'draft'}`}>
                      {conn.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestConnection(conn.connection_key)}
                        disabled={testingKey === conn.connection_key}
                        className="admin-btn admin-btn-secondary py-1 px-2"
                        title="Test Live Handshake & Discover Tools"
                      >
                        {testingKey === conn.connection_key ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <>
                            <i className="bi bi-broadcast"></i> Test
                          </>
                        )}
                      </button>

                      <Link
                        to={`/admin/mcp-connections/${conn.id || conn.slug}`}
                        className="admin-btn admin-btn-secondary py-1 px-2"
                        title="Edit Connection"
                      >
                        <i className="bi bi-pencil-square"></i> Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(conn.id, conn.name)}
                        className="admin-btn admin-btn-secondary text-danger py-1 px-2"
                        title="Delete Connection"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
