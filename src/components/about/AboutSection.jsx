import React from 'react';
import { useTranslation } from 'react-i18next';
import Timeline from './Timeline';
import AboutCard from './AboutCard';

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section className="section-pad pt-2" id="about">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <div className="eyebrow">
              <span></span> {t('about.eyebrow')}
            </div>
            <h2>
              {t('about.titleLine1')}<br />
              {t('about.titleLine2')}
            </h2>

            <Timeline />
          </div>

          <div className="col-lg-5">
            <AboutCard />
          </div>
        </div>
      </div>
    </section>
  );
}
