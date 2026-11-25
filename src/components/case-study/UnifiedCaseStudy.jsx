import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../common/SEO';
import { getCaseStudySchema } from '../../lib/schema';
import { safeCaseStudyUrl } from '../../utils/caseStudyStages';
import { resolveCaseStudySections } from './SectionResolver';

const safeExternalUrl = (value) => (
  typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : ''
);

const DEFAULT_TITLES = {
  problem: 'The Problem',
  'product-thinking': 'Product Thinking',
  'experience-design': 'Experience Design',
  'system-technology': 'System & Technology',
  'building-product': 'Building the Product',
  'product-experience': 'The Experience',
  'outcomes-learnings': 'Outcomes & Learnings',
  editorial: '',
  image: '',
  'project-module': '',
};

function SectionHeading({ content, fallbackTitle }) {
  return (
    <>
      {content.eyebrow && <div className="eyebrow"><span /> {content.eyebrow}</div>}
      {(content.title || fallbackTitle) && <h2>{content.title || fallbackTitle}</h2>}
      {(content.lead || content.copy) && <p className="case-copy">{content.lead || content.copy}</p>}
    </>
  );
}

function OverviewSection({ content, currentLang, t }) {
  const liveProductUrl = safeExternalUrl(content.liveProductUrl);
  const heroImage = safeCaseStudyUrl(content.image);
  return (
    <section className="case-hero" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container">
        <Link className="text-link" to="/#work">
          <i className="bi bi-arrow-left" /> {t('caseStudy.backToWork')}
        </Link>
        <div className="eyebrow mt-4"><span /> {content.eyebrow}</div>
        <h1>{content.title}</h1>
        {content.lead && <p className="case-hero-lead">{content.lead}</p>}
        {Array.isArray(content.metaChips) && content.metaChips.length > 0 && (
          <div className="case-meta">{content.metaChips.map((chip, index) => <span key={index}>{chip}</span>)}</div>
        )}
        {liveProductUrl && (
          <div className="case-live-product-action">
            <a className="case-live-product-link" href={liveProductUrl} target="_blank" rel="noopener noreferrer">
              {t('caseStudy.visitLiveProduct')} <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </a>
          </div>
        )}
        {heroImage && (
          <figure className="case-hero-image">
            <img src={heroImage} alt={content.imageAlt || content.title || ''} />
            {content.caption && <figcaption>{content.caption}</figcaption>}
          </figure>
        )}
      </div>
    </section>
  );
}

function GenericSection({ section, currentLang }) {
  const content = section.resolvedContent || {};
  const isImage = section.type === 'image';
  const image = safeCaseStudyUrl(content.image || content.src || '');
  const body = content.body || content.description || '';
  const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  const items = Array.isArray(content.items) ? content.items : Array.isArray(content.bullets) ? content.bullets : [];
  const links = Array.isArray(content.links) ? content.links : [];

  if (isImage) {
    return image ? (
      <section className="case-section" key={section.id} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container">
          <figure className="case-hero-image case-hero-image--feature">
            <div className="case-image-stage">
              <img src={image} alt={content.imageAlt || content.alt || content.title || ''} loading="lazy" decoding="async" />
            </div>
            {content.caption && <figcaption>{content.caption}</figcaption>}
          </figure>
        </div>
      </section>
    ) : null;
  }

  return (
    <section className="case-section" key={section.id} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container">
        <SectionHeading content={content} fallbackTitle={DEFAULT_TITLES[section.type]} />
        {body && <p className="case-copy">{body}</p>}
        {paragraphs.map((paragraph, index) => (
          <p className="case-copy" key={index}>{typeof paragraph === 'string' ? paragraph : paragraph?.text}</p>
        ))}
        {items.length > 0 && (
          <ul className="case-list row row-cols-1 row-cols-md-2 g-0">
            {items.map((item, index) => (
              <li className="col" key={item?.id || index}>
                {typeof item === 'string' ? item : item?.title || item?.text || item?.label}
                {typeof item === 'object' && item?.description && <p>{item.description}</p>}
              </li>
            ))}
          </ul>
        )}
        {Array.isArray(content.process) && content.process.length > 0 && (
          <div className="case-process">
            {content.process.map((stage, index) => (
              <article className="case-process-stage" key={stage?.id || index}>
                {stage?.step && <b>{stage.step}</b>}
                {stage?.title && <strong>{stage.title}</strong>}
                {stage?.desc && <p>{stage.desc}</p>}
                {stage?.evidence && <p className="case-process-evidence">{stage.evidence}</p>}
              </article>
            ))}
          </div>
        )}
        {image && (
          <figure className="case-hero-image case-hero-image--feature">
            <div className="case-image-stage">
              <img src={image} alt={content.imageAlt || content.alt || content.title || ''} loading="lazy" decoding="async" />
            </div>
            {content.caption && <figcaption>{content.caption}</figcaption>}
          </figure>
        )}
        {links.length > 0 && (
          <ul className="case-process-links">
            {links.map((link, index) => {
              const href = safeExternalUrl(link?.url || link?.href);
              return href ? <li key={link.id || index}><a href={href} target="_blank" rel="noopener noreferrer">{link.label || href}</a></li> : null;
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProblemSection({ section, currentLang, t }) {
  const content = section.resolvedContent || {};
  return (
    <section className="case-section" key={section.id} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container case-grid">
        <div>
          <SectionHeading content={content} fallbackTitle={DEFAULT_TITLES.problem} />
        </div>
        {(content.role || content.context) && (
          <aside className="case-role">
            {content.role && <><small>{t('caseStudy.myRole')}</small><strong>{content.role}</strong></>}
            {content.context && <><small className="d-block mt-4">{t('caseStudy.context')}</small><strong>{content.context}</strong></>}
          </aside>
        )}
      </div>
    </section>
  );
}

function ProductThinkingSection({ section, currentLang }) {
  const content = section.resolvedContent || {};
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <section className="case-section alt" key={section.id} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container">
        <SectionHeading content={content} fallbackTitle={DEFAULT_TITLES['product-thinking']} />
        {items.length > 0 && (
          <ul className="case-list row row-cols-1 row-cols-md-2 g-0">
            {items.map((item, index) => <li className="col" key={item?.id || index}>{typeof item === 'string' ? item : item?.title || item?.text || item?.label}</li>)}
          </ul>
        )}
        {Array.isArray(content.process) && content.process.length > 0 && (
          <div className="case-process">
            {content.process.map((stage, index) => (
              <article className="case-process-stage" key={stage?.id || index}>
                {stage?.step && <b>{stage.step}</b>}
                {stage?.title && <strong>{stage.title}</strong>}
                {stage?.desc && <p>{stage.desc}</p>}
                {stage?.evidence && <p className="case-process-evidence">{stage.evidence}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExperienceDesignSection({ section, currentLang }) {
  const content = section.resolvedContent || {};
  const gallery = Array.isArray(content.gallery)
    ? content.gallery.map((item) => ({ ...item, safeImage: safeCaseStudyUrl(item?.image) })).filter((item) => item?.is_visible !== false && item.safeImage)
    : [];
  const featureImage = safeCaseStudyUrl(content.image);
  return (
    <section className="case-section" key={section.id} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container">
        <SectionHeading content={content} fallbackTitle={DEFAULT_TITLES['experience-design']} />
        {featureImage && (
          <figure className="case-hero-image case-hero-image--feature">
            <div className="case-image-stage"><img src={featureImage} alt={content.imageAlt || content.title || ''} loading="lazy" decoding="async" /></div>
            {content.caption && <figcaption>{content.caption}</figcaption>}
          </figure>
        )}
        {gallery.length > 0 && (
          <div className="case-evidence-gallery" aria-label={content.title || 'Visual evidence'}>
            {gallery.map((item, index) => (
              <figure className="case-evidence-card" key={item.id || item.image || index}>
                <div className="case-image-stage"><img src={item.safeImage} alt={item.imageAlt || item.caption || content.title || ''} loading="lazy" decoding="async" /></div>
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TechnologySection({ section, currentLang }) {
  const content = section.resolvedContent || {};
  const tags = Array.isArray(content.tags) ? content.tags : [];
  return (
    <section className="case-section" key={section.id} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container">
        <SectionHeading content={content} fallbackTitle={DEFAULT_TITLES['system-technology']} />
        {tags.length > 0 && <div className="tech-row">{tags.map((tag, index) => <span key={index}>{tag}</span>)}</div>}
      </div>
    </section>
  );
}

export default function UnifiedCaseStudy({ data }) {
  const { t, i18n } = useTranslation();
  const currentLang = ['en', 'fr', 'ar'].includes(i18n?.language?.slice(0, 2)) ? i18n.language.slice(0, 2) : 'en';
  const { caseStudy, sections, unsupported } = resolveCaseStudySections(data, { slug: data?.slug || '', locale: currentLang });
  const overview = sections.find((section) => section.type === 'project-overview')?.resolvedContent || {};
  const overviewContent = {
    ...overview,
    title: overview.title || caseStudy?.metadata?.title || data?.title || 'Case Study',
    lead: overview.lead || overview.description || caseStudy?.metadata?.subtitle || '',
    image: overview.image || caseStudy?.metadata?.cover || '',
  };
  const title = overviewContent.title;
  const description = overviewContent.lead;
  const image = overviewContent.image;
  const schema = getCaseStudySchema({ title, description, slug: data?.slug, image });

  const renderSection = (section) => {
    if (section.type === 'project-overview') return <OverviewSection key={section.id} content={overviewContent} currentLang={currentLang} t={t} />;
    if (section.type === 'problem') return <ProblemSection key={section.id} section={section} currentLang={currentLang} t={t} />;
    if (section.type === 'product-thinking') return <ProductThinkingSection key={section.id} section={section} currentLang={currentLang} />;
    if (section.type === 'experience-design') return <ExperienceDesignSection key={section.id} section={section} currentLang={currentLang} />;
    if (section.type === 'system-technology') return <TechnologySection key={section.id} section={section} currentLang={currentLang} />;
    return <GenericSection key={section.id} section={section} currentLang={currentLang} />;
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
      <SEO title={title} description={description} canonical={`/work/${data?.slug}/`} image={image} schema={schema} />
      {sections.map(renderSection)}
      {unsupported.length > 0 && import.meta.env.DEV && (
        <div className="container py-2 small text-muted" role="status">
          Some case-study sections are not supported by this renderer yet.
        </div>
      )}
      <section className="case-nav">
        <div className="container d-flex justify-content-between">
          <Link to="/#work"><i className="bi bi-arrow-left" /> {t('caseStudy.backToWork')}</Link>
          <a href="/#contact">{t('navbar.letsTalk', "Let's talk")} <i className="bi bi-arrow-up-right" /></a>
        </div>
      </section>
    </MainLayout>
  );
}
