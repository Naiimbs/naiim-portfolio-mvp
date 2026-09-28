import React from 'react';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/common/SEO';
import { getCaseStudySchema } from '../../lib/schema';

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

export default function AssestiniCaseStudy() {
  const schema = getCaseStudySchema({
    title: 'Assestini — AI Operational Intelligence Platform',
    description:
      'Assestini is an AI-powered operational platform for freelancers, experts, consultants and agencies. From estimation to payment in one connected workflow.',
    slug: 'assestini',
  });

  return (
    <MainLayout>
      <SEO
        title="Assestini — Case Study · Naïm Bsili"
        description="Assestini — AI-powered Operational Intelligence Platform. Product design case study by Naïm Bsili. From estimation to payment in one connected workflow."
        canonical="/work/assestini"
        schema={schema}
      />

      <main className="assestini-page">
        {/* 01. Hero */}
        <AssestiniHero />

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
        <AssestiniTechCta />
      </main>
    </MainLayout>
  );
}
