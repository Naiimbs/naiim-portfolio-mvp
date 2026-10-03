import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import DocSearchBar from '../components/infra/DocSearchBar';
import DocCategoryCard from '../components/infra/DocCategoryCard';

const DOC_CATEGORIES = [
  {
    to: '/admin/docs/deployment',
    icon: 'bi-rocket-takeoff',
    title: 'Deployment Guide',
    description:
      'Complete step-by-step workflow: local commit → Git push → VPS pull → Docker build → container replacement → Caddy verification.',
    tags: ['Docker', 'Git', 'Production'],
  },
  {
    to: '/admin/docs/git',
    icon: 'bi-git',
    title: 'Git Workflow',
    description:
      'Git remotes, branches, tracking, push/pull commands, --ff-only explained, and common Git errors for this project.',
    tags: ['GitLab', 'GitHub', 'Branches'],
  },
  {
    to: '/admin/docs/docker',
    icon: 'bi-box-seam',
    title: 'Docker Guide',
    description:
      'Docker images vs containers, build, run, stop, rm, networks, the proxy network, Vite build-time arguments, and image cleanup.',
    tags: ['Build', 'Containers', 'Networks'],
  },
  {
    to: '/admin/docs/vps',
    icon: 'bi-server',
    title: 'VPS Guide',
    description:
      'OVH VPS access, SSH, Debian directory structure, disk/RAM inspection, and safe system monitoring commands.',
    tags: ['SSH', 'Debian', 'Monitoring'],
  },
  {
    to: '/admin/docs/caddy',
    icon: 'bi-shield-check',
    title: 'Caddy & HTTPS',
    description:
      'Caddy as reverse proxy, domain → container routing, automatic HTTPS certificates, proxy network connectivity, and 502 troubleshooting.',
    tags: ['HTTPS', 'Reverse Proxy', '502'],
  },
  {
    to: '/admin/docs/supabase',
    icon: 'bi-database',
    title: 'Supabase & CMS',
    description:
      'Supabase role in the portfolio, public Vite variables, build-time injection, why runtime .env changes do not affect a built image, and key vs service_role.',
    tags: ['Supabase', 'VITE_*', 'Auth'],
  },
  {
    to: '/admin/docs/troubleshooting',
    icon: 'bi-bug',
    title: 'Troubleshooting',
    description:
      '15 documented problems: Supabase unconfigured, build cache, Git conflicts, Caddy 502, wrong network, disk full, and more — each with diagnosis and fix.',
    tags: ['Errors', 'Diagnosis', 'Fixes'],
  },
  {
    to: '/admin/docs/rollback',
    icon: 'bi-arrow-counterclockwise',
    title: 'Rollback Procedure',
    description:
      'Safe rollback sequence: preserve the running container, test the previous image, verify, replace, and only then remove failed artifacts.',
    tags: ['Rollback', 'Safety', 'Recovery'],
  },
  {
    to: '/admin/docs/new-project',
    icon: 'bi-plus-square',
    title: 'New Project Deployment',
    description:
      'Interactive checklist for deploying a new project from scratch: LOCAL → GIT → VPS → DOCKER → CADDY → HEALTH → ADMIN.',
    tags: ['Checklist', 'New Project', 'Setup'],
  },
];

const ARCH_STEPS = [
  { label: 'LOCAL', icon: 'bi-laptop', desc: 'Code + Dockerfile' },
  { label: 'GIT', icon: 'bi-git', desc: 'GitLab (origin)' },
  { label: 'VPS', icon: 'bi-server', desc: 'git pull --ff-only' },
  { label: 'DOCKER', icon: 'bi-box-seam', desc: 'build + run' },
  { label: 'proxy network', icon: 'bi-hdd-network', desc: 'Docker bridge' },
  { label: 'CADDY', icon: 'bi-shield-check', desc: 'Reverse proxy + TLS' },
  { label: 'HTTPS', icon: 'bi-lock', desc: 'naiimbsili.com' },
];

export default function AdminDocs() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return DOC_CATEGORIES;
    const q = query.toLowerCase();
    return DOC_CATEGORIES.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div>
      <Helmet>
        <title>Deployment & Infrastructure Docs — Admin CMS</title>
      </Helmet>

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Deployment & Infrastructure Center
          </h2>
          <p className="text-muted small mb-0">
            Internal documentation for the Naiim portfolio VPS, Docker, Git, Caddy, and Supabase workflows.
          </p>
        </div>
        <DocSearchBar onSearch={setQuery} placeholder="Search guides, commands, errors..." />
      </div>

      {/* Architecture flow */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.92rem' }}>
          <i className="bi bi-diagram-3 me-2 text-success" />
          Production Architecture Flow
        </h5>
        <p className="text-muted small mb-3">
          Every deployment follows this path. Click any section to open the relevant guide.
        </p>
        <div className="d-flex flex-wrap align-items-center gap-1">
          {ARCH_STEPS.map((step, i) => (
            <React.Fragment key={step.label}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: '#f0f4f2',
                  borderRadius: '8px',
                  minWidth: '90px',
                }}
              >
                <i className={`bi ${step.icon} mb-1`} style={{ color: '#087f66', fontSize: '1.1rem' }} />
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: '#10242a', textAlign: 'center' }}>
                  {step.label}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#718187', textAlign: 'center' }}>{step.desc}</span>
              </div>
              {i < ARCH_STEPS.length - 1 && (
                <i className="bi bi-chevron-right" style={{ color: '#b0bec5', fontSize: '0.8rem' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Category grid */}
      {filtered.length === 0 ? (
        <div className="admin-card text-center py-5">
          <i className="bi bi-search fs-2 text-muted mb-3 d-block" />
          <p className="text-muted mb-1">No documentation found for &ldquo;{query}&rdquo;</p>
          <button
            type="button"
            className="admin-btn admin-btn-secondary mt-2"
            onClick={() => setQuery('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {query && (
            <p className="text-muted small mb-3">
              Showing {filtered.length} of {DOC_CATEGORIES.length} guides for &ldquo;{query}&rdquo;
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map((cat) => (
              <DocCategoryCard key={cat.to} {...cat} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
