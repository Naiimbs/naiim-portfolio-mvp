import React from 'react';
import { Link } from 'react-router-dom';

const phases = [
  {
    number: '01',
    title: 'Core LMS',
    status: 'In progress',
    description: 'Course structure, modules, lessons, student enrollment, persistent progress, quizzes and results.',
    items: ['Course management', 'Student portal & enrollment', 'Lesson progress', 'Assessments'],
  },
  {
    number: '02',
    title: 'Knowledge Processing',
    status: 'Planned',
    description: 'Ingest learning material and preserve its structure and source references.',
    items: ['PDF and document ingestion', 'MinerU extraction adapter', 'Source and page references'],
  },
  {
    number: '03',
    title: 'AI Course Builder',
    status: 'Planned',
    description: 'Turn reviewed knowledge sources into editable course drafts. Nothing is published without instructor approval.',
    items: ['Course outline generation', 'Lesson draft generation', 'Quiz suggestions'],
  },
  {
    number: '04',
    title: 'RAG & AI Tutor',
    status: 'Planned',
    description: 'Retrieve relevant course knowledge and provide source-grounded answers to learners.',
    items: ['Chunking and embeddings', 'Course-scoped retrieval', 'Cited AI Tutor responses'],
  },
];

function StatusPill({ status }) {
  const active = status === 'In progress';
  return (
    <span className={`badge rounded-pill ${active ? 'text-bg-success' : 'text-bg-light border text-secondary'}`}>
      {status}
    </span>
  );
}

export default function AcademyDashboard() {
  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="text-uppercase small fw-semibold text-success mb-2">Learning platform</div>
          <h1 className="h2 fw-bold mb-2">My Academy</h1>
          <p className="text-secondary mb-0" style={{ maxWidth: 720 }}>
            A dedicated learning management system, separate from the website CMS.
            Build the teaching and learning foundation first; add document intelligence and AI workflows in later phases.
          </p>
        </div>
        <Link to="/admin" className="btn btn-outline-secondary rounded-pill">Back to Admin</Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">Product scope</div>
              <div className="h5 fw-bold mb-1">Single instructor</div>
              <p className="small text-secondary mb-0">One administrator manages courses and learners in v1.</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">Architecture</div>
              <div className="h5 fw-bold mb-1">Dedicated LMS domain</div>
              <p className="small text-secondary mb-0">Academy data and workflows do not depend on CMS page sections.</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">AI strategy</div>
              <div className="h5 fw-bold mb-1">Phased integration</div>
              <p className="small text-secondary mb-0">MinerU, Course Builder and RAG remain separate services.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h2 className="h5 fw-bold mb-1">Delivery roadmap</h2>
          <p className="small text-secondary mb-0">The agreed implementation sequence.</p>
        </div>
        <span className="small text-secondary">MVP first · AI capabilities next</span>
      </div>

      <div className="row g-3">
        {phases.map((phase) => (
          <div className="col-12 col-xl-6" key={phase.number}>
            <section className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                  <span className="small fw-semibold text-secondary">PHASE {phase.number}</span>
                  <StatusPill status={phase.status} />
                </div>
                <h3 className="h5 fw-bold">{phase.title}</h3>
                <p className="small text-secondary">{phase.description}</p>
                <ul className="small mb-0 ps-3">
                  {phase.items.map((item) => <li className="mb-1" key={item}>{item}</li>)}
                </ul>
              </div>
            </section>
          </div>
        ))}
      </div>

      <div className="alert alert-light border mt-4 mb-0" role="note">
        <strong>Implementation note:</strong> This is the Academy entry point and roadmap only.
        LMS tables and student workflows will be added after the live Supabase schema and migration history are reconciled.
        The legacy CMS-based learning experiment remains untouched.
      </div>
    </div>
  );
}
