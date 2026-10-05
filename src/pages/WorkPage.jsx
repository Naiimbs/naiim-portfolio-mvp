import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';
import ProjectCard from '../components/work/ProjectCard';
import MiniProjectCard from '../components/work/MiniProjectCard';
import { getPublishedPublicContent, normalizeRegistryEntry } from '../services/contentRegistry';
import { isPublicRouteImplemented } from '../services/contentRouteResolver';

/**
 * WorkPage — /work
 *
 * Source of truth: Content Registry (published + public, ordered by sort_order).
 * Content Registry is the sole authority for the public portfolio catalog.
 *
 * States:
 *   loading       — Registry query in progress
 *   error         — Supabase query failed or unconfigured
 *   empty         — Registry has zero published+public entries
 *   ready         — 1+ published+public entries returned
 */
export default function WorkPage() {
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

      // Supabase unconfigured — treat as error, do not fall back to local data
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
        // Only include items supported by the case study portfolio
        const supported = res.data.filter(
          (entry) => (!entry.content_type || entry.content_type === 'case-study') && isPublicRouteImplemented(entry)
        );
        const normalized = supported.map((entry) => normalizeRegistryEntry(entry));
        setEntries(normalized);
        if (normalized.length === 0) {
          setEmpty(true);
        }
      } else {
        setEmpty(true);
      }
      setLoading(false);
    }


    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <MainLayout>
      <SEO
        title="Selected Work — Naim Bsili"
        description="Case studies and digital products by Naim Bsili — Product Designer and AI Builder."
        canonical="/work"
      />

      <section className="section-pad" style={{ minHeight: '60vh' }}>
        <div className="container">
          <div className="section-heading mb-5">
            <div className="eyebrow">
              <span></span> SELECTED WORK
            </div>
            <h1>Products, systems &amp; digital experiences</h1>
            <p>
              From startup products and AI systems to Saudi digital services and front-end implementation.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '30vh' }}>
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading work...</span>
              </div>
            </div>
          )}

          {/* Registry error — do not crash */}
          {!loading && error && (
            <div className="text-center py-5">
              <p className="text-muted">
                Unable to load the work registry right now. Please try again shortly.
              </p>
              <Link to="/" className="btn btn-primary-custom rounded-pill px-4 mt-2">
                <i className="bi bi-arrow-left"></i> Back to Home
              </Link>
            </div>
          )}

          {/* Registry entries */}
          {!loading && !error && entries.length > 0 && (
            <RegistryListing entries={entries} />
          )}

          {/* Registry configured but zero published+public entries */}
          {!loading && !error && empty && (
            <div className="text-center py-5">
              <p className="text-muted">No published work items yet.</p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

// ─── Registry listing ──────────────────────────────────────────────────────────

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
