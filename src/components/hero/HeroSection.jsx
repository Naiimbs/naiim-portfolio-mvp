import React from 'react';
import VoicePlayer from './VoicePlayer';
import portraitCutout from '../../assets/images/naim-portrait.png';

export default function HeroSection() {
  return (
    <section className="hero section-pad">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 hero-copy">
            <div className="eyebrow">
              <span></span> SENIOR UX/UI DESIGNER · AI PRODUCT BUILDER
            </div>

            <h1>
              I DESIGN.<br />
              I BUILD.<br />
              <em>I EXPERIMENT.</em>
            </h1>

            <p className="hero-lead">
              I turn ambiguous problems into usable digital products at the intersection of{' '}
              <strong>product design, AI, low-code and automation.</strong>
            </p>

            <div className="d-flex flex-wrap gap-3 mb-4">
              <a className="btn btn-primary-custom btn-lg rounded-pill px-4" href="#work">
                Explore my work <i className="bi bi-arrow-right"></i>
              </a>
              <a className="btn btn-outline-custom btn-lg rounded-pill px-4" href="#copilot">
                <i className="bi bi-stars"></i> Talk to Naïm Copilot
              </a>
            </div>

            <div className="building-label">CURRENTLY BUILDING</div>
            <div className="building-list">
              <a href="#work">
                <span className="mini-icon winni">W</span> WINNI
              </a>
              <a href="#copilot">
                <span className="mini-icon copilot">✦</span> Naïm Copilot
              </a>
              <a href="#work">
                <span className="mini-icon assestini">A</span> Assestini{' '}
                <small>Product / Operations OS</small>
              </a>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-visual">
              <div className="hero-photo-wrap">
                <img src={portraitCutout} alt="Naïm Bsili" className="hero-photo" />
              </div>
              <div className="hero-note">
                Design<br />
                Technology<br />
                <strong>Impact</strong>
              </div>

              <VoicePlayer />

              <div className="listen-note" aria-label="Listen to Naïm introduction">
                <svg
                  viewBox="0 0 190 100"
                  role="img"
                  aria-label="Curved hand-drawn arrow pointing to the audio player"
                >
                  <path
                    d="M10 72 C62 95, 96 90, 122 63 C141 43, 151 25, 166 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M155 17 L168 20 L160 31"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Listen to me</span>
              </div>

              <div className="shape shape-one"></div>
              <div className="shape shape-two"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
