import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function IqraAdminGuard({ children }) {
  const { isAdmin, isIqraAdmin, loading } = useAuth();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (loading) {
    return (
      <div className="admin-login-wrap">
        <div className="text-center text-muted">
          <div className="spinner-border text-success mb-3" role="status" />
          <div>Checking IQRA administrator access...</div>
        </div>
      </div>
    );
  }

  // A CMS editor is not automatically an IQRA administrator.
  if (!isAdmin) return <Navigate to="/admin" replace />;
  if (isIqraAdmin) return children;

  const enableIqraAccess = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured in this environment.');
      return;
    }

    setWorking(true);
    setError('');
    setNotice('');

    try {
      const { error: invokeError } = await supabase.functions.invoke('iqra-admin-bootstrap', {
        body: {},
      });

      if (invokeError) {
        setError(invokeError.message || 'Could not verify IQRA administrator access.');
        return;
      }

      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setError(refreshError.message);
      } else if (data?.session?.user?.app_metadata?.iqra_role !== 'admin') {
        setError('The refreshed session does not contain the IQRA admin claim. Contact the system owner.');
      } else {
        setNotice('IQRA administrator access is active. Loading the module…');
      }
    } catch (requestError) {
      setError(requestError?.message || 'The IQRA access request failed.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 620 }}>
        <div className="card-body p-4 p-lg-5">
          <div className="text-success small fw-semibold text-uppercase mb-2">Trusted access setup</div>
          <h1 className="h3 fw-bold mb-3">Enable IQRA administration</h1>
          <p className="text-secondary">
            Your account is a CMS administrator, but it does not yet have the separate IQRA administrator claim.
            Continue to ask the server to verify your CMS role and activate IQRA access for this account.
          </p>
          <p className="small text-secondary">
            This action does not grant access to CMS editors or learners. IQRA database policies remain the final authorization boundary.
          </p>
          {error && <div className="alert alert-warning" role="alert">{error}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          <button type="button" className="btn btn-success" onClick={enableIqraAccess} disabled={working}>
            {working ? 'Verifying access…' : 'Enable IQRA admin access'}
          </button>
        </div>
      </div>
    </div>
  );
}
