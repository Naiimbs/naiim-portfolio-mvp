import React from 'react';

export default function WinniMotion() {
  return (
    <section className="winni-section alt-bg" id="motion">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">11 · MOTION</span>
          <h2 className="winni-section-title">Motion should reassure, not entertain.</h2>
          <p className="winni-copy-lg">
            Motion is intentionally restrained because the product needs to communicate confidence and continuity
            rather than entertainment.
          </p>
        </div>

        <div className="row g-4">
          {/* State 1 */}
          <div className="col-md-4">
            <div className="motion-card">
              <div className="motion-preview-stage">
                <div className="d-flex align-items-center justify-content-center">
                  <div className="scan-pulse-ring"></div>
                  <i className="bi bi-qr-code text-dark position-absolute fs-4"></i>
                </div>
              </div>
              <h4 className="fw-bold fs-6">01 · Scan Recognized</h4>
              <p className="text-muted small">
                Subtle confirmation ring confirms successful tag reading without harsh flashes.
              </p>
              <div className="motion-timing-pill">120–180ms · micro feedback</div>
            </div>
          </div>

          {/* State 2 */}
          <div className="col-md-4">
            <div className="motion-card">
              <div className="motion-preview-stage">
                <div className="msg-sent-badge">
                  <i className="bi bi-check2"></i> Transmis au propriétaire
                </div>
              </div>
              <h4 className="fw-bold fs-6">02 · Message Sent</h4>
              <p className="text-muted small">
                Stable success state locks into place, ensuring finder knows the owner was reached.
              </p>
              <div className="motion-timing-pill">180–260ms · standard transition</div>
            </div>
          </div>

          {/* State 3 */}
          <div className="col-md-4">
            <div className="motion-card">
              <div className="motion-preview-stage">
                <div className="d-flex flex-column align-items-center">
                  <div className="badge bg-white text-success border px-3 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-house-door-fill me-1"></i> Objet Rentré
                  </div>
                </div>
              </div>
              <h4 className="fw-bold fs-6">03 · Returned</h4>
              <p className="text-muted small">
                Calm completion state closing the ticket and archiving communication gracefully.
              </p>
              <div className="motion-timing-pill">260–420ms · meaningful transition</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
