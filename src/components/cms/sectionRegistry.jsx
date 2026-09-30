import React from 'react';

/**
 * Section Component Registry for Site-Wide CMS.
 *
 * Supported Section Types:
 * - hero
 * - text
 * - rich_text
 * - project_grid
 * - project_list
 * - agent_grid
 * - image
 * - gallery
 * - video
 * - quote
 * - metrics
 * - timeline
 * - workflow
 * - architecture
 * - cta
 * - contact
 * - spacer
 */

// 1. Hero Section
function HeroSection({ config = {} }) {
  const { title, subtitle, kicker, ctaText, ctaHref } = config;
  return (
    <section className="cms-section cms-section-hero py-5 text-center">
      <div className="container">
        {kicker && <div className="cms-hero-kicker text-uppercase tracking-wider text-muted mb-2">{kicker}</div>}
        {title && <h1 className="cms-hero-title display-4 fw-bold mb-3">{title}</h1>}
        {subtitle && <p className="cms-hero-subtitle lead text-secondary max-w-2xl mx-auto mb-4">{subtitle}</p>}
        {ctaText && ctaHref && (
          <a href={ctaHref} className="btn btn-primary btn-lg rounded-pill px-4">
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

// 2. Text / Rich Text Section
function TextSection({ config = {} }) {
  const { title, content, alignment = 'left' } = config;
  return (
    <section className={`cms-section cms-section-text py-4 text-${alignment}`}>
      <div className="container">
        {title && <h2 className="cms-section-heading mb-3">{title}</h2>}
        {content && <div className="cms-text-content lead text-secondary">{content}</div>}
      </div>
    </section>
  );
}

// 3. Project Grid Section
function ProjectGridSection({ config = {} }) {
  const { title, subtitle, projects = [] } = config;
  return (
    <section className="cms-section cms-section-project-grid py-5">
      <div className="container">
        {title && <h2 className="mb-2 fw-bold">{title}</h2>}
        {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
        <div className="row g-4">
          {projects.length > 0 ? (
            projects.map((proj, idx) => (
              <div key={proj.id || idx} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                  {proj.image && <img src={proj.image} className="card-img-top" alt={proj.title} />}
                  <div className="card-body p-4">
                    <h5 className="card-title fw-semibold">{proj.title}</h5>
                    <p className="card-text text-muted">{proj.description}</p>
                    {proj.slug && (
                      <a href={`/work/${proj.slug}`} className="btn btn-outline-dark btn-sm rounded-pill mt-2">
                        View Project
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-muted fst-italic">No projects configured for this section.</div>
          )}
        </div>
      </div>
    </section>
  );
}

// 4. Project List Section
function ProjectListSection({ config = {} }) {
  const { title, projects = [] } = config;
  return (
    <section className="cms-section cms-section-project-list py-4">
      <div className="container">
        {title && <h2 className="mb-4 fw-bold">{title}</h2>}
        <div className="list-group list-group-flush border-top border-bottom">
          {projects.map((p, idx) => (
            <a key={p.id || idx} href={p.slug ? `/work/${p.slug}` : '#'} className="list-group-item list-group-item-action py-3 px-0 d-flex justify-content-between align-items-center border-bottom">
              <div>
                <h6 className="mb-1 fw-bold">{p.title}</h6>
                <small className="text-muted">{p.category || p.description}</small>
              </div>
              <i className="bi bi-arrow-right"></i>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// 5. Agent Grid Section
function AgentGridSection({ config = {} }) {
  const { title, agents = [] } = config;
  return (
    <section className="cms-section cms-section-agent-grid py-5">
      <div className="container">
        {title && <h2 className="mb-4 fw-bold">{title}</h2>}
        <div className="row g-4">
          {agents.map((ag, idx) => (
            <div key={ag.id || idx} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 bg-light rounded-4 p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="p-3 bg-white rounded-3 me-3 text-primary">
                    <i className="bi bi-robot fs-3"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">{ag.name}</h5>
                    <small className="text-muted">{ag.role || 'AI Agent'}</small>
                  </div>
                </div>
                <p className="card-text text-secondary small">{ag.description}</p>
                {ag.slug && (
                  <a href={`/agents/${ag.slug}`} className="btn btn-sm btn-dark rounded-pill mt-auto">
                    Inspect Agent
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 6. Image Section
function ImageSection({ config = {} }) {
  const { src, alt, caption } = config;
  if (!src) return null;
  return (
    <section className="cms-section cms-section-image py-4 text-center">
      <div className="container">
        <figure className="figure mb-0">
          <img src={src} className="figure-img img-fluid rounded-4 shadow-sm" alt={alt || ''} />
          {caption && <figcaption className="figure-caption text-center mt-2">{caption}</figcaption>}
        </figure>
      </div>
    </section>
  );
}

// 7. Gallery Section
function GallerySection({ config = {} }) {
  const { images = [] } = config;
  return (
    <section className="cms-section cms-section-gallery py-4">
      <div className="container">
        <div className="row g-3">
          {images.map((img, idx) => (
            <div key={idx} className="col-12 col-md-6 col-lg-4">
              <img src={typeof img === 'string' ? img : img.src} className="img-fluid rounded-3 shadow-sm w-100" alt={img.alt || ''} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 8. Video Section
function VideoSection({ config = {} }) {
  const { src, title } = config;
  if (!src) return null;
  return (
    <section className="cms-section cms-section-video py-4">
      <div className="container">
        <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow-sm">
          <iframe src={src} title={title || 'Video'} allowFullScreen></iframe>
        </div>
      </div>
    </section>
  );
}

// 9. Quote Section
function QuoteSection({ config = {} }) {
  const { quote, author, role } = config;
  return (
    <section className="cms-section cms-section-quote py-5 bg-light my-4">
      <div className="container text-center max-w-2xl mx-auto">
        <blockquote className="blockquote mb-3">
          <p className="fs-4 font-serif fst-italic">“{quote}”</p>
        </blockquote>
        {author && (
          <figcaption className="blockquote-footer mb-0 text-dark fw-semibold">
            {author} {role && <cite title="Source Title" className="text-muted font-normal fs-6"> — {role}</cite>}
          </figcaption>
        )}
      </div>
    </section>
  );
}

// 10. Metrics Section
function MetricsSection({ config = {} }) {
  const { metrics = [] } = config;
  return (
    <section className="cms-section cms-section-metrics py-5">
      <div className="container">
        <div className="row text-center g-4">
          {metrics.map((m, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <div className="display-4 fw-bold text-primary">{m.value}</div>
              <div className="text-muted small text-uppercase tracking-wider mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 11. Timeline Section
function TimelineSection({ config = {} }) {
  const { title, items = [] } = config;
  return (
    <section className="cms-section cms-section-timeline py-5">
      <div className="container">
        {title && <h2 className="mb-4 fw-bold">{title}</h2>}
        <div className="timeline-list border-start ps-4">
          {items.map((item, idx) => (
            <div key={idx} className="timeline-item mb-4 position-relative">
              <span className="badge bg-primary mb-1">{item.year || item.date}</span>
              <h5 className="fw-bold mb-1">{item.title}</h5>
              <p className="text-muted small mb-0">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 12. Workflow Section
function WorkflowSection({ config = {} }) {
  const { title, steps = [] } = config;
  return (
    <section className="cms-section cms-section-workflow py-5">
      <div className="container">
        {title && <h2 className="mb-4 fw-bold">{title}</h2>}
        <div className="row g-4">
          {steps.map((step, idx) => (
            <div key={idx} className="col-12 col-md-4">
              <div className="p-4 border rounded-4 h-100">
                <span className="badge bg-secondary mb-3">Step {idx + 1}</span>
                <h5 className="fw-bold">{step.title}</h5>
                <p className="text-muted small mb-0">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 13. Architecture Section
function ArchitectureSection({ config = {} }) {
  const { title, diagramUrl, description } = config;
  return (
    <section className="cms-section cms-section-architecture py-5">
      <div className="container">
        {title && <h2 className="mb-3 fw-bold">{title}</h2>}
        {description && <p className="text-muted mb-4">{description}</p>}
        {diagramUrl && <img src={diagramUrl} className="img-fluid rounded-4 shadow-sm w-100" alt={title || 'Architecture'} />}
      </div>
    </section>
  );
}

// 14. CTA Section
function CtaSection({ config = {} }) {
  const { title, text, buttonText, buttonHref } = config;
  return (
    <section className="cms-section cms-section-cta py-5 bg-dark text-white rounded-4 my-5">
      <div className="container text-center py-4">
        {title && <h2 className="display-6 fw-bold mb-3">{title}</h2>}
        {text && <p className="lead text-light opacity-75 max-w-xl mx-auto mb-4">{text}</p>}
        {buttonText && buttonHref && (
          <a href={buttonHref} className="btn btn-light btn-lg rounded-pill px-4 fw-semibold">
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

// 15. Contact Section
function ContactSection({ config = {} }) {
  const { title, email, linkedin, github } = config;
  return (
    <section className="cms-section cms-section-contact py-5">
      <div className="container text-center">
        {title && <h2 className="fw-bold mb-4">{title}</h2>}
        <div className="d-flex justify-content-center gap-3">
          {email && (
            <a href={`mailto:${email}`} className="btn btn-outline-primary rounded-pill px-4">
              <i className="bi bi-envelope me-2"></i> {email}
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer" className="btn btn-outline-dark rounded-pill px-4">
              <i className="bi bi-linkedin me-2"></i> LinkedIn
            </a>
          )}
          {github && (
            <a href={github} target="_blank" rel="noreferrer" className="btn btn-outline-dark rounded-pill px-4">
              <i className="bi bi-github me-2"></i> GitHub
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// 16. Spacer Section
function SpacerSection({ config = {} }) {
  const { height = 40 } = config;
  return <div className="cms-section-spacer" style={{ height: `${height}px` }} />;
}

// Section Registry Object
export const SECTION_REGISTRY = {
  hero: HeroSection,
  text: TextSection,
  rich_text: TextSection,
  project_grid: ProjectGridSection,
  project_list: ProjectListSection,
  agent_grid: AgentGridSection,
  image: ImageSection,
  gallery: GallerySection,
  video: VideoSection,
  quote: QuoteSection,
  metrics: MetricsSection,
  timeline: TimelineSection,
  workflow: WorkflowSection,
  architecture: ArchitectureSection,
  cta: CtaSection,
  contact: ContactSection,
  spacer: SpacerSection,
};

/**
 * Resolves a section component by its type.
 * Returns null if section_type is unknown or invalid.
 */
export function getSectionComponent(sectionType) {
  if (!sectionType) return null;
  const key = String(sectionType).toLowerCase().trim();
  return SECTION_REGISTRY[key] || null;
}
