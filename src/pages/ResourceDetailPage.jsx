import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import { getResourceBySlug } from '../services/resources';
import { RESOURCE_TYPES } from '../config/resourceTypes';
import ResourceLeadFormModal from '../components/resources/ResourceLeadFormModal';
import ResourceMarkdownViewerModal from '../components/resources/ResourceMarkdownViewerModal';
import ResourceTemplateCard from '../components/resources/ResourceTemplateCard';
import ResourceSupportCard from '../components/resources/ResourceSupportCard';
import '../styles/resources.css';

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedDownloadAsset, setSelectedDownloadAsset] = useState(null);
  const [isMarkdownViewerOpen, setIsMarkdownViewerOpen] = useState(false);
  const [selectedMarkdownAsset, setSelectedMarkdownAsset] = useState(null);
  const [activePreviewAsset, setActivePreviewAsset] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await getResourceBySlug(slug);
        if (fetchErr) {
          setError(fetchErr);
        } else {
          setResource(data);
        }
      } catch (err) {
        console.error('[ResourceDetailPage] Load error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenLeadModal = (asset = null) => {
    setSelectedDownloadAsset(asset);
    setIsLeadModalOpen(true);
  };

  const handleOpenMarkdownViewer = (asset = null) => {
    const target = asset || (resource?.assets?.find((a) => a.name?.toLowerCase().includes('skill.md')) || resource?.assets?.find((a) => a.asset_type === 'documentation'));
    setSelectedMarkdownAsset(target);
    setIsMarkdownViewerOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-success mb-3" role="status" style={{ color: 'var(--green)' }}>
            <span className="visually-hidden">Loading resource bundle...</span>
          </div>
          <div className="text-secondary small">Loading resource details...</div>
        </div>
      </MainLayout>
    );
  }

  if (error || !resource) {
    return (
      <MainLayout>
        <SEO title="Resource Not Found — Naïm Bsili" description="The requested resource could not be found." canonical={`/resources/${slug}`} />
        <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
          <i className="bi bi-file-earmark-x text-muted display-3 mb-3 d-block"></i>
          <h2 className="fw-bold font-heading mb-2">Resource Not Found</h2>
          <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '460px' }}>
            The resource &quot;{slug}&quot; could not be located or may have been archived.
          </p>
          <Link to="/resources" className="btn btn-primary-custom rounded-pill px-4">
            <i className="bi bi-arrow-left me-1"></i> Back to Resources Catalog
          </Link>
        </div>
      </MainLayout>
    );
  }

  const typeCfg = RESOURCE_TYPES[resource.resource_type] || RESOURCE_TYPES.file;
  const assets = Array.isArray(resource.assets) ? resource.assets : [];

  // Grouped Assets
  const skillMdAsset = assets.find((a) => a.name?.toLowerCase() === 'skill.md') || assets.find((a) => a.asset_type === 'documentation');
  const templateAssets = assets.filter((a) => a.asset_type === 'template' || a.name?.toLowerCase().endsWith('.xlsx'));
  const screenshotAssets = (resource.visual_evidence && Array.isArray(resource.visual_evidence) && resource.visual_evidence.length > 0)
    ? resource.visual_evidence
    : assets.filter((a) => a.asset_type === 'screenshot');

  // Source URLs verification (with CMS visibility controls)
  const showSourceSection = resource.show_source_section !== false;
  const showSourceLinks = resource.show_source_links !== false;
  const showDocLinks = resource.show_documentation_links !== false;
  
  const validSourceUrl = showSourceLinks && resource.source_url && resource.source_url.startsWith('http') ? resource.source_url : null;
  const validDocUrl = showDocLinks && resource.documentation_url && resource.documentation_url.startsWith('http') ? resource.documentation_url : null;
  const hasValidSource = showSourceSection && Boolean(validSourceUrl || validDocUrl);

  return (
    <MainLayout>
      <SEO
        title={`${resource.title} — Resources & Skills`}
        description={resource.short_description || resource.description}
        canonical={`/resources/${resource.slug}`}
      />

      <div className="resource-detail-wrap">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <div className="d-flex align-items-center gap-2 small text-muted mb-4">
            <Link to="/resources" className="text-decoration-none text-secondary hover-text-primary">
              Resources
            </Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            <span
              className="badge rounded-pill"
              style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}
            >
              <i className={`bi ${typeCfg.icon} me-1`}></i>
              {typeCfg.label}
            </span>
            <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            <span className="text-dark fw-semibold text-truncate">{resource.title}</span>
          </div>

          {/* 1. SIMPLIFIED HERO BLOCK (Requirement 2) */}
          <div className="resource-detail-hero">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-8">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <span
                    className="resource-type-pill"
                    style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}
                  >
                    <i className={`bi ${typeCfg.icon}`}></i>
                    {typeCfg.label}
                  </span>
                  {resource.featured && (
                    <span className="resource-featured-pill">
                      <i className="bi bi-star-fill text-[9px]"></i> Featured
                    </span>
                  )}
                  {resource.license && (
                    <span className="badge bg-light text-muted border" style={{ fontSize: '0.72rem' }}>
                      License: {resource.license}
                    </span>
                  )}
                </div>

                <h1 className="resource-detail-title">{resource.title}</h1>

                <p className="resource-detail-lead mb-4">
                  {resource.short_description || resource.description}
                </p>

                {/* Clear meta badge line */}
                <div className="d-flex flex-wrap align-items-center gap-3 text-secondary small pt-3 border-top border-light-subtle">
                  <span>v{resource.version || '1.0.0'}</span>
                  <span>·</span>
                  <span>{assets.length} assets included</span>
                  <span>·</span>
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1 rounded-pill">
                    Free download
                  </span>
                </div>
              </div>

              {/* Action CTAs: Hierarchy reversed */}
              <div className="col-12 col-lg-4">
                <div className="resource-action-box">
                  <button
                    type="button"
                    onClick={() => handleOpenLeadModal()}
                    className="btn btn-primary-custom rounded-pill py-3 px-4 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-xs"
                    style={{ fontSize: '0.95rem' }}
                  >
                    <i className="bi bi-download"></i>
                    <span>Download Free Bundle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMarkdownViewer(skillMdAsset)}
                    className="btn btn-outline-custom rounded-pill py-2.5 px-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <i className="bi bi-file-earmark-code"></i>
                    <span>Read Skill</span>
                  </button>

                  <div className="text-muted text-center" style={{ fontSize: '0.75rem' }}>
                    Instant download · No credit card required
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. BODY CONTENT */}
          <div className="row g-4 mb-5">
            {/* Main Column */}
            <div className="col-12 col-lg-8">
              {/* Overview & Purpose */}
              {resource.purpose && (
                <div className="resource-block">
                  <h3 className="resource-block-title">
                    <i className="bi bi-bullseye" style={{ color: 'var(--green)' }}></i>
                    <span>Overview &amp; Purpose</span>
                  </h3>
                  <p className="text-secondary leading-relaxed mb-0" style={{ whiteSpace: 'pre-line' }}>
                    {resource.purpose}
                  </p>
                </div>
              )}

              {/* When to use vs When NOT to use */}
              {(resource.when_to_use || resource.when_not_to_use) && (
                <div className="row g-3 mb-4">
                  {resource.when_to_use && (
                    <div className="col-12 col-md-6">
                      <div className="h-100 p-4 rounded-4 border" style={{ backgroundColor: 'var(--green-soft)', borderColor: 'rgba(8, 127, 102, 0.2)' }}>
                        <div className="fw-bold small text-uppercase mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--green)' }}>
                          <i className="bi bi-check-circle-fill"></i>
                          <span>When to Use</span>
                        </div>
                        {Array.isArray(resource.when_to_use) ? (
                          <ul className="small text-dark mb-0 ps-3">
                            {resource.when_to_use.map((item, idx) => (
                              <li key={idx} className="mb-1.5">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="small text-dark mb-0 whitespace-pre-line">{resource.when_to_use}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {resource.when_not_to_use && (
                    <div className="col-12 col-md-6">
                      <div className="h-100 p-4 rounded-4 border bg-danger bg-opacity-10 border-danger border-opacity-25">
                        <div className="fw-bold small text-uppercase text-danger mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-x-circle-fill"></i>
                          <span>When NOT to Use</span>
                        </div>
                        {Array.isArray(resource.when_not_to_use) ? (
                          <ul className="small text-dark mb-0 ps-3">
                            {resource.when_not_to_use.map((item, idx) => (
                              <li key={idx} className="mb-1.5">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="small text-dark mb-0 whitespace-pre-line">{resource.when_not_to_use}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Autonomous Pipeline & How to Use (with one-click Copy) */}
              {resource.how_to_use && (
                <div className="resource-block">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="resource-block-title mb-0">
                      <i className="bi bi-terminal" style={{ color: 'var(--green)' }}></i>
                      <span>How to Use &amp; Autonomous Pipeline</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(resource.how_to_use, 'pipeline')}
                      className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {copiedKey === 'pipeline' ? (
                        <>
                          <i className="bi bi-check-lg text-success me-1"></i> Copied
                        </>
                      ) : (
                        <>
                          <i className="bi bi-clipboard me-1"></i> Copy Prompt
                        </>
                      )}
                    </button>
                  </div>
                  <div className="resource-code-box">
                    <pre className="m-0 text-white" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                      {resource.how_to_use}
                    </pre>
                  </div>
                </div>
              )}

              {/* Example Output & Responsive Evidence */}
              {screenshotAssets.length > 0 && (
                <div className="resource-block">
                  <h3 className="resource-block-title">
                    <i className="bi bi-images" style={{ color: 'var(--green)' }}></i>
                    <span>Example Output &amp; Responsive Evidence</span>
                  </h3>
                  <p className="text-secondary small mb-4">
                    Real examples of the resource in action across desktop, tablet and mobile contexts.
                  </p>

                  <div className="row g-3">
                    {screenshotAssets.map((asset, idx) => (
                      <div key={idx} className="col-12 col-sm-6">
                        <div
                          className="screenshot-evidence-card"
                          onClick={() => setActivePreviewAsset(asset)}
                        >
                          <img
                            src={asset.file_url || asset.asset_path}
                            alt={asset.name || asset.title}
                            className="screenshot-preview-thumb"
                            loading="lazy"
                          />
                          <div className="screenshot-meta">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold small text-dark text-truncate">{asset.name || asset.title}</span>
                              <span className="badge bg-light text-muted border" style={{ fontSize: '0.65rem' }}>
                                {asset.device || asset.viewport || 'Capture'}
                              </span>
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {asset.caption || asset.description || 'Heuristic audit capture proof'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support card moved to Download Success state. Not rendered here by default unless configured differently. */}

              {/* Blank Templates & Workbooks (Requirement 7) */}
              {templateAssets.length > 0 && (
                <div className="resource-block">
                  <h3 className="resource-block-title mb-2">
                    <i className="bi bi-file-earmark-spreadsheet" style={{ color: 'var(--green)' }}></i>
                    <span>Blank Templates &amp; Workbooks</span>
                  </h3>
                  <p className="text-secondary small mb-4">
                    Reusable starter workbooks to accompany this skill. Free download with structured findings sheets.
                  </p>

                  <div className="d-flex flex-column gap-3">
                    {templateAssets.map((template, idx) => (
                      <ResourceTemplateCard
                        key={idx}
                        template={template}
                        onDownload={(t) => handleOpenLeadModal(t)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Source Section (Only if valid source exists, Requirement 10) */}
              {hasValidSource && (
                <div className="resource-block">
                  <h3 className="resource-block-title mb-3">
                    <i className="bi bi-link-45deg" style={{ color: 'var(--green)' }}></i>
                    <span>Source &amp; Documentation Links</span>
                  </h3>
                  <div className="d-flex flex-wrap gap-3">
                    {validSourceUrl && (
                      <a
                        href={validSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-custom rounded-pill btn-sm px-3 d-inline-flex align-items-center gap-2"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                        <span>Official Source Link</span>
                      </a>
                    )}
                    {validDocUrl && (
                      <a
                        href={validDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-custom rounded-pill btn-sm px-3 d-inline-flex align-items-center gap-2"
                      >
                        <i className="bi bi-book"></i>
                        <span>Documentation Link</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="col-12 col-lg-4">
              {/* Compatibility Matrix */}
              {Array.isArray(resource.compatibility) && resource.compatibility.length > 0 && (
                <div className="resource-block mb-4">
                  <h4 className="fw-bold font-heading mb-3 small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                    <i className="bi bi-cpu me-1" style={{ color: 'var(--green)' }}></i> Compatibility
                  </h4>
                  <div className="d-flex flex-column gap-2">
                    {resource.compatibility.map((item, idx) => {
                      const name = typeof item === 'object' ? item.name : item;
                      const status = typeof item === 'object' ? item.status : 'verified';
                      const notes = typeof item === 'object' ? item.notes : '';

                      return (
                        <div key={idx} className="p-2.5 rounded-3 bg-light border border-light-subtle">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold small text-dark">{name}</span>
                            <span className={`badge ${status === 'verified' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.68rem' }}>
                              {status === 'verified' ? '✓ Verified' : 'Compatible'}
                            </span>
                          </div>
                          {notes && <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>{notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Installation Paths */}
              <div className="resource-block mb-4">
                <h4 className="fw-bold font-heading mb-3 small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                  <i className="bi bi-folder-symlink me-1" style={{ color: 'var(--green)' }}></i> Installation Paths
                </h4>
                <div className="space-y-3">
                  <div className="mb-3">
                    <div className="small text-secondary fw-semibold mb-1">Global Skill Path:</div>
                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border font-monospace" style={{ fontSize: '0.72rem' }}>
                      <span className="text-dark text-truncate">~/.gemini/config/skills/{resource.slug}/</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`~/.gemini/config/skills/${resource.slug}/`, 'global')}
                        className="btn btn-sm btn-link text-secondary p-0 ms-2 text-decoration-none"
                      >
                        {copiedKey === 'global' ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-copy"></i>}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="small text-secondary fw-semibold mb-1">Workspace Skill Path:</div>
                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border font-monospace" style={{ fontSize: '0.72rem' }}>
                      <span className="text-dark text-truncate">.agents/skills/{resource.slug}/</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`.agents/skills/${resource.slug}/`, 'workspace')}
                        className="btn btn-sm btn-link text-secondary p-0 ms-2 text-decoration-none"
                      >
                        {copiedKey === 'workspace' ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-copy"></i>}
                      </button>
                    </div>
                  </div>

                  {resource.installation && (
                    <div className="pt-2 border-top">
                      <div className="small text-secondary fw-semibold mb-1">Setup Instructions:</div>
                      <pre className="p-2.5 rounded-3 bg-light border text-secondary font-monospace m-0" style={{ fontSize: '0.72rem', whiteSpace: 'pre-wrap' }}>
                        {resource.installation}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {Array.isArray(resource.tags) && resource.tags.length > 0 && (
                <div className="resource-block">
                  <h4 className="fw-bold font-heading mb-3 small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                    <i className="bi bi-tags me-1" style={{ color: 'var(--green)' }}></i> Tags &amp; Classification
                  </h4>
                  <div className="d-flex flex-wrap gap-1.5">
                    {resource.tags.map((tag, idx) => (
                      <span key={idx} className="resource-tag-chip">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Back Nav */}
          <div className="d-flex justify-content-between align-items-center pt-3 pb-5">
            <Link to="/resources" className="text-link">
              <i className="bi bi-arrow-left"></i> Back to all resources
            </Link>
            <a href="#top" className="text-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top <i className="bi bi-arrow-up"></i>
            </a>
          </div>
        </div>
      </div>

      {/* LEAD CAPTURE MODAL (Requirement 4) */}
      <ResourceLeadFormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        resource={resource}
        asset={selectedDownloadAsset}
      />

      {/* READ SKILL MARKDOWN VIEWER (Requirement 3) */}
      <ResourceMarkdownViewerModal
        isOpen={isMarkdownViewerOpen}
        onClose={() => setIsMarkdownViewerOpen(false)}
        asset={selectedMarkdownAsset}
        title={`${resource.title} — SKILL.md Playbook`}
      />

      {/* IMAGE / LIGHTBOX MODAL */}
      {activePreviewAsset && (
        <div className="resource-lightbox-modal" onClick={() => setActivePreviewAsset(null)}>
          <div className="resource-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="resource-lightbox-header">
              <div className="d-flex align-items-center gap-2 min-w-0">
                <i className="bi bi-image text-success fs-5"></i>
                <div className="min-w-0">
                  <div className="fw-bold text-dark text-truncate small">{activePreviewAsset.name || activePreviewAsset.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>{activePreviewAsset.device || activePreviewAsset.file_url}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewAsset(null)}
                className="btn btn-sm btn-light rounded-circle"
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="resource-lightbox-body text-center p-4">
              <img
                src={activePreviewAsset.file_url || activePreviewAsset.asset_path}
                alt={activePreviewAsset.name || activePreviewAsset.title}
                className="img-fluid rounded-3 shadow-sm mx-auto"
                style={{ maxHeight: '72vh', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
