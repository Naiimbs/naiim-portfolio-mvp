import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getResourceDownloads, exportToCSV } from '../../services/marketing';

export default function AdminMarketingDownloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const res = await getResourceDownloads({
        search,
        resourceType: typeFilter,
        page,
        pageSize,
      });
      setDownloads(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('[AdminMarketingDownloads] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [search, typeFilter, page]);

  const handleExportCSV = () => {
    if (downloads.length === 0) return;
    const exportRows = downloads.map((d) => ({
      'Resource Slug': d.resource_slug,
      'Resource Type': d.resource_type,
      'Asset Name': d.asset_name || '',
      'Lead Name': d.lead_name || '',
      'Lead Email': d.lead_email || '',
      'UTM Source': d.utm_source || '',
      'UTM Medium': d.utm_medium || '',
      'UTM Campaign': d.utm_campaign || '',
      'Download Timestamp': new Date(d.downloaded_at).toISOString(),
    }));
    exportToCSV(`resource_downloads_${new Date().toISOString().split('T')[0]}`, exportRows);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="admin-page p-4">
      <Helmet>
        <title>Resource Downloads — Admin CMS</title>
      </Helmet>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-download me-2 text-primary"></i>
            Resource Downloads
          </h2>
          <p className="text-secondary small mb-0">
            Real-time logs of resource bundle downloads and attribution analytics.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={downloads.length === 0}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card border rounded-3 p-3 mb-4 shadow-xs bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by resource, lead email, UTM tags..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="col-12 col-md-4 col-lg-3">
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Resource Types</option>
              <option value="skill">Skills</option>
              <option value="template">Templates</option>
              <option value="document">Documents</option>
              <option value="guide">Guides</option>
              <option value="figma">Figma</option>
            </select>
          </div>

          <div className="col-12 col-md-2 ms-auto text-end">
            <span className="small text-muted">
              Total: <strong>{totalCount}</strong> downloads
            </span>
          </div>
        </div>
      </div>

      {/* Downloads Table */}
      <div className="card border rounded-3 shadow-xs bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              <tr>
                <th className="py-3 px-3">Resource / Asset</th>
                <th className="py-3">Lead Contact</th>
                <th className="py-3">Attribution (UTM)</th>
                <th className="py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="text-muted">Loading download records...</span>
                  </td>
                </tr>
              ) : downloads.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                    No download logs found.
                  </td>
                </tr>
              ) : (
                downloads.map((dl) => (
                  <tr key={dl.id}>
                    <td className="px-3">
                      <div className="fw-bold text-dark">{dl.resource_slug}</div>
                      <div className="text-muted small">
                        <span className="badge bg-light text-secondary border me-1.5" style={{ fontSize: '0.68rem' }}>
                          {dl.resource_type}
                        </span>
                        {dl.asset_name || 'Full Bundle'}
                      </div>
                    </td>
                    <td>
                      <div className="text-dark fw-semibold">{dl.lead_name || 'Anonymous'}</div>
                      <div className="text-muted small font-monospace" style={{ fontSize: '0.75rem' }}>
                        {dl.lead_email || '—'}
                      </div>
                    </td>
                    <td>
                      {dl.utm_source ? (
                        <div className="d-flex flex-wrap gap-1">
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '0.68rem' }}>
                            src: {dl.utm_source}
                          </span>
                          {dl.utm_campaign && (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: '0.68rem' }}>
                              camp: {dl.utm_campaign}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">Direct / Organic</span>
                      )}
                    </td>
                    <td className="text-secondary small">
                      {new Date(dl.downloaded_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-top d-flex align-items-center justify-content-between">
            <span className="small text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="d-flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn btn-sm btn-outline-secondary px-2.5 py-1"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-sm btn-outline-secondary px-2.5 py-1"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
