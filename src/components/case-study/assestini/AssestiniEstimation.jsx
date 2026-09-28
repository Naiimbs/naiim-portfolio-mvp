import React from 'react';

export default function AssestiniEstimation() {
  const highlights = ['WBS Generation', 'Effort Calibration', 'Budget Mapping', 'TJM Estimation'];

  const outputs = [
    'Work Breakdown Structure',
    'Estimated effort per task',
    'Project delivery structure',
    'TJM budget calculation',
    '→ Ready for quotation',
  ];

  return (
    <section className="case-section">
      <div className="container">
        <div className="eyebrow">
          <span></span> 03 · AI ESTIMATION
        </div>
        <h2>From project information to an executable plan.</h2>
        <p className="case-copy mb-5">
          The AI Estimator Pro can work from documents, text input or URLs — transforming raw project information into
          structured estimation outputs. The experience uses Gemini to make estimation part of the product workflow
          rather than a separate AI experiment.
        </p>

        {/* AI sequence: Input → AI → Structured Output */}
        <div className="ai-sequence mb-4">
          {/* Input */}
          <div className="ai-seq-card">
            <div className="ai-seq-label">INPUT</div>
            <strong style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1rem', display: 'block', marginBottom: '8px' }}>
              Project Information
            </strong>
            <p className="small text-muted mb-3">Text description, PDF document, or project URL.</p>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-2 border rounded p-2 bg-light">
                <i className="bi bi-file-earmark-text text-muted"></i>
                <span className="small">Cahier des charges.pdf</span>
              </div>
              <div className="d-flex align-items-center gap-2 border rounded p-2 bg-light">
                <i className="bi bi-link text-muted"></i>
                <span className="small">Brief URL / description</span>
              </div>
              <div
                className="d-flex align-items-center gap-2 border rounded p-2"
                style={{ background: '#e7f3ef', borderColor: '#b5d9cf !important' }}
              >
                <i className="bi bi-pencil text-success"></i>
                <span className="small text-success fw-bold">Free-text request</span>
              </div>
            </div>
          </div>

          <div className="ai-seq-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>

          {/* AI Processing */}
          <div className="ai-seq-card highlight">
            <div className="ai-seq-label">AI PROCESSING · GEMINI</div>
            <strong
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: '1rem',
                display: 'block',
                color: '#fff',
                marginBottom: '8px',
              }}
            >
              Estimator IA Pro
            </strong>
            <p style={{ fontSize: '0.84rem' }} className="mb-3">
              Analyzes scope, decomposes work, maps structure and calibrates budget.
            </p>
            <div className="d-flex flex-wrap gap-2">
              {highlights.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50px',
                    padding: '3px 10px',
                    fontSize: '0.7rem',
                    color: '#d0e8e4',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="ai-seq-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>

          {/* Output */}
          <div className="ai-seq-card">
            <div className="ai-seq-label">STRUCTURED OUTPUT</div>
            <strong style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1rem', display: 'block', marginBottom: '8px' }}>
              Executable Plan
            </strong>
            <p className="small text-muted mb-3">Ready to become a quotation, then a project.</p>
            <ul className="list-unstyled mb-0">
              {outputs.map((item, idx) => (
                <li className="d-flex align-items-center gap-2 mb-2" key={idx}>
                  <i className="bi bi-check-circle-fill text-success small"></i>
                  <span className="small">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-12">
            <div className="p-4 rounded-3 border bg-light d-flex flex-wrap align-items-center gap-3">
              <i className="bi bi-lightbulb fs-4 text-dark"></i>
              <div>
                <strong className="d-block" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  Product principle: estimation is not a feature. It is the entry point.
                </strong>
                <span className="small text-muted">
                  The AI estimator was designed to reduce the cognitive load of scoping — not to replace expert judgment.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
