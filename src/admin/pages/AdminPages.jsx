import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminPages, createPage, deletePage, getAllAdminPageSections, syncPageWithRegistry } from '../../services/siteCms';
import { getPagePublishingReadiness, getPageRegistryConsistency, getPageContentIntegrity } from '../../utils/registryHealth';
import { PAGE_SECTION_TYPES } from '../../components/cms/sectionSchemas';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'published' | 'draft'
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newStatus, setNewStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [pagesRes, sectionsRes] = await Promise.all([
      getAdminPages(),
      getAllAdminPageSections(),
    ]);
    setPages(pagesRes.data || []);
    setSections(sectionsRes.data || []);
    setLoading(false);
  }

  const handleSyncPage = async (page) => {
    setFeedback(null);
    const res = await syncPageWithRegistry(page);
    if (res.error) {
      setFeedback({ type: 'danger', message: `Sync failed: ${res.error.message}` });
    } else {
      setFeedback({ type: 'success', message: `Page "${page.title}" synchronized with Content Registry.` });
      setTimeout(() => setFeedback(null), 3000);
      loadData();
    }
  };

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

    if (res.data?.id) {
      navigate(`/admin/pages/${res.data.id}`);
    } else {
      loadData();
    }
  };

  const handleDeletePage = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    const res = await deletePage(id);
    if (res?.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to delete page.' });
    } else {
      setFeedback({ type: 'success', message: `Page "${title}" removed successfully.` });
      setTimeout(() => setFeedback(null), 3000);
    }
    loadData();
  };

  // Filtered pages
  const filteredPages = pages.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.filter((p) => p.status === 'draft').length;

  return (
    <div className="admin-pages-container p-4">
      {/* Header Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 fw-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Site Pages</h1>
          <p className="text-muted small mb-0">
            Authoritative inventory of CMS-driven pages, structured section layouts, and canonical routes.
          </p>
        </div>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create Page
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Total Pages
            </span>
            <div className="h3 fw-bold mt-1 mb-0">{loading ? '—' : pages.length}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Published (Public)
            </span>
            <div className="h3 fw-bold mt-1 mb-0 text-success">{loading ? '—' : publishedCount}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Drafts (Private)
            </span>
            <div className="h3 fw-bold mt-1 mb-0 text-warning">{loading ? '—' : draftCount}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Total Page Sections
            </span>
            <div className="h3 fw-bold mt-1 mb-0 text-primary">{loading ? '—' : sections.length}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 me-2 ${filterStatus === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({pages.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 me-2 ${filterStatus === 'published' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('published')}
            >
              Published ({publishedCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${filterStatus === 'draft' ? 'btn-warning' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('draft')}
            >
              Drafts ({draftCount})
            </button>
          </div>

          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 rounded-end-pill py-1 small"
              placeholder="Search by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pages Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading pages...</span>
          </div>
        </div>
      ) : filteredPages.length > 0 ? (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Page & Structure</th>
                  <th>Canonical Route</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Sections Breakdown</th>
                  <th>Registry Sync</th>
                  <th>Publishing Readiness</th>
                  <th>Last Updated</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((p) => {
                  const canonicalRoute = (p.slug === 'home' || p.slug === 'index') ? '/' : p.slug === 'about' ? '/about' : `/p/${p.slug}`;
                  const previewUrl = canonicalRoute === '/' ? '/?preview=true' : `${canonicalRoute}?preview=true`;
                  const pageSections = sections
                    .filter(
                      (s) =>
                        String(s.page_id) === String(p.id) ||
                        ((p.slug === 'about' || p.id === 'page-about' || p.id === 'b458c42a-8e8e-4629-b6cd-9eae47ccbb79') &&
                          (s.page_id === 'page-about' || s.page_id === 'b458c42a-8e8e-4629-b6cd-9eae47ccbb79'))
                    )
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                  const visibleSections = pageSections.filter((s) => s.is_visible !== false);
                  const hiddenSections = pageSections.filter((s) => s.is_visible === false);
                  const readiness = getPagePublishingReadiness(p, pageSections);
                  const integrity = getPageContentIntegrity(p, p.registryEntry, pageSections);
                  const isPublished = p.status === 'published';

                  return (
                    <tr key={p.id}>
                      <td className="ps-4 py-3" style={{ minWidth: '260px' }}>
                        <div className="d-flex align-items-center flex-wrap gap-1">
                          <Link to={`/admin/pages/${p.id}`} className="text-decoration-none text-dark fw-bold">
                            {p.title}
                          </Link>
                          {p.isOrphanRegistry && (
                            <span className="badge bg-danger-subtle text-danger ms-1" style={{ fontSize: '0.65rem' }}>
                              Orphan
                            </span>
                          )}
                          {p.template && p.template !== 'default' && (
                            <span className="badge bg-light text-secondary ms-1" style={{ fontSize: '0.68rem' }}>
                              {p.template}
                            </span>
                          )}
                        </div>

                        {/* Compact Structure Preview */}
                        <div className="mt-2">
                          <div className="text-muted small mb-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Structure Preview ({pageSections.length}):
                          </div>
                          {pageSections.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1 align-items-center">
                              {pageSections.map((sec, idx) => {
                                const schemaMeta = PAGE_SECTION_TYPES[sec.section_type] || {};
                                const secLabel = sec.label || schemaMeta.label || sec.section_type;
                                const isSecHidden = sec.is_visible === false;
                                return (
                                  <span
                                    key={sec.id || idx}
                                    className={`badge rounded-pill border ${
                                      isSecHidden ? 'bg-light text-muted opacity-75' : 'bg-white text-dark shadow-xs'
                                    }`}
                                    style={{ fontSize: '0.66rem', fontWeight: 500, padding: '3px 8px' }}
                                    title={`#${idx + 1} ${secLabel} (${sec.section_type}) — ${isSecHidden ? 'Hidden from public' : 'Visible'}`}
                                  >
                                    <i className={`bi ${schemaMeta.icon || 'bi-box'} me-1 ${isSecHidden ? 'text-muted' : 'text-primary'}`}></i>
                                    {secLabel}
                                    {isSecHidden && <i className="bi bi-eye-slash ms-1 text-warning"></i>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted font-italic small" style={{ fontSize: '0.72rem' }}>
                              No sections configured
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-decoration-none text-primary small d-inline-flex align-items-center"
                          title="Preview public route"
                        >
                          <code className="text-primary">{canonicalRoute}</code>
                          <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.75rem' }}></i>
                        </a>
                      </td>
                      <td>
                        <span className={`badge rounded-pill bg-${isPublished ? 'success' : p.status === 'archived' ? 'secondary' : 'warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${isPublished ? 'bg-info text-dark' : 'bg-light text-muted border'}`}>
                          {isPublished ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span className="badge bg-light text-dark rounded-pill border mb-1">
                            <i className="bi bi-layers me-1 text-muted"></i>
                            {pageSections.length} {pageSections.length === 1 ? 'section' : 'sections'}
                          </span>
                          <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                            <span className="text-success">{visibleSections.length} visible</span>
                            {hiddenSections.length > 0 && (
                              <span className="text-warning-emphasis ms-1">· {hiddenSections.length} hidden</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.isOrphanRegistry ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger rounded-pill" title="Exists in registry but missing backing Page record">
                            ⚠️ Orphan in Registry
                          </span>
                        ) : !p.registryEntry ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning rounded-pill" title="Page is not registered in Content Registry">
                            ⚠️ Missing Registry
                          </span>
                        ) : !integrity.isConsistent ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning rounded-pill" title={integrity.issues.map((i) => i.message).join(' | ')}>
                            ⚠️ Desynced
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success rounded-pill">
                            ✓ Synced
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`badge rounded-pill ${
                              readiness.isReady ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning-emphasis border border-warning'
                            }`}
                            style={{ fontSize: '0.72rem' }}
                            title={readiness.isReady ? 'Ready for public release' : readiness.gates.map((g) => g.message).join(' | ')}
                          >
                            {readiness.isReady ? '✓ Ready' : `⚠️ Incomplete (${readiness.score}%)`}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted small">
                        {new Date(p.updated_at || p.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-end pe-4">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary rounded-pill me-2"
                          title="Preview Page"
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i> Preview
                        </a>
                        {(!p.registryEntry || !integrity.isConsistent) && !p.isOrphanRegistry && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning rounded-pill me-2"
                            onClick={() => handleSyncPage(p)}
                            title="Synchronize with Content Registry"
                          >
                            <i className="bi bi-arrow-repeat me-1"></i> Sync
                          </button>
                        )}
                        <Link to={`/admin/pages/${p.id}`} className="btn btn-sm btn-outline-primary rounded-pill me-2">
                          <i className="bi bi-pencil me-1"></i> Edit
                        </Link>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill"
                          onClick={() => handleDeletePage(p.id, p.title)}
                          title="Delete Page"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <i className="bi bi-file-earmark-richtext display-4 text-muted mb-3"></i>
          <h4 className="fw-bold">No Pages Found</h4>
          <p className="text-muted mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'No pages match your current search or status filter.'
              : 'Get started by creating your first CMS-driven page.'}
          </p>
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
                      placeholder="e.g. Services or About"
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
                      placeholder="e.g. services"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                    />
                    <small className="text-muted">Route will be <code>/about</code> for "about" or <code>/p/:slug</code>.</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Publish Status</label>
                    <select className="form-select rounded-3" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      <option value="draft">Draft (Private)</option>
                      <option value="published">Published (Public)</option>
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

