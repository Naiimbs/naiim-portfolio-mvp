import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PageRenderer from '../components/cms/PageRenderer';
import {
  getPageBySlug,
  getPageSections,
  getAdminPages,
  getAdminPageSections,
} from '../services/siteCms';

import { useAuth } from '../admin/context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Dynamic CMS Page Route Component.
 * Resolves published pages by slug, and supports authorized preview mode for draft pages when requested.
 */
export default function CmsDynamicPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canPreviewDraft = isPreviewRequested && (isAuthenticated || isEditor || !isSupabaseConfigured);

  useEffect(() => {
    async function loadPageData() {
      if (!slug || authLoading) return;
      setLoading(true);
      setError(null);

      if (canPreviewDraft) {
        const adminPagesRes = await getAdminPages();
        const found = (adminPagesRes.data || []).find((p) => p.slug === slug);

        if (found) {
          setPage(found);
          const secRes = await getAdminPageSections(found.id);
          setSections(secRes.data || []);
          setLoading(false);
          return;
        }
      }

      // Default public fetch (published only, enforced by Supabase RLS)
      const pageRes = await getPageBySlug(slug);
      if (pageRes.error || !pageRes.data) {
        setError(pageRes.error || new Error('Page not found'));
        setPage(null);
        setSections([]);
        setLoading(false);
        return;
      }

      setPage(pageRes.data);

      const secRes = await getPageSections(pageRes.data.id);
      setSections(secRes.data || []);
      setLoading(false);
    }

    loadPageData();
  }, [slug, canPreviewDraft, authLoading]);

  return (
    <div>
      {canPreviewDraft && (
        <div className="bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm position-sticky top-0 z-3">
          <i className="bi bi-eye-fill me-2"></i> PREVIEW MODE — This is an unpublished preview of page "<code>{slug}</code>".
        </div>
      )}
      <PageRenderer page={page} sections={sections} loading={loading} error={error} />
    </div>
  );
}
