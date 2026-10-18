import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import { getResourceBySlug, getResourcePreviewAsset, getResourcePreviewImage } from '../services/resources';
import { RESOURCE_TYPES } from '../config/resourceTypes';
import ResourceLeadFormModal from '../components/resources/ResourceLeadFormModal';
import ResourceMarkdownViewerModal from '../components/resources/ResourceMarkdownViewerModal';
import ResourceTemplateCard from '../components/resources/ResourceTemplateCard';
import ResourceSupportCard from '../components/resources/ResourceSupportCard';
import Markdown from '../components/cms/Markdown';
import { isResourceFeatureEnabled } from '../config/resourceTypeDetails';
import '../styles/resources.css';

const TYPE_DETAIL_FIELDS = {
  template: [['Format', 'template_format'], ['Framework / tool', 'framework'], ['Included files', 'included_files']],
  figma: [['Figma file', 'figma_url'], ['Design scope', 'design_scope'], ['Access', 'access_requirements']],
  document: [['Format', 'document_format'], ['Category', 'document_category'], ['Pages', 'page_count'], ['Published', 'publication_date'], ['Provenance', 'citation']],
  guide: [['Audience', 'audience'], ['Difficulty', 'difficulty'], ['Estimated time', 'estimated_time'], ['Prerequisites', 'prerequisites'], ['Outcomes', 'learning_outcomes']],
  prompt: [['Format', 'prompt_format'], ['Model compatibility', 'model_compatibility'], ['Variables', 'variables'], ['Example input', 'example_input'], ['Example output', 'example_output'], ['Safety notes', 'safety_notes']],
  example: [['Demo', 'demo_url'], ['Status', 'implementation_status'], ['Stack', 'stack'], ['Outcome', 'outcome']],
  spreadsheet: [['Format', 'spreadsheet_format'], ['Compatible tools', 'compatible_tools'], ['Sheets', 'sheet_names'], ['Purpose', 'model_purpose'], ['Sample data', 'sample_data_notes']],
  file: [['Format', 'file_format'], ['Platform', 'platform'], ['Usage notes', 'usage_notes']],
  reference: [['Official URL', 'official_url'], ['Reference type', 'reference_type'], ['Provider', 'provider'], ['Version', 'reference_version'], ['Access notes', 'access_notes']],
};

const TYPE_DETAIL_LABELS = {
  fr: {
    prompt: { prompt_format: 'Format', model_compatibility: 'Compatibilité des modèles', variables: 'Variables / entrées', example_input: 'Exemple d’entrée', example_output: 'Exemple de sortie', safety_notes: 'Notes de sécurité' },
  },
  ar: {
    prompt: { prompt_format: 'الصيغة', model_compatibility: 'توافق النماذج', variables: 'المتغيرات / المدخلات', example_input: 'مثال على المدخل', example_output: 'مثال على المخرج', safety_notes: 'ملاحظات الأمان' },
  },
};

const hasRenderableContent = (value) => {
  if (Array.isArray(value)) return value.some((item) => hasRenderableContent(item));
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined && value !== null && Boolean(value);
};

const pickLocalizedContent = (localized, fallback) => (
  hasRenderableContent(localized) ? localized : fallback
);

export default function ResourceDetailPage() {
  const { t, i18n } = useTranslation();
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
  const [previewZoom, setPreviewZoom] = useState(1);
  const [activeCoverIndex, setActiveCoverIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeUsageMode, setActiveUsageMode] = useState('manual');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    setActiveCoverIndex(0);
  }, [slug]);

  useEffect(() => {
    setPreviewZoom(1);
  }, [activePreviewAsset]);

  useEffect(() => {
    if (!activePreviewAsset) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActivePreviewAsset(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewAsset]);

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
            <span className="visually-hidden">{t('resourceDetail.loadingBundle')}</span>
          </div>
          <div className="text-secondary small">{t('resourceDetail.loadingDetails')}</div>
        </div>
      </MainLayout>
    );
  }

  if (error || !resource) {
    return (
      <MainLayout>
        <SEO title={t('resourceDetail.notFoundSeo')} description={t('resourceDetail.notFoundDesc')} canonical={`/resources/${slug}`} />
        <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
          <i className="bi bi-file-earmark-x text-muted display-3 mb-3 d-block"></i>
          <h2 className="fw-bold font-heading mb-2">{t('resourceDetail.notFoundTitle')}</h2>
          <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '460px' }}>
            {t('resourceDetail.notFoundBody', { slug })}
          </p>
          <Link to="/resources" className="btn btn-primary-custom rounded-pill px-4">
            <i className="bi bi-arrow-left me-1"></i> {t('resourceDetail.backToCatalog')}
          </Link>
        </div>
      </MainLayout>
    );
  }

  const typeCfg = RESOURCE_TYPES[resource.resource_type] || RESOURCE_TYPES.file;
  const currentLang = i18n.language?.startsWith('fr')
    ? 'fr'
    : (i18n.language?.startsWith('ar') ? 'ar' : 'en');
  const zoomCopy = currentLang === 'fr'
    ? { out: 'Réduire', in: 'Agrandir', fit: 'Ajuster', controls: 'Contrôles de zoom', open: 'Agrandir l’image', close: 'Fermer l’aperçu', preview: 'Aperçu de l’image' }
    : currentLang === 'ar'
      ? { out: 'تصغير', in: 'تكبير', fit: 'ملاءمة', controls: 'أدوات تكبير الصورة', open: 'تكبير معاينة الصورة', close: 'إغلاق معاينة الصورة', preview: 'معاينة الصورة' }
      : { out: 'Zoom out', in: 'Zoom in', fit: 'Fit', controls: 'Image zoom controls', open: 'Open full-size image preview', close: 'Close image preview', preview: 'Image preview' };
  const tx = resource?.i18n?.[currentLang] || resource?.metadata?.i18n?.[currentLang] || {};
  const assets = (Array.isArray(resource.assets) ? resource.assets : []).map((asset) => ({
    ...asset,
    i18n: {
      ...(asset.i18n || {}),
      ...(tx.assets?.[asset.id] ? { [currentLang]: tx.assets[asset.id] } : {}),
    },
  }));
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

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

  const displayTitle = tx.title || resource.title;
  const displayDesc = tx.short_description || tx.description || resource.short_description || resource.description;
  const displayOverview = tx.description || resource.description;
  const displayPurpose = tx.purpose || resource.purpose;
  const displayWhenToUse = pickLocalizedContent(tx.when_to_use, resource.when_to_use);
  const displayWhenNotToUse = pickLocalizedContent(tx.when_not_to_use, resource.when_not_to_use);
  const displayHowToUse = pickLocalizedContent(tx.how_to_use, resource.how_to_use);
  const hasWorkflowUsage = isResourceFeatureEnabled(resource.resource_type, 'workflowUsage');
  const hasWorkedExample = isResourceFeatureEnabled(resource.resource_type, 'workedExample');
  const workflowUsageRaw = hasWorkflowUsage ? (resource.workflow_usage || resource.metadata?.workflow_usage) : null;
  const workflowUsage = workflowUsageRaw ? { ...workflowUsageRaw, ...(workflowUsageRaw.i18n?.[currentLang] || {}) } : null;
  const workedExampleRaw = hasWorkedExample ? (resource.worked_example || resource.metadata?.worked_example) : null;
  const workedExample = workedExampleRaw ? { ...workedExampleRaw, ...(workedExampleRaw.i18n?.[currentLang] || {}) } : null;
  const isSkillResource = resource.resource_type === 'skill';
  const displayInstallation = isSkillResource ? pickLocalizedContent(tx.installation, resource.installation) : null;
  const displayCompatibility = isSkillResource ? pickLocalizedContent(tx.compatibility, resource.compatibility) : null;
  const displayTags = tx.tags || resource.tags;
  const typeDetailRows = (TYPE_DETAIL_FIELDS[resource.resource_type] || [])
    .map(([label, key]) => ({
      label: TYPE_DETAIL_LABELS[currentLang]?.[resource.resource_type]?.[key] || label,
      value: tx[key] ?? resource[key] ?? resource.metadata?.[key],
    }))
    .filter(({ value }) => value !== undefined && value !== null && String(value).trim() !== '');
  const localizedAssetText = (asset, field) => tx.assets?.[asset.id]?.[field] || asset.i18n?.[currentLang]?.[field] || asset[field];
  const previewAsset = getResourcePreviewAsset(resource);
  const previewImage = getResourcePreviewImage(resource);
  const coverAssetIds = new Set([
    previewAsset?.id,
    ...assets.filter((asset) => asset.is_cover || asset.is_gallery || asset.gallery || asset.featured_in_gallery).map((asset) => asset.id),
  ].filter(Boolean));
  const contentScreenshotAssets = screenshotAssets.filter((asset) => !coverAssetIds.has(asset.id));
  const coverGalleryAssets = [previewAsset, ...assets.filter((asset) => {
    const url = asset.file_url || asset.asset_path || asset.url || asset.preview_url || asset.image_url || asset.public_url || '';
    return (asset.is_gallery || asset.gallery || asset.featured_in_gallery) && (/^image\//i.test(asset.mime_type || '') || /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url));
  })].filter(Boolean).filter((asset, index, all) => {
    const url = asset.file_url || asset.asset_path || asset.url || asset.preview_url || asset.image_url || asset.public_url || '';
    return all.findIndex((candidate) => (candidate.file_url || candidate.asset_path || candidate.url || candidate.preview_url || candidate.image_url || candidate.public_url || '') === url) === index;
  });
  const activeCoverAsset = coverGalleryAssets[activeCoverIndex] || coverGalleryAssets[0] || previewAsset;
  const activeCoverImage = activeCoverAsset?.file_url || activeCoverAsset?.asset_path || activeCoverAsset?.url || activeCoverAsset?.preview_url || activeCoverAsset?.image_url || activeCoverAsset?.public_url || previewImage;

  return (
    <MainLayout>
      <SEO
        title={`${displayTitle} — Resources & Skills`}
        description={displayDesc}
        canonical={`/resources/${resource.slug}`}
        image={getResourcePreviewImage(resource)}
      />

      <div className="resource-detail-wrap">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <div className="d-flex align-items-center gap-2 small text-muted mb-4">
            <Link to="/resources" className="text-decoration-none text-secondary hover-text-primary">
              {t('nav.resources', 'Resources')}
            </Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            <span
              className="badge rounded-pill"
              style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}
            >
              <i className={`bi ${typeCfg.icon} me-1`}></i>
              {t(`resources.types.${resource.resource_type}.label`, typeCfg.label)}
            </span>
            <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            <span className="text-dark fw-semibold text-truncate">{displayTitle}</span>
          </div>

          {/* 1. SIMPLIFIED HERO BLOCK */}
          <div className="resource-detail-hero">
            <div className={`resource-detail-cover${activeCoverImage ? '' : ' resource-detail-cover-fallback'}`}>
              {activeCoverImage ? (
                <>
                  <img
                    src={activeCoverImage}
                    alt={activeCoverAsset?.caption || `${displayTitle} cover`}
                    loading="eager"
                    decoding="async"
                  />
                  {coverGalleryAssets.length > 1 && (
                    <>
                      <button type="button" className="resource-cover-control resource-cover-control-prev" onClick={() => setActiveCoverIndex((activeCoverIndex - 1 + coverGalleryAssets.length) % coverGalleryAssets.length)} aria-label="Previous cover image">
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button type="button" className="resource-cover-control resource-cover-control-next" onClick={() => setActiveCoverIndex((activeCoverIndex + 1) % coverGalleryAssets.length)} aria-label="Next cover image">
                        <i className="bi bi-chevron-right"></i>
                      </button>
                      <div className="resource-cover-dots" aria-label="Cover image selector">
                        {coverGalleryAssets.map((asset, index) => (
                          <button type="button" key={asset.id || index} className={`resource-cover-dot${index === activeCoverIndex ? ' is-active' : ''}`} onClick={() => setActiveCoverIndex(index)} aria-label={`Show cover image ${index + 1}`}></button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="resource-detail-cover-placeholder" aria-hidden="true">
                  <i className={`bi ${typeCfg.icon}`}></i>
                  <span>{displayTitle}</span>
                </div>
              )}
            </div>
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-8">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <span
                    className="resource-type-pill"
                    style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}
                  >
                    <i className={`bi ${typeCfg.icon}`}></i>
                    {t(`resources.types.${resource.resource_type}.label`, typeCfg.label)}
                  </span>
                  {resource.featured && (
                    <span className="resource-featured-pill">
                      <i className="bi bi-star-fill text-[9px]"></i> {t('resources.featured', 'Featured')}
                    </span>
                  )}
                  {resource.license && (
                    <span className="badge bg-light text-muted border" style={{ fontSize: '0.72rem' }}>
                      {t('resourceDetail.license', 'License')}: {resource.license}
                    </span>
                  )}
                </div>

                <h1 className="resource-detail-title">{displayTitle}</h1>

                <p className="resource-detail-lead mb-4">
                  {displayDesc}
                </p>

                {/* Clear meta badge line */}
                <div className="d-flex flex-wrap align-items-center gap-3 text-secondary small pt-3 border-top border-light-subtle">
                  <span>v{resource.version || '1.0.0'}</span>
                  <span>·</span>
                  <span>{t('resources.assets', { count: assets.length })}</span>
                  <span>·</span>
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1 rounded-pill">
                    {t('resourceDetail.freeDownload')}
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
                    <span>{t('resourceDetail.downloadBundle')}</span>
                  </button>

                  {isSkillResource && skillMdAsset && (
                    <button
                      type="button"
                      onClick={() => handleOpenMarkdownViewer(skillMdAsset)}
                      className="btn btn-outline-custom rounded-pill py-2.5 px-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-file-earmark-code"></i>
                      <span>{t('resourceDetail.readSkill')}</span>
                    </button>
                  )}

                  <div className="text-muted text-center" style={{ fontSize: '0.75rem' }}>
                    {t('resourceDetail.instantDownload')}
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
              {displayPurpose && (
                <div className="resource-block">
                  <h3 className="resource-block-title">
                    <i className="bi bi-bullseye" style={{ color: 'var(--green)' }}></i>
                    <span>{t('resourceDetail.overview')}</span>
                  </h3>
                  <p className="text-secondary leading-relaxed mb-0" style={{ whiteSpace: 'pre-line' }}>
                    {displayPurpose}
                  </p>
                </div>
              )}

              {displayOverview && displayOverview !== displayDesc && (
                <div className="resource-block">
                  <h3 className="resource-block-title">
                    <i className="bi bi-file-text" style={{ color: 'var(--green)' }}></i>
                    <span>Full overview</span>
                  </h3>
                  <Markdown className="resource-detail-overview" text={displayOverview} />
                </div>
              )}

              {typeDetailRows.length > 0 && (
                <div className="resource-block resource-type-details-block">
                  <h3 className="resource-block-title">
                    <i className={`bi ${typeCfg.icon}`} style={{ color: 'var(--green)' }}></i>
                    <span>{typeCfg.label} details</span>
                  </h3>
                  <div className="resource-type-details-grid">
                    {typeDetailRows.map(({ label, value }) => (
                      <div className="resource-type-detail" key={label}>
                        <div className="resource-type-detail-label">{label}</div>
                        <div className="resource-type-detail-value">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* When to use vs When NOT to use */}
              {(hasRenderableContent(displayWhenToUse) || hasRenderableContent(displayWhenNotToUse)) && (
                <div className="row g-3 mb-4">
                  {hasRenderableContent(displayWhenToUse) && (
                    <div className="col-12 col-md-6">
                      <div className="h-100 p-4 rounded-4 border" style={{ backgroundColor: 'var(--green-soft)', borderColor: 'rgba(8, 127, 102, 0.2)' }}>
                        <div className="fw-bold small text-uppercase mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--green)' }}>
                          <i className="bi bi-check-circle-fill"></i>
                          <span>{t('resourceDetail.whenToUse')}</span>
                        </div>
                        {Array.isArray(displayWhenToUse) ? (
                          <ul className="small text-dark mb-0 ps-3">
                            {displayWhenToUse.filter((item) => hasRenderableContent(item)).map((item, idx) => (
                              <li key={idx} className="mb-1.5">{String(item)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="small text-dark mb-0 whitespace-pre-line">{displayWhenToUse}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {hasRenderableContent(displayWhenNotToUse) && (
                    <div className="col-12 col-md-6">
                      <div className="h-100 p-4 rounded-4 border bg-danger bg-opacity-10 border-danger border-opacity-25">
                        <div className="fw-bold small text-uppercase text-danger mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-x-circle-fill"></i>
                          <span>{t('resourceDetail.whenNotToUse')}</span>
                        </div>
                        {Array.isArray(displayWhenNotToUse) ? (
                          <ul className="small text-dark mb-0 ps-3">
                            {displayWhenNotToUse.filter((item) => hasRenderableContent(item)).map((item, idx) => (
                              <li key={idx} className="mb-1.5">{String(item)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="small text-dark mb-0 whitespace-pre-line">{displayWhenNotToUse}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Autonomous Pipeline & How to Use (with one-click Copy) */}
              {workflowUsage?.enabled && (
                <div className="resource-block workflow-usage-section">
                  <div className="workflow-usage-heading">
                    <div>
                      <h3 className="resource-block-title mb-2">
                        <i className="bi bi-signpost-split" style={{ color: 'var(--green)' }}></i>
                        <span>{workflowUsage.title || 'Where to use this workflow'}</span>
                      </h3>
                      <p className="text-secondary small mb-0">{workflowUsage.subtitle}</p>
                    </div>
                  </div>
                  <div className="workflow-mode-tabs" role="tablist" aria-label={workflowUsage.title}>
                    {(workflowUsage.modes || []).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        className={`workflow-mode-tab ${activeUsageMode === mode.id ? 'active' : ''}`}
                        onClick={() => setActiveUsageMode(mode.id)}
                        role="tab"
                        aria-selected={activeUsageMode === mode.id}
                      >
                        <i className={`bi ${mode.icon || 'bi-stars'}`}></i>
                        <span>{mode.title}</span>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const mode = (workflowUsage.modes || []).find((item) => item.id === activeUsageMode) || workflowUsage.modes?.[0];
                    if (!mode) return null;
                    return (
                      <div className="workflow-usage-panel">
                        <div className="workflow-usage-copy">
                          <span className="workflow-usage-badge">{mode.badge}</span>
                          <h4>{mode.title}</h4>
                          <p>{mode.description}</p>
                          <div className="workflow-tool-chips">
                            {(mode.tools || []).map((tool) => <span key={tool}>{tool}</span>)}
                          </div>
                        </div>
                        <div className="workflow-usage-flow" aria-label={mode.flow?.join(' → ')}>
                          {(mode.flow || []).map((step, index) => (
                            <React.Fragment key={`${step}-${index}`}>
                              <span className={`workflow-flow-node ${index === 1 ? 'ai' : index === (mode.flow.length - 2) ? 'human' : ''}`}>{step}</span>
                              {index < mode.flow.length - 1 && <i className="bi bi-arrow-right workflow-flow-arrow"></i>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {activeUsageMode === 'manual' && workflowUsage.prompt && (
                    <div className="workflow-prompt-callout">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                          <div className="workflow-prompt-kicker"><i className="bi bi-stars me-1"></i>{workflowUsage.promptLabel || 'Ready-to-use prompt included'}</div>
                          <p className="small text-secondary mb-0">{workflowUsage.promptHelp || 'Copy this prompt and paste it into ChatGPT, Claude, or Gemini.'}</p>
                        </div>
                        <button type="button" className="btn btn-sm btn-primary-custom rounded-pill px-3 flex-shrink-0" onClick={() => handleCopy(workflowUsage.prompt, 'workflow-prompt')}>
                          {copiedKey === 'workflow-prompt' ? <><i className="bi bi-check-lg me-1"></i>{t('share.copied')}</> : <><i className="bi bi-copy me-1"></i>{workflowUsage.copyPromptLabel || t('resourceDetail.copyPrompt')}</>}
                        </button>
                      </div>
                      <pre className="workflow-prompt-preview">{workflowUsage.prompt}</pre>
                    </div>
                  )}
                </div>
              )}

              {workedExample?.enabled && (
                <div className="resource-block worked-example-section">
                  <h3 className="resource-block-title mb-2">
                    <i className="bi bi-diagram-3" style={{ color: 'var(--green)' }}></i>
                    <span>{workedExample.title}</span>
                  </h3>
                  <p className="text-secondary small mb-4">{workedExample.subtitle}</p>
                  <div className="worked-example-grid">
                    {(workedExample.stages || []).map((stage, index) => (
                      <div className="worked-example-card" key={stage.title}>
                        <div className="worked-example-step">{String(index + 1).padStart(2, '0')}</div>
                        <h4>{stage.title}</h4>
                        {stage.visual_asset_id && assetById.get(stage.visual_asset_id) && (
                          <button
                            type="button"
                            className="worked-example-visual-trigger"
                            onClick={() => setActivePreviewAsset(assetById.get(stage.visual_asset_id))}
                            aria-label={`${zoomCopy.open}: ${localizedAssetText(assetById.get(stage.visual_asset_id), 'name') || stage.title}`}
                          >
                            <img
                              src={assetById.get(stage.visual_asset_id).file_url || assetById.get(stage.visual_asset_id).asset_path}
                              alt={localizedAssetText(assetById.get(stage.visual_asset_id), 'name') || stage.title}
                              className="worked-example-visual"
                              style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 12, marginBottom: 16, background: 'var(--warm)' }}
                              loading="lazy"
                            />
                          </button>
                        )}
                        <div><strong>{stage.inputLabel}</strong><p>{stage.input}</p></div>
                        <div><strong>{stage.aiLabel}</strong><p>{stage.ai}</p></div>
                        <div><strong>{stage.humanLabel}</strong><p>{stage.human}</p></div>
                        <div className="worked-example-output"><strong>{stage.outputLabel}</strong><p>{stage.output}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Autonomous Pipeline & How to Use (with one-click Copy) */}
              {displayHowToUse && (
                <div className="resource-block">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="resource-block-title mb-0">
                      <i className="bi bi-terminal" style={{ color: 'var(--green)' }}></i>
                      <span>{t('resourceDetail.howToUse')}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(displayHowToUse, 'pipeline')}
                      className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {copiedKey === 'pipeline' ? (
                        <>
                          <i className="bi bi-check-lg text-success me-1"></i> {t('share.copied')}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-clipboard me-1"></i> {workflowUsage ? (currentLang === 'ar' ? 'نسخ طريقة الاستخدام' : currentLang === 'fr' ? 'Copier le mode d’emploi' : 'Copy usage instructions') : t('resourceDetail.copyPrompt')}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="resource-code-box">
                    <pre className="m-0 text-white" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                      {displayHowToUse}
                    </pre>
                  </div>
                </div>
              )}

              {/* Example Output & Responsive Evidence */}
              {contentScreenshotAssets.length > 0 && (
                <div className="resource-block">
                  <h3 className="resource-block-title">
                    <i className="bi bi-images" style={{ color: 'var(--green)' }}></i>
                    <span>{t('resourceDetail.exampleOutput')}</span>
                  </h3>
                  <p className="text-secondary small mb-4">
                    {t('resourceDetail.exampleOutputSub')}
                  </p>

                  <div className="row g-3">
                    {contentScreenshotAssets.map((asset, idx) => (
                      <div key={idx} className="col-12 col-sm-6">
                        <div
                          className="screenshot-evidence-card"
                          onClick={() => setActivePreviewAsset(asset)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setActivePreviewAsset(asset);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${zoomCopy.open}: ${localizedAssetText(asset, 'name') || asset.title}`}
                        >
                          <img
                            src={asset.file_url || asset.asset_path}
                            alt={asset.name || asset.title}
                            className="screenshot-preview-thumb"
                            style={
                              asset.preview_aspect_ratio
                                ? {
                                    height: 'auto',
                                    aspectRatio: asset.preview_aspect_ratio,
                                    objectFit: 'contain',
                                  }
                                : undefined
                            }
                            loading="lazy"
                          />
                          <div className="screenshot-meta">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold small text-dark text-truncate">{localizedAssetText(asset, 'name') || asset.title}</span>
                              <span className="badge bg-light text-muted border" style={{ fontSize: '0.65rem' }}>
                                {asset.device || asset.viewport || t('resourceDetail.captureFallback')}
                              </span>
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {localizedAssetText(asset, 'caption') || localizedAssetText(asset, 'description') || t('resourceDetail.captureProof')}
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
                    <span>{t('resourceDetail.blankTemplates')}</span>
                  </h3>
                  <p className="text-secondary small mb-4">
                    {t('resourceDetail.blankTemplatesSub')}
                  </p>

                  <div className="d-flex flex-column gap-3">
                    {templateAssets.map((template, idx) => (
                      <ResourceTemplateCard
                        key={idx}
                        template={template}
                        onDownload={(tpl) => handleOpenLeadModal(tpl)}
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
                    <span>{t('resourceDetail.sourceLinks')}</span>
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
                        <span>{t('resourceDetail.officialSource')}</span>
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
                        <span>{t('resourceDetail.docLink')}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="col-12 col-lg-4">
              {/* Compatibility Matrix */}
              {Array.isArray(displayCompatibility) && displayCompatibility.length > 0 && (
                <div className="resource-block mb-4">
                  <h4 className="fw-bold font-heading mb-3 small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                    <i className="bi bi-cpu me-1" style={{ color: 'var(--green)' }}></i> {t('resourceDetail.compatibility')}
                  </h4>
                  <div className="d-flex flex-column gap-2">
                    {displayCompatibility.map((item, idx) => {
                      const name = typeof item === 'object' ? item.name : item;
                      const status = typeof item === 'object' ? item.status : 'verified';
                      const notes = typeof item === 'object' ? item.notes : '';

                      return (
                        <div key={idx} className="p-2.5 rounded-3 bg-light border border-light-subtle">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold small text-dark">{name}</span>
                            <span className={`badge ${status === 'verified' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.68rem' }}>
                              {status === 'verified' ? t('resourceDetail.verified') : t('resourceDetail.compatible')}
                            </span>
                          </div>
                          {notes && <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>{notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Installation Paths: only meaningful for agent skills. */}
              {isSkillResource && (
              <div className="resource-block mb-4">
                <h4 className="fw-bold font-heading mb-3 small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                  <i className="bi bi-folder-symlink me-1" style={{ color: 'var(--green)' }}></i> {t('resourceDetail.installPaths')}
                </h4>
                <div className="space-y-3">
                  <div className="mb-3">
                    <div className="small text-secondary fw-semibold mb-1">{t('resourceDetail.globalPath')}</div>
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
                    <div className="small text-secondary fw-semibold mb-1">{t('resourceDetail.workspacePath')}</div>
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

                  {displayInstallation && (
                    <div className="pt-2 border-top">
                      <div className="small text-secondary fw-semibold mb-1">{t('resourceDetail.setupInstructions')}</div>
                      <pre className="p-2.5 rounded-3 bg-light border text-secondary font-monospace m-0" style={{ fontSize: '0.72rem', whiteSpace: 'pre-wrap' }}>
                        {displayInstallation}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              )}

            </div>
          </div>

          {/* Tags & Classification: full-width footer block */}
          {Array.isArray(displayTags) && displayTags.length > 0 && (
            <div className="resource-block resource-tags-footer">
              <h4 className="fw-bold font-heading mb-3 small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                <i className="bi bi-tags me-1" style={{ color: 'var(--green)' }}></i> {t('resourceDetail.tagsClassification')}
              </h4>
              <div className="d-flex flex-wrap gap-1.5">
                {displayTags.map((tag, idx) => (
                  <span key={idx} className="resource-tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Back Nav */}
          <div className="d-flex justify-content-between align-items-center pt-3 pb-5">
            <Link to="/resources" className="text-link">
              <i className="bi bi-arrow-left"></i> {t('resourceDetail.backToResources')}
            </Link>
            <a href="#top" className="text-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {t('resourceDetail.backToTop')} <i className="bi bi-arrow-up"></i>
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
        <div
          id="resource-image-preview"
          className="resource-lightbox-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activePreviewAsset.name || activePreviewAsset.title || zoomCopy.preview}
          onClick={() => setActivePreviewAsset(null)}
        >
          <div className="resource-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="resource-lightbox-header">
              <div className="d-flex align-items-center gap-2 min-w-0">
                <i className="bi bi-image text-success fs-5"></i>
                <div className="min-w-0">
                  <div className="fw-bold text-dark text-truncate small">{activePreviewAsset.name || activePreviewAsset.title}</div>
                  {(activePreviewAsset.device || activePreviewAsset.viewport) && (
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {activePreviewAsset.device || activePreviewAsset.viewport}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewAsset(null)}
                className="btn btn-sm btn-light rounded-circle"
                aria-label={zoomCopy.close}
                autoFocus
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="resource-lightbox-toolbar" role="toolbar" aria-label={zoomCopy.controls}>
              <button type="button" className="btn btn-sm btn-light rounded-pill" onClick={() => setPreviewZoom((zoom) => Math.max(1, zoom - 0.25))} disabled={previewZoom <= 1}>
                <i className="bi bi-dash-lg me-1"></i>{zoomCopy.out}
              </button>
              <span className="small text-muted fw-semibold">{Math.round(previewZoom * 100)}%</span>
              <button type="button" className="btn btn-sm btn-light rounded-pill" onClick={() => setPreviewZoom((zoom) => Math.min(3, zoom + 0.25))} disabled={previewZoom >= 3}>
                <i className="bi bi-plus-lg me-1"></i>{zoomCopy.in}
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setPreviewZoom(1)}>{zoomCopy.fit}</button>
            </div>
            <div className="resource-lightbox-body text-center p-4">
              <img
                src={activePreviewAsset.file_url || activePreviewAsset.asset_path}
                alt={activePreviewAsset.name || activePreviewAsset.title}
                className="img-fluid rounded-3 shadow-sm mx-auto"
                style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 190px)', objectFit: 'contain', transform: `scale(${previewZoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
