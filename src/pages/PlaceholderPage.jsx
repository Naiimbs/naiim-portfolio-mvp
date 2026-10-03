import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';

export default function PlaceholderPage({ title, description }) {
  const { slug } = useParams();
  const is404 = title && title.toLowerCase().includes('404');
  const pageTitle = title ? `${title} ${slug ? `· ${slug}` : ''}` : 'Portfolio';
  const eyebrowText = is404 ? '404 ERROR' : 'COMING SOON';

  return (
    <MainLayout>
      <SEO
        title={pageTitle}
        description={description}
        robots={is404 ? 'noindex, nofollow' : 'noindex, follow'}
      />
      <section className="section-pad" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container text-center">
          <div className="eyebrow justify-content-center">
            <span></span> {eyebrowText}
          </div>
          <h2>{title} {slug ? `· ${slug}` : ''}</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            {description || 'This route is configured in React Router and will be implemented in subsequent phases.'}
          </p>
          <Link to="/" className="btn btn-primary-custom rounded-pill px-4 mt-3">
            <i className="bi bi-arrow-left"></i> Back to Home
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
