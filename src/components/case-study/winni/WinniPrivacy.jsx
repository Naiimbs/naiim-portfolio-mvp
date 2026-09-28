import React from 'react';

export default function WinniPrivacy() {
  return (
    <section className="winni-section" id="privacy">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">06 · PRIVACY BY DESIGN</span>
          <h2 className="winni-section-title">Helping without exposing.</h2>
          <p className="winni-copy-lg">
            WINNI doesn't need to reveal the owner's phone number or personal identity to the finder. The entire
            interaction happens mediated safely through the product.
          </p>
        </div>

        <div className="row align-items-center g-5">
          <div className="col-lg-5">
            <p className="winni-copy">
              In traditional lost-and-found situations, leaving a phone number or address on luggage or vehicle
              dashboards presents serious security and harassment risks.
            </p>
            <p className="winni-copy">
              With WINNI, the finder only interacts with a secure, ephemeral proxy. Both parties remain completely
              anonymous while enabling full operational communication.
            </p>
            <div className="p-4 rounded-3 border bg-light mt-4">
              <strong className="d-block mb-1 text-dark">Why this matters in product design:</strong>
              <p className="small text-muted mb-0">
                This demonstrates <strong>product thinking</strong> over plain UI design: solving human trust boundaries
                before laying down visual pixels.
              </p>
            </div>
          </div>

          <div className="col-lg-7">
            {/* Privacy Diagram */}
            <div className="winni-privacy-board">
              <div className="row align-items-center g-3 text-center">
                {/* Finder */}
                <div className="col-md-3">
                  <div className="privacy-node">
                    <div className="node-icon">
                      <i className="bi bi-person-circle"></i>
                    </div>
                    <h4>FINDER</h4>
                    <div className="node-subtitle">Scans physical tag with camera</div>
                    <span className="badge bg-light text-muted border mt-2">Zero Account</span>
                  </div>
                </div>

                {/* Flow arrow */}
                <div className="col-md-1 d-none d-md-block text-muted">
                  <i className="bi bi-arrow-right fs-4"></i>
                </div>

                {/* WINNI Proxy Core */}
                <div className="col-md-4">
                  <div className="privacy-node active-proxy">
                    <div className="node-icon text-success">
                      <i className="bi bi-shield-lock-fill"></i>
                    </div>
                    <h4>WINNI</h4>
                    <div className="node-subtitle text-light">Secure Communication Proxy</div>
                    <div className="small mt-2 text-warning" style={{ fontSize: '0.7rem' }}>
                      🔒 Personal data encrypted &amp; masked
                    </div>
                  </div>
                </div>

                {/* Flow arrow */}
                <div className="col-md-1 d-none d-md-block text-muted">
                  <i className="bi bi-arrow-right fs-4"></i>
                </div>

                {/* Owner */}
                <div className="col-md-3">
                  <div className="privacy-node">
                    <div className="node-icon">
                      <i className="bi bi-person-check-fill text-success"></i>
                    </div>
                    <h4>OWNER</h4>
                    <div className="node-subtitle">Receives push/SMS alert instantly</div>
                    <span className="badge bg-light text-success border mt-2">100% Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
