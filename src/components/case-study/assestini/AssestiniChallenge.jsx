import React from 'react';

export default function AssestiniChallenge() {
  const workflowSteps = [
    { label: 'Estimate', active: true },
    { label: 'Define', active: false },
    { label: 'Quote', active: false },
    { label: 'Launch', active: false },
    { label: 'Deliver', active: false },
    { label: 'Monitor', active: false },
  ];

  return (
    <section className="case-section">
      <div className="container case-grid">
        <div>
          <div className="eyebrow">
            <span></span> 01 · THE CHALLENGE
          </div>
          <h2>Project work starts fragmented. It stays fragmented.</h2>
          <p className="case-copy">
            Project work often starts with an unstructured request and quickly becomes distributed across disconnected
            tools: a spreadsheet for estimation, a PDF for quotation, a Trello board for tasks, a separate invoicing app
            for billing.
          </p>
          <p className="case-copy mt-3">
            The challenge was to design a product that could connect these moments into one coherent workflow — from
            understanding the initial request through structured estimation, commercial quotation, project launch,
            delivery monitoring, and operational control.
          </p>

          {/* Workflow flow */}
          <div className="workflow-row mt-4">
            {workflowSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <span className={`workflow-pill ${step.active ? 'active' : ''}`}>{step.label}</span>
                {idx < workflowSteps.length - 1 && <span className="workflow-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <aside className="case-role">
          <small>MY ROLE</small>
          <strong>Product Owner · UX/UI Designer · Builder</strong>
          <small className="d-block mt-4">FOCUS</small>
          <strong>Product Design · AI · UX/UI · Product Strategy · Operational Intelligence</strong>
          <small className="d-block mt-4">TECHNOLOGY</small>
          <strong>React · TypeScript · Supabase · Gemini</strong>
          <small className="d-block mt-4">TYPE</small>
          <strong>Own product / startup</strong>
        </aside>
      </div>
    </section>
  );
}
