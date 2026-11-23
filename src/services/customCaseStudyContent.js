/**
 * Resolve CMS-authored fields for bespoke case-study sections.
 * English values live in nativeSections; FR/AR overrides live under translations.
 */
export function resolveCustomSectionContent(caseStudy = {}, sectionId, locale = 'en') {
  const base = caseStudy.nativeSections?.[sectionId] || {};
  const localized = caseStudy.translations?.[locale]?.nativeSections?.[sectionId] || {};
  return { ...base, ...localized };
}

/**
 * Merge a legacy custom-case-study migration with the current Registry payload.
 * A forced migration may refresh legacy metadata, but must never erase CMS-authored
 * sections, native content, ordering, visibility, or locale overrides.
 */
export function preserveCustomCaseStudyCmsContent(migratedCaseStudy, existingCaseStudy = {}) {
  if (!migratedCaseStudy || migratedCaseStudy.type !== 'custom') return migratedCaseStudy;

  const existing = existingCaseStudy && typeof existingCaseStudy === 'object'
    ? existingCaseStudy
    : {};

  return {
    ...migratedCaseStudy,
    ...existing,
    version: Math.max(2, Number(migratedCaseStudy.version) || 1, Number(existing.version) || 1),
    type: 'custom',
    title: existing.title || migratedCaseStudy.title || '',
    subtitle: existing.subtitle ?? migratedCaseStudy.subtitle ?? '',
    customComponent: existing.customComponent || migratedCaseStudy.customComponent || null,
    customSections: Array.isArray(existing.customSections) ? existing.customSections : [],
    nativeSections: existing.nativeSections && typeof existing.nativeSections === 'object' && !Array.isArray(existing.nativeSections)
      ? existing.nativeSections
      : {},
    nativeSectionOrder: Array.isArray(existing.nativeSectionOrder) ? existing.nativeSectionOrder : [],
    nativeSectionVisibility: existing.nativeSectionVisibility && typeof existing.nativeSectionVisibility === 'object' && !Array.isArray(existing.nativeSectionVisibility)
      ? existing.nativeSectionVisibility
      : {},
    translations: existing.translations && typeof existing.translations === 'object' && !Array.isArray(existing.translations)
      ? existing.translations
      : {},
  };
}

/**
 * A case study at version 1 or newer is already migrated.
 * Force is the only mode allowed to refresh legacy-derived content.
 */
export function shouldSkipCaseStudyMigration(caseStudy, force = false) {
  return !force && Number(caseStudy?.version) >= 1;
}
