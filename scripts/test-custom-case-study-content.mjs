import assert from 'node:assert/strict';
import { resolveCustomSectionContent } from '../src/services/customCaseStudyContent.js';

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

console.log('Custom case-study content tests passed.');
