import React from 'react';
import { Link } from 'react-router-dom';

export default function AssestiniTechCta() {
  const techTags = [
    'Figma',
    'UX/UI',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'Gemini',
    'Google AI Studio',
    'RAG',
    'AI Agents',
    'MCP',
    'Design Systems',
  ];

  return (
    <>
      {/* TECHNOLOGY */}
      <section className="case-section">
        <div className="container">
          <div className="eyebrow">
            <span></span> TECHNOLOGY &amp; PROCESS
          </div>
          <h2>Tools and technologies</h2>
          <div className="tech-row">
            {techTags.map((tech, idx) => (
              <span key={idx}>{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CASE NAV */}
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
    </>
  );
}
