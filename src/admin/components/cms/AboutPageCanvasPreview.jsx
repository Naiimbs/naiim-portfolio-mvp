import React from 'react';

export default function AboutPageCanvasPreview({ page, activeLang = 'en', onSelectBlock }) {
  const pageTx = (activeLang !== 'en' && page?.metadata?.i18n?.[activeLang]?.about) || {};
  const defAbout = page?.metadata?.about || {};

  const eyebrow = pageTx.eyebrow || defAbout.eyebrow || 'THE JOURNEY';
  const titleLine1 = pageTx.titleLine1 || defAbout.titleLine1 || 'From making things with my hands';
  const titleLine2 = pageTx.titleLine2 || defAbout.titleLine2 || 'to building intelligent products.';
  const nowLabel = pageTx.nowLabel || defAbout.nowLabel || 'NOW';

  const defaultTimeline = [
    { title: 'Mechanical design', subtitle: '& fabrication' },
    { title: 'Industrial environments', small: 'Process & maintenance · chlorine industry' },
    { title: 'Plastic injection', small: 'Moulding & manufacturing' },
    { title: 'Digital design', subtitle: '& UX/UI' },
    { title: 'Product Design', subtitle: '& AI Product Building' },
  ];

  const timelineSteps = Array.isArray(pageTx.timeline) && pageTx.timeline.length > 0
    ? pageTx.timeline
    : Array.isArray(defAbout.timeline) && defAbout.timeline.length > 0
    ? defAbout.timeline
    : defaultTimeline;

  const cardEyebrow = pageTx.cardEyebrow || defAbout.cardEyebrow || 'ABOUT ME';
  const cardTitleLine1 = pageTx.cardTitleLine1 || defAbout.cardTitleLine1 || 'Designing with curiosity.';
  const cardTitleLine2 = pageTx.cardTitleLine2 || defAbout.cardTitleLine2 || 'Building with purpose.';
  const bio =
    pageTx.bio ||
    defAbout.bio ||
    "I'm Naïm, a product designer and AI builder based in Tunisia. I enjoy taking ambiguous ideas, giving them structure, designing the experience, and turning them into something people can actually use.";

  const skills = Array.isArray(pageTx.skills) && pageTx.skills.length > 0
    ? pageTx.skills
    : Array.isArray(defAbout.skills) && defAbout.skills.length > 0
    ? defAbout.skills
    : ['UX/UI', 'Product Design', 'AI', 'Low-Code', 'Design Systems', 'Automation'];

  const languagesLabel = pageTx.languagesLabel || defAbout.languagesLabel || 'LANGUAGES';
  const languages = pageTx.languagesLine1 || defAbout.languagesLine1 || 'Arabic · French · English · Italian';

  const certsLabel = pageTx.certificationsLabel || defAbout.certificationsLabel || 'CERTIFICATIONS';
  const certs = pageTx.certLine1 || defAbout.certLine1 || 'PSM I · Mendix Rapid Developer · Design ISSAT';

  return (
    <div className="about-canvas-preview bg-white rounded-3 p-3 p-md-4">
      {/* Editorial Guidance Strip */}
      <div className="alert alert-info border-0 rounded-4 py-2 px-3 mb-4 d-flex justify-content-between align-items-center">
        <div className="small d-flex align-items-center gap-2">
          <i className="bi bi-info-circle-fill text-info"></i>
          <span>
            <strong>Live About Page Preview:</strong> Click any section below to edit its copy or switch to the <strong>Translations</strong> tab in the right panel to translate into French & Arabic.
          </span>
        </div>
      </div>

      <div className="row g-5">
        {/* Left Column: Timeline / Journey */}
        <div
          className="col-lg-7 p-3 rounded-4 transition-all"
          style={{ cursor: 'pointer', border: '1px dashed transparent' }}
          onClick={() => onSelectBlock && onSelectBlock('journey')}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bs-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          title="Click to edit Journey & Timeline in right sidebar"
        >
          <div className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 mb-2 fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
            <span>●</span> {eyebrow}
          </div>
          <h2 className="fw-bold font-heading mb-4">
            {titleLine1}
            <br />
            {titleLine2}
          </h2>

          <div className="timeline mt-4 ps-2">
            {timelineSteps.map((step, idx) => {
              const isLast = idx === timelineSteps.length - 1;
              return (
                <div key={idx} className={`timeline-item ${isLast ? 'active' : ''} mb-3 d-flex align-items-start gap-3`}>
                  <b className="badge bg-dark rounded-pill px-2 py-1" style={{ fontSize: '0.75rem', minWidth: '42px', textAlign: 'center' }}>
                    {isLast ? nowLabel : `0${idx + 1}`}
                  </b>
                  <div>
                    <strong className="d-block text-dark">{step.title}</strong>
                    {step.subtitle && <span className="text-secondary small">{step.subtitle}</span>}
                    {step.small && <small className="d-block text-muted" style={{ fontSize: '0.75rem' }}>{step.small}</small>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: About Card */}
        <div
          className="col-lg-5 p-3 rounded-4 transition-all"
          style={{ cursor: 'pointer', border: '1px dashed transparent' }}
          onClick={() => onSelectBlock && onSelectBlock('card')}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bs-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          title="Click to edit About Card, Bio & Skills in right sidebar"
        >
          <div className="about-card p-4 rounded-4 bg-light border shadow-sm">
            <div className="eyebrow mb-2">
              <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2 py-1 text-uppercase" style={{ fontSize: '0.7rem' }}>
                {cardEyebrow}
              </span>
            </div>
            <h4 className="fw-bold font-heading mb-3">
              {cardTitleLine1}
              <br />
              {cardTitleLine2}
            </h4>
            <p className="text-secondary small mb-4">{bio}</p>

            <div className="skill-cloud d-flex flex-wrap gap-1 mb-4">
              {skills.map((skill, i) => (
                <span key={i} className="badge bg-white text-dark border px-2 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
                  {skill}
                </span>
              ))}
            </div>

            <div className="border-top pt-3">
              <div className="mb-2">
                <small className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.68rem' }}>{languagesLabel}</small>
                <span className="small text-dark">{languages}</span>
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: '0.68rem' }}>{certsLabel}</small>
                <span className="small text-dark">{certs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
