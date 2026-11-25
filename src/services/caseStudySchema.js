/**
 * Unified Case Study schema foundation.
 *
 * This is a read-time adapter: it preserves the original V1/V2 payload and
 * projects it into one ordered section collection. It does not write to
 * Supabase or mutate the source object.
 */
export const CASE_STUDY_SCHEMA_VERSION = 3;

export const CORE_SECTION_TYPES = Object.freeze([
  'project-overview',
  'problem',
  'product-thinking',
  'experience-design',
  'system-technology',
  'building-product',
  'product-experience',
  'outcomes-learnings',
]);

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const clone = (value) => {
  if (Array.isArray(value)) return value.map(clone);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
};

const localeContent = (content, translations, locale) => {
  const base = isRecord(content) ? content : {};
  const localized = isRecord(translations?.[locale]) ? translations[locale] : {};
  return { ...clone(base), ...clone(localized) };
};

const makeSection = ({ id, type, category = 'core', order, enabled = true, content = {}, translations = {} }) => ({
  id,
  type,
  category,
  order,
  enabled,
  content: {
    en: clone(content),
    fr: localeContent(content, translations, 'fr'),
    ar: localeContent(content, translations, 'ar'),
  },
});

function standardSections(source, i18n = {}) {
  const hero = source.hero || {};
  const standard = [
    makeSection({
      id: 'project-overview',
      type: 'project-overview',
      order: 0,
      content: hero,
      translations: {
        fr: {
          ...(i18n.fr?.title ? { title: i18n.fr.title } : {}),
          ...(i18n.fr?.description || i18n.fr?.subtitle ? { lead: i18n.fr.description || i18n.fr.subtitle } : {}),
          ...(i18n.fr?.caseStudy?.hero || {}),
        },
        ar: {
          ...(i18n.ar?.title ? { title: i18n.ar.title } : {}),
          ...(i18n.ar?.description || i18n.ar?.subtitle ? { lead: i18n.ar.description || i18n.ar.subtitle } : {}),
          ...(i18n.ar?.caseStudy?.hero || {}),
        },
      },
    }),
    makeSection({ id: 'problem', type: 'problem', order: 1, content: source.challenge || {}, translations: { fr: i18n.fr?.caseStudy?.challenge || {}, ar: i18n.ar?.caseStudy?.challenge || {} } }),
    makeSection({ id: 'product-thinking', type: 'product-thinking', order: 2, content: source.contribution || {}, translations: { fr: i18n.fr?.caseStudy?.contribution || {}, ar: i18n.ar?.caseStudy?.contribution || {} } }),
    makeSection({ id: 'experience-design', type: 'experience-design', order: 3, content: source.evidence || {}, translations: { fr: i18n.fr?.caseStudy?.evidence || {}, ar: i18n.ar?.caseStudy?.evidence || {} } }),
    makeSection({ id: 'system-technology', type: 'system-technology', order: 4, content: source.technology || {}, translations: { fr: i18n.fr?.caseStudy?.technology || {}, ar: i18n.ar?.caseStudy?.technology || {} } }),
  ];

  const requestedOrder = Array.isArray(source.sectionOrder) ? source.sectionOrder : [];
  const rank = new Map(requestedOrder.map((id, index) => [id, index + 1]));
  const legacyIdBySection = {
    'project-overview': 'hero',
    problem: 'challenge',
    'product-thinking': 'contribution',
    'experience-design': 'evidence',
    'system-technology': 'technology',
  };
  return standard
    .map((section) => ({
      ...section,
      enabled: source[section.id === 'project-overview' ? 'hero' : section.id === 'problem' ? 'challenge' : section.id === 'product-thinking' ? 'contribution' : section.id === 'experience-design' ? 'evidence' : 'technology']?.is_visible !== false,
      order: section.id === 'project-overview' ? 0 : rank.has(section.id) ? rank.get(section.id) : rank.has(legacyIdBySection[section.id]) ? rank.get(legacyIdBySection[section.id]) : section.order,
    }))
    .sort((a, b) => a.order - b.order);
}

function customSections(source) {
  const result = [];
  const nativeIds = Array.isArray(source.nativeSectionOrder) ? source.nativeSectionOrder : Object.keys(source.nativeSections || {});
  const seen = new Set();

  nativeIds.forEach((id, index) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    result.push(makeSection({
      id,
      type: 'project-module',
      category: 'module',
      order: index,
      enabled: source.nativeSectionVisibility?.[id] !== false,
      content: source.nativeSections?.[id] || {},
      translations: {
        fr: source.translations?.fr?.nativeSections?.[id] || {},
        ar: source.translations?.ar?.nativeSections?.[id] || {},
      },
    }));
  });

  (Array.isArray(source.customSections) ? source.customSections : []).forEach((section, index) => {
    if (!section || typeof section !== 'object') return;
    result.push(makeSection({
      id: section.id || `editorial-${index + 1}`,
      type: section.type === 'image' ? 'image' : 'editorial',
      category: 'module',
      order: result.length,
      enabled: section.is_visible !== false,
      content: section,
      translations: section.translations || {},
    }));
  });

  return result;
}

/**
 * Convert legacy Standard V1 and Custom V1/V2 case studies to the V3
 * in-memory contract. Unknown/source-specific fields remain available under
 * legacy so migrations can be incremental and lossless.
 */
export function normalizeCaseStudyToV3(input, { slug = '', i18n = {} } = {}) {
  if (!isRecord(input)) return null;
  if (input.version === CASE_STUDY_SCHEMA_VERSION) {
    const legacyLocaleKey = {
      'project-overview': 'hero',
      problem: 'challenge',
      'product-thinking': 'contribution',
      'experience-design': 'evidence',
      'system-technology': 'technology',
    };
    return {
      ...clone(input),
      version: CASE_STUDY_SCHEMA_VERSION,
      slug: input.slug || slug,
      sections: (Array.isArray(input.sections) ? input.sections : [])
        .filter((section) => isRecord(section) && typeof section.id === 'string' && typeof section.type === 'string')
        .map((section, index) => {
          const cloned = clone(section);
          const content = isRecord(cloned.content) ? cloned.content : {};
          const legacyKey = legacyLocaleKey[cloned.type];
          const nextContent = { ...content };
          if (legacyKey) {
            for (const locale of ['fr', 'ar']) {
              const legacyTranslation = i18n?.[locale]?.caseStudy?.[legacyKey] || {};
              if (!isRecord(legacyTranslation)) continue;
              const localeFallback = cloned.type === 'project-overview' ? {
                ...(i18n?.[locale]?.title ? { title: i18n[locale].title } : {}),
                ...(i18n?.[locale]?.description || i18n?.[locale]?.subtitle ? { lead: i18n[locale].description || i18n[locale].subtitle } : {}),
              } : {};
              nextContent[locale] = {
                ...localeFallback,
                ...legacyTranslation,
                ...(isRecord(content[locale]) ? content[locale] : {}),
              };
            }
          }
          return {
            ...cloned,
            category: cloned.category === 'module' ? 'module' : 'core',
            enabled: cloned.enabled !== false,
            order: Number.isFinite(cloned.order) ? cloned.order : index,
            content: nextContent,
          };
        })
        .sort((a, b) => a.order - b.order),
    };
  }

  const sections = input.type === 'custom' ? customSections(input) : standardSections(input, i18n);
  return {
    version: CASE_STUDY_SCHEMA_VERSION,
    template: 'standard',
    slug,
    metadata: {
      title: input.title || input.hero?.title || '',
      subtitle: input.subtitle || input.hero?.lead || '',
      cover: input.hero?.image || '',
    },
    sections: sections.sort((a, b) => a.order - b.order),
    legacy: clone(input),
  };
}

export function getVisibleCaseStudySections(caseStudy, locale = 'en') {
  if (!Array.isArray(caseStudy?.sections)) return [];
  const safeLocale = ['en', 'fr', 'ar'].includes(locale) ? locale : 'en';
  return caseStudy.sections
    .filter((section) => section?.enabled !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((section) => ({
      ...section,
      resolvedContent: {
        ...(isRecord(section.content?.en) ? section.content.en : {}),
        ...(isRecord(section.content?.[safeLocale]) ? section.content[safeLocale] : {}),
      },
    }));
}
