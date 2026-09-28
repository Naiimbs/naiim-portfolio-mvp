import React from 'react';
import { Link } from 'react-router-dom';

export default function WinniCTA() {
  return (
    <section className="container pb-5" id="cta">
      <div className="winni-cta-banner">
        <span className="badge bg-white text-dark rounded-pill px-3 py-2 mb-3 font-monospace small">WINNI</span>
        <h2>Give your things a way back.</h2>
        <p>Physical objects. Digital identity. One simple connection.</p>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <a href="/#contact" className="winni-cta-btn">
            Let's talk about product design <i className="bi bi-arrow-up-right"></i>
          </a>
          <Link to="/#work" className="btn btn-outline-light rounded-pill px-4 py-3">
            <i className="bi bi-arrow-left me-1"></i> Back to all work
          </Link>
        </div>
      </div>

      {/* Case study pagination */}
      <div className="case-nav d-flex justify-content-between pt-3">
        <Link to="/#work">
          <i className="bi bi-arrow-left"></i> Back to selected work
        </Link>
        <a href="/#contact">
          Get in touch <i className="bi bi-arrow-up-right"></i>
        </a>
      </div>
    </section>
  );
}
