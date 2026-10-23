import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../common/SEO';
import { getCaseStudySchema } from '../../lib/schema';
import { getFdeStageLabel, mergeLocalizedProcessStages, safeCaseStudyUrl, shouldRenderProcessStage } from '../../utils/caseStudyStages';

export default function StandardCaseStudy({ data }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language?.slice(0, 2) || 'en';
  const tx = data?.i18n?.[currentLang] || data?.metadata?.i18n?.[currentLang] || {};
  const txCase = tx?.caseStudy || {};

  const { slug } = data;
  const rawHero = data.hero || {};
  const liveProductUrl = typeof rawHero.liveProductUrl === 'string' && /^https?:\/\//i.test(rawHero.liveProductUrl.trim())
    ? rawHero.liveProductUrl.trim()
    : '';
  const rawChallenge = data.challenge || {};
  const rawContribution = data.contribution || {};
  const rawEvidence = data.evidence || {};
  const rawTechnology = data.technology || {};
  const rawCodeExample = rawContribution.codeExample || {};

  const hero = {
    ...rawHero,
    liveProductUrl,
    eyebrow: txCase.hero?.eyebrow || rawHero.eyebrow,
    title: txCase.hero?.title || tx.title || rawHero.title,
    lead: txCase.hero?.lead || tx.description || rawHero.lead,
    imageAlt: txCase.hero?.imageAlt || rawHero.imageAlt,
    caption: txCase.hero?.caption || rawHero.caption,
  };

  const challenge = {
    ...rawChallenge,
    eyebrow: txCase.challenge?.eyebrow || rawChallenge.eyebrow,
    title: txCase.challenge?.title || rawChallenge.title,
    copy: txCase.challenge?.copy || rawChallenge.copy,
    role: txCase.challenge?.role || rawChallenge.role,
    context: txCase.challenge?.context || rawChallenge.context,
  };

  const contribution = {
    ...rawContribution,
    eyebrow: txCase.contribution?.eyebrow || rawContribution.eyebrow,
    title: txCase.contribution?.title || rawContribution.title,
    items: Array.isArray(txCase.contribution?.items) && txCase.contribution.items.length > 0
      ? txCase.contribution.items
      : rawContribution.items,
    process: Array.isArray(rawContribution.process)
      ? mergeLocalizedProcessStages(rawContribution.process, txCase.contribution?.process)
      : rawContribution.process,
    codeExample: rawContribution.codeExample
      ? {
          ...rawCodeExample,
          title: txCase.contribution?.codeExample?.title || rawCodeExample.title,
          caption: txCase.contribution?.codeExample?.caption || rawCodeExample.caption,
        }
      : null,
  };

  const localizedEvidenceGallery = Array.isArray(txCase.evidence?.gallery) ? txCase.evidence.gallery : [];
  const evidence = {
    ...rawEvidence,
    eyebrow: txCase.evidence?.eyebrow || rawEvidence.eyebrow,
    title: txCase.evidence?.title || rawEvidence.title,
    caption: txCase.evidence?.caption || rawEvidence.caption,
    imageAlt: txCase.evidence?.imageAlt || rawEvidence.imageAlt,
    gallery: Array.isArray(rawEvidence.gallery)
      ? rawEvidence.gallery.map((item, index) => {
          const localized = localizedEvidenceGallery.find((entry) => entry?.image && entry.image === item?.image)
            || localizedEvidenceGallery[index]
            || {};
          return {
            ...item,
            imageAlt: localized.imageAlt || item.imageAlt,
            caption: localized.caption || item.caption,
          };
        })
      : rawEvidence.gallery,
  };

  const technology = {
    ...rawTechnology,
    eyebrow: txCase.technology?.eyebrow || rawTechnology.eyebrow,
    title: txCase.technology?.title || rawTechnology.title,
  };

  const caseSchema = getCaseStudySchema({
    title: hero.title,
    description: hero.lead,
    slug: slug,
    image: hero.image,
  });

  const renderChallenge = () => {
    if (!challenge || challenge.is_visible === false) return null;
    return (
      <section className="case-section" key="challenge">
        <div className="container case-grid">
          <div>
            <div className="eyebrow">
              <span></span> {challenge.eyebrow}
            </div>
            <h2>{challenge.title}</h2>
            <p className="case-copy">{challenge.copy}</p>
          </div>
          <aside className="case-role">
            <small>{t('caseStudy.myRole')}</small>
            <strong>{challenge.role}</strong>
            <small className="d-block mt-4">{t('caseStudy.context')}</small>
            <strong>{challenge.context}</strong>
          </aside>
        </div>
      </section>
    );
  };

  const renderContribution = () => {
    if (!contribution || contribution.is_visible === false) return null;
    return (
      <section className="case-section alt" key="contribution">
        <div className="container">
          <div className="eyebrow">
            <span></span> {contribution.eyebrow}
          </div>
          <h2>{contribution.title}</h2>
          {Array.isArray(contribution.items) && contribution.items.length > 0 && (
            <ul className="case-list row row-cols-1 row-cols-md-2 g-0">
              {contribution.items.map((item, index) => (
                <li className="col" key={index}>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {Array.isArray(contribution.process) && contribution.process.some(shouldRenderProcessStage) && (
            <div className="case-process" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
              {contribution.process.filter(shouldRenderProcessStage).map((p, idx) => {
                const title = p.title || getFdeStageLabel(p.stageType, currentLang);
                const mediaItems = (p.media || []).map((item) => ({ ...item, src: safeCaseStudyUrl(item.url || item.image) })).filter((item) => item.src);
                const links = (p.links || []).map((item) => ({ ...item, href: safeCaseStudyUrl(item.url) })).filter((item) => item.href && item.label?.trim());
                return (
                  <article className="case-process-stage" key={p.id || idx}>
                    <b>{p.step}</b>
                    {title && <strong>{title}</strong>}
                    {p.desc && <p>{p.desc}</p>}
                    {p.evidence && <p className="case-process-evidence">{p.evidence}</p>}
                    {Array.isArray(p.technologies) && p.technologies.length > 0 && (
                      <div className="case-process-technologies" aria-label={t('caseStudyStages.technologies', 'Relevant technologies')}>
                        {p.technologies.filter(Boolean).map((technologyName, techIndex) => <span key={`${technologyName}-${techIndex}`}>{technologyName}</span>)}
                      </div>
                    )}
                    {mediaItems.map((media, mediaIndex) => (
                      <figure className="case-process-media" key={media.id || mediaIndex}>
                        <img src={media.src} alt={media.alt || media.imageAlt || ''} loading="lazy" />
                        {media.caption && <figcaption>{media.caption}</figcaption>}
                      </figure>
                    ))}
                    {links.length > 0 && (
                      <ul className="case-process-links">
                        {links.map((link, linkIndex) => (
                          <li key={link.id || linkIndex}>
                            <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {contribution.codeExample?.code && (
            <figure className="case-code-example">
              <div className="case-code-example-header">
                <strong>{contribution.codeExample.title}</strong>
                <span>HTML</span>
              </div>
              <pre dir="ltr"><code>{contribution.codeExample.code}</code></pre>
              {contribution.codeExample.caption && (
                <figcaption>{contribution.codeExample.caption}</figcaption>
              )}
            </figure>
          )}
        </div>
      </section>
    );
  };

  const renderEvidence = () => {
    if (!evidence || evidence.is_visible === false) return null;
    return (
      <section className="case-section" key="evidence">
        <div className="container">
          <div className="eyebrow">
            <span></span> {evidence.eyebrow}
          </div>
          <h2>{evidence.title}</h2>
          {evidence.image && (
            <figure className="case-hero-image">
              <img src={evidence.image} alt={evidence.imageAlt || evidence.title} />
              {evidence.caption && <figcaption>{evidence.caption}</figcaption>}
            </figure>
          )}
          {Array.isArray(evidence.gallery) && evidence.gallery.length > 0 && (
            <div className="row g-4 mt-2">
              {evidence.gallery.map((item, idx) => (
                <div className="col-12 col-md-6" key={idx}>
                  <figure className="case-hero-image mb-0">
                    <img src={item.image} alt={item.imageAlt || item.caption || evidence.title} />
                    {item.caption && <figcaption>{item.caption}</figcaption>}
                  </figure>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderTechnology = () => {
    if (!technology || technology.is_visible === false) return null;
    return (
      <section className="case-section" key="technology">
        <div className="container">
          <div className="eyebrow">
            <span></span> {technology.eyebrow}
          </div>
          {technology.title && <h2>{technology.title}</h2>}
          {Array.isArray(technology.tags) && technology.tags.length > 0 && (
            <div className="tech-row">
              {technology.tags.map((tag, i) => (
                <span key={i}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const defaultOrder = ['challenge', 'contribution', 'evidence', 'technology'];
  const activeOrder = Array.isArray(data.sectionOrder)
    ? data.sectionOrder.filter((k) => k !== 'hero')
    : defaultOrder;

  const sectionRenderers = {
    challenge: renderChallenge,
    contribution: renderContribution,
    evidence: renderEvidence,
    technology: renderTechnology,
  };

  return (
    <MainLayout>
      {data.previewInfo && (
        <div className="preview-mode-banner preview-mode-banner-safe bg-warning text-dark text-center py-2 px-3 fw-semibold small shadow-sm" role="status">
          <i className="bi bi-eye-fill me-2" aria-hidden="true" />
          {data.previewInfo.status === 'published' && data.previewInfo.visibility === 'public'
            ? `SAVED CMS PREVIEW — ${data.previewInfo.title} (published/public); showing the current saved registry content.`
            : `SAVED CMS DRAFT PREVIEW — ${data.previewInfo.title} (${data.previewInfo.status}/${data.previewInfo.visibility}); this is not the public version.`}
        </div>
      )}
      <SEO
        title={hero.title}
        description={hero.lead}
        canonical={`/work/${slug}`}
        image={hero.image}
        schema={caseSchema}
      />

      {/* 1. Hero */}
      {hero.is_visible !== false && (
        <section className="case-hero">
          <div className="container">
            <Link className="text-link" to="/#work">
              <i className="bi bi-arrow-left"></i> {t('caseStudy.backToWork')}
            </Link>
            <div className="eyebrow mt-4">
              <span></span> {hero.eyebrow}
            </div>
            <h1>{hero.title}</h1>
            <p className="case-hero-lead">{hero.lead}</p>
            {Array.isArray(hero.metaChips) && hero.metaChips.length > 0 && (
              <div className="case-meta">
                {hero.metaChips.map((chip, i) => (
                  <span key={i}>{chip}</span>
                ))}
              </div>
            )}
            {hero.liveProductUrl && (
              <div className="case-live-product-action">
                <a
                  className="case-live-product-link"
                  href={hero.liveProductUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('caseStudy.visitLiveProduct')}
                  <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
                </a>
              </div>
            )}
            {hero.image && (
              <figure className="case-hero-image">
                <img src={hero.image} alt={hero.imageAlt || hero.title} />
                {hero.caption && <figcaption>{hero.caption}</figcaption>}
              </figure>
            )}
          </div>
        </section>
      )}

      {/* Ordered Middle Semantic Sections */}
      {activeOrder.map((sectionKey) => {
        const renderFn = sectionRenderers[sectionKey];
        return renderFn ? renderFn() : null;
      })}

      {/* Navigation */}
      <section className="case-nav">
        <div className="container d-flex justify-content-between">
          <Link to="/#work">
            <i className="bi bi-arrow-left"></i> {t('caseStudy.backToWork')}
          </Link>
          <a href="/#contact">
            {t('navbar.letsTalk', "Let's talk")} <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
