/**
 * CaseStudyRenderer.jsx
 *
 * Phase 13.1 — Registry-authoritative renderer.
 *
 * The Supabase Content Registry is the ONLY runtime content source.
 * There is no legacy fallback. There is no second content source.
 *
 * Flow:
 *   1. Public requests require published + public; `?preview=true` requires admin + the same Supabase RLS.
 *   2. Custom slugs render standalone components publicly; saved draft preview is unsupported for them.
 *   3. Standard slugs use metadata.caseStudy → normalizeRegistryEntry() → StandardCaseStudy for preview and public.
 *   4. Missing or unavailable data never falls back to local case-study content.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getAdminContentRegistryEntryBySlug, getPublishedPublicContentBySlug, normalizeRegistryEntry } from '../../services/contentRegistry';
import StandardCaseStudy from './StandardCaseStudy';
import CaseStudyNotFound from './CaseStudyNotFound';
import WinniCaseStudy from '../../pages/custom-case-studies/WinniCaseStudy';
import AssestiniCaseStudy from '../../pages/custom-case-studies/AssestiniCaseStudy';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../common/SEO';
import { useAuth } from '../../admin/context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

/**
 * Gate outcomes — the only states that matter after the Registry check.
 */
const GATE = {
  PENDING: 'pending',          // Registry check in progress
  ALLOWED: 'allowed',          // published + public confirmed, content ready
  BLOCKED: 'blocked',          // draft / private / archived / missing from Registry
  ERROR: 'error',              // Registry unreachable or unconfigured
  CONTENT_MISSING: 'content_missing', // Registry entry exists but metadata.caseStudy absent
  PREVIEW_DENIED: 'preview_denied', // Draft preview requires an authenticated admin session
  PREVIEW_UNSUPPORTED: 'preview_unsupported', // Custom component is not driven by saved caseStudy metadata
};

export default function CaseStudyRenderer() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';
  const cleanSlug = (slug || '').replace(/\.html$/i, '');

  const [gate, setGate] = useState(GATE.PENDING);
  const [studyData, setStudyData] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    let isMounted = true;

    async function run() {
      if (isPreviewRequested && authLoading) return;
      setGate(GATE.PENDING);
      setStudyData(null);

      if (isPreviewRequested && !isAdmin) {
        setGate(GATE.PREVIEW_DENIED);
        return;
      }

      if (isPreviewRequested && !isSupabaseConfigured) {
        setGate(GATE.ERROR);
        return;
      }

      // ── Step 1: Registry gate ────────────────────────────────────────────────
      //
      // The Registry is the sole authority for public visibility.
      // Outcomes:
      //   published + public  → ALLOWED
      //   draft / private / archived / not registered → BLOCKED
      //   Supabase unconfigured → ERROR (do NOT expose content)
      //   Transient network / query error → ERROR (do NOT expose content)
      //
      const registryRes = isPreviewRequested
        ? await getAdminContentRegistryEntryBySlug(cleanSlug)
        : await getPublishedPublicContentBySlug(cleanSlug);

      if (!isMounted) return;

      if (registryRes.source === 'unconfigured') {
        setGate(GATE.ERROR);
        return;
      }

      if (registryRes.error) {
        setGate(GATE.ERROR);
        return;
      }

      if (registryRes.notFound || !registryRes.data) {
        setGate(GATE.BLOCKED);
        return;
      }

      // Custom case studies render standalone React components, not metadata.caseStudy.
      if (isPreviewRequested && (cleanSlug === 'winni' || cleanSlug === 'assestini')) {
        setGate(GATE.PREVIEW_UNSUPPORTED);
        return;
      }

      // Public requests are already filtered to published + public by their query; preview requests are admin/RLS gated.

      // ── Step 2: Custom flagship case studies ─────────────────────────────────
      // Registry-authorised. Their content is self-contained React components.
      // The Registry caseStudy metadata holds configuration only (title, subtitle,
      // customComponent). No structural content is read from it here.
      if (cleanSlug === 'winni' || cleanSlug === 'assestini') {
        setGate(GATE.ALLOWED);
        return;
      }

      // ── Step 3: Authoritative Registry content (standard case studies) ───────
      // metadata.caseStudy is the ONLY content source, resolved via normalizeRegistryEntry.
      // No fallback to local data or any secondary source.
      const normalizedEntry = normalizeRegistryEntry(registryRes.data);
      const studyContent = normalizedEntry?.caseStudy;

      if (!studyContent) {
        // Registry entry exists and is published, but body content is missing.
        // This is a data integrity problem — do NOT fall back to local data.
        setGate(GATE.CONTENT_MISSING);
        return;
      }

      if (!isMounted) return;

      setStudyData({
        ...studyContent,
        i18n: normalizedEntry?.i18n || {},
        previewInfo: isPreviewRequested ? {
          title: registryRes.data.title || cleanSlug,
          status: registryRes.data.status || 'unknown',
          visibility: registryRes.data.visibility || 'unknown',
        } : null,
      });
      setGate(GATE.ALLOWED);
    }

    run();
    return () => { isMounted = false; };
  }, [cleanSlug, isPreviewRequested, isAdmin, authLoading]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (gate === GATE.PENDING) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading case study...</span>
        </div>
      </div>
    );
  }

  // ── Registry blocked: draft / private / archived / not registered ─────────
  if (gate === GATE.BLOCKED) {
    return <CaseStudyNotFound slug={slug} />;
  }

  // ── Registry error: Supabase unconfigured or transient failure ────────────
  if (gate === GATE.ERROR) {
    return <RegistryErrorState slug={slug} />;
  }

  // ── Content missing: Registry entry exists but caseStudy body absent ──────
  if (gate === GATE.CONTENT_MISSING) {
    return <RegistryContentMissingState slug={slug} />;
  }

  if (gate === GATE.PREVIEW_DENIED) {
    return <PreviewAccessDenied />;
  }
  if (gate === GATE.PREVIEW_UNSUPPORTED) {
    return <PreviewUnsupported />;
  }

  // ── ALLOWED ──────────────────────────────────────────────────────────────────

  // Custom flagship case studies — Registry-authorised, presentation-only components
  if (cleanSlug === 'winni') {
    return <WinniCaseStudy />;
  }
  if (cleanSlug === 'assestini') {
    return <AssestiniCaseStudy />;
  }

  // Standard case study — data comes exclusively from Registry metadata.caseStudy
  if (!studyData) {
    return <CaseStudyNotFound slug={slug} />;
  }

  return <StandardCaseStudy data={studyData} />;
}

// ── Error states ──────────────────────────────────────────────────────────────

/**
 * RegistryErrorState — shown when the Registry cannot be reached.
 * We cannot verify visibility, so we must not render any content.
 */
function RegistryErrorState({ slug }) {
  return (
    <MainLayout>
      <SEO
        title="Unavailable — Case Study"
        description="This case study is temporarily unavailable."
        robots="noindex, nofollow"
      />
      <section
        className="section-pad"
        style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="container text-center">
          <div className="eyebrow justify-content-center">
            <span></span> TEMPORARILY UNAVAILABLE
          </div>
          <h2>Case Study Unavailable</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            This case study could not be loaded right now. Please try again in a moment.
          </p>
          <div className="d-flex gap-3 justify-content-center mt-3 flex-wrap">
            <button
              className="btn btn-primary-custom rounded-pill px-4"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise"></i> Try again
            </button>
            <Link to="/work" className="btn btn-outline-secondary rounded-pill px-4">
              <i className="bi bi-arrow-left"></i> Back to Work
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function PreviewAccessDenied() {
  return (
    <MainLayout>
      <SEO title="Preview unavailable — Case Study" description="Sign in with an authorized administrator account to preview saved drafts." robots="noindex, nofollow" />
      <section className="section-pad" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container text-center">
          <div className="eyebrow justify-content-center"><span></span> ADMIN PREVIEW</div>
          <h2>Saved draft preview requires admin access</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            Sign in with an authorized administrator account, then reopen the saved preview link. Draft content is not exposed on the public route.
          </p>
          <Link to="/admin/login" className="btn btn-primary-custom rounded-pill px-4 mt-3">Admin sign in</Link>
        </div>
      </section>
    </MainLayout>
  );
}

function PreviewUnsupported() {
  return (
    <MainLayout>
      <SEO title="Preview unavailable — Case Study" description="This custom case study is not rendered from saved Standard Case Study fields." robots="noindex, nofollow" />
      <section className="section-pad" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container text-center">
          <div className="eyebrow justify-content-center"><span></span> PREVIEW UNAVAILABLE</div>
          <h2>This custom case study has no saved CMS body preview</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            This entry renders through a standalone React component rather than <code>metadata.caseStudy</code>. The saved draft preview is currently supported for standard case studies only.
          </p>
          <Link to="/admin/registry" className="btn btn-primary-custom rounded-pill px-4 mt-3">Back to Content Registry</Link>
        </div>
      </section>
    </MainLayout>
  );
}

/**
 * RegistryContentMissingState — shown when the Registry entry is published
 * but metadata.caseStudy body content has not been populated.
 *
 * This is a data integrity / admin issue, not a user error.
 * The content must be migrated via the Admin Registry panel.
 * We must not fall back to local data.
 */
function RegistryContentMissingState({ slug }) {
  return (
    <MainLayout>
      <SEO
        title="Content Unavailable — Case Study"
        description="This case study content is not yet available."
        robots="noindex, nofollow"
      />
      <section
        className="section-pad"
        style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="container text-center">
          <div className="eyebrow justify-content-center">
            <span></span> CONTENT UNAVAILABLE
          </div>
          <h2>Case Study Not Ready</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            This case study is registered but its content has not been published yet.
          </p>
          <div className="d-flex gap-3 justify-content-center mt-3 flex-wrap">
            <Link to="/work" className="btn btn-primary-custom rounded-pill px-4">
              <i className="bi bi-arrow-left"></i> Back to Work
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
