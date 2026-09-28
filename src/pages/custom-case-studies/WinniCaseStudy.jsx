import React from 'react';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/common/SEO';
import { getCaseStudySchema } from '../../lib/schema';

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

export default function WinniCaseStudy() {
  const schema = getCaseStudySchema({
    title: 'WINNI — Physical + Digital Identity System',
    description:
      'WINNI is a physical + digital identity system that helps people reconnect with lost belongings through a simple QR/NFC interaction. Product design case study by Naïm Bsili.',
    slug: 'winni',
  });

  return (
    <MainLayout>
      <SEO
        title="WINNI — Case Study · Naïm Bsili"
        description="WINNI — Physical + digital identity system that helps people reconnect with lost belongings. Product design case study by Naïm Bsili."
        canonical="/work/winni"
        schema={schema}
      />

      <main className="winni-page">
        {/* 01. Hero */}
        <WinniHero />

        {/* 02. The Problem */}
        <WinniProblem />

        {/* 03. The Idea */}
        <WinniIdea />

        {/* 04. Product Challenge */}
        <WinniChallenge />

        {/* 05. The Scan Experience (5 Screen Sequence) */}
        <WinniScanExperience />

        {/* 06. Privacy by Design */}
        <WinniPrivacy />

        {/* 07. Location — But Not Tracking */}
        <WinniLocation />

        {/* 08. Physical Product */}
        <WinniPhysicalProduct />

        {/* 09. Unified System Matrix */}
        <WinniSystemMatrix />

        {/* 10. Visual System */}
        <WinniVisualSystem />

        {/* 11. Motion */}
        <WinniMotion />

        {/* 12. Scope of Work (What I Designed) */}
        <WinniScope />

        {/* 13. The Design Principle + 14. Outcome */}
        <WinniOutcome />

        {/* 15. Final CTA + Pagination */}
        <WinniCTA />
      </main>
    </MainLayout>
  );
}
