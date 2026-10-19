/**
 * MHAF Accessibility Widget - Core Engine
 * Manages DOM mutations, CSS rules, Web APIs, and preference state.
 */

const STORAGE_PREFIX = 'mhaf:';

export const PROFILES = {
  motor_impaired: {
    keyboard_navigation: 1,
    cursor_size: 1,
    disable_animation: 1,
    scale_content: 1,
    focus_outline: 1
  },
  dyslexic_profile: {
    dyslexic_font: 1,
    disable_animation: 1,
    line_height: 2,
    letter_spacing: 1
  },
  cognitive_learning: {
    reading_guide: 1,
    font_size: 2,
    outline_titles: 1,
    image_caption: 1
  },
  epilepsy_safe: {
    disable_animation: 1,
    mute_sound: 1
  },
  visually_impaired: {
    scale_content: 2,
    dark_contrast: 1,
    outline_links: 1,
    focus_outline: 1
  },
  color_blind: {
    color_balance: 2,
    outline_titles: 1,
    outline_links: 1
  },
  adhd_profile: {
    reading_mask: 1,
    disable_animation: 1,
    readable_font: 1
  }
};

let currentPrefs = {};
let currentProfile = null;
const listeners = new Set();

// Active DOM tool elements
let readingGuideEl = null;
let readingMaskTop = null;
let readingMaskBottom = null;
let textMagnifierEl = null;
const captionMap = new Map();
const mutedMediaMap = new Map();
const tabIndexMap = new Map();

// Reading mask slit height (in px)
const MASK_SLIT_HEIGHT = 60;

/**
 * Helper to register/remove pointer events cleanly
 */
function togglePointerEvents(handler, enable) {
  const events = ['pointermove', 'pointerdown'];
  for (const evt of events) {
    if (enable) {
      document.addEventListener(evt, handler, { passive: true });
    } else {
      document.removeEventListener(evt, handler);
    }
  }
}

/* ==========================================================================
   Tool 1: Reading Guide (Bar that follows mouse Y)
   ========================================================================== */
function onGuideMove(e) {
  if (!readingGuideEl) return;
  readingGuideEl.style.transform = `translateY(${e.clientY - 4}px)`;
  readingGuideEl.style.display = 'block';
}

function enableReadingGuide() {
  if (readingGuideEl) return;
  readingGuideEl = document.createElement('div');
  readingGuideEl.id = 'mhaf-reading-guide';
  readingGuideEl.setAttribute('aria-hidden', 'true');
  readingGuideEl.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    background: #2563eb;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
    z-index: 2147483640;
    pointer-events: none;
    display: none;
    transition: transform 0.05s linear;
  `;
  document.body.appendChild(readingGuideEl);
  togglePointerEvents(onGuideMove, true);
}

function disableReadingGuide() {
  togglePointerEvents(onGuideMove, false);
  if (readingGuideEl) {
    readingGuideEl.remove();
    readingGuideEl = null;
  }
}

/* ==========================================================================
   Tool 2: Reading Mask (Dark curtains with clear focus slit)
   ========================================================================== */
function onMaskMove(e) {
  if (!readingMaskTop || !readingMaskBottom) return;
  const topH = Math.max(0, e.clientY - MASK_SLIT_HEIGHT / 2);
  const botH = Math.max(0, window.innerHeight - (e.clientY + MASK_SLIT_HEIGHT / 2));
  readingMaskTop.style.height = `${topH}px`;
  readingMaskBottom.style.height = `${botH}px`;
}

function enableReadingMask() {
  if (readingMaskTop) return;
  readingMaskTop = document.createElement('div');
  readingMaskBottom = document.createElement('div');

  const maskStyle = `
    position: fixed;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(1px);
    z-index: 2147483639;
    pointer-events: none;
    transition: height 0.04s ease-out;
  `;
  readingMaskTop.style.cssText = `top: 0; height: calc(50vh - 30px); ${maskStyle}`;
  readingMaskBottom.style.cssText = `bottom: 0; height: calc(50vh - 30px); ${maskStyle}`;

  document.body.appendChild(readingMaskTop);
  document.body.appendChild(readingMaskBottom);
  togglePointerEvents(onMaskMove, true);
}

function disableReadingMask() {
  togglePointerEvents(onMaskMove, false);
  if (readingMaskTop) {
    readingMaskTop.remove();
    readingMaskBottom.remove();
    readingMaskTop = null;
    readingMaskBottom = null;
  }
}

/* ==========================================================================
   Tool 3: Text Magnifier Tooltip
   ========================================================================== */
function onMagnifierHover(e) {
  if (!textMagnifierEl || !(e.target instanceof Element)) return;
  // Don't magnify elements inside the MHAF widget itself
  if (e.target.closest('#mhaf-widget')) return;

  const text = e.target.firstElementChild ? '' : (e.target.textContent || '').trim();
  if (!text || text.length < 2) {
    textMagnifierEl.style.display = 'none';
    return;
  }

  textMagnifierEl.textContent = text;
  textMagnifierEl.style.display = 'block';

  const x = Math.min(window.innerWidth - 320, Math.max(20, e.clientX - 100));
  const y = Math.min(window.innerHeight - 100, e.clientY + 25);
  textMagnifierEl.style.left = `${x}px`;
  textMagnifierEl.style.top = `${y}px`;
}

function enableTextMagnifier() {
  if (textMagnifierEl) return;
  textMagnifierEl = document.createElement('div');
  textMagnifierEl.id = 'mhaf-text-magnifier';
  textMagnifierEl.setAttribute('aria-hidden', 'true');
  textMagnifierEl.style.cssText = `
    position: fixed;
    z-index: 2147483645;
    max-width: 480px;
    padding: 12px 18px;
    background: #0f172a;
    color: #f8fafc;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.4;
    border: 2px solid #38bdf8;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    pointer-events: none;
    display: none;
  `;
  document.body.appendChild(textMagnifierEl);
  document.addEventListener('pointerover', onMagnifierHover, { passive: true });
}

function disableTextMagnifier() {
  document.removeEventListener('pointerover', onMagnifierHover);
  if (textMagnifierEl) {
    textMagnifierEl.remove();
    textMagnifierEl = null;
  }
}

/* ==========================================================================
   Tool 4: Image Alt Captions
   ========================================================================== */
function enableImageCaptions() {
  const images = document.querySelectorAll('img[alt]');
  for (const img of images) {
    if (captionMap.has(img) || !img.alt.trim()) continue;
    const badge = document.createElement('span');
    badge.className = 'mhaf-image-caption';
    badge.textContent = `📷 ${img.alt.trim()}`;
    badge.style.cssText = `
      display: block;
      background: #1e293b;
      color: #38bdf8;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      margin-top: 4px;
      border-radius: 4px;
      max-width: 100%;
    `;
    img.after(badge);
    captionMap.set(img, badge);
  }
}

function disableImageCaptions() {
  for (const badge of captionMap.values()) {
    badge.remove();
  }
  captionMap.clear();
}

/* ==========================================================================
   Tool 5: Mute Sounds & Videos
   ========================================================================== */
function enableMuteSound() {
  const media = document.querySelectorAll('audio, video');
  for (const el of media) {
    if (!mutedMediaMap.has(el)) {
      mutedMediaMap.set(el, el.muted);
      el.muted = true;
    }
  }
}

function disableMuteSound() {
  for (const [el, originalState] of mutedMediaMap.entries()) {
    el.muted = originalState;
  }
  mutedMediaMap.clear();
}

/* ==========================================================================
   Tool 6: Keyboard Navigation Helper
   ========================================================================== */
function enableKeyboardNavigation() {
  const targets = document.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, section, [role="button"], [role="link"], article'
  );
  for (const el of targets) {
    if (!el.hasAttribute('tabindex') && !el.closest('#mhaf-widget')) {
      tabIndexMap.set(el, null);
      el.setAttribute('tabindex', '0');
    }
  }
}

function disableKeyboardNavigation() {
  for (const [el, original] of tabIndexMap.entries()) {
    if (original === null) {
      el.removeAttribute('tabindex');
    } else {
      el.setAttribute('tabindex', original);
    }
  }
  tabIndexMap.clear();
}

/* ==========================================================================
   Global Style Sheet Manager
   ========================================================================== */
const GLOBAL_STYLE_ID = 'mhaf-engine-styles';

function injectGlobalStyles() {
  if (document.getElementById(GLOBAL_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    /* Dyslexic & Readable Fonts */
    @font-face {
      font-family: 'OpenDyslexic3';
      src: url('https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/open-dyslexic/OpenDyslexic3-Regular.woff2') format('woff2');
      font-display: swap;
    }

    [data-mhaf-readable-font] :not(i):not(.bi):not([class*="icon"]) {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
    }

    [data-mhaf-dyslexic-font] :not(i):not(.bi):not([class*="icon"]) {
      font-family: 'OpenDyslexic3', -apple-system, sans-serif !important;
      letter-spacing: 0.5px !important;
    }

    /* Scaling Content */
    [data-mhaf-scale-content="1"] body > :not(#mhaf-widget):not(#mhaf-reading-guide) {
      zoom: 1.1 !important;
    }
    [data-mhaf-scale-content="2"] body > :not(#mhaf-widget):not(#mhaf-reading-guide) {
      zoom: 1.2 !important;
    }
    [data-mhaf-scale-content="3"] body > :not(#mhaf-widget):not(#mhaf-reading-guide) {
      zoom: 1.3 !important;
    }

    /* Font Sizes */
    [data-mhaf-font-size="1"] :is(p, span, a, li, button, input, label) {
      font-size: 110% !important;
    }
    [data-mhaf-font-size="2"] :is(p, span, a, li, button, input, label) {
      font-size: 125% !important;
    }
    [data-mhaf-font-size="3"] :is(p, span, a, li, button, input, label) {
      font-size: 140% !important;
    }

    /* Text Spacing & Align */
    [data-mhaf-letter-spacing="1"] :is(p, h1, h2, h3, h4, h5, h6, span, a, li) {
      letter-spacing: 1.5px !important;
    }
    [data-mhaf-letter-spacing="2"] :is(p, h1, h2, h3, h4, h5, h6, span, a, li) {
      letter-spacing: 2.5px !important;
    }

    [data-mhaf-line-height="1"] :is(p, h1, h2, h3, h4, h5, h6, span, a, li) {
      line-height: 1.8 !important;
    }
    [data-mhaf-line-height="2"] :is(p, h1, h2, h3, h4, h5, h6, span, a, li) {
      line-height: 2.2 !important;
    }

    [data-mhaf-text-align="left"] :is(p, h1, h2, h3, h4, h5, h6, li) {
      text-align: left !important;
    }
    [data-mhaf-text-align="center"] :is(p, h1, h2, h3, h4, h5, h6, li) {
      text-align: center !important;
    }
    [data-mhaf-text-align="right"] :is(p, h1, h2, h3, h4, h5, h6, li) {
      text-align: right !important;
    }

    /* Outlines */
    [data-mhaf-outline-titles] :is(h1, h2, h3, h4, h5, h6) {
      outline: 2px solid #2563eb !important;
      outline-offset: 4px !important;
    }

    [data-mhaf-outline-links] a {
      outline: 2px dashed #0284c7 !important;
      outline-offset: 2px !important;
      text-decoration: underline !important;
      font-weight: 700 !important;
    }

    /* Focus Highlight */
    [data-mhaf-focus-outline] :focus,
    [data-mhaf-focus-outline] :focus-visible {
      outline: 3px solid #f59e0b !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.6) !important;
    }

    /* Keyboard navigation glowing pulse */
    [data-mhaf-keyboard-navigation] :focus-visible {
      outline: 3px solid #3b82f6 !important;
      transform: scale(1.02);
      transition: transform 0.2s ease, outline 0.2s ease;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.7) !important;
    }

    /* High Contrast Dark */
    [data-mhaf-dark-contrast] body {
      background-color: #0b0f19 !important;
      color: #f8fafc !important;
    }
    [data-mhaf-dark-contrast] body :not(#mhaf-widget):not(#mhaf-widget *) {
      background-color: #0b0f19 !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }
    [data-mhaf-dark-contrast] :is(h1, h2, h3, h4, h5, h6) {
      color: #38bdf8 !important;
    }
    [data-mhaf-dark-contrast] a {
      color: #facc15 !important;
    }

    /* High Contrast Light (Yellow/Black) */
    [data-mhaf-light-contrast] body {
      background-color: #fef9c3 !important;
      color: #000000 !important;
    }
    [data-mhaf-light-contrast] body :not(#mhaf-widget):not(#mhaf-widget *) {
      background-color: #fef9c3 !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }
    [data-mhaf-light-contrast] :is(h1, h2, h3, h4, h5, h6) {
      color: #000000 !important;
      font-weight: 800 !important;
    }
    [data-mhaf-light-contrast] a {
      color: #1d4ed8 !important;
      text-decoration: underline !important;
    }

    /* Color Balance Filters */
    [data-mhaf-color-balance="1"] { filter: contrast(1.5) !important; }
    [data-mhaf-color-balance="2"] { filter: saturate(2) !important; }
    [data-mhaf-color-balance="3"] { filter: grayscale(1) !important; }
    [data-mhaf-color-balance="4"] { filter: invert(1) hue-rotate(180deg) !important; }

    /* Disable Animations */
    [data-mhaf-disable-animation] *,
    [data-mhaf-disable-animation] *::before,
    [data-mhaf-disable-animation] *::after {
      transition: none !important;
      animation: none !important;
      scroll-behavior: auto !important;
    }

    /* Big Cursor */
    [data-mhaf-cursor-size] * {
      cursor: default !important;
    }
    [data-mhaf-cursor-size] :is(a, button, input, label, select, [role="button"]) {
      cursor: pointer !important;
    }
  `;

  document.head.appendChild(style);
}

/* ==========================================================================
   State Management & Application
   ========================================================================== */
function applyPrefToDOM(key, val) {
  const root = document.documentElement;
  const attrName = `data-mhaf-${key.replaceAll('_', '-')}`;

  if (val === undefined || val === null || val === false) {
    root.removeAttribute(attrName);
  } else {
    root.setAttribute(attrName, String(val));
  }

  // Interactive tool handlers
  switch (key) {
    case 'reading_guide':
      val ? enableReadingGuide() : disableReadingGuide();
      break;
    case 'reading_mask':
      val ? enableReadingMask() : disableReadingMask();
      break;
    case 'text_magnifier':
      val ? enableTextMagnifier() : disableTextMagnifier();
      break;
    case 'image_caption':
      val ? enableImageCaptions() : disableImageCaptions();
      break;
    case 'mute_sound':
      val ? enableMuteSound() : disableMuteSound();
      break;
    case 'keyboard_navigation':
      val ? enableKeyboardNavigation() : disableKeyboardNavigation();
      break;
  }
}

function notifySubscribers() {
  for (const fn of listeners) {
    try {
      fn({ prefs: currentPrefs, profile: currentProfile });
    } catch (e) {
      console.error(e);
    }
  }
}

function persistState() {
  try {
    if (Object.keys(currentPrefs).length > 0) {
      localStorage.setItem(`${STORAGE_PREFIX}prefs`, JSON.stringify(currentPrefs));
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}prefs`);
    }

    if (currentProfile) {
      localStorage.setItem(`${STORAGE_PREFIX}profile`, currentProfile);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}profile`);
    }
  } catch (e) {}
}

export function setPref(key, value) {
  if (value === undefined || value === null) {
    delete currentPrefs[key];
  } else {
    currentPrefs[key] = value;
  }

  // Mutual exclusion: dark vs light contrast
  if (key === 'dark_contrast' && value) {
    delete currentPrefs.light_contrast;
    applyPrefToDOM('light_contrast', undefined);
  } else if (key === 'light_contrast' && value) {
    delete currentPrefs.dark_contrast;
    applyPrefToDOM('dark_contrast', undefined);
  }

  applyPrefToDOM(key, value);
  persistState();
  notifySubscribers();
}

export function setProfile(profileKey) {
  if (currentProfile === profileKey) {
    // Toggle off
    currentProfile = null;
    resetPrefs();
    return;
  }

  currentProfile = profileKey;
  const config = PROFILES[profileKey] || {};

  // Clean prior preferences
  for (const k of Object.keys(currentPrefs)) {
    applyPrefToDOM(k, undefined);
  }
  currentPrefs = { ...config };

  for (const [k, v] of Object.entries(currentPrefs)) {
    applyPrefToDOM(k, v);
  }

  persistState();
  notifySubscribers();
}

export function resetPrefs() {
  for (const k of Object.keys(currentPrefs)) {
    applyPrefToDOM(k, undefined);
  }
  currentPrefs = {};
  currentProfile = null;
  persistState();
  notifySubscribers();
}

export function getPrefs() {
  return { ...currentPrefs };
}

export function getProfile() {
  return currentProfile;
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function initEngine() {
  injectGlobalStyles();

  // Load saved state from localStorage
  try {
    const savedPrefs = localStorage.getItem(`${STORAGE_PREFIX}prefs`);
    if (savedPrefs) {
      currentPrefs = JSON.parse(savedPrefs) || {};
    }
    currentProfile = localStorage.getItem(`${STORAGE_PREFIX}profile`) || null;
  } catch (e) {}

  // Apply all restored preferences
  for (const [k, v] of Object.entries(currentPrefs)) {
    applyPrefToDOM(k, v);
  }

  notifySubscribers();
}
