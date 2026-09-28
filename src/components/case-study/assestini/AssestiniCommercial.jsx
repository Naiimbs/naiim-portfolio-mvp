import React from 'react';

export default function AssestiniCommercial() {
  const steps = [
    {
      num: '01',
      title: 'Quotation',
      desc: 'Client price, tax configuration, payment terms and scope captured in a structured commercial document.',
    },
    {
      num: '02',
      title: 'Agreement',
      desc: 'Quote accepted and snapshotted. The agreed price becomes the immutable commercial reference for the project.',
    },
    {
      num: '03',
      title: 'Project Launch',
      desc: 'Accepted quote automatically generates the project structure: tasks, milestones and WBS from the estimation.',
    },
    {
      num: '04',
      title: 'Delivery Tracking',
      desc: 'Project health, margin, time tracking and operational data connected back to the original commercial scope.',
    },
  ];

  return (
    <section className="case-section alt">
      <div className="container">
        <div className="eyebrow">
          <span></span> 04 · COMMERCIAL WORKFLOW
        </div>
        <h2>From quotation to delivery.</h2>
        <p className="case-copy mb-5">
          An accepted quotation becomes the commercial reference for the entire project. The{' '}
          <strong>Accepted Quote Snapshot</strong> preserves the agreed client price, tax configuration, payment
          terms and scope — creating an immutable source of truth between estimation and delivery.
        </p>

        {/* Quote → Project sequence with process steps */}
        <div className="case-process">
          {steps.map((step, idx) => (
            <div key={idx}>
              <b>{step.num}</b>
              <strong>{step.title}</strong>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Visual relationship callout */}
        <div className="mt-4 p-4 rounded-4 border bg-white d-flex flex-wrap align-items-center justify-content-center gap-3 text-center">
          <div>
            <div className="fw-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              Quote
            </div>
            <div className="small text-muted">Commercial proposal</div>
          </div>
          <i className="bi bi-arrow-right text-success fs-5"></i>
          <div>
            <div className="fw-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              Agreement
            </div>
            <div className="small text-muted">Accepted snapshot</div>
          </div>
          <i className="bi bi-arrow-right text-success fs-5"></i>
          <div>
            <div className="fw-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              Project
            </div>
            <div className="small text-muted">Auto-generated</div>
          </div>
          <i className="bi bi-arrow-right text-success fs-5"></i>
          <div>
            <div className="fw-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              Delivery
            </div>
            <div className="small text-muted">Monitored vs. agreed scope</div>
          </div>
        </div>
      </div>
    </section>
  );
}
