import React from 'react';

const STRIP_STEPS = [
  { strong: 'Problem', span: 'What needed to change?' },
  { strong: 'Role', span: 'What I owned.' },
  { strong: 'Approach', span: 'How I framed the solution.' },
  { strong: 'Build', span: 'How design met technology.' },
];

export default function CaseStudiesStrip() {
  return (
    <section className="section-pad pt-5 pb-4" id="case-studies">
      <div className="container">
        <div className="section-heading mb-4">
          <div className="eyebrow">
            <span></span> CASE STUDIES
          </div>
          <h2>How I solve product problems</h2>
          <p>
            Each story focuses on the problem, my role, the design decisions and the technology used to turn the idea
            into something usable.
          </p>
        </div>
        <div className="case-strip">
          {STRIP_STEPS.map((step, index) => (
            <div key={index}>
              <strong>{step.strong}</strong>
              <span>{step.span}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
