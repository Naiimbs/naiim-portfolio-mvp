/**
 * customCssPreviewDoc.js
 * Generates an isolated HTML document string for the Global Custom CSS Live Preview iframe.
 *
 * Provides a representative preview of public website design elements:
 * - Design tokens and CSS variables
 * - Headings, lead text, paragraphs, and links
 * - Buttons (primary, outline, hover states)
 * - Cards, badges, and blockquotes
 * - Responsive container layout
 * - User Custom CSS injected in an isolated <style> tag
 *
 * NOTE: This is a representative sandboxed preview of public components,
 * not a full public application render.
 */

import { THEME_DEFAULTS } from './themeDefaults.js';
import { resolveThemeCssVariables } from './themeResolver.js';

export const PREVIEW_VIEWPORT_PRESETS = {
  DESKTOP: '100%',
  TABLET: '768px',
  MOBILE: '375px',
};

/**
 * Generates the full HTML srcdoc string for the sandboxed preview iframe.
 *
 * @param {Object} options
 * @param {string} options.customCss - User custom CSS rules to test
 * @param {Object} [options.themeTokens] - Optional theme tokens override
 * @returns {string} Safe HTML string for iframe srcdoc
 */
export function generateCustomCssPreviewDoc({ customCss = '', themeTokens = {} } = {}) {
  const resolvedVars = resolveThemeCssVariables(themeTokens || THEME_DEFAULTS);
  const cssVarsString = Object.entries(resolvedVars)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join('\n');

  // Sanitize any </style> or script breakout attempts in custom CSS for iframe defense-in-depth
  const safeCss = String(customCss || '')
    .replace(/<\/style/gi, '<\\/style')
    .replace(/<script/gi, '<\\/script');

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Global Custom CSS Preview</title>
  
  <!-- Google Fonts: Space Grotesk & DM Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />

  <!-- Bootstrap CSS for realistic public component structure -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

  <style id="preview-base-tokens">
  :root {
${cssVarsString}
  }

  /* Public Base Typography & Shell Styling */
  html, body {
    margin: 0;
    padding: 0;
    background-color: var(--color-body-bg, #ffffff);
    color: var(--color-text-primary, #111827);
    font-family: var(--font-body, 'DM Sans', sans-serif);
    font-size: 15px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  .font-heading, h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading, 'Space Grotesk', sans-serif);
    color: var(--color-text-primary, #111827);
    font-weight: 700;
  }

  a {
    color: var(--color-brand-primary, #087f66);
    text-decoration: none;
    transition: color 0.15s ease-in-out;
  }

  a:hover {
    color: var(--color-brand-primary-hover, #066350);
  }

  /* Public Container rules mirroring theme.css */
  .preview-container {
    width: 100%;
    margin-right: auto;
    margin-left: auto;
    padding-right: var(--layout-container-padding-x, 24px);
    padding-left: var(--layout-container-padding-x, 24px);
    max-width: var(--layout-container-max-width, 1320px);
  }

  /* Public Buttons */
  .btn-primary {
    background-color: var(--color-brand-primary, #087f66);
    border-color: var(--color-brand-primary, #087f66);
    color: #ffffff;
    border-radius: var(--radius-pill, 9999px);
    font-weight: 600;
    padding: 0.5rem 1.25rem;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background-color: var(--color-brand-primary-hover, #066350);
    border-color: var(--color-brand-primary-hover, #066350);
    color: #ffffff;
  }

  .btn-outline-secondary {
    border-color: var(--color-border, #e5e7eb);
    color: var(--color-text-secondary, #4b5563);
    border-radius: var(--radius-pill, 9999px);
    font-weight: 500;
    padding: 0.5rem 1.25rem;
  }

  .btn-outline-secondary:hover {
    background-color: var(--color-surface-muted, #f9fafb);
    border-color: var(--color-text-secondary, #4b5563);
    color: var(--color-text-primary, #111827);
  }

  /* Public Cards & Surfaces */
  .preview-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    padding: 1.5rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .preview-badge {
    background: rgba(8, 127, 102, 0.1);
    color: var(--color-brand-primary, #087f66);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-pill, 9999px);
    display: inline-block;
  }
  </style>

  <!-- LIVE USER CUSTOM CSS INJECTION -->
  <style id="preview-user-custom-css">
${safeCss}
  </style>
</head>
<body>
  <!-- Simulated Public Header -->
  <header style="border-bottom: 1px solid var(--color-border, #e5e7eb); padding: 1rem 0; background: var(--color-surface, #ffffff);">
    <div class="preview-container d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-brand-primary, #087f66);"></div>
        <span class="fw-bold font-heading" style="font-size: 1.1rem; letter-spacing: -0.02em;">Naïm Bsili</span>
      </div>
      <nav class="d-none d-sm-flex gap-3 small fw-medium">
        <a href="#work" onclick="return false;">Work</a>
        <a href="#about" onclick="return false;">About</a>
        <a href="#blog" onclick="return false;">Blog</a>
        <a href="#contact" onclick="return false;" class="text-primary fw-semibold">Let's Talk</a>
      </nav>
    </div>
  </header>

  <!-- Hero Section Sample -->
  <section style="padding: 2.5rem 0 2rem 0;">
    <div class="preview-container">
      <div class="mb-3">
        <span class="preview-badge">
          <i class="bi bi-stars me-1"></i> Interactive UI &amp; AI Systems
        </span>
      </div>
      <h1 class="display-6 fw-bold mb-3 font-heading" style="line-height: 1.2;">
        Senior UX/UI Designer &amp; AI Product Builder
      </h1>
      <p class="lead text-muted mb-4" style="max-width: 640px; font-size: 1rem;">
        Building intelligent products with minimal cognitive load, scalable design systems, and autonomous agent workflows.
      </p>
      <div class="d-flex flex-wrap gap-2 mb-4">
        <a href="#cta-primary" onclick="return false;" class="btn btn-primary">
          Explore Selected Work <i class="bi bi-arrow-right ms-1"></i>
        </a>
        <a href="#cta-secondary" onclick="return false;" class="btn btn-outline-secondary">
          Contact Me
        </a>
      </div>
    </div>
  </section>

  <!-- Content & Card Grid Sample -->
  <section style="padding: 1.5rem 0 2.5rem 0; background: var(--color-surface-muted, #f9fafb); border-top: 1px solid var(--color-border, #e5e7eb);">
    <div class="preview-container">
      <div class="row g-3">
        <div class="col-md-7">
          <div class="preview-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="preview-badge">Featured Case Study</span>
              <span class="text-muted small" style="font-size: 0.75rem;">2026</span>
            </div>
            <h5 class="fw-bold mb-2 font-heading">Assestini: Asset Intelligence</h5>
            <p class="text-muted small mb-3">
              Comprehensive UX overhaul for physical object identity tracking with zero-friction anonymous scanner interactions.
            </p>
            <a href="#case-study" onclick="return false;" class="fw-semibold small text-primary">
              Read Case Study <i class="bi bi-arrow-up-right ms-1"></i>
            </a>
          </div>
        </div>

        <div class="col-md-5">
          <div class="preview-card h-100">
            <div class="text-muted small text-uppercase fw-bold mb-1" style="font-size: 0.7rem; letter-spacing: 0.05em;">
              Impact Metric
            </div>
            <div class="display-6 fw-bold mb-1 text-primary font-heading">+48%</div>
            <p class="text-muted small mb-0">
              Increase in user task completion efficiency and reduction in recovery abandonment.
            </p>
          </div>
        </div>
      </div>

      <!-- Typography & Quote Sample -->
      <div class="mt-4 pt-3 border-top" style="border-color: var(--color-border, #e5e7eb) !important;">
        <blockquote class="blockquote border-start border-3 ps-3 my-2 text-muted" style="border-color: var(--color-brand-primary, #087f66) !important; font-size: 0.85rem; font-style: italic;">
          &ldquo;Simple physical product with a reliable digital layer. The technology supports the recovery experience without becoming the experience itself.&rdquo;
        </blockquote>
      </div>
    </div>
  </section>

  <!-- Footer Sample -->
  <footer style="padding: 1.5rem 0; border-top: 1px solid var(--color-border, #e5e7eb); background: var(--color-surface, #ffffff);">
    <div class="preview-container d-flex flex-wrap justify-content-between align-items-center text-muted small" style="font-size: 0.75rem;">
      <div>&copy; 2026 Naïm Bsili. All rights reserved.</div>
      <div class="d-flex gap-3">
        <a href="#privacy" onclick="return false;" class="text-muted">Privacy</a>
        <a href="#terms" onclick="return false;" class="text-muted">Terms</a>
        <a href="#github" onclick="return false;" class="text-muted">GitHub</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}
