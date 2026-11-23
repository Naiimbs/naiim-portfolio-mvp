import React from 'react';
import { parseCaseStudyArray } from '../../../utils/caseStudyContent';

export default function AssestiniChallenge({ content = {} }) {
  const workflowSteps = parseCaseStudyArray(content.workflowLabelsJson, [
    'Estimate', 'Define', 'Quote', 'Launch', 'Deliver', 'Monitor',
  ]).filter((label) => typeof label === 'string');

  return (
    <section className="case-section">
      <div className="container case-grid">
        <div>
          <div className="eyebrow">
            <span></span> {content.eyebrow || '01 · THE CHALLENGE'}
          </div>
          <h2>{content.title || 'Project work starts fragmented. It stays fragmented.'}</h2>
          <p className="case-copy">
            {content.lead || 'Project work often starts with an unstructured request and quickly becomes distributed across disconnected tools: a spreadsheet for estimation, a PDF for quotation, a Trello board for tasks, a separate invoicing app for billing.'}
          </p>
          <p className="case-copy mt-3">
            {content.paragraph2 || 'The challenge was to design a product that could connect these moments into one coherent workflow — from understanding the initial request through structured estimation, commercial quotation, project launch, delivery monitoring, and operational control.'}
          </p>

          {/* Workflow flow */}
          <div className="workflow-row mt-4">
            {workflowSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <span className={`workflow-pill ${idx === 0 ? 'active' : ''}`}>{step}</span>
                {idx < workflowSteps.length - 1 && <span className="workflow-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <aside className="case-role">
          <small>{content.roleLabel || 'MY ROLE'}</small>
          <strong>{content.roleValue || 'Product Owner · UX/UI Designer · Builder'}</strong>
          <small className="d-block mt-4">{content.focusLabel || 'FOCUS'}</small>
          <strong>{content.focusValue || 'Product Design · AI · UX/UI · Product Strategy · Operational Intelligence'}</strong>
          <small className="d-block mt-4">{content.technologyLabel || 'TECHNOLOGY'}</small>
          <strong>{content.technologyValue || 'React · TypeScript · Supabase · Gemini'}</strong>
          <small className="d-block mt-4">{content.typeLabel || 'TYPE'}</small>
          <strong>{content.typeValue || 'Own product / startup'}</strong>
        </aside>
      </div>
    </section>
  );
}
