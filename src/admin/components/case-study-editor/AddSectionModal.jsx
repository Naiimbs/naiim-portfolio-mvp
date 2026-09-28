import React from 'react';

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero', icon: 'bi-window-fullscreen', desc: 'Case study header with title, lead, tags & cover image' },
  { type: 'content', label: 'Content', icon: 'bi-text-paragraph', desc: 'General editorial text, headings and body blocks' },
  { type: 'problem', label: 'Problem', icon: 'bi-exclamation-octagon', desc: 'Problem definition, context and constraints' },
  { type: 'challenge', label: 'Challenge', icon: 'bi-lightning', desc: 'Product challenge, goals and target audience' },
  { type: 'process', label: 'Process / Contribution', icon: 'bi-diagram-3', desc: 'Step-by-step workflow, methodology and phases' },
  { type: 'gallery', label: 'Gallery / Evidence', icon: 'bi-images', desc: 'Screenshots, design artifacts and visual proof' },
  { type: 'quote', label: 'Quote / Testimonial', icon: 'bi-chat-square-quote', desc: 'Key takeaway, client feedback or stakeholder quote' },
  { type: 'metrics', label: 'Metrics & Results', icon: 'bi-graph-up-arrow', desc: 'Quantitative impact KPIs and performance stats' },
  { type: 'technology', label: 'Technology', icon: 'bi-code-slash', desc: 'Tools, frameworks, design systems and tech stack' },
  { type: 'cta', label: 'Call to Action', icon: 'bi-box-arrow-up-right', desc: 'Next step link, demo trigger or external reference' },
];

export default function AddSectionModal({ isOpen, onClose, onAddSection }) {
  if (!isOpen) return null;

  const handleSelect = (secType) => {
    const defaultData = {
      id: `sec-${Date.now()}`,
      section_type: secType.type,
      title: secType.label === 'Hero' ? 'Overview' : `${secType.label}`,
      eyebrow: secType.label.toUpperCase(),
      order_index: 999,
      is_visible: true,
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          block_type: secType.type === 'technology' ? 'tech_stack' : secType.type === 'gallery' ? 'image' : 'text',
          content: secType.type === 'technology' 
            ? { items: [{ name: 'Figma', category: 'Design' }, { name: 'React', category: 'Frontend' }] }
            : secType.type === 'gallery'
            ? { media_url: '', alt: 'Project Screenshot', caption: 'Visual evidence' }
            : { heading: `${secType.label} Overview`, body: 'Describe this section...' },
          order_index: 1,
          is_visible: true,
        },
      ],
    };
    onAddSection(defaultData);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <i className="bi bi-plus-circle me-2 text-success"></i> Add Section
          </h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>

        <p className="text-muted small mb-4">
          Choose a section type to add to the case study. You can customize blocks and layout afterward.
        </p>

        <div className="row g-3">
          {SECTION_TYPES.map((sec) => (
            <div className="col-md-6" key={sec.type}>
              <div
                className="admin-type-option"
                onClick={() => handleSelect(sec)}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(sec)}
              >
                <div className="admin-type-icon">
                  <i className={`bi ${sec.icon}`}></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {sec.label}
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    {sec.desc}
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
