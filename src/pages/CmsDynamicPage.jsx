import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PageRenderer from '../components/cms/PageRenderer';
import {
  getPageBySlug,
  getPageSections,
  getAdminPageBySlug,
  getAdminPageSections,
} from '../services/siteCms';

import { useAuth } from '../admin/context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPublishedPublicContentBySlug } from '../services/contentRegistry';
import { isPagePubliclyAccessible } from '../utils/registryHealth';

/**
 * Dynamic CMS Page Route Component.
 * Resolves published pages by slug, and supports authorized preview mode for draft pages when requested.
 */
export default function CmsDynamicPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewSource, setPreviewSource] = useState(null);

  const canPreviewDraft = isPreviewRequested;

  useEffect(() => {
    async function loadPageData() {
      if (!slug || authLoading) return;
      setLoading(true);
      setError(null);
      setPreviewSource(null);
      setPage(null);
      setSections([]);

      // Saved draft preview: use only persisted records, never merged local fallback data.
      if (canPreviewDraft) {
        if (isSupabaseConfigured && !isAdmin) {
          setError(new Error('Preview blocked: sign in with an authorized admin account.'));
          setLoading(false);
          return;
        }
        const pageRes = await getAdminPageBySlug(slug);
        if (pageRes.error || !pageRes.data || (isSupabaseConfigured && !['supabase', 'supabase_registry'].includes(pageRes.source))) {
          setError(new Error('No saved CMS page could be loaded. Local proposal data is not substituted in authenticated preview mode.'));
          setPage(null);
          setSections([]);
          setLoading(false);
          return;
        }
        const secRes = await getAdminPageSections(pageRes.data.id, { allowFallback: !isSupabaseConfigured });
        if (isSupabaseConfigured && (secRes.error || secRes.source !== 'supabase' || !Array.isArray(secRes.data) || secRes.data.length === 0)) {
          setError(new Error('Saved CMS sections are unavailable. Check the page row, section rows, and admin authorization.'));
          setPage(null);
          setSections([]);
          setLoading(false);
          return;
        }
        setPage(pageRes.data);
        setSections(secRes.data || []);
        setPreviewSource(isSupabaseConfigured ? 'supabase' : 'local');
        setLoading(false);
        return;
      }

      // ── Step 1: Content Registry Publication Gate (Single Authority) ──────
      const registryRes = await getPublishedPublicContentBySlug(slug);

      if (isSupabaseConfigured && (registryRes.notFound || !registryRes.data)) {
        setError(new Error('Page not found or not published.'));
        setPage(null);
        setSections([]);
        setLoading(false);
        return;
      }

      // ── Step 2: Page Builder Data Fetch ───────────────────────────────────
      const pageRes = await getPageBySlug(slug);
      if (pageRes.error || !pageRes.data) {
        setError(pageRes.error || new Error('Page not found'));
        setPage(null);
        setSections([]);
        setLoading(false);
        return;
      }

      // ── Step 3: Consistency Gate Check ────────────────────────────────────
      if (registryRes.data && !isPagePubliclyAccessible(pageRes.data, registryRes.data)) {
        setError(new Error('Page is not publicly accessible.'));
        setPage(null);
        setSections([]);
        setLoading(false);
        return;
      }

      setPage(pageRes.data);

      // Live site renders the published snapshot (frozen at publish time);
      // fall back to live sections for pages published before snapshots existed.
      const snapshot = Array.isArray(pageRes.data.published_snapshot) ? pageRes.data.published_snapshot : null;
      if (snapshot && snapshot.length > 0) {
        setSections(snapshot);
      } else {
        const secRes = await getPageSections(pageRes.data.id);
        setSections(secRes.data || []);
      }
      setLoading(false);
    }

    loadPageData();
  }, [slug, canPreviewDraft, isAdmin, authLoading]);

  return (
    <MainLayout>
      {canPreviewDraft && (
        <div className="bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm position-sticky top-0 z-3">
          <i className="bi bi-eye-fill me-2"></i>
          {error ? error.message : previewSource === 'local' ? 'LOCAL PREVIEW — not connected to saved CMS data.' : previewSource === 'supabase' ? `SAVED CMS PREVIEW — ${page?.title || slug}; not the public snapshot.` : `Loading saved preview for ${slug}…`}
        </div>
      )}
      <PageRenderer page={page} sections={sections} loading={loading} error={error} robots={canPreviewDraft ? 'noindex, nofollow' : null} />
    </MainLayout>
  );
}
