import React from 'react';

export default function WinniOutcome() {
  const steps = [
    {
      num: '01',
      title: 'Physical product concept',
      desc: 'Material specifications, tag placement, and durability requirements.',
    },
    {
      num: '02',
      title: 'Digital identity model',
      desc: 'Unique alphanumeric IDs, masked proxy channels, and route structures.',
    },
    {
      num: '03',
      title: 'Finder experience',
      desc: 'Zero-login mobile scan flow with optional geolocation sharing.',
    },
    {
      num: '04',
      title: 'Owner experience',
      desc: 'Object setup, notification receiving, and resolution confirmation.',
    },
    {
      num: '05',
      title: 'Physical + digital visual system',
      desc: 'Quiet technology branding across packaging, stickers, and software.',
    },
    {
      num: '06',
      title: 'Product prototype / MVP',
      desc: 'Functional prototype tested with actual physical sticker attachments.',
    },
  ];

  return (
    <>
      {/* 13. THE DESIGN PRINCIPLE */}
      <section className="winni-editorial-quote" id="principle">
        <div className="container">
          <div className="winni-quote-mark">“</div>
          <div className="winni-quote-text">Technology should disappear into the experience.</div>
          <p className="winni-quote-sub">
            WINNI isn't about QR codes. It isn't about tracking. It isn't about dashboards.<br />
            It's about creating a simple connection between: <strong>a person → an object → its owner.</strong>
          </p>
        </div>
      </section>

      {/* 14. OUTCOME */}
      <section className="winni-section" id="outcome">
        <div className="container">
          <div className="winni-section-header">
            <span className="winni-section-num">14 · OUTCOME</span>
            <h2 className="winni-section-title">From concept to working product.</h2>
            <p className="winni-copy">
              Rather than relying on unverified vanity percentages, the milestone progression documents concrete system
              deliverables:
            </p>
          </div>

          <div className="row g-3">
            {steps.map((step, idx) => (
              <div className="col-md-4 col-sm-6" key={idx}>
                <div className="outcome-step-card">
                  <div className="step-no">{step.num}</div>
                  <strong>{step.title}</strong>
                  <p className="text-muted small mt-1 mb-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="outcome-status-callout">
            <div className="pulse-dot"></div>
            <div>
              <div className="fw-bold text-dark">Current Product Status</div>
              <div className="text-muted small">
                WINNI is currently evolving from product concept into a real-world product system.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
