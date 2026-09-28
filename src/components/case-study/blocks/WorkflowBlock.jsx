import React from 'react';

export default function WorkflowBlock({ content = {} }) {
  const { nodes = [] } = content;

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="case-block my-4">
      <div className="workflow-diagram">
        {nodes.map((node, idx) => (
          <div className="workflow-node" key={idx}>
            <div className="workflow-node-type">{node.type || `STEP 0${idx + 1}`}</div>
            <div className="workflow-node-title">{node.title}</div>
            <p className="workflow-node-desc">{node.description || node.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
