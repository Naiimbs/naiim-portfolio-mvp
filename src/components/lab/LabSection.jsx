import React from 'react';
import LabCard from './LabCard';
import PluginCard from './PluginCard';
import { plugins } from '../../data/plugins';

const LAB_EXPERIMENTS = [
  { icon: 'bi-robot', title: 'AI Agents', description: 'Intelligent agents' },
  { icon: 'bi-diagram-3', title: 'n8n', description: 'Automation & workflows' },
  { icon: 'bi-boxes', title: 'MCP', description: 'Model Context Protocol' },
  { icon: 'bi-database', title: 'RAG', description: 'Knowledge & search' },
  { icon: 'bi-bezier2', title: 'Figma', description: 'Design systems' },
  { icon: 'bi-code-slash', title: 'Vibe Coding', description: 'Rapid prototyping' },
];

export default function LabSection() {
  return (
    <section className="section-pad" id="lab">
      <div className="container">
        <div className="section-heading d-flex justify-content-between align-items-end mb-4">
          <div>
            <div className="eyebrow">
              <span></span> EXPERIMENTS
            </div>
            <h2>Naïm Lab</h2>
            <p>Tools, experiments and ideas at the intersection of design, AI and technology.</p>
          </div>
          <span className="text-link d-none d-md-inline">
            More experiments <i className="bi bi-arrow-right"></i>
          </span>
        </div>

        <div className="row g-3">
          {LAB_EXPERIMENTS.map((exp, index) => (
            <div className="col-6 col-lg-2" key={index}>
              <LabCard
                icon={exp.icon}
                title={exp.title}
                description={exp.description}
              />
            </div>
          ))}
        </div>

        <div className="plugin-showcase mt-5">
          <div className="eyebrow">
            <span></span> FIGMA PLUGINS I BUILT
          </div>
          <div className="row g-3 mt-1">
            {plugins.map((plugin) => (
              <div className="col-md-4" key={plugin.id}>
                <PluginCard plugin={plugin} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
