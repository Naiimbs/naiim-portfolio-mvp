/**
 * Resolve CMS-authored fields for bespoke case-study sections.
 * English values live in nativeSections; FR/AR overrides live under translations.
 */
export function resolveCustomSectionContent(caseStudy = {}, sectionId, locale = 'en') {
  const base = caseStudy.nativeSections?.[sectionId] || {};
  const localized = caseStudy.translations?.[locale]?.nativeSections?.[sectionId] || {};
  return { ...base, ...localized };
}
