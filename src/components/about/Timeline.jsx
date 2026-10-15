import React from 'react';
import { useTranslation } from 'react-i18next';

// Step labels (01–04 are numeric; the final one is localized as "NOW").
const STEP_LABELS = ['01', '02', '03', '04', null];
const ACTIVE_INDEX = 4;

export default function Timeline() {
  const { t } = useTranslation();
  const steps = t('about.timeline', { returnObjects: true }) || [];

  return (
    <div className="timeline mt-5">
      {steps.map((item, index) => (
        <div className={`timeline-item ${index === ACTIVE_INDEX ? 'active' : ''}`} key={index}>
          <b>{STEP_LABELS[index] ?? t('about.nowLabel')}</b>
          <span>
            {item.title}
            {item.subtitle && (
              <>
                <br />
                {item.subtitle}
              </>
            )}
            {item.small && (
              <>
                <br />
                <small>{item.small}</small>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
