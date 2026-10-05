import React, { useState, useEffect, useMemo } from 'react';
import { getCategorizedSectionTypes } from '../../../components/cms/sectionSchemas';

export default function AddSectionModal({ show, onClose, onAddSection }) {
  const CATEGORIZED_SECTIONS = useMemo(() => getCategorizedSectionTypes(), []);
  const [selectedType, setSelectedType] = useState('hero');
  const [label, setLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // ESC to close modal
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  // Filter categories and items based on search and selected category tab
  const filteredCategories = CATEGORIZED_SECTIONS.map((cat) => {
    if (activeCategory !== 'ALL' && cat.category !== activeCategory) {
      return { ...cat, items: [] };
    }
    const matchingItems = cat.items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        cat.category.toLowerCase().includes(q)
      );
    });
    return { ...cat, items: matchingItems };
  }).filter((cat) => cat.items.length > 0);

  const totalFilteredItems = filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  const allItems = CATEGORIZED_SECTIONS.flatMap((c) => c.items);
  const selectedItem = allItems.find((i) => i.type === selectedType) || allItems[0];

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const targetType = selectedItem ? selectedItem.type : selectedType;
    const defaultLabel = label.trim() || selectedItem?.name || `${targetType.toUpperCase()} Section`;
    onAddSection(targetType, defaultLabel);
    setLabel('');
    setSearchQuery('');
    setActiveCategory('ALL');
    onClose();
  };

  const handleItemSelectAndAdd = (item) => {
    setSelectedType(item.type);
    const defaultLabel = label.trim() || item.name;
    onAddSection(item.type, defaultLabel);
    setLabel('');
    setSearchQuery('');
    setActiveCategory('ALL');
    onClose();
  };

  return (
    <div
      className="modal d-block bg-dark bg-opacity-50"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-section-modal-title"
      style={{ zIndex: 1060 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        style={{ maxWidth: '820px', margin: '1.75rem auto' }}
      >
        <div
          className="modal-content rounded-4 border-0 shadow-lg overflow-hidden d-flex flex-column"
          style={{ maxHeight: '88vh', height: '88vh' }}
        >
          {/* 1. Fixed Header */}
          <div className="modal-header border-bottom bg-white px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
            <div>
              <h5 className="modal-title fw-bold mb-0" id="add-section-modal-title">
                <i className="bi bi-plus-circle text-primary me-2"></i>
                Add Section Component
              </h5>
              <p className="text-muted small mb-0 mt-1">
                Choose a structured section component from the authoritative registry to insert into your page layout.
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          {/* 2. Fixed Search & Category Filter Toolbar */}
          <div className="px-4 py-3 bg-light border-bottom flex-shrink-0">
            <div className="row g-2 align-items-center mb-2">
              <div className="col-12 col-md-7">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search sections by name, type, or keywords…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0 bg-white"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-5">
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="Optional section label (e.g. Main Hero)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="d-flex flex-wrap gap-1 align-items-center mt-2">
              <span className="text-muted small me-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category:
              </span>
              <button
                type="button"
                className={`btn btn-sm rounded-pill py-0 px-2 small ${activeCategory === 'ALL' ? 'btn-dark' : 'btn-outline-secondary bg-white'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setActiveCategory('ALL')}
              >
                All ({allItems.length})
              </button>
              {CATEGORIZED_SECTIONS.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  className={`btn btn-sm rounded-pill py-0 px-2 small ${activeCategory === cat.category ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setActiveCategory(cat.category)}
                >
                  <i className={`bi ${cat.icon} me-1`} style={{ fontSize: '0.7rem' }}></i>
                  {cat.category} ({cat.items.length})
                </button>
              ))}
            </div>
          </div>

          {/* 3. Internal Scroll Area for Section Components */}
          <div className="modal-body p-4 flex-grow-1 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div key={cat.category} className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <i className={`bi ${cat.icon} text-primary`}></i>
                    <span className="fw-bold small text-uppercase tracking-wider text-secondary" style={{ fontSize: '0.75rem' }}>
                      {cat.category}
                    </span>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill ms-auto" style={{ fontSize: '0.65rem' }}>
                      {cat.items.length} {cat.items.length === 1 ? 'component' : 'components'}
                    </span>
                  </div>

                  <div className="row g-3">
                    {cat.items.map((item) => {
                      const isSelected = item.type === selectedType;
                      return (
                        <div key={item.type} className="col-12 col-md-6">
                          <div
                            className={`card h-100 rounded-3 p-3 transition-all border ${
                              isSelected
                                ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                                : 'border-light-subtle bg-white hover-shadow'
                            }`}
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            onClick={() => setSelectedType(item.type)}
                            onDoubleClick={() => handleItemSelectAndAdd(item)}
                            title="Click to select, double-click to add immediately"
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className={`p-2 rounded-2 ${isSelected ? 'bg-primary text-white' : 'bg-light text-primary'}`}>
                                  <i className={`bi ${item.icon || 'bi-box'}`}></i>
                                </span>
                                <div>
                                  <h6 className="fw-bold mb-0 small text-dark">{item.name}</h6>
                                  <code className="text-muted" style={{ fontSize: '0.68rem' }}>{item.type}</code>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="badge bg-primary text-white rounded-pill" style={{ fontSize: '0.65rem' }}>
                                  <i className="bi bi-check2"></i> Selected
                                </span>
                              )}
                            </div>
                            <p className="card-text text-muted small mb-0 mt-1" style={{ fontSize: '0.78rem' }}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 my-4">
                <i className="bi bi-search display-6 text-muted mb-2 d-block"></i>
                <h6 className="fw-bold">No section components found</h6>
                <p className="text-muted small mb-3">
                  No components match "{searchQuery}" {activeCategory !== 'ALL' && `in category "${activeCategory}"`}.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  )}
                  {activeCategory !== 'ALL' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => setActiveCategory('ALL')}
                    >
                      Show All Categories
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Fixed Footer */}
          <div className="modal-footer border-top bg-light px-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0">
            <div className="text-muted small">
              {selectedItem ? (
                <span>
                  Adding: <strong className="text-dark">{selectedItem.name}</strong> (<code>{selectedItem.type}</code>)
                </span>
              ) : (
                <span>{totalFilteredItems} components available</span>
              )}
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-light rounded-pill px-3" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold shadow-sm"
                onClick={handleSubmit}
                disabled={!selectedItem}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Section
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
