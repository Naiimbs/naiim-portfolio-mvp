import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAdminCaseStudyById, saveFullCaseStudy } from '../../services/caseStudies';
import { getAdminContentRegistry } from '../../services/contentRegistry';
import { isSupabaseConfigured } from '../../lib/supabase';
import SectionList from '../components/case-study-editor/SectionList';
import SectionDrawer from '../components/case-study-editor/SectionDrawer';
import AddSectionModal from '../components/case-study-editor/AddSectionModal';

export default function AdminCaseStudyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [isDirty, setIsDirty] = useState(false);

  // Settings & Sections state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    seo_title: '',
    seo_description: '',
    canonical_path: '',
    status: 'published',
  });
  const [sections, setSections] = useState([]);

  // Modals / Drawer state
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const [registryId, setRegistryId] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      // Check authoritative Content Registry first
      try {
        const regRes = await getAdminContentRegistry({ contentType: 'case-study' });
        if (regRes.data) {
          const match = regRes.data.find(
            (r) => String(r.id) === String(id) || r.slug === id
          );
          if (match) {
            setRegistryId(match.id);
          }
        }
      } catch (e) {
        console.warn('Could not query content registry in legacy editor:', e);
      }

      const res = await getAdminCaseStudyById(id);
      if (res.data) {
        const cs = res.data;
        setCaseStudy(cs);
        setFormData({
          title: cs.title || '',
          subtitle: cs.subtitle || '',
          seo_title: cs.seo_title || '',
          seo_description: cs.seo_description || '',
          canonical_path: cs.canonical_path || `/work/${cs.slug || id}`,
          status: cs.status || 'published',
        });
        setSections(cs.sections || []);
      } else {
        setError(res.error?.message || 'Case study not found');
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  // Warn before unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleReorderSections = (newSections) => {
    setSections(newSections.map((s, idx) => ({ ...s, order_index: idx + 1 })));
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleAddSection = (newSec) => {
    setSections((prev) => [...prev, { ...newSec, order_index: prev.length + 1 }]);
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleSaveSection = (updatedSec) => {
    setSections((prev) =>
      prev.map((s) => (s.id === updatedSec.id ? updatedSec : s))
    );
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleDuplicateSection = (sec) => {
    const duplicated = {
      ...JSON.parse(JSON.stringify(sec)),
      id: `sec-${Date.now()}`,
      title: `${sec.title} (Copy)`,
      order_index: sections.length + 1,
    };
    setSections((prev) => [...prev, duplicated]);
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleToggleSectionVisibility = (secId) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, is_visible: !s.is_visible } : s))
    );
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleDeleteSection = (secId) => {
    if (window.confirm('Are you sure you want to permanently remove this section?')) {
      setSections((prev) => prev.filter((s) => s.id !== secId));
      setIsDirty(true);
      setSaveStatus(null);
    }
  };

  const handleSave = async (targetStatus = formData.status) => {
    setSaving(true);
    setSaveStatus('saving');
    setError(null);

    const payload = {
      ...caseStudy,
      ...formData,
      status: targetStatus,
      sections,
    };

    const res = await saveFullCaseStudy(caseStudy.id || id, payload);

    if (res.error) {
      setError(res.error.message || 'Failed to save case study');
      setSaveStatus('error');
    } else {
      setFormData((prev) => ({ ...prev, status: targetStatus }));
      setSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-card text-center py-5 text-muted">
        <div className="spinner-border text-success mb-3" role="status"></div>
        <div>Loading case study workspace...</div>
      </div>
    );
  }

  if (error && !caseStudy) {
    return (
      <div className="admin-card text-center py-5">
        <i className="bi bi-exclamation-circle fs-1 text-danger mb-3"></i>
        <h3 className="fs-5 fw-bold">Case Study Not Found</h3>
        <p className="text-muted small">{error}</p>
        <Link to="/admin/case-studies" className="admin-btn admin-btn-secondary mt-3">
          ← Return to Case Studies
        </Link>
      </div>
    );
  }

  const isCustom = caseStudy?.type === 'custom';
  const previewSlug = caseStudy?.slug || id;

  return (
    <div>
      <Helmet>
        <title>{`Edit: ${formData.title || id} — Case Study CMS`}</title>
      </Helmet>

      {/* Top Header Bar */}
      <div className="admin-editor-header mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/admin/case-studies" className="text-muted small text-decoration-none">
              ← Case Studies
            </Link>
            <span className="text-muted small">/</span>
            <span className={`admin-badge ${isCustom ? 'draft' : 'published'}`} style={{ fontSize: '0.68rem' }}>
              {isCustom ? 'Custom React Case Study' : 'Standard CMS Case Study'}
            </span>
            {isDirty && (
              <span className="badge bg-warning text-dark" style={{ fontSize: '0.68rem' }}>
                Unsaved changes
              </span>
            )}
          </div>
          <h2 className="fs-3 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formData.title || id}
          </h2>
          <p className="text-muted small mb-0">{formData.subtitle || 'Editorial Case Study'}</p>
        </div>

        {/* Header Actions */}
        <div className="d-flex align-items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-muted small me-2">
              <span className="spinner-border spinner-border-sm text-success me-1"></span> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-success small me-2 fw-semibold">
              <i className="bi bi-check-circle-fill me-1"></i> Saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-danger small me-2">
              <i className="bi bi-x-circle-fill me-1"></i> Save failed
            </span>
          )}

          <Link
            to={`/work/${previewSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-secondary"
            title="Preview Live Page"
          >
            <i className="bi bi-eye"></i> Preview
          </Link>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            Save Draft
          </button>

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            <i className="bi bi-cloud-upload"></i> Publish
          </button>
        </div>
      </div>

      {registryId && (
        <div className="admin-alert mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <i className="bi bi-exclamation-triangle-fill text-warning fs-5 flex-shrink-0" />
          <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
            <div>
              <strong>Legacy Editor Notice:</strong> This case study is authoritatively managed in the <strong>Content Registry</strong>. Changes made in this legacy editor will NOT be reflected on the public <code>/work/:slug</code> route.
            </div>
            <Link to={`/admin/registry/${registryId}`} className="admin-btn admin-btn-primary btn-sm py-1 px-3 text-nowrap">
              <i className="bi bi-box-arrow-up-right me-1" /> Open Authoritative CMS Editor
            </Link>
          </div>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-4">
          <i className="bi bi-info-circle-fill"></i>
          <div>
            <strong>Local Mode Active:</strong> Supabase credentials are not detected in <code>.env</code>. The Visual Editor is operating on local snapshot data. Changes will simulate locally.
          </div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Custom React Case Study Banner */}
      {isCustom && (
        <div className="admin-card p-4 mb-4" style={{ borderLeft: '4px solid var(--yellow, #eab52e)' }}>
          <div className="d-flex gap-3">
            <i className="bi bi-code-square fs-2 text-warning"></i>
            <div>
              <h4 className="fs-5 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Custom React Case Study
              </h4>
              <p className="text-muted small mb-2">
                This case study contains bespoke interactive React components (visual simulation modules, telemetry toggles, physical-to-digital flows). Its interactive section architecture is maintained directly in React (<code>src/pages/custom-case-studies/</code>).
              </p>
              <p className="text-muted small mb-0">
                You can edit the case study&apos;s title, subtitle, SEO metadata, canonical path, and publication status below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Case Study Settings */}
      <div className="admin-card mb-4">
        <h3 className="fs-6 fw-bold mb-3 text-uppercase text-muted" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.08em' }}>
          Case Study Settings & SEO
        </h3>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">Case Study Title *</label>
              <input
                type="text"
                name="title"
                className="admin-form-input"
                value={formData.title}
                onChange={handleFieldChange}
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">Subtitle / Lead</label>
              <input
                type="text"
                name="subtitle"
                className="admin-form-input"
                value={formData.subtitle}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">SEO Meta Title</label>
              <input
                type="text"
                name="seo_title"
                className="admin-form-input"
                value={formData.seo_title}
                onChange={handleFieldChange}
                placeholder="Title for search engines"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">Canonical Path</label>
              <input
                type="text"
                name="canonical_path"
                className="admin-form-input"
                value={formData.canonical_path}
                onChange={handleFieldChange}
                placeholder="/work/slug"
              />
            </div>
          </div>
          <div className="col-12">
            <div className="admin-form-group mb-0">
              <label className="admin-form-label">SEO Meta Description</label>
              <textarea
                name="seo_description"
                className="admin-form-textarea"
                rows="2"
                value={formData.seo_description}
                onChange={handleFieldChange}
                placeholder="Brief summary for Google search snippets and social sharing."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Workspace (for Standard Case Studies) */}
      {!isCustom && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Content Sections ({sections.length})
              </h3>
              <p className="text-muted small mb-0">
                Drag sections to reorder. Click &quot;Edit Section&quot; to manage content blocks.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setIsAddSectionOpen(true)}
            >
              <i className="bi bi-plus-lg"></i> Add Section
            </button>
          </div>

          {/* Section Overview List */}
          <SectionList
            sections={sections}
            onEditSection={(sec) => setActiveSection(sec)}
            onDuplicateSection={handleDuplicateSection}
            onToggleVisibility={handleToggleSectionVisibility}
            onDeleteSection={handleDeleteSection}
            onReorderSections={handleReorderSections}
          />

          <div className="text-center mt-4">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setIsAddSectionOpen(true)}
            >
              <i className="bi bi-plus-circle me-1"></i> Add Another Section
            </button>
          </div>
        </div>
      )}

      {/* Section Editor Drawer */}
      <SectionDrawer
        isOpen={Boolean(activeSection)}
        section={activeSection}
        onClose={() => setActiveSection(null)}
        onSaveSection={handleSaveSection}
      />

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
