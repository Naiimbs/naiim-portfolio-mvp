import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import {
  getPageBySlug,
  getPageSections,
  getAdminPages,
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

  const [searchParams] = useSearchParams();
  const { isAuthenticated, isEditor, loading: authLoading } = useAuth();
  const isPreviewRequested = searchParams.get('preview') === 'true';

  const [homePage, setHomePage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const canPreviewDraft = isPreviewRequested && (isAuthenticated || isEditor || !isSupabaseConfigured);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeCms() {
      if (authLoading) return;

      // Authenticated draft preview mode
      if (canPreviewDraft) {
        const adminPagesRes = await getAdminPages();
        const found = (adminPagesRes.data || []).find((p) => p.slug === 'home');
        if (found && isMounted) {
          setHomePage(found);
          const secRes = await getAdminPageSections(found.id);
          setSections(secRes.data || []);
          setLoading(false);
          return;
        }
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
          const secRes = await getPageSections(pageRes.data.id);
          if (secRes.data && secRes.data.length > 0) {
            setSections(secRes.data);
          }
        }
        setLoading(false);
      }
    }
    loadHomeCms();
    return () => {
      isMounted = false;
    };
  }, [canPreviewDraft, authLoading]);

  const hasCmsSections = Boolean(sections && sections.length > 0);

  return (
    <MainLayout>
      <SEO
        title={homePage?.seo_title || 'Naïm Bsili — Product Designer & AI Builder'}
        description={homePage?.seo_description || 'Senior UX/UI Designer & AI Product Builder. Turning ambiguous problems into usable digital products across product design, AI, low-code and automation.'}
        canonical="/"
        schema={schemas}
      />

      {canPreviewDraft && (
        <div className="bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm position-sticky top-0 z-3">
          <i className="bi bi-eye-fill me-2"></i> PREVIEW MODE — You are previewing the Home page layout.
        </div>
      )}

      {hasCmsSections ? (
        <PageRenderer page={homePage} sections={sections} loading={loading} />
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
          <AboutSection />
          <ContactSection />
        </>
      )}
    </MainLayout>
  );
}
