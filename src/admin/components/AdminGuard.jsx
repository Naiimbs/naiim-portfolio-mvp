import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminGuard() {
  const { user, profile, loading, isAuthenticated, isEditor } = useAuth();

  if (loading) {
    return (
      <div className="admin-login-wrap">
        <div className="text-center text-muted">
          <div className="spinner-border text-success mb-3" role="status"></div>
          <div>Checking admin credentials...</div>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, redirect to /admin/login
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // 2. If authenticated but role is not admin or editor
  if (!isEditor) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-box text-center">
          <i className="bi bi-shield-lock-fill text-danger fs-1 mb-3"></i>
          <h3 className="text-white">Access Denied</h3>
          <p className="text-muted small mt-2">
            Your account (<code>{user.email}</code>) has role <strong>{profile?.role || 'viewer'}</strong>, which is not authorized to access the CMS editor.
          </p>
          <button
            className="admin-btn admin-btn-secondary mt-3 w-100"
            onClick={() => window.location.href = '/'}
          >
            Return to Public Portfolio
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
