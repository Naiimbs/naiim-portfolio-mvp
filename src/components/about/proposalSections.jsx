import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import portraitCutout from '../../assets/images/naim-portrait.webp';

// -----------------------------------------------------------------------------
// 1. About · Hero
// -----------------------------------------------------------------------------
export function AboutHeroSection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || config.heroEyebrow || t('about.heroEyebrow', 'PRODUCT DESIGNER · AI BUILDER');
  const headline = config.headline || config.heroHeadline || t('about.heroHeadline', 'I DESIGN. I BUILD. I EXPERIMENT.');
  const lead = config.lead || config.heroLead || t('about.heroLead', 'I turn complex problems into usable digital products through product design, AI, low-code, and automation.');
  const exploreCta = config.exploreCta || { label: t('about.exploreWork', 'Explore My Work'), href: '/work' };
  const talkCta = config.talkCta || { label: t('about.letsTalk', "Let's Talk"), href: '/about#contact' };
  const buildingNote = config.buildingNote || 'WINNI Identity Ecosystem · Naïm Copilot · AI Agent Protocols';

  return (
    <section className="about-hero-section section-pad pt-4 pb-5 border-bottom">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-7">
            <div className="eyebrow mb-3">
              <span></span> {eyebrow}
            </div>
            <h1 className="display-4 fw-bold font-heading mb-4 text-dark" style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {headline.split('.').filter(Boolean).map((part, i) => (
                <React.Fragment key={i}>
                  {i === 2 ? (
                    <em className="font-serif text-primary" style={{ fontStyle: 'italic' }}>
                      {part.trim()}.
                    </em>
                  ) : (
                    <span>{part.trim()}.</span>
                  )}
                  <br />
                </React.Fragment>
              ))}
            </h1>
            <p className="lead text-secondary mb-4" style={{ maxWidth: '580px', fontSize: '1.2rem', lineHeight: 1.6 }}>
              {lead}
            </p>

            <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
              <a href={exploreCta.href || '/work'} className="btn btn-dark rounded-pill px-4 py-2 fw-semibold">
                {exploreCta.label || 'Explore My Work'} <i className="bi bi-arrow-right ms-1"></i>
              </a>
              <a href={talkCta.href || '/about#contact'} className="btn btn-outline-dark rounded-pill px-4 py-2 fw-semibold">
                <i className="bi bi-envelope me-1"></i> {talkCta.label || "Let's Talk"}
              </a>
            </div>

            <div className="card border-0 bg-light rounded-4 p-3 d-inline-flex flex-row align-items-center gap-3">
              <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 fw-bold" style={{ fontSize: '0.72rem' }}>
                <span className="spinner-grow spinner-grow-sm me-1 text-success" style={{ width: '8px', height: '8px' }} />
                CURRENTLY BUILDING
              </span>
              <span className="small text-dark fw-semibold">
                {buildingNote}
              </span>
            </div>
          </div>

          <div className="col-lg-5 text-center">
            <div className="position-relative d-inline-block">
              <div className="rounded-4 overflow-hidden shadow-lg border bg-white" style={{ maxWidth: '380px', margin: '0 auto' }}>
                <img
                  src={config.portraitUrl || portraitCutout || '/naim-portrait.jpg'}
                  alt="Naïm Bsili Portrait"
                  className="img-fluid"
                  style={{ objectFit: 'cover', maxHeight: '440px', width: '100%' }}
                />
                <div className="p-3 bg-white text-start border-top">
                  <strong className="d-block text-dark fw-bold">Naïm Bsili</strong>
                  <small className="text-muted">Product Designer · Low-Code & AI Builder</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 2. About · My Journey
// -----------------------------------------------------------------------------
export function AboutJourneySection({ config = {} }) {
  const { t } = useTranslation();
  const [activeStage, setActiveStage] = useState(4);

  const eyebrow = config.eyebrow || t('about.journeyEyebrow', 'SIGNATURE EVOLUTION');
  const title = config.title || t('about.journeyTitle', 'From Mechanical Design to AI');
  const subtitle = config.subtitle || t('about.journeySubtitle', 'A visual progression connecting physical engineering, visual craft, human-centered UX, low-code delivery, and autonomous AI systems.');

  const defaultStages = [
    {
      id: 'mechanical',
      number: '01',
      period: 'Foundations',
      title: t('about.stages.1.title', 'Mechanical Design & Fabrication'),
      tag: t('about.stages.1.tag', 'Physical Engineering'),
      icon: 'bi-gear-wide-connected',
      explanation: t('about.stages.1.exp', 'Learning how physical things are designed, manufactured, and refined under real-world constraints; developing a rigorous, practical approach to problem-solving.'),
      lesson: t('about.stages.1.lesson', 'Physical constraints teach you that every millimeter matters before production begins.'),
    },
    {
      id: 'graphic',
      number: '02',
      period: 'Visual Craft',
      title: t('about.stages.2.title', 'Graphic & Visual Design'),
      tag: t('about.stages.2.tag', 'Visual Communication'),
      icon: 'bi-palette',
      explanation: t('about.stages.2.exp', 'Turning concepts into visual communication and developing a sharp intuition for typography, layout hierarchy, contrast, and visual clarity.'),
      lesson: t('about.stages.2.lesson', 'Clarity is kindness; design begins with how information is perceived and understood.'),
    },
    {
      id: 'uxui',
      number: '03',
      period: 'Digital Systems',
      title: t('about.stages.3.title', 'UX/UI & Product Design'),
      tag: t('about.stages.3.tag', 'Human-Centered Design'),
      icon: 'bi-window-stack',
      explanation: t('about.stages.3.exp', 'Understanding human mental models, mapping user journeys, and structuring cohesive, accessible digital experiences across web and mobile platforms.'),
      lesson: t('about.stages.3.lesson', 'The best interface is the one that removes friction between the human and their goal.'),
    },
    {
      id: 'lowcode',
      number: '04',
      period: 'Production Delivery',
      title: t('about.stages.4.title', 'Low-Code & Implementation'),
      tag: t('about.stages.4.tag', 'Mendix & OutSystems'),
      icon: 'bi-code-square',
      explanation: t('about.stages.4.exp', 'Connecting design decisions directly to production application behavior, data structures, and APIs—bridging the gap between design vision and engineered reality.'),
      lesson: t('about.stages.4.lesson', 'A design is only as strong as what actually ships and survives production.'),
    },
    {
      id: 'ai',
      number: '05',
      period: 'Current Frontier',
      title: t('about.stages.5.title', 'AI Product Building & Automation'),
      tag: t('about.stages.5.tag', 'Agents & Orchestration'),
      icon: 'bi-stars',
      explanation: t('about.stages.5.exp', 'Experimenting with agentic workflows, Model Context Protocol (MCP), API automations, and LLM orchestration to build connected, intelligent digital systems.'),
      lesson: t('about.stages.5.lesson', 'AI expands the leverage of one builder, but human discernment defines the taste and quality.'),
    },
  ];

  const stages = Array.isArray(config.stages) && config.stages.length > 0 ? config.stages : defaultStages;

  return (
    <section className="about-journey-section section-pad py-5 border-bottom bg-light bg-opacity-50" id="journey">
      <div className="container">
        <div className="text-center max-w-700 mx-auto mb-5">
          <div className="eyebrow justify-content-center mb-2">
            <span></span> {eyebrow}
          </div>
          <h2 className="display-6 fw-bold text-dark mb-3">{title}</h2>
          <p className="text-secondary" style={{ fontSize: '1.05rem' }}>{subtitle}</p>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
          {stages.map((stg, idx) => (
            <button
              key={stg.id || idx}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-2 transition-all ${
                activeStage === idx
                  ? 'btn-dark text-white fw-bold shadow-sm'
                  : 'btn-outline-secondary bg-white text-dark border'
              }`}
              onClick={() => setActiveStage(idx)}
              style={{ fontSize: '0.85rem' }}
            >
              <span className="me-2 text-muted fw-bold">{stg.number}</span>
              {stg.title}
            </button>
          ))}
        </div>

        {stages[activeStage] && (
          <div className="card border-0 rounded-4 shadow-sm bg-white p-4 p-md-5 mx-auto transition-all" style={{ maxWidth: '880px' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 fw-bold">
                STAGE {stages[activeStage].number} · {stages[activeStage].period}
              </span>
              <span className="badge bg-light text-dark border rounded-pill px-3 py-1 fw-semibold">
                <i className={`bi ${stages[activeStage].icon || 'bi-stars'} me-1 text-primary`} />
                {stages[activeStage].tag}
              </span>
            </div>

            <h3 className="fw-bold font-heading mb-3 text-dark">{stages[activeStage].title}</h3>
            <p className="text-secondary mb-4" style={{ fontSize: '1.1rem', lineHeight: 1.65 }}>
              {stages[activeStage].explanation}
            </p>

            <div className="p-3 rounded-3 bg-light border-start border-primary border-4">
              <small className="text-uppercase fw-bold text-primary d-block mb-1" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-lightbulb-fill me-1" /> Key Lesson Learned
              </small>
              <div className="text-dark fst-italic fw-medium" style={{ fontSize: '0.95rem' }}>
                "{stages[activeStage].lesson}"
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. About · How I Think
// -----------------------------------------------------------------------------
export function AboutPhilosophySection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || t('about.philosophyEyebrow', 'HOW I THINK');
  const title = config.title || t('about.philosophyTitle', 'Principles over trends.');
  const intro = config.intro || t('about.philosophyIntro', 'Tools evolve every month, but how you approach problems remains your true craft. Here is how I think before touching any tool.');
  const signature = config.signatureStatement || '"I think. I design. I experiment."';

  const defaultPrinciples = [
    {
      number: '01',
      title: t('about.principles.1.title', 'Understand before designing'),
      body: t('about.principles.1.body', 'Deconstruct the real problem and its operational context before deciding what to build. Avoid rushing to solutions before framing the root necessity.'),
      icon: 'bi-search',
    },
    {
      number: '02',
      title: t('about.principles.2.title', 'Design with implementation in mind'),
      body: t('about.principles.2.body', 'A design should account for real technical constraints, performance bottlenecks, and state transitions so that usability is preserved in production.'),
      icon: 'bi-cpu',
    },
    {
      number: '03',
      title: t('about.principles.3.title', 'Experiment to learn'),
      body: t('about.principles.3.body', 'Test assumptions through rapid functional prototypes, measure real behavior, and iterate relentlessly rather than assuming the first idea is optimal.'),
      icon: 'bi-lightning-charge',
    },
  ];

  const principles = Array.isArray(config.principles) && config.principles.length > 0 ? config.principles : defaultPrinciples;

  return (
    <section className="about-philosophy-section section-pad py-5 border-bottom">
      <div className="container">
        <div className="row g-5 align-items-center mb-5">
          <div className="col-lg-5">
            <div className="eyebrow mb-2">
              <span></span> {eyebrow}
            </div>
            <h2 className="display-6 fw-bold text-dark mb-3">{title}</h2>
            <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{intro}</p>
          </div>

          <div className="col-lg-7">
            <div className="d-flex flex-column gap-3">
              {principles.map((pr, idx) => (
                <div key={idx} className="card border-0 bg-light rounded-4 p-4 transition-all">
                  <div className="d-flex align-items-start gap-3">
                    <div className="rounded-circle bg-white shadow-xs p-2 d-flex align-items-center justify-content-center text-primary" style={{ width: '44px', height: '44px', minWidth: '44px' }}>
                      <i className={`bi ${pr.icon || 'bi-check2'} fs-5`} />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill" style={{ fontSize: '0.68rem' }}>
                          {pr.number || `0${idx + 1}`}
                        </span>
                        <h5 className="fw-bold mb-0 text-dark">{pr.title}</h5>
                      </div>
                      <p className="text-secondary mb-0 small" style={{ lineHeight: 1.6 }}>{pr.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card border-0 rounded-4 p-4 p-md-5 text-center text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <span className="badge bg-white bg-opacity-10 text-white rounded-pill px-3 py-1 mb-3 mx-auto" style={{ fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            SIGNATURE STATEMENT
          </span>
          <div className="display-5 fw-bold font-serif mb-2" style={{ letterSpacing: '0.05em' }}>
            {signature}
          </div>
          <p className="text-white text-opacity-75 small mb-0">
            The continuous feedback loop behind every meaningful digital product.
          </p>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 4. About · What I Do
// -----------------------------------------------------------------------------
export function AboutExpertiseSection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || t('about.expertiseEyebrow', 'AREAS OF EXPERTISE');
  const title = config.title || t('about.expertiseTitle', 'What I Bring to Products');
  const subtitle = config.subtitle || 'Structured capability groups reflecting proven hands-on delivery.';

  const defaultClusters = [
    {
      title: t('about.expertise.1.title', 'Product & UX/UI Design'),
      desc: t('about.expertise.1.desc', 'Designing systems and human experiences from initial discovery to validated components.'),
      icon: 'bi-bezier2',
      skills: ['User Research & Discovery', 'Interaction & Flow Design', 'Wireframing & Prototyping', 'Design Systems & Tokens', 'Accessibility (WCAG)'],
    },
    {
      title: t('about.expertise.2.title', 'Low-Code Product Delivery'),
      desc: t('about.expertise.2.desc', 'Delivering enterprise apps with robust logic, data models, and clean UI.'),
      icon: 'bi-layers',
      skills: ['Mendix Rapid Engineering', 'OutSystems Platforms', 'Design-to-Code Translation', 'API & Integration Logic', 'Production Quality QA'],
    },
    {
      title: t('about.expertise.3.title', 'AI Product Building & Automation'),
      desc: t('about.expertise.3.desc', 'Building connected workflows and autonomous agentic interfaces.'),
      icon: 'bi-robot',
      skills: ['n8n & Make Automation', 'Model Context Protocol (MCP)', 'Agentic Workflow Systems', 'Prompt Engineering', 'Custom Tool Integration'],
    },
  ];

  const clusters = Array.isArray(config.clusters) && config.clusters.length > 0 ? config.clusters : defaultClusters;

  return (
    <section className="about-expertise-section section-pad py-5 border-bottom bg-light bg-opacity-50">
      <div className="container">
        <div className="text-center max-w-700 mx-auto mb-5">
          <div className="eyebrow justify-content-center mb-2">
            <span></span> {eyebrow}
          </div>
          <h2 className="display-6 fw-bold text-dark mb-3">{title}</h2>
          <p className="text-secondary" style={{ fontSize: '1.05rem' }}>{subtitle}</p>
        </div>

        <div className="row g-4">
          {clusters.map((cluster, idx) => (
            <div key={idx} className="col-lg-4">
              <div className="card h-100 border-0 rounded-4 bg-white p-4 shadow-xs d-flex flex-column">
                <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3 mb-3 d-inline-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className={`bi ${cluster.icon || 'bi-check-circle'} fs-4`} />
                </div>
                <h4 className="fw-bold text-dark mb-2">{cluster.title}</h4>
                <p className="text-secondary small mb-4">{cluster.desc}</p>

                <div className="mt-auto">
                  <div className="d-flex flex-column gap-2">
                    {(cluster.skills || []).map((sk, sIdx) => (
                      <div key={sIdx} className="d-flex align-items-center text-dark small">
                        <i className="bi bi-check2 text-primary me-2 fw-bold" />
                        <span>{sk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 5. About · Selected Work
// -----------------------------------------------------------------------------
export function AboutProofSection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || t('about.proofEyebrow', 'PROOF, NOT CLAIMS');
  const title = config.title || t('about.proofTitle', 'Selected Work & Artifacts');

  const defaultProjects = [
    {
      title: 'WINNI',
      badge: t('about.projects.1.badge', 'Concept & Physical Identity'),
      desc: t('about.projects.1.desc', 'A QR/NFC physical-to-digital lost-item recovery identity requiring zero finder accounts while keeping owner private.'),
      role: t('about.projects.1.role', 'Product Concept · Physical Form Factor · End-to-End Flow'),
      link: '/work',
    },
    {
      title: 'Naïm Copilot',
      badge: t('about.projects.2.badge', 'AI Assistant & Lab'),
      desc: t('about.projects.2.desc', 'An autonomous conversational assistant and portfolio intelligence system built to answer questions and demonstrate live AI orchestration.'),
      role: t('about.projects.2.role', 'Agent Architecture · Prompt Design · Frontend UI'),
      link: '/#copilot',
    },
    {
      title: 'Enterprise Product Design',
      badge: t('about.projects.3.badge', 'Professional Client Work'),
      desc: t('about.projects.3.desc', 'Enterprise-grade banking and government digital services designed under strict compliance, confidentiality, and scalability standards.'),
      role: t('about.projects.3.role', 'UX/UI Architecture · Component Library · Multi-Platform Guidelines'),
      link: '/work',
    },
    {
      title: 'AI & Automation Lab',
      badge: t('about.projects.4.badge', 'Automation Experiment'),
      desc: t('about.projects.4.desc', 'Real automation pipelines connecting LLMs, webhooks, and operations with proven, repeatable business outcomes.'),
      role: t('about.projects.4.role', 'Integration Architecture · n8n Pipelines · Outcome Verification'),
      link: '/#lab',
    },
  ];

  const projects = Array.isArray(config.projects) && config.projects.length > 0 ? config.projects : defaultProjects;

  return (
    <section className="about-work-section section-pad py-5 border-bottom">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-end mb-5">
          <div>
            <div className="eyebrow mb-2">
              <span></span> {eyebrow}
            </div>
            <h2 className="display-6 fw-bold text-dark mb-1">{title}</h2>
          </div>
          <a href="/work" className="btn btn-outline-dark rounded-pill px-4 btn-sm fw-semibold mt-3 mt-md-0">
            View All Work <i className="bi bi-arrow-right ms-1"></i>
          </a>
        </div>

        <div className="row g-4">
          {projects.map((p, idx) => (
            <div key={idx} className="col-md-6">
              <div className="card h-100 border-0 bg-light rounded-4 p-4 transition-all">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold mb-0 text-dark">{p.title}</h4>
                  <span className="badge bg-white text-secondary border rounded-pill px-3 py-1" style={{ fontSize: '0.72rem' }}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-secondary small mb-3" style={{ lineHeight: 1.6 }}>{p.desc}</p>
                <div className="mt-auto pt-3 border-top">
                  <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem' }}>
                    <strong>Role:</strong> {p.role}
                  </small>
                  <a href={p.link || '/work'} className="btn btn-sm btn-link p-0 text-dark fw-bold text-decoration-none">
                    Explore Details <i className="bi bi-arrow-right ms-1"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. About · Beyond the Portfolio
// -----------------------------------------------------------------------------
export function AboutShareSection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || t('about.shareEyebrow', 'KNOWLEDGE SHARING');
  const title = config.title || t('about.shareTitle', 'Beyond the Portfolio');
  const hours = config.hours || '1,200+';
  const learners = config.learners || '300+';
  const articles = config.articles || '20+';

  return (
    <section className="about-beyond-portfolio section-pad py-5 border-bottom bg-light bg-opacity-50">
      <div className="container">
        <div className="text-center max-w-700 mx-auto mb-5">
          <div className="eyebrow justify-content-center mb-2">
            <span></span> {eyebrow}
          </div>
          <h2 className="display-6 fw-bold text-dark mb-3">{title}</h2>
          <p className="text-secondary" style={{ fontSize: '1.05rem' }}>
            Documenting learning, writing articles, and conducting hands-on training.
          </p>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 bg-white rounded-4 p-4 text-center shadow-xs">
              <div className="display-5 fw-bold text-dark font-heading mb-1">{hours}</div>
              <div className="small text-secondary fw-semibold">Training & Mentorship Hours</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 bg-white rounded-4 p-4 text-center shadow-xs">
              <div className="display-5 fw-bold text-dark font-heading mb-1">{learners}</div>
              <div className="small text-secondary fw-semibold">Design & Low-Code Learners Guided</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 bg-white rounded-4 p-4 text-center shadow-xs">
              <div className="display-5 fw-bold text-dark font-heading mb-1">{articles}</div>
              <div className="small text-secondary fw-semibold">Published Articles & Experiments</div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-center gap-3">
          <a href="/blog" className="btn btn-dark rounded-pill px-4 btn-sm fw-semibold">
            <i className="bi bi-journal-text me-1" /> Read Blog Articles
          </a>
          <a href="/#lab" className="btn btn-outline-dark rounded-pill px-4 btn-sm fw-semibold">
            <i className="bi bi-beaker me-1" /> Explore the Lab
          </a>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. About · Currently Building
// -----------------------------------------------------------------------------
export function AboutBuildingSection({ config = {} }) {
  const title = config.title || 'WINNI Identity & Autonomous Agent Protocols';
  const stage = config.stage || 'ACTIVE DEVELOPMENT';
  const description = config.description || 'Refining the physical-to-digital QR/NFC recovery flow and experimenting with autonomous agent orchestration via Model Context Protocol (MCP) to make physical objects interact with intelligent workflows.';
  const link = config.link || '/#lab';

  return (
    <section className="about-building-section section-pad py-5 border-bottom">
      <div className="container">
        <div className="card border-0 rounded-4 bg-light p-4 p-md-5">
          <div className="row align-items-center g-4">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="spinner-grow spinner-grow-sm text-success" />
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.72rem' }}>
                  {stage}
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-2">{title}</h3>
              <p className="text-secondary mb-0 small" style={{ lineHeight: 1.6 }}>{description}</p>
            </div>
            <div className="col-md-4 text-md-end">
              <a href={link} className="btn btn-outline-dark rounded-pill px-4 py-2 fw-semibold btn-sm">
                Track in the Lab <i className="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 8. About · Beyond Work
// -----------------------------------------------------------------------------
export function AboutHumanSection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || t('about.humanEyebrow', 'THE PERSON BEHIND');
  const title = config.title || t('about.humanTitle', 'Curiosity as the continuous thread.');
  const story = config.story || 'Behind every design system and agentic workflow is a deep curiosity about how things work. Whether dismantling a mechanical mechanism, observing how people handle friction in everyday tasks, or writing automation logic, the common thread is transforming ideas into something tangible and useful.';

  return (
    <section className="about-human-section section-pad py-5 border-bottom bg-light bg-opacity-50">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <div className="eyebrow mb-2">
              <span></span> {eyebrow}
            </div>
            <h2 className="display-6 fw-bold text-dark mb-3">{title}</h2>
            <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>{story}</p>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <span className="badge bg-white text-dark border rounded-pill px-3 py-2 fw-semibold">
                <i className="bi bi-translate me-1 text-primary" /> Arabic · French · English · Italian
              </span>
              <span className="badge bg-white text-dark border rounded-pill px-3 py-2 fw-semibold">
                <i className="bi bi-patch-check me-1 text-primary" /> PSM I Scrum Master
              </span>
              <span className="badge bg-white text-dark border rounded-pill px-3 py-2 fw-semibold">
                <i className="bi bi-mortarboard me-1 text-primary" /> Design ISSAT
              </span>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 bg-white rounded-4 p-4 p-md-5 shadow-xs">
              <h5 className="fw-bold text-dark mb-3">A few core beliefs:</h5>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0 text-secondary small" style={{ lineHeight: 1.6 }}>
                <li className="d-flex align-items-start gap-2">
                  <i className="bi bi-check-circle-fill text-success fs-6 mt-1" />
                  <span><strong>Simplicity requires hard work:</strong> Removing unnecessary noise is more demanding than adding more features.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="bi bi-check-circle-fill text-success fs-6 mt-1" />
                  <span><strong>Prototyping beats arguing:</strong> A tangible, working prototype answers design questions faster than hours of meetings.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="bi bi-check-circle-fill text-success fs-6 mt-1" />
                  <span><strong>Shared knowledge compounds:</strong> Teaching and writing forces clarity and keeps your own knowledge rigorous.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 9. About · Closing CTA
// -----------------------------------------------------------------------------
export function AboutClosingSection({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow || 'GET IN TOUCH';
  const title = config.title || t('about.closingTitle', "Let's Build Something Meaningful");
  const description = config.description || t('about.closingDesc', "I'm interested in meaningful product challenges where design, technology, and AI come together. Whether you are building an ambitious system or exploring workflow automation, let's talk.");
  const exploreLabel = config.exploreLabel || t('about.exploreWork', 'Explore My Work');
  const email = config.email || 'contact@naiimbsili.com';

  return (
    <section className="about-closing-section section-pad py-5 text-white" id="contact" style={{ background: '#082931' }}>
      <div className="container py-4 text-center max-w-700 mx-auto">
        <div className="badge bg-white bg-opacity-10 text-white rounded-pill px-3 py-1 mb-3" style={{ fontSize: '0.72rem' }}>
          {eyebrow}
        </div>
        <h2 className="display-5 fw-bold font-heading mb-3 text-white">{title}</h2>
        <p className="lead text-white text-opacity-75 mb-4" style={{ fontSize: '1.15rem', lineHeight: 1.6 }}>
          {description}
        </p>

        <div className="d-flex flex-wrap gap-3 justify-content-center">
          <a href="/work" className="btn btn-light rounded-pill px-4 py-2 fw-semibold">
            <i className="bi bi-collection me-1" /> {exploreLabel}
          </a>
          <a href={`mailto:${email}`} className="btn btn-outline-light rounded-pill px-4 py-2 fw-semibold">
            <i className="bi bi-envelope me-1" /> {email}
          </a>
        </div>
      </div>
    </section>
  );
}
