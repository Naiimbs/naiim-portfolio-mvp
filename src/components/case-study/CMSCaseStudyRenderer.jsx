import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../common/SEO';
import { getCaseStudySchema } from '../../lib/schema';
import CMSSectionRenderer from './CMSSectionRenderer';

export default function CMSCaseStudyRenderer({ caseStudy }) {
  if (!caseStudy) return null;

  const {
    title,
    subtitle,
    seo_title,
    seo_description,
    canonical_path,
    slug,
    project,
    sections = [],
  } = caseStudy;

  const effectiveSlug = slug || project?.slug || '';
  const effectiveTitle = title || project?.title || 'Case Study';
  const effectiveLead = subtitle || project?.short_description || '';
  const heroImage = caseStudy.hero_media?.public_url || null;

  const caseSchema = getCaseStudySchema({
    title: seo_title || effectiveTitle,
    description: seo_description || effectiveLead,
    slug: effectiveSlug,
    image: heroImage,
  });

  // Split out any section marked specifically as 'hero' vs other sections
  const heroSection = sections.find((s) => s.section_type === 'hero');
  const bodySections = sections.filter((s) => s.section_type !== 'hero');

  // Derive meta chips from project or hero block
  const projectRoles = project?.roles || [];
  const projectTools = project?.tools || [];
  const metaChips = [
    ...(heroSection?.blocks?.[0]?.content?.metaChips || []),
    ...projectRoles,
    ...projectTools,
    project?.year ? String(project.year) : '',
  ].filter(Boolean);

  const heroEyebrow = heroSection?.eyebrow || project?.kicker || 'CASE STUDY';

  return (
    <MainLayout>
      <SEO
        title={seo_title || effectiveTitle}
        description={seo_description || effectiveLead}
        canonical={canonical_path || `/work/${effectiveSlug}`}
        image={heroImage}
        schema={caseSchema}
      />

      {/* 1. Case Hero Header */}
      <section className="case-hero">
        <div className="container">
          <Link className="text-link" to="/#work">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>

          <div className="eyebrow mt-4">
            <span></span> {heroEyebrow}
          </div>

          <h1>{effectiveTitle}</h1>

          {effectiveLead && <p className="case-hero-lead">{effectiveLead}</p>}

          {metaChips.length > 0 && (
            <div className="case-meta">
              {metaChips.map((chip, i) => (
                <span key={i}>{chip}</span>
              ))}
            </div>
          )}

          {/* Render extra blocks in hero section if any (e.g. Hero Image) */}
          {heroSection &&
            heroSection.blocks
              ?.filter((b) => b.block_type !== 'text' && b.is_visible !== false)
              .map((b) => (
                <figure key={b.id} className="case-hero-image">
                  <img
                    src={b.content?.media_url || b.content?.url}
                    alt={b.content?.alt || effectiveTitle}
                    loading="eager"
                  />
                  {b.content?.caption && <figcaption>{b.content.caption}</figcaption>}
                </figure>
              ))}
        </div>
      </section>

      {/* 2. Body Sections */}
      {bodySections
        .filter((s) => s.is_visible !== false)
        .map((sec, idx) => (
          <CMSSectionRenderer key={sec.id} section={sec} index={idx} />
        ))}

      {/* 3. Navigation Footer */}
      <section className="case-nav">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/#work" className="text-link">
            <i className="bi bi-arrow-left"></i> Back to selected work
          </Link>
          <a href="#contact" className="text-link">
            Let&apos;s talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
