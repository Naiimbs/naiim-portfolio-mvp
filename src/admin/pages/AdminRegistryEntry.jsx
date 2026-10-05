import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getContentRegistryEntryById,
  updateContentRegistryEntry,
  checkSlugAvailable,
} from '../../services/contentRegistry';
import { resolveAsset, DEFAULT_LOGO_MARKS } from '../../services/assetRegistry';
import { computeEntryHealth, getCaseStudyPublishingReadiness } from '../../utils/registryHealth';
import { isPublicRouteImplemented, getPublicRouteStatus, getCanonicalRoute } from '../../services/contentRouteResolver';
import { isSupabaseConfigured } from '../../lib/supabase';
import CaseStudyContentEditor from '../components/cms/CaseStudyContentEditor';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { value: 'case-study', label: 'Case Study', defaultPrefix: '/work' },
  { value: 'page', label: 'Site Page', defaultPrefix: '/p' },
  { value: 'agent', label: 'AI Agent', defaultPrefix: '/agents' },
  { value: 'plugin', label: 'Plugin / Tool', defaultPrefix: '/plugins' },
  { value: 'blog', label: 'Blog Article', defaultPrefix: '/blog' },
  { value: 'other', label: 'Other Content', defaultPrefix: '/p' },
];

const STATUS_INFO = {
  published: { color: '#087f66', bg: '#e8f5f1', border: '#b8e0d4', icon: 'bi-check-circle-fill' },
  draft:     { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'bi-circle' },
  archived:  { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: 'bi-archive-fill' },
};

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

function isPubliclyVisible(status, visibility) {
  return status === 'published' && visibility === 'public';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, children }) {
  return (
    <h6 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <i className={`bi ${icon} text-success`} style={{ fontSize: '0.8rem' }} />
      {children}
    </h6>
  );
}

function FormField({ label, required, hint, error, children }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold small text-dark mb-1" style={{ fontSize: '0.8rem' }}>
        {label}{required && <span className="text-danger ms-1">*</span>}
      </label>
      {children}
      {hint && !error && <div className="form-text text-muted" style={{ fontSize: '0.73rem' }}>{hint}</div>}
      {error && <div className="invalid-feedback d-block" style={{ fontSize: '0.73rem' }}>{error}</div>}
    </div>
  );
}

function HealthPanel({ health }) {
  if (!health) return null;
  const levelCfg = {
    ok:      { color: '#087f66', bg: '#f0fdf4', border: '#bbf7d0', icon: 'bi-check-circle-fill', label: 'Healthy' },
    warning: { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: 'bi-exclamation-triangle-fill', label: 'Warnings' },
    error:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: 'bi-x-circle-fill', label: 'Issues' },
  };
  const cfg = levelCfg[health.level] || levelCfg.ok;
  return (
    <div className="p-3 rounded border" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className={`bi ${cfg.icon}`} style={{ color: cfg.color }} />
        <span className="fw-bold small" style={{ color: cfg.color, fontFamily: 'Space Grotesk, sans-serif' }}>
          {health.score}% — {cfg.label}
        </span>
      </div>
      {health.issues.length > 0 ? (
        <ul className="mb-0 ps-3" style={{ fontSize: '0.75rem' }}>
          {health.issues.map((issue, i) => (
            <li key={i} style={{ color: issue.level === 'error' ? '#b91c1c' : '#92400e', marginBottom: '2px' }}>
              <i className={`bi ${issue.level === 'error' ? 'bi-x-circle' : 'bi-exclamation-circle'} me-1`} />
              {issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0 small" style={{ color: cfg.color, fontSize: '0.75rem' }}>All recommended fields are complete.</p>
      )}
    </div>
  );
}

function PublicationWarning({ status, visibility }) {
  if (status === 'published' && visibility === 'public') return null;
  let msg = '';
  let icon = 'bi-info-circle';
  if (status === 'draft') {
    msg = 'This item will not appear in the public portfolio until its status is Published.';
  } else if (status === 'archived') {
    msg = 'Archived items are hidden from the public portfolio.';
    icon = 'bi-archive-fill';
  } else if (status === 'published' && visibility === 'private') {
    msg = 'This entry is published but set to Private — it will not appear in the public catalog.';
  }
  if (!msg) return null;
  return (
    <div className="d-flex gap-2 p-2 rounded border mt-2" style={{ background: '#fffbeb', borderColor: '#fde68a', fontSize: '0.75rem' }}>
      <i className={`bi ${icon} flex-shrink-0 mt-1`} style={{ color: '#b45309' }} />
      <span style={{ color: '#92400e' }}>{msg}</span>
    </div>
  );
}

function RouteMismatchWarning({ contentType, slug, publicRoute }) {
  if (!slug || !publicRoute) return null;
  const status = getPublicRouteStatus({ content_type: contentType, slug, public_route: publicRoute });
  if (!status.hasMismatch) return null;

  return (
    <div className="d-flex gap-2 p-2 rounded border mt-2" style={{ background: '#fffbeb', borderColor: '#fde68a', fontSize: '0.75rem' }}>
      <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" style={{ color: '#b45309' }} />
      <span style={{ color: '#92400e' }}>
        <strong>Route Mismatch:</strong> {status.mismatchReason}
      </span>
    </div>
  );
}

function RouteStatusCard({ contentType, slug, publicRoute }) {
  const routeStatus = getPublicRouteStatus({ content_type: contentType, slug, public_route: publicRoute });

  return (
    <div className="p-3 rounded border mb-3" style={{ background: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.78rem' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold text-uppercase text-muted" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
          Public Route Readiness
        </span>
        {routeStatus.isImplemented ? (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.68rem' }}>
            <i className="bi bi-check-circle-fill me-1" /> Implemented
          </span>
        ) : (
          <span className="badge bg-secondary-subtle text-secondary border px-2 py-1" style={{ fontSize: '0.68rem' }}>
            <i className="bi bi-dash-circle me-1" /> Not Implemented
          </span>
        )}
      </div>

      <div className="row g-2 mb-2">
        <div className="col-sm-6">
          <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Content Type</div>
          <div className="fw-semibold text-dark">{routeStatus.label}</div>
        </div>
        <div className="col-sm-6">
          <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Canonical Route</div>
          <div><code>{routeStatus.canonicalRoute}</code></div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Active Public Route</div>
        <div className="fw-bold text-dark"><code>{routeStatus.route}</code></div>
      </div>

      <div className="pt-2 border-top">
        {routeStatus.isImplemented ? (
          <div className="text-success small d-flex align-items-center gap-1">
            <i className="bi bi-check-circle-fill" />
            <span>🟢 <strong>Public route active:</strong> This page is implemented and reachable.</span>
          </div>
        ) : (
          <div className="text-muted small d-flex align-items-start gap-1">
            <i className="bi bi-info-circle-fill flex-shrink-0 mt-1 text-secondary" />
            <span>⚪ <strong>Route not implemented:</strong> The content type is registered, but its public page has not been implemented yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Publishing Readiness Card (Phase 15) ─────────────────────────────────────

function PublishingReadinessCard({ readiness, isAlreadyLive, onPublish, publishing, publishError, publishSuccess }) {
  if (!readiness) return null;

  if (isAlreadyLive) {
    return (
      <div className="p-3 rounded border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', fontSize: '0.78rem' }}>
        <div className="d-flex align-items-center gap-2 mb-1">
          <i className="bi bi-check-circle-fill text-success" />
          <span className="fw-bold text-success" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live on Portfolio</span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
          This case study is publicly published. Use the Status controls above to unpublish or archive.
        </div>
      </div>
    );
  }

  const gateCount = readiness.gates.length;
  const advisoryCount = readiness.advisories.length;

  return (
    <div className="rounded border overflow-hidden" style={{ borderColor: readiness.isReady ? '#bbf7d0' : '#fecaca' }}>
      {/* Header */}
      <div
        className="px-3 py-2 d-flex align-items-center justify-content-between"
        style={{ background: readiness.isReady ? '#f0fdf4' : '#fef2f2', borderBottom: `1px solid ${readiness.isReady ? '#bbf7d0' : '#fecaca'}` }}
      >
        <div className="d-flex align-items-center gap-2">
          <i
            className={`bi ${readiness.isReady ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`}
          />
          <span
            className="fw-bold"
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: readiness.isReady ? '#087f66' : '#b91c1c' }}
          >
            Publishing Readiness
          </span>
        </div>
        <span
          className={`badge border px-2 py-1 ${readiness.isReady ? 'bg-success-subtle text-success border-success-subtle' : 'bg-danger-subtle text-danger border-danger-subtle'}`}
          style={{ fontSize: '0.66rem' }}
        >
          {readiness.isReady ? '✓ Ready to Publish' : `${gateCount} gate${gateCount !== 1 ? 's' : ''} blocking`}
        </span>
      </div>

      <div className="p-3" style={{ background: '#fff', fontSize: '0.75rem' }}>
        {/* Blocking gates */}
        {gateCount > 0 && (
          <div className="mb-3">
            <div className="fw-bold text-danger mb-2" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <i className="bi bi-x-circle me-1" /> Required — must fix before publishing
            </div>
            <ul className="mb-0 ps-3" style={{ color: '#b91c1c' }}>
              {readiness.gates.map((g) => (
                <li key={g.id} style={{ marginBottom: '3px' }}>{g.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Advisories */}
        {advisoryCount > 0 && (
          <div className={gateCount > 0 ? 'border-top pt-3' : ''}>
            <div className="fw-bold text-warning mb-2" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#b45309' }}>
              <i className="bi bi-exclamation-triangle me-1" /> Recommended (not blocking)
            </div>
            <ul className="mb-0 ps-3" style={{ color: '#92400e' }}>
              {readiness.advisories.map((a) => (
                <li key={a.id} style={{ marginBottom: '3px' }}>{a.message}</li>
              ))}
            </ul>
          </div>
        )}

        {readiness.isReady && advisoryCount === 0 && (
          <div className="text-success small" style={{ fontSize: '0.73rem' }}>
            All required fields complete. This case study is ready to publish.
          </div>
        )}

        {/* Publish error */}
        {publishError && (
          <div className="mt-2 p-2 rounded border d-flex gap-2" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c', fontSize: '0.72rem' }}>
            <i className="bi bi-exclamation-octagon-fill flex-shrink-0" />
            <span>{publishError}</span>
          </div>
        )}

        {/* Publish success */}
        {publishSuccess && (
          <div className="mt-2 p-2 rounded border d-flex gap-2" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#087f66', fontSize: '0.72rem' }}>
            <i className="bi bi-check-circle-fill flex-shrink-0" />
            <span><strong>Published successfully.</strong> The case study is now live on the portfolio.</span>
          </div>
        )}

        {/* Publish button */}
        {!isAlreadyLive && (
          <button
            type="button"
            className="admin-btn admin-btn-primary w-100 mt-3"
            style={{
              fontSize: '0.8rem',
              opacity: (!readiness.isReady || publishing) ? 0.55 : 1,
              cursor: (!readiness.isReady || publishing) ? 'not-allowed' : 'pointer',
              background: readiness.isReady ? '#087f66' : '#9ca3af',
              borderColor: readiness.isReady ? '#087f66' : '#9ca3af',
            }}
            onClick={onPublish}
            disabled={!readiness.isReady || publishing}
            title={!readiness.isReady ? 'Fix all blocking gates before publishing' : 'Publish this case study publicly'}
          >
            {publishing ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" />Publishing…</>
            ) : (
              <><i className="bi bi-send-check-fill me-2" />Publish to Portfolio</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminRegistryEntry() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Server state
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentType, setContentType] = useState('case-study');
  const [status, setStatus] = useState('draft');
  const [visibility, setVisibility] = useState('public');
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [publicRoute, setPublicRoute] = useState('');

  const [badge, setBadge] = useState('');
  const [kicker, setKicker] = useState('');
  const [description, setDescription] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');

  const [heroImage, setHeroImage] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [logoLetter, setLogoLetter] = useState('');
  const [logoClass, setLogoClass] = useState('');

  // Case Study Content state (Phase 14)
  const [caseStudy, setCaseStudy] = useState(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Publish workflow state (Phase 15)
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const originalRef = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setFetchError('No entry ID provided.'); setLoading(false); return; }
    loadEntry();
  }, [id]);

  async function loadEntry() {
    setLoading(true);
    setFetchError(null);
    const res = await getContentRegistryEntryById(id);
    if (res.error || !res.data) {
      setFetchError(res.error?.message || 'Registry entry not found.');
      setLoading(false);
      return;
    }
    populateForm(res.data);
    setLoading(false);
  }

  function populateForm(data) {
    const meta = data.metadata || {};
    setEntry(data);
    setTitle(data.title || '');
    setSlug(data.slug || '');
    setContentType(data.content_type || 'case-study');
    setStatus(data.status || 'draft');
    setVisibility(data.visibility || 'public');
    setFeatured(Boolean(data.featured));
    setSortOrder(data.sort_order ?? 0);
    setPublicRoute(data.public_route || '');
    setBadge(meta.badge || '');
    setKicker(meta.kicker || '');
    setDescription(meta.description || '');
    setSubtitle(meta.subtitle || '');
    setTags(Array.isArray(meta.tags) ? meta.tags.join(', ') : '');
    setCategory(meta.category || '');
    setYear(meta.year ? String(meta.year) : '');
    setHeroImage(meta.heroImage || '');
    setHeroImageAlt(meta.heroImageAlt || '');
    setLogoLetter(meta.logoMark?.letter || '');
    setLogoClass(meta.logoMark?.className || '');

    // Initialize caseStudy content state
    const initialCaseStudy = meta.caseStudy || (data.content_type === 'case-study' ? {
      version: 1,
      type: (data.slug === 'winni' || data.slug === 'assestini') ? 'custom' : 'standard',
      hero: { eyebrow: '', title: data.title || '', lead: meta.description || meta.subtitle || '', metaChips: [], image: '', imageAlt: '', caption: '' },
      challenge: { eyebrow: '', title: '', copy: '', role: '', context: '' },
      contribution: { eyebrow: '', title: '', items: [], process: [] },
      evidence: { eyebrow: '', title: '', image: '', imageAlt: '', caption: '' },
      technology: { eyebrow: '', title: '', tags: [] },
    } : null);
    setCaseStudy(initialCaseStudy);

    setImageLoadError(false);
    setErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setIsDirty(false);

    originalRef.current = {
      title: data.title || '', slug: data.slug || '',
      contentType: data.content_type || 'case-study',
      status: data.status || 'draft', visibility: data.visibility || 'public',
      featured: Boolean(data.featured), sortOrder: String(data.sort_order ?? 0),
      publicRoute: data.public_route || '',
      badge: meta.badge || '', kicker: meta.kicker || '',
      description: meta.description || '', subtitle: meta.subtitle || '',
      tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
      category: meta.category || '', year: meta.year ? String(meta.year) : '',
      heroImage: meta.heroImage || '', heroImageAlt: meta.heroImageAlt || '',
      logoLetter: meta.logoMark?.letter || '', logoClass: meta.logoMark?.className || '',
      caseStudyStr: JSON.stringify(meta.caseStudy || initialCaseStudy || null),
    };
  }

  // ── Dirty detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!originalRef.current) return;
    const o = originalRef.current;
    const changed = (
      title !== o.title || slug !== o.slug || contentType !== o.contentType ||
      status !== o.status || visibility !== o.visibility || featured !== o.featured ||
      String(sortOrder) !== o.sortOrder || publicRoute !== o.publicRoute ||
      badge !== o.badge || kicker !== o.kicker || description !== o.description ||
      subtitle !== o.subtitle || tags !== o.tags || category !== o.category ||
      year !== o.year || heroImage !== o.heroImage || heroImageAlt !== o.heroImageAlt ||
      logoLetter !== o.logoLetter || logoClass !== o.logoClass ||
      JSON.stringify(caseStudy || null) !== o.caseStudyStr
    );
    setIsDirty(changed);
  }, [title, slug, contentType, status, visibility, featured, sortOrder, publicRoute, badge, kicker, description, subtitle, tags, category, year, heroImage, heroImageAlt, logoLetter, logoClass, caseStudy]);

  // ── Navigation guard ──────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes.\n\nDiscard them and leave?')) return;
    navigate('/admin/registry');
  }, [isDirty, navigate]);

  // ── Browser-level unsaved changes protection (Phase 15.1) ────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      // Modern browsers show their own message; the returnValue is required for legacy support
      e.returnValue = 'You have unsaved changes. Leave anyway?';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // ── Slug/route helpers ────────────────────────────────────────────────────
  const handleSlugChange = (val) => {
    const normalized = slugify(val);
    setSlug(normalized);
    const prefix = CONTENT_TYPES.find((t) => t.value === contentType)?.defaultPrefix || '/work';
    setPublicRoute(normalized ? `${prefix}/${normalized}` : '');
  };

  // ── Validation ────────────────────────────────────────────────────────────
  async function validate() {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!slug.trim()) {
      errs.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errs.slug = 'Slug must contain only lowercase letters, numbers, and hyphens.';
    } else {
      const available = await checkSlugAvailable(slug.trim(), id);
      if (!available) errs.slug = 'This slug is already in use. Please choose a unique slug.';
    }
    if (!contentType) errs.contentType = 'Content type is required.';
    if (isNaN(Number(sortOrder))) errs.sortOrder = 'Sort order must be a valid number.';
    if (heroImage.trim() && /[<>"']/.test(heroImage.trim())) errs.heroImage = 'Invalid characters in hero image reference.';
    if (logoLetter.trim().length > 2) errs.logoLetter = 'Logo letter must be 1–2 characters.';
    if (logoClass.trim() && !/^[a-z0-9_-]+$/i.test(logoClass.trim())) errs.logoClass = 'Logo class must be letters, numbers, and hyphens only.';

    // Case Study validation (Section 9)
    if (contentType === 'case-study' && isPubliclyVisible(status, visibility)) {
      if (caseStudy?.type === 'standard') {
        if (!caseStudy?.hero?.title?.trim()) {
          errs.caseStudyHeroTitle = 'Hero Title is required for published case studies.';
        }
        if (!caseStudy?.hero?.lead?.trim()) {
          errs.caseStudyHeroLead = 'Hero Lead is required for published case studies.';
        }
        if (!caseStudy?.challenge?.title?.trim()) {
          errs.caseStudyChallengeTitle = 'Challenge Title is required for published case studies.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Build metadata payload (shared between Save and Publish) ─────────────
  function buildMetadataPayload() {
    const metadata = { ...(entry?.metadata || {}) };
    if (badge.trim()) metadata.badge = badge.trim(); else delete metadata.badge;
    if (kicker.trim()) metadata.kicker = kicker.trim(); else delete metadata.kicker;
    if (description.trim()) metadata.description = description.trim(); else delete metadata.description;
    if (subtitle.trim()) metadata.subtitle = subtitle.trim(); else delete metadata.subtitle;
    const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsArr.length) metadata.tags = tagsArr; else delete metadata.tags;
    if (category.trim()) metadata.category = category.trim(); else delete metadata.category;
    if (year.trim() && !isNaN(Number(year))) metadata.year = Number(year); else delete metadata.year;
    if (heroImage.trim()) metadata.heroImage = heroImage.trim(); else delete metadata.heroImage;
    if (heroImageAlt.trim()) metadata.heroImageAlt = heroImageAlt.trim(); else delete metadata.heroImageAlt;
    if (logoLetter.trim() || logoClass.trim()) {
      metadata.logoMark = { letter: logoLetter.trim() || title.trim().charAt(0).toUpperCase() || 'W', className: logoClass.trim() || 'winni' };
    } else {
      delete metadata.logoMark;
    }
    if (contentType === 'case-study' && caseStudy) {
      metadata.caseStudy = caseStudy;
    }
    return metadata;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaveError(null);
    setSaveSuccess(false);

    const isValid = await validate();
    if (!isValid) return;

    // Confirm significant publication state changes when saving
    if (entry) {
      const wasPublic = isPubliclyVisible(entry.status, entry.visibility);
      const willBePublic = isPubliclyVisible(status, visibility);
      if (!wasPublic && willBePublic) {
        if (!window.confirm('Publish this project publicly?\n\nIt will become visible on the portfolio.')) return;
      } else if (wasPublic && !willBePublic) {
        if (!window.confirm('Make this project private?\n\nIt will disappear from the public catalog.')) return;
      }
    }

    setSaving(true);
    const metadata = buildMetadataPayload();
    const payload = {
      title: title.trim(), slug: slug.trim(), content_type: contentType,
      status, visibility, featured,
      sort_order: Number(sortOrder) || 0,
      public_route: publicRoute.trim() || null,
      metadata,
    };

    const res = await updateContentRegistryEntry(id, payload);
    setSaving(false);

    if (res.error) {
      const msg = res.error?.message || '';
      if (msg.includes('23505') || msg.toLowerCase().includes('duplicate')) {
        setSaveError('A duplicate slug or route conflict exists. Please change the slug or route and try again.');
      } else if (msg.includes('42501') || msg.toLowerCase().includes('permission')) {
        setSaveError('Permission denied. You may not have edit access to this entry.');
      } else {
        setSaveError('Unable to save this Registry entry. Please check your connection and try again.');
        console.error('[AdminRegistryEntry] Save error:', res.error);
      }
      return;
    }

    const refreshed = await getContentRegistryEntryById(id);
    if (refreshed.data) populateForm(refreshed.data);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  }

  // ── Publish (Phase 15) ────────────────────────────────────────────────────
  async function handlePublish() {
    if (publishing || saving) return;
    if (isPubliclyVisible(status, visibility)) return; // already live

    // Use readiness derived from current memoized liveEntry
    const readiness = liveReadiness || getCaseStudyPublishingReadiness({
      ...entry,
      title, slug, content_type: contentType, public_route: publicRoute,
      metadata: { ...(entry?.metadata || {}), caseStudy: contentType === 'case-study' ? caseStudy : undefined },
    });

    if (!readiness.isReady) {
      setPublishError('Cannot publish: one or more required fields are missing. Review the Publishing Readiness checklist.');
      return;
    }

    // Advisory confirmation (Phase 15.1 requirement §8)
    if (readiness.advisories.length > 0) {
      const advisoryList = readiness.advisories.slice(0, 3).map((a) => `• ${a.message}`).join('\n');
      const more = readiness.advisories.length > 3 ? `\n…and ${readiness.advisories.length - 3} more.` : '';
      if (!window.confirm(`Some recommended fields are incomplete:\n\n${advisoryList}${more}\n\nPublish anyway?`)) return;
    } else {
      if (!window.confirm(`Publish "${title.trim()}" publicly?\n\nIt will become live on the portfolio.`)) return;
    }

    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);

    // Always persist the latest form state together with the publish action
    const isValid = await validate();
    if (!isValid) {
      setPublishing(false);
      setPublishError('Validation failed. Please fix the highlighted errors above.');
      return;
    }

    const metadata = buildMetadataPayload();
    const payload = {
      title: title.trim(), slug: slug.trim(), content_type: contentType,
      status: 'published',
      visibility: 'public',
      featured,
      sort_order: Number(sortOrder) || 0,
      public_route: publicRoute.trim() || null,
      metadata,
    };

    const res = await updateContentRegistryEntry(id, payload);
    setPublishing(false);

    if (res.error) {
      const msg = res.error?.message || '';
      if (msg.includes('42501') || msg.toLowerCase().includes('permission')) {
        setPublishError('Permission denied. You may not have publish access to this entry.');
      } else {
        setPublishError('Unable to publish. Please check your connection and try again.');
        console.error('[AdminRegistryEntry] Publish error:', res.error);
      }
      return;
    }

    // Refresh from server — this also resets isDirty via populateForm
    const refreshed = await getContentRegistryEntryById(id);
    if (refreshed.data) populateForm(refreshed.data);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 5000);
  }

  // ── Live asset preview ────────────────────────────────────────────────────
  const resolvedHero = heroImage.trim() ? resolveAsset(heroImage.trim()) : (slug ? resolveAsset(slug) : null);
  const previewLogoLetter = logoLetter.trim() || (title.trim() ? title.trim().charAt(0).toUpperCase() : '?');
  const previewLogoClass = logoClass.trim() || DEFAULT_LOGO_MARKS[slug]?.className || 'winni';

  // ── Live entry snapshot (memoized before any function that uses it) ───────
  // IMPORTANT: liveEntry must be defined before handlePublish and other consumers.
  // These are memos rather than state so they stay in sync with every keystroke
  // without triggering extra renders.
  const liveEntry = useMemo(() => ({
    ...entry,
    title, slug, content_type: contentType, status, visibility,
    featured, sort_order: Number(sortOrder) || 0, public_route: publicRoute,
    metadata: {
      ...(entry?.metadata || {}),
      badge: badge || undefined, kicker: kicker || undefined,
      description: description || undefined, subtitle: subtitle || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      category: category || undefined,
      year: year && !isNaN(Number(year)) ? Number(year) : undefined,
      heroImage: heroImage || undefined, heroImageAlt: heroImageAlt || undefined,
      logoMark: (logoLetter || logoClass) ? { letter: logoLetter, className: logoClass } : (entry?.metadata?.logoMark),
      caseStudy: contentType === 'case-study' ? caseStudy : undefined,
    },
  }), [entry, title, slug, contentType, status, visibility, featured, sortOrder, publicRoute, badge, kicker, description, subtitle, tags, category, year, heroImage, heroImageAlt, logoLetter, logoClass, caseStudy]);

  const liveHealth = useMemo(() => {
    if (!entry) return null;
    return computeEntryHealth(liveEntry);
  }, [entry, liveEntry]);

  // ── Live publishing readiness (Phase 15) ─────────────────────────────────
  const liveReadiness = useMemo(() => {
    if (!entry || contentType !== 'case-study') return null;
    return getCaseStudyPublishingReadiness(liveEntry);
  }, [entry, contentType, liveEntry]);


  // ─── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-card text-center py-5 text-muted">
        <div className="spinner-border text-success mb-3" role="status" />
        <div>Loading registry entry…</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-octagon-fill text-danger" />
          <div>{fetchError}</div>
        </div>
        <Link to="/admin/registry" className="admin-btn admin-btn-secondary">
          <i className="bi bi-arrow-left me-1" /> Back to Registry
        </Link>
      </div>
    );
  }

  const isLive = isPubliclyVisible(status, visibility);
  const statusCfg = STATUS_INFO[status] || STATUS_INFO.draft;
  const routeStatus = getPublicRouteStatus({ content_type: contentType, slug, public_route: publicRoute });
  const previewHref = routeStatus.route;

  return (
    <div>
      <Helmet>
        <title>{entry?.title ? `Edit: ${entry.title}` : 'Edit Registry Entry'} — Admin CMS</title>
      </Helmet>

      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <button type="button" className="admin-btn admin-btn-secondary mb-2" onClick={handleBack} style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-arrow-left me-1" /> Content Registry
          </button>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {entry?.title || 'Registry Entry'}
            {isDirty && (
              <span className="ms-2" style={{ fontSize: '0.62rem', background: '#fde68a', color: '#92400e', borderRadius: '4px', padding: '2px 7px', fontFamily: 'system-ui', fontWeight: 700, verticalAlign: 'middle' }}>
                Unsaved
              </span>
            )}
          </h2>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontSize: '0.75rem', background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, borderRadius: '20px', padding: '2px 10px', fontWeight: 700 }}>
              <i className={`bi ${statusCfg.icon} me-1`} />{status}
            </span>
            <span style={{ fontSize: '0.75rem', background: visibility === 'public' ? '#e8f5f1' : '#f3f4f6', color: visibility === 'public' ? '#087f66' : '#6b7280', border: `1px solid ${visibility === 'public' ? '#b8e0d4' : '#e5e7eb'}`, borderRadius: '20px', padding: '2px 10px', fontWeight: 700 }}>
              <i className={`bi ${visibility === 'public' ? 'bi-globe2' : 'bi-lock-fill'} me-1`} />{visibility}
            </span>
            {featured && (
              <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '20px', padding: '2px 10px', fontWeight: 700 }}>
                <i className="bi bi-star-fill me-1" />Featured
              </span>
            )}
            <code style={{ fontSize: '0.72rem', color: '#6b7280' }}>{entry?.slug}</code>
          </div>
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          {isLive && (
            <a href={previewHref} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary" style={{ fontSize: '0.8rem' }}>
              <i className="bi bi-box-arrow-up-right me-1 text-success" /> Preview Live
            </a>
          )}
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving || !isDirty} style={{ fontSize: '0.8rem', opacity: (!isDirty && !saving) ? 0.6 : 1 }}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</>
            ) : (
              <><i className="bi bi-floppy me-1" />Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-4">
          <i className="bi bi-exclamation-triangle-fill" />
          <div><strong>Supabase Unconfigured:</strong> Changes cannot be persisted without credentials in <code>.env</code>.</div>
        </div>
      )}
      {saveError && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-octagon-fill text-danger" />
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>{saveError}</span>
            <button type="button" className="btn-close btn-close-sm" onClick={() => setSaveError(null)} />
          </div>
        </div>
      )}
      {saveSuccess && (
        <div className="admin-alert mb-4" style={{ background: '#f0fdf7', border: '1px solid #b8e0d4', color: '#087f66' }}>
          <i className="bi bi-check-circle-fill text-success" />
          <div>
            <strong>Registry entry updated.</strong>
            {liveHealth && liveHealth.level !== 'ok' && (
              <span className="ms-2" style={{ fontSize: '0.8rem', color: liveHealth.level === 'error' ? '#b91c1c' : '#b45309' }}>
                — Completeness: {liveHealth.score}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2-column layout */}
      <form onSubmit={handleSave} noValidate>
        <div className="row g-4">

          {/* Left column — Content + Presentation */}
          <div className="col-lg-8">

            {/* SECTION 1: Content */}
            <div className="admin-card mb-4">
              <SectionTitle icon="bi-type">1 — Content</SectionTitle>

              <FormField label="Title" required error={errors.title}>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WINNI — Smart Object Recovery"
                  disabled={saving}
                />
              </FormField>

              <div className="row g-3">
                <div className="col-md-5">
                  <FormField label="Content Type" required error={errors.contentType}>
                    <select className="form-select" value={contentType} onChange={(e) => setContentType(e.target.value)} disabled={saving}>
                      {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </FormField>
                </div>
                <div className="col-md-7">
                  <FormField label="Slug" required hint="Kebab-case only — changing the slug affects all public links." error={errors.slug}>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted small">/</span>
                      <input
                        type="text"
                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="winni"
                        disabled={saving}
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              <div className="border-top pt-3 mt-1">
                <div className="small fw-bold text-muted text-uppercase mb-3" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>Presentation Metadata</div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <FormField label="Badge" hint="e.g. 01">
                      <input type="text" className="form-control form-control-sm" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="01" disabled={saving} />
                    </FormField>
                  </div>
                  <div className="col-md-9">
                    <FormField label="Kicker" hint="Short descriptor shown above the title on cards">
                      <input type="text" className="form-control form-control-sm" value={kicker} onChange={(e) => setKicker(e.target.value)} placeholder="PRODUCT · QR · LOST & FOUND" disabled={saving} />
                    </FormField>
                  </div>
                </div>

                <FormField label="Description" hint="Primary copy on project cards and catalog listings">
                  <textarea className="form-control form-control-sm" rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A concise summary for cards and catalog listings…" disabled={saving} />
                </FormField>

                <FormField label="Subtitle" hint="Secondary copy — shorter alternative where needed">
                  <input type="text" className="form-control form-control-sm" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Short supporting line…" disabled={saving} />
                </FormField>

                <FormField label="Tags" hint="Comma-separated. e.g. Product Design, UX/UI, AI">
                  <input type="text" className="form-control form-control-sm" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Product Design, UX/UI, AI" disabled={saving} />
                </FormField>

                <div className="row g-3">
                  <div className="col-md-6">
                    <FormField label="Category (Optional)">
                      <input type="text" className="form-control form-control-sm" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Product Design" disabled={saving} />
                    </FormField>
                  </div>
                  <div className="col-md-6">
                    <FormField label="Year (Optional)">
                      <input type="number" className="form-control form-control-sm" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2026" disabled={saving} />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Presentation Assets */}
            <div className="admin-card mb-4">
              <SectionTitle icon="bi-image">2 — Presentation Assets</SectionTitle>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <FormField label="Hero Image Reference" hint="Bundled filename or external https:// URL. Leave blank to use the registered asset for this slug." error={errors.heroImage}>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${errors.heroImage ? 'is-invalid' : ''}`}
                      value={heroImage}
                      onChange={(e) => { setHeroImage(e.target.value); setImageLoadError(false); }}
                      placeholder="winni-sticker-real.png"
                      disabled={saving}
                    />
                  </FormField>
                </div>
                <div className="col-md-6">
                  <FormField label="Hero Image Alt Text">
                    <input type="text" className="form-control form-control-sm" value={heroImageAlt} onChange={(e) => setHeroImageAlt(e.target.value)} placeholder="e.g. WINNI QR sticker on a car" disabled={saving} />
                  </FormField>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <FormField label="Logo Letter" error={errors.logoLetter}>
                    <input type="text" className={`form-control form-control-sm ${errors.logoLetter ? 'is-invalid' : ''}`} maxLength="2" value={logoLetter} onChange={(e) => setLogoLetter(e.target.value)} placeholder="W" disabled={saving} />
                  </FormField>
                </div>
                <div className="col-md-9">
                  <FormField label="Logo Style Class" hint="e.g. winni, copilot, saudi, assestini" error={errors.logoClass}>
                    <input type="text" className={`form-control form-control-sm ${errors.logoClass ? 'is-invalid' : ''}`} value={logoClass} onChange={(e) => setLogoClass(e.target.value)} placeholder="winni" disabled={saving} />
                  </FormField>
                </div>
              </div>

              {/* Live preview */}
              <div className="p-3 rounded border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <div className="small fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  <i className="bi bi-eye me-1 text-primary" /> Live Asset Preview
                </div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div style={{ width: '160px', height: '90px', borderRadius: '8px', background: '#0c1a1e', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                    {resolvedHero && !imageLoadError ? (
                      <img src={resolvedHero} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageLoadError(true)} />
                    ) : (
                      <span className="text-muted small text-center px-1" style={{ fontSize: '0.65rem' }}>
                        <i className="bi bi-image d-block fs-5 text-secondary mb-1" />No Image
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`logo-mark ${previewLogoClass}`} style={{ width: '40px', height: '40px', flexShrink: 0 }}>{previewLogoLetter}</span>
                    <div className="small text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                      <div><strong>Letter:</strong> <code>{previewLogoLetter}</code></div>
                      <div><strong>Class:</strong> <code>.{previewLogoClass}</code></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: Case Study Content (Phase 14) */}
            {contentType === 'case-study' && (
              <CaseStudyContentEditor
                caseStudy={caseStudy}
                onChange={(updated) => setCaseStudy(updated)}
                disabled={saving}
                isPublishedAndPublic={isPubliclyVisible(status, visibility)}
                slug={slug}
              />
            )}

            {/* SECTION: Page Builder Content Integration (Phase 16.1) */}
            {contentType === 'page' && (
              <div className="admin-card mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold small text-uppercase text-dark" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
                    <i className="bi bi-layout-text-window-reverse me-1 text-primary" /> Page Content & Section Layout
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style={{ fontSize: '0.68rem' }}>
                    Page Builder Backed
                  </span>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>
                  This page uses the composable Page Builder. Edit sections, blocks, layout hierarchy, and live styling in the dedicated Visual Page Builder.
                </p>
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to={`/admin/pages/${entry?.metadata?.pageId || id}`}
                    className="btn btn-sm btn-primary rounded-pill px-3"
                  >
                    <i className="bi bi-pencil-square me-1" /> Open in Visual Page Builder
                  </Link>
                  <a
                    href={slug === 'about' ? '/about?preview=true' : `/p/${slug}?preview=true`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  >
                    <i className="bi bi-box-arrow-up-right me-1" /> Preview Page
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* Right column — Publication + Health */}
          <div className="col-lg-4">

            {/* SECTION 3: Publication */}
            <div className="admin-card mb-4">
              <SectionTitle icon="bi-send-check">3 — Publication</SectionTitle>

              <FormField label="Status">
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={saving}>
                  <option value="draft">Draft (Hidden from Public)</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </FormField>

              <FormField label="Visibility">
                <select className="form-select" value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={saving}>
                  <option value="public">Public (Everyone)</option>
                  <option value="private">Private (Admin only)</option>
                </select>
              </FormField>

              <PublicationWarning status={status} visibility={visibility} />

              <div className="mt-3 p-2 rounded border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.73rem' }}>
                <div className="text-muted fw-bold text-uppercase mb-2" style={{ fontSize: '0.66rem', letterSpacing: '0.05em' }}>Publication states</div>
                <div className="d-flex flex-column gap-1">
                  {[
                    { label: 'Published + Public → Visible on portfolio', active: isLive, icon: 'bi-check-circle' + (isLive ? '-fill' : '') },
                    { label: 'Published + Private → Internal only', active: false, icon: 'bi-lock' },
                    { label: 'Draft → Hidden from public', active: false, icon: 'bi-circle' },
                    { label: 'Archived → Removed', active: false, icon: 'bi-archive' },
                  ].map((item, i) => (
                    <div key={i} style={{ color: item.active ? '#087f66' : '#9ca3af', fontWeight: item.active ? 700 : 400 }}>
                      <i className={`bi ${item.icon} me-1`} />{item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-top pt-3 mt-3">
                <div className="form-check form-switch mb-1">
                  <input className="form-check-input" type="checkbox" id="featuredSwitch" checked={featured} onChange={(e) => setFeatured(e.target.checked)} disabled={saving} />
                  <label className="form-check-label fw-semibold small" htmlFor="featuredSwitch">Featured Project</label>
                </div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Featured entries appear in the larger card format on the homepage. Only visible when Published + Public.</div>
              </div>

              <div className="border-top pt-3 mt-3">
                <FormField label="Sort Order" hint="Lower numbers appear first (e.g. 1, 2, 3)" error={errors.sortOrder}>
                  <input type="number" className={`form-control ${errors.sortOrder ? 'is-invalid' : ''}`} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={saving} />
                </FormField>
              </div>

              <div className="border-top pt-3 mt-2">
                <FormField label="Public Route" hint="Auto-suggested from type + slug. Overrides the default URL.">
                  <input type="text" className="form-control form-control-sm" value={publicRoute} onChange={(e) => setPublicRoute(e.target.value)} placeholder="/work/winni" disabled={saving} />
                </FormField>
                <RouteMismatchWarning contentType={contentType} slug={slug} publicRoute={publicRoute} />
              </div>

              <div className="border-top pt-3 mt-3">
                <RouteStatusCard contentType={contentType} slug={slug} publicRoute={publicRoute} />
              </div>
            </div>

            {/* SECTION 4: Health */}
            <div className="admin-card mb-4">
              <SectionTitle icon="bi-heart-pulse">4 — Registry Health</SectionTitle>
              <HealthPanel health={liveHealth} />
              {liveHealth && liveHealth.score < 100 && (
                <div className="mt-3 p-2 rounded border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.73rem' }}>
                  <div className="fw-bold text-muted mb-1" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completeness guidance</div>
                  <p className="mb-2 text-muted">Content completeness: <strong>{liveHealth.score}%</strong></p>
                  {liveHealth.issues.filter((i) => i.level === 'warning').length > 0 && (
                    <>
                      <div className="fw-semibold mb-1" style={{ color: '#b45309', fontSize: '0.72rem' }}>Recommended:</div>
                      <ul className="mb-0 ps-3" style={{ color: '#92400e', fontSize: '0.72rem' }}>
                        {liveHealth.issues.filter((i) => i.level === 'warning').map((issue, i) => (
                          <li key={i}>{issue.message}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 5: Publishing Readiness (Phase 15, case-study only) */}
            {contentType === 'case-study' && liveReadiness && (
              <div className="admin-card mb-4">
                <SectionTitle icon="bi-send-check">5 — Publishing Readiness</SectionTitle>
                <PublishingReadinessCard
                  readiness={liveReadiness}
                  isAlreadyLive={isLive}
                  onPublish={handlePublish}
                  publishing={publishing}
                  publishError={publishError}
                  publishSuccess={publishSuccess}
                />
              </div>
            )}

            {/* Bottom action bar */}
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="submit"
                className="admin-btn admin-btn-primary flex-grow-1"
                onClick={handleSave}
                disabled={saving || !isDirty}
                style={{ opacity: (!isDirty && !saving) ? 0.6 : 1 }}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</>
                  : <><i className="bi bi-floppy me-1" />Save Changes</>
                }
              </button>
              {isLive && routeStatus.isImplemented ? (
                <a href={previewHref} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary" title="Preview live public page">
                  <i className="bi bi-box-arrow-up-right text-success me-1" /> Preview Live
                </a>
              ) : isLive && !routeStatus.isImplemented ? (
                <button type="button" className="admin-btn admin-btn-secondary text-muted" disabled title="Public route configured, but this content type does not have an implemented public page yet">
                  <i className="bi bi-dash-circle me-1" /> Preview Disabled
                </button>
              ) : (
                <button type="button" className="admin-btn admin-btn-secondary text-muted" disabled title="Preview only available for Published + Public entries">
                  <i className="bi bi-eye-slash me-1" /> Preview (Draft)
                </button>
              )}
            </div>
            {isLive && !routeStatus.isImplemented && (
              <div className="mt-2 small" style={{ fontSize: '0.72rem', color: '#b45309' }}>
                <i className="bi bi-exclamation-triangle-fill me-1" />
                Public route configured, but this content type does not have an implemented public page yet.
              </div>
            )}
            {!isLive && (
              <div className="mt-2 small text-muted" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-shield-lock me-1" />
                Preview only available for Published + Public entries. Draft content is never exposed through the public route.
              </div>
            )}

          </div>
        </div>
      </form>
    </div>
  );
}
