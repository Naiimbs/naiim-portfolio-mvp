import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getSectionComponent } from './sectionRegistry';
import { PAGE_SECTION_TYPES } from './sectionSchemas';
import { computeSectionStyleObject, scopeCustomCss } from './styleSystem';
import { getLayoutContainerStyle, resolveResponsiveColumns } from './layoutSystem';

/**
 * Generic Page Renderer for Site-Wide CMS.
 *
 * Supports two operating modes:
 * 1. Public Runtime Mode (default, when onSelectSection is null):
 *    - Renders only published, visible sections (is_visible !== false)
 *    - No editor wrappers, borders, or action toolbars
 *    - Strict fail-safe rendering (unknown section types fail gracefully)
 *
 * 2. Visual Builder Mode (when onSelectSection is provided):
 *    - Renders all sections in authoritative sort_order
 *    - Displays visible boundaries, labels, and selected state
 *    - Visual representation for hidden sections (dimmed with "Hidden" pill)
 *    - Quick action toolbars on selected or hovered sections
 */
export default function PageRenderer({
  page,
  sections = [],
  loading = false,
  error = null,
  activeSectionId = null,
  viewport = 'desktop',
  onSelectSection = null,
  onMoveSection = null,
  onToggleVisibility = null,
  onDuplicateSection = null,
  onDeleteSection = null,
  onInsertSection = null,
}) {
  const isEditorMode = Boolean(onSelectSection);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading page...</span>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container py-5 text-center">
        <h2 className="fw-bold mb-2">Page Not Found</h2>
        <p className="text-muted mb-4">{error ? error.message || 'The requested page could not be loaded.' : 'This page does not exist.'}</p>
        <a href="/" className="btn btn-outline-dark rounded-pill">
          Return Home
        </a>
      </div>
    );
  }

  // In editor mode, show all sections so author can inspect and unhide hidden sections.
  // In public runtime mode, filter strictly for visible sections.
  const displaySections = sections
    .filter((sec) => sec && (isEditorMode || sec.is_visible !== false))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className={`cms-page-wrapper page-template-${page.template || 'default'}`}>
      <Helmet>
        <title>{page.seo_title || page.title || 'Naïm Bsili — Portfolio'}</title>
        {page.seo_description && <meta name="description" content={page.seo_description} />}
        {page.canonical_url && <link rel="canonical" href={page.canonical_url} />}
      </Helmet>

      <main className="cms-page-content">
        {displaySections.length > 0 ? (
          displaySections.map((sec, idx) => {
            const SectionComp = getSectionComponent(sec.section_type);
            const isSelected = isEditorMode && activeSectionId && String(sec.id) === String(activeSectionId);
            const isHidden = sec.is_visible === false;
            const schemaMeta = PAGE_SECTION_TYPES[sec.section_type] || {};
            const rawLabel = sec.label || schemaMeta.label || sec.section_type;
            const sectionLabel = typeof rawLabel === 'string' ? rawLabel : (schemaMeta.label || String(sec.section_type || 'Section'));

            if (!SectionComp) {
              if (isEditorMode) {
                return (
                  <div
                    key={sec.id || idx}
                    className="p-3 my-3 border border-danger border-dashed rounded-3 bg-danger bg-opacity-10 text-danger text-center"
                    onClick={() => onSelectSection(sec.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Unknown section type <code>{sec.section_type}</code>. Click to inspect or remove.
                  </div>
                );
              }
              // In production: graceful fallback without crashing
              return null;
            }

            const customClass = sec.config?.customClassName ? String(sec.config.customClassName).trim() : '';
            const sectionStyles = computeSectionStyleObject(sec.config?.style, viewport);
            const scopedCss = sec.config?.style?.customCss ? scopeCustomCss(sec.config.style.customCss, sec.id) : null;
            const layoutConfig = sec.config?.layout;
            const resolvedCols = layoutConfig ? resolveResponsiveColumns(layoutConfig, viewport) : null;
            const layoutGridStyle = layoutConfig ? getLayoutContainerStyle(layoutConfig, viewport) : null;
            // For a single full-width column [12], skip the grid wrapper so the section naturally fills 100% width.
            const isSingleFullWidth = !resolvedCols || (resolvedCols.length === 1 && Number(resolvedCols[0]) === 12);
            const needsGridWrapper = Boolean(resolvedCols && !isSingleFullWidth);

            const containerWidth = layoutConfig?.containerWidth;
            const containerWidthStyle = containerWidth === 'narrow'
              ? { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }
              : containerWidth === 'wide'
              ? { maxWidth: '1440px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }
              : containerWidth === 'full'
              ? { maxWidth: '100%', width: '100%' }
              : { width: '100%' };
            const combinedSectionStyles = { ...sectionStyles, ...containerWidthStyle };

            if (isEditorMode) {
              return (
                <React.Fragment key={sec.id || idx}>
                  {/* Inline insertion divider before each section in editor mode */}
                  {onInsertSection && (
                    <div
                      className="builder-insert-divider my-2 d-flex justify-content-center align-items-center position-relative opacity-50 hover-opacity-100 transition-all"
                      style={{ height: '24px' }}
                    >
                      <hr className="w-100 position-absolute" style={{ borderColor: '#dee2e6', zIndex: 1 }} />
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-primary bg-white rounded-pill px-3 shadow-sm position-relative d-inline-flex align-items-center"
                        style={{ fontSize: '0.68rem', zIndex: 2, height: '22px', lineHeight: '20px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInsertSection(idx);
                        }}
                        title={`Insert new section before #${idx + 1}`}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Section Here
                      </button>
                    </div>
                  )}

                  <div
                    id={`builder-section-${sec.id}`}
                    className={`cms-canvas-section-container position-relative transition-all mb-3 ${
                      isSelected
                        ? 'border border-2 border-primary rounded-4 shadow-sm bg-white'
                        : 'border border-1 border-secondary border-opacity-25 rounded-4 bg-white hover-border-primary'
                    } ${isHidden ? 'opacity-75 bg-light' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSection(sec.id);
                    }}
                    style={{
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Floating Editor Action Bar on Top of Section */}
                    <div
                      className={`d-flex justify-content-between align-items-center px-3 py-1 border-bottom rounded-top-4 ${
                        isSelected ? 'bg-primary text-white' : 'bg-light text-dark'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate">
                        <span className={`badge ${isSelected ? 'bg-white text-primary' : 'bg-secondary bg-opacity-10 text-secondary border'}`}>
                          #{idx + 1}
                        </span>
                        <strong className="text-truncate">{sectionLabel}</strong>
                        <span className={`badge rounded-pill ${isSelected ? 'builder-section-selected-badge' : 'bg-light text-muted border'}`} style={{ fontSize: '0.65rem' }}>
                          {sec.section_type}
                        </span>
                        {isHidden && (
                          <span className="badge bg-warning text-dark border border-warning" style={{ fontSize: '0.65rem' }}>
                            <i className="bi bi-eye-slash me-1"></i> Hidden from Public
                          </span>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {onMoveSection && (
                          <>
                            <button
                              type="button"
                              className={`btn btn-sm p-0 px-1 border-0 ${isSelected ? 'text-white' : 'text-dark'}`}
                              disabled={idx === 0}
                              onClick={() => onMoveSection(idx, -1)}
                              title="Move Up"
                            >
                              <i className="bi bi-chevron-up"></i>
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm p-0 px-1 border-0 ${isSelected ? 'text-white' : 'text-dark'}`}
                              disabled={idx === displaySections.length - 1}
                              onClick={() => onMoveSection(idx, 1)}
                              title="Move Down"
                            >
                              <i className="bi bi-chevron-down"></i>
                            </button>
                          </>
                        )}

                        {onToggleVisibility && (
                          <button
                            type="button"
                            className={`btn btn-sm p-0 px-1 border-0 ms-1 ${isSelected ? 'text-white' : 'text-muted'}`}
                            onClick={() => onToggleVisibility(sec)}
                            title={sec.is_visible ? 'Hide section from public' : 'Make section visible to public'}
                          >
                            <i className={`bi bi-${sec.is_visible ? 'eye' : 'eye-slash'}`}></i>
                          </button>
                        )}

                        {onDuplicateSection && (
                          <button
                            type="button"
                            className={`btn btn-sm p-0 px-1 border-0 ms-1 ${isSelected ? 'text-white' : 'text-muted'}`}
                            onClick={() => onDuplicateSection(sec)}
                            title="Duplicate Section"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                        )}

                        {onDeleteSection && (
                          <button
                            type="button"
                            className={`btn btn-sm p-0 px-1 border-0 ms-1 ${isSelected ? 'text-white text-opacity-75' : 'text-danger'}`}
                            onClick={() => onDeleteSection(sec)}
                            title="Delete Section"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Section Render Output - Unconstrained live section parity */}
                    <div
                      className={`cms-canvas-section-body ${customClass || ''}`}
                      data-section-id={sec.id}
                      style={combinedSectionStyles}
                    >
                      {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
                      {needsGridWrapper && layoutGridStyle ? (
                        <div className="cms-layout-grid-container" style={layoutGridStyle}>
                          {resolvedCols.map((span, colIdx) => (
                            <div key={colIdx} style={{ gridColumn: `span ${span}`, minWidth: 0, width: '100%' }}>
                              {colIdx === 0 ? <SectionComp config={sec.config || {}} section={sec} /> : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ width: '100%' }}>
                          <SectionComp config={sec.config || {}} section={sec} />
                        </div>
                      )}
                      {/* Editor placeholder for components that return null or minimal height */}
                      {isEditorMode && !needsGridWrapper && (
                        <div style={{ minHeight: '6px' }} />
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            // Public runtime render
            return (
              <div
                key={sec.id || idx}
                className={customClass || undefined}
                data-section-id={sec.id}
                style={combinedSectionStyles}
              >
                {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
                {needsGridWrapper && layoutGridStyle ? (
                  <div className="cms-layout-grid-container" style={layoutGridStyle}>
                    {resolvedCols.map((span, colIdx) => (
                      <div key={colIdx} style={{ gridColumn: `span ${span}`, minWidth: 0, width: '100%' }}>
                        {colIdx === 0 ? <SectionComp config={sec.config || {}} section={sec} /> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    <SectionComp config={sec.config || {}} section={sec} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="container py-5 text-center">
            <h1 className="display-5 fw-bold mb-3">{page.title}</h1>
            <p className="text-muted">
              {isEditorMode
                ? 'This page has no sections yet. Click "+ Add Section" to add content.'
                : 'This page currently has no published content sections.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
