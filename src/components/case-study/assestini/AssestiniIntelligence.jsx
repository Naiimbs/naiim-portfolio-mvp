import React from 'react';
import kanbanProjectLifeImg from '../../../assets/images/brainstorming-kanban-project-life.png';

export default function AssestiniIntelligence() {
  const featureTags = [
    'Kanban',
    'Gantt',
    'Roadmap',
    'Calendar',
    'Time Tracking',
    'Project Health',
    'Margin Visibility',
    'SPI',
    'CPI',
    'Business Control Center',
  ];

  return (
    <>
      <section className="case-section">
        <div className="container">
          <div className="eyebrow">
            <span></span> 05 · OPERATIONAL INTELLIGENCE
          </div>
          <h2>Beyond task management.</h2>
          <p className="case-copy mb-2">
            Once the project is launched, Assestini brings delivery and operational visibility into the same experience.
          </p>

          {/* Feature tags */}
          <div className="tech-row mb-5">
            {featureTags.map((tag, idx) => (
              <span key={idx}>{tag}</span>
            ))}
          </div>

          {/* Large screenshot */}
          <figure className="case-media mb-3">
            <img
              src={kanbanProjectLifeImg}
              alt="Assestini Business Control Center — Business Health Score 69/100, delivery 100%, finance 45%, operations 55%"
              loading="lazy"
            />
          </figure>

          {/* 2 smaller details in row */}
          <div className="row g-3">
            <div className="col-md-6">
              <div className="case-media p-4">
                <div className="eyebrow mb-2">
                  <span></span> DELIVERY TRACKING
                </div>
                <h3 className="fs-5 fw-bold mb-2">Project health per delivery</h3>
                <p className="small text-muted mb-0">
                  Each project tracks live health status, milestone progress and scope-creep signals. The product
                  surfaces CPI / SPI indicators so experts can identify risk before it becomes a delay.
                </p>
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <span className="badge bg-success">Santé: 100%</span>
                  <span className="badge" style={{ background: '#f59e0b' }}>
                    Santé: 35%
                  </span>
                  <span className="badge bg-dark">Livré</span>
                  <span className="badge bg-light text-dark border">En Cours</span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="case-media p-4">
                <div className="eyebrow mb-2">
                  <span></span> FINANCIAL SIGNALS
                </div>
                <h3 className="fs-5 fw-bold mb-2">Margin &amp; billing intelligence</h3>
                <p className="small text-muted mb-0">
                  The platform continuously monitors unbilled work, overdue payments, and margin drift — and surfaces
                  AI-triggered billing actions before revenue is lost.
                </p>
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>
                    Factures en retard: 11
                  </span>
                  <span className="badge bg-success">329 384 TND pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product thinking callout */}
      <section className="case-section alt">
        <div className="container">
          <div className="case-highlight">
            <div className="eyebrow">
              <span></span> PRODUCT THINKING
            </div>
            <h2>The design shift: from "manage my projects" to "understand my business."</h2>
            <p className="case-copy">
              The interface is intentionally organized around visibility, signals, decisions and actions. The goal is to
              make the product feel like an operational layer rather than another project-management workspace.
            </p>
            <p className="case-copy mt-3">
              The four navigation layers reflect this: <strong>Voir (Visibilité)</strong> ·{' '}
              <strong>Comprendre (Signaux)</strong> · <strong>Décider (Arbitrages)</strong> ·{' '}
              <strong>Agir (Missions IA)</strong>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
