import { THEME_DEFAULTS } from './themeDefaults';
import { THEME_TOKEN_NAMES } from './tokens';

/**
 * Validates a CSS color string.
 * Supports #hex, rgb(), rgba(), hsl(), hsla().
 */
export function isValidCssColor(color) {
  if (typeof color !== 'string') return false;
  const trimmed = color.trim();
  if (!trimmed) return false;
  // Hex color
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return true;
  }
  // rgb / rgba
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(trimmed)) {
    return true;
  }
  // hsl / hsla
  if (/^hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Validates CSS dimension/token length.
 */
export function isValidCssDimension(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return /^\d+(\.\d+)?(px|rem|em|%|vh|vw)$/.test(trimmed) || trimmed === '0';
}

/**
 * Converts hex to "r, g, b" triplet for Bootstrap rgb variables.
 */
export function hexToRgbTriplet(hex, fallback = '8, 127, 102') {
  if (!hex || typeof hex !== 'string') return fallback;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return fallback;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback;
  return `${r}, ${g}, ${b}`;
}

/**
 * Validates user-provided theme configuration against schema.
 * Replaces invalid values with authoritative defaults.
 */
export function validateAndNormalizeTheme(inputTheme = {}) {
  const merged = { ...THEME_DEFAULTS };
  const inputColors = inputTheme.colors || {};
  const validColors = { ...THEME_DEFAULTS.colors };

  for (const [key, defaultVal] of Object.entries(THEME_DEFAULTS.colors)) {
    if (inputColors[key] && isValidCssColor(inputColors[key])) {
      validColors[key] = inputColors[key].trim();
    } else {
      validColors[key] = defaultVal;
    }
  }
  merged.colors = validColors;

  const inputTypography = inputTheme.typography || {};
  merged.typography = {
    fontHeading: typeof inputTypography.fontHeading === 'string' && inputTypography.fontHeading.trim()
      ? inputTypography.fontHeading.trim()
      : THEME_DEFAULTS.typography.fontHeading,
    fontBody: typeof inputTypography.fontBody === 'string' && inputTypography.fontBody.trim()
      ? inputTypography.fontBody.trim()
      : THEME_DEFAULTS.typography.fontBody,
    baseFontSize: isValidCssDimension(inputTypography.baseFontSize)
      ? inputTypography.baseFontSize.trim()
      : THEME_DEFAULTS.typography.baseFontSize,
    lineHeight: inputTypography.lineHeight || THEME_DEFAULTS.typography.lineHeight,
  };

  const inputRadius = inputTheme.radius || {};
  merged.radius = {
    sm: isValidCssDimension(inputRadius.sm) ? inputRadius.sm : THEME_DEFAULTS.radius.sm,
    md: isValidCssDimension(inputRadius.md) ? inputRadius.md : THEME_DEFAULTS.radius.md,
    lg: isValidCssDimension(inputRadius.lg) ? inputRadius.lg : THEME_DEFAULTS.radius.lg,
    pill: isValidCssDimension(inputRadius.pill) ? inputRadius.pill : THEME_DEFAULTS.radius.pill,
  };

  const inputSpacing = inputTheme.spacing || {};
  merged.spacing = {
    baseUnit: isValidCssDimension(inputSpacing.baseUnit) ? inputSpacing.baseUnit : THEME_DEFAULTS.spacing.baseUnit,
  };

  const inputButtons = inputTheme.buttons || {};
  merged.buttons = {
    primaryBg: isValidCssColor(inputButtons.primaryBg) ? inputButtons.primaryBg : validColors.brandPrimary,
    primaryText: isValidCssColor(inputButtons.primaryText) ? inputButtons.primaryText : '#ffffff',
    primaryHoverBg: isValidCssColor(inputButtons.primaryHoverBg) ? inputButtons.primaryHoverBg : validColors.brandPrimaryHover,
    secondaryBg: isValidCssColor(inputButtons.secondaryBg) ? inputButtons.secondaryBg : validColors.brandSecondary,
    secondaryText: isValidCssColor(inputButtons.secondaryText) ? inputButtons.secondaryText : '#ffffff',
    borderRadius: isValidCssDimension(inputButtons.borderRadius) ? inputButtons.borderRadius : THEME_DEFAULTS.buttons.borderRadius,
  };

  return merged;
}

/**
 * Resolves normalized theme object into CSS variable map.
 */
export function resolveThemeCssVariables(themeConfig = {}) {
  const t = validateAndNormalizeTheme(themeConfig);
  const primaryRgb = hexToRgbTriplet(t.colors.brandPrimary, '8, 127, 102');

  return {
    [THEME_TOKEN_NAMES.BRAND_PRIMARY]: t.colors.brandPrimary,
    [THEME_TOKEN_NAMES.BRAND_PRIMARY_HOVER]: t.colors.brandPrimaryHover,
    [THEME_TOKEN_NAMES.BRAND_PRIMARY_ACTIVE]: t.colors.brandPrimaryActive,
    [THEME_TOKEN_NAMES.BRAND_SECONDARY]: t.colors.brandSecondary,
    [THEME_TOKEN_NAMES.ACCENT]: t.colors.accent,

    [THEME_TOKEN_NAMES.TEXT_PRIMARY]: t.colors.textPrimary,
    [THEME_TOKEN_NAMES.TEXT_SECONDARY]: t.colors.textSecondary,
    [THEME_TOKEN_NAMES.TEXT_MUTED]: t.colors.textMuted,
    [THEME_TOKEN_NAMES.TEXT_INVERSE]: t.colors.textInverse,

    [THEME_TOKEN_NAMES.SURFACE]: t.colors.surface,
    [THEME_TOKEN_NAMES.SURFACE_ELEVATED]: t.colors.surfaceElevated,
    [THEME_TOKEN_NAMES.SURFACE_MUTED]: t.colors.surfaceMuted,
    [THEME_TOKEN_NAMES.SURFACE_DARK]: t.colors.surfaceDark,

    [THEME_TOKEN_NAMES.BORDER]: t.colors.border,
    [THEME_TOKEN_NAMES.BORDER_STRONG]: t.colors.borderStrong,

    [THEME_TOKEN_NAMES.SUCCESS]: t.colors.success,
    [THEME_TOKEN_NAMES.WARNING]: t.colors.warning,
    [THEME_TOKEN_NAMES.DANGER]: t.colors.danger,
    [THEME_TOKEN_NAMES.INFO]: t.colors.info,

    [THEME_TOKEN_NAMES.FONT_HEADING]: t.typography.fontHeading,
    [THEME_TOKEN_NAMES.FONT_BODY]: t.typography.fontBody,

    [THEME_TOKEN_NAMES.RADIUS_SM]: t.radius.sm,
    [THEME_TOKEN_NAMES.RADIUS_MD]: t.radius.md,
    [THEME_TOKEN_NAMES.RADIUS_LG]: t.radius.lg,
    [THEME_TOKEN_NAMES.RADIUS_PILL]: t.radius.pill,

    [THEME_TOKEN_NAMES.SPACE_UNIT]: t.spacing.baseUnit,

    // Bootstrap 5 semantic alignment
    '--bs-primary': t.colors.brandPrimary,
    '--bs-primary-rgb': primaryRgb,
    '--bs-link-color': t.colors.brandPrimary,
    '--bs-link-hover-color': t.colors.brandPrimaryHover,
    '--bs-border-color': t.colors.border,
    '--bs-body-color': t.colors.textPrimary,
    '--bs-body-bg': t.colors.surfaceMuted,
    '--bs-heading-color': t.colors.textPrimary,
  };
}

/**
 * Applies the CSS variables to document.documentElement.
 */
export function applyThemeToDom(themeConfig = {}) {
  if (typeof document === 'undefined') return;
  const cssVars = resolveThemeCssVariables(themeConfig);
  const root = document.documentElement;
  for (const [key, val] of Object.entries(cssVars)) {
    root.style.setProperty(key, val);
  }
}
