import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminOnlyGuard({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-login-wrap">
        <div className="text-center text-muted">
          <div className="spinner-border text-success mb-3" role="status" />
          <div>Checking Academy administrator access...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
