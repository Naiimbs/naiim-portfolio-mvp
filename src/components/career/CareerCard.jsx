import React from 'react';
import { useTranslation } from 'react-i18next';
import portraitPhoto from '../../assets/images/naim-portrait.webp';

export default function CareerCard() {
  const { t } = useTranslation();
  const opportunities = t('career.opportunities', { returnObjects: true }) || [];

  return (
    <>
      <div className="feature-card career-card career-opportunity-card h-100">
        <div className="feature-head">
          <div className="feature-icon dark">
            <i className="bi bi-briefcase"></i>
          </div>
          <div>
            <div className="feature-kicker">{t('career.kicker')}</div>
            <h2>{t('career.title')}</h2>
            <p>{t('career.subtitle')}</p>
          </div>
        </div>

        <div className="career-profile">
          <img src={portraitPhoto} alt="Naïm Bsili" />
          <div>
            <strong>Naïm Bsili</strong>
            <span>{t('career.role')}</span>
            <small>{t('career.openTo')}</small>
          </div>
        </div>

        <div className="career-opportunities" role="list">
          {opportunities.map((opportunity, idx) => (
            <div className="career-opportunity" key={opportunity.title || idx} role="listitem">
              <span className="career-opportunity-icon"><i className={`bi ${opportunity.icon || 'bi-arrow-up-right'}`}></i></span>
              <div>
                <strong>{opportunity.title}</strong>
                <span>{opportunity.description}</span>
              </div>
            </div>
          ))}
        </div>

        <a href="#contact" className="btn btn-primary-custom rounded-pill career-contact-button">
          {t('career.contactCta')} <i className="bi bi-arrow-up-right"></i>
        </a>
      </div>
    </>
  );
}
