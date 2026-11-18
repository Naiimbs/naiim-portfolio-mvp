import React from 'react';
import { useTranslation } from 'react-i18next';
import LabCard from './LabCard';
import PluginCard from './PluginCard';
import { plugins } from '../../data/plugins';

const LAB_ICONS = ['bi-robot', 'bi-diagram-3', 'bi-boxes', 'bi-database', 'bi-bezier2', 'bi-code-slash'];

export default function LabSection() {
  const { t } = useTranslation();
  const experiments = t('lab.experiments', { returnObjects: true }) || [];
  return (
    <section className="section-pad homepage-lab-section" id="lab">
      <div className="container">
        <div className="section-heading d-flex justify-content-between align-items-end mb-4">
          <div>
            <div className="eyebrow">
              <span></span> {t('lab.eyebrow')}
            </div>
            <h2>{t('lab.title')}</h2>
            <p>{t('lab.subtitle')}</p>
          </div>
        </div>

        <div className="row g-3">
          {experiments.map((exp, index) => (
            <div className="col-6 col-lg-2" key={index}>
              <LabCard
                icon={LAB_ICONS[index] || 'bi-box'}
                title={exp.title}
                description={exp.description}
              />
            </div>
          ))}
        </div>

        <div className="plugin-showcase mt-5">
          <div className="eyebrow">
            <span></span> {t('lab.pluginsEyebrow')}
          </div>
          <div className="row g-3 mt-1">
            {plugins.map((plugin) => (
              <div className="col-md-4" key={plugin.id}>
                <PluginCard plugin={plugin} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
