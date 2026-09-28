import React from 'react';

export default function WinniLocation() {
  return (
    <section className="winni-section alt-bg" id="location">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">07 · LOCATION</span>
          <h2 className="winni-section-title">Location is a choice, not surveillance.</h2>
          <p className="winni-copy-lg">
            WINNI can allow the finder to share where they found the object. But WINNI is{' '}
            <strong>not a live tracking system</strong>.
          </p>
        </div>

        <div className="location-contrast-box shadow-sm mb-4">
          <div className="row g-0">
            {/* Rejected Surveillance Paradigm */}
            <div className="col-md-6 contrast-col rejected">
              <span className="contrast-tag danger">
                <i className="bi bi-x-circle-fill"></i> REJECTED PARADIGM
              </span>
              <h3 className="fs-4 fw-bold text-danger mb-3">Live Tracking / Continuous Surveillance</h3>
              <p className="winni-copy small mb-3">
                Generic tracking devices promote live GPS pings, invasive battery tracking, and surveillance beams.
                Finders feel observed; owners mistake tags for military-grade radars.
              </p>
              <div className="p-3 bg-white border rounded text-muted font-monospace small mb-3">
                <span className="text-danger fw-bold">❌ Rejected Copy:</span> "Enable continuous GPS tracking", "Object
                is being tracked by owner"
              </div>
              <ul className="case-list small text-muted">
                <li>Creates intimidation and mistrust for the finder.</li>
                <li>Falsely promises continuous telemetry on unpowered tags.</li>
                <li>Breeds surveillance anxiety instead of human solidarity.</li>
              </ul>
            </div>

            {/* Approved WINNI Paradigm */}
            <div className="col-md-6 contrast-col approved">
              <span className="contrast-tag success">
                <i className="bi bi-check-circle-fill"></i> WINNI DIRECTION
              </span>
              <h3 className="fs-4 fw-bold text-dark mb-3">One-time Contextual Sharing</h3>
              <p className="winni-copy small mb-3">
                The finder voluntarily offers a single location snapshot to assist the owner. If permissions are
                denied, the recovery flow continues without interruption.
              </p>
              <div className="p-3 bg-white border rounded text-dark font-monospace small mb-3">
                <span className="text-success fw-bold">✓ Approved Copy:</span> "Share where you found it."
              </div>
              <ul className="case-list small text-muted">
                <li>Restrained location graphic (calm radius, no pulsing beams).</li>
                <li>Failure or refusal never blocks the contact form.</li>
                <li>Communicates mutual helpfulness and voluntary civic action.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
