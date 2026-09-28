import React from 'react';

const BLOCK_TYPES = [
  { type: 'text', label: 'Text Block', icon: 'bi-text-left', desc: 'Heading and rich multiline body copy' },
  { type: 'image', label: 'Image Block', icon: 'bi-image', desc: 'Single featured image with alt text and caption' },
  { type: 'gallery', label: 'Gallery Block', icon: 'bi-images', desc: 'Multi-image comparison grid or slideshow' },
  { type: 'quote', label: 'Quote Block', icon: 'bi-quote', desc: 'Highlighted quote, author name and role' },
  { type: 'metrics', label: 'Metrics Block', icon: 'bi-bar-chart-line', desc: 'Key performance indicators and numeric stats' },
  { type: 'process', label: 'Process Block', icon: 'bi-list-ol', desc: 'Numbered steps, titles and step descriptions' },
  { type: 'tech_stack', label: 'Tech Stack', icon: 'bi-cpu', desc: 'Tools, technologies and categorized badges' },
  { type: 'cta', label: 'CTA Block', icon: 'bi-box-arrow-up-right', desc: 'Call to action card with link button' },
  { type: 'spacer', label: 'Spacer', icon: 'bi-distribute-vertical', desc: 'Vertical spacing divider (small, medium, large)' },
];

export default function AddBlockModal({ isOpen, onClose, onAddBlock }) {
  if (!isOpen) return null;

  const handleSelect = (b) => {
    let defaultContent = {};
    if (b.type === 'text') {
      defaultContent = { heading: '', body: '' };
    } else if (b.type === 'image') {
      defaultContent = { media_url: '', alt: '', caption: '' };
    } else if (b.type === 'gallery') {
      defaultContent = { media: [], caption: '' };
    } else if (b.type === 'quote') {
      defaultContent = { quote: '', author: '', role: '' };
    } else if (b.type === 'metrics') {
      defaultContent = { items: [{ value: '+45%', label: 'Efficiency', description: 'Improved task speed' }] };
    } else if (b.type === 'process') {
      defaultContent = { steps: [{ number: '01', title: 'Discovery', description: 'User interviews and problem scoping' }] };
    } else if (b.type === 'tech_stack') {
      defaultContent = { items: [{ name: 'Figma', category: 'Design' }] };
    } else if (b.type === 'cta') {
      defaultContent = { title: 'Explore Live Project', description: 'Visit the live application.', label: 'View Project', url: 'https://' };
    } else if (b.type === 'spacer') {
      defaultContent = { size: 'medium' };
    }

    const newBlock = {
      id: `blk-${Date.now()}`,
      block_type: b.type,
      content: defaultContent,
      order_index: 999,
      is_visible: true,
    };

    onAddBlock(newBlock);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <i className="bi bi-plus-square me-2 text-success"></i> Add Content Block
          </h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>

        <p className="text-muted small mb-4">
          Select a content block type to insert into this section.
        </p>

        <div className="row g-3">
          {BLOCK_TYPES.map((b) => (
            <div className="col-md-6" key={b.type}>
              <div
                className="admin-type-option"
                onClick={() => handleSelect(b)}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(b)}
              >
                <div className="admin-type-icon">
                  <i className={`bi ${b.icon}`}></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {b.label}
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    {b.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-end mt-4 pt-3 border-top">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
