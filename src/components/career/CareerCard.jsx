import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import portraitPhoto from '../../assets/images/naim-portrait.webp';

export default function CareerCard() {
  const { t } = useTranslation();
  const targetTags = t('career.tags', { returnObjects: true }) || [];
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <>
      <div className="feature-card career-card h-100">
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

        <div className="career-list">
          <div>
            <i className="bi bi-bullseye"></i>
            <span>{t('career.targetLabel')}</span>
            <strong>{t('career.targetValue')}</strong>
          </div>
          <div>
            <i className="bi bi-geo-alt"></i>
            <span>{t('career.marketsLabel')}</span>
            <strong>{t('career.marketsValue')}</strong>
          </div>
          <div>
            <i className="bi bi-layers"></i>
            <span>{t('career.focusLabel')}</span>
            <strong>{t('career.focusValue')}</strong>
          </div>
        </div>

        <button
          className="btn btn-primary-custom rounded-pill w-100"
          id="careerButton"
          type="button"
          onClick={() => setShowToast(true)}
        >
          {t('career.exploreBtn')} <i className="bi bi-arrow-right"></i>
        </button>

        <div className="looking-for">
          <small>{t('career.lookingFor')}</small>
          <div className="tag-row">
            {targetTags.map((tag, idx) => (
              <span key={idx}>{tag}</span>
            ))}
          </div>
        </div>

        <a href="#contact" className="download-cv">
          <i className="bi bi-download"></i> {t('career.downloadCv')}
        </a>
      </div>

      {showToast && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div id="careerToast" className="toast show border-0 shadow" role="alert">
            <div className="toast-header">
              <i className="bi bi-stars me-2"></i>
              <strong className="me-auto">{t('career.toastTitle')}</strong>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowToast(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-body">
              {t('career.toastBody')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
