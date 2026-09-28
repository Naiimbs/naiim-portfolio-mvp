import React from 'react';

export default function AssestiniMcp() {
  const mcpNodes = [
    {
      icon: 'bi-person',
      title: 'User',
      sub: 'Expert · Consultant · Agency',
      type: 'default',
    },
    {
      icon: 'bi-stars',
      title: 'AI Agent',
      sub: 'Gemini-powered · Context-aware',
      type: 'dark',
    },
    {
      icon: null,
      title: 'MCP Layer',
      sub: 'Authorization · Plan Controls · Feature Gates',
      type: 'default',
    },
    {
      icon: 'bi-tools',
      title: 'Authorized Tools',
      sub: 'Read · Write · Trigger · Summarize',
      type: 'default',
    },
    {
      icon: 'bi-database',
      title: 'Assestini Data & Workflows',
      sub: 'Projects · Quotes · Time · Finance · Decisions',
      type: 'accent',
    },
  ];

  return (
    <section className="case-section">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <div className="eyebrow">
              <span></span> 06 · AI AGENTS &amp; MCP
            </div>
            <h2>Making the product accessible to AI.</h2>
            <p className="case-copy">
              Assestini explores how AI can interact with the product itself — not just assist users within it. An MCP
              (Model Context Protocol) layer provides controlled access to product capabilities and data, with
              authorization and feature/plan controls.
            </p>
            <p className="case-copy mt-3">
              This creates a foundation for AI Agents to perform operational tasks: summarizing project health, flagging
              financial risk, triggering billing workflows, and managing approvals — within a controlled, permissioned
              environment.
            </p>
            <ul className="case-list mt-3">
              <li>
                <strong>Tool-based AI interaction</strong> within authorized boundaries.
              </li>
              <li>
                <strong>MCP authorization layer</strong> controls access per plan and user role.
              </li>
              <li>
                <strong>Operational AI workflows</strong> triggered by business signals, not just user prompts.
              </li>
            </ul>
          </div>

          <div className="col-lg-6">
            {/* MCP Architecture Diagram */}
            <div className="mcp-arch">
              {mcpNodes.map((node, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`mcp-node ${node.type === 'dark' ? 'dark' : node.type === 'accent' ? 'accent' : ''}`}
                  >
                    <div
                      className="mcp-node-title"
                      style={
                        node.type === 'accent'
                          ? { color: 'var(--green-dark, #065b49)' }
                          : { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }
                      }
                    >
                      {node.icon && <i className={`bi ${node.icon} me-2`}></i>}
                      {node.title}
                    </div>
                    <div
                      className="mcp-node-sub"
                      style={node.type === 'accent' ? { color: 'var(--green)' } : undefined}
                    >
                      {node.sub}
                    </div>
                  </div>
                  {idx < mcpNodes.length - 1 && (
                    <div className="mcp-connector">
                      <i className="bi bi-arrow-down"></i>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
