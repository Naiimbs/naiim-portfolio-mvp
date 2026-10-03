import React, { useState } from 'react';

const CHECKLIST_LAYERS = [
  {
    id: 'local',
    label: 'LOCAL MACHINE',
    icon: 'bi-laptop',
    color: '#3b82f6',
    items: [
      { id: 'repo_created', text: 'Repository created (or cloned)' },
      { id: 'framework', text: 'Framework chosen and scaffolded (e.g. React/Vite)' },
      { id: 'dockerfile', text: 'Dockerfile written and tested locally' },
      { id: 'env_example', text: '.env.example documented with all required variable names' },
      { id: 'prod_vars', text: 'Production environment variable values identified (not committed)' },
      { id: 'local_build', text: 'Local build passes (npm run build)' },
    ],
  },
  {
    id: 'git',
    label: 'GIT',
    icon: 'bi-git',
    color: '#f59e0b',
    items: [
      { id: 'branch', text: 'Dedicated branch created for the project' },
      { id: 'initial_commit', text: 'Initial commit made' },
      { id: 'gitlab_remote', text: 'GitLab repository created and set as origin remote' },
      { id: 'pushed', text: 'Branch pushed to GitLab (git push origin <branch>)' },
      { id: 'gitignore', text: '.gitignore includes .env and all secret files' },
    ],
  },
  {
    id: 'vps',
    label: 'VPS',
    icon: 'bi-server',
    color: '#8b5cf6',
    items: [
      { id: 'vps_dir', text: '/srv/projects/<slug>/app directory created' },
      { id: 'vps_clone', text: 'Repository cloned or pulled on VPS' },
      { id: 'vps_permissions', text: 'File permissions correct (not root-owned)' },
    ],
  },
  {
    id: 'docker',
    label: 'DOCKER',
    icon: 'bi-box-seam',
    color: '#0ea5e9',
    items: [
      { id: 'image_name', text: 'Docker image name decided: <slug>:latest' },
      { id: 'container_name', text: 'Docker container name decided: <slug>' },
      { id: 'build_args', text: 'Build arguments documented (VITE_* or equivalent)' },
      { id: 'build_test', text: 'Image built successfully on VPS' },
      { id: 'test_container', text: 'Test container started and verified (separate name from production)' },
      { id: 'test_responds', text: 'Test container responds correctly on internal port' },
      { id: 'prod_container', text: 'Production container started with --network proxy' },
      { id: 'proxy_network', text: 'Container confirmed on proxy network (docker network inspect proxy)' },
    ],
  },
  {
    id: 'caddy',
    label: 'CADDY',
    icon: 'bi-shield-check',
    color: '#10b981',
    items: [
      { id: 'dns', text: 'DNS A record created pointing domain to VPS IP' },
      { id: 'caddy_entry', text: 'Caddyfile entry added for this domain → container:port' },
      { id: 'caddy_reload', text: 'Caddy reloaded (caddy reload or docker exec caddy ...)' },
      { id: 'https_cert', text: 'HTTPS certificate issued automatically by Caddy' },
      { id: 'http_redirect', text: 'HTTP → HTTPS redirect confirmed' },
    ],
  },
  {
    id: 'health',
    label: 'HEALTH',
    icon: 'bi-heart-pulse',
    color: '#ef4444',
    items: [
      { id: 'health_url', text: 'Public URL responds correctly (curl -I https://<domain>)' },
      { id: 'health_200', text: 'HTTP status 200 (or expected status) confirmed' },
      { id: 'no_console_errors', text: 'Browser console shows no critical errors' },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    icon: 'bi-person-gear',
    color: '#087f66',
    items: [
      { id: 'admin_register', text: 'Project registered in Infrastructure Registry (Phase 2+)' },
      { id: 'deployment_record', text: 'First deployment recorded in Deployment History' },
      { id: 'commit_sha', text: 'Deployed commit SHA recorded in registry' },
    ],
  },
];

export default function NewProjectChecklist() {
  const totalItems = CHECKLIST_LAYERS.reduce((sum, layer) => sum + layer.items.length, 0);

  const [checked, setChecked] = useState(() => {
    const initial = {};
    CHECKLIST_LAYERS.forEach((layer) => {
      layer.items.forEach((item) => {
        initial[item.id] = false;
      });
    });
    return initial;
  });

  const toggleItem = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPct = Math.round((checkedCount / totalItems) * 100);

  const handleReset = () => {
    setChecked((prev) => {
      const reset = {};
      Object.keys(prev).forEach((k) => { reset[k] = false; });
      return reset;
    });
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="admin-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#10242a' }}>
              Deployment Checklist
            </span>
            <span className="ms-2" style={{ fontSize: '0.82rem', color: '#718187' }}>
              {checkedCount} / {totalItems} completed
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '1.4rem',
                color: progressPct === 100 ? '#087f66' : '#10242a',
              }}
            >
              {progressPct}%
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-secondary py-1 px-3"
              onClick={handleReset}
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-arrow-counterclockwise me-1" />
              Reset
            </button>
          </div>
        </div>

        <div
          style={{
            height: '8px',
            background: '#f0f4f2',
            borderRadius: '100px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#087f66' : '#4ade80',
              borderRadius: '100px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {progressPct === 100 && (
          <div className="admin-alert admin-alert-success mt-3" style={{ marginBottom: 0 }}>
            <i className="bi bi-check-circle-fill" />
            <div>
              <strong>Checklist complete.</strong> Verify the live URL and record this deployment in the Infrastructure Registry.
            </div>
          </div>
        )}
      </div>

      {/* Layers */}
      {CHECKLIST_LAYERS.map((layer) => {
        const layerChecked = layer.items.filter((item) => checked[item.id]).length;
        const layerComplete = layerChecked === layer.items.length;

        return (
          <div key={layer.id} className="admin-card mb-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: `${layer.color}18`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className={`bi ${layer.icon}`} style={{ color: layer.color, fontSize: '1rem' }} />
              </div>
              <div>
                <span
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: layer.color,
                    display: 'block',
                  }}
                >
                  {layer.label}
                </span>
              </div>
              <div className="ms-auto">
                <span style={{ fontSize: '0.78rem', color: layerComplete ? '#087f66' : '#718187', fontWeight: layerComplete ? 700 : 400 }}>
                  {layerComplete ? (
                    <><i className="bi bi-check-circle-fill text-success me-1" />Done</>
                  ) : (
                    `${layerChecked}/${layer.items.length}`
                  )}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {layer.items.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: checked[item.id] ? '#f0fdf7' : 'transparent',
                    transition: 'background 0.12s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked[item.id]}
                    onChange={() => toggleItem(item.id)}
                    style={{ marginTop: '2px', flexShrink: 0, accentColor: '#087f66', cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: checked[item.id] ? '#718187' : '#10242a',
                      textDecoration: checked[item.id] ? 'line-through' : 'none',
                      transition: 'all 0.12s ease',
                      lineHeight: 1.45,
                    }}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-muted small mt-2">
        <i className="bi bi-info-circle me-1" />
        Checklist state is not saved to the database in Phase 1. Reset when starting a new project.
      </p>
    </div>
  );
}
