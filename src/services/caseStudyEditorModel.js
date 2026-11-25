import { CORE_SECTION_TYPES } from './caseStudySchema.js';
import { CASE_STUDY_SECTION_REGISTRY } from '../components/case-study/SectionRegistry.js';

export const CASE_STUDY_MODULE_TYPES = Object.freeze(['editorial', 'image', 'project-module']);
export const CASE_STUDY_LOCALES = Object.freeze(['en', 'fr', 'ar']);

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const clone = (value) => {
  if (Array.isArray(value)) return value.map(clone);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
};

export function createCaseStudySectionId(type = 'section') {
  const token = String(type).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'section';
  if (typeof globalThis.crypto?.randomUUID === 'function') return `${token}-${globalThis.crypto.randomUUID()}`;
  return `${token}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createCaseStudySection(type, order = 0, id = createCaseStudySectionId(type)) {
  if (!CASE_STUDY_SECTION_REGISTRY[type]) return null;
  return {
    id,
    type,
    category: CORE_SECTION_TYPES.includes(type) ? 'core' : 'module',
    enabled: true,
    order,
    content: { en: {}, fr: {}, ar: {} },
  };
}

export function getAvailableCaseStudySectionTypes(sections = []) {
  const existingCoreTypes = new Set(
    (Array.isArray(sections) ? sections : [])
      .filter((section) => section?.category !== 'module' && CORE_SECTION_TYPES.includes(section?.type))
      .map((section) => section.type),
  );
  return [
    ...CORE_SECTION_TYPES.filter((type) => !existingCoreTypes.has(type)),
    ...CASE_STUDY_MODULE_TYPES,
  ];
}

export function updateCaseStudySection(sections, sectionId, patch) {
  return (Array.isArray(sections) ? sections : []).map((section) => (
    section.id === sectionId ? { ...section, ...clone(patch) } : section
  ));
}

export function updateCaseStudySectionContent(sections, sectionId, locale, field, value) {
  if (!CASE_STUDY_LOCALES.includes(locale)) return Array.isArray(sections) ? sections : [];
  return (Array.isArray(sections) ? sections : []).map((section) => {
    if (section.id !== sectionId) return section;
    const content = isRecord(section.content) ? section.content : {};
    return {
      ...section,
      content: {
        ...content,
        [locale]: {
          ...(isRecord(content[locale]) ? content[locale] : {}),
          [field]: value,
        },
      },
    };
  });
}

export function moveCaseStudySection(sections, sectionId, targetIndex) {
  const next = Array.isArray(sections) ? [...sections] : [];
  const sourceIndex = next.findIndex((section) => section.id === sectionId);
  if (sourceIndex < 0 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= next.length) return next;
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next.map((section, order) => ({ ...section, order }));
}

export function removeCaseStudySection(sections, sectionId) {
  return (Array.isArray(sections) ? sections : [])
    .filter((section) => section.id !== sectionId)
    .map((section, order) => ({ ...section, order }));
}
