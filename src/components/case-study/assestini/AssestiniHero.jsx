import React from 'react';
import { Link } from 'react-router-dom';
import homeAssestiniImg from '../../../assets/images/home-assestini.png';

export default function AssestiniHero() {
  const metadata = [
    'Own product / startup',
    'Product Owner · UX/UI Designer · Builder',
    'React · TypeScript · Supabase · Gemini',
  ];

  return (
    <section className="case-hero">
      <div className="container">
        <Link className="text-link" to="/#work">
          <i className="bi bi-arrow-left"></i> Back to selected work
        </Link>

        <div className="eyebrow mt-4">
          <span></span> PRODUCT DESIGN · AI PRODUCT · UX/UI · PRODUCT STRATEGY
        </div>
        <h1>Assestini</h1>
        <p className="case-hero-lead">
          AI-powered Operational Intelligence Platform for freelancers, consultants and service businesses.<br />
          <strong>From idea to payment — in one connected workflow.</strong>
        </p>

        <div className="case-meta">
          {metadata.map((item, idx) => (
            <span key={idx}>{item}</span>
          ))}
        </div>

        {/* Hero image */}
        <figure className="case-hero-image">
          <img
            src={homeAssestiniImg}
            alt="Assestini operational dashboard showing Vision Opérationnelle with project delivery pipeline and business KPIs"
            loading="eager"
          />
        </figure>
      </div>
    </section>
  );
}
