import React from 'react';

export default function QuoteBlock({ content = {} }) {
  const { quote, author, role } = content;

  if (!quote) return null;

  return (
    <div className="case-block my-5 p-4 p-md-5 rounded-4 border" style={{ backgroundColor: '#ffffff' }}>
      <div className="d-flex gap-3 align-items-start">
        <i className="bi bi-quote text-success fs-1 lh-1"></i>
        <div>
          <blockquote className="fs-5 fst-italic mb-3" style={{ color: 'var(--ink, #10242a)', lineHeight: '1.6' }}>
            &ldquo;{quote}&rdquo;
          </blockquote>
          {(author || role) && (
            <div className="text-muted small">
              {author && <strong className="text-dark d-block">{author}</strong>}
              {role && <span>{role}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
