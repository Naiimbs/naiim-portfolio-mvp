/**
 * MHAF Accessibility Widget - Standalone Embed Loader
 * Self-contained entry point with Shadow DOM encapsulation.
 * 
 * Usage:
 * <script type="module" src="/widgets/mhaf/mhaf.js" data-position="bottom-left"></script>
 */

import { initEngine } from './mhaf-engine.js';

(function () {
  if (document.getElementById('mhaf-widget')) return;

  async function mountWidget() {
    if (document.getElementById('mhaf-widget')) return;

    // Detect script options
    const currentScript = document.currentScript || document.querySelector('script[src*="mhaf.js"]');
    const position = currentScript?.getAttribute('data-position') || 'bottom-left';
    const siteId = currentScript?.getAttribute('data-site-id') || null;

    // 1. Initialize engine (applies saved localStorage preferences immediately)
    initEngine();

    // 2. Create host container & attach Shadow DOM
    const container = document.createElement('div');
    container.id = 'mhaf-widget';
    container.setAttribute('aria-hidden', 'false');
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // 3. Inject Shadow DOM CSS
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = new URL('./mhaf.css', import.meta.url).href;
    shadowRoot.appendChild(linkEl);

    // 4. Create floating trigger button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'mhaf-toggle-btn';
    toggleBtn.setAttribute('data-position', position);
    toggleBtn.setAttribute('aria-label', 'Open accessibility options');
    toggleBtn.setAttribute('title', 'Open accessibility options');
    toggleBtn.setAttribute('aria-haspopup', 'dialog');
    toggleBtn.innerHTML = `
      <svg class="mhaf-accessibility-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="3.5"/>
        <circle cx="24" cy="12.5" r="4" fill="currentColor"/>
        <path d="M11 19h26M24 19v12M24 31l-8 10M24 31l8 10" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    shadowRoot.appendChild(toggleBtn);
    document.body.appendChild(container);

    // 5. Ensure widget stays in DOM even with SPA route changes
    const observer = new MutationObserver(() => {
      if (!container.isConnected && document.body) {
        document.body.appendChild(container);
      }
    });
    observer.observe(document.body, { childList: true });

    // 6. Lazy load Panel on hover/focus or click
    let panelInstance = null;
    let loadingPromise = null;

    const loadPanel = () => {
      if (!loadingPromise) {
        loadingPromise = import('./mhaf-panel.js').then((module) => {
          panelInstance = module.createPanel(shadowRoot, {
            primaryColor: '#2563eb'
          });
          return panelInstance;
        });
      }
      return loadingPromise;
    };

    // Preload on mouse hover or button focus
    toggleBtn.addEventListener('pointerenter', loadPanel, { once: true });
    toggleBtn.addEventListener('focus', loadPanel, { once: true });

    // Open on click
    toggleBtn.addEventListener('click', async () => {
      toggleBtn.setAttribute('aria-busy', 'true');
      try {
        const panel = await loadPanel();
        panel.show();
      } catch (err) {
        console.error('[MHAF] Failed to load accessibility panel:', err);
      } finally {
        toggleBtn.removeAttribute('aria-busy');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWidget);
  } else {
    mountWidget();
  }
})();
