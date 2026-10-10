import React from 'react';

export default function ResourceTemplateCard({
  template,
  onPreview,
  onDownload,
}) {
  if (!template) return null;

  return (
    <div className="card border rounded-4 shadow-xs bg-white transition-all hover-border-primary overflow-hidden" style={{ borderColor: 'var(--line)' }}>
      <div className="row g-0">
        {/* Left Column: Information */}
        <div className="col-12 col-md-6 p-4 p-md-5 d-flex flex-column justify-content-center">
          <div className="mb-3">
            <span className="badge px-2.5 py-1 rounded-pill" style={{ backgroundColor: 'var(--green-soft)', color: 'var(--green)', fontSize: '0.72rem', fontWeight: 700 }}>
              <i className="bi bi-file-earmark-spreadsheet me-1"></i>
              XLSX
            </span>
          </div>

          <h4 className="fw-bold font-heading text-dark mb-2" style={{ fontSize: '1.25rem' }}>
            {template.name.replace(/\.xlsx$/i, '')}
          </h4>

          <p className="text-secondary small mb-4" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
            {template.description || 'A blank workbook for documenting structured UI/UX audit observations.'}
          </p>

          <div>
            <button
              type="button"
              onClick={() => onDownload(template)}
              className="btn btn-primary-custom rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2"
              style={{ fontSize: '0.9rem' }}
            >
              <i className="bi bi-download"></i>
              <span>Download template</span>
            </button>
          </div>
        </div>

        {/* Right Column: Spreadsheet Preview */}
        <div className="col-12 col-md-6 bg-light border-start border-light-subtle d-flex align-items-center justify-content-center p-4">
          <div className="w-100 h-100 rounded-3 border bg-white shadow-sm overflow-hidden d-flex flex-column" style={{ minHeight: '220px' }}>
            {/* Fake Excel Header */}
            <div className="bg-success text-white px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
              <i className="bi bi-file-earmark-spreadsheet-fill"></i>
              <span>{template.name}</span>
            </div>
            <div className="bg-light border-bottom px-2 py-1 d-flex gap-1">
              <div className="bg-white border rounded px-3 py-1 text-muted" style={{ fontSize: '0.65rem' }}>File</div>
              <div className="bg-white border rounded px-3 py-1 text-muted" style={{ fontSize: '0.65rem' }}>Home</div>
              <div className="bg-white border rounded px-3 py-1 text-muted" style={{ fontSize: '0.65rem' }}>Insert</div>
            </div>
            {/* Fake Excel Body */}
            <div className="flex-grow-1 p-3 d-flex flex-column gap-2">
              <div className="w-50 bg-light rounded" style={{ height: '12px' }}></div>
              <div className="w-75 bg-light rounded" style={{ height: '12px' }}></div>
              <div className="w-100 bg-light rounded" style={{ height: '12px' }}></div>
              <div className="w-100 bg-light rounded" style={{ height: '12px' }}></div>
              <div className="w-75 bg-light rounded" style={{ height: '12px' }}></div>
            </div>
            <div className="bg-light border-top px-3 py-1 d-flex gap-2" style={{ fontSize: '0.65rem' }}>
              <span className="bg-white border px-2 py-0.5 rounded text-dark fw-bold">Audit Notes</span>
              <span className="text-muted px-2 py-0.5">Responsive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
