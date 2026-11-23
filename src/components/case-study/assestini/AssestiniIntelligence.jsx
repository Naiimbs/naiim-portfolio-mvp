import React from 'react';
import kanbanProjectLifeImg from '../../../assets/images/brainstorming-kanban-project-life.webp';
import { resolveAsset } from '../../../services/assetRegistry';
import { parseCaseStudyArray } from '../../../utils/caseStudyContent';

const DEFAULT_FEATURE_TAGS = [
  'Kanban', 'Gantt', 'Roadmap', 'Calendar', 'Time Tracking',
  'Project Health', 'Margin Visibility', 'SPI', 'CPI', 'Business Control Center',
];
const DEFAULT_DETAIL_CARDS = [
  {
    eyebrow: 'DELIVERY TRACKING',
    title: 'Project health per delivery',
    description: 'Each project tracks live health status, milestone progress and scope-creep signals. The product surfaces CPI / SPI indicators so experts can identify risk before it becomes a delay.',
    badges: ['Santé: 100%', 'Santé: 35%', 'Livré', 'En Cours'],
  },
  {
    eyebrow: 'FINANCIAL SIGNALS',
    title: 'Margin & billing intelligence',
    description: 'The platform continuously monitors unbilled work, overdue payments, and margin drift — and surfaces AI-triggered billing actions before revenue is lost.',
    badges: ['Factures en retard: 11', '329 384 TND pending'],
  },
];

export default function AssestiniIntelligence({ content = {} }) {
  const featureTags = parseCaseStudyArray(content.featureTagsJson, DEFAULT_FEATURE_TAGS)
    .filter((tag) => typeof tag === 'string');
  const detailCards = parseCaseStudyArray(content.detailCardsJson, DEFAULT_DETAIL_CARDS)
    .filter((card) => card && typeof card === 'object');
  const dashboardImage = resolveAsset(content.dashboardImage) || kanbanProjectLifeImg;

  return (
    <>
      <section className="case-section">
        <div className="container">
          <div className="eyebrow"><span></span> {content.eyebrow || '05 · OPERATIONAL INTELLIGENCE'}</div>
          <h2>{content.title || 'Beyond task management.'}</h2>
          <p className="case-copy mb-2">{content.lead || 'Once the project is launched, Assestini brings delivery and operational visibility into the same experience.'}</p>
          <div className="tech-row mb-5">{featureTags.map((tag, idx) => <span key={idx}>{tag}</span>)}</div>
          <figure className="case-media mb-3">
            <img src={dashboardImage} alt={content.dashboardImageAlt || 'Assestini operational dashboard'} loading="lazy" decoding="async" />
          </figure>
          <div className="row g-3">
            {detailCards.map((card, idx) => (
              <div className="col-md-6" key={idx}>
                <div className="case-media p-4">
                  <div className="eyebrow mb-2"><span></span> {card.eyebrow || ''}</div>
                  <h3 className="fs-5 fw-bold mb-2">{card.title || ''}</h3>
                  <p className="small text-muted mb-0">{card.description || ''}</p>
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    {parseCaseStudyArray(card.badges, []).filter((badge) => typeof badge === 'string').map((badge, badgeIdx) => (
                      <span className="badge bg-light text-dark border" key={badgeIdx}>{badge}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="case-section alt">
        <div className="container">
          <div className="case-highlight">
            <div className="eyebrow"><span></span> {content.principleEyebrow || 'PRODUCT THINKING'}</div>
            <h2>{content.principleTitle || 'The design shift: from "manage my projects" to "understand my business."'}</h2>
            <p className="case-copy">{content.principleLead || 'The interface is intentionally organized around visibility, signals, decisions and actions. The goal is to make the product feel like an operational layer rather than another project-management workspace.'}</p>
            <p className="case-copy mt-3">{content.principleBody || <>The four navigation layers reflect this: <strong>Voir (Visibilité)</strong> · <strong>Comprendre (Signaux)</strong> · <strong>Décider (Arbitrages)</strong> · <strong>Agir (Missions IA)</strong>.</>}</p>
          </div>
        </div>
      </section>
    </>
  );
}
