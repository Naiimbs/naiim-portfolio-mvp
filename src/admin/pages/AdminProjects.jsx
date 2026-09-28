import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProjects } from '../../services/projects';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      const res = await getAdminProjects();
      if (res.error) {
        setError(res.error.message || 'Failed to load projects');
      } else {
        setProjects(res.data || []);
      }
      setLoading(false);
    }
    loadProjects();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Projects Directory</h2>
          <p className="text-muted small mb-0">Manage all portfolio projects and metadata.</p>
        </div>
        <Link to="/admin/projects/new" className="admin-btn admin-btn-primary">
          <i className="bi bi-plus-lg"></i> New Project
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
          <div>Loading projects...</div>
        </div>
      ) : projects.length === 0 ? (
        <AdminEmptyState
          icon="bi-folder-x"
          title="No projects found"
          description="Create your first project to populate the portfolio."
          action={
            <Link to="/admin/projects/new" className="admin-btn admin-btn-primary">
              <i className="bi bi-plus-lg"></i> Create Project
            </Link>
          }
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Year</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id || p.slug}>
                  <td>
                    <strong>{p.title}</strong>
                    {p.kicker && <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{p.kicker}</div>}
                  </td>
                  <td>
                    <code>{p.slug}</code>
                  </td>
                  <td>{p.category || 'Product Design'}</td>
                  <td>{p.year || 2026}</td>
                  <td>
                    <span className={`admin-badge ${p.status || 'published'}`}>
                      {p.status || 'published'}
                    </span>
                  </td>
                  <td>
                    {p.featured || p.is_featured ? (
                      <span className="text-success"><i className="bi bi-star-fill"></i> Yes</span>
                    ) : (
                      <span className="text-muted">No</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        to={`/admin/projects/${p.id || p.slug}`}
                        className="admin-btn admin-btn-secondary py-1 px-2"
                        title="Edit Project"
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </Link>
                      <Link
                        to={`/work/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary py-1 px-2 text-muted"
                        title="View Live Page"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                      </Link>
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
