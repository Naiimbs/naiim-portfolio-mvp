import assert from 'node:assert/strict';
import {
  CASE_STUDY_SCHEMA_VERSION,
  normalizeCaseStudyToV3,
  getVisibleCaseStudySections,
} from '../src/services/caseStudySchema.js';
import { resolveCaseStudySections } from '../src/components/case-study/SectionResolver.js';

const standard = {
  version: 1,
  type: 'standard',
  hero: { title: 'A project', lead: 'Overview' },
  challenge: { title: 'Problem', copy: 'Context' },
  contribution: { title: 'Thinking', items: ['Research'] },
  evidence: { title: 'Experience', gallery: [] },
  technology: { title: 'Stack', tags: ['React'] },
  sectionOrder: ['technology', 'challenge', 'contribution', 'evidence'],
};

const normalizedStandard = normalizeCaseStudyToV3(standard, { slug: 'sample' });
assert.equal(normalizedStandard.version, CASE_STUDY_SCHEMA_VERSION);
assert.equal(normalizedStandard.slug, 'sample');
assert.equal(normalizedStandard.legacy.hero.title, 'A project', 'legacy payload must be preserved');
assert.deepEqual(
  normalizedStandard.sections.map((section) => section.id),
  ['system-technology', 'problem', 'product-thinking', 'experience-design', 'project-overview'],
  'legacy section order is respected; overview remains available',
);

const custom = {
  version: 2,
  type: 'custom',
  title: 'WINNI',
  nativeSections: { problem: { title: 'Problem' }, privacy: { title: 'Privacy' } },
  nativeSectionOrder: ['privacy', 'problem'],
  nativeSectionVisibility: { problem: false },
  translations: { fr: { nativeSections: { privacy: { title: 'Confidentialité' } } } },
  customSections: [{ id: 'editorial-1', type: 'text', title: 'Extra', is_visible: true }],
};

const normalizedCustom = normalizeCaseStudyToV3(custom, { slug: 'winni' });
assert.deepEqual(normalizedCustom.sections.map((section) => section.id), ['privacy', 'problem', 'editorial-1']);
assert.equal(normalizedCustom.sections[1].enabled, false);
assert.equal(normalizedCustom.sections[0].content.fr.title, 'Confidentialité');
assert.equal(normalizedCustom.legacy.nativeSections.privacy.title, 'Privacy');

const localized = getVisibleCaseStudySections(normalizedCustom, 'fr');
assert.deepEqual(localized.map((section) => section.resolvedContent.title), ['Confidentialité', 'Extra']);

const resolved = resolveCaseStudySections(custom, { slug: 'winni', locale: 'en' });
assert.deepEqual(resolved.sections.map((section) => section.id), ['privacy', 'editorial-1']);
assert.equal(resolved.unsupported.length, 0);

const v3 = normalizeCaseStudyToV3({
  version: 3,
  template: 'standard',
  sections: [{ id: 'custom', type: 'unknown-module', enabled: true, order: 2, content: { en: { title: 'Keep' } } }],
});
assert.equal(v3.sections.length, 1, 'unknown V3 sections are preserved by normalization');
assert.equal(resolveCaseStudySections(v3).unsupported.length, 1, 'unknown section types are not rendered');

assert.equal(normalizeCaseStudyToV3(null), null);
console.log('Unified Case Study foundation tests passed.');
