import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AboutCard() {
  const { t } = useTranslation();
  const skills = t('about.skills', { returnObjects: true }) || [];

  return (
    <div className="about-card">
      <div className="eyebrow">
        <span></span> {t('about.cardEyebrow')}
      </div>
      <h3>
        {t('about.cardTitleLine1')}<br />
        {t('about.cardTitleLine2')}
      </h3>
      <p>{t('about.bio')}</p>

      <div className="skill-cloud">
        {skills.map((skill, index) => (
          <span key={index}>{skill}</span>
        ))}
      </div>

      <div className="about-grid">
        <div>
          <small>{t('about.languagesLabel')}</small>
          <p>
            {t('about.languagesLine1')}<br />
            {t('about.languagesLine2')}
          </p>
        </div>
        <div>
          <small>{t('about.certificationsLabel')}</small>
          <p>
            {t('about.certLine1')}<br />
            {t('about.certLine2')}<br />
            {t('about.certLine3')}
          </p>
        </div>
      </div>
    </div>
  );
}
