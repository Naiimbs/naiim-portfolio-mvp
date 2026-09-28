import React from 'react';

const SKILLS = [
  'UX/UI',
  'Product Design',
  'AI',
  'Low-Code',
  'Design Systems',
  'Automation',
];

export default function AboutCard() {
  return (
    <div className="about-card">
      <div className="eyebrow">
        <span></span> ABOUT ME
      </div>
      <h3>
        Designing with curiosity.<br />
        Building with purpose.
      </h3>
      <p>
        I'm Naïm, a product designer and AI builder based in Tunisia. I enjoy taking ambiguous ideas,
        giving them structure, designing the experience, and turning them into something people can actually
        use.
      </p>

      <div className="skill-cloud">
        {SKILLS.map((skill, index) => (
          <span key={index}>{skill}</span>
        ))}
      </div>

      <div className="about-grid">
        <div>
          <small>LANGUAGES</small>
          <p>
            Arabic · French<br />
            English · Italian
          </p>
        </div>
        <div>
          <small>CERTIFICATIONS</small>
          <p>
            PSM I<br />
            Mendix Rapid Developer<br />
            Design — ISSAT Sousse
          </p>
        </div>
      </div>
    </div>
  );
}
