import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import '../styles/admin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase credentials are not configured in environment variables.');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg(error.message || 'Failed to sign in. Please verify credentials.');
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="admin-login-wrap">
      <Helmet>
        <title>Login — Admin CMS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="admin-login-box">
        <div className="text-center mb-4">
          <div className="admin-brand justify-content-center fs-4">
            NAÏM BSILI <span className="cms-badge">CMS</span>
          </div>
          <p className="text-muted small mt-2">Sign in to manage portfolio content</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="admin-alert admin-alert-warning mb-3">
            <i className="bi bi-exclamation-triangle"></i>
            <div>Supabase unconfigured. Add credentials to <code>.env</code> to enable live CMS editing.</div>
          </div>
        )}

        {errorMsg && (
          <div className="admin-alert admin-alert-error mb-3">
            <i className="bi bi-x-circle"></i>
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Email address</label>
            <input
              type="email"
              className="admin-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@naiimbsili.com"
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <input
              type="password"
              className="admin-form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary w-100 mt-2 py-2"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/" className="text-muted small text-decoration-none">
            ← Return to public website
          </a>
        </div>
      </div>
    </div>
  );
}
