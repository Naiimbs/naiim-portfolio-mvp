import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parseFrontMatter, splitMarkdownSections } from '../utils/frontMatter';
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
  isValidStatusTransition,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from '../../services/contentOperations';
import { normalizeSlug, getCanonicalRoute } from '../../services/contentRouteResolver';
import PageRenderer from '../../components/cms/PageRenderer';
import AddSectionModal from '../components/cms/AddSectionModal';
import MediaUploadField from '../components/cms/MediaUploadField';
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
  const [initialStatus, setInitialStatus] = useState('draft'); // last persisted status (for transition rules)
  const [publishedAt, setPublishedAt] = useState(null); // preserved across saves

  // Phase 3 — per-language translations: { fr: {title, excerpt, bodyMarkdown, sections}, ar: {...} }
  const [translations, setTranslations] = useState({});
  const [txLang, setTxLang] = useState('fr');

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
        setInitialStatus(item.status || 'draft');
        setPublishedAt(meta.publishedAt || null);
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
        setTranslations(meta.i18n && typeof meta.i18n === 'object' ? meta.i18n : {});
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

  const handleSave = async (opts = {}) => {
    const cleanSlug = normalizeSlug(slug || title);
    if (!title.trim()) {
      setFeedback({ type: 'danger', message: 'Article title is required.' });
      return;
    }

    // Enforce the editorial state machine for dropdown-driven status changes.
    // An explicit Publish action passes skipTransitionCheck (gated by quality).
    if (!isNew && status !== initialStatus && !opts.skipTransitionCheck) {
      if (!isValidStatusTransition(initialStatus, status)) {
        const allowed = { draft: 'In review, Ready', in_review: 'Draft, Ready', ready: 'Draft, Published', published: 'Archived', archived: 'Draft' }[initialStatus] || '—';
        setFeedback({
          type: 'danger',
          message: `Invalid status change ${STATUS_LABELS[initialStatus] || initialStatus} → ${STATUS_LABELS[status] || status}. Allowed from "${STATUS_LABELS[initialStatus] || initialStatus}": ${allowed}.`,
        });
        setStatus(initialStatus);
        return;
      }
    }

    setSaving(true);
    setFeedback(null);

    // Word count / reading time from the real article body (section prose), not the excerpt.
    const bodyText = [
      excerpt,
      ...sections.map((s) => {
        const c = s.config || {};
        return [c.title, c.body, c.content, c.intro, c.description, c.quote].filter(Boolean).join(' ');
      }),
    ].join(' ').trim();
    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
    const readingTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
    const nextPublishedAt = status === 'published' ? publishedAt || new Date().toISOString() : publishedAt || undefined;

    const isAvailable = await checkSlugAvailable(cleanSlug, isNew ? null : id);
    if (!isAvailable) {
      setSaving(false);
      setFeedback({ type: 'danger', message: `Slug "${cleanSlug}" is already in use by another content item.` });
      return;
    }

    // Keep only languages that actually carry a translation.
    const cleanTranslations = {};
    for (const [lng, tx] of Object.entries(translations || {})) {
      if (!tx) continue;
      const hasContent = (tx.title && tx.title.trim()) || (tx.excerpt && tx.excerpt.trim()) || (Array.isArray(tx.sections) && tx.sections.length > 0);
      if (!hasContent) continue;
      cleanTranslations[lng] = {
        ...(tx.title && tx.title.trim() ? { title: tx.title.trim() } : {}),
        ...(tx.excerpt && tx.excerpt.trim() ? { excerpt: tx.excerpt.trim() } : {}),
        ...(Array.isArray(tx.sections) && tx.sections.length ? { sections: tx.sections } : {}),
        ...(tx.bodyMarkdown ? { bodyMarkdown: tx.bodyMarkdown } : {}),
      };
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
        i18n: cleanTranslations,
        author: author.trim(),
        category: category.trim(),
        tags,
        featuredImage: featuredImage.trim(),
        sections,
        readingTime,
        wordCount,
        publishedAt: nextPublishedAt,
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
      setInitialStatus(status);
      setPublishedAt(nextPublishedAt || null);
      if (opts.silent) {
        setFeedback({ type: 'info', message: 'Autosaved.' });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback({ type: 'success', message: 'Article saved successfully!' });
      }
      if (isNew && res.data) {
        navigate(`/admin/content/blog/${res.data.id}`);
      }
    }
  };

  // Warn before leaving the tab with unsaved changes.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Autosave existing articles ~15s after edits settle. Content only — pending
  // status changes are left for an explicit Save so the workflow stays clear.
  useEffect(() => {
    if (isNew || !dirty || saving) return undefined;
    if (status !== initialStatus) return undefined;
    const t = setTimeout(() => { handleSave({ silent: true }); }, 15000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving, isNew, status, initialStatus, title, excerpt, sections, tags, seoTitle, seoDesc, canonicalUrl, ogTitle, ogDesc, featuredImage, ogImage, category, author, relationships]);

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
    setTimeout(() => handleSave({ skipTransitionCheck: true }), 100);
  };

  const mdInputRef = useRef(null);
  const [mdDragOver, setMdDragOver] = useState(false);

  const buildBodySections = (body, split) => {
    const base = Date.now();
    const rid = () => Math.random().toString(36).slice(2, 6);
    if (!split) {
      return [{
        id: `sec-blog-${base}-${rid()}`,
        section_type: 'rich_text',
        label: 'Article Body',
        sort_order: 10,
        is_visible: true,
        config: { eyebrow: '', title: '', body, alignment: 'left' },
      }];
    }
    return splitMarkdownSections(body).map((p, i) => ({
      id: `sec-blog-${base}-${i}-${rid()}`,
      section_type: 'rich_text',
      label: (p.title ? `Body · ${p.title}` : 'Intro').slice(0, 60),
      sort_order: (i + 1) * 10,
      is_visible: true,
      config: { eyebrow: '', title: p.title || '', body: p.body, alignment: 'left' },
    }));
  };

  const applyImportedMarkdown = (text, fallbackName = 'article.md') => {
    const { frontMatter: fm, body } = parseFrontMatter(text);

    if (fm.title) setTitle(fm.title);
    if (fm.slug) setSlug(normalizeSlug(fm.slug));
    else if (fm.title && isNew) setSlug(normalizeSlug(fm.title));
    if (fm.excerpt) setExcerpt(fm.excerpt);
    if (fm.category) setCategory(fm.category);
    if (fm.author) setAuthor(fm.author);
    if (Array.isArray(fm.tags) && fm.tags.length) setTags(fm.tags);
    if (fm.seo_title) setSeoTitle(fm.seo_title);
    if (fm.seo_description) setSeoDesc(fm.seo_description);
    if (fm.og_title) setOgTitle(fm.og_title);
    if (fm.og_description) setOgDesc(fm.og_description);
    const cover = fm.featured_image || fm.featuredImage || fm.cover || fm.image || '';
    if (cover) setFeaturedImage(cover);
    if (fm.og_image || fm.ogImage) setOgImage(fm.og_image || fm.ogImage);

    if (body) {
      const multiH2 = (body.match(/^##\s+/gm) || []).length > 1;
      const split = multiH2 && window.confirm(
        'Split the article into separate sections by heading (##)?\n\nOK = one editable block per heading (easier to insert images between).\nCancel = keep the whole article as a single block.',
      );
      const secs = buildBodySections(body, split);
      setSections(secs);
      if (secs[0]) setActiveSectionId(secs[0].id);
    }
    setDirty(true);
    setActiveTab('metadata');
    setFeedback({ type: 'success', message: `Imported "${fm.title || fallbackName}". Review the fields and body, then Save.` });
  };

  const isMarkdownFile = (file) => file && /\.(md|markdown)$/i.test(file.name || '');

  const importFile = async (file) => {
    if (!file) return;
    if (!isMarkdownFile(file)) {
      setFeedback({ type: 'danger', message: 'Please choose a .md (markdown) file.' });
      return;
    }
    if (sections.length > 0 && !window.confirm('Importing will replace the current article body. Continue?')) return;
    try {
      const text = await file.text();
      applyImportedMarkdown(text, file.name);
    } catch {
      setFeedback({ type: 'danger', message: 'Could not read the file.' });
    }
  };

  const handleImportMarkdown = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = '';
    await importFile(file);
  };

  const handleMdDrop = async (e) => {
    e.preventDefault();
    setMdDragOver(false);
    const file = e.dataTransfer?.files && e.dataTransfer.files[0];
    await importFile(file);
  };

  const handleMdDragOver = (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
      e.preventDefault();
      setMdDragOver(true);
    }
  };

  const handleMdDragLeave = () => setMdDragOver(false);

  const handlePreviewClick = () => {
    try {
      const cleanSlug = normalizeSlug(slug || title || 'draft');
      const draftData = {
        id: id || `draft-${Date.now()}`,
        title: title || 'Untitled Article',
        slug: cleanSlug,
        content_type: 'blog',
        status: status || 'draft',
        visibility: 'public',
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

  // ── Translation tab helpers ────────────────────────────────────────────
  const tx = translations[txLang] || {};
  const setTxField = (patch) => {
    setTranslations({ ...translations, [txLang]: { ...tx, ...patch } });
    setDirty(true);
  };
  const applyTxMarkdown = () => {
    const md = (tx.bodyMarkdown || '').trim();
    const secs = md ? buildBodySections(md, (md.match(/^##\s+/gm) || []).length > 1) : [];
    setTxField({ sections: secs });
    setFeedback({ type: 'success', message: `Applied ${secs.length} translated section(s) for ${txLang.toUpperCase()}.` });
  };

  return (
    <div
      className="admin-blog-editor p-4 position-relative"
      onDragOver={handleMdDragOver}
      onDragLeave={handleMdDragLeave}
      onDrop={handleMdDrop}
    >
      {mdDragOver && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1050, background: 'rgba(8,127,102,0.08)', border: '3px dashed #087f66', borderRadius: '1rem', pointerEvents: 'none' }}
        >
          <div className="bg-white rounded-4 shadow px-4 py-3 text-center">
            <i className="bi bi-filetype-md display-6 text-primary d-block mb-1"></i>
            <strong>Drop your .md file to import</strong>
            <div className="small text-muted">front matter + body</div>
          </div>
        </div>
      )}

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

          <label
            className="btn btn-outline-secondary bg-white rounded-pill px-3 shadow-xs mb-0"
            title="Import a markdown file (YAML front matter + body)"
          >
            <i className="bi bi-filetype-md me-1"></i> Import .md
            <input
              ref={mdInputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              className="d-none"
              onChange={handleImportMarkdown}
            />
          </label>

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
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link py-2 px-3 fw-semibold ${activeTab === 'translations' ? 'active bg-white text-primary border-bottom-0' : 'text-secondary border-0'}`}
            onClick={() => setActiveTab('translations')}
          >
            <i className="bi bi-translate me-1"></i> Translations
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
                  <label className="form-label small fw-semibold">Featured Image</label>
                  <MediaUploadField
                    value={featuredImage}
                    folder="blog"
                    placeholder="https://… or upload a cover image"
                    onChange={(url) => {
                      setFeaturedImage(url);
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
                    https://naiimbsili.com{resolvedSeo.canonical}
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
                  <label className="form-label small fw-semibold">OG Image</label>
                  <MediaUploadField
                    value={ogImage}
                    folder="blog"
                    placeholder="https://… or upload a social share image"
                    onChange={(url) => {
                      setOgImage(url);
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
                  <div className="bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '140px' }}>
                    {(ogImage || featuredImage) ? (
                      <img
                        src={ogImage || featuredImage}
                        alt=""
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <i className="bi bi-image display-4 text-muted"></i>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <span className="text-muted text-uppercase small d-block mb-1" style={{ fontSize: '0.68rem' }}>naiimbsili.com</span>
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

        {/* TAB: TRANSLATIONS */}
        {activeTab === 'translations' && (
          <div className="card border-0 bg-white rounded-4 shadow-sm p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h6 className="fw-bold mb-0"><i className="bi bi-translate me-1"></i> Article Translations</h6>
              <div className="btn-group btn-group-sm" role="group">
                <button type="button" className={`btn ${txLang === 'fr' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setTxLang('fr')}>Français</button>
                <button type="button" className={`btn ${txLang === 'ar' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setTxLang('ar')}>العربية</button>
              </div>
            </div>

            <div className="alert alert-light border small mb-3">
              <i className="bi bi-info-circle me-1"></i> Enter the {txLang === 'fr' ? 'French' : 'Arabic'} version of the article. Leave the title or excerpt empty to fall back to the default (English). The body is pasted as Markdown and split into sections when you click <strong>Apply body</strong>. Translations show when a visitor switches the site to {txLang === 'fr' ? 'French' : 'Arabic'}.
            </div>

            <div className="mb-3" dir={txLang === 'ar' ? 'rtl' : 'ltr'}>
              <label className="form-label small fw-semibold">Title ({txLang.toUpperCase()})</label>
              <input type="text" className="form-control rounded-3" value={tx.title || ''} placeholder={title} onChange={(e) => setTxField({ title: e.target.value })} />
            </div>

            <div className="mb-3" dir={txLang === 'ar' ? 'rtl' : 'ltr'}>
              <label className="form-label small fw-semibold">Excerpt ({txLang.toUpperCase()})</label>
              <textarea className="form-control rounded-3" rows="2" value={tx.excerpt || ''} placeholder={excerpt} onChange={(e) => setTxField({ excerpt: e.target.value })} />
            </div>

            <div className="mb-2" dir={txLang === 'ar' ? 'rtl' : 'ltr'}>
              <label className="form-label small fw-semibold">Body — Markdown ({txLang.toUpperCase()})</label>
              <textarea className="form-control rounded-3 font-monospace" rows="12" style={{ fontSize: '0.85rem' }} value={tx.bodyMarkdown || ''} placeholder={'## Heading\n\nTranslated paragraph…'} onChange={(e) => setTxField({ bodyMarkdown: e.target.value })} />
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-sm btn-primary rounded-pill px-3" onClick={applyTxMarkdown}>
                <i className="bi bi-arrow-repeat me-1"></i> Apply body
              </button>
              <span className="small text-muted">
                {Array.isArray(tx.sections) && tx.sections.length > 0
                  ? `${tx.sections.length} translated section(s) stored.`
                  : 'No translated body yet.'}
              </span>
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
