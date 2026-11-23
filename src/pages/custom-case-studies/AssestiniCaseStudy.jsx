import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/common/SEO';
import { getCaseStudySchema } from '../../lib/schema';
import CMSCustomSections from '../../components/case-study/CMSCustomSections';

// Subcomponents
import AssestiniHero from '../../components/case-study/assestini/AssestiniHero';
import AssestiniChallenge from '../../components/case-study/assestini/AssestiniChallenge';
import AssestiniWorkflow from '../../components/case-study/assestini/AssestiniWorkflow';
import AssestiniEstimation from '../../components/case-study/assestini/AssestiniEstimation';
import AssestiniCommercial from '../../components/case-study/assestini/AssestiniCommercial';
import AssestiniIntelligence from '../../components/case-study/assestini/AssestiniIntelligence';
import AssestiniMcp from '../../components/case-study/assestini/AssestiniMcp';
import AssestiniBuilding from '../../components/case-study/assestini/AssestiniBuilding';
import AssestiniTechCta from '../../components/case-study/assestini/AssestiniTechCta';

export default function AssestiniCaseStudy({ caseStudy = {}, cmsSections = [], previewInfo = null }) {
  const { i18n } = useTranslation();
  const locale = (i18n?.language || 'en').slice(0, 2);
  const localizedCaseStudy = caseStudy.translations?.[locale] || {};
  const displayTitle = localizedCaseStudy.title || caseStudy.title;
  const displaySubtitle = localizedCaseStudy.subtitle || caseStudy.subtitle;
  const schema = getCaseStudySchema({
    title: displayTitle || 'Assestini — AI Operational Intelligence Platform',
    description: displaySubtitle || 'Assestini is an AI-powered operational platform for freelancers, experts, consultants and agencies. From estimation to payment in one connected workflow.',
    slug: 'assestini',
  });

  return (
    <MainLayout>
      <SEO
        title={(displayTitle || 'Assestini') + ' — Case Study · Naïm Bsili'}
        description={displaySubtitle || 'Assestini — AI-powered Operational Intelligence Platform. Product design case study by Naïm Bsili. From estimation to payment in one connected workflow.'}
        canonical="/work/assestini/"
        schema={schema}
      />

      {previewInfo && <div className="preview-mode-banner preview-mode-banner-safe bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm" role="status">SAVED CMS PREVIEW — {previewInfo.title} ({previewInfo.status}/{previewInfo.visibility})</div>}
      <main className="assestini-page">
        {/* 01. Hero */}
        <AssestiniHero title={displayTitle} subtitle={displaySubtitle} />

        {/* 02. The Challenge + Role aside */}
        <AssestiniChallenge />

        {/* 03. The Connected Workflow + SVG Diagram + Screenshots */}
        <AssestiniWorkflow />

        {/* 04. AI Estimation (Input → AI Processing → Structured Output) */}
        <AssestiniEstimation />

        {/* 05. Commercial Workflow (From Quotation to Delivery) */}
        <AssestiniCommercial />

        {/* 06. Operational Intelligence + Control Center + Product Thinking */}
        <AssestiniIntelligence />

        {/* 07. AI Agents & MCP Architecture */}
        <AssestiniMcp />

        {/* 08. Product Building 5 Layers + Editorial Quote + Product Evidence */}
        <AssestiniBuilding />

        {/* 09. Technology & Tools + Bottom Case Navigation */}
        <CMSCustomSections sections={cmsSections} />
        <AssestiniTechCta />
      </main>
    </MainLayout>
  );
}
