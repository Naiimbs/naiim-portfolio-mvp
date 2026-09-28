import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCaseStudies } from '../../services/caseStudies';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminCaseStudies() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCaseStudies() {
      setLoading(true);
      const res = await getAdminCaseStudies();
      if (res.error) {
        setError(res.error.message || 'Failed to load case studies');
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
          <p className="text-muted small mb-0">Overview of standard and bespoke flagship case studies.</p>
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
          <div>Loading case studies...</div>
        </div>
      ) : caseStudies.length === 0 ? (
        <AdminEmptyState
          icon="bi-journal-x"
          title="No case studies found"
          description="Case studies will appear once published."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Type</th>
                <th>Sections</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseStudies.map((cs) => (
                <tr key={cs.id || cs.slug}>
                  <td>
                    <strong>{cs.title || cs.slug}</strong>
                    {cs.subtitle && <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{cs.subtitle}</div>}
                  </td>
                  <td>
                    <code>{cs.slug || cs.project?.slug}</code>
                  </td>
                  <td>
                    <span className={`admin-badge ${cs.type === 'custom' ? 'draft' : 'published'}`} style={{ fontSize: '0.72rem' }}>
                      {cs.type === 'custom' ? 'Custom React' : 'Standard / CMS'}
                    </span>
                  </td>
                  <td>
                    <span className="fw-semibold">{cs.sectionsCount ?? (cs.sections ? cs.sections.length : 0)}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${cs.status || 'published'}`}>
                      {cs.status || 'published'}
                    </span>
                  </td>
                  <td className="text-muted small">{cs.updated_at ? cs.updated_at.split('T')[0] : '2026-09-28'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        to={`/admin/case-studies/${cs.id || cs.slug}`}
                        className="admin-btn admin-btn-secondary py-1 px-2"
                        title="Visual Case Study Editor"
                      >
                        <i className="bi bi-pencil-square"></i> Edit
                      </Link>
                      <Link
                        to={`/work/${cs.slug || cs.project?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary py-1 px-2 text-muted"
                        title="Preview Public Page"
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
