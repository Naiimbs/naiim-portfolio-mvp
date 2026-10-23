import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import {
  getPageBySlug,
  getPageSections,
  getAdminPageBySlug,
  getAdminPageSections,
} from '../services/siteCms';
import { getPublishedPublicContentBySlug } from '../services/contentRegistry';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../admin/context/AuthContext';

import HeroSection from '../components/hero/HeroSection';
import SelectedWorkSection from '../components/work/SelectedWorkSection';
import CaseStudiesStrip from '../components/work/CaseStudiesStrip';
import CopilotWidget from '../components/copilot/CopilotWidget';
import CareerCard from '../components/career/CareerCard';
import LabSection from '../components/lab/LabSection';
import AboutSection from '../components/about/AboutSection';
import ContactSection from '../components/common/ContactSection';
import { getPersonSchema, getWebSiteSchema } from '../lib/schema';

export default function HomePage() {
  const schemas = [getPersonSchema(), getWebSiteSchema()];
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language?.slice(0, 2) || 'en';

  const [searchParams] = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [homePage, setHomePage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewSource, setPreviewSource] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  const canPreviewDraft = isPreviewRequested;
  const pageTx = {
    ...homePage?.i18n?.[currentLang],
    ...homePage?.metadata?.i18n?.[currentLang],
  };
  const localizedPageTitle = pageTx.title || (currentLang === 'en' ? homePage?.title || t('homePageTitle') : t('homePageTitle'));
  const localizedSeoTitle = pageTx.seo_title || pageTx.title || (currentLang === 'en' ? homePage?.seo_title : t('homeSeoTitle'));
  const localizedSeoDescription = pageTx.seo_description || pageTx.description || (currentLang === 'en' ? homePage?.seo_description : t('homeSeoDescription'));
  const localizedPageTranslation = {
    ...pageTx,
    title: localizedPageTitle,
    seo_title: localizedSeoTitle,
    seo_description: localizedSeoDescription,
  };
  const localizedHomePage = homePage ? {
    ...homePage,
    i18n: { ...homePage.i18n, [currentLang]: localizedPageTranslation },
    metadata: {
      ...homePage.metadata,
      i18n: { ...homePage.metadata?.i18n, [currentLang]: localizedPageTranslation },
    },
  } : homePage;
  const previewTitle = localizedPageTitle;
  const previewNotice = previewSource === 'local'
    ? t('localPreviewNotice')
    : previewSource === 'supabase'
      ? t('draftPreviewNotice', { title: previewTitle })
      : 'Loading saved page preview…';

  useEffect(() => {
    let isMounted = true;
    async function loadHomeCms() {
      if (authLoading) return;
      setLoading(true);
      setPreviewError(null);
      setPreviewSource(null);
      setHomePage(null);
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
        const pageRes = await getAdminPageBySlug('home');
        if (pageRes.error || !pageRes.data || (isSupabaseConfigured && !['supabase', 'supabase_registry'].includes(pageRes.source))) {
          if (isMounted) {
            setPreviewError('No saved CMS page could be loaded. Local fallback content is not substituted in authenticated preview mode.');
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
          setHomePage(pageRes.data);
          setSections(secRes.data || []);
          setPreviewSource(isSupabaseConfigured ? 'supabase' : 'local');
          setLoading(false);
        }
        return;
      }

      // Step 1: Content Registry Single Publication Authority
      const registryRes = await getPublishedPublicContentBySlug('home');
      const pageRes = await getPageBySlug('home');

      if (isMounted) {
        const isRegistryAllowed =
          !isSupabaseConfigured ||
          (registryRes.data && registryRes.data.status === 'published' && registryRes.data.visibility === 'public');
        const isPagePublished = pageRes.data && pageRes.data.status === 'published';

        if (isRegistryAllowed && isPagePublished) {
          setHomePage(pageRes.data);
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
    loadHomeCms();
    return () => {
      isMounted = false;
    };
  }, [canPreviewDraft, isAdmin, authLoading]);

  const hasCmsSections = Boolean(sections && sections.length > 0);

  return (
    <MainLayout>
      <SEO
        title={localizedSeoTitle || t('homeSeoTitle', 'Naïm Bsili — Product Designer & AI Builder')}
        description={localizedSeoDescription || t('homeSeoDescription', 'Portfolio of Naïm Bsili, specializing in UX/UI, digital product design, AI, and automation.')}
        canonical="/"
        schema={schemas}
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
        <PageRenderer page={localizedHomePage} sections={sections} loading={loading} />
      ) : canPreviewDraft && isSupabaseConfigured ? (
        <section className="section-pad"><div className="container">Loading saved CMS sections…</div></section>
      ) : (
        <>
          <HeroSection />
          <SelectedWorkSection />
          <CaseStudiesStrip />

          {/* COPILOT + CAREER */}
          <section className="section-pad pt-4" id="copilot">
            <div className="container">
              <div className="row g-4 align-items-stretch">
                <div className="col-lg-7">
                  <CopilotWidget />
                </div>
                <div className="col-lg-5" id="career">
                  <CareerCard />
                </div>
              </div>
            </div>
          </section>

          <LabSection />
          <AboutSection variant="compact" />
          <ContactSection />
        </>
      )}
    </MainLayout>
  );
}
