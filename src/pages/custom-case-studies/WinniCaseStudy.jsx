import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';

export default function WinniCaseStudy() {
  return (
    <MainLayout>
      <header className="case-hero">
        <div className="container">
          <Link className="text-link" to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <div className="eyebrow mt-4">
            <span></span> WINNI · BESPOKE CASE STUDY
          </div>
          <h1>Giving lost things a way back.</h1>
          <p className="case-hero-lead">
            WINNI is a physical + digital identity system that helps people reconnect with lost belongings through a simple QR/NFC interaction.
          </p>
          <div className="case-meta">
            <span>Role: Product Designer · UX/UI · Product Strategy · Brand</span>
            <span>Timeline: 2026 · Ongoing</span>
            <span>Scope: Physical Product · Web App · Mobile Flow</span>
          </div>
        </div>
      </header>

      <section className="case-section">
        <div className="container text-center py-5">
          <div className="eyebrow justify-content-center">
            <span></span> BESPOKE CASE STUDY PLACEHOLDER
          </div>
          <h3>Full WINNI Editorial Case Study</h3>
          <p className="hero-lead mx-auto" style={{ maxWidth: '640px' }}>
            The deep bespoke WINNI case study architecture will be fully migrated in a subsequent dedicated phase.
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
