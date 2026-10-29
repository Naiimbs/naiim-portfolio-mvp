import assert from 'node:assert/strict';
import {
  getLearningExperienceMetadata,
  getLearningModules,
  getLearningProgressPercent,
  getLearningQuizFeedback,
} from '../src/utils/learningExperiencePlayer.js';

const sections = [
  {
    id: 'later',
    section_type: 'learning_module',
    sort_order: 20,
    is_visible: true,
    config: { title: 'Second module', objectives: [], contentBlocks: [], quiz: { questions: [] } },
  },
  {
    id: 'hidden',
    section_type: 'learning_module',
    sort_order: 0,
    is_visible: false,
    config: { title: 'Hidden module', objectives: [], contentBlocks: [], quiz: { questions: [] } },
  },
  {
    id: 'first',
    section_type: 'learning_module',
    sort_order: 10,
    is_visible: true,
    config: {
      title: 'First module',
      objectives: ['English objective'],
      contentBlocks: [{ id: 'lesson', type: 'instruction', title: 'Lesson', text: 'English body', i18n: { fr: { text: 'Texte français' } } }],
      quiz: {
        questions: [{
          id: 'q1',
          prompt: 'English question?',
          options: [
            { id: 'a1', text: 'Problem', i18n: { fr: { text: 'Problème' } } },
            { id: 'a2', text: 'Polish' },
          ],
          correctOptionId: 'a1',
          explanation: 'Validate the problem.',
          i18n: { fr: { prompt: 'Question française ?' } },
        }],
      },
      i18n: { fr: { title: 'Premier module', objectives: ['Objectif français'] } },
    },
  },
  { id: 'ordinary', section_type: 'hero', sort_order: 1, is_visible: true, config: {} },
];

const englishModules = getLearningModules(sections, 'en');
assert.deepEqual(englishModules.map((module) => module.id), ['first', 'later'], 'only visible learning modules are included in sort order');
assert.equal(englishModules[0].config.title, 'First module', 'English base content remains available');
assert.equal(getLearningModules(sections, 'en', true)[0].id, 'hidden', 'explicit preview mode can include hidden modules in order');

const frenchModules = getLearningModules(sections, 'fr');
assert.equal(frenchModules[0].config.title, 'Premier module', 'module-level translations are applied');
assert.equal(frenchModules[0].config.objectives[0], 'Objectif français');
assert.equal(frenchModules[0].config.contentBlocks[0].text, 'Texte français', 'content block translations are applied');
assert.equal(frenchModules[0].config.quiz.questions[0].prompt, 'Question française ?');
assert.equal(frenchModules[0].config.quiz.questions[0].options[0].text, 'Problème', 'quiz answer translations are applied');

const metadata = getLearningExperienceMetadata({
  metadata: {
    learningExperience: {
      description: 'English description',
      format: 'workshop',
      primaryLanguage: 'en',
      objectives: ['English objective'],
      intendedAudience: 'Builders',
      estimatedDuration: '2 hours',
      i18n: { fr: { description: 'Description française', title: 'Atelier' } },
    },
  },
}, 'fr');
assert.equal(metadata.description, 'Description française');
assert.equal(metadata.title, 'Atelier');
assert.equal(metadata.format, 'workshop');
assert.equal(metadata.objectives[0], 'English objective', 'untranslated fields fall back to the base language');

const question = englishModules[0].config.quiz.questions[0];
assert.deepEqual(getLearningQuizFeedback(question, 'a1'), {
  isCorrect: true,
  selectedOption: question.options[0],
  correctOption: question.options[0],
  explanation: 'Validate the problem.',
});
assert.equal(getLearningQuizFeedback(question, 'a2').isCorrect, false, 'incorrect answers receive explicit feedback');
assert.equal(getLearningQuizFeedback(question, 'missing').selectedOption, null, 'unknown options cannot be accepted');

assert.equal(getLearningProgressPercent(4, 0), 0);
assert.equal(getLearningProgressPercent(4, 1), 25);
assert.equal(getLearningProgressPercent(4, 9), 100, 'progress is clamped to the module count');
assert.equal(getLearningProgressPercent(0, 0), 0, 'empty courses avoid division errors');
assert.equal(getLearningProgressPercent(4, -2), 0, 'negative completion is clamped');

console.log('Learning-player tests passed: visible ordering, localization/fallback, quiz feedback, and bounded session progress.');
