import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function AdminMarketingCampaigns() {
  return (
    <div className="admin-page p-4">
      <Helmet>
        <title>Campaigns — Admin CMS</title>
      </Helmet>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-send-fill me-2 text-primary"></i>
            Marketing Campaigns
          </h2>
          <p className="text-secondary small mb-0">
            Email broadcasts, update newsletters, and automated release announcements.
          </p>
        </div>
      </div>

      {/* Clean Placeholder Container */}
      <div className="card border rounded-4 p-5 text-center bg-white shadow-xs mx-auto" style={{ maxWidth: '680px', marginTop: '40px' }}>
        <div className="w-16 h-16 rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center mb-4 mx-auto" style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}>
          <i className="bi bi-send-check"></i>
        </div>

        <h3 className="fw-bold font-heading text-dark mb-2">Campaign Management — Coming Next</h3>
        
        <p className="text-secondary small mb-4 leading-relaxed" style={{ maxWidth: '520px', margin: '0 auto' }}>
          Lead capture and download attribution are now active and capturing audience data. Broadcast email dispatching and newsletter workflows will be configured in the upcoming marketing phase.
        </p>

        <div className="row g-3 text-start mb-4">
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-3 bg-light border h-100">
              <div className="fw-bold small text-dark mb-1">1. Audience Filter</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Segment leads by resource type and explicit consent.</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-3 bg-light border h-100">
              <div className="fw-bold small text-dark mb-1">2. Skill Updates</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Notify developers when an agent skill reaches a new version.</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-3 bg-light border h-100">
              <div className="fw-bold small text-dark mb-1">3. Analytics</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Track open rates, click-throughs, and repeat downloads.</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-center gap-3">
          <Link to="/admin/marketing/leads" className="btn btn-sm btn-primary-custom rounded-pill px-4">
            <i className="bi bi-people-fill me-1"></i> View Captured Leads
          </Link>
          <Link to="/admin/marketing/downloads" className="btn btn-sm btn-outline-secondary rounded-pill px-4">
            <i className="bi bi-download me-1"></i> View Download Logs
          </Link>
        </div>
      </div>
    </div>
  );
}
