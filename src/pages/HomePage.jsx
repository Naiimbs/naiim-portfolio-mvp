import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import { getPageBySlug, getPageSections } from '../services/siteCms';

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

  const [homePage, setHomePage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeCms() {
      const pageRes = await getPageBySlug('home');
      if (isMounted) {
        if (pageRes.data && pageRes.data.status === 'published') {
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
  }, []);

  const hasCmsSections = Boolean(sections && sections.length > 0);

  return (
    <MainLayout>
      <SEO
        title={homePage?.seo_title || 'Naïm Bsili — Product Designer & AI Builder'}
        description={homePage?.seo_description || 'Senior UX/UI Designer & AI Product Builder. Turning ambiguous problems into usable digital products across product design, AI, low-code and automation.'}
        canonical="/"
        schema={schemas}
      />

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
