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

        {[
          ['problem', <WinniProblem content={sectionContent('problem')} />],
          ['idea', <WinniIdea content={sectionContent('idea')} />],
          ['challenge', <WinniChallenge content={sectionContent('challenge')} />],
          ['scanExperience', <WinniScanExperience content={sectionContent('scanExperience')} />],
          ['privacy', <WinniPrivacy content={sectionContent('privacy')} />],
          ['location', <WinniLocation content={sectionContent('location')} />],
          ['physicalProduct', <WinniPhysicalProduct content={sectionContent('physicalProduct')} />],
          ['systemMatrix', <WinniSystemMatrix content={sectionContent('systemMatrix')} />],
          ['visualSystem', <WinniVisualSystem content={sectionContent('visualSystem')} />],
          ['motion', <WinniMotion content={sectionContent('motion')} />],
          ['scope', <WinniScope content={sectionContent('scope')} />],
          ['outcome', <WinniOutcome content={sectionContent('outcome')} />],
        ].map(([id, component]) => ({ id, component }))}
          .filter(({ id }) => caseStudy.nativeSectionVisibility?.[id] !== false)
          .sort((a, b) => {
            const defaultOrder = ['problem','idea','challenge','scanExperience','privacy','location','physicalProduct','systemMatrix','visualSystem','motion','scope','outcome'];
            const savedOrder = Array.isArray(caseStudy.nativeSectionOrder) ? caseStudy.nativeSectionOrder : [];
            const order = [...savedOrder, ...defaultOrder.filter((key) => !savedOrder.includes(key))];
            return order.indexOf(a.id) - order.indexOf(b.id);
          })
          .map(({ id, component }) => <React.Fragment key={id}>{component}</React.Fragment>)}

        <CMSCustomSections sections={cmsSections} />
        <WinniCTA />
      </main>
    </MainLayout>
  );
}
