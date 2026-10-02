import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import PageRenderer from '../components/cms/PageRenderer';
import { getPageBySlug, getPageSections } from '../services/siteCms';
import AboutSection from '../components/about/AboutSection';

export default function AboutPage() {
  const [aboutPage, setAboutPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    async function loadAboutCms() {
      const pageRes = await getPageBySlug('about');
      if (isMounted) {
        if (pageRes.data && pageRes.data.status === 'published') {
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
  }, []);

  const hasCmsSections = Boolean(sections && sections.length > 0);

  return (
    <MainLayout>
      <SEO
        title={aboutPage?.seo_title || 'About — Naïm Bsili | Product Designer & AI Builder'}
        description={aboutPage?.seo_description || 'Career journey, product design philosophy, and AI automation expertise of Naïm Bsili.'}
        canonical="/about"
      />

      {hasCmsSections ? (
        <PageRenderer page={aboutPage} sections={sections} loading={loading} />
      ) : (
        <AboutSection />
      )}
    </MainLayout>
  );
}
