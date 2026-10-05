import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import { getPageBySlug, getPageSections, getAdminPages, getAdminPageSections } from '../services/siteCms';
import { getPublishedPublicContentBySlug } from '../services/contentRegistry';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../admin/context/AuthContext';
import AboutSection from '../components/about/AboutSection';

export default function AboutPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [aboutPage, setAboutPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const canPreviewDraft = isPreviewRequested && (isAuthenticated || isEditor || !isSupabaseConfigured);

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    async function loadAboutCms() {
      if (authLoading) return;

      // Authenticated draft preview mode
      if (canPreviewDraft) {
        const adminPagesRes = await getAdminPages();
        const found = (adminPagesRes.data || []).find((p) => p.slug === 'about');
        if (found && isMounted) {
          setAboutPage(found);
          const secRes = await getAdminPageSections(found.id);
          setSections(secRes.data || []);
          setLoading(false);
          return;
        }
      }

      // Step 1: Content Registry Single Publication Authority
      const registryRes = await getPublishedPublicContentBySlug('about');
      const pageRes = await getPageBySlug('about');

      if (isMounted) {
        // If Supabase is unconfigured, allow local fallback.
        // If Supabase is configured: both registry entry AND page must be published & public.
        const isRegistryAllowed = !isSupabaseConfigured || (registryRes.data && registryRes.data.status === 'published' && registryRes.data.visibility === 'public');
        const isPagePublished = pageRes.data && pageRes.data.status === 'published';

        if (isRegistryAllowed && isPagePublished) {
          setAboutPage(pageRes.data);
          const secRes = await getPageSections(pageRes.data.id);
          if (secRes.data && secRes.data.length > 0) {
            setSections(secRes.data);
          }
        }
        setLoading(false);
      }
    }
    loadAboutCms();
    return () => {
      isMounted = false;
    };
  }, [canPreviewDraft, authLoading]);

  const hasCmsSections = Boolean(sections && sections.length > 0);

  return (
    <MainLayout>
      <SEO
        title={aboutPage?.seo_title || 'About — Naïm Bsili | Product Designer & AI Builder'}
        description={aboutPage?.seo_description || 'Career journey, product design philosophy, and AI automation expertise of Naïm Bsili.'}
        canonical="/about"
      />

      {canPreviewDraft && (
        <div className="bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm position-sticky top-0 z-3">
          <i className="bi bi-eye-fill me-2"></i> PREVIEW MODE — You are previewing the About page layout.
        </div>
      )}

      {hasCmsSections ? (
        <PageRenderer page={aboutPage} sections={sections} loading={loading} />
      ) : (
        <AboutSection />
      )}
    </MainLayout>
  );
}

