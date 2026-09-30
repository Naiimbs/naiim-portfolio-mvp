import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageRenderer from '../../components/cms/PageRenderer';
import SectionPropertyEditor from '../components/cms/editors/SectionPropertyEditor';
import AddSectionModal from '../components/cms/AddSectionModal';
import {
  getAdminPages,
  updatePage,
  getAdminPageSections,
  createPageSection,
  updatePageSection,
  deletePageSection,
} from '../../services/siteCms';

export default function AdminPageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState('section'); // 'section' | 'page'

  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Unsaved changes tracking
  const [isPageDirty, setIsPageDirty] = useState(false);
  const [dirtySectionIds, setDirtySectionIds] = useState(new Set());

  // UI state
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'mobile'
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  useEffect(() => {
    loadPageAndSections();
  }, [id]);

  async function loadPageAndSections() {
    setLoading(true);
    const pagesRes = await getAdminPages();
    const target = (pagesRes.data || []).find((p) => String(p.id) === String(id));
    if (!target) {
      setPage(null);
      setLoading(false);
      return;
    }
    setPage(target);

    const secRes = await getAdminPageSections(target.id);
    const loadedSecs = secRes.data || [];
    setSections(loadedSecs);

    if (loadedSecs.length > 0 && !activeSectionId) {
      setActiveSectionId(loadedSecs[0].id);
    }
    setLoading(false);
  }

  const activeSection = sections.find((s) => String(s.id) === String(activeSectionId)) || null;

  // In-memory update of section config (updates center preview live)
  const handleSectionChange = (updatedSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
    setDirtySectionIds(new Set([...dirtySectionIds, updatedSection.id]));
  };

  const handleSaveActiveSection = async () => {
    if (!activeSection) return;
    setSavingSection(true);
    setFeedback(null);

    const res = await updatePageSection(activeSection.id, {
      label: activeSection.label,
      section_type: activeSection.section_type,
      sort_order: activeSection.sort_order,
      is_visible: activeSection.is_visible,
      config: activeSection.config,
    });

    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save section.' });
    } else {
      setFeedback({ type: 'success', message: `Section "${activeSection.label}" saved.` });
      const nextDirty = new Set(dirtySectionIds);
      nextDirty.delete(activeSection.id);
      setDirtySectionIds(nextDirty);
    }
    setSavingSection(false);
  };

  const handleSavePageMetadata = async (e) => {
    if (e) e.preventDefault();
    setSavingPage(true);
    setFeedback(null);

    const res = await updatePage(id, page);
    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save page settings.' });
    } else {
      setFeedback({ type: 'success', message: 'Page settings saved successfully.' });
      setIsPageDirty(false);
      if (res.data) setPage(res.data);
    }
    setSavingPage(false);
  };

  const handleAddSection = async (type, label) => {
    if (!page) return;

    const sortOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order || 0)) + 10 : 10;
    const res = await createPageSection({
      page_id: page.id,
      section_type: type,
      label,
      sort_order: sortOrder,
      is_visible: true,
      config: {},
    });

    if (res.data) {
      setSections([...sections, res.data]);
      setActiveSectionId(res.data.id);
      setActiveTab('section');
    }
  };

  const handleToggleVisibility = async (sec) => {
    const updated = { ...sec, is_visible: !sec.is_visible };
    await updatePageSection(sec.id, { is_visible: updated.is_visible });
    setSections(sections.map((s) => (s.id === sec.id ? updated : s)));
  };

  const handleMoveSection = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSecs = [...sections];
    const temp = newSecs[index];
    newSecs[index] = newSecs[targetIdx];
    newSecs[targetIdx] = temp;

    newSecs.forEach((sec, idx) => {
      sec.sort_order = (idx + 1) * 10;
      updatePageSection(sec.id, { sort_order: sec.sort_order });
    });

    setSections(newSecs);
  };

  const handleDeleteSection = async (secId) => {
    if (!window.confirm('Delete this section component?')) return;
    await deletePageSection(secId);
    const remaining = sections.filter((s) => s.id !== secId);
    setSections(remaining);
    if (activeSectionId === secId) {
      setActiveSectionId(remaining[0]?.id || null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading builder...</span>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-4 text-center">
        <h4>Page Not Found</h4>
        <Link to="/admin/pages" className="btn btn-outline-dark rounded-pill mt-3">
          Back to Pages
        </Link>
      </div>
    );
  }

  const isAnyDirty = isPageDirty || dirtySectionIds.size > 0;

  return (
    <div className="admin-visual-builder d-flex flex-column" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top Action Bar */}
      <div className="builder-topbar bg-dark text-white px-3 py-2 d-flex justify-content-between align-items-center shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <Link to="/admin/pages" className="btn btn-sm btn-outline-light rounded-circle p-1" style={{ width: '32px', height: '32px' }} title="Back to Pages">
            <i className="bi bi-arrow-left"></i>
          </Link>
          <div>
            <h6 className="mb-0 fw-bold">{page.title}</h6>
            <small className="text-light opacity-75 font-monospace">/p/{page.slug}</small>
          </div>
          <span className={`badge bg-${page.status === 'published' ? 'success' : 'warning text-dark'} ms-2`}>
            {page.status}
          </span>
          {isAnyDirty && <span className="badge bg-warning text-dark">Unsaved Changes</span>}
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Viewport toggle */}
          <div className="btn-group btn-group-sm bg-secondary rounded-pill p-1">
            <button
              className={`btn btn-sm rounded-pill border-0 text-white ${previewViewport === 'desktop' ? 'bg-primary' : 'bg-transparent'}`}
              onClick={() => setPreviewViewport('desktop')}
            >
              <i className="bi bi-display me-1"></i> Desktop
            </button>
            <button
              className={`btn btn-sm rounded-pill border-0 text-white ${previewViewport === 'mobile' ? 'bg-primary' : 'bg-transparent'}`}
              onClick={() => setPreviewViewport('mobile')}
            >
              <i className="bi bi-phone me-1"></i> Mobile
            </button>
          </div>

          <a href={`/p/${page.slug}?preview=true`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-light rounded-pill px-3">
            <i className="bi bi-box-arrow-up-right me-1"></i> Preview (New Tab)
          </a>

          <button className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold" onClick={handleSavePageMetadata} disabled={savingPage}>
            {savingPage ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>

      {feedback && <div className={`alert alert-${feedback.type} mb-0 py-2 rounded-0`}>{feedback.message}</div>}

      {/* Main 3-Column Layout */}
      <div className="builder-main flex-grow-1 d-flex overflow-hidden">
        {/* LEFT COLUMN: SECTIONS LIST */}
        <div className="builder-col-left border-end bg-light d-flex flex-column" style={{ width: '280px', minWidth: '280px' }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
            <h6 className="fw-bold mb-0">Sections ({sections.length})</h6>
            <button className="btn btn-sm btn-primary rounded-pill" onClick={() => setShowAddSectionModal(true)}>
              <i className="bi bi-plus-lg me-1"></i> Add
            </button>
          </div>

          <div className="sections-list flex-grow-1 overflow-auto p-2">
            {sections.length > 0 ? (
              sections.map((sec, idx) => {
                const isActive = String(sec.id) === String(activeSectionId);
                const isSecDirty = dirtySectionIds.has(sec.id);

                return (
                  <div
                    key={sec.id}
                    className={`section-row p-2 mb-2 rounded-3 border bg-white cursor-pointer transition-all ${
                      isActive ? 'border-primary shadow-sm bg-primary bg-opacity-10' : 'border-light'
                    } ${!sec.is_visible ? 'opacity-50' : ''}`}
                    onClick={() => {
                      setActiveSectionId(sec.id);
                      setActiveTab('section');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center text-truncate me-2">
                        <i className="bi bi-grip-vertical text-muted me-1"></i>
                        <div>
                          <div className="fw-semibold text-truncate small">
                            {sec.label || 'Untitled Section'}
                            {isSecDirty && <span className="ms-1 text-warning">•</span>}
                          </div>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: '0.65rem' }}>
                            {sec.section_type}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark p-0"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSection(idx, -1);
                          }}
                        >
                          <i className="bi bi-chevron-up"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-dark p-0"
                          disabled={idx === sections.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSection(idx, 1);
                          }}
                        >
                          <i className="bi bi-chevron-down"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-muted p-0 ms-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(sec);
                          }}
                        >
                          <i className={`bi bi-${sec.is_visible ? 'eye' : 'eye-slash'}`}></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 ms-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(sec.id);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted small">
                No sections added yet. Click "+ Add" to create a section.
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: LIVE PAGE PREVIEW */}
        <div className="builder-col-center flex-grow-1 bg-secondary bg-opacity-10 d-flex flex-column overflow-hidden position-relative">
          <div className="preview-toolbar bg-white border-bottom px-3 py-1 d-flex justify-content-between align-items-center">
            <span className="small text-muted fw-semibold">
              <i className="bi bi-eye me-1"></i> Live Unsaved Editor Preview Mode
            </span>
            <span className="small text-muted">{previewViewport === 'mobile' ? 'Mobile Frame (375px)' : 'Full Width Frame'}</span>
          </div>

          <div className="preview-canvas-wrapper flex-grow-1 overflow-auto p-4 d-flex justify-content-center">
            <div
              className={`preview-canvas bg-white shadow-lg rounded-4 overflow-hidden transition-all ${
                previewViewport === 'mobile' ? 'w-100 max-w-sm my-auto border border-3 border-dark' : 'w-100'
              }`}
              style={{ maxWidth: previewViewport === 'mobile' ? '375px' : '100%', minHeight: '100%' }}
            >
              {/* Renders center preview with live in-memory page & sections state */}
              <PageRenderer page={page} sections={sections} loading={false} error={null} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROPERTIES PANEL */}
        <div className="builder-col-right border-start bg-white d-flex flex-column" style={{ width: '360px', minWidth: '360px' }}>
          {/* Header Tabs */}
          <ul className="nav nav-tabs border-bottom px-2 pt-2 bg-light">
            <li className="nav-item">
              <button
                className={`nav-link small fw-semibold py-2 ${activeTab === 'section' ? 'active' : ''}`}
                onClick={() => setActiveTab('section')}
              >
                Section Properties
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link small fw-semibold py-2 ${activeTab === 'page' ? 'active' : ''}`}
                onClick={() => setActiveTab('page')}
              >
                Page Settings
              </button>
            </li>
          </ul>

          <div className="properties-content flex-grow-1 overflow-auto">
            {activeTab === 'section' ? (
              <SectionPropertyEditor
                section={activeSection}
                onChange={handleSectionChange}
                onSave={handleSaveActiveSection}
                dirty={activeSection ? dirtySectionIds.has(activeSection.id) : false}
              />
            ) : (
              <div className="p-3">
                <h6 className="fw-bold mb-3">Page Metadata & SEO</h6>
                <form onSubmit={handleSavePageMetadata}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      value={page.title || ''}
                      onChange={(e) => {
                        setPage({ ...page, title: e.target.value });
                        setIsPageDirty(true);
                      }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Slug (URL)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      value={page.slug || ''}
                      onChange={(e) => {
                        setPage({ ...page, slug: e.target.value });
                        setIsPageDirty(true);
                      }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Publish Status</label>
                    <select
                      className="form-select form-select-sm rounded-3"
                      value={page.status || 'draft'}
                      onChange={(e) => {
                        setPage({ ...page, status: e.target.value });
                        setIsPageDirty(true);
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Template</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      value={page.template || 'default'}
                      onChange={(e) => {
                        setPage({ ...page, template: e.target.value });
                        setIsPageDirty(true);
                      }}
                    />
                  </div>
                  <hr />
                  <h6 className="fw-bold mb-3">SEO</h6>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">SEO Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      value={page.seo_title || ''}
                      onChange={(e) => {
                        setPage({ ...page, seo_title: e.target.value });
                        setIsPageDirty(true);
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">SEO Description</label>
                    <textarea
                      className="form-control form-control-sm rounded-3"
                      rows="3"
                      value={page.seo_description || ''}
                      onChange={(e) => {
                        setPage({ ...page, seo_description: e.target.value });
                        setIsPageDirty(true);
                      }}
                    />
                  </div>

                  <button type="submit" className="btn btn-sm btn-primary rounded-pill w-100 py-2 mt-2" disabled={savingPage}>
                    {savingPage ? 'Saving...' : 'Save Page Settings'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Section Categorized Modal */}
      <AddSectionModal
        show={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
