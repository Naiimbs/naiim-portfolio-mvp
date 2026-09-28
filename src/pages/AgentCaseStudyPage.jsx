import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import CMSSectionRenderer from '../components/case-study/CMSSectionRenderer';
import { getPublishedAgentBySlug } from '../services/agents';
import { siteConfig } from '../config/site';
import '../styles/agents.css';

export default function AgentCaseStudyPage() {
  const { slug } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function loadAgent() {
      setLoading(true);
      const res = await getPublishedAgentBySlug(slug);
      setAgent(res.data);
      setLoading(false);
    }
    loadAgent();
  }, [slug]);

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex align-items-center justify-content-center min-vh-100">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading Agent Case Study...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!agent) {
    return (
      <MainLayout>
        <div className="container text-center py-5 my-5">
          <div className="eyebrow text-danger mb-2"><span></span> 404 — NOT FOUND</div>
          <h2>AI Agent Not Found</h2>
          <p className="text-muted">The requested AI agent case study could not be located.</p>
          <Link to="/agents" className="btn btn-dark rounded-pill px-4 mt-3">
            <i className="bi bi-arrow-left"></i> Back to AI Agents
          </Link>
        </div>
      </MainLayout>
    );
  }

  const {
    name,
    short_description,
    tools = [],
    role,
    year,
    workflow_platform,
    sections = [],
    hero_image,
    thumbnail,
    thumbnail_media,
    hero_media,
    demo_type = 'none',
    demo_url,
    github_url,
    seo_title,
    seo_description,
    canonical_path,
  } = agent;

  const resolvedHeroImage = hero_media?.public_url || thumbnail_media?.public_url || hero_image || thumbnail;

  const agentSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name,
    description: short_description,
    applicationCategory: 'WorkflowAutomation',
    operatingSystem: 'Cross-platform',
    url: `${siteConfig.url}/agents/${slug}`,
    author: {
      '@type': 'Person',
      name: siteConfig.name,
    },
  };

  const heroSection = sections.find((s) => s.section_type === 'hero');
  const bodySections = sections.filter((s) => s.section_type !== 'hero');

  const metaChips = [
    ...(heroSection?.blocks?.[0]?.content?.metaChips || []),
    role,
    workflow_platform ? `Platform: ${workflow_platform}` : '',
    year ? String(year) : '',
  ].filter(Boolean);

  const heroEyebrow = heroSection?.eyebrow || 'AI AGENT CASE STUDY';

  return (
    <MainLayout>
      <SEO
        title={seo_title || `${name} — AI Agent`}
        description={seo_description || short_description}
        canonical={canonical_path || `/agents/${slug}`}
        image={resolvedHeroImage}
        schema={agentSchema}
      />

      {/* 1. Hero Section */}
      <section className="case-hero">
        <div className="container">
          <Link className="text-link" to="/agents">
            <i className="bi bi-arrow-left"></i> Back to AI Agents
          </Link>

          <div className="eyebrow mt-4">
            <span></span> {heroEyebrow}
          </div>

          <h1>{name}</h1>

          {short_description && <p className="case-hero-lead">{short_description}</p>}

          {metaChips.length > 0 && (
            <div className="case-meta">
              {metaChips.map((chip, i) => (
                <span key={i}>{chip}</span>
              ))}
            </div>
          )}

          {/* Render extra blocks in hero section if any (e.g. Hero Diagram) */}
          {heroSection &&
            heroSection.blocks
              ?.filter((b) => b.block_type !== 'text' && b.is_visible !== false)
              .map((b) => (
                <figure key={b.id} className="case-hero-image">
                  <img
                    src={b.content?.media_url || b.content?.url}
                    alt={b.content?.alt || name}
                    loading="eager"
                  />
                  {b.content?.caption && <figcaption>{b.content.caption}</figcaption>}
                </figure>
              ))}

          {/* Direct CTA Row if Demo / GitHub exists */}
          {(demo_type !== 'none' && (demo_url || slug)) || github_url ? (
            <div className="d-flex flex-wrap gap-3 mt-4">
              {demo_type !== 'none' && (
                <Link to={`/agents/${slug}/demo`} className="btn btn-success rounded-pill px-4">
                  <i className="bi bi-lightning-charge-fill me-1"></i> Try Interactive Demo
                </Link>
              )}

              {github_url && (
                <a
                  href={github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark rounded-pill px-4"
                >
                  <i className="bi bi-github me-1"></i> View Repository
                </a>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* 2. Body Sections (Challenge, Workflow, Demo, Technology, etc.) */}
      {bodySections
        .filter((s) => s.is_visible !== false)
        .map((sec, idx) => (
          <CMSSectionRenderer key={sec.id} section={sec} index={idx} />
        ))}

      {/* 3. Navigation Footer */}
      <section className="case-nav">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/agents" className="text-link">
            <i className="bi bi-arrow-left"></i> Back to AI Agents
          </Link>
          <a href="#contact" className="text-link">
            Build an Agent <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
