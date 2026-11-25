import { getVisibleCaseStudySections, normalizeCaseStudyToV3 } from '../../services/caseStudySchema.js';
import { isSupportedCaseStudySection } from './SectionRegistry.js';

/**
 * Resolve a legacy or V3 case study into safe, ordered renderer descriptors.
 * Unknown section types are retained in the source payload but not rendered.
 */
export function resolveCaseStudySections(caseStudy, { slug = '', locale = 'en' } = {}) {
  const normalized = normalizeCaseStudyToV3(caseStudy, { slug });
  if (!normalized) return { caseStudy: null, sections: [], unsupported: [] };

  const visible = getVisibleCaseStudySections(normalized, locale);
  const supported = visible.filter((section) => isSupportedCaseStudySection(section.type));
  const unsupported = visible.filter((section) => !isSupportedCaseStudySection(section.type));

  return { caseStudy: normalized, sections: supported, unsupported };
}
