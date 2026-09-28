import React from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
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

  return (
    <MainLayout>
      <SEO
        title="Naïm Bsili — Product Designer & AI Builder"
        description="Senior UX/UI Designer & AI Product Builder. Turning ambiguous problems into usable digital products across product design, AI, low-code and automation."
        canonical="/"
        schema={schemas}
      />

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
    </MainLayout>
  );
}
