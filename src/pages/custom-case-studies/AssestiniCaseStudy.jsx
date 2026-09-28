import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/common/SEO';
import { getCaseStudySchema } from '../../lib/schema';

export default function AssestiniCaseStudy() {
  const schema = getCaseStudySchema({
    title: 'Assestini — AI-powered Operational Intelligence Platform',
    description: 'Designing an operational layer that connects estimation, delivery, margins, cash flow and AI-assisted decisions.',
    slug: 'assestini',
  });

  return (
    <MainLayout>
      <SEO
        title="Assestini — Case Study"
        description="Designing an operational layer that connects estimation, delivery, margins, cash flow and AI-assisted decisions."
        canonical="/work/assestini"
        schema={schema}
      />

      <header className="case-hero">
        <div className="container">
          <Link className="text-link" to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <div className="eyebrow mt-4">
            <span></span> ASSESTINI · BESPOKE CASE STUDY
          </div>
          <h1>Assestini · Operational Intelligence Platform</h1>
          <p className="case-hero-lead">
            Designing an operational layer that connects estimation, delivery, margins, cash flow and AI-assisted decisions.
          </p>
          <div className="case-meta">
            <span>Role: Product Designer · AI · RAG</span>
            <span>Context: Operational Intelligence OS</span>
          </div>
        </div>
      </header>

      <section className="case-section">
        <div className="container text-center py-5">
          <div className="eyebrow justify-content-center">
            <span></span> BESPOKE CASE STUDY PLACEHOLDER
          </div>
          <h3>Full Assestini Platform Case Study</h3>
          <p className="hero-lead mx-auto" style={{ maxWidth: '640px' }}>
            The deep bespoke Assestini case study architecture (workflow pills, flow diagrams, AI sequences) will be migrated in a subsequent dedicated phase.
          </p>
          <Link to="/#work" className="btn btn-primary-custom rounded-pill px-4 mt-3">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
        </div>
      </section>

      <section className="case-nav">
        <div className="container d-flex justify-content-between">
          <Link to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <a href="#contact">
            Let's talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
