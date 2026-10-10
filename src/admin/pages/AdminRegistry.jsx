import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getAdminContentRegistry,
  createContentRegistryEntry,
  updateContentRegistryEntry,
  deleteContentRegistryEntry,
  checkRegistryEntryDependencies,
  toggleRegistryPublish,
  toggleRegistryVisibility,
  toggleRegistryFeatured,
} from '../../services/contentRegistry';
import { resolveAsset, DEFAULT_LOGO_MARKS } from '../../services/assetRegistry';
import { computeRegistryHealthSummary, computeEntryHealth, getCaseStudyPublishingReadiness } from '../../utils/registryHealth';
import { isPublicRouteImplemented, getPublicRouteStatus } from '../../services/contentRouteResolver';
import { isSupabaseConfigured } from '../../lib/supabase';
import { executeCaseStudiesMigration } from '../../services/caseStudyRegistryMigration';
import RegistryFormModal from '../components/cms/RegistryFormModal';
import AdminEmptyState from '../components/AdminEmptyState';

const TYPE_LABELS = {
  'case-study': { label: 'Case Study', badgeBg: '#e8f5f1', color: '#087f66' },
  page: { label: 'Site Page', badgeBg: '#e0e7ff', color: '#3730a3' },
  agent: { label: 'AI Agent', badgeBg: '#ede9fe', color: '#6d28d9' },
  plugin: { label: 'Plugin', badgeBg: '#e0f2fe', color: '#0369a1' },
  blog: { label: 'Blog', badgeBg: '#fef3c7', color: '#b45309' },
  other: { label: 'Other', badgeBg: '#f3f4f6', color: '#4b5563' },
};

function formatDate(ts) {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

function HealthBadge({ level, score, issues = [] }) {
  const config = {
    ok: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: 'bi-check-circle-fill' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', icon: 'bi-exclamation-triangle-fill' },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', icon: 'bi-x-circle-fill' },
  };
  const { bg, border, color, icon } = config[level] || config.ok;
  const tooltip = issues.length > 0 ? issues.map((i) => i.message).join('\n') : 'All fields complete.';

  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: bg,
        border: `1px solid ${border}`,
        color,
        borderRadius: '20px',
        padding: '2px 8px',
        fontSize: '0.7rem',
        fontWeight: 700,
        cursor: 'help',
        whiteSpace: 'nowrap',
      }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: '0.65rem' }} />
      {score}%
    </span>
  );
}

function IntegrityPanel({ issues }) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="mb-4 p-3 rounded border" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-exclamation-triangle-fill text-warning" />
        <strong className="small" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Registry Integrity Issues ({issues.length})
        </strong>
      </div>
      <ul className="mb-0 ps-3" style={{ fontSize: '0.8rem' }}>
        {issues.map((issue, i) => (
          <li key={i} style={{ color: issue.level === 'error' ? '#b91c1c' : '#92400e' }}>
            <i className={`bi ${issue.level === 'error' ? 'bi-x-circle' : 'bi-exclamation-circle'} me-1`} />
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Concise publishing readiness badge for case-study entries in the registry table.
 * Reuses getCaseStudyPublishingReadiness() — no duplicate logic.
 * Only rendered for content_type === 'case-study'.
 */
function ReadinessBadge({ entry }) {
  if (entry.content_type !== 'case-study') return null;
  const r = getCaseStudyPublishingReadiness(entry);
  if (entry.status === 'published' && entry.visibility === 'public') {
    return (
      <div className="mt-1">
        <span
          style={{ fontSize: '0.66rem', color: '#087f66', fontWeight: 700 }}
          title="Live on portfolio"
        >
          <i className="bi bi-check-circle-fill me-1" />Live
        </span>
      </div>
    );
  }
  if (r.isReady) {
    const tooltip = r.advisories.length > 0
      ? `Ready to publish.\nAdvisories: ${r.advisories.map((a) => a.message).join('; ')}`
      : 'All gates pass. Ready to publish.';
    return (
      <div className="mt-1">
        <span
          style={{ fontSize: '0.66rem', color: r.advisories.length > 0 ? '#b45309' : '#087f66', fontWeight: 700, cursor: 'help' }}
          title={tooltip}
        >
          <i className={`bi ${r.advisories.length > 0 ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-1`} />
          {r.advisories.length > 0 ? 'Advisory' : '✓ Ready'}
        </span>
      </div>
    );
  }
  const tooltip = `Blocked from publishing.\n${r.gates.map((g) => g.message).join('; ')}`;
  return (
    <div className="mt-1">
      <span
        style={{ fontSize: '0.66rem', color: '#b91c1c', fontWeight: 700, cursor: 'help' }}
        title={tooltip}
      >
        <i className="bi bi-x-circle me-1" />Blocked
      </span>
    </div>
  );
}

export default function AdminRegistry() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Safe Deletion with Dependency Checking State
  const [itemPendingDelete, setItemPendingDelete] = useState(null);
  const [deleteDependencies, setDeleteDependencies] = useState(null);
  const [isCheckingDeps, setIsCheckingDeps] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    setLoading(true);
    setError(null);
    const res = await getAdminContentRegistry();
    if (res.error) {
      setError(res.error.message || 'Failed to load registry.');
      setEntries([]);
    } else {
      setEntries(res.data || []);
    }
    setLoading(false);
  }

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const healthSummary = useMemo(() => computeRegistryHealthSummary(entries), [entries]);

  const stats = useMemo(() => {
    const total = entries.length;
    const published = entries.filter((e) => e.status === 'published' && e.visibility === 'public').length;
    const featured = entries.filter((e) => e.featured).length;
    const draft = entries.filter((e) => e.status === 'draft' || e.visibility === 'private').length;
    const publicReady = entries.filter((e) => e.status === 'published' && e.visibility === 'public' && isPublicRouteImplemented(e)).length;
    return { total, published, featured, draft, publicReady };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchType = typeFilter === 'all' || item.content_type === typeFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchRoute =
        routeFilter === 'all' ||
        (routeFilter === 'implemented' && isPublicRouteImplemented(item)) ||
        (routeFilter === 'not-implemented' && !isPublicRouteImplemented(item));
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.slug?.toLowerCase().includes(q) ||
        item.public_route?.toLowerCase().includes(q);
      let matchHealth = true;
      if (healthFilter !== 'all') {
        const h = healthSummary.healthByEntryId[item.id];
        const level = h ? h.level : computeEntryHealth(item).level;
        matchHealth = level === healthFilter;
      }
      return matchType && matchStatus && matchRoute && matchSearch && matchHealth;
    });
  }, [entries, typeFilter, statusFilter, routeFilter, search, healthFilter, healthSummary]);

  const handleOpenCreate = () => { setEditingEntry(null); setIsModalOpen(true); };
  const handleOpenEdit = (entry) => { setEditingEntry(entry); setIsModalOpen(true); };

  const handleModalSubmit = async (payload) => {
    setSubmitting(true);
    if (editingEntry) {
      const res = await updateContentRegistryEntry(editingEntry.id, payload);
      if (res.error) { setError(res.error.message || 'Failed to update entry.'); }
      else { showNotification(`Updated "${payload.title}" successfully.`); setIsModalOpen(false); await loadEntries(); }
    } else {
      const res = await createContentRegistryEntry(payload);
      if (res.error) { setError(res.error.message || 'Failed to create entry.'); }
      else { showNotification(`Created "${payload.title}" successfully.`); setIsModalOpen(false); await loadEntries(); }
    }
    setSubmitting(false);
  };

  const handleOpenDelete = async (item) => {
    setItemPendingDelete(item);
    setIsCheckingDeps(true);
    setDeleteDependencies(null);
    const deps = await checkRegistryEntryDependencies(item);
    setDeleteDependencies(deps);
    setIsCheckingDeps(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemPendingDelete) return;
    setDeleting(true);
    setError(null);
    const itemToDelete = itemPendingDelete;
    const res = await deleteContentRegistryEntry(itemToDelete.id);
    if (res?.error) {
      setError(res.error.message || 'Failed to delete registry entry.');
      setDeleting(false);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== itemToDelete.id));
      showNotification(`Deleted "${itemToDelete.title}" from Registry.`);
      setItemPendingDelete(null);
      setDeleteDependencies(null);
      setDeleting(false);
      await loadEntries();
    }
  };

  const handleArchiveInstead = async () => {
    if (!itemPendingDelete) return;
    setDeleting(true);
    setError(null);
    const itemToArchive = itemPendingDelete;
    const res = await updateContentRegistryEntry(itemToArchive.id, { status: 'archived' });
    if (res?.error) {
      setError(res.error.message || 'Failed to archive registry entry.');
      setDeleting(false);
    } else {
      setEntries((prev) => prev.map((e) => e.id === itemToArchive.id ? { ...e, status: 'archived' } : e));
      showNotification(`Archived "${itemToArchive.title}" (safe state).`);
      setItemPendingDelete(null);
      setDeleteDependencies(null);
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (item) => {
    const res = await toggleRegistryPublish(item.id, item.status);
    if (res.error) { setError(res.error.message); }
    else { setEntries((prev) => prev.map((e) => e.id === item.id ? { ...e, status: item.status === 'published' ? 'draft' : 'published' } : e)); }
  };

  const handleToggleVisibility = async (item) => {
    const res = await toggleRegistryVisibility(item.id, item.visibility);
    if (res.error) { setError(res.error.message); }
    else { setEntries((prev) => prev.map((e) => e.id === item.id ? { ...e, visibility: item.visibility === 'public' ? 'private' : 'public' } : e)); }
  };

  const handleToggleFeatured = async (item) => {
    const res = await toggleRegistryFeatured(item.id, item.featured);
    if (res.error) { setError(res.error.message); }
    else { setEntries((prev) => prev.map((e) => e.id === item.id ? { ...e, featured: !item.featured } : e)); }
  };

  const unmigratedCount = useMemo(() => {
    return entries.filter(
      (e) => e.content_type === 'case-study' && (!e.metadata?.caseStudy || e.metadata?.caseStudy?.version !== 1)
    ).length;
  }, [entries]);

  const [migrating, setMigrating] = useState(false);

  const handleRunMigration = async () => {
    setMigrating(true);
    setError(null);
    try {
      const res = await executeCaseStudiesMigration(entries);
      if (res.success) {
        showNotification('Successfully migrated all case studies to Registry metadata!');
      } else {
        const failedCount = res.results.filter((r) => r.status === 'failed').length;
        setError(`Migration finished with ${failedCount} errors.`);
      }
      await loadEntries();
    } catch (err) {
      setError(err.message || 'Migration failed.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div>
      <Helmet><title>Content Registry — Admin CMS</title></Helmet>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Content Registry</h2>
          <p className="text-muted small mb-0">Single source of truth for portfolio items, routes, content types, visual assets, and publication states.</p>
        </div>
        <div className="d-flex gap-2">
          {unmigratedCount > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleRunMigration}
              disabled={migrating}
            >
              <i className={`bi ${migrating ? 'spinner-border spinner-border-sm' : 'bi-arrow-repeat'} me-1`} />
              {migrating ? 'Migrating…' : `Migrate Case Studies (${unmigratedCount})`}
            </button>
          )}
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg me-1" /> New Entry
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-2">
          <div className="admin-card p-3 mb-0">
            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Total Items</div>
            <div className="fs-4 fw-bold text-dark">{stats.total}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="admin-card p-3 mb-0">
            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Live Public</div>
            <div className="fs-4 fw-bold text-success">{stats.published}</div>
            <div className="small text-muted" style={{ fontSize: '0.68rem' }}>{stats.publicReady} route ready</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="admin-card p-3 mb-0">
            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Featured</div>
            <div className="fs-4 fw-bold text-warning">{stats.featured}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="admin-card p-3 mb-0">
            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Draft / Private</div>
            <div className="fs-4 fw-bold text-secondary">{stats.draft}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="admin-card p-3 mb-0">
            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Avg. Completeness</div>
            <div className="fs-4 fw-bold" style={{ color: healthSummary.avgScore >= 80 ? '#087f66' : healthSummary.avgScore >= 50 ? '#b45309' : '#b91c1c' }}>
              {healthSummary.avgScore}%
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="admin-card p-3 mb-0">
            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Health Issues</div>
            <div className="d-flex align-items-center gap-2 mt-1">
              {healthSummary.totalErrors > 0 && (
                <span className="fw-bold text-danger" style={{ fontSize: '0.85rem' }} title={`${healthSummary.totalErrors} errors`}>
                  <i className="bi bi-x-circle-fill me-1" />{healthSummary.totalErrors}
                </span>
              )}
              {healthSummary.totalWarnings > 0 && (
                <span className="fw-bold" style={{ fontSize: '0.85rem', color: '#b45309' }} title={`${healthSummary.totalWarnings} warnings`}>
                  <i className="bi bi-exclamation-triangle-fill me-1" />{healthSummary.totalWarnings}
                </span>
              )}
              {healthSummary.totalErrors === 0 && healthSummary.totalWarnings === 0 && (
                <span className="text-success" style={{ fontSize: '0.82rem' }}>
                  <i className="bi bi-check-circle-fill me-1" />All OK
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-4">
          <i className="bi bi-exclamation-triangle-fill" />
          <div><strong>Supabase Unconfigured:</strong> Live registry changes require Supabase credentials in <code>.env</code>.</div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-octagon-fill text-danger" />
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>{error}</span>
            <button type="button" className="btn-close btn-close-sm" onClick={() => setError(null)} />
          </div>
        </div>
      )}

      {successMessage && (
        <div className="admin-alert mb-4" style={{ background: '#f0fdf7', border: '1px solid #b8e0d4', color: '#087f66' }}>
          <i className="bi bi-check-circle-fill text-success" />
          <div>{successMessage}</div>
        </div>
      )}

      {!loading && <IntegrityPanel issues={healthSummary.integrityIssues} />}

      {/* Filters Bar */}
      <div className="admin-card mb-4" style={{ padding: '16px 20px' }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search" /></span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by title, slug, or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary border-start-0" type="button" onClick={() => setSearch('')}>
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="case-study">Case Studies</option>
              <option value="page">Site Pages</option>
              <option value="agent">AI Agents</option>
              <option value="plugin">Plugins</option>
              <option value="blog">Blog Articles</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
              <option value="all">All Routes</option>
              <option value="implemented">🟢 Implemented</option>
              <option value="not-implemented">⚪ Not Implemented</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
              <option value="all">All Health</option>
              <option value="ok">✓ OK</option>
              <option value="warning">⚠ Warnings</option>
              <option value="error">✕ Errors</option>
            </select>
          </div>
          <div className="col-md-1 text-end">
            <span className="text-muted small fw-bold">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-card text-center py-5 text-muted">
          <div className="spinner-border text-success mb-3" role="status" />
          <div>Loading registry entries...</div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <AdminEmptyState
          icon="bi-journal-x"
          title="No registry entries found"
          description={
            search || typeFilter !== 'all' || statusFilter !== 'all' || healthFilter !== 'all'
              ? 'No entries match your filter criteria.'
              : 'The content registry is currently empty. Click "New Entry" to register your first item.'
          }
          action={
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenCreate}>
              <i className="bi bi-plus-lg me-1" /> New Entry
            </button>
          }
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '54px' }}>Order</th>
                <th>Title / Type</th>
                <th>Slug &amp; Route</th>
                <th>Visual Assets</th>
                <th>Health</th>
                <th>Status</th>
                <th>Visibility</th>
                <th style={{ textAlign: 'center' }}>Featured</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((item) => {
                const typeMeta = TYPE_LABELS[item.content_type] || TYPE_LABELS.other;
                const isLive = item.status === 'published' && item.visibility === 'public';
                const route = item.public_route || `/work/${item.slug}`;
                const hasHero = Boolean(item.metadata?.heroImage || resolveAsset(item.slug));
                const logoInfo = item.metadata?.logoMark || DEFAULT_LOGO_MARKS[item.slug];
                const entryHealth = healthSummary.healthByEntryId[item.id] || computeEntryHealth(item);
                const routeStatus = getPublicRouteStatus(item);

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1">#{item.sort_order}</span>
                    </td>
                    <td>
                      <Link to={`/admin/registry/${item.id}`} className="fw-bold text-dark text-decoration-none" title="Edit in CMS Editor">
                        {item.title}
                      </Link>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: typeMeta.badgeBg, color: typeMeta.color, display: 'inline-block', marginTop: '3px', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.04em' }}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td>
                      <div><code>{item.slug}</code></div>
                      <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                        {routeStatus.isImplemented ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.68rem' }} title="Public route active and implemented">
                            <i className="bi bi-check-circle-fill me-1" />
                            {routeStatus.route}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '0.68rem' }} title="The content type is registered, but its public page has not been implemented yet.">
                            <i className="bi bi-dash-circle me-1" />
                            {routeStatus.route}
                          </span>
                        )}
                        {routeStatus.hasMismatch && (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-1" style={{ fontSize: '0.65rem' }} title={routeStatus.mismatchReason}>
                            <i className="bi bi-exclamation-triangle-fill" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {hasHero ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-image me-1" /> Hero ?
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border px-2" style={{ fontSize: '0.7rem' }}>Hero —</span>
                        )}
                        {logoInfo ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2" style={{ fontSize: '0.7rem' }}>
                            Logo [{logoInfo.letter || '•'}]
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border px-2" style={{ fontSize: '0.7rem' }}>Logo —</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <HealthBadge level={entryHealth.level} score={entryHealth.score} issues={entryHealth.issues} />
                      {entryHealth.errorCount > 0 && (
                        <div className="small text-danger mt-1" style={{ fontSize: '0.68rem' }}>
                          {entryHealth.errorCount} error{entryHealth.errorCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {entryHealth.errorCount === 0 && entryHealth.warningCount > 0 && (
                        <div className="small mt-1" style={{ fontSize: '0.68rem', color: '#b45309' }}>
                          {entryHealth.warningCount} warning{entryHealth.warningCount > 1 ? 's' : ''}
                        </div>
                      )}
                      <ReadinessBadge entry={item} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        className={`admin-badge ${item.status}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Click to toggle publish status"
                      >
                        <i className={`bi ${item.status === 'published' ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                        {item.status}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(item)}
                        style={{ background: item.visibility === 'public' ? '#e8f5f1' : '#f3f4f6', color: item.visibility === 'public' ? '#087f66' : '#6b7280', border: `1px solid ${item.visibility === 'public' ? '#b8e0d4' : '#e5e7eb'}`, borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        title="Click to toggle visibility"
                      >
                        <i className={`bi ${item.visibility === 'public' ? 'bi-globe2' : 'bi-lock-fill'} me-1`} />
                        {item.visibility}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                        title="Click to toggle featured"
                      >
                        {item.featured ? <i className="bi bi-star-fill text-warning fs-6" /> : <i className="bi bi-star text-muted" />}
                      </button>
                    </td>
                    <td>
                      <span className="small text-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {formatDate(item.updated_at)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-flex justify-content-end align-items-center gap-1">
                        {isLive && routeStatus.isImplemented ? (
                          <a href={route} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary py-1 px-2 text-decoration-none" title="View public live route in new tab" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-box-arrow-up-right me-1 text-success" /> View
                          </a>
                        ) : isLive && !routeStatus.isImplemented ? (
                          <button type="button" className="admin-btn admin-btn-secondary py-1 px-2 text-muted" disabled title="The content type is registered, but its public page has not been implemented yet" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            <i className="bi bi-dash-circle me-1" /> Unimplemented
                          </button>
                        ) : (
                          <button type="button" className="admin-btn admin-btn-secondary py-1 px-2 text-muted" disabled title="Cannot view: Item is draft or private" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            <i className="bi bi-eye-slash me-1" /> Hidden
                          </button>
                        )}
                        <Link to={`/admin/registry/${item.id}`} className="admin-btn admin-btn-secondary py-1 px-2 text-decoration-none" title="Edit in CMS Editor">
                          <i className="bi bi-pencil" />
                        </Link>
                        <button type="button" className="admin-btn admin-btn-secondary py-1 px-2 text-danger" onClick={() => handleOpenDelete(item)} title="Delete Entry">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RegistryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingEntry}
        isSubmitting={submitting}
      />

      {itemPendingDelete && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom bg-danger-subtle p-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-exclamation-triangle-fill" />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-danger" style={{ fontSize: '1.05rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Delete Registry Entry
                    </h5>
                    <small className="text-muted">Safe Content Deletion & Dependency Check</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setItemPendingDelete(null)}
                  disabled={deleting}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to delete <strong className="text-dark">&quot;{itemPendingDelete.title}&quot;</strong>?
                </p>
                <div className="p-3 bg-light rounded-3 small mb-3 border">
                  <div><strong>Slug:</strong> <code>{itemPendingDelete.slug}</code></div>
                  <div><strong>Type:</strong> <span className="text-capitalize">{itemPendingDelete.content_type}</span></div>
                  <div><strong>Status:</strong> <span className="text-capitalize">{itemPendingDelete.status}</span></div>
                  <div><strong>Route:</strong> <code>{itemPendingDelete.public_route || `/${itemPendingDelete.content_type}/${itemPendingDelete.slug}`}</code></div>
                </div>

                {isCheckingDeps ? (
                  <div className="d-flex align-items-center gap-2 text-muted small my-3">
                    <span className="spinner-border spinner-border-sm text-secondary" role="status" />
                    Checking content dependencies and active routes...
                  </div>
                ) : deleteDependencies?.warnings?.length > 0 ? (
                  <div className="alert alert-warning rounded-3 p-3 mb-3 small">
                    <div className="fw-bold mb-1 text-warning-emphasis">
                      <i className="bi bi-exclamation-octagon-fill me-1" /> Potential Impact Detected:
                    </div>
                    <ul className="mb-0 ps-3">
                      {deleteDependencies.warnings.map((w, idx) => (
                        <li key={idx} className="mb-1">{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="alert alert-info rounded-3 p-2 mb-3 small">
                    <i className="bi bi-info-circle me-1" /> No active dependencies found. Safe to delete.
                  </div>
                )}

                <p className="small text-muted mb-0">
                  <i className="bi bi-shield-check me-1" />
                  <strong>Tip:</strong> If you only want to take this item offline without breaking historical relationships, choose <em>Archive Instead</em>.
                </p>
              </div>

              <div className="modal-footer border-top bg-light p-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={() => setItemPendingDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-warning rounded-pill px-3"
                    onClick={handleArchiveInstead}
                    disabled={deleting}
                    title="Safely mark this item as archived"
                  >
                    {deleting ? 'Updating...' : 'Archive Instead'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-3"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Permanent Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
