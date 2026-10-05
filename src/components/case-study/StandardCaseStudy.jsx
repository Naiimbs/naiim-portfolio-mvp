import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../common/SEO';
import { getCaseStudySchema } from '../../lib/schema';

export default function StandardCaseStudy({ data }) {
  const { slug, hero = {}, challenge = {}, contribution = {}, evidence = {}, technology = {} } = data;

  const caseSchema = getCaseStudySchema({
    title: hero.title,
    description: hero.lead,
    slug: slug,
    image: hero.image,
  });

  const renderChallenge = () => {
    if (!challenge || challenge.is_visible === false) return null;
    return (
      <section className="case-section" key="challenge">
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
    );
  };

  const renderContribution = () => {
    if (!contribution || contribution.is_visible === false) return null;
    return (
      <section className="case-section alt" key="contribution">
        <div className="container">
          <div className="eyebrow">
            <span></span> {contribution.eyebrow}
          </div>
          <h2>{contribution.title}</h2>
          {Array.isArray(contribution.items) && contribution.items.length > 0 && (
            <ul className="case-list row row-cols-1 row-cols-md-2 g-0">
              {contribution.items.map((item, index) => (
                <li className="col" key={index}>
                  {item}
                </li>
              ))}
            </ul>
          )}
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
    );
  };

  const renderEvidence = () => {
    if (!evidence || evidence.is_visible === false) return null;
    return (
      <section className="case-section" key="evidence">
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
          {Array.isArray(evidence.gallery) && evidence.gallery.length > 0 && (
            <div className="row g-4 mt-2">
              {evidence.gallery.map((item, idx) => (
                <div className="col-12 col-md-6" key={idx}>
                  <figure className="case-hero-image mb-0">
                    <img src={item.image} alt={item.imageAlt || item.caption || evidence.title} />
                    {item.caption && <figcaption>{item.caption}</figcaption>}
                  </figure>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderTechnology = () => {
    if (!technology || technology.is_visible === false) return null;
    return (
      <section className="case-section" key="technology">
        <div className="container">
          <div className="eyebrow">
            <span></span> {technology.eyebrow}
          </div>
          {technology.title && <h2>{technology.title}</h2>}
          {Array.isArray(technology.tags) && technology.tags.length > 0 && (
            <div className="tech-row">
              {technology.tags.map((tag, i) => (
                <span key={i}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const defaultOrder = ['challenge', 'contribution', 'evidence', 'technology'];
  const activeOrder = Array.isArray(data.sectionOrder)
    ? data.sectionOrder.filter((k) => k !== 'hero')
    : defaultOrder;

  const sectionRenderers = {
    challenge: renderChallenge,
    contribution: renderContribution,
    evidence: renderEvidence,
    technology: renderTechnology,
  };

  return (
    <MainLayout>
      <SEO
        title={hero.title}
        description={hero.lead}
        canonical={`/work/${slug}`}
        image={hero.image}
        schema={caseSchema}
      />

      {/* 1. Hero */}
      {hero.is_visible !== false && (
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
            {Array.isArray(hero.metaChips) && hero.metaChips.length > 0 && (
              <div className="case-meta">
                {hero.metaChips.map((chip, i) => (
                  <span key={i}>{chip}</span>
                ))}
              </div>
            )}
            {hero.image && (
              <figure className="case-hero-image">
                <img src={hero.image} alt={hero.imageAlt || hero.title} />
                {hero.caption && <figcaption>{hero.caption}</figcaption>}
              </figure>
            )}
          </div>
        </section>
      )}

      {/* Ordered Middle Semantic Sections */}
      {activeOrder.map((sectionKey) => {
        const renderFn = sectionRenderers[sectionKey];
        return renderFn ? renderFn() : null;
      })}

      {/* Navigation */}
      <section className="case-nav">
        <div className="container d-flex justify-content-between">
          <Link to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <a href="/#contact">
            Let's talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
