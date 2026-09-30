import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAdminPages,
  updatePage,
  getAdminPageSections,
  createPageSection,
  updatePageSection,
  deletePageSection,
} from '../../services/siteCms';
import { SECTION_REGISTRY } from '../../components/cms/sectionRegistry';

const AVAILABLE_SECTION_TYPES = Object.keys(SECTION_REGISTRY);

export default function AdminPageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Add Section form state
  const [newSectionType, setNewSectionType] = useState('hero');
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

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
    setSections(secRes.data || []);
    setLoading(false);
  }

  const handleSavePageMetadata = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await updatePage(id, page);
    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save page metadata.' });
    } else {
      setFeedback({ type: 'success', message: 'Page metadata updated successfully.' });
      if (res.data) setPage(res.data);
    }
    setSaving(false);
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!page) return;

    const sortOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order || 0)) + 10 : 10;
    const res = await createPageSection({
      page_id: page.id,
      section_type: newSectionType,
      label: newSectionLabel.trim() || `${newSectionType.toUpperCase()} Section`,
      sort_order: sortOrder,
      is_visible: true,
      config: {},
    });

    if (res.data) {
      setSections([...sections, res.data]);
      setShowAddSection(false);
      setNewSectionLabel('');
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

    // Update sort_orders
    newSecs.forEach((sec, idx) => {
      sec.sort_order = (idx + 1) * 10;
      updatePageSection(sec.id, { sort_order: sec.sort_order });
    });

    setSections(newSecs);
  };

  const handleDeleteSection = async (secId) => {
    if (!window.confirm('Delete this section?')) return;
    await deletePageSection(secId);
    setSections(sections.filter((s) => s.id !== secId));
  };

  if (loading) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading editor...</span>
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

  return (
    <div className="admin-page-editor p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/pages" className="text-decoration-none text-muted small mb-1 d-inline-block">
            <i className="bi bi-arrow-left me-1"></i> Back to Pages
          </Link>
          <h1 className="h3 mb-0 fw-bold">Edit Page: {page.title}</h1>
        </div>
        <div className="d-flex gap-2">
          <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline-secondary rounded-pill">
            <i className="bi bi-box-arrow-up-right me-1"></i> Preview Page
          </a>
          <button className="btn btn-primary rounded-pill px-4" onClick={handleSavePageMetadata} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {feedback && <div className={`alert alert-${feedback.type} py-2 mb-4`}>{feedback.message}</div>}

      <div className="row g-4">
        {/* Page Metadata Settings */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-3">Page Metadata</h5>
            <form onSubmit={handleSavePageMetadata}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={page.title || ''}
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Slug (URL)</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={page.slug || ''}
                  onChange={(e) => setPage({ ...page, slug: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select className="form-select rounded-3" value={page.status || 'draft'} onChange={(e) => setPage({ ...page, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Template</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={page.template || 'default'}
                  onChange={(e) => setPage({ ...page, template: e.target.value })}
                />
              </div>
              <hr className="my-4" />
              <h6 className="fw-bold mb-3">SEO Settings</h6>
              <div className="mb-3">
                <label className="form-label fw-semibold">SEO Title</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={page.seo_title || ''}
                  onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">SEO Description</label>
                <textarea
                  className="form-control rounded-3"
                  rows="3"
                  value={page.seo_description || ''}
                  onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
                />
              </div>
            </form>
          </div>
        </div>

        {/* Page Sections Area */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Page Sections ({sections.length})</h5>
              <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => setShowAddSection(!showAddSection)}>
                <i className="bi bi-plus-lg me-1"></i> Add Section
              </button>
            </div>

            {/* Add Section Form */}
            {showAddSection && (
              <form onSubmit={handleAddSection} className="p-3 bg-light rounded-3 mb-4 border">
                <h6 className="fw-bold mb-3">New Section</h6>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Section Type</label>
                    <select className="form-select form-select-sm rounded-3" value={newSectionType} onChange={(e) => setNewSectionType(e.target.value)}>
                      {AVAILABLE_SECTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Label / Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      placeholder="e.g. Hero Banner"
                      value={newSectionLabel}
                      onChange={(e) => setNewSectionLabel(e.target.value)}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-sm btn-light rounded-pill" onClick={() => setShowAddSection(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary rounded-pill px-3">
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Sections Ordered List */}
            {sections.length > 0 ? (
              <div className="list-group list-group-flush rounded-3 border">
                {sections.map((sec, idx) => (
                  <div key={sec.id} className={`list-group-item p-3 d-flex align-items-center justify-content-between ${!sec.is_visible ? 'bg-light text-muted' : ''}`}>
                    <div className="d-flex align-items-center me-3">
                      <span className="badge bg-secondary me-3">{sec.sort_order}</span>
                      <div>
                        <div className="fw-semibold mb-0">
                          {sec.label || 'Untitled Section'}
                          {!sec.is_visible && <span className="badge bg-warning text-dark ms-2">Hidden</span>}
                        </div>
                        <small className="text-muted">Type: <code>{sec.section_type}</code></small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <button className="btn btn-sm btn-link text-dark p-1" title="Move Up" disabled={idx === 0} onClick={() => handleMoveSection(idx, -1)}>
                        <i className="bi bi-chevron-up"></i>
                      </button>
                      <button className="btn btn-sm btn-link text-dark p-1" title="Move Down" disabled={idx === sections.length - 1} onClick={() => handleMoveSection(idx, 1)}>
                        <i className="bi bi-chevron-down"></i>
                      </button>
                      <button
                        className={`btn btn-sm btn-outline-${sec.is_visible ? 'secondary' : 'success'} rounded-circle p-1 ms-1`}
                        style={{ width: '30px', height: '30px' }}
                        title={sec.is_visible ? 'Hide section' : 'Show section'}
                        onClick={() => handleToggleVisibility(sec)}
                      >
                        <i className={`bi bi-${sec.is_visible ? 'eye-slash' : 'eye'}`}></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger rounded-circle p-1 ms-1"
                        style={{ width: '30px', height: '30px' }}
                        title="Delete section"
                        onClick={() => handleDeleteSection(sec.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted bg-light rounded-3 border">
                <i className="bi bi-layers display-6 mb-2 d-block"></i>
                No sections added yet. Click "Add Section" to configure page content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
