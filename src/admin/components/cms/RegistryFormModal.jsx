import React, { useState, useEffect } from 'react';
import { checkSlugAvailable } from '../../../services/contentRegistry';
import { resolveAsset, DEFAULT_LOGO_MARKS } from '../../../services/assetRegistry';

const CONTENT_TYPES = [
  { value: 'case-study', label: 'Case Study', defaultPrefix: '/work' },
  { value: 'page', label: 'Site Page', defaultPrefix: '/p' },
  { value: 'agent', label: 'AI Agent', defaultPrefix: '/agents' },
  { value: 'plugin', label: 'Plugin / Tool', defaultPrefix: '/plugins' },
  { value: 'blog', label: 'Blog Article', defaultPrefix: '/blog' },
  { value: 'other', label: 'Other Content', defaultPrefix: '/p' },
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export default function RegistryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  // Core Content State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentType, setContentType] = useState('case-study');
  const [status, setStatus] = useState('draft');
  const [visibility, setVisibility] = useState('public');
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [publicRoute, setPublicRoute] = useState('');

  // Presentation Metadata State
  const [badge, setBadge] = useState('');
  const [kicker, setKicker] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');

  // Visual Asset State
  const [heroImage, setHeroImage] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [logoLetter, setLogoLetter] = useState('');
  const [logoClass, setLogoClass] = useState('');

  const [errors, setErrors] = useState({});
  const [slugManual, setSlugManual] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setContentType(initialData.content_type || 'case-study');
      setStatus(initialData.status || 'draft');
      setVisibility(initialData.visibility || 'public');
      setFeatured(Boolean(initialData.featured));
      setSortOrder(initialData.sort_order ?? 0);
      setPublicRoute(initialData.public_route || '');

      setBadge(initialData.metadata?.badge || '');
      setKicker(initialData.metadata?.kicker || '');
      setDescription(initialData.metadata?.description || initialData.metadata?.subtitle || '');
      setTags(Array.isArray(initialData.metadata?.tags) ? initialData.metadata.tags.join(', ') : '');
      setCategory(initialData.metadata?.category || '');
      setYear(initialData.metadata?.year ? String(initialData.metadata.year) : '');

      setHeroImage(initialData.metadata?.heroImage || '');
      setHeroImageAlt(initialData.metadata?.heroImageAlt || '');
      setLogoLetter(initialData.metadata?.logoMark?.letter || '');
      setLogoClass(initialData.metadata?.logoMark?.className || '');
      setSlugManual(true);
    } else {
      setTitle('');
      setSlug('');
      setContentType('case-study');
      setStatus('draft');
      setVisibility('public');
      setFeatured(false);
      setSortOrder(0);
      setPublicRoute('');

      setBadge('');
      setKicker('');
      setDescription('');
      setTags('');
      setCategory('');
      setYear('');

      setHeroImage('');
      setHeroImageAlt('');
      setLogoLetter('');
      setLogoClass('');
      setSlugManual(false);
    }
    setErrors({});
    setImageLoadError(false);
  }, [initialData, isOpen]);

  // Handle title change: auto-suggest slug and public route
  const handleTitleChange = (val) => {
    setTitle(val);
    if (!slugManual) {
      const generated = slugify(val);
      setSlug(generated);
      const matched = CONTENT_TYPES.find((t) => t.value === contentType);
      const prefix = matched ? matched.defaultPrefix : '/work';
      setPublicRoute(generated ? `${prefix}/${generated}` : '');
    }
  };

  // Handle type change: update suggested public route prefix
  const handleTypeChange = (newType) => {
    setContentType(newType);
    const matched = CONTENT_TYPES.find((t) => t.value === newType);
    const prefix = matched ? matched.defaultPrefix : '/work';
    if (slug) {
      setPublicRoute(`${prefix}/${slug}`);
    }
  };

  // Handle slug change: enforce kebab-case and update route
  const handleSlugChange = (val) => {
    setSlugManual(true);
    const normalized = slugify(val);
    setSlug(normalized);
    const matched = CONTENT_TYPES.find((t) => t.value === contentType);
    const prefix = matched ? matched.defaultPrefix : '/work';
    setPublicRoute(normalized ? `${prefix}/${normalized}` : '');
  };

  const validate = async () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Title is required.';
    }
    if (!slug.trim()) {
      errs.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errs.slug = 'Slug must only contain lowercase letters, numbers, and hyphens.';
    } else {
      const available = await checkSlugAvailable(slug.trim(), initialData?.id);
      if (!available) {
        errs.slug = 'This slug is already registered. Please choose a unique slug.';
      }
    }
    if (!contentType) {
      errs.contentType = 'Content type is required.';
    }
    if (isNaN(Number(sortOrder))) {
      errs.sortOrder = 'Sort order must be a valid number.';
    }

    // Asset safety validations
    if (heroImage.trim()) {
      if (/[<>"']/.test(heroImage.trim())) {
        errs.heroImage = 'Hero image reference contains invalid characters.';
      }
    }
    if (logoLetter.trim().length > 2) {
      errs.logoLetter = 'Logo mark letter must be 1 or 2 characters maximum.';
    }
    if (logoClass.trim() && !/^[a-z0-9_-]+$/i.test(logoClass.trim())) {
      errs.logoClass = 'Logo class must only contain letters, numbers, and hyphens.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validate();
    if (!isValid) return;

    const metadata = {
      ...(initialData?.metadata || {}),
    };

    // Presentation text
    if (badge.trim()) metadata.badge = badge.trim();
    else delete metadata.badge;

    if (kicker.trim()) metadata.kicker = kicker.trim();
    else delete metadata.kicker;

    if (description.trim()) {
      metadata.description = description.trim();
      metadata.subtitle = description.trim();
    } else {
      delete metadata.description;
      delete metadata.subtitle;
    }

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagsArray.length > 0) metadata.tags = tagsArray;
    else delete metadata.tags;

    if (category.trim()) metadata.category = category.trim();
    else delete metadata.category;

    if (year.trim() && !isNaN(Number(year))) metadata.year = Number(year.trim());
    else delete metadata.year;

    // Visual assets
    if (heroImage.trim()) metadata.heroImage = heroImage.trim();
    else delete metadata.heroImage;

    if (heroImageAlt.trim()) metadata.heroImageAlt = heroImageAlt.trim();
    else delete metadata.heroImageAlt;

    if (logoLetter.trim() || logoClass.trim()) {
      metadata.logoMark = {
        letter: logoLetter.trim() || (title.trim() ? title.trim().charAt(0).toUpperCase() : 'W'),
        className: logoClass.trim() || 'winni',
      };
    } else {
      delete metadata.logoMark;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content_type: contentType,
      status,
      visibility,
      featured,
      sort_order: Number(sortOrder) || 0,
      public_route: publicRoute.trim() || null,
      metadata,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  // Live Asset Preview Resolution
  const resolvedHeroPreview = heroImage.trim()
    ? resolveAsset(heroImage.trim())
    : (slug ? resolveAsset(slug) : null);

  const previewLogoLetter = logoLetter.trim() || (title.trim() ? title.trim().charAt(0).toUpperCase() : 'W');
  const previewLogoClass = logoClass.trim() || (slug ? DEFAULT_LOGO_MARKS[slug]?.className : 'winni') || 'winni';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 36, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="admin-card mb-0"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 className="fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <i className={`bi ${initialData ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-success`} />
            {initialData ? 'Edit Registry Entry' : 'New Registry Entry'}
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── SECTION 1: CORE CONTENT & ROUTING ── */}
          <div className="mb-4">
            <h6 className="fw-bold small text-muted text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
              <i className="bi bi-gear-fill me-1 text-success" /> 1. Core Content &amp; Publication
            </h6>

            {/* Title */}
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                placeholder="e.g. Winni — Smart Object Recovery"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>

            {/* Content Type & Slug Row */}
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Content Type <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={contentType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  disabled={isSubmitting}
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-7">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Slug <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted small">/</span>
                  <input
                    type="text"
                    className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                    placeholder="winni"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.slug && <div className="invalid-feedback d-block">{errors.slug}</div>}
              </div>
            </div>

            {/* Public Route */}
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                Public Route
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. /work/winni"
                value={publicRoute}
                onChange={(e) => setPublicRoute(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="form-text small text-muted">
                Front-facing URL route for visitors (auto-suggested from type and slug).
              </div>
            </div>

            {/* Status & Visibility Row */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Status
                </label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft (Hidden from Public)</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Visibility
                </label>
                <select
                  className="form-select"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="private">Private (Admin only)</option>
                </select>
              </div>
            </div>

            {/* Sort Order & Featured */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.sortOrder ? 'is-invalid' : ''}`}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="form-text small text-muted">Lower numbers appear first (e.g. 1, 2, 3).</div>
              </div>
              <div className="col-md-6 d-flex align-items-center pt-3">
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="featuredSwitch"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="featuredSwitch">
                    Featured Project
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: PRESENTATION METADATA ── */}
          <div className="border-top pt-3 mb-4">
            <h6 className="fw-bold small text-muted text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
              <i className="bi bi-card-text me-1 text-success" /> 2. Presentation Metadata
            </h6>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Badge / Number
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. 01"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="col-md-8">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Kicker
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. PRODUCT · QR · LOST & FOUND"
                  value={kicker}
                  onChange={(e) => setKicker(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                Short Description / Subtitle
              </label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                placeholder="A concise summary for cards and catalog listings..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Product Design, UX/UI, AI"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Category (Optional)
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Product Design"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Year (Optional)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="e.g. 2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: VISUAL ASSETS & LIVE PREVIEW ── */}
          <div className="border-top pt-3 mb-4">
            <h6 className="fw-bold small text-muted text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
              <i className="bi bi-image me-1 text-success" /> 3. Visual Assets &amp; Live Preview
            </h6>

            {/* Asset Inputs */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Hero Image Reference / URL
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.heroImage ? 'is-invalid' : ''}`}
                  placeholder="e.g. winni-sticker-real.png or https://..."
                  value={heroImage}
                  onChange={(e) => {
                    setHeroImage(e.target.value);
                    setImageLoadError(false);
                  }}
                  disabled={isSubmitting}
                />
                {errors.heroImage && <div className="invalid-feedback">{errors.heroImage}</div>}
                <div className="form-text small text-muted" style={{ fontSize: '0.7rem' }}>
                  Defaults to registered bundled asset by slug if left empty.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Hero Image Alt Text
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. WINNI QR sticker attached to object..."
                  value={heroImageAlt}
                  onChange={(e) => setHeroImageAlt(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Logo Mark Letter
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.logoLetter ? 'is-invalid' : ''}`}
                  maxLength="2"
                  placeholder="e.g. W, A, C, N, S"
                  value={logoLetter}
                  onChange={(e) => setLogoLetter(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.logoLetter && <div className="invalid-feedback">{errors.logoLetter}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                  Logo Style Class
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.logoClass ? 'is-invalid' : ''}`}
                  placeholder="e.g. winni, copilot, saudi, assestini"
                  value={logoClass}
                  onChange={(e) => setLogoClass(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.logoClass && <div className="invalid-feedback">{errors.logoClass}</div>}
              </div>
            </div>

            {/* Live Visual Asset Preview Box */}
            <div
              className="p-3 rounded border"
              style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
            >
              <div className="small fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                <i className="bi bi-eye me-1 text-primary" /> Live Asset Preview
              </div>

              <div className="d-flex align-items-center gap-3 flex-wrap">
                {/* Hero Preview */}
                <div
                  style={{
                    width: '140px',
                    height: '80px',
                    borderRadius: '8px',
                    background: '#0c1a1e',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {resolvedHeroPreview && !imageLoadError ? (
                    <img
                      src={resolvedHeroPreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <span className="text-muted small text-center px-1" style={{ fontSize: '0.65rem' }}>
                      <i className="bi bi-image d-block fs-5 text-secondary mb-1" />
                      No Hero Image
                    </span>
                  )}
                </div>

                {/* Logo Mark Preview */}
                <div className="d-flex align-items-center gap-2">
                  <span className={`logo-mark ${previewLogoClass}`} style={{ width: '36px', height: '36px' }}>
                    {previewLogoLetter}
                  </span>
                  <div className="small text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                    <div><strong>Logo:</strong> <code>{previewLogoLetter}</code></div>
                    <div><strong>Class:</strong> <code>.{previewLogoClass}</code></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MODAL ACTIONS ── */}
          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Saving...
                </>
              ) : (
                <>{initialData ? 'Update Entry' : 'Create Entry'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
