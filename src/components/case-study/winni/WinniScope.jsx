import React from 'react';

export default function WinniScope() {
  const roles = [
    {
      step: '01 · STRATEGY',
      title: 'Product Strategy',
      desc: 'Defining the relationship between the physical object and digital identity, business viability, and low-friction recovery mechanics.',
    },
    {
      step: '02 · UX ARCHITECTURE',
      title: 'UX Design',
      desc: 'Designing the scan, finder, contact, location, and return journeys, eliminating login walls and unnecessary cognitive load.',
    },
    {
      step: '03 · DIGITAL UI',
      title: 'UI Design',
      desc: 'Creating the mobile-first product experience, typography scale, responsive breakpoints, and tactile button components.',
    },
    {
      step: '04 · BRAND SYSTEM',
      title: 'Brand & Visual System',
      desc: "Extending WINNI's identity across digital and physical touchpoints with restrained typography, geometric icons, and monochrome palette.",
    },
    {
      step: '05 · PHYSICAL FORM',
      title: 'Physical Product',
      desc: 'Designing how the identity appears on vehicle stickers, tags, durable cuts, and waterproof polymer adhesives.',
    },
    {
      step: '06 · VALIDATION',
      title: 'Prototyping',
      desc: 'Exploring flows, interactions, error boundaries, and real-world mobile test cases across varied daylight and device conditions.',
    },
  ];

  return (
    <section className="winni-section" id="what-i-designed">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">12 · SCOPE OF WORK</span>
          <h2 className="winni-section-title">What I Designed</h2>
          <p className="winni-copy">
            A comprehensive look at the multidisciplinary responsibilities delivered across physical and digital
            domains.
          </p>
        </div>

        <div className="winni-roles-grid">
          {roles.map((role, idx) => (
            <div className="winni-role-card" key={idx}>
              <b>{role.step}</b>
              <h4>{role.title}</h4>
              <p>{role.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
