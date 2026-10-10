import React from 'react';
import { isMonetizationEnabled, isPlacementEnabled } from '../../services/monetizationConfig';

/**
 * AdSlot Component (Phase 19.1)
 *
 * Future-ready abstraction for content monetization.
 * Strictly disabled by default. Renders strictly null (nothing) while monetization is disabled.
 * Decoupled from third-party vendor scripts to prevent vendor lock-in and keep portfolio clean.
 */
export default function AdSlot({ placement = 'article_bottom', className = '' }) {
  // Authoritative kill-switch: strictly returns null while disabled
  if (!isMonetizationEnabled() || !isPlacementEnabled(placement)) {
    return null;
  }

  // Future monetization rendering (when explicitly enabled in a future phase)
  return null;
}
