import React from 'react';
import AgentCard from './AgentCard';

export default function AgentGrid({ agents = [] }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-robot fs-1 d-block mb-2"></i>
        <p>No AI Agents published yet.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {agents.map((agent) => (
        <div className="col-md-6 col-lg-6" key={agent.id || agent.slug}>
          <AgentCard agent={agent} />
        </div>
      ))}
    </div>
  );
}
