import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getContentInventory,
  getContentMetrics,
  transitionContentStatus,
  duplicateContent,
  calculateContentQuality,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from '../../services/contentOperations';
import { deleteContentRegistryEntry } from '../../services/contentRegistry';
import { getContentTypeRoute } from '../../services/contentRouteResolver';

export default function AdminContent() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [invRes, metricsData] = await Promise.all([
      getContentInventory({ search, type: typeFilter, status: statusFilter }),
      getContentMetrics(),
    ]);
    setItems(invRes.data || []);
    setMetrics(metricsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleStatusTransition = async (item, newStatus) => {
    const res = await transitionContentStatus(item.id, newStatus, item);
    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message });
    } else {
      setFeedback({ type: 'success', message: `Status updated to "${STATUS_LABELS[newStatus]}".` });
      loadData();
    }
  };

  const handleDuplicate = async (item) => {
    try {
      const res = await duplicateContent(item);
      if (res.error) {
        setFeedback({ type: 'danger', message: `Duplication failed: ${res.error.message}` });
      } else {
        setFeedback({ type: 'success', message: `Duplicated as "${res.data.title}".` });
        loadData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete content item "${item.title}"? This cannot be undone.`)) {
      return;
    }
    // Optimistic removal for responsive UI
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const res = await deleteContentRegistryEntry(item.id);
    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message });
      loadData(); // Revert on failure
    } else {
      setFeedback({ type: 'success', message: 'Content item deleted.' });
      loadData();
    }
  };

  const getEditorRoute = (item) => {
    if (item.content_type === 'blog') return `/admin/content/blog/${item.id}`;
    if (item.content_type === 'page') return `/admin/pages/${item.metadata?.pageId || item.id}`;
    if (item.content_type === 'case-study') return `/admin/case-studies/${item.id}`;
    if (item.content_type === 'agent') return `/admin/agents/${item.id}`;
    return `/admin/registry/${item.id}`;
  };

  // Review Queue Items (items currently in_review)
  const inReviewItems = items.filter((i) => i.status === 'in_review');

  return (
    <div className="admin-content-center p-4">
      {/* 1. Header with Breadcrumb & New Content Action */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="text-muted small text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.04em' }}>
            Editorial Operations
          </div>
          <h3 className="fw-bold mb-0 text-dark">
            <i className="bi bi-kanban text-primary me-2"></i> Content Operations Center
          </h3>
          <p className="text-secondary small mb-0 mt-1">
            Authoritative lifecycle control for articles, case studies, site pages, and agent showcases.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/content/blog/new" className="btn btn-primary rounded-pill px-4 shadow-sm fw-semibold">
            <i className="bi bi-plus-lg me-1"></i> New Blog Article
          </Link>
          <Link to="/admin/pages" className="btn btn-outline-secondary bg-white rounded-pill px-3 shadow-xs">
            <i className="bi bi-file-earmark-plus me-1"></i> New Page
          </Link>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 small py-2 px-3 mb-4`}>
          {feedback.message}
          <button type="button" className="btn-close py-2" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* 2. Content Metrics Overview Bar */}
      {metrics && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-2">
            <div className="card border-0 bg-white rounded-3 p-3 shadow-xs text-center">
              <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Total Items</span>
              <h4 className="fw-bold mb-0 text-dark">{metrics.total}</h4>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card border-0 bg-white rounded-3 p-3 shadow-xs text-center border-start border-3 border-success">
              <span className="text-success small text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Published</span>
              <h4 className="fw-bold mb-0 text-success">{metrics.published}</h4>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card border-0 bg-white rounded-3 p-3 shadow-xs text-center border-start border-3 border-info">
              <span className="text-info small text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>In Review</span>
              <h4 className="fw-bold mb-0 text-info">{metrics.in_review}</h4>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card border-0 bg-white rounded-3 p-3 shadow-xs text-center border-start border-3 border-primary">
              <span className="text-primary small text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Ready</span>
              <h4 className="fw-bold mb-0 text-primary">{metrics.ready}</h4>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card border-0 bg-white rounded-3 p-3 shadow-xs text-center border-start border-3 border-secondary">
              <span className="text-secondary small text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Drafts</span>
              <h4 className="fw-bold mb-0 text-secondary">{metrics.draft}</h4>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card border-0 bg-white rounded-3 p-3 shadow-xs text-center border-start border-3 border-dark">
              <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Archived</span>
              <h4 className="fw-bold mb-0 text-dark">{metrics.archived}</h4>
            </div>
          </div>
        </div>
      )}

      {/* 3. Review Queue Callout if any items need review */}
      {inReviewItems.length > 0 && (
        <div className="card border border-info border-opacity-50 rounded-4 bg-info bg-opacity-10 p-3 mb-4 shadow-xs">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-info text-dark rounded-pill">Needs Review ({inReviewItems.length})</span>
              <h6 className="fw-bold mb-0 text-dark">Editorial Review Queue</h6>
            </div>
          </div>
          <div className="row g-2">
            {inReviewItems.map((item) => (
              <div key={item.id} className="col-12 col-md-6">
                <div className="bg-white p-2 px-3 rounded-3 border d-flex justify-content-between align-items-center">
                  <div className="text-truncate me-2">
                    <strong className="text-dark small d-block text-truncate">{item.title}</strong>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: '0.65rem' }}>
                      {item.content_type}
                    </span>
                  </div>
                  <div className="d-flex gap-1 flex-shrink-0">
                    <Link to={getEditorRoute(item)} className="btn btn-xs btn-outline-primary rounded-pill py-0 px-2" style={{ fontSize: '0.72rem' }}>
                      Review
                    </Link>
                    <button
                      type="button"
                      className="btn btn-xs btn-primary rounded-pill py-0 px-2"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => handleStatusTransition(item, 'ready')}
                    >
                      Approve (Ready)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Toolbar */}
      <div className="card border-0 bg-white rounded-4 shadow-sm p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by title, slug, tag, or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="d-flex align-items-center gap-2">
              <label className="form-label small text-muted mb-0 flex-shrink-0">Type:</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Content Types</option>
                <option value="blog">Blog Articles</option>
                <option value="case-study">Case Studies</option>
                <option value="page">Pages</option>
                <option value="agent">AI Agents</option>
                <option value="plugin">Plugins</option>
              </select>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="d-flex align-items-center gap-2">
              <label className="form-label small text-muted mb-0 flex-shrink-0">Status:</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="ready">Ready</option>
                <option value="in_review">In Review</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="col-12 col-md-2 text-md-end">
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* 5. Inventory Table */}
      <div className="card border-0 bg-white rounded-4 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light text-uppercase text-secondary" style={{ fontSize: '0.72rem' }}>
              <tr>
                <th className="ps-4">Content Title &amp; Slug</th>
                <th>Type</th>
                <th>Editorial Status</th>
                <th>Quality Health</th>
                <th>Last Updated</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading editorial inventory…
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => {
                  const quality = calculateContentQuality(item);
                  const publicRoute = item.public_route || getContentTypeRoute(item);
                  const previewUrl = `${publicRoute}?preview=true`;
                  const statusVariant = STATUS_BADGE_VARIANTS[item.status] || 'secondary';

                  return (
                    <tr key={item.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div>
                            <Link to={getEditorRoute(item)} className="fw-bold text-dark text-decoration-none hover-text-primary">
                              {item.title}
                            </Link>
                            <div className="text-muted font-monospace small" style={{ fontSize: '0.72rem' }}>
                              /{item.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border rounded-pill text-uppercase px-2" style={{ fontSize: '0.68rem' }}>
                          {item.content_type}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown d-inline-block">
                          <button
                            className={`btn btn-xs btn-${statusVariant} rounded-pill dropdown-toggle text-capitalize py-1 px-2`}
                            type="button"
                            data-bs-toggle="dropdown"
                            style={{ fontSize: '0.75rem' }}
                          >
                            {STATUS_LABELS[item.status] || item.status}
                          </button>
                          <ul className="dropdown-menu shadow-sm border-0 rounded-3 py-1" style={{ fontSize: '0.78rem' }}>
                            {item.status !== 'in_review' && (
                              <li>
                                <button className="dropdown-item py-1" onClick={() => handleStatusTransition(item, 'in_review')}>
                                  <i className="bi bi-clock-history me-1 text-info"></i> Submit for Review
                                </button>
                              </li>
                            )}
                            {item.status !== 'ready' && (
                              <li>
                                <button className="dropdown-item py-1" onClick={() => handleStatusTransition(item, 'ready')}>
                                  <i className="bi bi-check2-circle me-1 text-primary"></i> Mark Ready
                                </button>
                              </li>
                            )}
                            {item.status !== 'published' && (
                              <li>
                                <button className="dropdown-item py-1" onClick={() => handleStatusTransition(item, 'published')}>
                                  <i className="bi bi-send-check me-1 text-success"></i> Publish Content
                                </button>
                              </li>
                            )}
                            {item.status !== 'draft' && (
                              <li>
                                <button className="dropdown-item py-1" onClick={() => handleStatusTransition(item, 'draft')}>
                                  <i className="bi bi-file-earmark me-1 text-secondary"></i> Revert to Draft
                                </button>
                              </li>
                            )}
                            {item.status !== 'archived' && (
                              <li>
                                <button className="dropdown-item py-1" onClick={() => handleStatusTransition(item, 'archived')}>
                                  <i className="bi bi-archive me-1 text-dark"></i> Archive
                                </button>
                              </li>
                            )}
                          </ul>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1" title={`${quality.score}% health score`}>
                          <span className={`badge rounded-pill ${quality.isReady ? 'bg-success-subtle text-success-emphasis border border-success-subtle' : 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'} fw-semibold`} style={{ fontSize: '0.68rem' }}>
                            {quality.isReady ? 'Healthy' : `${quality.blockingErrors.length} Errors`}
                          </span>
                          {quality.warnings.length > 0 && (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-semibold" style={{ fontSize: '0.68rem' }}>
                              {quality.warnings.length} Warnings
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <Link to={getEditorRoute(item)} className="btn btn-outline-secondary bg-white rounded-pill px-2 py-0" title="Edit">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-secondary bg-white rounded-pill px-2 py-0 ms-1"
                            title="Preview Saved Version"
                          >
                            <i className="bi bi-eye"></i>
                          </a>
                          <button
                            type="button"
                            className="btn btn-outline-secondary bg-white rounded-pill px-2 py-0 ms-1"
                            onClick={() => handleDuplicate(item)}
                            title="Duplicate Content"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger bg-white rounded-pill px-2 py-0 ms-1"
                            onClick={() => handleDelete(item)}
                            title="Delete Content"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-folder2-open display-6 mb-2 d-block"></i>
                    No content items match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
