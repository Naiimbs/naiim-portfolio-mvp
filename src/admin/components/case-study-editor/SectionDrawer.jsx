import React, { useState } from 'react';
import AddBlockModal from './AddBlockModal';
import BlockEditorModal from './BlockEditorModal';

export default function SectionDrawer({ isOpen, section, onClose, onSaveSection }) {
  if (!isOpen || !section) return null;

  const [title, setTitle] = useState(section.title || '');
  const [eyebrow, setEyebrow] = useState(section.eyebrow || '');
  const [sectionType, setSectionType] = useState(section.section_type || 'content');
  const [isVisible, setIsVisible] = useState(section.is_visible !== false);
  const [blocks, setBlocks] = useState(section.blocks ? [...section.blocks] : []);

  // Modals state
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);

  const handleSave = () => {
    onSaveSection({
      ...section,
      title,
      eyebrow,
      section_type: sectionType,
      is_visible: isVisible,
      blocks: blocks.map((b, idx) => ({ ...b, order_index: idx + 1 })),
    });
    onClose();
  };

  const handleAddBlock = (newBlock) => {
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleSaveBlock = (updatedBlock) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
  };

  const handleDuplicateBlock = (b) => {
    const duplicated = {
      ...JSON.parse(JSON.stringify(b)),
      id: `blk-${Date.now()}`,
      order_index: (b.order_index || 0) + 1,
    };
    setBlocks((prev) => [...prev, duplicated]);
  };

  const handleToggleBlockVisibility = (bId) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === bId ? { ...b, is_visible: !b.is_visible } : b))
    );
  };

  const handleDeleteBlock = (bId) => {
    if (window.confirm('Are you sure you want to remove this block?')) {
      setBlocks((prev) => prev.filter((b) => b.id !== bId));
    }
  };

  const handleMoveBlock = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setBlocks(reordered);
  };

  // Drag & drop handlers for blocks
  const handleDragStart = (e, index) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedBlockIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setBlocks(reordered);
    setDraggedBlockIndex(null);
  };

  const getBlockSummary = (b) => {
    if (!b.content) return 'Empty content';
    if (b.block_type === 'text') return b.content.heading || b.content.body?.slice(0, 60) || 'Text block';
    if (b.block_type === 'image') return b.content.caption || b.content.alt || b.content.media_url || 'Image asset';
    if (b.block_type === 'quote') return `"${b.content.quote?.slice(0, 50)}..."` || 'Quote';
    if (b.block_type === 'metrics') return `${b.content.items?.length || 0} metrics KPIs`;
    if (b.block_type === 'process') return `${b.content.steps?.length || 0} process steps`;
    if (b.block_type === 'tech_stack') return `${b.content.items?.length || 0} technologies listed`;
    if (b.block_type === 'cta') return b.content.title || 'Call to Action';
    if (b.block_type === 'spacer') return `Spacer (${b.content.size || 'medium'})`;
    return 'Content block';
  };

  return (
    <div className="admin-drawer-backdrop" onClick={onClose}>
      <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="admin-drawer-header">
          <div>
            <span className="admin-badge draft text-uppercase mb-1" style={{ fontSize: '0.68rem' }}>
              Section Editor
            </span>
            <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title || 'Untitled Section'}
            </h3>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>

        {/* Drawer Body */}
        <div className="admin-drawer-body">
          {/* Section Settings */}
          <div className="admin-card p-3 mb-4">
            <h4 className="fs-6 fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Section Settings
            </h4>

            <div className="admin-form-group">
              <label className="admin-form-label">Section Type</label>
              <select
                className="admin-form-select"
                value={sectionType}
                onChange={(e) => setSectionType(e.target.value)}
              >
                <option value="hero">Hero</option>
                <option value="content">Content</option>
                <option value="problem">Problem</option>
                <option value="challenge">Challenge</option>
                <option value="process">Process / Contribution</option>
                <option value="gallery">Gallery / Evidence</option>
                <option value="quote">Quote / Testimonial</option>
                <option value="metrics">Metrics</option>
                <option value="technology">Technology</option>
                <option value="cta">Call to Action</option>
              </select>
            </div>

            <div className="row g-3">
              <div className="col-md-5">
                <div className="admin-form-group">
                  <label className="admin-form-label">Eyebrow (Label)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    placeholder="THE CHALLENGE"
                  />
                </div>
              </div>
              <div className="col-md-7">
                <div className="admin-form-group">
                  <label className="admin-form-label">Section Title</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Headline for this section"
                  />
                </div>
              </div>
            </div>

            <div className="form-check mt-1">
              <input
                type="checkbox"
                id="sec_visibility"
                className="form-check-input"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
              <label htmlFor="sec_visibility" className="form-check-label fw-semibold ms-2">
                Visible in Case Study
              </label>
            </div>
          </div>

          {/* Section Blocks List */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fs-6 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Content Blocks ({blocks.length})
              </h4>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                Drag or use arrows to reorder content blocks.
              </div>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-primary py-1 px-2"
              onClick={() => setIsAddBlockOpen(true)}
            >
              <i className="bi bi-plus-lg"></i> Add Block
            </button>
          </div>

          {blocks.length === 0 ? (
            <div className="text-center py-4 text-muted bg-light rounded border">
              <i className="bi bi-layout-text-window-reverse fs-3 d-block mb-2 text-muted"></i>
              <div className="small">No blocks added yet. Click &quot;Add Block&quot; to build content.</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {blocks.map((b, idx) => (
                <div
                  key={b.id}
                  className={`admin-block-card ${!b.is_visible ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className="admin-drag-handle" title="Drag to reorder">
                      <i className="bi bi-grip-vertical"></i>
                    </span>
                    <span className="admin-badge published text-uppercase" style={{ fontSize: '0.65rem' }}>
                      {b.block_type}
                    </span>
                    <div className="admin-block-summary flex-grow-1 text-truncate">
                      {getBlockSummary(b)}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted p-1"
                      onClick={() => handleMoveBlock(idx, -1)}
                      disabled={idx === 0}
                      title="Move Up"
                    >
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted p-1"
                      onClick={() => handleMoveBlock(idx, 1)}
                      disabled={idx === blocks.length - 1}
                      title="Move Down"
                    >
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-1 px-2 ms-1"
                      onClick={() => setEditingBlock(b)}
                      title="Edit Block"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted p-1"
                      onClick={() => handleDuplicateBlock(b)}
                      title="Duplicate"
                    >
                      <i className="bi bi-copy"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-link p-1 ${b.is_visible ? 'text-muted' : 'text-warning'}`}
                      onClick={() => handleToggleBlockVisibility(b.id)}
                      title={b.is_visible ? 'Hide Block' : 'Show Block'}
                    >
                      <i className={`bi ${b.is_visible ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-1"
                      onClick={() => handleDeleteBlock(b.id)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="admin-drawer-footer">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave}>
            <i className="bi bi-check2-circle"></i> Save Section Changes
          </button>
        </div>
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        onAddBlock={handleAddBlock}
      />

      {/* Edit Block Modal */}
      <BlockEditorModal
        isOpen={Boolean(editingBlock)}
        block={editingBlock}
        onClose={() => setEditingBlock(null)}
        onSaveBlock={handleSaveBlock}
      />
    </div>
  );
}
