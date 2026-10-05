import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminContentRegistry } from '../../services/contentRegistry';
import { getCaseStudyPublishingReadiness } from '../../utils/registryHealth';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminCaseStudies() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCaseStudies() {
      setLoading(true);
      const res = await getAdminContentRegistry({ contentType: 'case-study' });
      if (res.error) {
        setError(res.error.message || 'Failed to load case studies from Content Registry');
      } else {
        setCaseStudies(res.data || []);
      }
      setLoading(false);
    }
    loadCaseStudies();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Case Studies Directory</h2>
          <p className="text-muted small mb-0">
            Authoritative registry-backed catalog of standard and custom flagship case studies.
          </p>
        </div>
        <Link to="/admin/registry" className="admin-btn admin-btn-secondary" title="View Full Content Registry">
          <i className="bi bi-grid-3x3-gap me-1"></i> Content Registry
        </Link>
      </div>

      <div className="admin-alert mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#087f66', fontSize: '0.8rem' }}>
        <i className="bi bi-shield-check text-success fs-6" />
        <div>
          <strong>Single Source of Truth:</strong> Case studies are authoritatively persisted and published via{' '}
          <code>content_registry.metadata.caseStudy</code>. Editing an entry updates the live public route at <code>/work/:slug</code>.
        </div>
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
          <div>Loading case studies from Content Registry...</div>
        </div>
      ) : caseStudies.length === 0 ? (
        <AdminEmptyState
          icon="bi-journal-x"
          title="No case studies found"
          description="Case studies will appear once registered in the Content Registry."
          action={
            <Link to="/admin/registry" className="admin-btn admin-btn-primary">
              <i className="bi bi-plus-lg"></i> Register New Content
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
                <th>Type</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Readiness</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseStudies.map((cs) => {
                const meta = cs.metadata || {};
                const csData = meta.caseStudy || {};
                const isCustom = csData.type === 'custom' || cs.slug === 'winni' || cs.slug === 'assestini';
                const readiness = getCaseStudyPublishingReadiness(cs);

                return (
                  <tr key={cs.id || cs.slug}>
                    <td>
                      <strong>{cs.title || cs.slug}</strong>
                      {meta.subtitle && <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{meta.subtitle}</div>}
                    </td>
                    <td>
                      <code>{cs.slug}</code>
                    </td>
                    <td>
                      <span className={`admin-badge ${isCustom ? 'draft' : 'published'}`} style={{ fontSize: '0.72rem' }}>
                        {isCustom ? 'Custom React' : 'Standard / CMS'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${cs.status || 'draft'}`}>
                        {cs.status || 'draft'}
                      </span>
                    </td>
                    <td>
                      <span className="small text-muted text-capitalize">
                        <i className={`bi ${cs.visibility === 'public' ? 'bi-globe2 text-success' : 'bi-lock text-warning'} me-1`} />
                        {cs.visibility || 'public'}
                      </span>
                    </td>
                    <td>
                      {readiness ? (
                        readiness.isReady ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
                            ✓ Ready
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle text-dark" style={{ fontSize: '0.68rem' }}>
                            {readiness.gates.length} Gate{readiness.gates.length !== 1 ? 's' : ''}
                          </span>
                        )
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td className="text-muted small">{cs.updated_at ? cs.updated_at.split('T')[0] : '—'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          to={`/admin/registry/${cs.id}`}
                          className="admin-btn admin-btn-primary py-1 px-2"
                          title="Edit in Content Registry CMS"
                        >
                          <i className="bi bi-pencil-square me-1"></i> Edit
                        </Link>
                        {cs.status === 'published' && cs.visibility === 'public' ? (
                          <a
                            href={`/work/${cs.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn admin-btn-secondary py-1 px-2 text-muted"
                            title="Preview Public Page"
                          >
                            <i className="bi bi-box-arrow-up-right"></i>
                          </a>
                        ) : (
                          <span className="admin-btn admin-btn-secondary py-1 px-2 text-muted opacity-50" title="Draft (Non-public)">
                            <i className="bi bi-eye-slash"></i>
                          </span>
                        )}
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
  );
}
