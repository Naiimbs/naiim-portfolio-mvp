import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPublicSiteSettings } from '../../services/siteCms';
import { validateAndNormalizeTheme, applyThemeToDom } from '../../ui/theme/themeResolver';
import { THEME_DEFAULTS } from '../../ui/theme/themeDefaults';

import {
  CACHE_KEY_CSS,
  CUSTOM_CSS_STYLE_ID,
  CUSTOM_CSS_UPDATE_EVENT,
  isCustomCssAllowedOnRoute,
  injectCustomCss,
  removeCustomCss,
} from '../../ui/theme/customCssResolver';

export const CACHE_KEY_THEME = 'cms_theme_tokens_cache';
export {
  CACHE_KEY_CSS,
  CUSTOM_CSS_STYLE_ID,
  CUSTOM_CSS_UPDATE_EVENT,
  isCustomCssAllowedOnRoute,
  injectCustomCss,
  removeCustomCss,
};

/**
 * GlobalThemeApplier
 * Runs at the top level of the application.
 * Ensures Theme & Design Tokens and Custom CSS from CMS Site Settings
 * are applied across all public pages, while strictly isolating the Admin CMS.
 */
export default function GlobalThemeApplier() {
  const location = useLocation();
  const currentPath = location?.pathname || '/';
  const isAllowedRoute = isCustomCssAllowedOnRoute(currentPath);

  // Store active custom CSS in state, initialized synchronously from cache
  const [activeCustomCss, setActiveCustomCss] = useState(() => {
    try {
      return localStorage.getItem(CACHE_KEY_CSS) || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    // 1. Immediately apply cached theme tokens or default tokens (no flash)
    try {
      const cachedTheme = localStorage.getItem(CACHE_KEY_THEME);
      if (cachedTheme) {
        const parsed = JSON.parse(cachedTheme);
        applyThemeToDom(validateAndNormalizeTheme(parsed));
      } else {
        applyThemeToDom(THEME_DEFAULTS);
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
        setActiveCustomCss(customCss);
        try {
          if (customCss.trim()) {
            localStorage.setItem(CACHE_KEY_CSS, customCss);
          } else {
            localStorage.removeItem(CACHE_KEY_CSS);
          }
        } catch (e) {}
      }
    });

    // 3. Listen for internal CSS update events (e.g. from AdminSettings save)
    const handleCssUpdate = (e) => {
      const newCss = typeof e.detail === 'string' ? e.detail : '';
      setActiveCustomCss(newCss);
      try {
        if (newCss.trim()) {
          localStorage.setItem(CACHE_KEY_CSS, newCss);
        } else {
          localStorage.removeItem(CACHE_KEY_CSS);
        }
      } catch (err) {}
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CUSTOM_CSS_UPDATE_EVENT, handleCssUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(CUSTOM_CSS_UPDATE_EVENT, handleCssUpdate);
      }
    };
  }, []);

  // 4. Synchronize CSS injection with route changes and active CSS
  useEffect(() => {
    if (isAllowedRoute && activeCustomCss) {
      injectCustomCss(activeCustomCss);
    } else {
      removeCustomCss();
    }
  }, [isAllowedRoute, activeCustomCss]);

  return null;
}
