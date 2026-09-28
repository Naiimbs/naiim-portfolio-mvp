import React, { useState, useEffect } from 'react';
import MediaPickerModal from '../media/MediaPickerModal';

export default function BlockEditorModal({ isOpen, block, onClose, onSaveBlock }) {
  if (!isOpen || !block) return null;

  const [blockType, setBlockType] = useState(block.block_type || 'text');
  const [content, setContent] = useState(block.content || {});
  const [isVisible, setIsVisible] = useState(block.is_visible !== false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('single'); // 'single' | 'gallery'

  useEffect(() => {
    setBlockType(block.block_type || 'text');
    setContent(block.content ? JSON.parse(JSON.stringify(block.content)) : {});
    setIsVisible(block.is_visible !== false);
  }, [block]);

  const handleFieldChange = (field, value) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectMediaForImage = (mediaObj) => {
    setContent((prev) => ({
      ...prev,
      media_id: mediaObj.id,
      media_url: mediaObj.public_url,
      alt: prev.alt || mediaObj.alt_text || mediaObj.filename,
      caption: prev.caption || mediaObj.caption || '',
    }));
  };

  const handleSelectMediaForGallery = (selectedObjects) => {
    const list = Array.isArray(selectedObjects) ? selectedObjects : [selectedObjects];
    const newMediaItems = list.map((m) => ({
      media_id: m.id,
      media_url: m.public_url,
      alt: m.alt_text || m.filename,
      caption: m.caption || '',
    }));
    setContent((prev) => ({
      ...prev,
      media: [...(prev.media || []), ...newMediaItems],
    }));
  };

  const handleRemoveGalleryItem = (index) => {
    setContent((prev) => ({
      ...prev,
      media: (prev.media || []).filter((_, i) => i !== index),
    }));
  };

  const handleMetricChange = (index, field, value) => {
    const items = [...(content.items || [])];
    items[index] = { ...items[index], [field]: value };
    setContent((prev) => ({ ...prev, items }));
  };

  const handleAddMetric = () => {
    const items = [...(content.items || []), { value: '', label: '', description: '' }];
    setContent((prev) => ({ ...prev, items }));
  };

  const handleRemoveMetric = (index) => {
    const items = (content.items || []).filter((_, i) => i !== index);
    setContent((prev) => ({ ...prev, items }));
  };

  const handleStepChange = (index, field, value) => {
    const steps = [...(content.steps || [])];
    steps[index] = { ...steps[index], [field]: value };
    setContent((prev) => ({ ...prev, steps }));
  };

  const handleAddStep = () => {
    const steps = [...(content.steps || []), { number: `0${(content.steps?.length || 0) + 1}`, title: '', description: '' }];
    setContent((prev) => ({ ...prev, steps }));
  };

  const handleRemoveStep = (index) => {
    const steps = (content.steps || []).filter((_, i) => i !== index);
    setContent((prev) => ({ ...prev, steps }));
  };

  const handleTechChange = (index, field, value) => {
    const items = [...(content.items || [])];
    items[index] = { ...items[index], [field]: value };
    setContent((prev) => ({ ...prev, items }));
  };

  const handleAddTech = () => {
    const items = [...(content.items || []), { name: '', category: 'Tools' }];
    setContent((prev) => ({ ...prev, items }));
  };

  const handleRemoveTech = (index) => {
    const items = (content.items || []).filter((_, i) => i !== index);
    setContent((prev) => ({ ...prev, items }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveBlock({
      ...block,
      block_type: blockType,
      content,
      is_visible: isVisible,
    });
    onClose();
  };

  return (
    <>
      <div className="admin-modal-backdrop" onClick={onClose}>
        <div className="admin-modal-box admin-modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <i className="bi bi-pencil-square me-2 text-success"></i> Edit Block ({blockType.toUpperCase()})
            </h3>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <form onSubmit={handleSave}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="admin-form-label">Block Type</label>
                <select
                  className="admin-form-select"
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                >
                  <option value="text">Text Block</option>
                  <option value="image">Image Block</option>
                  <option value="gallery">Gallery Block</option>
                  <option value="quote">Quote Block</option>
                  <option value="metrics">Metrics Block</option>
                  <option value="process">Process Block</option>
                  <option value="tech_stack">Tech Stack</option>
                  <option value="cta">Call To Action</option>
                  <option value="spacer">Spacer</option>
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-center mt-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="blk_visibility"
                    className="form-check-input"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                  />
                  <label htmlFor="blk_visibility" className="form-check-label fw-semibold ms-2">
                    Visible in Case Study
                  </label>
                </div>
              </div>
            </div>

            {/* Block Specific Form Fields */}
            {blockType === 'text' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="admin-form-group">
                  <label className="admin-form-label">Heading (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={content.heading || ''}
                    onChange={(e) => handleFieldChange('heading', e.target.value)}
                    placeholder="e.g. Design Decisions & Tradeoffs"
                  />
                </div>
                <div className="admin-form-group mb-0">
                  <label className="admin-form-label">Body Content</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="6"
                    value={content.body || ''}
                    onChange={(e) => handleFieldChange('body', e.target.value)}
                    placeholder="Enter editorial copy here..."
                  ></textarea>
                </div>
              </div>
            )}

            {blockType === 'image' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="admin-form-label mb-0">Image Asset</label>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary py-1 px-3"
                    onClick={() => {
                      setPickerMode('single');
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    <i className="bi bi-images"></i> Select from Media Library
                  </button>
                </div>

                {content.media_url ? (
                  <div className="d-flex gap-3 align-items-center p-3 bg-white rounded border mb-3">
                    <img
                      src={content.media_url}
                      alt={content.alt || 'Selected Preview'}
                      style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="small fw-bold text-truncate">{content.media_url.split('/').pop()}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {content.media_id ? `Media ID: ${content.media_id}` : 'Direct URL'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setPickerMode('single');
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Media URL / Direct Path</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={content.media_url || ''}
                      onChange={(e) => handleFieldChange('media_url', e.target.value)}
                      placeholder="/assets/images/screenshot.png or https://..."
                    />
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Alt Text (Accessibility)</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={content.alt || ''}
                        onChange={(e) => handleFieldChange('alt', e.target.value)}
                        placeholder="Descriptive alt text"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Caption</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={content.caption || ''}
                        onChange={(e) => handleFieldChange('caption', e.target.value)}
                        placeholder="e.g. Navigation wireframes and final UI"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {blockType === 'gallery' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <label className="admin-form-label mb-0">Gallery Images ({(content.media || []).length})</label>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Add multiple comparison screenshots or flows.</div>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary py-1 px-3"
                    onClick={() => {
                      setPickerMode('gallery');
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    <i className="bi bi-images"></i> Add Images
                  </button>
                </div>

                {(content.media || []).length === 0 ? (
                  <div className="text-center py-4 bg-white rounded border text-muted small">
                    No images in gallery yet. Click &quot;Add Images&quot; to pick from library.
                  </div>
                ) : (
                  <div className="row g-2 mb-3">
                    {(content.media || []).map((m, idx) => (
                      <div className="col-6 col-md-4" key={idx}>
                        <div className="position-relative p-2 bg-white rounded border">
                          <img
                            src={m.media_url || m.url}
                            alt={m.alt || 'Gallery item'}
                            style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0"
                            style={{ width: '22px', height: '22px', lineHeight: '18px' }}
                            onClick={() => handleRemoveGalleryItem(idx)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="admin-form-group mb-0 mt-3">
                  <label className="admin-form-label">Gallery Caption</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={content.caption || ''}
                    onChange={(e) => handleFieldChange('caption', e.target.value)}
                    placeholder="e.g. Iterative exploration and responsive design targets."
                  />
                </div>
              </div>
            )}

            {blockType === 'quote' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="admin-form-group">
                  <label className="admin-form-label">Quote Text</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="3"
                    value={content.quote || ''}
                    onChange={(e) => handleFieldChange('quote', e.target.value)}
                    placeholder="Insert key testimonial or takeaway..."
                  ></textarea>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-form-label">Author Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={content.author || ''}
                      onChange={(e) => handleFieldChange('author', e.target.value)}
                      placeholder="e.g. Lead Product Manager"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-form-label">Role / Affiliation</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={content.role || ''}
                      onChange={(e) => handleFieldChange('role', e.target.value)}
                      placeholder="e.g. Digital Services Department"
                    />
                  </div>
                </div>
              </div>
            )}

            {blockType === 'metrics' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="admin-form-label mb-0">KPI Metrics Items</label>
                  <button type="button" className="admin-btn admin-btn-secondary py-1 px-2" onClick={handleAddMetric}>
                    <i className="bi bi-plus-lg"></i> Add Metric
                  </button>
                </div>
                {(content.items || []).map((m, idx) => (
                  <div className="d-flex gap-2 mb-2 align-items-center" key={idx}>
                    <input
                      type="text"
                      className="admin-form-input"
                      style={{ width: '120px' }}
                      placeholder="Value (e.g. +65%)"
                      value={m.value || ''}
                      onChange={(e) => handleMetricChange(idx, 'value', e.target.value)}
                    />
                    <input
                      type="text"
                      className="admin-form-input"
                      style={{ width: '160px' }}
                      placeholder="Label (e.g. Conversion)"
                      value={m.label || ''}
                      onChange={(e) => handleMetricChange(idx, 'label', e.target.value)}
                    />
                    <input
                      type="text"
                      className="admin-form-input flex-grow-1"
                      placeholder="Short description"
                      value={m.description || ''}
                      onChange={(e) => handleMetricChange(idx, 'description', e.target.value)}
                    />
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveMetric(idx)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {blockType === 'process' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="admin-form-label mb-0">Process Steps</label>
                  <button type="button" className="admin-btn admin-btn-secondary py-1 px-2" onClick={handleAddStep}>
                    <i className="bi bi-plus-lg"></i> Add Step
                  </button>
                </div>
                {(content.steps || []).map((st, idx) => (
                  <div className="p-2 bg-white rounded border mb-2" key={idx}>
                    <div className="d-flex gap-2 align-items-center mb-2">
                      <input
                        type="text"
                        className="admin-form-input"
                        style={{ width: '80px' }}
                        placeholder="01"
                        value={st.number || ''}
                        onChange={(e) => handleStepChange(idx, 'number', e.target.value)}
                      />
                      <input
                        type="text"
                        className="admin-form-input flex-grow-1"
                        placeholder="Step Title"
                        value={st.title || ''}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      />
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveStep(idx)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    <textarea
                      className="admin-form-textarea"
                      rows="2"
                      placeholder="Step details and implementation notes"
                      value={st.description || ''}
                      onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                    ></textarea>
                  </div>
                ))}
              </div>
            )}

            {blockType === 'tech_stack' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="admin-form-label mb-0">Technologies & Tools</label>
                  <button type="button" className="admin-btn admin-btn-secondary py-1 px-2" onClick={handleAddTech}>
                    <i className="bi bi-plus-lg"></i> Add Tool
                  </button>
                </div>
                <div className="row g-2">
                  {(content.items || []).map((t, idx) => (
                    <div className="col-md-6" key={idx}>
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="Tool (e.g. Figma)"
                          value={t.name || ''}
                          onChange={(e) => handleTechChange(idx, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          className="admin-form-input"
                          style={{ width: '130px' }}
                          placeholder="Category"
                          value={t.category || ''}
                          onChange={(e) => handleTechChange(idx, 'category', e.target.value)}
                        />
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveTech(idx)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blockType === 'cta' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="admin-form-group">
                  <label className="admin-form-label">CTA Title</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={content.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Ready to collaborate?"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={content.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Let's build intelligent products together."
                  />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-form-label">Button Label</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={content.label || ''}
                      onChange={(e) => handleFieldChange('label', e.target.value)}
                      placeholder="Get In Touch"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-form-label">Button URL</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={content.url || ''}
                      onChange={(e) => handleFieldChange('url', e.target.value)}
                      placeholder="mailto:hi@naiimbsili.com or /contact"
                    />
                  </div>
                </div>
              </div>
            )}

            {blockType === 'spacer' && (
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <label className="admin-form-label">Spacing Size</label>
                <select
                  className="admin-form-select"
                  value={content.size || 'medium'}
                  onChange={(e) => handleFieldChange('size', e.target.value)}
                >
                  <option value="small">Small (24px)</option>
                  <option value="medium">Medium (48px)</option>
                  <option value="large">Large (80px)</option>
                </select>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary">
                <i className="bi bi-check-lg"></i> Apply Block Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        multiple={pickerMode === 'gallery'}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectMedia={pickerMode === 'gallery' ? handleSelectMediaForGallery : handleSelectMediaForImage}
      />
    </>
  );
}
