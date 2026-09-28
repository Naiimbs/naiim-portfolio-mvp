import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminHeader({ title = 'CMS Admin' }) {
  return (
    <header className="admin-header">
      <h1 className="admin-header-title">{title}</h1>
      <div className="d-flex align-items-center gap-3">
        <Link to="/" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
          <i className="bi bi-eye"></i> View Live Site
        </Link>
      </div>
    </header>
  );
}
