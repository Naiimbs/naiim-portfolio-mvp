import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import MiniProjectCard from './MiniProjectCard';
import { getPublishedPublicContent, normalizeRegistryEntry } from '../../services/contentRegistry';
import { isPublicRouteImplemented } from '../../services/contentRouteResolver';

/**
 * SelectedWorkSection — homepage work section.
 *
 * Data source: Content Registry (published + public), ordered by sort_order.
 * Content Registry is the authoritative source for catalog membership and metadata.
 *
 * States:
 *   loading        — Registry query in progress
 *   error          — Supabase unconfigured or query failed
 *   empty          — Registry returned zero published+public entries
 *   ready          — 1+ entries returned, split into featured/mini
 */
export default function SelectedWorkSection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRegistry() {
      const res = await getPublishedPublicContent();
      if (!isMounted) return;

      // Unconfigured Supabase — do not fall back to local catalog
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


    loadRegistry();
    return () => { isMounted = false; };
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="section-pad pt-5" id="work">
        <div className="container">
          <SectionHeading />
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '20vh' }}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading work...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Error or unconfigured — do not silently fall back to local catalog ────────
  if (error) {
    return (
      <section className="section-pad pt-5" id="work">
        <div className="container">
          <SectionHeading />
          <p className="text-muted text-center py-4">
            Selected work is temporarily unavailable.
          </p>
        </div>
      </section>
    );
  }

  // ── Empty — Registry has no published+public entries yet ──────────────────────
  if (empty) {
    return (
      <section className="section-pad pt-5" id="work">
        <div className="container">
          <SectionHeading />
          <p className="text-muted text-center py-4">No published work items yet.</p>
        </div>
      </section>
    );
  }

  // ── Registry ready — split by featured flag (authoritatively from Registry) ──
  const featuredEntries = entries.filter((e) => e.featured);
  const miniEntries = entries.filter((e) => !e.featured);

  return (
    <section className="section-pad pt-5" id="work">
      <div className="container">
        <SectionHeading />

        {/* Featured projects */}
        {featuredEntries.length > 0 && (
          <div className="row g-4">
            {featuredEntries.map((project) => (
              <div className="col-lg-4" key={project.id || project.slug}>
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}

        {/* Mini (non-featured) projects */}
        {miniEntries.length > 0 && (
          <div className="row g-3 mt-1">
            {miniEntries.map((project) => (
              <div className="col-md-6 col-lg-3" key={project.id || project.slug}>
                <MiniProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Shared section heading ───────────────────────────────────────────────────

function SectionHeading() {
  return (
    <div className="section-heading d-flex justify-content-between align-items-end mb-4">
      <div>
        <div className="eyebrow">
          <span></span> SELECTED WORK
        </div>
        <h2>Products, systems &amp; digital experiences</h2>
        <p>
          From startup products and AI systems to Saudi digital services and front-end implementation.
        </p>
      </div>
      <a href="#contact" className="text-link d-none d-md-inline">
        Let's talk <i className="bi bi-arrow-up-right"></i>
      </a>
    </div>
  );
}
