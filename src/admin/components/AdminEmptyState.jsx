import React from 'react';

export default function AdminEmptyState({ icon = 'bi-inbox', title = 'No items found', description = '', action = null }) {
  return (
    <div className="admin-empty-state">
      <i className={`bi ${icon} admin-empty-icon`}></i>
      <h4 className="fw-bold fs-6 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h4>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {action}
    </div>
  );
}
