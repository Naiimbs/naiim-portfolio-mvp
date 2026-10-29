export const LEARNING_EXPERIENCE_TEMPLATE = 'learning-experience';
export const LEARNING_EXPERIENCE_METADATA_KEY = 'learningExperience';
export const LEARNING_FORMATS = ['course', 'workshop'];
export const LEARNING_LANGUAGES = ['en', 'fr', 'ar'];

export const LEARNING_CONTENT_BLOCK_TYPES = [
  { value: 'instruction', label: 'Instruction' },
  { value: 'example', label: 'Example' },
  { value: 'activity', label: 'Practical exercise' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'code', label: 'Code / text block' },
  { value: 'resource', label: 'Resource link' },
  { value: 'recap', label: 'Recap' },
];

let fallbackId = 0;

export function createLearningId(prefix = 'item') {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;
  fallbackId += 1;
  return `${prefix}_${Date.now().toString(36)}_${fallbackId.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function moveLearningItem(items, fromIndex, toIndex) {
  if (!Array.isArray(items)) return [];
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return [...items];
  const reordered = [...items];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered;
}

export function createLearningContentBlock(type = 'instruction') {
  return {
    id: createLearningId('block'),
    type,
    title: '',
    text: '',
    url: '',
  };
}

export function createLearningQuizQuestion() {
  const firstOptionId = createLearningId('option');
  const secondOptionId = createLearningId('option');
  return {
    id: createLearningId('question'),
    prompt: '',
    options: [
      { id: firstOptionId, text: '' },
      { id: secondOptionId, text: '' },
    ],
    correctOptionId: firstOptionId,
    explanation: '',
  };
}

export function createLearningModuleConfig() {
  return {
    title: '',
    description: '',
    objectives: [],
    contentBlocks: [],
    quiz: { questions: [] },
  };
}

export function normalizeLearningModule(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const contentBlocks = Array.isArray(source.contentBlocks) ? source.contentBlocks : [];
  const questions = Array.isArray(source.quiz?.questions) ? source.quiz.questions : [];

  return {
    ...createLearningModuleConfig(),
    ...source,
    title: typeof source.title === 'string' ? source.title : '',
    description: typeof source.description === 'string' ? source.description : '',
    objectives: Array.isArray(source.objectives) ? source.objectives.filter((item) => typeof item === 'string') : [],
    contentBlocks: contentBlocks.map((block) => ({
      ...createLearningContentBlock(block?.type || 'instruction'),
      ...(block && typeof block === 'object' ? block : {}),
      id: block?.id || createLearningId('block'),
    })),
    quiz: {
      ...(source.quiz && typeof source.quiz === 'object' ? source.quiz : {}),
      questions: questions.map((question) => {
        const normalizedOptions = (Array.isArray(question?.options) ? question.options : []).map((option) => ({
          ...(option && typeof option === 'object' ? option : {}),
          id: option?.id || createLearningId('option'),
          text: typeof option?.text === 'string' ? option.text : '',
        }));
        return {
          ...(question && typeof question === 'object' ? question : {}),
          id: question?.id || createLearningId('question'),
          prompt: typeof question?.prompt === 'string' ? question.prompt : '',
          options: normalizedOptions,
          correctOptionId: question?.correctOptionId || normalizedOptions[0]?.id || '',
          explanation: typeof question?.explanation === 'string' ? question.explanation : '',
        };
      }),
    },
  };
}

export function isSafeLearningResourceUrl(value) {
  const url = String(value || '').trim();
  if (!url) return false;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }
  return /^\/(?!\/)[^\s]*$/.test(url);
}

export function validateLearningModule(raw = {}) {
  const config = normalizeLearningModule(raw);
  const errors = [];
  if (!config.title.trim()) errors.push('Module title is required.');
  if (config.contentBlocks.length === 0) errors.push('Add at least one instructional content block.');

  config.contentBlocks.forEach((block, index) => {
    const label = `Content block ${index + 1}`;
    if (!LEARNING_CONTENT_BLOCK_TYPES.some((item) => item.value === block.type)) {
      errors.push(`${label} has an unsupported type.`);
      return;
    }
    if (block.type === 'resource') {
      if (!block.title.trim()) errors.push(`${label}: add a resource label.`);
      if (!isSafeLearningResourceUrl(block.url)) errors.push(`${label}: enter a valid HTTPS or site-relative resource URL.`);
    } else if (!block.text.trim()) {
      errors.push(`${label}: add the content before saving or publishing.`);
    }
  });

  config.quiz.questions.forEach((question, questionIndex) => {
    const label = `Quiz question ${questionIndex + 1}`;
    if (!question.prompt.trim()) errors.push(`${label}: enter the question.`,);
    const usableOptions = question.options.filter((option) => option.text.trim());
    if (usableOptions.length < 2) errors.push(`${label}: provide at least two answer options.`);
    if (!usableOptions.some((option) => option.id === question.correctOptionId)) {
      errors.push(`${label}: select one of the non-empty answer options as correct.`);
    }
    if (!question.explanation.trim()) errors.push(`${label}: add an explanation for the answer.`);
  });

  return { valid: errors.length === 0, errors, advisories: [] };
}

export function normalizeLearningExperienceMetadata(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    ...source,
    description: typeof source.description === 'string' ? source.description : '',
    format: LEARNING_FORMATS.includes(source.format) ? source.format : 'workshop',
    primaryLanguage: LEARNING_LANGUAGES.includes(source.primaryLanguage) ? source.primaryLanguage : 'en',
    objectives: Array.isArray(source.objectives) ? source.objectives.filter((item) => typeof item === 'string') : [],
    intendedAudience: typeof source.intendedAudience === 'string' ? source.intendedAudience : '',
    estimatedDuration: typeof source.estimatedDuration === 'string' ? source.estimatedDuration : '',
  };
}

export function mergeLearningExperienceMetadata(registryMetadata = {}, learningMetadata = {}) {
  const existing = registryMetadata && typeof registryMetadata === 'object' ? registryMetadata : {};
  const currentLearningMetadata = existing[LEARNING_EXPERIENCE_METADATA_KEY] && typeof existing[LEARNING_EXPERIENCE_METADATA_KEY] === 'object'
    ? existing[LEARNING_EXPERIENCE_METADATA_KEY]
    : {};
  return {
    ...existing,
    [LEARNING_EXPERIENCE_METADATA_KEY]: normalizeLearningExperienceMetadata({
      ...currentLearningMetadata,
      ...learningMetadata,
    }),
  };
}

export function validateLearningExperienceMetadata(raw = {}) {
  const metadata = normalizeLearningExperienceMetadata(raw);
  const errors = [];
  if (!metadata.description.trim()) errors.push('Add a short description.');
  if (!LEARNING_FORMATS.includes(metadata.format)) errors.push('Choose course or workshop as the format.');
  if (!LEARNING_LANGUAGES.includes(metadata.primaryLanguage)) errors.push('Choose a supported primary language.');
  if (!metadata.objectives.some((item) => item.trim())) errors.push('Add at least one learning objective.');
  if (!metadata.intendedAudience.trim()) errors.push('Describe the intended audience.');
  if (!metadata.estimatedDuration.trim()) errors.push('Add an estimated duration.');
  return { valid: errors.length === 0, errors, metadata };
}
