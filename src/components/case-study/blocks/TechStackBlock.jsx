import React from 'react';

export default function TechStackBlock({ content = {} }) {
  const { items = [], tags = [] } = content;
  const toolList = items.length > 0 ? items : tags.map((t) => ({ name: t }));

  if (toolList.length === 0) return null;

  return (
    <div className="case-block tech-row my-4">
      {toolList.map((tool, idx) => {
        const name = typeof tool === 'string' ? tool : tool.name;
        return (
          <span key={idx} className="badge bg-white text-dark border px-3 py-2 rounded-pill fs-6 fw-normal me-2 mb-2">
            {name}
          </span>
        );
      })}
    </div>
  );
}
