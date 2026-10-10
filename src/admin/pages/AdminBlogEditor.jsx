import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getContentRegistryEntryById,
  createContentRegistryEntry,
  updateContentRegistryEntry,
  deleteContentRegistryEntry,
  checkSlugAvailable,
} from '../../services/contentRegistry';
import {
  calculateContentQuality,
  resolveContentSeo,
  addContentRelationship,
  removeContentRelationship,
  transitionContentStatus,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from '../../services/contentOperations';
import { normalizeSlug, getCanonicalRoute } from '../../services/contentRouteResolver';
import PageRenderer from '../../components/cms/PageRenderer';
import AddSectionModal from '../components/cms/AddSectionModal';
import SectionPropertyEditor from '../components/cms/editors/SectionPropertyEditor';
import { normalizeSectionConfig, PAGE_SECTION_TYPES } from '../../components/cms/sectionSchemas';
import { getLayoutPresetById } from '../../components/cms/layoutSystem';

export default function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [activeTab, setActiveTab] = useState('metadata'); // 'metadata' | 'content' | 'seo' | 'social' | 'relationships' | 'quality'
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [featured, setFeatured] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('Naïm Bsili');
  const [category, setCategory] = useState('AI & Architecture');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['AI', 'Product Design']);
  const [featuredImage, setFeaturedImage] = useState('');
  const [sections, setSections] = useState([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDesc, setOgDesc] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [relationships, setRelationships] = useState([]);

  // Visual Page Builder State & Handlers
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(null);
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  useEffect(() => {
    async function loadArticle() {
      if (isNew) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getContentRegistryEntryById(id);
      if (res.data) {
        const item = res.data;
        const meta = item.metadata || {};
        setTitle(item.title || '');
        setSlug(item.slug || '');
        setStatus(item.status || 'draft');
        setFeatured(Boolean(item.featured));
        setExcerpt(meta.excerpt || '');
        setAuthor(meta.author || 'Naïm Bsili');
        setCategory(meta.category || 'AI & Architecture');
        setTags(Array.isArray(meta.tags) ? meta.tags : []);
        setFeaturedImage(meta.featuredImage || '');
        const loadedSecs = Array.isArray(meta.sections) ? meta.sections : [];
        setSections(loadedSecs);
        if (loadedSecs.length > 0) {
          setActiveSectionId(loadedSecs[0].id);
        }
        setSeoTitle(meta.seo?.title || '');
        setSeoDesc(meta.seo?.description || '');
        setCanonicalUrl(meta.seo?.canonical || '');
        setOgTitle(meta.social?.ogTitle || '');
        setOgDesc(meta.social?.ogDescription || '');
        setOgImage(meta.social?.ogImage || '');
        setRelationships(Array.isArray(meta.relationships) ? meta.relationships : []);
      }
      setLoading(false);
    }
    loadArticle();
  }, [id, isNew]);

  const activeSection = sections.find((s) => String(s.id) === String(activeSectionId)) || null;

  const handleSelectSection = (secId) => {
    setActiveSectionId(secId);
    setTimeout(() => {
      const el = document.getElementById(`blog-builder-section-${secId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleSectionChange = (updatedSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
    setDirty(true);
  };

  const handleAddSection = (type, label, layoutConfig) => {
    const resolvedLayout = typeof layoutConfig === 'object' && layoutConfig !== null
      ? layoutConfig
      : (typeof layoutConfig === 'string' ? getLayoutPresetById(layoutConfig) : null);

    const safeLabel = typeof label === 'string' && label.trim()
      ? label.trim()
      : (PAGE_SECTION_TYPES[type]?.label || `${String(type).toUpperCase()} Section`);

    const initialConfig = normalizeSectionConfig(type, {});
    if (resolvedLayout) {
      initialConfig.layout = resolvedLayout;
      initialConfig.columnLayout = resolvedLayout.presetId;
    }

    let sortOrder = 10;
    if (insertAtIndex !== null && insertAtIndex >= 0 && sections.length > 0) {
      if (insertAtIndex === 0) {
        sortOrder = Math.max(5, (sections[0]?.sort_order || 10) - 5);
      } else {
        const prevSort = sections[insertAtIndex - 1]?.sort_order || 10;
        const nextSort = sections[insertAtIndex]?.sort_order || prevSort + 20;
        sortOrder = Math.round((prevSort + nextSort) / 2);
      }
    } else if (sections.length > 0) {
      sortOrder = Math.max(...sections.map((s) => s.sort_order || 0)) + 10;
    }

    const newSec = {
      id: `sec-blog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      section_type: type,
      label: safeLabel,
      sort_order: sortOrder,
      is_visible: true,
      config: initialConfig,
    };

    let updatedList;
    if (insertAtIndex !== null && insertAtIndex >= 0) {
      updatedList = [...sections];
      updatedList.splice(insertAtIndex, 0, newSec);
    } else {
      updatedList = [...sections, newSec];
    }

    updatedList.forEach((s, idx) => {
      s.sort_order = (idx + 1) * 10;
    });

    setSections(updatedList);
    setInsertAtIndex(null);
    setShowAddSectionModal(false);
    setActiveSectionId(newSec.id);
    setDirty(true);
  };

  const handleDuplicateSection = (sec) => {
    if (!sec) return;
    const clonedConfig = JSON.parse(JSON.stringify(sec.config || {}));
    const newSec = {
      id: `sec-blog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      section_type: sec.section_type,
      label: `${sec.label || sec.section_type} (Copy)`,
      sort_order: (sec.sort_order || 0) + 5,
      is_visible: sec.is_visible !== false,
      config: clonedConfig,
    };

    const idx = sections.findIndex((s) => s.id === sec.id);
    const updatedList = [...sections];
    if (idx !== -1) {
      updatedList.splice(idx + 1, 0, newSec);
    } else {
      updatedList.push(newSec);
    }

    updatedList.forEach((s, i) => {
      s.sort_order = (i + 1) * 10;
    });

    setSections(updatedList);
    setActiveSectionId(newSec.id);
    setDirty(true);
  };

  const handleOpenAddModalAt = (index = null) => {
    setInsertAtIndex(index);
    setShowAddSectionModal(true);
  };

  const handleDeleteSection = (secOrId) => {
    const secId = typeof secOrId === 'object' && secOrId !== null ? secOrId.id : secOrId;
    if (!window.confirm('Are you sure you want to delete this section block?')) return;
    const filtered = sections.filter((s) => s.id !== secId);
    filtered.forEach((s, i) => {
      s.sort_order = (i + 1) * 10;
    });
    setSections(filtered);
    if (activeSectionId === secId) {
      setActiveSectionId(filtered.length > 0 ? filtered[0].id : null);
    }
    setDirty(true);
  };

  const handleMoveSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((s, i) => {
      s.sort_order = (i + 1) * 10;
    });
    setSections(updated);
    setDirty(true);
  };

  const handleToggleVisibility = (secOrId) => {
    const secId = typeof secOrId === 'object' && secOrId !== null ? secOrId.id : secOrId;
    setSections(
      sections.map((s) => (s.id === secId ? { ...s, is_visible: s.is_visible === false } : s))
    );
    setDirty(true);
  };

  // Construct virtual current item for live quality calculation
  const currentItem = {
    id: id || 'temp',
    title,
    slug,
    content_type: 'blog',
    status,
    metadata: {
      excerpt,
      author,
      category,
      tags,
      featuredImage,
      sections,
      seo: { title: seoTitle, description: seoDesc, canonical: canonicalUrl },
      social: { ogTitle, ogDescription: ogDesc, ogImage },
      relationships,
    },
  };

  const quality = calculateContentQuality(currentItem, sections);
  const resolvedSeo = resolveContentSeo(currentItem);

  const handleAddTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
      setDirty(true);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setDirty(true);
  };

  const handleSave = async () => {
    const cleanSlug = normalizeSlug(slug || title);
    if (!title.trim()) {
      setFeedback({ type: 'danger', message: 'Article title is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const isAvailable = await checkSlugAvailable(cleanSlug, isNew ? null : id);
    if (!isAvailable) {
      setSaving(false);
      setFeedback({ type: 'danger', message: `Slug "${cleanSlug}" is already in use by another content item.` });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: cleanSlug,
      content_type: 'blog',
      status,
      visibility: 'public',
      featured,
      public_route: `/blog/${cleanSlug}`,
      metadata: {
        excerpt: excerpt.trim(),
        author: author.trim(),
        category: category.trim(),
        tags,
        featuredImage: featuredImage.trim(),
        sections,
        readingTime: `${Math.max(1, Math.round((excerpt.length + 500) / 200))} min read`,
        wordCount: excerpt.split(/\s+/).length + 400,
        publishedAt: status === 'published' ? new Date().toISOString() : undefined,
        seo: {
          title: seoTitle.trim(),
          description: seoDesc.trim(),
          canonical: canonicalUrl.trim(),
        },
        social: {
          ogTitle: ogTitle.trim(),
          ogDescription: ogDesc.trim(),
          ogImage: ogImage.trim(),
        },
        relationships,
      },
    };

    let res;
    if (isNew) {
      res = await createContentRegistryEntry(payload);
    } else {
      res = await updateContentRegistryEntry(id, payload);
    }

    setSaving(false);
    if (res.error) {
      setFeedback({ type: 'danger', message: `Save error: ${res.error.message}` });
    } else {
      setDirty(false);
      setFeedback({ type: 'success', message: 'Article saved successfully!' });
      if (isNew && res.data) {
        navigate(`/admin/content/blog/${res.data.id}`);
      }
    }
  };

  const handlePublish = async () => {
    if (!quality.isReady) {
      setFeedback({
        type: 'danger',
        message: `Cannot publish article. Blocking errors: ${quality.blockingErrors.map((e) => e.message).join(' ')}`,
      });
      return;
    }

    setStatus('published');
    setDirty(true);
    setTimeout(() => handleSave(), 100);
  };

  const handlePreviewClick = () => {
    try {
      const cleanSlug = normalizeSlug(slug || title || 'draft');
      const draftData = {
        id: id || `draft-${Date.now()}`,
        title: title || 'Untitled Article',
        slug: cleanSlug,
        content_type: 'blog',
        status: status || 'draft',
        visibility: visibility || 'public',
        public_route: `/blog/${cleanSlug}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          excerpt,
          author,
          category,
          tags,
          featuredImage,
          featured_image: featuredImage,
          sections,
          seo: { title: seoTitle, description: seoDesc, canonical: canonicalUrl },
          social: { ogTitle, ogDescription: ogDesc, ogImage },
          relationships,
        },
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`cms_preview_blog_${cleanSlug}`, JSON.stringify(draftData));
        sessionStorage.setItem('cms_preview_blog_latest', JSON.stringify(draftData));
      }
    } catch (err) {
      console.warn('Failed to store preview snapshot:', err);
    }
  };

  const handleDeleteArticle = async () => {
    if (!id || isNew) return;
    if (!window.confirm(`Are you sure you want to delete article "${title || 'Untitled'}"? This cannot be undone.`)) return;
    try {
      const res = await deleteContentRegistryEntry(id);
      if (res.error) {
        setFeedback({ type: 'danger', message: `Delete failed: ${res.error.message}` });
      } else {
        navigate('/admin/content');
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  const previewUrl = `/blog/${normalizeSlug(slug || title || 'draft')}?preview=true`;

  return (
    <div className="admin-blog-editor p-4">
      {/* 1. Editor Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/admin/content" className="text-secondary text-decoration-none small">
              <i className="bi bi-arrow-left"></i> Content Center
            </Link>
            <span className="text-muted small">/</span>
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2">
              Blog Article
            </span>
            <span className={`badge bg-${STATUS_BADGE_VARIANTS[status] || 'secondary'} rounded-pill text-capitalize px-2`}>
              {STATUS_LABELS[status] || status}
            </span>
          </div>
          <h3 className="fw-bold mb-0 text-dark">
            {isNew ? 'New Blog Article' : title || 'Edit Blog Article'}
          </h3>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Quality Score Indicator */}
          <div
            className={`badge rounded-pill px-3 py-2 border ${quality.isReady ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-dark'}`}
            title="Quality Score"
          >
            <i className={`bi bi-${quality.isReady ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-1`}></i>
            Quality: {quality.score}%
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePreviewClick}
            className="btn btn-outline-secondary bg-white rounded-pill px-3 shadow-xs"
          >
            <i className="bi bi-eye me-1"></i> Preview
          </a>

          {!isNew && (
            <button
              type="button"
              className="btn btn-outline-danger rounded-pill px-3 shadow-xs"
              onClick={handleDeleteArticle}
              title="Delete this article permanently"
            >
              <i className="bi bi-trash me-1"></i> Delete
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 shadow-sm fw-semibold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Article'}
          </button>

          {status !== 'published' && (
            <button
              type="button"
              className="btn btn-success rounded-pill px-3 shadow-sm fw-semibold"
              onClick={handlePublish}
              disabled={saving}
            >
              <i className="bi bi-send-check me-1"></i> Publish
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 small py-2 px-3 mb-4`}>
          {feedback.message}
          <button type="button" className="btn-close py-2" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <ul className="nav nav-tabs border-bottom mb-4 gap-1" style={{ fontSize: '0.85rem' }}>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'metadata' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('metadata')}
          >
            <i className="bi bi-card-heading me-1"></i> Article Metadata
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'content' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('content')}
          >
            <i className="bi bi-layout-text-window-reverse me-1"></i> Visual Content ({sections.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'seo' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('seo')}
          >
            <i className="bi bi-search me-1"></i> SEO
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'social' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('social')}
          >
            <i className="bi bi-share me-1"></i> Social Preview
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'relationships' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('relationships')}
          >
            <i className="bi bi-diagram-3 me-1"></i> Related Content ({relationships.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'quality' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('quality')}
          >
            <i className="bi bi-shield-check me-1"></i> Quality &amp; Safety
          </button>
        </li>
      </ul>

      {/* 3. Tab Panes */}
      <div className="tab-content">
        {/* TAB 1: METADATA */}
        {activeTab === 'metadata' && (
          <div className="row g-4">
            <div className="col-12 col-md-8">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-4 mb-4">
                <h6 className="fw-bold mb-3">Basic Information</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Article Headline</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="e.g. How I Built My AI Copilot"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (isNew && !slug) setSlug(normalizeSlug(e.target.value));
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">URL Slug</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted small">/blog/</span>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="how-i-built-my-ai-copilot"
                      value={slug}
                      onChange={(e) => {
                        setSlug(normalizeSlug(e.target.value));
                        setDirty(true);
                      }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Summary Excerpt</label>
                  <textarea
                    className="form-control rounded-3"
                    rows="3"
                    placeholder="Concise summary for catalog listings and search results…"
                    value={excerpt}
                    onChange={(e) => {
                      setExcerpt(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-4 mb-4">
                <h6 className="fw-bold mb-3">Publishing Details</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Editorial Status</label>
                  <select
                    className="form-select form-select-sm rounded-3 text-capitalize"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setDirty(true);
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="ready">Ready for Publishing</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Author</label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-3"
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Category</label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-3"
                    placeholder="e.g. AI & Architecture, Design Systems"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Featured Image (URL or Filename)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-3"
                    placeholder="cover-copilot-naim-DXZL9efD.png"
                    value={featuredImage}
                    onChange={(e) => {
                      setFeaturedImage(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Tags</label>
                  <div className="input-group input-group-sm mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add tag…"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={handleAddTag}>
                      Add
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span key={t} className="badge bg-light text-secondary border rounded-pill d-inline-flex align-items-center">
                        #{t}
                        <button
                          type="button"
                          className="btn-close ms-1 p-0"
                          style={{ fontSize: '0.5rem' }}
                          onClick={() => handleRemoveTag(t)}
                        ></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL CONTENT */}
        {activeTab === 'content' && (
          <div className="row g-4">
            {/* LEFT COLUMN: STRUCTURE / LAYERS */}
            <div className="col-12 col-xl-3 col-lg-4">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-3 mb-4 sticky-top" style={{ top: '80px', zIndex: 10 }}>
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <div>
                    <h6 className="fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Article Sections
                    </h6>
                    <small className="text-muted">{sections.length} block(s)</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-3"
                    onClick={() => {
                      setInsertAtIndex(null);
                      setShowAddSectionModal(true);
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add
                  </button>
                </div>

                <div className="structure-list d-flex flex-column gap-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {sections.length > 0 ? (
                    sections.map((sec, idx) => {
                      const isSelected = String(sec.id) === String(activeSectionId);
                      const isVisible = sec.is_visible !== false;
                      const typeDef = PAGE_SECTION_TYPES[sec.section_type] || {};

                      return (
                        <div
                          key={sec.id}
                          className={`p-2 rounded-3 border transition-all ${
                            isSelected
                              ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                              : 'bg-white hover-border-secondary'
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelectSection(sec.id)}
                        >
                          <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
                              <i className={`bi ${typeDef.icon || 'bi-layers'} text-primary`} style={{ fontSize: '0.85rem' }} />
                              <span className="small fw-semibold text-truncate" title={sec.label || sec.section_type}>
                                {sec.label || typeDef.label || sec.section_type}
                              </span>
                            </div>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: '0.62rem' }}>
                              {sec.section_type}
                            </span>
                          </div>

                          <div className="d-flex align-items-center justify-content-between pt-1 border-top mt-1" style={{ fontSize: '0.72rem' }}>
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-link text-muted p-0 me-2"
                                title="Move Up"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveSection(idx, -1);
                                }}
                              >
                                <i className="bi bi-arrow-up" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-link text-muted p-0 me-2"
                                title="Move Down"
                                disabled={idx === sections.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveSection(idx, 1);
                                }}
                              >
                                <i className="bi bi-arrow-down" />
                              </button>
                              <button
                                type="button"
                                className={`btn btn-link p-0 me-2 ${isVisible ? 'text-muted' : 'text-danger'}`}
                                title={isVisible ? 'Hide Section' : 'Show Section'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleVisibility(sec.id);
                                }}
                              >
                                <i className={`bi ${isVisible ? 'bi-eye' : 'bi-eye-slash'}`} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-link text-muted p-0 me-2"
                                title="Duplicate Section"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateSection(sec);
                                }}
                              >
                                <i className="bi bi-copy" />
                              </button>
                            </div>

                            <button
                              type="button"
                              className="btn btn-link text-danger p-0"
                              title="Delete Section"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(sec.id);
                              }}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted small">
                      <i className="bi bi-layers display-6 mb-2 d-block opacity-50" />
                      No sections added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: VISUAL CANVAS */}
            <div className="col-12 col-xl-5 col-lg-8">
              {/* Viewport Switcher Toolbar */}
              <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-white rounded-4 shadow-sm border">
                <span className="small fw-semibold text-muted ms-2">Visual Canvas</span>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${previewViewport === 'desktop' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setPreviewViewport('desktop')}
                    title="Desktop (100%)"
                  >
                    <i className="bi bi-display me-1" /> Desktop
                  </button>
                  <button
                    type="button"
                    className={`btn ${previewViewport === 'tablet' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setPreviewViewport('tablet')}
                    title="Tablet (768px)"
                  >
                    <i className="bi bi-tablet me-1" /> Tablet
                  </button>
                  <button
                    type="button"
                    className={`btn ${previewViewport === 'mobile' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setPreviewViewport('mobile')}
                    title="Mobile (375px)"
                  >
                    <i className="bi bi-phone me-1" /> Mobile
                  </button>
                </div>
              </div>

              {/* Viewport Sandbox Wrapper */}
              <div
                className="mx-auto transition-all"
                style={{
                  width: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
                  maxWidth: '100%',
                }}
              >
                {sections.length > 0 ? (
                  <div className="pb-5">
                    <PageRenderer
                      page={{ title: title || 'Article Title', template: 'default' }}
                      sections={sections}
                      loading={false}
                      error={null}
                      activeSectionId={activeSectionId}
                      viewport={previewViewport}
                      onSelectSection={handleSelectSection}
                      onMoveSection={handleMoveSection}
                      onToggleVisibility={handleToggleVisibility}
                      onDuplicateSection={handleDuplicateSection}
                      onDeleteSection={handleDeleteSection}
                      onInsertSection={handleOpenAddModalAt}
                    />

                    {/* Final Bottom Add Section Bar */}
                    <div className="text-center pt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-pill px-4"
                        onClick={() => handleOpenAddModalAt(null)}
                      >
                        <i className="bi bi-plus-lg me-1" /> Add Section At Bottom
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 border border-dashed rounded-4 bg-white p-5 shadow-sm">
                    <i className="bi bi-file-text display-4 text-muted mb-3 d-block" />
                    <h6 className="fw-bold mb-1">No Visual Sections Added Yet</h6>
                    <p className="text-muted small mb-4">
                      Build your article using rich structured sections: Hero, Rich Text, Images, Quotes, Metrics, Galleries, Video, CTAs, and Workflows.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4 shadow-sm"
                      onClick={() => handleOpenAddModalAt(null)}
                    >
                      <i className="bi bi-plus-lg me-1" /> Add First Section Block
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: PROPERTY INSPECTOR */}
            <div className="col-12 col-xl-4 col-lg-12">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-3 sticky-top" style={{ top: '80px', zIndex: 10 }}>
                {activeSection ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                      <div>
                        <span className="small text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                          Section Inspector
                        </span>
                        <h6 className="fw-bold mb-0 text-truncate" title={activeSection.label}>
                          {activeSection.label || activeSection.section_type}
                        </h6>
                      </div>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2">
                        {activeSection.section_type}
                      </span>
                    </div>

                    <SectionPropertyEditor
                      section={activeSection}
                      onChange={handleSectionChange}
                      dirty={dirty}
                    />
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-sliders display-6 mb-2 d-block opacity-50" />
                    <p className="small mb-0">Select any section from the structure panel or canvas to edit its properties, layout, styles, and advanced CSS.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEO */}
        {activeTab === 'seo' && (
          <div className="row g-4">
            <div className="col-12 col-md-7">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
                <h6 className="fw-bold mb-3">SEO Configuration</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Custom SEO Title</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder={resolvedSeo.title}
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      setDirty(true);
                    }}
                  />
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Length: {seoTitle.length} characters (Optimal: 40-60). Falls back to article headline.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Custom SEO Description</label>
                  <textarea
                    className="form-control rounded-3"
                    rows="3"
                    placeholder={resolvedSeo.description}
                    value={seoDesc}
                    onChange={(e) => {
                      setSeoDesc(e.target.value);
                      setDirty(true);
                    }}
                  />
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Length: {seoDesc.length} characters (Optimal: 70-155). Falls back to excerpt.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Canonical URL Override</label>
                  <input
                    type="text"
                    className="form-control font-monospace rounded-3"
                    placeholder={resolvedSeo.canonical}
                    value={canonicalUrl}
                    onChange={(e) => {
                      setCanonicalUrl(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
                <h6 className="fw-bold mb-3">Google Snippet Preview</h6>
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>
                    https://naimbsili.com{resolvedSeo.canonical}
                  </div>
                  <div className="text-primary fw-semibold small text-truncate mt-1" style={{ fontSize: '0.95rem' }}>
                    {resolvedSeo.title}
                  </div>
                  <div className="text-secondary small mt-1 line-clamp-2" style={{ fontSize: '0.8rem' }}>
                    {resolvedSeo.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOCIAL PREVIEW */}
        {activeTab === 'social' && (
          <div className="row g-4">
            <div className="col-12 col-md-7">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
                <h6 className="fw-bold mb-3">OpenGraph Social Sharing</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">OG Title</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder={resolvedSeo.ogTitle}
                    value={ogTitle}
                    onChange={(e) => {
                      setOgTitle(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">OG Description</label>
                  <textarea
                    className="form-control rounded-3"
                    rows="3"
                    placeholder={resolvedSeo.ogDescription}
                    value={ogDesc}
                    onChange={(e) => {
                      setOgDesc(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">OG Image URL</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="cover-copilot-naim-DXZL9efD.png"
                    value={ogImage}
                    onChange={(e) => {
                      setOgImage(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
                <h6 className="fw-bold mb-3">Twitter / LinkedIn Card Preview</h6>
                <div className="border rounded-4 overflow-hidden bg-light shadow-xs">
                  <div className="bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
                    <i className="bi bi-image display-4 text-muted"></i>
                  </div>
                  <div className="p-3 bg-white">
                    <span className="text-muted text-uppercase small d-block mb-1" style={{ fontSize: '0.68rem' }}>naimbsili.com</span>
                    <strong className="text-dark small d-block mb-1">{resolvedSeo.ogTitle}</strong>
                    <p className="text-secondary small mb-0 line-clamp-2" style={{ fontSize: '0.75rem' }}>{resolvedSeo.ogDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RELATIONSHIPS */}
        {activeTab === 'relationships' && (
          <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
            <h6 className="fw-bold mb-2">Connected Content &amp; Case Studies</h6>
            <p className="text-muted small mb-4">
              Link related case studies or AI agent experiments. These render publicly at the bottom of the article.
            </p>

            <div className="row g-3 mb-4">
              {relationships.map((rel) => (
                <div key={rel.id} className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill mb-1" style={{ fontSize: '0.65rem' }}>
                        {rel.type}
                      </span>
                      <strong className="d-block small text-dark">{rel.title}</strong>
                      <span className="text-muted font-monospace small" style={{ fontSize: '0.7rem' }}>/{rel.slug}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger border-0"
                      onClick={() => {
                        const updated = removeContentRelationship(currentItem, rel.id);
                        setRelationships(updated.metadata?.relationships || []);
                        setDirty(true);
                      }}
                      title="Remove relation"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {relationships.length === 0 && (
                <div className="text-muted small p-3 bg-light rounded-3 text-center border">
                  No connected content items yet.
                </div>
              )}
            </div>

            <div className="p-3 border rounded-3 bg-light">
              <span className="fw-bold small d-block mb-2">Quick Add Relation</span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary bg-white rounded-pill px-3"
                  onClick={() => {
                    const updated = addContentRelationship(currentItem, {
                      id: 'winni-case-study',
                      content_type: 'case-study',
                      title: 'WINNI — Physical-to-Digital Identity',
                      slug: 'winni',
                    });
                    setRelationships(updated.metadata?.relationships || []);
                    setDirty(true);
                  }}
                >
                  <i className="bi bi-plus me-1"></i> Connect WINNI Case Study
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary bg-white rounded-pill px-3"
                  onClick={() => {
                    const updated = addContentRelationship(currentItem, {
                      id: 'copilot-agent',
                      content_type: 'agent',
                      title: 'Naïm Copilot Assistant',
                      slug: 'copilot',
                    });
                    setRelationships(updated.metadata?.relationships || []);
                    setDirty(true);
                  }}
                >
                  <i className="bi bi-plus me-1"></i> Connect Copilot Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: QUALITY & PUBLISHING SAFETY */}
        {activeTab === 'quality' && (
          <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Content Quality &amp; Publishing Safety</h6>

            {quality.blockingErrors.length > 0 && (
              <div className="alert alert-danger rounded-3 p-3 mb-3">
                <strong className="d-block mb-1">
                  <i className="bi bi-x-circle-fill me-1"></i> {quality.blockingErrors.length} Blocking Issue(s) preventing publication:
                </strong>
                <ul className="mb-0 small ps-3">
                  {quality.blockingErrors.map((err) => (
                    <li key={err.code}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {quality.warnings.length > 0 && (
              <div className="alert alert-warning rounded-3 p-3 mb-3">
                <strong className="d-block mb-1">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> {quality.warnings.length} Recommended Improvement(s):
                </strong>
                <ul className="mb-0 small ps-3">
                  {quality.warnings.map((w) => (
                    <li key={w.code}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-light rounded-3 border">
              <strong className="d-block small mb-2 text-success">
                <i className="bi bi-check2-circle me-1"></i> Passed Quality Checks ({quality.passedChecks.length}):
              </strong>
              <ul className="mb-0 small text-secondary ps-3">
                {quality.passedChecks.map((p) => (
                  <li key={p.code}>{p.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <AddSectionModal
        show={showAddSectionModal}
        onClose={() => {
          setShowAddSectionModal(false);
          setInsertAtIndex(null);
        }}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
