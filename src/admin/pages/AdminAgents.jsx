import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAgents, deleteAdminAgent } from '../../services/agents';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    const res = await getAdminAgents();
    if (res.error) {
      setError(res.error.message || 'Failed to load agents');
    } else {
      setAgents(res.data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the AI Agent "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    const res = await deleteAdminAgent(id);
    if (res.error) {
      alert(`Error deleting agent: ${res.error.message}`);
    } else {
      setAgents((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Agents Directory</h2>
          <p className="text-muted small mb-0">Manage autonomous AI agents, n8n workflows and interactive demos.</p>
        </div>
        <Link to="/admin/agents/new" className="admin-btn admin-btn-primary">
          <i className="bi bi-plus-lg"></i> Add New Agent
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
          <div>Loading AI agents...</div>
        </div>
      ) : agents.length === 0 ? (
        <AdminEmptyState
          icon="bi-robot"
          title="No AI Agents yet"
          description="Create and document your first intelligent agent."
          actionText="Create Agent"
          actionTo="/admin/agents/new"
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Demo Type</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id || agent.slug}>
                  <td>
                    <strong>{agent.name}</strong>
                    {agent.short_description && (
                      <div className="text-muted small text-truncate" style={{ maxWidth: '280px', fontSize: '0.75rem' }}>
                        {agent.short_description}
                      </div>
                    )}
                  </td>
                  <td>
                    <code>{agent.slug}</code>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                      {agent.category || 'AI Agent'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${agent.demo_type !== 'none' ? 'published' : 'draft'}`} style={{ fontSize: '0.72rem' }}>
                      {agent.demo_type === 'none' ? 'No Demo' : agent.demo_type}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${agent.status || 'published'}`}>
                      {agent.status || 'published'}
                    </span>
                  </td>
                  <td>
                    {agent.is_featured ? (
                      <span className="text-warning"><i className="bi bi-star-fill"></i></span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        to={`/admin/agents/${agent.id || agent.slug}`}
                        className="admin-btn admin-btn-secondary py-1 px-2"
                        title="Edit Agent & Sections"
                      >
                        <i className="bi bi-pencil-square"></i> Edit
                      </Link>
                      <Link
                        to={`/agents/${agent.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary py-1 px-2 text-muted"
                        title="Preview Public Page"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(agent.id, agent.name)}
                        disabled={deletingId === agent.id}
                        className="admin-btn admin-btn-secondary text-danger py-1 px-2"
                        title="Delete Agent"
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
