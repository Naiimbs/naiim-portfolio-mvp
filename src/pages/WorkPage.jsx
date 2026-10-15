import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import WorkCatalog from '../components/work/WorkCatalog';
import {
  getPageBySlug,
  getPageSections,
  getAdminPages,
  getAdminPageSections,
} from '../services/siteCms';
import { getPublishedPublicContentBySlug } from '../services/contentRegistry';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../admin/context/AuthContext';

/**
 * WorkPage — /work
 *
 * CMS-first: when a published `work` page with sections exists it is rendered
 * through the shared PageRenderer (editable in the Site Pages builder).
 * Otherwise it falls back to the WorkCatalog block (Content Registry catalog),
 * which is identical to the previous hardcoded page.
 */
export default function WorkPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [workPage, setWorkPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const canPreviewDraft = isPreviewRequested && (isAuthenticated || isEditor || !isSupabaseConfigured);

  useEffect(() => {
    let isMounted = true;
    async function loadWorkCms() {
      if (authLoading) return;

      if (canPreviewDraft) {
        const adminPagesRes = await getAdminPages();
        const found = (adminPagesRes.data || []).find((p) => p.slug === 'work');
        if (found && isMounted) {
          setWorkPage(found);
          const secRes = await getAdminPageSections(found.id);
          setSections(secRes.data || []);
          setLoading(false);
          return;
        }
      }

      const registryRes = await getPublishedPublicContentBySlug('work');
      const pageRes = await getPageBySlug('work');

      if (isMounted) {
        const isRegistryAllowed =
          !isSupabaseConfigured ||
          (registryRes.data && registryRes.data.status === 'published' && registryRes.data.visibility === 'public');
        const isPagePublished = pageRes.data && pageRes.data.status === 'published';

        if (isRegistryAllowed && isPagePublished) {
          setWorkPage(pageRes.data);
          const snapshot = Array.isArray(pageRes.data.published_snapshot) ? pageRes.data.published_snapshot : null;
          if (snapshot && snapshot.length > 0) {
            setSections(snapshot);
          } else {
            const secRes = await getPageSections(pageRes.data.id);
            if (secRes.data && secRes.data.length > 0) setSections(secRes.data);
          }
        }
        setLoading(false);
      }
    }
    loadWorkCms();
    return () => {
      isMounted = false;
    };
  }, [canPreviewDraft, authLoading]);

  const hasCmsSections = Boolean(sections && sections.length > 0);

  return (
    <MainLayout>
      <SEO
        title={workPage?.seo_title || 'Selected Work — Naim Bsili'}
        description={workPage?.seo_description || 'Case studies and digital products by Naim Bsili — Product Designer and AI Builder.'}
        canonical="/work"
      />

      {canPreviewDraft && (
        <div className="bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm position-sticky top-0 z-3">
          <i className="bi bi-eye-fill me-2"></i> PREVIEW MODE — You are previewing the Work page layout.
        </div>
      )}

      {hasCmsSections ? (
        <PageRenderer page={workPage} sections={sections} loading={loading} />
      ) : (
        <WorkCatalog />
      )}
    </MainLayout>
  );
}
