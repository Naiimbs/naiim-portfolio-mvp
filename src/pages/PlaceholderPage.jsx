import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';

export default function PlaceholderPage({ title, description }) {
  const { t } = useTranslation();
  const { slug } = useParams();
  const is404 = title && title.toLowerCase().includes('404');
  const pageTitle = title ? `${title} ${slug ? `· ${slug}` : ''}` : 'Portfolio';
  const eyebrowText = is404 ? t('placeholder.error404') : t('placeholder.comingSoon');

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
            {description || t('placeholder.defaultDesc')}
          </p>
          <Link to="/" className="btn btn-primary-custom rounded-pill px-4 mt-3">
            <i className="bi bi-arrow-left"></i> {t('placeholder.backHome')}
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
