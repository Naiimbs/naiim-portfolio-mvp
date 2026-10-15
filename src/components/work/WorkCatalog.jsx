import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import MiniProjectCard from './MiniProjectCard';
import { getPublishedPublicContent, normalizeRegistryEntry } from '../../services/contentRegistry';
import { isPublicRouteImplemented } from '../../services/contentRouteResolver';

/**
 * WorkCatalog — the /work catalog block.
 *
 * Content source of truth: Content Registry (published + public). The heading
 * (eyebrow / title / intro) is config-driven with defaults matching the
 * original page, so rendering it with an empty config is identical to the
 * previous hardcoded page. Used both as the WorkPage fallback and as the
 * `work_catalog` CMS section.
 */
export default function WorkCatalog({ config = {} }) {
  const { t } = useTranslation();
  const eyebrow = config.eyebrow !== undefined ? config.eyebrow : t('work.eyebrow');
  const title   = config.title   !== undefined ? config.title   : t('work.title');
  const intro   = config.intro   !== undefined ? config.intro   : t('work.subtitle');

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const res = await getPublishedPublicContent();
      if (!isMounted) return;

      if (res.source === 'unconfigured') {
        setError(new Error('Registry unavailable'));
        setLoading(false);
        return;
      }
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.data && res.data.length > 0) {
        const supported = res.data.filter(
          (entry) => (!entry.content_type || entry.content_type === 'case-study') && isPublicRouteImplemented(entry)
        );
        const normalized = supported.map((entry) => normalizeRegistryEntry(entry));
        setEntries(normalized);
        if (normalized.length === 0) setEmpty(true);
      } else {
        setEmpty(true);
      }
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="section-pad" style={{ minHeight: '60vh' }}>
      <div className="container">
        <div className="section-heading mb-5">
          {eyebrow && (
            <div className="eyebrow">
              <span></span> {eyebrow}
            </div>
          )}
          {title && <h1>{title}</h1>}
          {intro && <p>{intro}</p>}
        </div>

        {loading && (
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '30vh' }}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">{t('work.loading')}</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-5">
            <p className="text-muted">{t('work.loadError')}</p>
            <Link to="/" className="btn btn-primary-custom rounded-pill px-4 mt-2">
              <i className="bi bi-arrow-left"></i> {t('placeholder.backHome')}
            </Link>
          </div>
        )}

        {!loading && !error && entries.length > 0 && <RegistryListing entries={entries} />}

        {!loading && !error && empty && (
          <div className="text-center py-5">
            <p className="text-muted">{t('work.empty')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function RegistryListing({ entries }) {
  const featured = entries.filter((e) => e.featured);
  const rest = entries.filter((e) => !e.featured);

  return (
    <>
      {featured.length > 0 && (
        <div className="row g-4 mb-4">
          {featured.map((project) => (
            <div className="col-lg-6" key={project.id || project.slug}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="row g-3">
          {rest.map((project) => (
            <div className="col-md-6 col-lg-4" key={project.id || project.slug}>
              <MiniProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
