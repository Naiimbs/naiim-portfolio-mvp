/**
 * Default Theme configuration adhering to Naïm Bsili design identity.
 * Primary green: #087f66, Dark: #10242a, Light background: #f8f9f6, Accent: #eab52e.
 */

export const THEME_DEFAULTS = {
  colors: {
    brandPrimary: '#087f66',
    brandPrimaryHover: '#075b4b',
    brandPrimaryActive: '#06483b',
    brandSecondary: '#10242a',
    accent: '#eab52e',

    textPrimary: '#10242a',
    textSecondary: '#42545a',
    textMuted: '#718187',
    textInverse: '#ffffff',

    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceMuted: '#f8f9f6',
    surfaceDark: '#10242a',

    border: '#dfe7e4',
    borderStrong: '#aebdb9',

    success: '#087f66',
    warning: '#eab52e',
    danger: '#d32f2f',
    info: '#087f66',
  },
  typography: {
    fontHeading: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontBody: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseFontSize: '16px',
    lineHeight: '1.6',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    pill: '9999px',
  },
  spacing: {
    baseUnit: '4px',
  },
  shadows: {
    sm: '0 2px 8px rgba(16, 36, 42, 0.04)',
    md: '0 8px 24px rgba(16, 36, 42, 0.08)',
    lg: '0 18px 55px rgba(14, 42, 47, 0.08)',
  },
  buttons: {
    primaryBg: '#087f66',
    primaryText: '#ffffff',
    primaryHoverBg: '#075b4b',
    secondaryBg: '#10242a',
    secondaryText: '#ffffff',
    borderRadius: '9999px',
  },
};
