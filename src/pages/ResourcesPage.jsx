import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import { getResources } from '../services/resources';
import { RESOURCE_TYPES, RESOURCE_TYPE_LIST } from '../config/resourceTypes';
import '../styles/resources.css';

export default function ResourcesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await getResources({
          type: activeType,
          status: 'published',
          visibility: 'public',
          search: searchQuery,
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
  }, [activeType, searchQuery]);

  const handleTypeSelect = (typeId) => {
    const params = new URLSearchParams(searchParams);
    if (typeId === 'all') {
      params.delete('type');
    } else {
      params.set('type', typeId);
    }
    setSearchParams(params);
  };

  const handleClearSearch = () => {
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
              <span></span> RESOURCES &amp; SKILLS LIBRARY
            </div>
            <h1 className="display-4 fw-bold font-heading mb-3">
              Skills, tools &amp; systems I use to think, design and build.
            </h1>
            <p className="lead text-secondary" style={{ maxWidth: '700px' }}>
              Autonomous agent capability bundles, heuristic audit playbooks, design system templates, and downloadable reference artifacts.
            </p>
          </div>
        </section>

        {/* 2. Main Content Container */}
        <section className="pb-5">
          <div className="container">
            {/* Filter & Search Toolbar */}
            <div className="resources-filter-toolbar d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-5">
              {/* Category Pills */}
              <div className="filter-btn-group d-flex gap-2 align-items-center">
                <button
                  type="button"
                  className={`resource-filter-btn ${activeType === 'all' ? 'active' : ''}`}
                  onClick={() => handleTypeSelect('all')}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>All Resources</span>
                </button>
                {RESOURCE_TYPE_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`resource-filter-btn ${activeType === t.id ? 'active' : ''}`}
                    onClick={() => handleTypeSelect(t.id)}
                  >
                    <i className={`bi ${t.icon}`}></i>
                    <span>{t.pluralLabel}</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="resource-search-box">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="resource-search-input"
                  placeholder="Search resources & tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* 3. States & Resource Grid */}
            {loading ? (
              <div className="text-center py-5" style={{ minHeight: '35vh' }}>
                <div className="spinner-border text-success" role="status" style={{ color: 'var(--green)' }}>
                  <span className="visually-hidden">Loading resources...</span>
                </div>
                <div className="text-muted small mt-2">Loading curated resources...</div>
              </div>
            ) : error ? (
              <div className="text-center py-5 bg-white rounded-4 border p-5 shadow-xs">
                <i className="bi bi-exclamation-triangle text-danger display-4 mb-3"></i>
                <h3 className="fw-bold mb-2">Unable to load resources</h3>
                <p className="text-secondary small mb-4">
                  There was a temporary problem retrieving the resource directory.
                </p>
                <button
                  type="button"
                  className="btn btn-primary-custom rounded-pill px-4"
                  onClick={() => window.location.reload()}
                >
                  Retry Connection
                </button>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 border p-5 shadow-xs">
                <i className="bi bi-inbox text-muted display-4 mb-3 d-block"></i>
                <h3 className="fw-bold mb-2">No resources match your selection</h3>
                <p className="text-secondary small mb-4">
                  Try adjusting your search query or selecting a different category filter.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-custom rounded-pill px-4"
                  onClick={() => {
                    handleTypeSelect('all');
                    setSearchQuery('');
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {resources.map((resource) => {
                  const typeCfg = RESOURCE_TYPES[resource.resource_type] || RESOURCE_TYPES.file;
                  const assetCount = Array.isArray(resource.assets) ? resource.assets.length : 0;

                  return (
                    <div key={resource.id} className="col-12 col-md-6 col-lg-4">
                      <div className="resource-card">
                        <div>
                          {/* Eyebrow / Badges */}
                          <div className="resource-card-eyebrow">
                            <span
                              className="resource-type-pill"
                              style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}
                            >
                              <i className={`bi ${typeCfg.icon}`}></i>
                              {typeCfg.label}
                            </span>
                            <div className="d-flex align-items-center gap-1">
                              {resource.featured && (
                                <span className="resource-featured-pill">
                                  <i className="bi bi-star-fill text-[9px]"></i> Featured
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
                              {resource.title}
                            </Link>
                          </h2>

                          {/* Description */}
                          <p className="resource-card-desc">
                            {resource.short_description || resource.description}
                          </p>

                          {/* Tags */}
                          {Array.isArray(resource.tags) && resource.tags.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mb-3">
                              {resource.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="resource-tag-chip">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="resource-card-footer">
                          <span className="resource-assets-count">
                            <i className="bi bi-paperclip"></i>
                            <span>{assetCount} {assetCount === 1 ? 'asset included' : 'assets included'}</span>
                          </span>
                          <Link
                            to={`/resources/${resource.slug}`}
                            className="resource-explore-link"
                          >
                            <span>Explore</span>
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
              <i className="bi bi-arrow-left"></i> Back to selected work
            </Link>
            <a href="#contact" className="text-link">
              Request a custom Skill or Tool <i className="bi bi-arrow-up-right"></i>
            </a>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
