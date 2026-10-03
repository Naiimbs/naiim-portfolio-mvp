import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CommandBlock from '../components/infra/CommandBlock';

function InfoBox({ children, type = 'info' }) {
  const styles = {
    info: { bg: '#f0fdf7', border: '#b8e0d4', icon: 'bi-info-circle-fill', color: '#087f66' },
    warning: { bg: '#fef9e7', border: '#f5d97a', icon: 'bi-exclamation-triangle-fill', color: '#9a6c00' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <i className={`bi ${s.icon}`} style={{ color: s.color, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ fontSize: '0.84rem', color: '#10242a', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export default function AdminDocsSupabase() {
  return (
    <div>
      <Helmet>
        <title>Supabase & CMS Guide — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Supabase & CMS Configuration
        </h2>
        <p className="text-muted small mb-0">
          How Supabase powers authentication and content, build-time variable injection, and security boundaries.
        </p>
      </div>

      {/* Supabase Role Overview */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-database text-success me-2" />
          The Headless CMS Architecture
        </h5>
        <p className="small text-muted mb-3">
          The public portfolio displays static case studies, blog posts, and projects by default, but seamlessly falls back to Supabase live data when configured:
        </p>

        <ul className="small text-muted ps-3 mb-0" style={{ lineHeight: 1.6 }}>
          <li><strong>Authentication:</strong> Supabase Auth handles admin sessions, passwords, and magic links.</li>
          <li><strong>Authorization (RLS):</strong> PostgreSQL Row-Level Security policies ensure only authorized admin profiles can write or delete content.</li>
          <li><strong>Client-Side SDK:</strong> The browser executes queries directly using <code>@supabase/supabase-js</code> with the public anon key.</li>
        </ul>
      </div>

      {/* Build-Time Variable Injection */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-cpu text-success me-2" />
          Why Vite Variables Require Build-Time Injection
        </h5>
        <p className="small text-muted mb-2">
          This is the single most important concept regarding React/Vite Docker deployments:
        </p>

        <div style={{ background: '#f8faf9', border: '1px solid #dfe7e4', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <p className="small text-muted mb-2">
            In Node.js backend apps, <code>process.env</code> is read dynamically when the server runs.
          </p>
          <p className="small text-muted mb-0">
            <strong>In Vite React frontend apps:</strong> There is NO Node.js process at runtime. The app is served as pre-built <code>.js</code> and <code>.css</code> files by Nginx. Vite replaces <code>import.meta.env.VITE_SUPABASE_URL</code> with the actual string value <em>during the build step</em>. If variables are missing when <code>npm run build</code> runs, the output bundle contains <code>undefined</code> forever!
          </p>
        </div>

        <InfoBox type="warning">
          <strong>Key Rule:</strong> Editing <code>.env</code> on the VPS filesystem will NOT change what the visitor sees in their browser. You MUST pass the variables via <code>--build-arg</code> when building the Docker image.
        </InfoBox>

        <h6 className="fw-bold small text-muted text-uppercase mb-2">Dockerfile Configuration Pattern</h6>
        <div style={{ background: '#10242a', color: '#e8f5f1', borderRadius: '8px', padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '16px' }}>
          <span style={{ color: '#718187' }}># Inside builder stage, before RUN npm run build:</span>
          <br />
          <span style={{ color: '#5eead4' }}>ARG</span> VITE_SUPABASE_URL
          <br />
          <span style={{ color: '#5eead4' }}>ARG</span> VITE_SUPABASE_ANON_KEY
          <br />
          <span style={{ color: '#5eead4' }}>ENV</span> VITE_SUPABASE_URL=$VITE_SUPABASE_URL
          <br />
          <span style={{ color: '#5eead4' }}>ENV</span> VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
          <br />
          <span style={{ color: '#5eead4' }}>RUN</span> npm run build
        </div>
      </div>

      {/* Security Boundary */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-shield-lock text-success me-2" />
          Security Boundaries: Anon Key vs Service Role Key
        </h5>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div style={{ background: '#f0fdf7', border: '1px solid #b8e0d4', borderRadius: '8px', padding: '14px' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-check-circle-fill text-success" />
                <strong style={{ fontSize: '0.85rem' }}>Publishable Anon Key</strong>
              </div>
              <p className="small text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                Safe for browser bundles. Governed entirely by Row-Level Security (RLS). An unauthenticated user can only read public tables.
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-x-circle-fill text-danger" />
                <strong style={{ fontSize: '0.85rem', color: '#991b1b' }}>Service Role Key (SECRET)</strong>
              </div>
              <p className="small text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                Bypasses all RLS rules. <strong>NEVER</strong> pass this as a build arg or place it in client-side code.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Command */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-patch-check text-success me-2" />
          Verifying Supabase in Built Bundle
        </h5>
        <p className="small text-muted mb-3">
          You can check if the built bundle contains the Supabase project reference without running the UI:
        </p>

        <CommandBlock
          command="docker exec naiimbsili-portfolio grep -o 'https://[a-zA-Z0-9]*\.supabase\.co' /usr/share/nginx/html/assets/*.js"
          risk="safe"
          arabicExplanation="يبحث داخل ملفات الجافاسكربت المبنية وسط الكونتينر باش يتأكد أنو الـ URL متع Supabase تدمج بنجاح."
          expectedOutput="https://your-project-ref.supabase.co"
        />
      </div>
    </div>
  );
}
