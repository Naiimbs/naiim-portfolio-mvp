import React from 'react';

export default function WinniChallenge() {
  const traits = [
    {
      title: 'Fast',
      desc: 'Instant scan under 2 seconds',
    },
    {
      title: 'Clear',
      desc: 'Zero ambiguity on next step',
    },
    {
      title: 'Private',
      desc: 'No data leaks or owner info',
    },
    {
      title: 'Reassuring',
      desc: 'Calm tone, positive intent',
    },
  ];

  return (
    <section className="winni-section" id="challenge">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="winni-section-num">04 · PRODUCT CHALLENGE</span>
            <h2 className="winni-section-title">Designing the moment between a stranger and an owner.</h2>
            <p className="winni-copy">
              The most important UX challenge wasn't building another complex management dashboard. It was designing the{' '}
              <strong>finder experience</strong>.
            </p>
            <p className="winni-copy">
              When someone spots an object with a WINNI tag, the context is unpredictable:
            </p>
            <ul className="case-list">
              <li>
                They <strong>don't know WINNI</strong> and have never heard of it.
              </li>
              <li>
                They <strong>don't have an account</strong> and will abandon if forced to sign up.
              </li>
              <li>
                They <strong>may be in a hurry</strong> on the street, in a parking lot, or at an airport terminal.
              </li>
              <li>
                They <strong>need to trust the interface</strong> immediately without fear of malware or phishing.
              </li>
              <li>
                They <strong>should not see the owner's private information</strong> (no phone numbers or email exposed).
              </li>
              <li>
                They <strong>may optionally share where the object was found</strong> without feeling surveilled.
              </li>
            </ul>
          </div>

          <div className="col-lg-6">
            <div className="p-4 p-md-5 bg-white rounded-4 border shadow-sm">
              <h3 className="fs-4 fw-bold mb-2">The Experience Imperative</h3>
              <p className="text-muted small mb-4">
                Every screen in the finder journey must strictly honor four core pillars:
              </p>

              <div className="winni-finder-traits winni-screens-row">
                {traits.map((trait, idx) => (
                  <div className="winni-trait-pill" key={idx}>
                    <strong>{trait.title}</strong>
                    <span>{trait.desc}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-top text-muted small">
                <i className="bi bi-shield-check text-success me-2"></i> No login wall, no mandatory GPS, no
                advertising, no tracking cookies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
