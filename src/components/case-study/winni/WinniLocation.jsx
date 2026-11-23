import React from 'react';
import { parseCaseStudyArray } from '../../../utils/caseStudyContent';

export default function WinniLocation({ content = {} }) {
  const rejectedPoints = parseCaseStudyArray(content.rejectedPointsJson, [
    'Creates intimidation and mistrust for the finder.',
    'Falsely promises continuous telemetry on unpowered tags.',
    'Breeds surveillance anxiety instead of human solidarity.',
  ]).filter((item) => typeof item === 'string');
  const approvedPoints = parseCaseStudyArray(content.approvedPointsJson, [
    'Restrained location graphic (calm radius, no pulsing beams).',
    'Failure or refusal never blocks the contact form.',
    'Communicates mutual helpfulness and voluntary civic action.',
  ]).filter((item) => typeof item === 'string');
  return (
    <section className="winni-section alt-bg" id="location">
      <div className="container">
        <div className="winni-section-header">
          <span className="winni-section-num">{content.eyebrow || '07 · LOCATION'}</span>
          <h2 className="winni-section-title">{content.title || 'Location is a choice, not surveillance.'}</h2>
          <p className="winni-copy-lg">
            {content.lead || 'WINNI can allow the finder to share where they found the object. But WINNI is not a live tracking system.'}
          </p>
        </div>

        <div className="location-contrast-box shadow-sm mb-4">
          <div className="row g-0">
            {/* Rejected Surveillance Paradigm */}
            <div className="col-md-6 contrast-col rejected">
              <span className="contrast-tag danger">
                <i className="bi bi-x-circle-fill"></i> {content.rejectedTag || 'REJECTED PARADIGM'}
              </span>
              <h3 className="fs-4 fw-bold text-danger mb-3">{content.rejectedTitle || 'Live Tracking / Continuous Surveillance'}</h3>
              <p className="winni-copy small mb-3">
                {content.rejectedDescription || 'Generic tracking devices promote live GPS pings, invasive battery tracking, and surveillance beams. Finders feel observed; owners mistake tags for military-grade radars.'}
              </p>
              <div className="p-3 bg-white border rounded text-muted font-monospace small mb-3">
                <span className="text-danger fw-bold">{content.rejectedQuoteLabel || '❌ Rejected Copy:'}</span> {content.rejectedQuote || '"Enable continuous GPS tracking", "Object is being tracked by owner"'}
              </div>
              <ul className="case-list small text-muted">
                {rejectedPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>

            {/* Approved WINNI Paradigm */}
            <div className="col-md-6 contrast-col approved">
              <span className="contrast-tag success">
                <i className="bi bi-check-circle-fill"></i> {content.approvedTag || 'WINNI DIRECTION'}
              </span>
              <h3 className="fs-4 fw-bold text-dark mb-3">{content.approvedTitle || 'One-time Contextual Sharing'}</h3>
              <p className="winni-copy small mb-3">
                {content.approvedDescription || 'The finder voluntarily offers a single location snapshot to assist the owner. If permissions are denied, the recovery flow continues without interruption.'}
              </p>
              <div className="p-3 bg-white border rounded text-dark font-monospace small mb-3">
                <span className="text-success fw-bold">{content.approvedQuoteLabel || '✓ Approved Copy:'}</span> {content.approvedQuote || '"Share where you found it."'}
              </div>
              <ul className="case-list small text-muted">
                {approvedPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
