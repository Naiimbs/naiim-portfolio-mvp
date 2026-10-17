import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import { getResources, getResourcePreviewAsset } from '../services/resources';
import { RESOURCE_TYPES, RESOURCE_TYPE_LIST } from '../config/resourceTypes';
import '../styles/resources.css';

function ResourceCardPreview({ resource, displayTitle, typeCfg }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const assets = Array.isArray(resource.assets) ? resource.assets : [];
  const primaryAsset = getResourcePreviewAsset(resource);
  const imageUrl = (asset) => asset?.file_url || asset?.asset_path || asset?.url || asset?.preview_url || asset?.image_url || asset?.public_url || '';
  const coverAssets = [primaryAsset, ...assets.filter((asset) => {
    const url = imageUrl(asset);
    return (asset.is_gallery || asset.gallery || asset.featured_in_gallery) && (/^image\//i.test(asset.mime_type || '') || /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url));
  })].filter(Boolean).filter((asset, index, all) => (
    all.findIndex((candidate) => imageUrl(candidate) === imageUrl(asset)) === index
  ));
  useEffect(() => {
    setActiveIndex((currentIndex) => Math.min(currentIndex, Math.max(coverAssets.length - 1, 0)));
  }, [coverAssets.length]);

  useEffect(() => {
    if (coverAssets.length <= 1 || isPaused) return undefined;

    const autoplayTimer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % coverAssets.length);
    }, 4500);

    return () => window.clearInterval(autoplayTimer);
  }, [coverAssets.length, isPaused]);

  const activeAsset = coverAssets[activeIndex] || coverAssets[0];
  const activeUrl = imageUrl(activeAsset);

  return (
    <div
      className={`resource-card-preview${activeUrl ? '' : ' resource-card-preview-fallback'}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <Link to={`/resources/${resource.slug}`} className="resource-card-preview-link" aria-label={`${displayTitle} visual preview`}>
        {activeUrl ? (
          <img src={activeUrl} alt={activeAsset?.caption || `${displayTitle} preview`} loading="lazy" decoding="async" />
        ) : (
          <span className="resource-card-preview-placeholder" aria-hidden="true">
            <i className={`bi ${typeCfg.icon}`}></i>
            <span>{displayTitle}</span>
          </span>
        )}
      </Link>
      {coverAssets.length > 1 && (
        <>
          <button type="button" className="resource-cover-control resource-cover-control-prev" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActiveIndex((activeIndex - 1 + coverAssets.length) % coverAssets.length); }} aria-label="Previous card cover image">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button type="button" className="resource-cover-control resource-cover-control-next" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActiveIndex((activeIndex + 1) % coverAssets.length); }} aria-label="Next card cover image">
            <i className="bi bi-chevron-right"></i>
          </button>
          <div className="resource-cover-dots" aria-label="Card cover image selector">
            {coverAssets.map((asset, index) => (
              <button type="button" key={asset.id || index} className={`resource-cover-dot${index === activeIndex ? ' is-active' : ''}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActiveIndex(index); }} aria-label={`Show card cover image ${index + 1}`}></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || 'all';
  const activePlatform = searchParams.get('platform') || 'all';
  const activeUseCase = searchParams.get('usecase') || 'all';
  const activeSort = searchParams.get('sort') || 'recommended';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentLang = i18n.language?.startsWith('fr')
    ? 'fr'
    : (i18n.language?.startsWith('ar') ? 'ar' : 'en');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await getResources({
          status: 'published',
          visibility: 'public',
        });
        if (fetchErr) {
          setError(fetchErr);
        } else {
          setResources(data || []);
        }
      } catch (err) {
        console.error('[ResourcesPage] Load error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleTypeSelect = (typeId) => {
    handleFilterChange('type', typeId);
  };

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || value === 'recommended') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set('q', value);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const handleClearSearch = () => {
    handleSearchChange('');
  };

  const normalizeSearchText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();

  const platformOptions = useMemo(() => [...new Set(resources.flatMap((resource) => (
    Array.isArray(resource.compatibility)
      ? resource.compatibility.map((item) => (item && typeof item === 'object' ? item.name : item)).filter(Boolean)
      : []
  )))].sort((a, b) => a.localeCompare(b)), [resources]);

  const useCaseOptions = useMemo(() => [...new Set(resources.flatMap((resource) => (
    Array.isArray(resource.tags) ? resource.tags.filter(Boolean) : []
  )))].sort((a, b) => a.localeCompare(b)), [resources]);

  const getLocalizedTag = (resource, tag, index) => (
    resource.i18n?.[currentLang]?.tags?.[index] || tag
  );

  const getLocalizedUseCase = (tag) => {
    const owner = resources.find((resource) => Array.isArray(resource.tags) && resource.tags.includes(tag));
    const index = owner?.tags?.indexOf(tag) ?? -1;
    return owner && index >= 0 ? getLocalizedTag(owner, tag, index) : tag;
  };

  const filteredResources = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    const filtered = resources.filter((resource) => {
      if (activeType !== 'all' && resource.resource_type !== activeType) return false;
      if (activePlatform !== 'all') {
        const names = (resource.compatibility || []).map((item) => (
          item && typeof item === 'object' ? item.name : item
        ));
        if (!names.some((name) => normalizeSearchText(name) === normalizeSearchText(activePlatform))) return false;
      }
      if (activeUseCase !== 'all' && !(resource.tags || []).some((tag) => normalizeSearchText(tag) === normalizeSearchText(activeUseCase))) return false;
      if (query) {
        const searchable = [
          resource.title,
          resource.slug,
          resource.short_description,
          resource.description,
          resource.purpose,
          resource.how_to_use,
          resource.installation,
          resource.author,
          resource.license,
          resource.resource_type,
          ...(resource.tags || []),
          ...(resource.when_to_use || []),
          ...(resource.compatibility || []).map((item) => (item && typeof item === 'object' ? item.name : item)),
          ...Object.values(resource.metadata || {}).filter((value) => typeof value === 'string'),
        ].filter(Boolean).join(' ');
        if (!normalizeSearchText(searchable).includes(query)) return false;
      }
      return true;
    });

    const dateValue = (resource) => {
      const date = Date.parse(resource.last_updated || resource.created_at || '');
      return Number.isFinite(date) ? date : 0;
    };

    return filtered.sort((a, b) => {
      if (activeSort === 'newest') {
        return dateValue(b) - dateValue(a) || (a.sort_order ?? 0) - (b.sort_order ?? 0);
      }
      if (activeSort === 'featured') {
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
          || (a.sort_order ?? 0) - (b.sort_order ?? 0)
          || String(a.title || '').localeCompare(String(b.title || ''));
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        || Number(Boolean(b.featured)) - Number(Boolean(a.featured))
        || String(a.title || '').localeCompare(String(b.title || ''));
    });
  }, [resources, activeType, activePlatform, activeUseCase, activeSort, searchQuery]);

  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams);
    ['type', 'platform', 'usecase', 'sort', 'q'].forEach((key) => params.delete(key));
    setSearchParams(params);
    setSearchQuery('');
  };

  return (
    <MainLayout>
      <SEO
        title="Resources, Skills &amp; Systems — Naïm Bsili"
        description="Curated collection of autonomous Agent Skills, Heuristic Audits, Design System Templates, and Reusable Artifacts."
        canonical="/resources"
      />

      <div className="resources-page-wrap">
        {/* 1. Hero Section (Standard Portfolio Eyebrow + Heading Pattern) */}
        <section className="resources-hero">
          <div className="container">
            <div className="eyebrow mb-2">
              <span></span> {t('resources.eyebrow')}
            </div>
            <h1 className="display-4 fw-bold font-heading mb-3">
              {t('resources.title')}
            </h1>
            <p className="lead text-secondary" style={{ maxWidth: '700px' }}>
              {t('resources.lead')}
            </p>
          </div>
        </section>

        {/* 2. Main Content Container */}
        <section className="pb-5">
          <div className="container">
            {/* Filter & Search Toolbar */}
            <div className="resources-filter-toolbar d-flex flex-column gap-3 mb-5">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              {/* Category Pills */}
              <div className="filter-btn-group d-flex gap-2 align-items-center">
                <button
                  type="button"
                  className={`resource-filter-btn ${activeType === 'all' ? 'active' : ''}`}
                  onClick={() => handleTypeSelect('all')}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>{t('resources.all')}</span>
                </button>
                {RESOURCE_TYPE_LIST.map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    className={`resource-filter-btn ${activeType === rt.id ? 'active' : ''}`}
                    onClick={() => handleTypeSelect(rt.id)}
                  >
                    <i className={`bi ${rt.icon}`}></i>
                    <span>{t(`resources.types.${rt.id}.plural`, rt.pluralLabel)}</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="resource-search-box">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="resource-search-input"
                  placeholder={t('resources.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label={t('resources.searchPlaceholder')}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="btn btn-sm btn-link text-muted position-absolute end-0 top-50 translate-middle-y text-decoration-none pe-3"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
              </div>

              <div className="resource-refinement-filters" aria-label={t('resources.refineLabel')}>
                <label className="resource-refinement-field">
                  <span>{t('resources.platform')}</span>
                  <select className="form-select form-select-sm resource-filter-select" value={activePlatform} onChange={(event) => handleFilterChange('platform', event.target.value)}>
                    <option value="all">{t('resources.allPlatforms')}</option>
                    {platformOptions.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
                  </select>
                </label>
                <label className="resource-refinement-field">
                  <span>{t('resources.useCase')}</span>
                  <select className="form-select form-select-sm resource-filter-select" value={activeUseCase} onChange={(event) => handleFilterChange('usecase', event.target.value)}>
                    <option value="all">{t('resources.allUseCases')}</option>
                    {useCaseOptions.map((useCase) => <option key={useCase} value={useCase}>{getLocalizedUseCase(useCase)}</option>)}
                  </select>
                </label>
                <label className="resource-refinement-field">
                  <span>{t('resources.sortBy')}</span>
                  <select className="form-select form-select-sm resource-filter-select" value={activeSort} onChange={(event) => handleFilterChange('sort', event.target.value)}>
                    <option value="recommended">{t('resources.sortRecommended')}</option>
                    <option value="newest">{t('resources.sortNewest')}</option>
                    <option value="featured">{t('resources.sortFeatured')}</option>
                  </select>
                </label>
                <div className="resource-results-count" aria-live="polite">
                  <strong>{filteredResources.length}</strong> {t('resources.resultsLabel')}
                </div>
                {(searchQuery || activeType !== 'all' || activePlatform !== 'all' || activeUseCase !== 'all' || activeSort !== 'recommended') && (
                  <button type="button" className="resource-clear-filters" onClick={handleResetFilters}>
                    <i className="bi bi-x-circle me-1"></i>{t('resources.resetFilters')}
                  </button>
                )}
              </div>
            </div>

            {/* 3. States & Resource Grid */}
            {loading ? (
              <div className="text-center py-5" style={{ minHeight: '35vh' }}>
                <div className="spinner-border text-success" role="status" style={{ color: 'var(--green)' }}>
                  <span className="visually-hidden">{t('resources.loading')}</span>
                </div>
                <div className="text-muted small mt-2">{t('resources.loadingSub')}</div>
              </div>
            ) : error ? (
              <div className="text-center py-5 bg-white rounded-4 border p-5 shadow-xs">
                <i className="bi bi-exclamation-triangle text-danger display-4 mb-3"></i>
                <h3 className="fw-bold mb-2">{t('resources.errorTitle')}</h3>
                <p className="text-secondary small mb-4">
                  {t('resources.errorBody')}
                </p>
                <button
                  type="button"
                  className="btn btn-primary-custom rounded-pill px-4"
                  onClick={() => window.location.reload()}
                >
                  {t('resources.retry')}
                </button>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 border p-5 shadow-xs">
                <i className="bi bi-inbox text-muted display-4 mb-3 d-block"></i>
                <h3 className="fw-bold mb-2">{t('resources.emptyTitle')}</h3>
                <p className="text-secondary small mb-4">
                  {t('resources.emptyBody')}
                </p>
                <button
                  type="button"
                  className="btn btn-outline-custom rounded-pill px-4"
                  onClick={handleResetFilters}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> {t('resources.resetFilters')}
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {filteredResources.map((resource) => {
                  const typeCfg = RESOURCE_TYPES[resource.resource_type] || RESOURCE_TYPES.file;
                  const assetCount = Array.isArray(resource.assets) ? resource.assets.length : 0;
                  const tx = resource.i18n?.[currentLang] || resource.metadata?.i18n?.[currentLang] || {};
                  const displayTitle = tx.title || resource.title;
                  const displayDesc = tx.short_description || tx.description || resource.short_description || resource.description;

                  return (
                    <div key={resource.id} className="col-12 col-md-6 col-lg-4">
                      <div className="resource-card">
                        <ResourceCardPreview resource={resource} displayTitle={displayTitle} typeCfg={typeCfg} />
                        <div>
                          {/* Eyebrow / Badges */}
                          <div className="resource-card-eyebrow">
                            <span
                              className="resource-type-pill"
                              style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}
                            >
                              <i className={`bi ${typeCfg.icon}`}></i>
                              {t(`resources.types.${resource.resource_type}.label`, typeCfg.label)}
                            </span>
                            <div className="d-flex align-items-center gap-1">
                              {resource.featured && (
                                <span className="resource-featured-pill">
                                  <i className="bi bi-star-fill text-[9px]"></i> {t('resources.featured')}
                                </span>
                              )}
                              {resource.version && (
                                <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.68rem' }}>
                                  v{resource.version}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h2 className="resource-card-title">
                            <Link to={`/resources/${resource.slug}`}>
                              {displayTitle}
                            </Link>
                          </h2>

                          {/* Description */}
                          <p className="resource-card-desc">
                            {displayDesc}
                          </p>

                          {/* Tags */}
                          {Array.isArray(resource.tags) && resource.tags.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mb-3">
                              {resource.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="resource-tag-chip">
                                  #{getLocalizedTag(resource, tag, idx)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="resource-card-footer">
                          <span className="resource-assets-count">
                            <i className="bi bi-paperclip"></i>
                            <span>{t('resources.assets', { count: assetCount })}</span>
                          </span>
                          <Link
                            to={`/resources/${resource.slug}`}
                            className="resource-explore-link"
                          >
                            <span>{t('resources.explore')}</span>
                            <i className="bi bi-arrow-right"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4. Bottom Section CTA */}
        <section className="case-nav mt-5">
          <div className="container d-flex justify-content-between align-items-center">
            <Link to="/work" className="text-link">
              <i className="bi bi-arrow-left"></i> {t('resources.backToWork')}
            </Link>
            <a href="#contact" className="text-link">
              {t('resources.requestCustom')} <i className="bi bi-arrow-up-right"></i>
            </a>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
