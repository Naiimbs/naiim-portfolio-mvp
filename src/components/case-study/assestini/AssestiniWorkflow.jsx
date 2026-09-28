import React from 'react';
import assestiniEstimatorImg from '../../../assets/images/Assestini-estimator.png';
import modelesWbsImg from '../../../assets/images/modeles-wbs.png';

export default function AssestiniWorkflow() {
  return (
    <section className="case-section alt">
      <div className="container">
        <div className="eyebrow">
          <span></span> THE CONNECTED WORKFLOW
        </div>
        <h2>One workflow instead of disconnected tools.</h2>
        <p className="case-copy mb-4">
          The product evolved from a conventional project-management concept toward an AI-powered Product / Operations
          OS — connecting each stage of the expert services lifecycle into a single, traceable system of record.
        </p>

        {/* Inline workflow diagram */}
        <div className="flow-diagram">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 200" width="100%" height="auto" fill="none">
            {/* Background */}
            <rect width="1100" height="200" fill="#f8f9f6" />

            {/* Step boxes */}
            {/* 01 Estimate */}
            <g transform="translate(18, 44)">
              <rect width="154" height="112" rx="12" fill="#111418" stroke="#111418" />
              <text
                x="77"
                y="30"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#5dd4b1"
                letterSpacing="0.1em"
              >
                01
              </text>
              <text
                x="77"
                y="52"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#ffffff"
              >
                Estimate
              </text>
              <text
                x="77"
                y="71"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10.5"
                fill="#8fa6ac"
              >
                AI Estimator Pro
              </text>
              <text
                x="77"
                y="87"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10"
                fill="#6b8490"
              >
                WBS · Effort · Budget
              </text>
            </g>

            {/* Arrow 1 */}
            <g transform="translate(180, 99)">
              <line x1="0" y1="0" x2="22" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" />
              <polyline
                points="17,-4 22,0 17,4"
                stroke="#087f66"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* 02 Define */}
            <g transform="translate(210, 44)">
              <rect width="154" height="112" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
              <text
                x="77"
                y="30"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#087f66"
                letterSpacing="0.1em"
              >
                02
              </text>
              <text
                x="77"
                y="52"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#111418"
              >
                Define
              </text>
              <text
                x="77"
                y="71"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10.5"
                fill="#718187"
              >
                Scope & Structure
              </text>
              <text
                x="77"
                y="87"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10"
                fill="#99a7a2"
              >
                Deliverables · TJM
              </text>
            </g>

            {/* Arrow 2 */}
            <g transform="translate(372, 99)">
              <line x1="0" y1="0" x2="22" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" />
              <polyline
                points="17,-4 22,0 17,4"
                stroke="#087f66"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* 03 Quote */}
            <g transform="translate(402, 44)">
              <rect width="154" height="112" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
              <text
                x="77"
                y="30"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#087f66"
                letterSpacing="0.1em"
              >
                03
              </text>
              <text
                x="77"
                y="52"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#111418"
              >
                Quote
              </text>
              <text
                x="77"
                y="71"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10.5"
                fill="#718187"
              >
                Commercial Proposal
              </text>
              <text
                x="77"
                y="87"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10"
                fill="#99a7a2"
              >
                Tax · Terms · Price
              </text>
            </g>

            {/* Arrow 3 */}
            <g transform="translate(564, 99)">
              <line x1="0" y1="0" x2="22" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" />
              <polyline
                points="17,-4 22,0 17,4"
                stroke="#087f66"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* 04 Launch */}
            <g transform="translate(594, 44)">
              <rect width="154" height="112" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
              <text
                x="77"
                y="30"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#087f66"
                letterSpacing="0.1em"
              >
                04
              </text>
              <text
                x="77"
                y="52"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#111418"
              >
                Launch
              </text>
              <text
                x="77"
                y="71"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10.5"
                fill="#718187"
              >
                Project from Quote
              </text>
              <text
                x="77"
                y="87"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10"
                fill="#99a7a2"
              >
                Tasks · Milestones
              </text>
            </g>

            {/* Arrow 4 */}
            <g transform="translate(756, 99)">
              <line x1="0" y1="0" x2="22" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" />
              <polyline
                points="17,-4 22,0 17,4"
                stroke="#087f66"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* 05 Deliver */}
            <g transform="translate(786, 44)">
              <rect width="154" height="112" rx="12" fill="#ffffff" stroke="#dfe5e1" strokeWidth="1.25" />
              <text
                x="77"
                y="30"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#087f66"
                letterSpacing="0.1em"
              >
                05
              </text>
              <text
                x="77"
                y="52"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#111418"
              >
                Deliver
              </text>
              <text
                x="77"
                y="71"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10.5"
                fill="#718187"
              >
                Kanban · Gantt · Time
              </text>
              <text
                x="77"
                y="87"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10"
                fill="#99a7a2"
              >
                Progress · Health
              </text>
            </g>

            {/* Arrow 5 */}
            <g transform="translate(948, 99)">
              <line x1="0" y1="0" x2="22" y2="0" stroke="#087f66" strokeWidth="1.5" strokeLinecap="round" />
              <polyline
                points="17,-4 22,0 17,4"
                stroke="#087f66"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* 06 Monitor */}
            <g transform="translate(978, 44)">
              <rect width="104" height="112" rx="12" fill="#e7f3ef" stroke="#b5d9cf" strokeWidth="1.25" />
              <text
                x="52"
                y="30"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#065b49"
                letterSpacing="0.1em"
              >
                06
              </text>
              <text
                x="52"
                y="52"
                textAnchor="middle"
                fontFamily="'Space Grotesk',sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#0a3d2e"
              >
                Monitor
              </text>
              <text
                x="52"
                y="71"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10.5"
                fill="#087f66"
              >
                Control Center
              </text>
              <text
                x="52"
                y="87"
                textAnchor="middle"
                fontFamily="'DM Sans',sans-serif"
                fontSize="10"
                fill="#087f66"
              >
                SPI · CPI · Margin
              </text>
            </g>
          </svg>
        </div>

        {/* Two product screenshots side by side */}
        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <figure className="case-media">
              <img
                src={assestiniEstimatorImg}
                alt="Assestini home dashboard showing Vision Opérationnelle and project delivery pipeline"
                loading="lazy"
              />
            </figure>
          </div>
          <div className="col-md-6">
            <figure className="case-media">
              <img
                src={modelesWbsImg}
                alt="Assestini Business Control Center showing Business Health Score, delivery, finance and operations monitoring"
                loading="lazy"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
