import React from 'react';
import AboutMeProposal from '../../../components/about/AboutMeProposal';

/**
 * Visual Canvas Preview for About Page in Admin CMS.
 *
 * Renders the authoritative 9-section editorial About Me structure
 * defined in docs/about-me-page-proposal.md.
 */
export default function AboutPageCanvasPreview({ page, activeLang = 'en', onSelectBlock }) {
  // Construct localized preview page data if reviewing in translations mode
  const previewPageData = {
    ...page,
    metadata: {
      ...(page?.metadata || {}),
      about: {
        ...(page?.metadata?.about || {}),
        ...(activeLang !== 'en' ? page?.metadata?.i18n?.[activeLang]?.about || {} : {}),
      },
    },
  };

  return (
    <div className="about-canvas-preview bg-white rounded-4 overflow-hidden border shadow-sm">
      {/* Editorial Guidance Strip */}
      <div className="alert alert-info border-0 rounded-0 py-2 px-3 mb-0 d-flex justify-content-between align-items-center">
        <div className="small d-flex align-items-center gap-2">
          <i className="bi bi-info-circle-fill text-info"></i>
          <span>
            <strong>Editorial About Me Structure (docs/about-me-page-proposal.md):</strong> Live interactive preview of all 9 sections. Click <strong>About Content & SEO</strong> or <strong>Translations</strong> in the right sidebar to edit copy in EN, FR, and AR.
          </span>
        </div>
        {onSelectBlock && (
          <button
            type="button"
            className="btn btn-xs btn-outline-info bg-white rounded-pill px-3 py-1 fw-bold"
            style={{ fontSize: '0.72rem' }}
            onClick={() => onSelectBlock('about')}
          >
            <i className="bi bi-pencil-square me-1"></i> Edit Copy
          </button>
        )}
      </div>

      {/* Render the full authoritative 9-section proposal */}
      <div className="p-2 p-md-3">
        <AboutMeProposal pageData={previewPageData} />
      </div>
    </div>
  );
}
