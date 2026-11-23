import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/common/SEO';
import { getCaseStudySchema } from '../../lib/schema';
import CMSCustomSections from '../../components/case-study/CMSCustomSections';
import { resolveCustomSectionContent } from '../../services/customCaseStudyContent';

// Subcomponents
import WinniHero from '../../components/case-study/winni/WinniHero';
import WinniProblem from '../../components/case-study/winni/WinniProblem';
import WinniIdea from '../../components/case-study/winni/WinniIdea';
import WinniChallenge from '../../components/case-study/winni/WinniChallenge';
import WinniScanExperience from '../../components/case-study/winni/WinniScanExperience';
import WinniPrivacy from '../../components/case-study/winni/WinniPrivacy';
import WinniLocation from '../../components/case-study/winni/WinniLocation';
import WinniPhysicalProduct from '../../components/case-study/winni/WinniPhysicalProduct';
import WinniSystemMatrix from '../../components/case-study/winni/WinniSystemMatrix';
import WinniVisualSystem from '../../components/case-study/winni/WinniVisualSystem';
import WinniMotion from '../../components/case-study/winni/WinniMotion';
import WinniScope from '../../components/case-study/winni/WinniScope';
import WinniOutcome from '../../components/case-study/winni/WinniOutcome';
import WinniCTA from '../../components/case-study/winni/WinniCTA';

export default function WinniCaseStudy({ caseStudy = {}, cmsSections = [], previewInfo = null }) {
  const { i18n } = useTranslation();
  const locale = (i18n?.language || 'en').slice(0, 2);
  const localizedCaseStudy = caseStudy.translations?.[locale] || {};
  const displayTitle = localizedCaseStudy.title || caseStudy.title;
  const displaySubtitle = localizedCaseStudy.subtitle || caseStudy.subtitle;
  const sectionContent = (key) => resolveCustomSectionContent(caseStudy, key, locale);
  const schema = getCaseStudySchema({
    title: displayTitle || 'WINNI — Physical + Digital Identity System',
    description: displaySubtitle || 'WINNI is a physical + digital identity system that helps people reconnect with lost belongings through a simple QR/NFC interaction. Product design case study by Naïm Bsili.',
    slug: 'winni',
  });

  return (
    <MainLayout>
      <SEO
        title={ (displayTitle || 'WINNI') + ' — Case Study · Naïm Bsili' }
        description={displaySubtitle || 'WINNI — Physical + digital identity system that helps people reconnect with lost belongings. Product design case study by Naïm Bsili.'}
        canonical="/work/winni/"
        schema={schema}
      />

      {previewInfo && <div className="preview-mode-banner preview-mode-banner-safe bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm" role="status">SAVED CMS PREVIEW — {previewInfo.title} ({previewInfo.status}/{previewInfo.visibility})</div>}
      <main className="winni-page">
        {/* 01. Hero */}
        <WinniHero title={displayTitle} subtitle={displaySubtitle} />

        {/* 02. The Problem */}
        <WinniProblem content={sectionContent('problem')} />

        {/* 03. The Idea */}
        <WinniIdea content={sectionContent('idea')} />

        {/* 04. Product Challenge */}
        <WinniChallenge content={sectionContent('challenge')} />

        {/* 05. The Scan Experience (5 Screen Sequence) */}
        <WinniScanExperience content={sectionContent('scanExperience')} />

        {/* 06. Privacy by Design */}
        <WinniPrivacy content={sectionContent('privacy')} />

        {/* 07. Location — But Not Tracking */}
        <WinniLocation content={sectionContent('location')} />

        {/* 08. Physical Product */}
        <WinniPhysicalProduct content={sectionContent('physicalProduct')} />

        {/* 09. Unified System Matrix */}
        <WinniSystemMatrix content={sectionContent('systemMatrix')} />

        {/* 10. Visual System */}
        <WinniVisualSystem content={sectionContent('visualSystem')} />

        {/* 11. Motion */}
        <WinniMotion content={sectionContent('motion')} />

        {/* 12. Scope of Work (What I Designed) */}
        <WinniScope content={sectionContent('scope')} />

        {/* 13. The Design Principle + 14. Outcome */}
        <WinniOutcome content={sectionContent('outcome')} />

        {/* 15. Final CTA + Pagination */}
        <CMSCustomSections sections={cmsSections} />
        <WinniCTA />
      </main>
    </MainLayout>
  );
}
