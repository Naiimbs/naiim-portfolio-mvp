import React, { useState, useEffect } from 'react';
import portraitPhoto from '../../assets/images/naim-portrait.jpg';

const TARGET_TAGS = [
  'Senior Product Designer',
  'Lead Product Designer',
  'AI Product Designer',
  'Design Systems',
  'Remote',
];

export default function CareerCard() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <>
      <div className="feature-card career-card h-100">
        <div className="feature-head">
          <div className="feature-icon dark">
            <i className="bi bi-briefcase"></i>
          </div>
          <div>
            <div className="feature-kicker">CAREER SEARCH</div>
            <h2>What's next?</h2>
            <p>Explore the kind of opportunities I'm targeting.</p>
          </div>
        </div>

        <div className="career-profile">
          <img src={portraitPhoto} alt="Naïm Bsili" />
          <div>
            <strong>Naïm Bsili</strong>
            <span>Product Designer & AI Builder</span>
            <small>Open to KSA · UAE · Europe · Remote</small>
          </div>
        </div>

        <div className="career-list">
          <div>
            <i className="bi bi-bullseye"></i>
            <span>Target</span>
            <strong>Senior / Lead Product Designer</strong>
          </div>
          <div>
            <i className="bi bi-geo-alt"></i>
            <span>Markets</span>
            <strong>KSA · UAE · Europe · Remote</strong>
          </div>
          <div>
            <i className="bi bi-layers"></i>
            <span>Focus</span>
            <strong>Product · UX/UI · AI · Digital Products</strong>
          </div>
        </div>

        <button
          className="btn btn-primary-custom rounded-pill w-100"
          id="careerButton"
          type="button"
          onClick={() => setShowToast(true)}
        >
          Explore opportunities <i className="bi bi-arrow-right"></i>
        </button>

        <div className="looking-for">
          <small>WHAT I'M LOOKING FOR</small>
          <div className="tag-row">
            {TARGET_TAGS.map((tag, idx) => (
              <span key={idx}>{tag}</span>
            ))}
          </div>
        </div>

        <a href="#contact" className="download-cv">
          <i className="bi bi-download"></i> Download CV
        </a>
      </div>

      {showToast && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div id="careerToast" className="toast show border-0 shadow" role="alert">
            <div className="toast-header">
              <i className="bi bi-stars me-2"></i>
              <strong className="me-auto">Career Search</strong>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowToast(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-body">
              This is the MVP UI. The real n8n job-search workflow can be connected here later.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
