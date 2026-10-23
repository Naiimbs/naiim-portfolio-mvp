import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import { getPageBySlug, getPageSections, getAdminPageBySlug, getAdminPageSections } from '../services/siteCms';
import { getPublishedPublicContentBySlug } from '../services/contentRegistry';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../admin/context/AuthContext';
import AboutSection from '../components/about/AboutSection';

export default function AboutPage() {
  const [searchParams] = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [aboutPage, setAboutPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewSource, setPreviewSource] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  const canPreviewDraft = isPreviewRequested;

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    async function loadAboutCms() {
      if (authLoading) return;
      setLoading(true);
      setPreviewError(null);
      setPreviewSource(null);
      setAboutPage(null);
      setSections([]);

      // Saved draft preview: configured Supabase requires an admin session and reads only persisted rows.
      if (canPreviewDraft) {
        if (isSupabaseConfigured && !isAdmin) {
          if (isMounted) {
            setPreviewError('Preview blocked: sign in with an authorized admin account.');
            setLoading(false);
          }
          return;
        }
        const pageRes = await getAdminPageBySlug('about');
        if (pageRes.error || !pageRes.data || (isSupabaseConfigured && !['supabase', 'supabase_registry'].includes(pageRes.source))) {
          if (isMounted) {
            setPreviewError('No saved CMS page could be loaded. Local proposal content is not substituted in authenticated preview mode.');
            setLoading(false);
          }
          return;
        }
        const secRes = await getAdminPageSections(pageRes.data.id, { allowFallback: !isSupabaseConfigured });
        if (isSupabaseConfigured && (secRes.error || secRes.source !== 'supabase' || !Array.isArray(secRes.data) || secRes.data.length === 0)) {
          if (isMounted) {
            setPreviewError('Saved CMS sections are unavailable. Check the page row, section rows, and admin authorization.');
            setLoading(false);
          }
          return;
        }
        if (isMounted) {
          setAboutPage(pageRes.data);
          setSections(secRes.data || []);
          setPreviewSource(isSupabaseConfigured ? 'supabase' : 'local');
          setLoading(false);
        }
        return;
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
          const snapshot = Array.isArray(pageRes.data.published_snapshot) ? pageRes.data.published_snapshot : null;
          const isLegacySnapshot = snapshot && snapshot.length > 0 && snapshot.every((s) => ['hero', 'rich_text', 'timeline', 'workflow', 'cta'].includes(s.section_type));
          if (snapshot && snapshot.length > 0 && !isLegacySnapshot) {
            setSections(snapshot);
          } else {
            const secRes = await getPageSections(pageRes.data.id);
            if (secRes.data && secRes.data.length > 0) {
              setSections(secRes.data);
            }
          }
        }
        setLoading(false);
      }
    }
    loadAboutCms();
    return () => {
      isMounted = false;
    };
  }, [canPreviewDraft, isAdmin, authLoading]);

  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language?.slice(0, 2) || 'en';
  const pageTx = {
    ...aboutPage?.i18n?.[currentLang],
    ...aboutPage?.metadata?.i18n?.[currentLang],
  };
  const localizedTitle = pageTx.seo_title || pageTx.title || (currentLang === 'en' ? aboutPage?.seo_title : t('about.seoTitle'));
  const localizedDescription = pageTx.seo_description || pageTx.description || (currentLang === 'en' ? aboutPage?.seo_description : t('about.seoDesc'));
  const localizedTranslation = {
    ...pageTx,
    title: pageTx.title || localizedTitle,
    seo_title: localizedTitle,
    seo_description: localizedDescription,
  };
  const localizedPage = aboutPage ? {
    ...aboutPage,
    i18n: {
      ...aboutPage.i18n,
      [currentLang]: localizedTranslation,
    },
    metadata: {
      ...aboutPage.metadata,
      i18n: {
        ...aboutPage.metadata?.i18n,
        [currentLang]: localizedTranslation,
      },
    },
  } : aboutPage;
  const hasCmsSections = Boolean(sections && sections.length > 0);
  const previewNotice = previewSource === 'local'
    ? t('localPreviewNotice')
    : previewSource === 'supabase'
      ? t('draftPreviewNotice', { title: pageTx.title || (currentLang === 'en' ? aboutPage?.title || t('nav.about') : t('nav.about')) })
      : 'Loading saved page preview…';

  return (
    <MainLayout>
      <SEO
        title={localizedTitle || t('about.seoTitle', 'About — Naïm Bsili | Product Designer & AI Builder')}
        description={localizedDescription || t('about.seoDesc', 'Career journey, product design philosophy, and AI automation expertise of Naïm Bsili.')}
        canonical="/about"
        robots={isPreviewRequested ? 'noindex, nofollow' : undefined}
      />

      {canPreviewDraft && (
        <div className="preview-mode-banner bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm">
          <i className="bi bi-eye-fill me-2"></i> {previewError || previewNotice}
        </div>
      )}

      {canPreviewDraft && previewError ? (
        <section className="section-pad" role="alert"><div className="container"><h2>Preview unavailable</h2><p>{previewError}</p></div></section>
      ) : hasCmsSections ? (
        <PageRenderer page={localizedPage} sections={sections} loading={loading} />
      ) : canPreviewDraft && isSupabaseConfigured ? (
        <section className="section-pad"><div className="container">{loading ? 'Loading saved CMS sections…' : 'No saved CMS sections are available for this page.'}</div></section>
      ) : (
        <AboutSection pageData={localizedPage} />
      )}
    </MainLayout>
  );
}
