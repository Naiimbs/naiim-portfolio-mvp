import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';

export default function StandardCaseStudy({ data }) {
  const { hero, challenge, contribution, evidence, technology } = data;

  return (
    <MainLayout>
      {/* 1. Hero */}
      <section className="case-hero">
        <div className="container">
          <Link className="text-link" to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <div className="eyebrow mt-4">
            <span></span> {hero.eyebrow}
          </div>
          <h1>{hero.title}</h1>
          <p className="case-hero-lead">{hero.lead}</p>
          <div className="case-meta">
            {hero.metaChips.map((chip, i) => (
              <span key={i}>{chip}</span>
            ))}
          </div>
          {hero.image && (
            <figure className="case-hero-image">
              <img src={hero.image} alt={hero.imageAlt || hero.title} />
              {hero.caption && <figcaption>{hero.caption}</figcaption>}
            </figure>
          )}
        </div>
      </section>

      {/* 2. Challenge */}
      <section className="case-section">
        <div className="container case-grid">
          <div>
            <div className="eyebrow">
              <span></span> {challenge.eyebrow}
            </div>
            <h2>{challenge.title}</h2>
            <p className="case-copy">{challenge.copy}</p>
          </div>
          <aside className="case-role">
            <small>MY ROLE</small>
            <strong>{challenge.role}</strong>
            <small className="d-block mt-4">CONTEXT</small>
            <strong>{challenge.context}</strong>
          </aside>
        </div>
      </section>

      {/* 3. Contribution & Process */}
      <section className="case-section alt">
        <div className="container">
          <div className="eyebrow">
            <span></span> {contribution.eyebrow}
          </div>
          <h2>{contribution.title}</h2>
          <ul className="case-list row row-cols-1 row-cols-md-2 g-0">
            {contribution.items.map((item, index) => (
              <li className="col" key={index}>
                {item}
              </li>
            ))}
          </ul>
          {contribution.process && (
            <div className="case-process">
              {contribution.process.map((p, idx) => (
                <div key={idx}>
                  <b>{p.step}</b>
                  <strong>{p.title}</strong>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Selected Evidence & Tech Stack */}
      <section className="case-section">
        <div className="container">
          <div className="eyebrow">
            <span></span> {evidence.eyebrow}
          </div>
          <h2>{evidence.title}</h2>
          {evidence.image && (
            <figure className="case-hero-image">
              <img src={evidence.image} alt={evidence.imageAlt || evidence.title} />
              {evidence.caption && <figcaption>{evidence.caption}</figcaption>}
            </figure>
          )}

          {technology && (
            <div className="mt-5">
              <div className="eyebrow">
                <span></span> {technology.eyebrow}
              </div>
              {technology.title && <h2>{technology.title}</h2>}
              <div className="tech-row">
                {technology.tags.map((tag, i) => (
                  <span key={i}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Navigation */}
      <section className="case-nav">
        <div className="container d-flex justify-content-between">
          <Link to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <a href="#contact">
            Let's talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
