import React, { useState, useEffect, useMemo } from 'react';
import { getCategorizedSectionTypes } from '../../../components/cms/sectionSchemas';
import {
  LAYOUT_PRESETS,
  getLayoutPresetById,
  resolveResponsiveColumns,
} from '../../../components/cms/layoutSystem';

export default function AddSectionModal({ show, onClose, onAddSection }) {
  const CATEGORIZED_SECTIONS = useMemo(() => getCategorizedSectionTypes(), []);
  const [step, setStep] = useState(1); // 1: Select Type, 2: Select Layout
  const [selectedType, setSelectedType] = useState('hero');
  const [selectedLayoutId, setSelectedLayoutId] = useState('12');
  const [label, setLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // ESC to close modal
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  if (!show) return null;

  const handleModalClose = () => {
    setStep(1);
    setLabel('');
    setSearchQuery('');
    setActiveCategory('ALL');
    setSelectedLayoutId('12');
    onClose();
  };

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
  const selectedPreset = getLayoutPresetById(selectedLayoutId) || LAYOUT_PRESETS[0];

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleCreateSection = (e) => {
    if (e) e.preventDefault();
    const targetType = selectedItem ? selectedItem.type : selectedType;
    const defaultLabel = label.trim() || selectedItem?.name || `${targetType.toUpperCase()} Section`;

    const layoutConfig = {
      presetId: selectedPreset.id,
      columns: [...selectedPreset.columns],
      gap: 'md',
      alignment: 'stretch',
      responsiveRules: {
        desktop: [...(selectedPreset.responsiveRules?.desktop || selectedPreset.columns)],
        tablet: selectedPreset.responsiveRules?.tablet ? [...selectedPreset.responsiveRules.tablet] : null,
        mobile: selectedPreset.responsiveRules?.mobile ? [...selectedPreset.responsiveRules.mobile] : null,
      },
    };

    onAddSection(targetType, defaultLabel, layoutConfig);
    handleModalClose();
  };

  const handleItemSelectAndAdvance = (item) => {
    setSelectedType(item.type);
    setStep(2);
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
        if (e.target === e.currentTarget) handleModalClose();
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
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2" style={{ fontSize: '0.7rem' }}>
                  Step {step} of 2
                </span>
                <h5 className="modal-title fw-bold mb-0" id="add-section-modal-title">
                  {step === 1 ? 'Choose Section Component' : 'Select Layout & Responsive Grid'}
                </h5>
              </div>
              <p className="text-muted small mb-0">
                {step === 1
                  ? 'Choose a structured section component from the authoritative registry to insert into your page.'
                  : `Configuring layout structure for ${selectedItem?.name || selectedType} component.`}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleModalClose}
            ></button>
          </div>

          {/* STEP 1: COMPONENT SELECTION */}
          {step === 1 && (
            <>
              {/* Fixed Search & Category Filter Toolbar */}
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

              {/* Internal Scroll Area for Section Components */}
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
                                onDoubleClick={() => handleItemSelectAndAdvance(item)}
                                title="Click to select, double-click to configure layout"
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
                      No components match &quot;{searchQuery}&quot; {activeCategory !== 'ALL' && `in category "${activeCategory}"`}.
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

              {/* Step 1 Footer */}
              <div className="modal-footer border-top bg-light px-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0">
                <div className="text-muted small">
                  {selectedItem ? (
                    <span>
                      Selected: <strong className="text-dark">{selectedItem.name}</strong> (<code>{selectedItem.type}</code>)
                    </span>
                  ) : (
                    <span>{totalFilteredItems} components available</span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-light rounded-pill px-3" onClick={handleModalClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold shadow-sm"
                    onClick={handleNextStep}
                    disabled={!selectedItem}
                  >
                    Next: Choose Layout <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: LAYOUT SELECTION & RESPONSIVE PREVIEW */}
          {step === 2 && (
            <>
              <div className="modal-body p-4 flex-grow-1 overflow-y-auto">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">Visual 12-Column Layout Presets</h6>
                      <small className="text-muted">Select the column track structure for this section.</small>
                    </div>
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1">
                      {selectedItem?.name}
                    </span>
                  </div>

                  <div className="row g-3">
                    {LAYOUT_PRESETS.filter((p) => p.id !== 'custom').map((p) => {
                      const isSelected = selectedLayoutId === p.id;
                      return (
                        <div key={p.id} className="col-12 col-md-6">
                          <div
                            className={`card h-100 rounded-3 p-3 transition-all border ${
                              isSelected
                                ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                                : 'border-light-subtle bg-white hover-shadow'
                            }`}
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            onClick={() => setSelectedLayoutId(p.id)}
                            onDoubleClick={handleCreateSection}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="fw-bold mb-0 text-dark small">{p.name}</h6>
                              {isSelected && (
                                <span className="badge bg-primary text-white rounded-pill" style={{ fontSize: '0.65rem' }}>
                                  <i className="bi bi-check2"></i> Selected
                                </span>
                              )}
                            </div>

                            {/* Visual Bar Diagram */}
                            <div className="d-flex gap-1 bg-light p-1 rounded-2 mb-2" style={{ height: '22px' }}>
                              {p.columns.map((span, idx) => (
                                <div
                                  key={idx}
                                  className={`rounded-1 d-flex align-items-center justify-content-center text-white fw-bold ${
                                    isSelected ? 'bg-primary' : 'bg-secondary bg-opacity-75'
                                  }`}
                                  style={{ flex: span, fontSize: '0.65rem' }}
                                >
                                  {span}
                                </div>
                              ))}
                            </div>

                            <p className="card-text text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                              {p.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Responsive Inheritance Preview Box */}
                <div className="card border-0 bg-light rounded-3 p-3 mt-3">
                  <h6 className="fw-bold mb-2 small text-uppercase text-secondary">
                    <i className="bi bi-phone-landscape me-1 text-primary" /> Responsive Behavior Preview
                  </h6>
                  <div className="row g-2 text-center">
                    <div className="col-4">
                      <div className="bg-white p-2 rounded-2 border">
                        <i className="bi bi-display d-block text-muted mb-1" />
                        <span className="small text-muted d-block" style={{ fontSize: '0.7rem' }}>
                          Desktop (≥1024px)
                        </span>
                        <strong className="text-dark small">
                          {resolveResponsiveColumns(selectedPreset, 'desktop').join(' : ')}
                        </strong>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-white p-2 rounded-2 border">
                        <i className="bi bi-tablet d-block text-muted mb-1" />
                        <span className="small text-muted d-block" style={{ fontSize: '0.7rem' }}>
                          Tablet (768-1023px)
                        </span>
                        <strong className="text-dark small">
                          {resolveResponsiveColumns(selectedPreset, 'tablet').join(' : ')}
                        </strong>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-white p-2 rounded-2 border">
                        <i className="bi bi-phone d-block text-muted mb-1" />
                        <span className="small text-muted d-block" style={{ fontSize: '0.7rem' }}>
                          Mobile (&lt;768px)
                        </span>
                        <strong className="text-dark small">
                          {resolveResponsiveColumns(selectedPreset, 'mobile').join(' : ')} (Stacked)
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Footer */}
              <div className="modal-footer border-top bg-light px-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0">
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={handlePrevStep}>
                  <i className="bi bi-arrow-left me-1"></i> Back to Components
                </button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-light rounded-pill px-3" onClick={handleModalClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold shadow-sm"
                    onClick={handleCreateSection}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Create Section
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
