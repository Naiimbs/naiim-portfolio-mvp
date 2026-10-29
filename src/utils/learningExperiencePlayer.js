import { localizeConfig } from './localizeConfig.js';
import {
  normalizeLearningExperienceMetadata,
  normalizeLearningModule,
} from './learningExperience.js';

/**
 * Select, sort, localize, and normalize the published module sections for the learner UI.
 * Hidden sections are excluded unless an authorized author preview explicitly opts in.
 */
export function getLearningModules(sections, language = 'en', includeHidden = false) {
  return (Array.isArray(sections) ? sections : [])
    .map((section, originalIndex) => ({ section, originalIndex }))
    .filter(({ section }) => (
      section?.section_type === 'learning_module'
      && (includeHidden || section.is_visible !== false)
    ))
    .sort((left, right) => {
      const orderDifference = (Number(left.section.sort_order) || 0) - (Number(right.section.sort_order) || 0);
      return orderDifference || left.originalIndex - right.originalIndex;
    })
    .map(({ section }) => {
      const localizedConfig = localizeConfig(section.config || {}, language);
      const contentBlocks = (Array.isArray(localizedConfig.contentBlocks) ? localizedConfig.contentBlocks : [])
        .map((block) => localizeConfig(block, language));
      const localizedQuiz = localizedConfig.quiz && typeof localizedConfig.quiz === 'object' ? localizedConfig.quiz : {};
      const questions = (Array.isArray(localizedQuiz.questions) ? localizedQuiz.questions : []).map((question) => {
        const localizedQuestion = localizeConfig(question, language);
        const options = (Array.isArray(localizedQuestion.options) ? localizedQuestion.options : [])
          .map((option) => localizeConfig(option, language));
        return { ...localizedQuestion, options };
      });
      return {
        ...section,
        config: normalizeLearningModule({
          ...localizedConfig,
          contentBlocks,
          quiz: { ...localizedQuiz, questions },
        }),
      };
    });
}

/** Read localized learner-facing course metadata from the public/admin registry row. */
export function getLearningExperienceMetadata(registryEntry, language = 'en') {
  const metadata = registryEntry?.metadata?.learningExperience || {};
  return normalizeLearningExperienceMetadata(localizeConfig(metadata, language));
}

/** Return correct-answer feedback without exposing it until a learner checks a choice. */
export function getLearningQuizFeedback(question, selectedOptionId) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const selectedOption = options.find((option) => option.id === selectedOptionId) || null;
  const correctOption = options.find((option) => option.id === question?.correctOptionId) || null;
  return {
    isCorrect: Boolean(selectedOption && correctOption && selectedOption.id === correctOption.id),
    selectedOption,
    correctOption,
    explanation: typeof question?.explanation === 'string' ? question.explanation : '',
  };
}

/** A bounded integer percentage for session-only learner progress indicators. */
export function getLearningProgressPercent(total, completedCount) {
  const moduleCount = Number(total) || 0;
  if (moduleCount <= 0) return 0;
  const completed = Math.min(moduleCount, Math.max(0, Number(completedCount) || 0));
  return Math.round((completed / moduleCount) * 100);
}
