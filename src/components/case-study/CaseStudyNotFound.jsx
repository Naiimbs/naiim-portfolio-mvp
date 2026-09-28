import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';

export default function CaseStudyNotFound({ slug }) {
  return (
    <MainLayout>
      <section className="section-pad" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container text-center">
          <div className="eyebrow justify-content-center">
            <span></span> NOT FOUND
          </div>
          <h2>Case Study Not Found</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            No project case study matches the URL <code>/work/{slug}</code>.
          </p>
          <Link to="/" className="btn btn-primary-custom rounded-pill px-4 mt-3">
            <i className="bi bi-arrow-left"></i> Back to Home
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
