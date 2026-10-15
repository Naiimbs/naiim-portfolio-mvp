import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AboutCard({ customCard }) {
  const { t } = useTranslation();
  const cardData = customCard || {};
  const defaultSkills = t('about.skills', { returnObjects: true }) || [];
  const skills = Array.isArray(cardData.skills) && cardData.skills.length > 0 ? cardData.skills : defaultSkills;

  const cardEyebrow = cardData.cardEyebrow || t('about.cardEyebrow');
  const cardTitleLine1 = cardData.cardTitleLine1 || t('about.cardTitleLine1');
  const cardTitleLine2 = cardData.cardTitleLine2 || t('about.cardTitleLine2');
  const bio = cardData.bio || t('about.bio');
  const languagesLabel = cardData.languagesLabel || t('about.languagesLabel');
  const languagesLine1 = cardData.languagesLine1 || t('about.languagesLine1');
  const languagesLine2 = cardData.languagesLine2 || t('about.languagesLine2');
  const certificationsLabel = cardData.certificationsLabel || t('about.certificationsLabel');
  const certLine1 = cardData.certLine1 || t('about.certLine1');
  const certLine2 = cardData.certLine2 || t('about.certLine2');
  const certLine3 = cardData.certLine3 || t('about.certLine3');

  return (
    <div className="about-card">
      <div className="eyebrow">
        <span></span> {cardEyebrow}
      </div>
      <h3>
        {cardTitleLine1}<br />
        {cardTitleLine2}
      </h3>
      <p>{bio}</p>

      <div className="skill-cloud">
        {skills.map((skill, index) => (
          <span key={index}>{skill}</span>
        ))}
      </div>

      <div className="about-grid">
        <div>
          <small>{languagesLabel}</small>
          <p>
            {languagesLine1}
            {languagesLine2 && (
              <>
                <br />
                {languagesLine2}
              </>
            )}
          </p>
        </div>
        <div>
          <small>{certificationsLabel}</small>
          <p>
            {certLine1}
            {certLine2 && (
              <>
                <br />
                {certLine2}
              </>
            )}
            {certLine3 && (
              <>
                <br />
                {certLine3}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
