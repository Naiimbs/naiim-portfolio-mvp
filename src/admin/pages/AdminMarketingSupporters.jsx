import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getDonations } from '../../services/marketing';

export default function AdminMarketingSupporters() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await getDonations({ search });
      setDonations(res.data || []);
    } catch (err) {
      console.error('[AdminMarketingSupporters] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search]);

  return (
    <div className="admin-page p-4">
      <Helmet>
        <title>Supporters &amp; Ba9chich — Admin CMS</title>
      </Helmet>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>
            Supporters &amp; Ba9chich Donations
          </h2>
          <p className="text-secondary small mb-0">
            Community contributions received via Ba9chich and supporter tips.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <a
            href="https://ba9chich.com/en/NaiimBsy"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-custom rounded-pill px-3 d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-box-arrow-up-right"></i>
            <span>View Public Ba9chich Page</span>
          </a>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="alert alert-info border-info border-opacity-25 rounded-3 p-3 mb-4 small bg-white d-flex align-items-start gap-3">
        <i className="bi bi-shield-check fs-4 text-info flex-shrink-0"></i>
        <div>
          <div className="fw-bold text-dark mb-0.5">Ba9chich Webhook Integration Architecture</div>
          <div className="text-secondary">
            Incoming webhooks are received via the dedicated Supabase Edge Function <code>ba9chich-webhook</code> with idempotent payment tracking. Because the Ba9chich payload currently omits cryptographic signature verification headers, transactions are tracked under <em>pending_verification</em> until official authentication parameters are confirmed.
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card border rounded-3 p-3 mb-4 shadow-xs bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by donor name, message, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 text-end">
            <span className="small text-muted">
              Total: <strong>{donations.length}</strong> donations
            </span>
          </div>
        </div>
      </div>

      {/* Supporters Table */}
      <div className="card border rounded-3 shadow-xs bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              <tr>
                <th className="py-3 px-3">Donor / Supporter</th>
                <th className="py-3">Amount &amp; Asset</th>
                <th className="py-3">Message</th>
                <th className="py-3">Payment ID</th>
                <th className="py-3 text-center">Status</th>
                <th className="py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
                    <span className="text-muted">Loading supporters records...</span>
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-cup-hot fs-3 d-block mb-2"></i>
                    No donations found.
                  </td>
                </tr>
              ) : (
                donations.map((don) => (
                  <tr key={don.id}>
                    <td className="px-3">
                      <div className="fw-bold text-dark">{don.donor_fullname || 'Supporter'}</div>
                      <div className="text-muted small font-monospace" style={{ fontSize: '0.75rem' }}>
                        @{don.donor_username || 'anonymous'}
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-dark font-monospace">
                        {don.amount}
                      </span>{' '}
                      <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50" style={{ fontSize: '0.7rem' }}>
                        {don.asset || 'DiamondsTND'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div className="text-secondary text-truncate small">
                        {don.message ? `"${don.message}"` : '—'}
                      </div>
                    </td>
                    <td className="font-monospace text-muted small">
                      {don.payment_id}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${don.verification_status === 'verified' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50'} rounded-pill px-2`} style={{ fontSize: '0.7rem' }}>
                        {don.verification_status === 'verified' ? '✓ Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="text-secondary small">
                      {new Date(don.received_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
