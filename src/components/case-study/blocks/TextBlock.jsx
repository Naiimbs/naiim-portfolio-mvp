import React from 'react';

export default function TextBlock({ content = {} }) {
  const { heading, body, metaChips } = content;

  if (!heading && !body && (!metaChips || metaChips.length === 0)) {
    return null;
  }

  // Parse multiline string into paragraphs or bullet list if prefixed with • or -
  const lines = body ? body.split('\n').filter((l) => l.trim().length > 0) : [];
  const isBulletList = lines.some((l) => l.trim().startsWith('•') || l.trim().startsWith('-'));

  return (
    <div className="case-block case-text-block mb-4">
      {heading && <h3 className="fs-4 fw-bold mb-3">{heading}</h3>}

      {metaChips && metaChips.length > 0 && (
        <div className="case-meta mb-3">
          {metaChips.map((chip, i) => (
            <span key={i}>{chip}</span>
          ))}
        </div>
      )}

      {isBulletList ? (
        <ul className="case-list row row-cols-1 row-cols-md-2 g-0">
          {lines.map((line, idx) => {
            const cleanText = line.replace(/^[•\-*]\s*/, '');
            return (
              <li className="col" key={idx}>
                {cleanText}
              </li>
            );
          })}
        </ul>
      ) : (
        lines.map((p, idx) => (
          <p className="case-copy" key={idx}>
            {p}
          </p>
        ))
      )}
    </div>
  );
}
