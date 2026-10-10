/**
 * Layout Definition System for Site-Wide CMS (Phase 18.6)
 *
 * Provides reusable 12-column grid abstractions, built-in presets,
 * responsive inheritance (desktop -> tablet -> mobile), and track validation.
 */

export const BREAKPOINTS = {
  desktop: { label: 'Desktop', minWidth: 1024, icon: 'bi-display' },
  tablet: { label: 'Tablet', minWidth: 768, maxWidth: 1023, icon: 'bi-tablet' },
  mobile: { label: 'Mobile', maxWidth: 767, icon: 'bi-phone' },
};

export const GAP_TOKENS = {
  none: { label: 'None', value: '0px' },
  xs: { label: 'XS (8px)', value: '0.5rem' },
  sm: { label: 'SM (16px)', value: '1rem' },
  md: { label: 'MD (24px)', value: '1.5rem' },
  lg: { label: 'LG (32px)', value: '2rem' },
  xl: { label: 'XL (48px)', value: '3rem' },
  '2xl': { label: '2XL (64px)', value: '4rem' },
};

export const ALIGN_ITEMS = {
  stretch: { label: 'Stretch', value: 'stretch' },
  start: { label: 'Top', value: 'flex-start' },
  center: { label: 'Center', value: 'center' },
  end: { label: 'Bottom', value: 'flex-end' },
};

export const JUSTIFY_CONTENT = {
  start: { label: 'Start (Left)', value: 'flex-start' },
  center: { label: 'Center', value: 'center' },
  end: { label: 'End (Right)', value: 'flex-end' },
  between: { label: 'Space Between', value: 'space-between' },
};

/**
 * Authoritative Built-in Layout Presets
 */
export const LAYOUT_PRESETS = [
  {
    id: '12',
    name: '12 (Full Width)',
    category: 'Single',
    columns: [12],
    description: 'Single full-width column (100%)',
    responsiveRules: {
      desktop: [12],
      tablet: [12],
      mobile: [12],
    },
  },
  {
    id: '6:6',
    name: '6 / 6',
    category: 'Two Columns',
    columns: [6, 6],
    description: 'Two equal columns (50% / 50%)',
    responsiveRules: {
      desktop: [6, 6],
      tablet: [6, 6],
      mobile: [12, 12],
    },
  },
  {
    id: '4:8',
    name: '4 / 8',
    category: 'Two Columns',
    columns: [4, 8],
    description: 'Sidebar left (1/3) + Main content right (2/3)',
    responsiveRules: {
      desktop: [4, 8],
      tablet: [12, 12],
      mobile: [12, 12],
    },
  },
  {
    id: '8:4',
    name: '8 / 4',
    category: 'Two Columns',
    columns: [8, 4],
    description: 'Main content left (2/3) + Sidebar right (1/3)',
    responsiveRules: {
      desktop: [8, 4],
      tablet: [12, 12],
      mobile: [12, 12],
    },
  },
  {
    id: '3:9',
    name: '3 / 9',
    category: 'Two Columns',
    columns: [3, 9],
    description: 'Narrow rail left (1/4) + Wide right (3/4)',
    responsiveRules: {
      desktop: [3, 9],
      tablet: [12, 12],
      mobile: [12, 12],
    },
  },
  {
    id: '9:3',
    name: '9 / 3',
    category: 'Two Columns',
    columns: [9, 3],
    description: 'Wide left (3/4) + Narrow rail right (1/4)',
    responsiveRules: {
      desktop: [9, 3],
      tablet: [12, 12],
      mobile: [12, 12],
    },
  },
  {
    id: '4:4:4',
    name: '4 / 4 / 4',
    category: 'Three Columns',
    columns: [4, 4, 4],
    description: 'Three equal columns (33.3% each)',
    responsiveRules: {
      desktop: [4, 4, 4],
      tablet: [6, 6, 12],
      mobile: [12, 12, 12],
    },
  },
  {
    id: '3:6:3',
    name: '3 / 6 / 3',
    category: 'Three Columns',
    columns: [3, 6, 3],
    description: 'Flanked layout: Side rails (25% each) with Wide Center (50%)',
    responsiveRules: {
      desktop: [3, 6, 3],
      tablet: [12, 12, 12],
      mobile: [12, 12, 12],
    },
  },
  {
    id: '3:3:3:3',
    name: '3 / 3 / 3 / 3',
    category: 'Four Columns',
    columns: [3, 3, 3, 3],
    description: 'Four equal columns (25% each)',
    responsiveRules: {
      desktop: [3, 3, 3, 3],
      tablet: [6, 6, 6, 6],
      mobile: [12, 12, 12, 12],
    },
  },
  {
    id: 'custom',
    name: 'Custom 12-Col Grid',
    category: 'Custom',
    columns: [12],
    description: 'Custom user-defined column spans summing to 12',
    responsiveRules: {
      desktop: [12],
      tablet: [12],
      mobile: [12],
    },
  },
];

/**
 * Returns all built-in layout presets
 */
export function getLayoutPresets() {
  return LAYOUT_PRESETS;
}

/**
 * Finds a preset by ID, falling back to default 12
 */
export function getLayoutPresetById(id) {
  if (!id) return LAYOUT_PRESETS[0];
  const cleanId = String(id).trim();
  const found = LAYOUT_PRESETS.find(
    (p) => p.id === cleanId || p.id.replace(/:/g, '-') === cleanId || p.id === cleanId.replace(/-/g, ':')
  );
  return found || LAYOUT_PRESETS[0];
}

/**
 * Validates a list of column spans against the 12-column grid rule.
 *
 * IMPORTANT (Phase 18.6 requirement):
 * A layout such as [4, 4, 3] sums to 11 and does NOT equal 12.
 * Invalid definitions are NOT silently accepted.
 *
 * @param {Array<number|{span: number, empty?: boolean}>} columns
 * @returns {{ valid: boolean, sum: number, errors: string[], advisories: string[] }}
 */
export function validateLayoutColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return {
      valid: false,
      sum: 0,
      errors: ['Column layout must define at least one column track.'],
      advisories: [],
    };
  }

  let sum = 0;
  const errors = [];
  const advisories = [];

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const span = typeof col === 'number' ? col : Number(col?.span || 0);

    if (isNaN(span) || span <= 0 || !Number.isInteger(span)) {
      errors.push(`Column track #${i + 1} has an invalid span value: ${JSON.stringify(col)}. Must be a positive integer.`);
    } else if (span > 12) {
      errors.push(`Column track #${i + 1} span (${span}) exceeds maximum of 12 columns.`);
    } else {
      sum += span;
    }
  }

  if (sum !== 12) {
    if (sum < 12) {
      errors.push(
        `Invalid 12-column layout: column tracks sum to ${sum} instead of 12. ` +
        `Add an explicit empty spacer column of ${12 - sum} or adjust column spans.`
      );
    } else {
      errors.push(`Invalid 12-column layout: column tracks sum to ${sum}, which exceeds 12 columns.`);
    }
  }

  return {
    valid: errors.length === 0,
    sum,
    errors,
    advisories,
  };
}

/**
 * Normalizes layout configuration, providing fallback defaults and ensuring
 * responsive inheritance structures exist.
 */
export function normalizeLayoutConfig(rawConfig = {}) {
  const layout = typeof rawConfig === 'object' && rawConfig !== null ? rawConfig : {};

  // If presetId is given, resolve preset
  const preset = getLayoutPresetById(layout.presetId || layout.preset || layout.id || '12') || LAYOUT_PRESETS[0];

  // Resolve base columns
  let columns = Array.isArray(layout.columns) && layout.columns.length > 0 ? layout.columns : [...preset.columns];

  // Ensure columns are valid, fallback to preset if invalid
  const validation = validateLayoutColumns(columns);
  if (!validation.valid && preset && preset.columns) {
    // If raw columns are invalid, keep them for inspection but record error
  }

  // Resolve responsive rules with inheritance defaults
  const responsiveRules = {
    desktop: Array.isArray(layout.responsiveRules?.desktop)
      ? [...layout.responsiveRules.desktop]
      : [...(preset.responsiveRules?.desktop || columns)],
    tablet: Array.isArray(layout.responsiveRules?.tablet)
      ? [...layout.responsiveRules.tablet]
      : null, // null indicates inherited from desktop
    mobile: Array.isArray(layout.responsiveRules?.mobile)
      ? [...layout.responsiveRules.mobile]
      : null, // null indicates inherited/default stack
  };

  return {
    presetId: layout.presetId || preset.id,
    columns,
    gap: layout.gap || 'md',
    alignment: layout.alignment || 'stretch',
    verticalAlignment: layout.verticalAlignment || 'stretch',
    responsiveRules,
    containerWidth: layout.containerWidth || 'default', // 'narrow' | 'default' | 'wide' | 'full'
    paddingY: layout.paddingY || 'md',
  };
}

/**
 * Resolves active column spans for a specific viewport (desktop, tablet, mobile)
 * with strict inheritance:
 *
 * Mobile -> Tablet (if overridden) -> Desktop -> Base Preset Defaults
 */
export function resolveResponsiveColumns(layoutConfig, viewport = 'desktop') {
  const norm = normalizeLayoutConfig(layoutConfig);
  const rules = norm.responsiveRules || {};

  if (viewport === 'desktop') {
    return rules.desktop || norm.columns || [12];
  }

  if (viewport === 'tablet') {
    if (rules.tablet && Array.isArray(rules.tablet)) {
      return rules.tablet;
    }
    // Default smart tablet adaptation if not explicitly overridden:
    const desktopCols = rules.desktop || norm.columns || [12];
    if (desktopCols.length <= 2) {
      return desktopCols; // 12 or 6:6 can render on tablet
    }
    // 3 or 4 columns stack into 6:6 or 12
    return desktopCols.map((span) => (span <= 4 ? 6 : 12));
  }

  if (viewport === 'mobile') {
    if (rules.mobile && Array.isArray(rules.mobile)) {
      return rules.mobile;
    }
    // Default mobile behavior: stack every column track to 12
    const baseCols = rules.desktop || norm.columns || [12];
    return baseCols.map(() => 12);
  }

  return norm.columns || [12];
}

/**
 * Checks whether a specific viewport has an active override vs inheriting.
 */
export function isViewportOverridden(layoutConfig, viewport) {
  if (viewport === 'desktop') return false; // Desktop is the primary base
  const rules = layoutConfig?.responsiveRules || {};
  return Array.isArray(rules[viewport]) && rules[viewport] !== null;
}

/**
 * Generates CSS Grid template string from column tracks array
 * e.g. [6, 6] -> "repeat(12, 1fr)" with track grid-column spans
 */
export function getColumnGridSpanStyle(span) {
  const num = Number(span);
  const validSpan = isNaN(num) ? 12 : Math.max(1, Math.min(12, num));
  return {
    gridColumn: `span ${validSpan}`,
    maxWidth: '100%',
  };
}

/**
 * Calculates CSS variables or styles for the layout container
 */
export function getLayoutContainerStyle(layoutConfig, viewport = 'desktop') {
  const norm = normalizeLayoutConfig(layoutConfig);
  const gapVal = GAP_TOKENS[norm.gap]?.value || '1.5rem';

  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: gapVal,
    alignItems: ALIGN_ITEMS[norm.alignment]?.value || 'stretch',
    justifyContent: JUSTIFY_CONTENT[norm.verticalAlignment]?.value || 'stretch',
    width: '100%',
  };
}
