/**
 * Allowlisted section registry for the unified Case Study renderer.
 * CMS data selects a registered type; it never supplies a component path.
 */
export const CASE_STUDY_SECTION_REGISTRY = Object.freeze({
  'project-overview': { label: 'Project Overview', category: 'core' },
  problem: { label: 'The Problem', category: 'core' },
  'product-thinking': { label: 'Product Thinking', category: 'core' },
  'experience-design': { label: 'Experience Design', category: 'core' },
  'system-technology': { label: 'System & Technology', category: 'core' },
  'building-product': { label: 'Building the Product', category: 'core' },
  'product-experience': { label: 'The Experience', category: 'core' },
  'outcomes-learnings': { label: 'Outcomes & Learnings', category: 'core' },
  editorial: { label: 'Editorial Block', category: 'module' },
  image: { label: 'Image Block', category: 'module' },
  'project-module': { label: 'Project-specific Module', category: 'module' },
});

export function getCaseStudySectionDefinition(type) {
  return CASE_STUDY_SECTION_REGISTRY[type] || null;
}

export function isSupportedCaseStudySection(type) {
  return Boolean(getCaseStudySectionDefinition(type));
}
