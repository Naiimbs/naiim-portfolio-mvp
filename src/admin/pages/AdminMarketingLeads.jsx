import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getMarketingLeads, exportToCSV } from '../../services/marketing';

export default function AdminMarketingLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [consentFilter, setConsentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getMarketingLeads({
        search,
        consent: consentFilter,
        page,
        pageSize,
      });
      setLeads(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('[AdminMarketingLeads] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, consentFilter, page]);

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const exportRows = leads.map((l) => ({
      Email: l.email,
      Name: l.name,
      Role: l.role || '',
      Company: l.company || '',
      'Marketing Consent': l.marketing_consent ? 'YES' : 'NO',
      'Consent Date': l.consent_at ? new Date(l.consent_at).toLocaleDateString() : '',
      'Total Downloads': l.downloads_count || 1,
      'First Seen': new Date(l.first_seen_at || l.created_at).toLocaleDateString(),
      'Last Seen': new Date(l.last_seen_at || l.created_at).toLocaleDateString(),
    }));
    exportToCSV(`marketing_leads_${new Date().toISOString().split('T')[0]}`, exportRows);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="admin-page p-4">
      <Helmet>
        <title>Marketing Leads — Admin CMS</title>
      </Helmet>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-people-fill me-2 text-primary"></i>
            Marketing Leads
          </h2>
          <p className="text-secondary small mb-0">
            Contacts captured through free resource downloads and tools.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
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
                placeholder="Search by name, email, role, company..."
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
              value={consentFilter}
              onChange={(e) => {
                setConsentFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Consent Statuses</option>
              <option value="granted">Marketing Consent Granted</option>
              <option value="denied">No Consent (Download Only)</option>
            </select>
          </div>

          <div className="col-12 col-md-2 ms-auto text-end">
            <span className="small text-muted">
              Total: <strong>{totalCount}</strong> leads
            </span>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card border rounded-3 shadow-xs bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              <tr>
                <th className="py-3 px-3">Lead / Contact</th>
                <th className="py-3">Role &amp; Company</th>
                <th className="py-3 text-center">Consent</th>
                <th className="py-3 text-center">Downloads</th>
                <th className="py-3">First Seen</th>
                <th className="py-3">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="text-muted">Loading marketing leads...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                    No marketing leads found matching current filter.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-3">
                      <div className="fw-bold text-dark">{lead.name}</div>
                      <div className="text-muted small font-monospace" style={{ fontSize: '0.75rem' }}>
                        {lead.email}
                      </div>
                    </td>
                    <td>
                      <div className="text-dark">{lead.role || '—'}</div>
                      <div className="text-muted small">{lead.company || '—'}</div>
                    </td>
                    <td className="text-center">
                      {lead.marketing_consent ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2">
                          <i className="bi bi-check2 me-1"></i> Subscribed
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill px-2">
                          Download Only
                        </span>
                      )}
                    </td>
                    <td className="text-center font-monospace fw-bold text-primary">
                      {lead.downloads_count || 1}
                    </td>
                    <td className="text-secondary small">
                      {new Date(lead.first_seen_at || lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-secondary small">
                      {new Date(lead.last_seen_at || lead.created_at).toLocaleDateString()}
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
