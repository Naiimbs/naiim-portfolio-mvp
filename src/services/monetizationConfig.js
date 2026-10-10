/**
 * Monetization Configuration & Provider Abstraction (Phase 19.1)
 *
 * Strict policy:
 * - All monetization is strictly DISABLED by default (enabled: false)
 * - Zero third-party vendor scripts (Google AdSense, etc.) injected
 * - Zero ad slots rendered in public views while disabled
 * - Supported conceptual placements: article_top, article_middle, article_bottom, sidebar, between_articles
 * - Architectural boundary: decouples future monetization from editorial/builder rendering
 */

export const MONETIZATION_CONFIG = {
  enabled: false, // Authoritative kill-switch: strictly disabled
  provider: 'none', // 'none' | 'custom' | future monetization provider
  testMode: false,
  networkId: null,
  placements: {
    article_top: { enabled: false, format: 'banner', label: 'Top Banner Placement' },
    article_middle: { enabled: false, format: 'inline', label: 'In-Article Inline Placement' },
    article_bottom: { enabled: false, format: 'banner', label: 'Bottom Banner Placement' },
    sidebar: { enabled: false, format: 'rectangle', label: 'Sidebar Card Placement' },
    between_articles: { enabled: false, format: 'feed', label: 'Article Feed Spacer Placement' },
  },
};

export const SUPPORTED_AD_PLACEMENTS = Object.keys(MONETIZATION_CONFIG.placements);

/**
 * Returns whether monetization is globally enabled
 */
export function isMonetizationEnabled() {
  return Boolean(MONETIZATION_CONFIG.enabled);
}

/**
 * Retrieves configuration for a conceptual placement
 */
export function getAdPlacementConfig(placement) {
  if (!placement) return null;
  return MONETIZATION_CONFIG.placements[placement] || null;
}

/**
 * Checks if a specific conceptual placement is active
 */
export function isPlacementEnabled(placement) {
  if (!isMonetizationEnabled()) return false;
  const config = getAdPlacementConfig(placement);
  return Boolean(config && config.enabled);
}
