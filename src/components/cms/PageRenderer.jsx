import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getSectionComponent } from './sectionRegistry';

/**
 * Generic Public Page Renderer for Site-Wide CMS.
 *
 * Responsibilities:
 * - Render sections sorted by sort_order
 * - Skip invisible sections (is_visible === false)
 * - Resolve section_type through controlled sectionRegistry
 * - Pass validated config to renderer component
 * - Fail gracefully for unknown section types (never crash page)
 * - Prevent arbitrary HTML/JS injection
 */
export default function PageRenderer({ page, sections = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading page...</span>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container py-5 text-center">
        <h2 className="fw-bold mb-2">Page Not Found</h2>
        <p className="text-muted mb-4">{error ? error.message || 'The requested page could not be loaded.' : 'This page does not exist.'}</p>
        <a href="/" className="btn btn-outline-dark rounded-pill">
          Return Home
        </a>
      </div>
    );
  }

  // Filter visible sections and sort by sort_order ascending
  const visibleSections = sections
    .filter((sec) => sec && sec.is_visible !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className={`cms-page-wrapper page-template-${page.template || 'default'}`}>
      <Helmet>
        <title>{page.seo_title || page.title || 'Naïm Bsili — Portfolio'}</title>
        {page.seo_description && <meta name="description" content={page.seo_description} />}
        {page.canonical_url && <link rel="canonical" href={page.canonical_url} />}
      </Helmet>

      <main className="cms-page-content">
        {visibleSections.length > 0 ? (
          visibleSections.map((sec, idx) => {
            const SectionComp = getSectionComponent(sec.section_type);
            if (!SectionComp) {
              // Unknown section type fails gracefully without crashing
              return (
                <div key={sec.id || idx} className="cms-unknown-section d-none">
                  {/* Graceful fallback: hidden in production */}
                </div>
              );
            }
            return (
              <React.Fragment key={sec.id || idx}>
                <SectionComp config={sec.config || {}} section={sec} />
              </React.Fragment>
            );
          })
        ) : (
          <div className="container py-5 text-center">
            <h1 className="display-5 fw-bold mb-3">{page.title}</h1>
            <p className="text-muted">This page currently has no published content sections.</p>
          </div>
        )}
      </main>
    </div>
  );
}
