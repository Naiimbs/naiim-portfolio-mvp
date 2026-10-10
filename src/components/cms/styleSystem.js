/**
 * Intelligent Style System & Responsive CSS Inspector for CMS (Phase 18.6)
 *
 * Implements:
 * 1. Semantic Design Tokens (Spacing, Radius, Typography, Shadows, Colors)
 * 2. Box Model metadata and computation
 * 3. Responsive style inheritance (Desktop -> Tablet -> Mobile)
 * 4. Property resolution with inherited vs override state
 * 5. Scoped Custom CSS validation and generation (avoiding global pollution)
 * 6. Single unified responsive style model (NO second @media editor)
 */

export const SPACING_TOKENS = {
  none: { label: '0px', value: '0px' },
  xs: { label: 'XS (8px)', value: '8px' },
  sm: { label: 'SM (16px)', value: '16px' },
  md: { label: 'MD (24px)', value: '24px' },
  lg: { label: 'LG (32px)', value: '32px' },
  xl: { label: 'XL (48px)', value: '48px' },
  '2xl': { label: '2XL (64px)', value: '64px' },
  custom: { label: 'Custom', value: '' },
};

export const RADIUS_TOKENS = {
  none: { label: 'None (0px)', value: '0px' },
  sm: { label: 'SM (6px)', value: '6px' },
  md: { label: 'MD (12px)', value: '12px' },
  lg: { label: 'LG (18px)', value: '18px' },
  xl: { label: 'XL (24px)', value: '24px' },
  full: { label: 'Pill / Circle', value: '9999px' },
};

export const SHADOW_TOKENS = {
  none: { label: 'None', value: 'none' },
  sm: { label: 'Subtle', value: '0 2px 8px rgba(16, 36, 42, 0.04)' },
  md: { label: 'Medium', value: '0 8px 24px rgba(16, 36, 42, 0.08)' },
  lg: { label: 'Elevated', value: '0 18px 55px rgba(14, 42, 47, 0.08)' },
  xl: { label: 'Dramatic', value: '0 24px 64px rgba(14, 42, 47, 0.16)' },
};

export const FONT_FAMILY_TOKENS = {
  default: { label: 'Default (DM Sans)', value: '"DM Sans", sans-serif' },
  heading: { label: 'Heading (Space Grotesk)', value: '"Space Grotesk", sans-serif' },
  monospace: { label: 'Monospace (Courier / Code)', value: 'ui-monospace, monospace' },
};

export const FONT_WEIGHT_TOKENS = {
  normal: { label: 'Normal (400)', value: '400' },
  medium: { label: 'Medium (500)', value: '500' },
  semibold: { label: 'Semibold (600)', value: '600' },
  bold: { label: 'Bold (700)', value: '700' },
};

export const TEXT_ALIGN_TOKENS = {
  left: { label: 'Left', value: 'left', icon: 'bi-text-left' },
  center: { label: 'Center', value: 'center', icon: 'bi-text-center' },
  right: { label: 'Right', value: 'right', icon: 'bi-text-right' },
};

/**
 * Normalizes section style configuration
 */
export function normalizeStyleConfig(rawStyle = {}) {
  const style = typeof rawStyle === 'object' && rawStyle !== null ? rawStyle : {};

  return {
    desktop: {
      paddingTop: style.desktop?.paddingTop ?? style.paddingTop ?? 'md',
      paddingBottom: style.desktop?.paddingBottom ?? style.paddingBottom ?? 'md',
      paddingLeft: style.desktop?.paddingLeft ?? style.paddingLeft ?? 'none',
      paddingRight: style.desktop?.paddingRight ?? style.paddingRight ?? 'none',
      marginTop: style.desktop?.marginTop ?? style.marginTop ?? 'none',
      marginBottom: style.desktop?.marginBottom ?? style.marginBottom ?? 'none',
      backgroundColor: style.desktop?.backgroundColor ?? style.backgroundColor ?? '',
      textColor: style.desktop?.textColor ?? style.textColor ?? '',
      borderColor: style.desktop?.borderColor ?? style.borderColor ?? '',
      borderWidth: style.desktop?.borderWidth ?? style.borderWidth ?? '0px',
      borderStyle: style.desktop?.borderStyle ?? style.borderStyle ?? 'none',
      borderRadius: style.desktop?.borderRadius ?? style.borderRadius ?? 'none',
      boxShadow: style.desktop?.boxShadow ?? style.boxShadow ?? 'none',
      fontSize: style.desktop?.fontSize ?? style.fontSize ?? '',
      fontWeight: style.desktop?.fontWeight ?? style.fontWeight ?? '',
      fontFamily: style.desktop?.fontFamily ?? style.fontFamily ?? '',
      textAlign: style.desktop?.textAlign ?? style.textAlign ?? '',
      maxWidth: style.desktop?.maxWidth ?? style.maxWidth ?? '',
    },
    tablet: { ...(style.tablet || {}) },
    mobile: { ...(style.mobile || {}) },
    customCss: style.customCss || '',
  };
}

/**
 * Resolves a property value for a given viewport according to the inheritance chain:
 * Desktop -> Tablet -> Mobile
 *
 * @returns {{ value: any, isOverridden: boolean, inheritedFrom: string|null }}
 */
export function resolvePropertyValue(styleConfig, property, viewport = 'desktop') {
  const norm = normalizeStyleConfig(styleConfig);

  if (viewport === 'desktop') {
    const val = norm.desktop[property];
    return {
      value: val !== undefined && val !== '' ? val : null,
      isOverridden: false,
      inheritedFrom: null,
    };
  }

  if (viewport === 'tablet') {
    const tabletVal = norm.tablet[property];
    if (tabletVal !== undefined && tabletVal !== '') {
      return {
        value: tabletVal,
        isOverridden: true,
        inheritedFrom: null,
      };
    }
    const desktopVal = norm.desktop[property];
    return {
      value: desktopVal !== undefined && desktopVal !== '' ? desktopVal : null,
      isOverridden: false,
      inheritedFrom: 'desktop',
    };
  }

  if (viewport === 'mobile') {
    const mobileVal = norm.mobile[property];
    if (mobileVal !== undefined && mobileVal !== '') {
      return {
        value: mobileVal,
        isOverridden: true,
        inheritedFrom: null,
      };
    }
    // Check tablet first
    const tabletVal = norm.tablet[property];
    if (tabletVal !== undefined && tabletVal !== '') {
      return {
        value: tabletVal,
        isOverridden: false,
        inheritedFrom: 'tablet',
      };
    }
    // Fall back to desktop
    const desktopVal = norm.desktop[property];
    return {
      value: desktopVal !== undefined && desktopVal !== '' ? desktopVal : null,
      isOverridden: false,
      inheritedFrom: 'desktop',
    };
  }

  return { value: null, isOverridden: false, inheritedFrom: null };
}

/**
 * Sets a style property value for a specific viewport.
 */
export function setPropertyValue(styleConfig, property, value, viewport = 'desktop') {
  const norm = normalizeStyleConfig(styleConfig);
  const target = { ...norm[viewport], [property]: value };

  return {
    ...norm,
    [viewport]: target,
  };
}

/**
 * Resets a property override on tablet or mobile, reverting to inherited value.
 */
export function resetPropertyOverride(styleConfig, property, viewport) {
  if (viewport === 'desktop') return styleConfig;
  const norm = normalizeStyleConfig(styleConfig);
  const target = { ...norm[viewport] };
  delete target[property];

  return {
    ...norm,
    [viewport]: target,
  };
}

/**
 * Maps token values to CSS strings
 */
export function tokenToCssValue(tokenKey, tokenGroup) {
  if (!tokenKey) return '';
  if (tokenGroup[tokenKey]) {
    return tokenGroup[tokenKey].value;
  }
  return tokenKey; // If already a raw CSS value (e.g. "20px" or "#ff0000")
}

/**
 * Computes React inline style object for a given section and active viewport
 */
export function computeSectionStyleObject(styleConfig, viewport = 'desktop') {
  if (!styleConfig) return {};

  const getVal = (prop, group) => {
    const res = resolvePropertyValue(styleConfig, prop, viewport);
    if (!res.value || res.value === 'none') return undefined;
    return group ? tokenToCssValue(res.value, group) : res.value;
  };

  const styleObj = {};

  const pt = getVal('paddingTop', SPACING_TOKENS);
  const pb = getVal('paddingBottom', SPACING_TOKENS);
  const pl = getVal('paddingLeft', SPACING_TOKENS);
  const pr = getVal('paddingRight', SPACING_TOKENS);
  if (pt) styleObj.paddingTop = pt;
  if (pb) styleObj.paddingBottom = pb;
  if (pl) styleObj.paddingLeft = pl;
  if (pr) styleObj.paddingRight = pr;

  const mt = getVal('marginTop', SPACING_TOKENS);
  const mb = getVal('marginBottom', SPACING_TOKENS);
  if (mt) styleObj.marginTop = mt;
  if (mb) styleObj.marginBottom = mb;

  const bg = getVal('backgroundColor');
  if (bg) styleObj.backgroundColor = bg;

  const color = getVal('textColor');
  if (color) styleObj.color = color;

  const bc = getVal('borderColor');
  const bw = getVal('borderWidth');
  const bs = getVal('borderStyle');
  if (bc || (bw && bw !== '0px')) {
    styleObj.borderColor = bc || 'currentColor';
    styleObj.borderWidth = bw || '1px';
    styleObj.borderStyle = bs || 'solid';
  }

  const br = getVal('borderRadius', RADIUS_TOKENS);
  if (br) styleObj.borderRadius = br;

  const shadow = getVal('boxShadow', SHADOW_TOKENS);
  if (shadow) styleObj.boxShadow = shadow;

  const ta = getVal('textAlign');
  if (ta) styleObj.textAlign = ta;

  const fs = getVal('fontSize');
  if (fs) styleObj.fontSize = fs;

  const fw = getVal('fontWeight', FONT_WEIGHT_TOKENS);
  if (fw) styleObj.fontWeight = fw;

  const ff = getVal('fontFamily', FONT_FAMILY_TOKENS);
  if (ff) styleObj.fontFamily = ff;

  const mw = getVal('maxWidth');
  if (mw) styleObj.maxWidth = mw;

  return styleObj;
}

/**
 * Validates Custom CSS string:
 * - Checks for unclosed braces
 * - Warns against global tags (body, html, :root, nav, header, footer)
 * - Returns syntax errors and safety warnings
 */
export function validateCustomCss(rawCss = '') {
  const css = String(rawCss || '').trim();
  if (!css) return { valid: true, errors: [], warnings: [] };

  const errors = [];
  const warnings = [];

  // Check balanced braces
  let braceCount = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') braceCount++;
    if (css[i] === '}') braceCount--;
    if (braceCount < 0) {
      errors.push('Unexpected closing brace "}" without matching open brace.');
      break;
    }
  }
  if (braceCount > 0) {
    errors.push(`Unclosed open brace: ${braceCount} unclosed brace(s).`);
  }

  // Check for dangerous global root selectors
  const dangerousPatterns = [
    { pattern: /\bbody\b/i, name: 'body' },
    { pattern: /\bhtml\b/i, name: 'html' },
    { pattern: /:root\b/i, name: ':root' },
    { pattern: /\bnav\b/i, name: 'nav' },
    { pattern: /\bheader\b/i, name: 'header' },
    { pattern: /\bfooter\b/i, name: 'footer' },
  ];

  dangerousPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(css)) {
      warnings.push(`Selector references global element "${name}". Custom CSS should be scoped to this section.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Scopes custom CSS rules to a specific section ID
 *
 * e.g.
 * .my-title { color: red; }
 * becomes:
 * [data-section-id="sec_123"] .my-title { color: red; }
 */
export function scopeCustomCss(rawCss = '', sectionId) {
  const css = String(rawCss || '').trim();
  if (!css || !sectionId) return '';

  const scopePrefix = `[data-section-id="${sectionId}"]`;

  // Split by rules, but respect @media queries
  // If rule starts with @media, wrap inner selectors with scope
  try {
    const lines = css.split('\n');
    let inMedia = false;
    const transformed = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('@media')) {
        inMedia = true;
        return line;
      }
      if (trimmed === '}' && inMedia) {
        inMedia = false;
        return line;
      }
      // If line contains a selector before {
      if (trimmed.includes('{') && !trimmed.startsWith('@')) {
        const parts = line.split('{');
        const selector = parts[0].trim();
        const rest = parts.slice(1).join('{');
        // If selector is :scope or &, replace directly
        const scopedSelector = selector
          .split(',')
          .map((s) => {
            const sTrim = s.trim();
            if (sTrim === '&' || sTrim === ':scope') return scopePrefix;
            if (sTrim.startsWith('&')) return `${scopePrefix}${sTrim.slice(1)}`;
            return `${scopePrefix} ${sTrim}`;
          })
          .join(', ');

        return `${scopedSelector} {${rest}`;
      }
      return line;
    });

    return transformed.join('\n');
  } catch {
    // Fallback: return raw CSS if transformation fails
    return css;
  }
}
