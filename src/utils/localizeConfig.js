/**
 * Phase 3 — CMS content localization engine.
 *
 * A section's translatable content lives in its `config` JSONB. Translations
 * are stored under `config.i18n = { fr: {...}, ar: {...} }`, holding only the
 * fields that differ from the default (English) config. At render time we
 * deep-merge the active language's overrides on top of the base config, so a
 * partially-translated section still falls back to the base for any field the
 * translator left out.
 *
 * Arrays replace wholesale (e.g. a translated `titleLines` or `steps` array
 * replaces the base array rather than merging element by element).
 */

const DEFAULT_LANG = 'en';

function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(over)) return over;
  if (typeof over === 'object' && base && typeof base === 'object' && !Array.isArray(base)) {
    const out = { ...base };
    for (const key of Object.keys(over)) {
      out[key] = deepMerge(base[key], over[key]);
    }
    return out;
  }
  return over;
}

/**
 * Return the config localized for `lang`. For the default language (or when no
 * translation exists) the base config is returned with the `i18n` key stripped.
 */
export function localizeConfig(config, lang) {
  if (!config || typeof config !== 'object') return config || {};
  const { i18n: translations, ...base } = config;
  const l = lang || DEFAULT_LANG;
  if (l === DEFAULT_LANG || !translations || typeof translations !== 'object' || !translations[l]) {
    return base;
  }
  return deepMerge(base, translations[l]);
}

/** List the languages (other than the default) that have any translation. */
export function translatedLanguages(config) {
  const translations = config?.i18n;
  if (!translations || typeof translations !== 'object') return [];
  return Object.keys(translations).filter((l) => l !== DEFAULT_LANG && translations[l] && Object.keys(translations[l]).length > 0);
}
