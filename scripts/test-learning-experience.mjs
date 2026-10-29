import assert from 'node:assert/strict';
import {
  createLearningContentBlock,
  createLearningModuleConfig,
  createLearningQuizQuestion,
  isSafeLearningResourceUrl,
  mergeLearningExperienceMetadata,
  moveLearningItem,
  normalizeLearningModule,
  validateLearningExperienceMetadata,
  validateLearningModule,
} from '../src/utils/learningExperience.js';

const emptyModule = createLearningModuleConfig();
assert.equal(validateLearningModule(emptyModule).valid, false, 'an untitled module is not publishable');
assert.ok(validateLearningModule(emptyModule).errors.some((message) => message.includes('Module title')));
assert.ok(validateLearningModule(emptyModule).errors.some((message) => message.includes('instructional content block')));

const moduleConfig = createLearningModuleConfig();
moduleConfig.title = 'Think, design, build';
moduleConfig.description = 'Move from a user problem to a testable MVP.';
moduleConfig.objectives = ['Frame a real user problem', 'Build a testable first version'];
const lesson = createLearningContentBlock('instruction');
lesson.title = 'Start with the problem';
lesson.text = 'Interview users before choosing a solution.';
const resource = createLearningContentBlock('resource');
resource.title = 'Workshop template';
resource.url = '/resources/workshop-template.pdf';
moduleConfig.contentBlocks = [lesson, resource];

const question = createLearningQuizQuestion();
question.prompt = 'What should be validated first?';
question.options[0].text = 'The user problem';
question.options[1].text = 'The final visual polish';
question.correctOptionId = question.options[0].id;
question.explanation = 'A useful MVP tests whether the problem and value proposition are real.';
question.reviewNote = 'Preserved extension field';
question.options[0].source = 'author-authored';
moduleConfig.quiz.questions = [question];

assert.equal(validateLearningModule(moduleConfig).valid, true, 'complete authored module and practice QCM validate');
assert.notEqual(question.options[0].id, question.options[1].id, 'answer options get unique stable IDs');

const reordered = moveLearningItem(moduleConfig.contentBlocks, 1, 0);
assert.deepEqual(reordered.map((block) => block.id), [resource.id, lesson.id], 'ordered instructional blocks can be moved without losing identity');
assert.deepEqual(moveLearningItem(reordered, -1, 0), reordered, 'out-of-range moves are safe no-ops');

const serialized = JSON.parse(JSON.stringify({ ...moduleConfig, contentBlocks: reordered }));
const restored = normalizeLearningModule(serialized);
assert.deepEqual(restored, serialized, 'module and nested QCM data round-trip through JSON without loss');
assert.deepEqual(restored.contentBlocks.map((block) => block.id), [resource.id, lesson.id], 'block order and IDs survive reload normalization');
assert.equal(restored.quiz.questions[0].id, question.id, 'question ID survives reload normalization');
assert.deepEqual(restored.quiz.questions[0].options.map((option) => option.id), question.options.map((option) => option.id), 'answer option IDs survive reload normalization');
assert.equal(restored.quiz.questions[0].reviewNote, 'Preserved extension field', 'future question metadata survives normalization');
assert.equal(restored.quiz.questions[0].options[0].source, 'author-authored', 'future answer metadata survives normalization');

const incompleteQuiz = createLearningModuleConfig();
incompleteQuiz.title = 'Quiz validation';
incompleteQuiz.quiz.questions = [createLearningQuizQuestion()];
const quizErrors = validateLearningModule(incompleteQuiz).errors.join(' ');
assert.match(quizErrors, /enter the question/i);
assert.match(quizErrors, /at least two answer options/i);
assert.match(quizErrors, /add an explanation/i);

assert.equal(isSafeLearningResourceUrl('https://example.test/handout.pdf'), true);
assert.equal(isSafeLearningResourceUrl('/resources/handout.pdf'), true);
assert.equal(isSafeLearningResourceUrl('javascript:alert(1)'), false);
assert.equal(isSafeLearningResourceUrl('//example.test/file'), false);
const unsafeResourceModule = createLearningModuleConfig();
unsafeResourceModule.title = 'Unsafe resource example';
const unsafeResource = createLearningContentBlock('resource');
unsafeResource.title = 'Unsafe link';
unsafeResource.url = 'javascript:alert(1)';
unsafeResourceModule.contentBlocks = [unsafeResource];
assert.match(validateLearningModule(unsafeResourceModule).errors.join(' '), /valid HTTPS or site-relative resource URL/i);

const originalRegistryMetadata = {
  pageId: 'page-123',
  template: 'learning-experience',
  seo_title: 'Existing SEO',
  custom: { keep: true },
  learningExperience: { i18n: { fr: { title: 'Titre français' } }, futureField: 'preserve' },
};
const mergedRegistryMetadata = mergeLearningExperienceMetadata(originalRegistryMetadata, {
  description: 'An approved description',
  format: 'workshop',
  primaryLanguage: 'en',
  objectives: ['Build a useful MVP'],
  intendedAudience: 'Design students',
  estimatedDuration: 'One day',
});
assert.equal(mergedRegistryMetadata.pageId, 'page-123');
assert.equal(mergedRegistryMetadata.seo_title, 'Existing SEO');
assert.deepEqual(mergedRegistryMetadata.custom, { keep: true });
assert.equal(mergedRegistryMetadata.learningExperience.format, 'workshop');
assert.equal(mergedRegistryMetadata.learningExperience.i18n.fr.title, 'Titre français', 'future localization data is preserved');
assert.equal(mergedRegistryMetadata.learningExperience.futureField, 'preserve', 'future overview metadata is preserved');
assert.equal(validateLearningExperienceMetadata(mergedRegistryMetadata.learningExperience).valid, true);
assert.equal(validateLearningExperienceMetadata({}).valid, false, 'incomplete overview metadata is blocked from publishing');

console.log('Learning-experience tests passed: validation, stable nested IDs, content ordering, JSON round-trip, safe resource URLs, and registry metadata preservation.');
