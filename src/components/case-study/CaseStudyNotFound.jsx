import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../common/SEO';

export default function CaseStudyNotFound({ slug }) {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <SEO
        title={`404 — ${t('caseStudy.notFoundTitle')}`}
        description={t('caseStudy.notFoundBody', { slug: slug || '' })}
        robots="noindex, nofollow"
      />
      <section className="section-pad" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container text-center">
          <div className="eyebrow justify-content-center">
            <span></span> {t('caseStudy.notFoundLabel')}
          </div>
          <h2>{t('caseStudy.notFoundTitle')}</h2>
          <p className="hero-lead mx-auto" style={{ maxWidth: '540px' }}>
            {t('caseStudy.notFoundBody', { slug: slug || '' })}
          </p>
          <Link to="/" className="btn btn-primary-custom rounded-pill px-4 mt-3">
            <i className="bi bi-arrow-left"></i> {t('placeholder.backHome')}
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
