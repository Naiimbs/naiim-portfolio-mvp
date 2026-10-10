import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getResources,
  toggleResourcePublish,
  toggleResourceFeatured,
  deleteResource,
} from '../../services/resources';
import { RESOURCE_TYPES, RESOURCE_TYPE_LIST } from '../../config/resourceTypes';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminResources() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTypeFilter = searchParams.get('type') || 'all';
  const activeStatusFilter = searchParams.get('status') || 'all';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [isNewResourceModalOpen, setIsNewResourceModalOpen] = useState(false);

  const fetchResourceList = async () => {
    setLoading(true);
    try {
      const { data } = await getResources({
        type: activeTypeFilter,
        status: activeStatusFilter,
        search: searchQuery,
      });
      setResources(data || []);
    } catch (err) {
      console.error('[AdminResources] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceList();
  }, [activeTypeFilter, activeStatusFilter, searchQuery]);

  const handleTypeChange = (typeId) => {
    const params = new URLSearchParams(searchParams);
    if (typeId === 'all') {
      params.delete('type');
    } else {
      params.set('type', typeId);
    }
    setSearchParams(params);
  };

  const handleStatusChange = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    setSearchParams(params);
  };

  const handleTogglePublish = async (resource) => {
    setActionLoading(resource.id);
    try {
      await toggleResourcePublish(resource.id, resource.status);
      await fetchResourceList();
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (resource) => {
    setActionLoading(resource.id);
    try {
      await toggleResourceFeatured(resource.id, resource.featured);
      await fetchResourceList();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (resource) => {
    if (window.confirm(`Are you sure you want to delete "${resource.title}"? This cannot be undone.`)) {
      setActionLoading(resource.id);
      try {
        await deleteResource(resource.id);
        await fetchResourceList();
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Compute summary stats
  const stats = useMemo(() => {
    const total = resources.length;
    const published = resources.filter((r) => r.status === 'published').length;
    const skills = resources.filter((r) => r.resource_type === 'skill').length;
    const templates = resources.filter((r) => r.resource_type === 'template' || r.resource_type === 'spreadsheet').length;
    return { total, published, skills, templates };
  }, [resources]);

  return (
    <div className="admin-page-container">
      <Helmet>
        <title>Resources — Admin CMS</title>
      </Helmet>

      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--ink, #10242a)' }}>
            Resources Management
          </h1>
          <p className="text-muted small mb-0">
            First-class CMS entity for Agent Skills, Templates, Figma Kits, Guides, and Artifacts.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/resources" target="_blank" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
            <i className="bi bi-box-arrow-up-right"></i>
            <span>View Public Showcase</span>
          </Link>
          <button 
            onClick={() => setIsNewResourceModalOpen(true)} 
            className="btn btn-success btn-sm d-flex align-items-center gap-2" 
            style={{ backgroundColor: 'var(--green, #087f66)' }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Create Resource</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ backgroundColor: '#ffffff' }}>
            <div className="text-muted small fw-bold text-uppercase">Total Resources</div>
            <div className="h4 fw-bold mb-0 mt-1" style={{ color: 'var(--ink, #10242a)' }}>{stats.total}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ backgroundColor: '#ffffff' }}>
            <div className="text-muted small fw-bold text-uppercase">Published</div>
            <div className="h4 fw-bold mb-0 mt-1 text-success">{stats.published}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ backgroundColor: '#ffffff' }}>
            <div className="text-muted small fw-bold text-uppercase">Agent Skills</div>
            <div className="h4 fw-bold mb-0 mt-1" style={{ color: '#087f66' }}>{stats.skills}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ backgroundColor: '#ffffff' }}>
            <div className="text-muted small fw-bold text-uppercase">Templates & Files</div>
            <div className="h4 fw-bold mb-0 mt-1 text-primary">{stats.templates}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="card border-0 shadow-sm mb-4 rounded-3" style={{ backgroundColor: '#ffffff' }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by title, slug, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter Tabs */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-wrap gap-1">
                <button
                  type="button"
                  className={`btn btn-sm px-2 py-1 ${activeTypeFilter === 'all' ? 'btn-dark' : 'btn-light text-muted'}`}
                  onClick={() => handleTypeChange('all')}
                  style={{ fontSize: '0.78rem' }}
                >
                  All Types
                </button>
                {RESOURCE_TYPE_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-sm px-2 py-1 ${activeTypeFilter === t.id ? 'btn-dark' : 'btn-light text-muted'}`}
                    onClick={() => handleTypeChange(t.id)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className={`bi ${t.icon} me-1`}></i>
                    {t.pluralLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-12 col-md-2 text-md-end">
              <select
                className="form-select form-select-sm"
                value={activeStatusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        {loading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
            Loading resources...
          </div>
        ) : resources.length === 0 ? (
            <div className="p-5 text-center">
              <i className="bi bi-collection display-1 text-muted mb-3 d-block"></i>
              <h5 className="fw-bold">No resources found</h5>
              <p className="text-muted">No resources match your active search and filter criteria.</p>
              <button
                className="btn btn-success btn-sm mt-3"
                style={{ backgroundColor: 'var(--green, #087f66)' }}
                onClick={() => setIsNewResourceModalOpen(true)}
              >
                Create Resource
              </button>
            </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ width: '38%' }}>Resource</th>
                  <th style={{ width: '14%' }}>Type</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '12%' }}>Assets</th>
                  <th style={{ width: '10%' }}>Updated</th>
                  <th style={{ width: '14%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => {
                  const typeConfig = RESOURCE_TYPES[res.resource_type] || RESOURCE_TYPES.file;
                  const isPublished = res.status === 'published';
                  const isFeatured = Boolean(res.featured);
                  const assetCount = Array.isArray(res.assets) ? res.assets.length : 0;

                  return (
                    <tr key={res.id}>
                      {/* Title & Slug */}
                      <td>
                        <div className="d-flex align-items-start gap-2">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none"
                            onClick={() => handleToggleFeatured(res)}
                            title={isFeatured ? 'Featured on Home/Showcase' : 'Click to Feature'}
                          >
                            <i className={`bi ${isFeatured ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}></i>
                          </button>
                          <div>
                            <Link to={`/admin/resources/${res.id}`} className="fw-bold text-decoration-none text-dark d-block">
                              {res.title}
                            </Link>
                            <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                              /resources/{res.slug}
                            </span>
                            {res.version && (
                              <span className="badge bg-light text-secondary ms-2" style={{ fontSize: '0.68rem' }}>
                                v{res.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: typeConfig.bg,
                            color: typeConfig.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        >
                          <i className={`bi ${typeConfig.icon} me-1`}></i>
                          {typeConfig.label}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <button
                          type="button"
                          className={`badge border-0 cursor-pointer ${isPublished ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}
                          onClick={() => handleTogglePublish(res)}
                          disabled={actionLoading === res.id}
                          style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                          title="Click to toggle publish status"
                        >
                          {isPublished ? '● Published' : '○ Draft'}
                        </button>
                      </td>

                      {/* Asset Count */}
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-paperclip me-1"></i>
                          {assetCount} {assetCount === 1 ? 'asset' : 'assets'}
                        </span>
                      </td>

                      {/* Updated Date */}
                      <td className="text-muted small">
                        {res.last_updated || '—'}
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/resources/${res.slug}`}
                            target="_blank"
                            className="btn btn-light"
                            title="View Public Page"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link
                            to={`/admin/resources/${res.id}`}
                            className="btn btn-light"
                            title="Edit Resource"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-light text-danger"
                            onClick={() => handleDelete(res)}
                            title="Delete Resource"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Select Resource Type Modal */}
      {isNewResourceModalOpen && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Select Resource Type</h5>
                <button type="button" className="btn-close" onClick={() => setIsNewResourceModalOpen(false)}></button>
              </div>
              <div className="modal-body py-4">
                <div className="row g-3">
                  {RESOURCE_TYPE_LIST.map((type) => (
                    <div className="col-12 col-md-6 col-lg-4" key={type.id}>
                      <button
                        className="card w-100 h-100 border text-start hover-bg-light transition-all p-3"
                        style={{ cursor: 'pointer', background: 'white' }}
                        onClick={() => {
                          setIsNewResourceModalOpen(false);
                          navigate(`/admin/resources/new?type=${type.id}`);
                        }}
                      >
                        <i className={`bi ${type.icon} fs-4 mb-2 d-block`} style={{ color: 'var(--green, #087f66)' }}></i>
                        <h6 className="fw-bold mb-1">{type.label}</h6>
                        <p className="text-muted small mb-0">{type.description || 'Create a new resource.'}</p>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
