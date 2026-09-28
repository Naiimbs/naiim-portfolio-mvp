import React, { useState } from 'react';

export default function SectionList({
  sections,
  onEditSection,
  onDuplicateSection,
  onToggleVisibility,
  onDeleteSection,
  onReorderSections,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorderSections(reordered);
    setDraggedIndex(null);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorderSections(reordered);
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="admin-card text-center py-5 text-muted">
        <i className="bi bi-layout-text-window fs-2 d-block mb-3 text-muted"></i>
        <h4 className="fs-6 fw-bold mb-2">No sections created yet</h4>
        <p className="small mb-0">Click &quot;+ Add Section&quot; below to start structuring your case study.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {sections.map((sec, idx) => {
        const sectionNumber = String(idx + 1).padStart(2, '0');
        const blocksCount = sec.blocks ? sec.blocks.length : 0;

        return (
          <div
            key={sec.id}
            className={`admin-section-card ${!sec.is_visible ? 'opacity-60' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
          >
            <div className="d-flex align-items-center gap-3">
              {/* Drag Handle */}
              <div className="admin-drag-handle" title="Drag to reorder section">
                <i className="bi bi-grip-vertical"></i>
              </div>

              {/* Number */}
              <div className="admin-section-num">{sectionNumber}</div>

              {/* Main Info */}
              <div className="admin-section-info">
                <div className="d-flex align-items-center gap-2 mb-1">
                  {sec.eyebrow && (
                    <span className="admin-section-eyebrow">{sec.eyebrow}</span>
                  )}
                  <span className="admin-badge draft" style={{ fontSize: '0.65rem' }}>
                    {sec.section_type || 'content'}
                  </span>
                  {!sec.is_visible && (
                    <span className="badge bg-secondary text-light" style={{ fontSize: '0.65rem' }}>
                      Hidden
                    </span>
                  )}
                </div>
                <h4 className="admin-section-title mb-0">
                  {sec.title || 'Untitled Section'}
                </h4>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex align-items-center gap-2">
              <span className="admin-badge-count me-2" title={`${blocksCount} content blocks`}>
                <i className="bi bi-boxes me-1"></i> {blocksCount} blocks
              </span>

              {/* Accessible Reorder Buttons */}
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-1"
                onClick={() => handleMove(idx, -1)}
                disabled={idx === 0}
                title="Move Section Up"
              >
                <i className="bi bi-arrow-up"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-1"
                onClick={() => handleMove(idx, 1)}
                disabled={idx === sections.length - 1}
                title="Move Section Down"
              >
                <i className="bi bi-arrow-down"></i>
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-secondary py-1 px-3 ms-2"
                onClick={() => onEditSection(sec)}
              >
                <i className="bi bi-pencil"></i> Edit Section
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-1"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="More actions"
                >
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => onEditSection(sec)}
                    >
                      <i className="bi bi-pencil me-2"></i> Edit Content & Blocks
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => onDuplicateSection(sec)}
                    >
                      <i className="bi bi-copy me-2"></i> Duplicate Section
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => onToggleVisibility(sec.id)}
                    >
                      <i className={`bi ${sec.is_visible ? 'bi-eye-slash' : 'bi-eye'} me-2`}></i>
                      {sec.is_visible ? 'Hide from Page' : 'Make Visible'}
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item text-danger"
                      onClick={() => onDeleteSection(sec.id)}
                    >
                      <i className="bi bi-trash me-2"></i> Delete Section
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
