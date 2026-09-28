import React from 'react';

export default function AdminEmptyState({ icon = 'bi-inbox', title = 'No items found', description = '', action = null }) {
  return (
    <div className="admin-empty-state">
      <i className={`bi ${icon} admin-empty-icon`}></i>
      <h4 className="text-white fs-6 mb-2">{title}</h4>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {action}
    </div>
  );
}
