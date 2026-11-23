import React from 'react';

export default function WinniMotion({ content = {} }) {
  return (
    <section className="winni-section alt-bg" id="motion">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">{content.eyebrow || '11 · MOTION'}</span>
          <h2 className="winni-section-title">{content.title || 'Motion should reassure, not entertain.'}</h2>
          <p className="winni-copy-lg">
            {content.lead || 'Motion is intentionally restrained because the product needs to communicate confidence and continuity rather than entertainment.'}
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
              <h4 className="fw-bold fs-6">{content.scanTitle || '01 · Scan Recognized'}</h4>
              <p className="text-muted small">
                {content.scanDescription || 'Subtle confirmation ring confirms successful tag reading without harsh flashes.'}
              </p>
              <div className="motion-timing-pill">{content.scanTiming || '120–180ms · micro feedback'}</div>
            </div>
          </div>

          {/* State 2 */}
          <div className="col-md-4">
            <div className="motion-card">
              <div className="motion-preview-stage">
                <div className="msg-sent-badge">
                  <i className="bi bi-check2"></i> {content.messagePreview || 'Transmis au propriétaire'}
                </div>
              </div>
              <h4 className="fw-bold fs-6">{content.messageTitle || '02 · Message Sent'}</h4>
              <p className="text-muted small">
                {content.messageDescription || 'Stable success state locks into place, ensuring finder knows the owner was reached.'}
              </p>
              <div className="motion-timing-pill">{content.messageTiming || '180–260ms · standard transition'}</div>
            </div>
          </div>

          {/* State 3 */}
          <div className="col-md-4">
            <div className="motion-card">
              <div className="motion-preview-stage">
                <div className="d-flex flex-column align-items-center">
                  <div className="badge bg-white text-success border px-3 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-house-door-fill me-1"></i> {content.returnedPreview || 'Objet Rentré'}
                  </div>
                </div>
              </div>
              <h4 className="fw-bold fs-6">{content.returnedTitle || '03 · Returned'}</h4>
              <p className="text-muted small">
                {content.returnedDescription || 'Calm completion state closing the ticket and archiving communication gracefully.'}
              </p>
              <div className="motion-timing-pill">{content.returnedTiming || '260–420ms · meaningful transition'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
