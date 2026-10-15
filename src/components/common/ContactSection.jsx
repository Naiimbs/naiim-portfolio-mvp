import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ContactSection() {
  const { t } = useTranslation();

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="contact-box">
          <div>
            <div className="eyebrow light">
              <span></span> {t('contact.eyebrow')}
            </div>
            <h2>
              {t('contact.titleLine1')}<br />
              {t('contact.titleLine2')}
            </h2>
            <p>{t('contact.subtitle')}</p>
          </div>
          <a className="btn btn-warning rounded-pill px-4" href="mailto:hi@naiimbsili.com">
            {t('contact.cta')} <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
