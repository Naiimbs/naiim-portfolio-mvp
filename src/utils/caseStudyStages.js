export const FDE_STAGE_TYPES = [
  'problem-context',
  'discovery-investigation',
  'solution-design',
  'build-integration',
  'validation-iteration',
  'outcome-learnings',
  'custom',
];

const STAGE_LABELS = {
  en: {
    'problem-context': 'Problem & Context',
    'discovery-investigation': 'Discovery & Investigation',
    'solution-design': 'Solution Design',
    'build-integration': 'Build & Integration',
    'validation-iteration': 'Validation & Iteration',
    'outcome-learnings': 'Outcome & Learnings',
    custom: 'Custom stage',
  },
  fr: {
    'problem-context': 'Problème et contexte',
    'discovery-investigation': 'Découverte et investigation',
    'solution-design': 'Conception de la solution',
    'build-integration': 'Construction et intégration',
    'validation-iteration': 'Validation et itération',
    'outcome-learnings': 'Résultats et enseignements',
    custom: 'Étape personnalisée',
  },
  ar: {
    'problem-context': 'المشكلة والسياق',
    'discovery-investigation': 'الاكتشاف والتحقيق',
    'solution-design': 'تصميم الحل',
    'build-integration': 'البناء والتكامل',
    'validation-iteration': 'التحقق والتكرار',
    'outcome-learnings': 'النتائج والدروس المستفادة',
    custom: 'مرحلة مخصصة',
  },
};

const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const idPart = (value) => clean(String(value ?? '')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'stage';

export function getFdeStageLabel(stageType, language = 'en') {
  const lang = String(language || 'en').slice(0, 2).toLowerCase();
  return STAGE_LABELS[lang]?.[stageType] || STAGE_LABELS.en[stageType] || '';
}

export function createStageId(stageType = 'custom') {
  const prefix = `stage-${idPart(stageType)}`;
  if (typeof globalThis.crypto?.randomUUID === 'function') return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createFdeStage(stageType, index = 0, id = createStageId(stageType)) {
  const type = FDE_STAGE_TYPES.includes(stageType) ? stageType : 'custom';
  return {
    id,
    stageType: type,
    step: String(index + 1).padStart(2, '0'),
    title: type === 'custom' ? '' : getFdeStageLabel(type, 'en'),
    desc: '',
    is_visible: true,
    evidence: '',
    technologies: [],
    media: [],
    links: [],
  };
}

/**
 * Add stable IDs to legacy process items. Once saved, IDs travel with stages
 * through reorder operations and are used to bind locale content safely.
 */
export function normalizeProcessStages(process) {
  if (!Array.isArray(process)) return [];
  const used = new Set();
  return process.map((rawStage, index) => {
    const stage = rawStage && typeof rawStage === 'object' ? rawStage : {};
    const legacyKey = idPart(stage.step || `position-${index + 1}`);
    const baseId = clean(stage.id) || `legacy-${legacyKey}-${index + 1}`;
    let id = baseId;
    let suffix = 2;
    while (used.has(id)) id = `${baseId}-${suffix++}`;
    used.add(id);

    const stageType = FDE_STAGE_TYPES.includes(stage.stageType) ? stage.stageType : '';
    return {
      ...stage,
      id,
      ...(stageType ? { stageType } : {}),
      is_visible: stage.is_visible !== false,
      evidence: typeof stage.evidence === 'string' ? stage.evidence : '',
      technologies: Array.isArray(stage.technologies) ? stage.technologies.filter((item) => typeof item === 'string') : [],
      media: Array.isArray(stage.media) ? stage.media.filter((item) => item && typeof item === 'object') : [],
      links: Array.isArray(stage.links) ? stage.links.filter((item) => item && typeof item === 'object') : [],
    };
  });
}

/**
 * Upgrade legacy index-aligned translation arrays to stable stage IDs in memory.
 * Existing translation strings are preserved; no stage copy is generated.
 */
export function normalizeProcessTranslations(translations, processStages) {
  const normalizedStages = normalizeProcessStages(processStages);
  const next = { ...(translations || {}) };
  for (const [language, locale] of Object.entries(next)) {
    const process = locale?.caseStudy?.contribution?.process;
    if (!Array.isArray(process)) continue;
    const hasStableIds = process.some((stage) => clean(stage?.id));
    const mapped = process.map((translatedStage, index) => {
      const entry = translatedStage && typeof translatedStage === 'object' ? translatedStage : {};
      const matchedById = clean(entry.id) ? normalizedStages.find((stage) => stage.id === entry.id) : null;
      const sourceStage = matchedById || (!hasStableIds ? normalizedStages[index] : null);
      return sourceStage ? { ...entry, id: sourceStage.id } : entry;
    });
    next[language] = {
      ...locale,
      caseStudy: {
        ...locale.caseStudy,
        contribution: {
          ...locale.caseStudy?.contribution,
          process: mapped,
        },
      },
    };
  }
  return next;
}

export function getStageTranslationForId(translatedStages, stageId, legacyIndex = -1) {
  if (!Array.isArray(translatedStages)) return {};
  const stableMatch = translatedStages.find((stage) => clean(stage?.id) === stageId);
  if (stableMatch) return stableMatch;
  const hasStableIds = translatedStages.some((stage) => clean(stage?.id));
  if (!hasStableIds && legacyIndex >= 0) return translatedStages[legacyIndex] || {};
  return {};
}

/** Only localized copy is merged; visibility, URLs, evidence references and technology facts stay sourced. */
export function mergeLocalizedProcessStages(processStages, translatedStages) {
  const source = normalizeProcessStages(processStages);
  return source.map((stage, index) => {
    const translation = getStageTranslationForId(translatedStages, stage.id, index);
    return {
      ...stage,
      title: clean(translation.title) || stage.title || '',
      desc: clean(translation.desc) || stage.desc || '',
    };
  });
}

export function getMissingStageTranslationFields(stage, translation = {}) {
  const missing = [];
  const sourceTitle = clean(stage?.title) || getFdeStageLabel(stage?.stageType, 'en');
  if (sourceTitle && !clean(translation?.title)) missing.push('title');
  if (clean(stage?.desc) && !clean(translation?.desc)) missing.push('description');
  return missing;
}

export function shouldRenderProcessStage(stage) {
  if (!stage || stage.is_visible === false) return false;
  return Boolean(
    clean(stage.desc)
    || clean(stage.evidence)
    || (Array.isArray(stage.technologies) && stage.technologies.some((item) => clean(item)))
    || (Array.isArray(stage.media) && stage.media.some((item) => clean(item?.url || item?.image)))
    || (Array.isArray(stage.links) && stage.links.some((item) => clean(item?.url)))
  );
}

export function safeCaseStudyUrl(value) {
  const url = clean(value);
  if (!url || /[\u0000-\u001f<>"']/.test(url)) return '';
  if (/^https:\/\//i.test(url)) return url;
  if (/^\/(?!\/)/.test(url)) return url;
  return '';
}
