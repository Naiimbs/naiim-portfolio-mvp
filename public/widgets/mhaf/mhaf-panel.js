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
            <span class="mhaf-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="4.5" r="2.5"/>
                <path d="M5 8.5h14M12 8.5V15M8 21l4-6 4 6"/>
              </svg>
            </span>
            <div>
              <h2 class="mhaf-title">${t('widgetTitle')}</h2>
              <p class="mhaf-subtitle">${t('widgetSubtitle')}</p>
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
          <section class="mhaf-section">
            <h3 class="mhaf-section-title">${t('profilesTitle')}</h3>
            <div class="mhaf-profiles-grid">
              ${Object.keys(PROFILES)
                .map((profKey) => {
                  const isActive = activeProf === profKey;
                  return `
                  <button type="button" class="mhaf-profile-card ${isActive ? 'active' : ''}" data-profile="${profKey}">
                    <div class="mhaf-profile-header">
                      <span class="mhaf-profile-name">${t(profKey)}</span>
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
          </section>

          <!-- Readability Section -->
          <section class="mhaf-section">
            <h3 class="mhaf-section-title">${t('readabilityTitle')}</h3>
            <div class="mhaf-cards-grid">
              <!-- Scale Content -->
              <div class="mhaf-card">
                <span class="mhaf-card-title">${t('scale_content')}</span>
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.scale_content ? 'active' : ''}" data-pref="scale_content" data-val="">100%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.scale_content == 1 ? 'active' : ''}" data-pref="scale_content" data-val="1">110%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.scale_content == 2 ? 'active' : ''}" data-pref="scale_content" data-val="2">120%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.scale_content == 3 ? 'active' : ''}" data-pref="scale_content" data-val="3">130%</button>
                </div>
              </div>

              <!-- Readable Font -->
              <button type="button" class="mhaf-toggle-card ${prefs.readable_font ? 'active' : ''}" data-toggle="readable_font">
                <span class="mhaf-card-title">${t('readable_font')}</span>
                <span class="mhaf-switch ${prefs.readable_font ? 'on' : ''}"></span>
              </button>

              <!-- Dyslexic Font -->
              <button type="button" class="mhaf-toggle-card ${prefs.dyslexic_font ? 'active' : ''}" data-toggle="dyslexic_font">
                <span class="mhaf-card-title">${t('dyslexic_font')}</span>
                <span class="mhaf-switch ${prefs.dyslexic_font ? 'on' : ''}"></span>
              </button>

              <!-- Font Size -->
              <div class="mhaf-card">
                <span class="mhaf-card-title">${t('font_size')}</span>
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.font_size ? 'active' : ''}" data-pref="font_size" data-val="">Standard</button>
                  <button type="button" class="mhaf-level-btn ${prefs.font_size == 1 ? 'active' : ''}" data-pref="font_size" data-val="1">+10%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.font_size == 2 ? 'active' : ''}" data-pref="font_size" data-val="2">+25%</button>
                  <button type="button" class="mhaf-level-btn ${prefs.font_size == 3 ? 'active' : ''}" data-pref="font_size" data-val="3">+40%</button>
                </div>
              </div>

              <!-- Line Height -->
              <div class="mhaf-card">
                <span class="mhaf-card-title">${t('line_height')}</span>
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.line_height ? 'active' : ''}" data-pref="line_height" data-val="">Standard</button>
                  <button type="button" class="mhaf-level-btn ${prefs.line_height == 1 ? 'active' : ''}" data-pref="line_height" data-val="1">1.8x</button>
                  <button type="button" class="mhaf-level-btn ${prefs.line_height == 2 ? 'active' : ''}" data-pref="line_height" data-val="2">2.2x</button>
                </div>
              </div>

              <!-- Letter Spacing -->
              <div class="mhaf-card">
                <span class="mhaf-card-title">${t('letter_spacing')}</span>
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.letter_spacing ? 'active' : ''}" data-pref="letter_spacing" data-val="">Standard</button>
                  <button type="button" class="mhaf-level-btn ${prefs.letter_spacing == 1 ? 'active' : ''}" data-pref="letter_spacing" data-val="1">+1.5px</button>
                  <button type="button" class="mhaf-level-btn ${prefs.letter_spacing == 2 ? 'active' : ''}" data-pref="letter_spacing" data-val="2">+2.5px</button>
                </div>
              </div>

              <!-- Text Alignment -->
              <div class="mhaf-card">
                <span class="mhaf-card-title">${t('text_align')}</span>
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${prefs.text_align === 'left' ? 'active' : ''}" data-pref="text_align" data-val="left">${t('align_left')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.text_align === 'center' ? 'active' : ''}" data-pref="text_align" data-val="center">${t('align_center')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.text_align === 'right' ? 'active' : ''}" data-pref="text_align" data-val="right">${t('align_right')}</button>
                </div>
              </div>

              <!-- Outline Titles & Links -->
              <button type="button" class="mhaf-toggle-card ${prefs.outline_titles ? 'active' : ''}" data-toggle="outline_titles">
                <span class="mhaf-card-title">${t('outline_titles')}</span>
                <span class="mhaf-switch ${prefs.outline_titles ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.outline_links ? 'active' : ''}" data-toggle="outline_links">
                <span class="mhaf-card-title">${t('outline_links')}</span>
                <span class="mhaf-switch ${prefs.outline_links ? 'on' : ''}"></span>
              </button>
            </div>
          </section>

          <!-- Contrast & Colors Section -->
          <section class="mhaf-section">
            <h3 class="mhaf-section-title">${t('contrastTitle')}</h3>
            <div class="mhaf-cards-grid">
              <button type="button" class="mhaf-toggle-card ${prefs.dark_contrast ? 'active' : ''}" data-toggle="dark_contrast">
                <span class="mhaf-card-title">${t('dark_contrast')}</span>
                <span class="mhaf-switch ${prefs.dark_contrast ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.light_contrast ? 'active' : ''}" data-toggle="light_contrast">
                <span class="mhaf-card-title">${t('light_contrast')}</span>
                <span class="mhaf-switch ${prefs.light_contrast ? 'on' : ''}"></span>
              </button>

              <!-- Color Balance -->
              <div class="mhaf-card mhaf-card-wide">
                <span class="mhaf-card-title">${t('color_balance')}</span>
                <div class="mhaf-btn-group">
                  <button type="button" class="mhaf-level-btn ${!prefs.color_balance ? 'active' : ''}" data-pref="color_balance" data-val="">Normal</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 1 ? 'active' : ''}" data-pref="color_balance" data-val="1">${t('contrast_high')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 2 ? 'active' : ''}" data-pref="color_balance" data-val="2">${t('saturation_high')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 3 ? 'active' : ''}" data-pref="color_balance" data-val="3">${t('monochrome')}</button>
                  <button type="button" class="mhaf-level-btn ${prefs.color_balance == 4 ? 'active' : ''}" data-pref="color_balance" data-val="4">${t('invert_colors')}</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Assistive & Navigation Tools -->
          <section class="mhaf-section">
            <h3 class="mhaf-section-title">${t('assistiveTitle')}</h3>
            <div class="mhaf-cards-grid">
              <button type="button" class="mhaf-toggle-card ${prefs.reading_guide ? 'active' : ''}" data-toggle="reading_guide">
                <span class="mhaf-card-title">${t('reading_guide')}</span>
                <span class="mhaf-switch ${prefs.reading_guide ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.reading_mask ? 'active' : ''}" data-toggle="reading_mask">
                <span class="mhaf-card-title">${t('reading_mask')}</span>
                <span class="mhaf-switch ${prefs.reading_mask ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.text_magnifier ? 'active' : ''}" data-toggle="text_magnifier">
                <span class="mhaf-card-title">${t('text_magnifier')}</span>
                <span class="mhaf-switch ${prefs.text_magnifier ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.image_caption ? 'active' : ''}" data-toggle="image_caption">
                <span class="mhaf-card-title">${t('image_caption')}</span>
                <span class="mhaf-switch ${prefs.image_caption ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.disable_animation ? 'active' : ''}" data-toggle="disable_animation">
                <span class="mhaf-card-title">${t('disable_animation')}</span>
                <span class="mhaf-switch ${prefs.disable_animation ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.mute_sound ? 'active' : ''}" data-toggle="mute_sound">
                <span class="mhaf-card-title">${t('mute_sound')}</span>
                <span class="mhaf-switch ${prefs.mute_sound ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.focus_outline ? 'active' : ''}" data-toggle="focus_outline">
                <span class="mhaf-card-title">${t('focus_outline')}</span>
                <span class="mhaf-switch ${prefs.focus_outline ? 'on' : ''}"></span>
              </button>

              <button type="button" class="mhaf-toggle-card ${prefs.keyboard_navigation ? 'active' : ''}" data-toggle="keyboard_navigation">
                <span class="mhaf-card-title">${t('keyboard_navigation')}</span>
                <span class="mhaf-switch ${prefs.keyboard_navigation ? 'on' : ''}"></span>
              </button>
            </div>
          </section>
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
