import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminPages, createPage, deletePage } from '../../services/siteCms';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newStatus, setNewStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    setLoading(true);
    const { data } = await getAdminPages();
    setPages(data || []);
    setLoading(false);
  }

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);

    const slug = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = await createPage({
      title: newTitle.trim(),
      slug,
      status: newStatus,
      template: 'default',
    });

    if (res.error) {
      setErrorMsg(res.error.message || 'Failed to create page');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowCreateModal(false);
    setNewTitle('');
    setNewSlug('');
    loadPages();
  };

  const handleDeletePage = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    await deletePage(id);
    loadPages();
  };

  return (
    <div className="admin-pages-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Site Pages</h1>
          <p className="text-muted small mb-0">Manage CMS-driven pages and structured section layouts.</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create Page
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading pages...</span>
          </div>
        </div>
      ) : pages.length > 0 ? (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Template</th>
                  <th>Updated</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td className="ps-4 fw-semibold">
                      <Link to={`/admin/pages/${p.id}`} className="text-decoration-none text-dark">
                        {p.title}
                      </Link>
                    </td>
                    <td>
                      <code className="text-muted">/{p.slug}</code>
                    </td>
                    <td>
                      <span className={`badge rounded-pill bg-${p.status === 'published' ? 'success' : p.status === 'archived' ? 'secondary' : 'warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-muted small">{p.template || 'default'}</td>
                    <td className="text-muted small">{new Date(p.updated_at || p.created_at).toLocaleDateString()}</td>
                    <td className="text-end pe-4">
                      <Link to={`/admin/pages/${p.id}`} className="btn btn-sm btn-outline-secondary rounded-pill me-2">
                        <i className="bi bi-pencil me-1"></i> Edit
                      </Link>
                      <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDeletePage(p.id, p.title)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <i className="bi bi-file-earmark-richtext display-4 text-muted mb-3"></i>
          <h4 className="fw-bold">No Pages Created Yet</h4>
          <p className="text-muted mb-4">Get started by creating your first CMS-driven page.</p>
          <div>
            <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowCreateModal(true)}>
              Create Page
            </button>
          </div>
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Create New Page</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreatePage}>
                <div className="modal-body py-4">
                  {errorMsg && <div className="alert alert-danger py-2 mb-3">{errorMsg}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Page Title</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g. About Me"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Slug (URL Path)</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g. about"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                    />
                    <small className="text-muted">Leave blank to auto-generate from title.</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Publish Status</label>
                    <select className="form-select rounded-3" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Page'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
