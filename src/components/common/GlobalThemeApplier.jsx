import React, { useEffect } from 'react';
import { getPublicSiteSettings } from '../../services/siteCms';
import { validateAndNormalizeTheme, applyThemeToDom } from '../../ui/theme/themeResolver';

const CACHE_KEY_THEME = 'cms_theme_tokens_cache';
const CACHE_KEY_CSS = 'cms_custom_css_cache';

/**
 * GlobalThemeApplier
 * Runs at the top level of the application.
 * Ensures Theme & Design Tokens and Custom CSS from CMS Site Settings
 * are applied across all public pages and the CMS.
 */
export default function GlobalThemeApplier() {
  useEffect(() => {
    // 1. Immediately apply cached theme tokens and custom CSS (no flash)
    try {
      const cachedTheme = localStorage.getItem(CACHE_KEY_THEME);
      if (cachedTheme) {
        const parsed = JSON.parse(cachedTheme);
        applyThemeToDom(validateAndNormalizeTheme(parsed));
      }
      const cachedCss = localStorage.getItem(CACHE_KEY_CSS);
      if (cachedCss) {
        injectCustomCss(cachedCss);
      }
    } catch (e) {
      // ignore local cache parsing errors
    }

    // 2. Fetch authoritative settings from Supabase / CMS
    let isMounted = true;
    getPublicSiteSettings().then((res) => {
      if (!isMounted || !res.data) return;

      const rawTheme = res.data.theme_tokens;
      if (rawTheme) {
        let parsed = rawTheme;
        if (typeof rawTheme === 'string') {
          try {
            parsed = JSON.parse(rawTheme);
          } catch (e) {
            parsed = null;
          }
        }
        if (parsed && typeof parsed === 'object') {
          const normalized = validateAndNormalizeTheme(parsed);
          applyThemeToDom(normalized);
          try {
            localStorage.setItem(CACHE_KEY_THEME, JSON.stringify(normalized));
          } catch (e) {}
        }
      }

      const customCss = res.data.custom_css;
      if (typeof customCss === 'string') {
        injectCustomCss(customCss);
        try {
          localStorage.setItem(CACHE_KEY_CSS, customCss);
        } catch (e) {}
      } else {
        removeCustomCss();
        try {
          localStorage.removeItem(CACHE_KEY_CSS);
        } catch (e) {}
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}

function injectCustomCss(cssText) {
  if (typeof document === 'undefined') return;
  let styleEl = document.getElementById('cms-global-custom-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'cms-global-custom-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssText || '';
}

function removeCustomCss() {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById('cms-global-custom-css');
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }
}
