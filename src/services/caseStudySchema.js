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

function standardSections(source) {
  const hero = source.hero || {};
  const standard = [
    makeSection({ id: 'project-overview', type: 'project-overview', order: 0, content: hero }),
    makeSection({ id: 'problem', type: 'problem', order: 1, content: source.challenge || {} }),
    makeSection({ id: 'product-thinking', type: 'product-thinking', order: 2, content: source.contribution || {} }),
    makeSection({ id: 'experience-design', type: 'experience-design', order: 3, content: source.evidence || {} }),
    makeSection({ id: 'system-technology', type: 'system-technology', order: 4, content: source.technology || {} }),
  ];

  const requestedOrder = Array.isArray(source.sectionOrder) ? source.sectionOrder : [];
  const legacyOrderIds = ['hero', 'challenge', 'contribution', 'evidence', 'technology'];
  const rank = new Map(requestedOrder.map((id, index) => [id, index]));
  const legacyRank = new Map(requestedOrder.map((id, index) => [id, index]));
  return standard
    .map((section) => ({
      ...section,
      enabled: source[section.id === 'project-overview' ? 'hero' : section.id === 'problem' ? 'challenge' : section.id === 'product-thinking' ? 'contribution' : section.id === 'experience-design' ? 'evidence' : 'technology']?.is_visible !== false,
      order: rank.has(section.id) ? rank.get(section.id) : legacyRank.has(legacyOrderIds[['project-overview', 'problem', 'product-thinking', 'experience-design', 'system-technology'].indexOf(section.id)]) ? legacyRank.get(legacyOrderIds[['project-overview', 'problem', 'product-thinking', 'experience-design', 'system-technology'].indexOf(section.id)]) : section.order,
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
export function normalizeCaseStudyToV3(input, { slug = '' } = {}) {
  if (!isRecord(input)) return null;
  if (input.version === CASE_STUDY_SCHEMA_VERSION && Array.isArray(input.sections)) {
    return {
      ...clone(input),
      version: CASE_STUDY_SCHEMA_VERSION,
      slug: input.slug || slug,
      sections: input.sections
        .filter((section) => isRecord(section) && typeof section.id === 'string' && typeof section.type === 'string')
        .map((section, index) => ({
          category: section.category === 'module' ? 'module' : 'core',
          enabled: section.enabled !== false,
          order: Number.isFinite(section.order) ? section.order : index,
          content: isRecord(section.content) ? clone(section.content) : {},
          ...clone(section),
        }))
        .sort((a, b) => a.order - b.order),
    };
  }

  const sections = input.type === 'custom' ? customSections(input) : standardSections(input);
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
      resolvedContent: section.content?.[safeLocale] || section.content?.en || {},
    }));
}
