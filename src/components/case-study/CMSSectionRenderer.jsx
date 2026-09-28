import React from 'react';
import { renderBlock } from './blocks';

export default function CMSSectionRenderer({ section, index = 0 }) {
  if (!section || section.is_visible === false) return null;

  const { title, eyebrow, section_type, blocks = [] } = section;
  const isAlt = index % 2 === 1 || section_type === 'process';

  // Check if first block has special role/context metadata for challenge layout
  const firstBlockContent = blocks[0]?.content || {};
  const hasRoleContext = Boolean(firstBlockContent.role || firstBlockContent.context);

  return (
    <section className={`case-section ${isAlt ? 'alt' : ''}`}>
      <div className={`container ${hasRoleContext ? 'case-grid' : ''}`}>
        <div>
          {eyebrow && (
            <div className="eyebrow">
              <span></span> {eyebrow}
            </div>
          )}
          {title && <h2>{title}</h2>}

          {/* Render all visible blocks for this section */}
          {blocks
            .filter((b) => b.is_visible !== false)
            .map((b) => renderBlock(b))}
        </div>

        {/* Challenge Role / Context Aside */}
        {hasRoleContext && (
          <aside className="case-role">
            {firstBlockContent.role && (
              <>
                <small>MY ROLE</small>
                <strong>{firstBlockContent.role}</strong>
              </>
            )}
            {firstBlockContent.context && (
              <>
                <small className="d-block mt-4">CONTEXT</small>
                <strong>{firstBlockContent.context}</strong>
              </>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
