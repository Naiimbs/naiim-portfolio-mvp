import React from 'react';
import { useTranslation } from 'react-i18next';
import Timeline from './Timeline';
import AboutCard from './AboutCard';
import AboutMeProposal from './AboutMeProposal';

export default function AboutSection({ pageData, variant = 'full' }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language?.slice(0, 2) || 'en';

  if (variant === 'full') {
    return <AboutMeProposal pageData={pageData} />;
  }

  const pageTx = (currentLang !== 'en' && (pageData?.metadata?.i18n?.[currentLang]?.about || pageData?.i18n?.[currentLang]?.about)) || {};
  const defAbout = pageData?.metadata?.about || {};

  const eyebrow = pageTx.eyebrow || defAbout.eyebrow || t('about.eyebrow');
  const titleLine1 = pageTx.titleLine1 || defAbout.titleLine1 || t('about.titleLine1');
  const titleLine2 = pageTx.titleLine2 || defAbout.titleLine2 || t('about.titleLine2');

  const customTimeline = Array.isArray(pageTx.timeline) && pageTx.timeline.length > 0
    ? pageTx.timeline
    : Array.isArray(defAbout.timeline) && defAbout.timeline.length > 0
    ? defAbout.timeline
    : null;

  const customCard = {
    ...defAbout,
    ...pageTx,
  };

  return (
    <section className="section-pad pt-2" id="about">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <div className="eyebrow">
              <span></span> {eyebrow}
            </div>
            <h2>
              {titleLine1}<br />
              {titleLine2}
            </h2>

            <Timeline customTimeline={customTimeline} />
          </div>

          <div className="col-lg-5">
            <AboutCard customCard={customCard} />
          </div>
        </div>
      </div>
    </section>
  );
}
