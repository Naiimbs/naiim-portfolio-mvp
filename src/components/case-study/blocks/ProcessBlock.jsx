import React from 'react';

export default function ProcessBlock({ content = {} }) {
  const { steps = [] } = content;

  if (!steps || steps.length === 0) return null;

  return (
    <div className="case-block case-process">
      {steps.map((p, idx) => (
        <div key={idx}>
          <b>{p.number || `0${idx + 1}`}</b>
          <strong>{p.title}</strong>
          <p>{p.description || p.desc}</p>
        </div>
      ))}
    </div>
  );
}
