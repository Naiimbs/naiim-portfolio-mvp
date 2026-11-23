import assert from 'node:assert/strict';
import { resolveCustomSectionContent, preserveCustomCaseStudyCmsContent } from '../src/services/customCaseStudyContent.js';
import { parseCaseStudyArray } from '../src/utils/caseStudyContent.js';
import { shouldSkipCaseStudyMigration } from '../src/services/customCaseStudyContent.js';

const caseStudy = {
  nativeSections: {
    problem: { title: 'Default title', lead: 'Default lead' },
    privacy: { title: 'Privacy title' },
  },
  translations: {
    fr: {
      nativeSections: {
        problem: { title: 'Titre français' },
      },
    },
    ar: {
      nativeSections: {
        problem: { title: 'عنوان عربي', lead: 'مقدمة عربية' },
      },
    },
  },
};

assert.deepEqual(resolveCustomSectionContent(caseStudy, 'problem', 'en'), {
  title: 'Default title',
  lead: 'Default lead',
});
assert.deepEqual(resolveCustomSectionContent(caseStudy, 'problem', 'fr'), {
  title: 'Titre français',
  lead: 'Default lead',
});
assert.deepEqual(resolveCustomSectionContent(caseStudy, 'problem', 'ar'), {
  title: 'عنوان عربي',
  lead: 'مقدمة عربية',
});
assert.deepEqual(resolveCustomSectionContent(caseStudy, 'privacy', 'fr'), {
  title: 'Privacy title',
});
assert.deepEqual(resolveCustomSectionContent(caseStudy, 'missing', 'en'), {});

const migratedCustom = {
  version: 1,
  type: 'custom',
  title: 'Legacy title',
  subtitle: 'Legacy subtitle',
  customComponent: 'WinniCaseStudy',
};
const savedCustom = {
  version: 2,
  type: 'custom',
  title: 'CMS title',
  customSections: [{ id: 'custom-1', type: 'text', body: 'Saved block' }],
  nativeSections: { idea: { storyBody: 'Saved native copy' } },
  nativeSectionOrder: ['idea', 'problem'],
  nativeSectionVisibility: { problem: false },
  translations: { fr: { title: 'Titre CMS', nativeSections: { idea: { storyBody: 'Texte sauvegardé' } } } },
};
const preservedCustom = preserveCustomCaseStudyCmsContent(migratedCustom, savedCustom);
assert.equal(preservedCustom.version, 2);
assert.equal(preservedCustom.title, 'CMS title');
assert.equal(preservedCustom.subtitle, 'Legacy subtitle');
assert.deepEqual(preservedCustom.customSections, savedCustom.customSections);
assert.deepEqual(preservedCustom.nativeSections, savedCustom.nativeSections);
assert.deepEqual(preservedCustom.nativeSectionOrder, savedCustom.nativeSectionOrder);
assert.deepEqual(preservedCustom.nativeSectionVisibility, savedCustom.nativeSectionVisibility);
assert.deepEqual(preservedCustom.translations, savedCustom.translations);
assert.equal(preserveCustomCaseStudyCmsContent(migratedCustom, null).customComponent, 'WinniCaseStudy');

assert.equal(shouldSkipCaseStudyMigration(null), false);
assert.equal(shouldSkipCaseStudyMigration({ version: 1 }), true);
assert.equal(shouldSkipCaseStudyMigration({ version: 2 }), true);
assert.equal(shouldSkipCaseStudyMigration({ version: 2 }, true), false);
assert.equal(shouldSkipCaseStudyMigration({ version: 0 }), false);

assert.deepEqual(parseCaseStudyArray('[{"title":"A"}]', []), [{ title: 'A' }]);
assert.deepEqual(parseCaseStudyArray('not valid JSON', [{ title: 'fallback' }]), [{ title: 'fallback' }]);
assert.deepEqual(parseCaseStudyArray('{"not":"an array"}', ['fallback']), ['fallback']);
assert.deepEqual(parseCaseStudyArray([{ title: 'direct' }], []), [{ title: 'direct' }]);

console.log('Custom case-study content tests passed.');
