import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CaseStudiesStrip() {
  const { t } = useTranslation();
  const steps = t('caseStrip.steps', { returnObjects: true }) || [];

  return (
    <section className="section-pad pt-5 pb-4" id="case-studies">
      <div className="container">
        <div className="section-heading mb-4">
          <div className="eyebrow">
            <span></span> {t('caseStrip.eyebrow')}
          </div>
          <h2>{t('caseStrip.title')}</h2>
          <p>{t('caseStrip.subtitle')}</p>
        </div>
        <div className="case-strip">
          {steps.map((step, index) => (
            <div key={index}>
              <strong>{step.strong}</strong>
              <span>{step.span}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
