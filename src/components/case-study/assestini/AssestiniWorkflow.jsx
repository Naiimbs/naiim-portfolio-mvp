import React from 'react';
import assestiniEstimatorImg from '../../../assets/images/Assestini-estimator.webp';
import modelesWbsImg from '../../../assets/images/modeles-wbs.webp';
import { resolveAsset } from '../../../services/assetRegistry';

export default function AssestiniWorkflow({ content = {} }) {
  const estimatorImage = resolveAsset(content.estimatorImage) || assestiniEstimatorImg;
  const wbsImage = resolveAsset(content.wbsImage) || modelesWbsImg;
  const defaultWorkflowSteps = [
    { num: '01', title: 'Estimate', subtitle: 'AI Estimator Pro', detail: 'WBS · Effort · Budget' },
    { num: '02', title: 'Define', subtitle: 'Scope & Structure', detail: 'Deliverables · TJM' },
    { num: '03', title: 'Quote', subtitle: 'Commercial Proposal', detail: 'Tax · Terms · Price' },
    { num: '04', title: 'Launch', subtitle: 'Project from Quote', detail: 'Tasks · Milestones' },
    { num: '05', title: 'Deliver', subtitle: 'Kanban · Gantt · Time', detail: 'Progress · Health' },
    { num: '06', title: 'Monitor', subtitle: 'Control Center', detail: 'SPI · CPI · Margin' },
  ];
  const parsedWorkflowSteps = (() => {
    if (Array.isArray(content.workflowSteps)) return content.workflowSteps;
    if (typeof content.workflowStepsJson !== 'string' || !content.workflowStepsJson.trim()) return defaultWorkflowSteps;
    try {
      const parsed = JSON.parse(content.workflowStepsJson);
      return Array.isArray(parsed) && parsed.length === 6 ? parsed : defaultWorkflowSteps;
    } catch {
      return defaultWorkflowSteps;
    }
  })();
  const workflowSteps = parsedWorkflowSteps.slice(0, 6).map((step) => (step && typeof step === 'object' ? step : {}));
  return (
    <section className="case-section alt">
      <div className="container">
        <div className="eyebrow">
          <span></span> {content.eyebrow || 'THE CONNECTED WORKFLOW'}
        </div>
        <h2>{content.title || 'One workflow instead of disconnected tools.'}</h2>
        <p className="case-copy mb-4">
          {content.lead || 'The product evolved from a conventional project-management concept toward an AI-powered Product / Operations OS — connecting each stage of the expert services lifecycle into a single, traceable system of record.'}
        </p>

        {/* CMS-configurable workflow diagram */}
        <div className="flow-diagram">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 200" width="100%" height="auto" fill="none" role="img" aria-label={content.workflowDiagramAlt || 'Six-stage Assestini workflow'}>
            <rect width="1100" height="200" fill="#f8f9f6" />
            {workflowSteps.map((step, index) => {
              const x = 18 + index * 192;
              const width = index === 5 ? 104 : 154;
              const center = width / 2;
              const dark = index === 0;
              const final = index === 5;
              return (
                <g key={step.num || index} transform={`translate(${x}, 44)`}>
                  <rect width={width} height="112" rx="12" fill={dark ? '#111418' : final ? '#e7f3ef' : '#ffffff'} stroke={dark ? '#111418' : final ? '#b5d9cf' : '#dfe5e1'} strokeWidth="1.25" />
                  <text x={center} y="30" textAnchor="middle" fontFamily="'Space Grotesk',sans-serif" fontSize="10" fontWeight="700" fill={dark ? '#5dd4b1' : final ? '#065b49' : '#087f66'} letterSpacing="0.1em">{step.num || String(index + 1).padStart(2, '0')}</text>
                  <text x={center} y="52" textAnchor="middle" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="700" fill={dark ? '#ffffff' : final ? '#0a3d2e' : '#111418'}>{step.title || ''}</text>
                  <text x={center} y="71" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="10.5" fill={dark ? '#8fa6ac' : '#718187'}>{step.subtitle || ''}</text>
                  <text x={center} y="87" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="10" fill={dark ? '#6b8490' : final ? '#087f66' : '#99a7a2'}>{step.detail || ''}</text>
                </g>
              );
            })}
            {workflowSteps.slice(0, -1).map((step, index) => (
              <g key={`arrow-${index}`} transform={`translate(${18 + index * 192 + (index === 0 ? 154 : 154)}, 99)`}>
                <line x1="0" y1="0" x2="30" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" />
                <polyline points="25,-4 30,0 25,4" stroke="#087f66" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        </div>

        {/* Two product screenshots side by side */}
        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <figure className="case-media">
              <img
                src={estimatorImage}
                alt={content.estimatorImageAlt || 'Assestini home dashboard showing Vision Opérationnelle and project delivery pipeline'}
                loading="lazy" decoding="async"
              />
            </figure>
          </div>
          <div className="col-md-6">
            <figure className="case-media">
              <img
                src={wbsImage}
                alt={content.wbsImageAlt || 'Assestini Business Control Center showing Business Health Score, delivery, finance and operations monitoring'}
                loading="lazy" decoding="async"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
