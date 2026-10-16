/**
 * customCssResolver.js
 * Centralized logic for Global Custom CSS:
 * - Route-aware safety checks (isolating admin routes)
 * - Single source of truth DOM style element injection & removal
 * - Event identifiers and cache keys
 */

export const CACHE_KEY_CSS = 'cms_custom_css_cache';
export const CUSTOM_CSS_STYLE_ID = 'cms-global-custom-css';
export const CUSTOM_CSS_UPDATE_EVENT = 'cms-custom-css-updated';

/**
 * Determines whether Global Custom CSS is permitted on the specified route.
 * Public routes (/, /work, /blog, /about, /p/:slug, etc.) allow custom CSS.
 * All admin routes (/admin, /admin/...) strictly disallow custom CSS to safeguard the CMS workspace.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function isCustomCssAllowedOnRoute(pathname) {
  if (typeof pathname !== 'string' || !pathname.trim()) return false;
  const normalized = pathname.trim().toLowerCase();
  if (normalized === '/admin' || normalized.startsWith('/admin/')) {
    return false;
  }
  return true;
}

/**
 * Injects Global Custom CSS into document.head via a single dedicated <style> element.
 *
 * @param {string} cssText
 */
export function injectCustomCss(cssText) {
  if (typeof document === 'undefined') return;
  if (!cssText || typeof cssText !== 'string' || !cssText.trim()) {
    removeCustomCss();
    return;
  }
  let styleEl = document.getElementById(CUSTOM_CSS_STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = CUSTOM_CSS_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssText;
}

/**
 * Removes Global Custom CSS style element from document.head if present.
 */
export function removeCustomCss() {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById(CUSTOM_CSS_STYLE_ID);
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }
}
