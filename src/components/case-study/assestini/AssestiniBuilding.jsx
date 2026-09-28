import React from 'react';
import decisionAgentImg from '../../../assets/images/décision-assistace-agent.png';

export default function AssestiniBuilding() {
  const layers = [
    {
      label: 'PRODUCT',
      tags: ['Vision', 'Strategy', 'Features'],
      desc: 'Defining what the product needs to do and for whom — before designing a single screen.',
    },
    {
      label: 'UX',
      tags: ['Information Architecture', 'Workflows', 'Operational UX'],
      desc: 'Designing the end-to-end flow from estimation to payment as one connected experience.',
    },
    {
      label: 'AI',
      tags: ['Estimation Engine', 'Agents', 'MCP'],
      desc: 'Embedding Gemini as a structural product layer, not a chatbot sidebar.',
    },
    {
      label: 'SYSTEMS',
      tags: ['Permissions', 'Commercial Workflow', 'Operational Data'],
      desc: 'Designing the authorization model, plan controls, quote snapshots and audit trail.',
    },
    {
      label: 'BUILD',
      tags: ['React', 'TypeScript', 'Supabase', 'AI Integration'],
      desc: 'Building the product directly — from design system to working application.',
    },
  ];

  const principleBadges = [
    'I can design the interface.',
    'I can understand the workflow.',
    'I can shape the product.',
    'I can work with AI.',
    'I can build the system behind it.',
  ];

  return (
    <>
      {/* 07 · PRODUCT BUILDING — 5 LAYERS */}
      <section className="case-section alt">
        <div className="container">
          <div className="eyebrow">
            <span></span> 07 · PRODUCT BUILDING
          </div>
          <h2>Beyond the interface.</h2>
          <p className="case-copy mb-5">
            Assestini reflects how I work as a product designer and builder. I move between product strategy, UX, AI
            architecture and implementation — designing not only what the user sees, but also the workflows and systems
            behind the experience.
          </p>

          <div className="layer-stack">
            {layers.map((layer, idx) => (
              <div className="layer-item" key={idx}>
                <div className="layer-label">{layer.label}</div>
                <div className="layer-content">
                  {layer.tags.map((tag, tIdx) => (
                    <span className="layer-tag" key={tIdx}>
                      {tag}
                    </span>
                  ))}
                  <span className="text-muted small ms-2">{layer.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL QUOTE */}
      <section className="case-section">
        <div className="container">
          <div className="case-callout">
            <div className="eyebrow light">
              <span></span> THE PRINCIPLE
            </div>
            <h2>The work behind the product.</h2>
            <p>I don't only design interfaces. I design the system behind them.</p>
            <p className="mt-3">
              Assestini is an ongoing product-building case exploring how AI, UX and operational workflows can come
              together to create a more connected way of running project-based businesses.
            </p>
            <div className="d-flex flex-wrap gap-3 mt-4">
              {principleBadges.map((badge, idx) => (
                <span
                  className="badge bg-white text-dark rounded-pill px-3 py-2"
                  style={{ fontSize: '0.78rem' }}
                  key={idx}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING VISUAL */}
      <section className="case-section alt">
        <div className="container">
          <div className="eyebrow">
            <span></span> PRODUCT EVIDENCE
          </div>
          <h2>Turning operational data into a decision surface.</h2>
          <p className="case-copy mb-4">
            The Business Control Center was designed as a single operational layer — replacing the fragmented dashboards,
            spreadsheets and inboxes that most consultants rely on today.
          </p>
          <figure className="case-media">
            <img
              src={decisionAgentImg}
              alt="Assestini Business Control Center — full operational intelligence view with health monitoring, delivery tracking and financial signals"
              loading="lazy"
            />
          </figure>
        </div>
      </section>
    </>
  );
}
