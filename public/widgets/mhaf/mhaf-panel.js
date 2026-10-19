/**
 * MHAF Accessibility Widget - UI Panel
 * Self-contained accessible modal UI rendered inside Shadow DOM.
 */

import { DICTIONARY, LANGUAGES, detectLanguage } from './mhaf-i18n.js';
import {
  setPref,
  setProfile,
  resetPrefs,
  getPrefs,
  getProfile,
  subscribe,
  PROFILES
} from './mhaf-engine.js';

export function createPanel(shadowRoot, options = {}) {
  let currentLang = detectLanguage();
  let state = {
    prefs: getPrefs(),
    profile: getProfile()
  };

  const primaryColor = options.primaryColor || '#2563eb';

  // Create panel element
  const panel = document.createElement('div');
  panel.className = 'mhaf-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', DICTIONARY[currentLang].widgetTitle);
  panel.setAttribute('dir', LANGUAGES[currentLang].dir);

  function t(key) {
    return DICTIONARY[currentLang]?.[key] || DICTIONARY.fr[key] || key;
  }

  const ICON_PATHS = {
    motor_impaired: '<circle cx="12" cy="5" r="2"/><path d="M9 21l2.2-6.5 3.2 2.1 2.8 4.4M9.8 10.5h5.5M11 8l-2 4"/>',
    dyslexic_profile: '<path d="M4 7.5h16M4 12h12M4 16.5h16"/><path d="M18 9l2 2-2 2"/>',
    cognitive_learning: '<circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4M12 4v2M12 18v2"/>',
    epilepsy_safe: '<path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z"/>',
    visually_impaired: '<path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z"/><circle cx="12" cy="12" r="2.5"/>',
    color_blind: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/><path d="M6 15l3-3m6-6l3-3"/>',
    adhd_profile: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="7"/><path d="M8 12h8"/>',
    scale_content: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M8 12h8M12 8v8"/>',
    readable_font: '<path d="M5 19l5-14h4l5 14M7 14h10"/>',
    dyslexic_font: '<path d="M5 6h6a4 4 0 010 8H5zM5 14l5 5M15 6v13"/>',
    font_size: '<path d="M4 19l5-14h3l5 14M6 14h9M18 8h3M19.5 6v6"/>',
    letter_spacing: '<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
    line_height: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    text_align: '<path d="M4 6h16M4 10h12M4 14h16M4 18h9"/>',
    outline_titles: '<rect x="4" y="5" width="16" height="5" rx="1"/><path d="M4 14h16M4 18h10"/>',
    outline_links: '<path d="M10 13a4 4 0 005.7.3l2-2a4 4 0 00-5.7-5.7l-1.1 1.1M14 11a4 4 0 00-5.7-.3l-2 2A4 4 0 0012 18.4l1.1-1.1"/>',
    dark_contrast: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 000 16 6 6 0 000-16z"/>',
    light_contrast: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    color_balance: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M8 8v8M16 8v8"/>',
    reading_guide: '<path d="M4 7h16M4 17h16"/><path d="M7 12h10"/>',
    reading_mask: '<path d="M3 6h18M3 18h18"/><rect x="3" y="9" width="18" height="6" rx="2"/>',
    text_magnifier: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M15 15l5 5M8 10h5M10.5 8v5"/>',
    image_caption: '<rect x="4" y="4" width="16" height="12" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="M5 14l4-3 3 2 2-1 5 4M7 20h10"/>',
    mute_sound: '<path d="M5 10v4h3l4 3V7l-4 3H5zM16 10l4 4M20 10l-4 4"/>',
    disable_animation: '<circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/>',
    cursor_size: '<path d="M6 3l4 17 3-6 5 3 1-2-5-3 5-2L6 3z"/>',
    focus_outline: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M19 9h3M2 15h3M19 15h3"/>',
    keyboard_navigation: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M6 14h12"/>',
    default: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'
  };

  function featureIcon(key) {
    return `<svg class="mhaf-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[key] || ICON_PATHS.default}</svg>`;
  }

  function cardTitle(key, label) {
    return `<span class="mhaf-card-title">${featureIcon(key)}<span>${label}</span></span>`;
  }

  function render() {
    const isRtl = LANGUAGES[currentLang].dir === 'rtl';
    panel.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    panel.setAttribute('aria-label', t('widgetTitle'));

    const existingBody = panel.querySelector('.mhaf-body');
    const savedScrollTop = existingBody ? existingBody.scrollTop : 0;

    const prefs = state.prefs;
    const activeProf = state.profile;

    panel.innerHTML = `
      <div class="mhaf-panel-backdrop"></div>
      <div class="mhaf-panel-window">
        <!-- Header -->
        <header class="mhaf-header">
          <div class="mhaf-header-brand">
            <div class="mhaf-brand-lockup">
              <div class="mhaf-wordmark" aria-label="mhaf">mhaf<span class="mhaf-wink" aria-hidden="true">⌒</span></div>
              <p class="mhaf-slogan" lang="en">A little wink. A more accessible web.</p>
              <div class="mhaf-context">
                <h2 class="mhaf-title">${t('widgetTitle')}</h2>
                <p class="mhaf-subtitle">${t('widgetSubtitle')}</p>
              </div>
            </div>
          </div>

          <div class="mhaf-header-actions">
            <!-- Language Switcher -->
            <div class="mhaf-lang-group" role="group" aria-label="Langue">
              ${Object.entries(LANGUAGES)
                .map(
                  ([code, lang]) => `
                <button type="button" class="mhaf-lang-btn ${code === currentLang ? 'active' : ''}" data-lang="${code}">
                  ${code.toUpperCase()}
                </button>
              `
                )
                .join('')}
            </div>

            <!-- Close button -->
            <button type="button" class="mhaf-close-btn" aria-label="${t('close')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>

        <!-- Content Area (Scrollable) -->
        <div class="mhaf-body">
          <!-- Profiles Section -->
          <details class="mhaf-section" open>
            <summary class="mhaf-section-title"><span role="heading" aria-level="3">${t('profilesTitle')}</span></summary>
            <div class="mhaf-profiles-grid">
              ${Object.keys(PROFILES)
                .map((profKey) => {
                  const isActive = activeProf === profKey;
                  return `
                  <button type="button" class="mhaf-profile-card ${isActive ? 'active' : ''}" data-profile="${profKey}">
                    <div class="mhaf-profile-header">
                      <span class="mhaf-profile-name">${featureIcon(profKey)}<span>${t(profKey)}</span></span>
                      <span class="mhaf-badge ${isActive ? 'badge-on' : 'badge-off'}">
                        ${isActive ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <p class="mhaf-profile-desc">${t(`${profKey}_desc`)}</p>
                  </button>
                `;
                })
                .join('')}
            </div>
          </details>

          <!-- Readability Section -->
          <details class="mhaf-section" open>
            <summary class="mhaf-section-title"><span role="heading" aria-level="3">${t('readabilityTitle')}</span></summary>
            <div class="mhaf-cards-grid">
              <!-- Scale Content -->
              <div class="mhaf-card">
                ${cardTitle('scale_content', t('scale_content'))}
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.scale_content ? 'active' : ''}" data-pref="scale_content" data-val="">100%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.scale_content == 1 ? 'active' : ''}" data-pref="scale_content" data-val="1">110%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.scale_content == 2 ? 'active' : ''}" data-pref="scale_content" data-val="2">120%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.scale_content == 3 ? 'active' : ''}" data-pref="scale_content" data-val="3">130%</button>
                </div>
              </div>

              <!-- Readable Font -->
              <button type="button" class="mhaf-toggle-card ${prefs.readable_font ? 'active' : ''}" data-toggle="readable_font">
                ${cardTitle('readable_font', t('readable_font'))}
                <span class="mhaf-switch ${prefs.readable_font ? 'on' : ''}"></span>
              </button>

              <!-- Dyslexic Font -->
              <button type="button" class="mhaf-toggle-card ${prefs.dyslexic_font ? 'active' : ''}" data-toggle="dyslexic_font">
                ${cardTitle('dyslexic_font', t('dyslexic_font'))}
                <span class="mhaf-switch ${prefs.dyslexic_font ? 'on' : ''}"></span>
              </button>

              <!-- Font Size -->
              <div class="mhaf-card">
                ${cardTitle('font_size', t('font_size'))}
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.font_size ? 'active' : ''}" data-pref="font_size" data-val="">Standard</button>
                  <button type="button" class="mhaf-level-btn ${prefs.font_size == 1 ? 'active' : ''}" data-pref="font_size" data-val="1">+10%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.font_size == 2 ? 'active' : ''}" data-pref="font_size" data-val="2">+25%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.font_size == 3 ? 'active' : ''}" data-pref="font_size" data-val="3">+40%</button>
                </div>
              </div>

              <!-- Line Height -->
              <div class="mhaf-card">
                ${cardTitle('line_height', t('line_height'))}
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.line_height ? 'active' : ''}" data-pref="line_height" data-val="">Standard</button>
                  <button type="button" class="mhaf-level-btn ${prefs.line_height == 1 ? 'active' : ''}" data-pref="line_height" data-val="1">1.8x</button>
                  <button type="button" class="mhaf-level-btn ${prefs.line_height == 2 ? 'active' : ''}" data-pref="line_height" data-val="2">2.2x</button>
                </div>
              </div>

              <!-- Letter Spacing -->
              <div class="mhaf-card">
                ${cardTitle('letter_spacing', t('letter_spacing'))}
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.letter_spacing ? 'active' : ''}" data-pref="letter_spacing" data-val="">Standard</button>
                  <button type="button" class="mhaf-level-btn ${prefs.letter_spacing == 1 ? 'active' : ''}" data-pref="letter_spacing" data-val="1">+1.5px</button>
                  <button type="button" class="mhaf-level-btn ${prefs.letter_spacing == 2 ? 'active' : ''}" data-pref="letter_spacing" data-val="2">+2.5px</button>
                </div>
              </div>

              <!-- Text Alignment -->
              <div class="mhaf-card">
                ${cardTitle('text_align', t('text_align'))}
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${prefs.text_align === 'left' ? 'active' : ''}" data-pref="text_align" data-val="left">${t('align_left')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.text_align === 'center' ? 'active' : ''}" data-pref="text_align" data-val="center">${t('align_center')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.text_align === 'right' ? 'active' : ''}" data-pref="text_align" data-val="right">${t('align_right')}</button>
                </div>
              </div>

              <!-- Outline Titles & Links -->
              <button type="button" class="mhaf-toggle-card ${prefs.outline_titles ? 'active' : ''}" data-toggle="outline_titles">
                ${cardTitle('outline_titles', t('outline_titles'))}
                <span class="mhaf-switch ${prefs.outline_titles ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.outline_links ? 'active' : ''}" data-toggle="outline_links">
                ${cardTitle('outline_links', t('outline_links'))}
                <span class="mhaf-switch ${prefs.outline_links ? 'on' : ''}"></span>
              </button>
            </div>
          </details>

          <!-- Contrast & Colors Section -->
          <details class="mhaf-section" open>
            <summary class="mhaf-section-title"><span role="heading" aria-level="3">${t('contrastTitle')}</span></summary>
            <div class="mhaf-cards-grid">
              <button type="button" class="mhaf-toggle-card ${prefs.dark_contrast ? 'active' : ''}" data-toggle="dark_contrast">
                ${cardTitle('dark_contrast', t('dark_contrast'))}
                <span class="mhaf-switch ${prefs.dark_contrast ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.light_contrast ? 'active' : ''}" data-toggle="light_contrast">
                ${cardTitle('light_contrast', t('light_contrast'))}
                <span class="mhaf-switch ${prefs.light_contrast ? 'on' : ''}"></span>
              </button>

              <!-- Color Balance -->
              <div class="mhaf-card mhaf-card-wide">
                ${cardTitle('color_balance', t('color_balance'))}
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.color_balance ? 'active' : ''}" data-pref="color_balance" data-val="">Normal</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 1 ? 'active' : ''}" data-pref="color_balance" data-val="1">${t('contrast_high')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 2 ? 'active' : ''}" data-pref="color_balance" data-val="2">${t('saturation_high')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 3 ? 'active' : ''}" data-pref="color_balance" data-val="3">${t('monochrome')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 4 ? 'active' : ''}" data-pref="color_balance" data-val="4">${t('invert_colors')}</button>
                </div>
              </div>
            </div>
          </details>

          <!-- Assistive & Navigation Tools -->
          <details class="mhaf-section" open>
            <summary class="mhaf-section-title"><span role="heading" aria-level="3">${t('assistiveTitle')}</span></summary>
            <div class="mhaf-cards-grid">
              <button type="button" class="mhaf-toggle-card ${prefs.reading_guide ? 'active' : ''}" data-toggle="reading_guide">
                ${cardTitle('reading_guide', t('reading_guide'))}
                <span class="mhaf-switch ${prefs.reading_guide ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.reading_mask ? 'active' : ''}" data-toggle="reading_mask">
                ${cardTitle('reading_mask', t('reading_mask'))}
                <span class="mhaf-switch ${prefs.reading_mask ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.text_magnifier ? 'active' : ''}" data-toggle="text_magnifier">
                ${cardTitle('text_magnifier', t('text_magnifier'))}
                <span class="mhaf-switch ${prefs.text_magnifier ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.image_caption ? 'active' : ''}" data-toggle="image_caption">
                ${cardTitle('image_caption', t('image_caption'))}
                <span class="mhaf-switch ${prefs.image_caption ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.disable_animation ? 'active' : ''}" data-toggle="disable_animation">
                ${cardTitle('disable_animation', t('disable_animation'))}
                <span class="mhaf-switch ${prefs.disable_animation ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.mute_sound ? 'active' : ''}" data-toggle="mute_sound">
                ${cardTitle('mute_sound', t('mute_sound'))}
                <span class="mhaf-switch ${prefs.mute_sound ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.focus_outline ? 'active' : ''}" data-toggle="focus_outline">
                ${cardTitle('focus_outline', t('focus_outline'))}
                <span class="mhaf-switch ${prefs.focus_outline ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.keyboard_navigation ? 'active' : ''}" data-toggle="keyboard_navigation">
                ${cardTitle('keyboard_navigation', t('keyboard_navigation'))}
                <span class="mhaf-switch ${prefs.keyboard_navigation ? 'on' : ''}"></span>
              </button>
            </div>
          </details>
        </div>

        <!-- Footer -->
        <footer class="mhaf-footer">
          <button type="button" class="mhaf-reset-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            ${t('reset')}
          </button>
          <div class="mhaf-powered">
            <span class="mhaf-powered-text">${t('poweredBy')}</span>
          </div>
        </footer>
      </div>
    `;

    bindEvents();

    const newBody = panel.querySelector('.mhaf-body');
    if (newBody && savedScrollTop > 0) {
      newBody.scrollTop = savedScrollTop;
    }
  }

  /**
   * Fast in-place DOM update when options toggle (preserves exact scroll position and active focus)
   */
  function updateUI() {
    const prefs = state.prefs;
    const activeProf = state.profile;

    // 1. Update Profile cards
    panel.querySelectorAll('[data-profile]').forEach((btn) => {
      const profKey = btn.dataset.profile;
      const isActive = activeProf === profKey;
      btn.classList.toggle('active', isActive);
      const badge = btn.querySelector('.mhaf-badge');
      if (badge) {
        badge.className = `mhaf-badge ${isActive ? 'badge-on' : 'badge-off'}`;
        badge.textContent = isActive ? t('active') : t('inactive');
      }
    });

    // 2. Update Toggle switches
    panel.querySelectorAll('[data-toggle]').forEach((btn) => {
      const prefKey = btn.dataset.toggle;
      const isActive = Boolean(prefs[prefKey]);
      btn.classList.toggle('active', isActive);
      const sw = btn.querySelector('.mhaf-switch');
      if (sw) {
        sw.classList.toggle('on', isActive);
      }
    });

    // 3. Update Level buttons (scale, font size, line height, etc.)
    panel.querySelectorAll('[data-pref]').forEach((btn) => {
      const prefKey = btn.dataset.pref;
      const val = btn.dataset.val;
      const currentVal = prefs[prefKey];
      const isActive = (!val && !currentVal) || (String(currentVal) === String(val));
      btn.classList.toggle('active', isActive);
    });
  }

  function bindEvents() {
    // Backdrop click
    panel.querySelector('.mhaf-panel-backdrop')?.addEventListener('click', hide);

    // Close button
    panel.querySelector('.mhaf-close-btn')?.addEventListener('click', hide);

    // Language switcher (Full re-render needed for dictionary changes)
    panel.querySelectorAll('.mhaf-lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        if (lang && lang !== currentLang) {
          currentLang = lang;
          try {
            localStorage.setItem('mhaf:lang', lang);
          } catch (e) {}
          render();
        }
      });
    });

    // Profile buttons
    panel.querySelectorAll('[data-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prof = btn.dataset.profile;
        setProfile(prof);
      });
    });

    // Toggle cards (Boolean features)
    panel.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pref = btn.dataset.toggle;
        const currentVal = state.prefs[pref];
        setPref(pref, currentVal ? undefined : 1);
      });
    });

    // Level buttons (Multi-step features)
    panel.querySelectorAll('[data-pref]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pref = btn.dataset.pref;
        const val = btn.dataset.val ? btn.dataset.val : undefined;
        setPref(pref, val);
      });
    });

    // Reset button
    panel.querySelector('.mhaf-reset-btn')?.addEventListener('click', () => {
      resetPrefs();
    });
  }

  function show() {
    state.prefs = getPrefs();
    state.profile = getProfile();
    render();
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Subscribe to engine state changes: perform fast in-place update without resetting scroll
  subscribe((newState) => {
    state = newState;
    if (panel.classList.contains('open')) {
      updateUI();
    }
  });

  // Keyboard close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      hide();
    }
  });

  render();
  shadowRoot.appendChild(panel);

  return {
    show,
    hide,
    isOpen: () => panel.classList.contains('open')
  };
}
