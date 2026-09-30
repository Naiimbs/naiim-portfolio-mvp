import React, { useState } from 'react';

const CATEGORIZED_SECTIONS = [
  {
    category: 'CONVERSION',
    icon: 'bi-bullseye',
    items: [
      { type: 'hero', name: 'Hero Banner', description: 'Impactful headline, CTA buttons, and split/centered media.', editable: true },
      { type: 'cta', name: 'Call to Action', description: 'Conversion section with headline, description, and primary button.', editable: true },
    ],
  },
  {
    category: 'WORK',
    icon: 'bi-briefcase',
    items: [
      { type: 'project_grid', name: 'Project Grid', description: 'Grid layout of handpicked portfolio case studies.', editable: true },
      { type: 'agent_grid', name: 'Agent Grid', description: 'Grid display of autonomous AI agents.', editable: true },
    ],
  },
  {
    category: 'CONTENT',
    icon: 'bi-file-text',
    items: [
      { type: 'rich_text', name: 'Rich Text', description: 'Structured title, eyebrow, and body text paragraphs.', editable: true },
      { type: 'image', name: 'Image Block', description: 'Single full-width or centered image with caption.', editable: false },
      { type: 'gallery', name: 'Media Gallery', description: 'Multi-image responsive grid gallery.', editable: false },
      { type: 'quote', name: 'Quote / Testimonial', description: 'Pull quote block with author attribution.', editable: false },
      { type: 'metrics', name: 'Key Metrics', description: 'Statistics and metric counters row.', editable: false },
      { type: 'timeline', name: 'Experience Timeline', description: 'Chronological timeline of milestones.', editable: false },
      { type: 'spacer', name: 'Vertical Spacer', description: 'Configurable vertical whitespace divider.', editable: false },
    ],
  },
];

export default function AddSectionModal({ show, onClose, onAddSection }) {
  const [selectedType, setSelectedType] = useState('hero');
  const [label, setLabel] = useState('');

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const item = CATEGORIZED_SECTIONS.flatMap((c) => c.items).find((i) => i.type === selectedType);
    const defaultLabel = label.trim() || item?.name || `${selectedType.toUpperCase()} Section`;
    onAddSection(selectedType, defaultLabel);
    setLabel('');
    onClose();
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content rounded-4 border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold">Add New Page Section</h5>
              <p className="text-muted small mb-0">Select a section component to add to your page layout.</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-4">
              <div className="mb-4">
                <label className="form-label fw-semibold">Section Label (Internal)</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="e.g. Main Hero Banner"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <label className="form-label fw-semibold mb-3">Choose Component Type</label>

              {CATEGORIZED_SECTIONS.map((cat) => (
                <div key={cat.category} className="mb-4">
                  <div className="text-uppercase tracking-wider text-muted fw-bold small mb-2 d-flex align-items-center">
                    <i className={`bi ${cat.icon} me-2 text-primary`}></i> {cat.category}
                  </div>
                  <div className="row g-3">
                    {cat.items.map((item) => {
                      const isSelected = item.type === selectedType;
                      return (
                        <div key={item.type} className="col-12 col-md-6">
                          <div
                            className={`card h-100 border-2 rounded-4 p-3 cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light bg-light'
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedType(item.type)}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6 className="fw-bold mb-0">{item.name}</h6>
                              {item.editable ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill" style={{ fontSize: '0.65rem' }}>
                                  Full Property Editor
                                </span>
                              ) : (
                                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill" style={{ fontSize: '0.65rem' }}>
                                  Default Layout
                                </span>
                              )}
                            </div>
                            <p className="card-text text-muted small mb-0">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light rounded-pill" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary rounded-pill px-4">
                Add Section Component
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
