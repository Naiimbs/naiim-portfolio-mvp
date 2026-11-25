/**
 * caseStudyRegistryMigration.js
 *
 * Deterministic normalization and migration utilities for Case Study content
 * transitioning into the authoritative Supabase Content Registry (metadata.caseStudy).
 */

import { resolveAsset } from './assetRegistry.js';
import { updateContentRegistryEntry, getAdminContentRegistry } from './contentRegistry.js';
import legacyCaseStudiesData from '../data/caseStudiesData.json';
import { normalizeProcessStages } from '../utils/caseStudyStages.js';
import { shouldSkipCaseStudyMigration } from './customCaseStudyContent.js';
import { preserveCustomCaseStudyCmsContent } from './customCaseStudyContent.js';
import { normalizeCaseStudyToV3 } from './caseStudySchema.js';

export const LEGACY_CASE_STUDIES_DATA = legacyCaseStudiesData;


const cleanFileName = (val) => {
  if (!val || typeof val !== 'string') return null;
  return val.split('?')[0].split('#')[0].replace(/^.*[\\/]/, '');
};

/**
 * Transforms legacy case study data into a normalized Registry caseStudy object.
 * Pure, deterministic, and preserves all sections, copy, arrays, and asset keys.
 */
export function migrateCaseStudyToRegistry(legacyData) {
  if (!legacyData) return null;

  if (legacyData.type === 'custom') {
    return {
      version: 1,
      type: 'custom',
      title: legacyData.title || '',
      subtitle: legacyData.subtitle || '',
      customComponent:
        legacyData.slug === 'winni'
          ? 'WinniCaseStudy'
          : legacyData.slug === 'assestini'
          ? 'AssestiniCaseStudy'
          : null,
    };
  }

  const { hero, challenge, contribution, evidence, technology } = legacyData;

  return {
    version: 1,
    type: 'standard',
    hero: {
      eyebrow: hero?.eyebrow || '',
      title: hero?.title || '',
      lead: hero?.lead || '',
      metaChips: Array.isArray(hero?.metaChips) ? [...hero.metaChips] : [],
      image: cleanFileName(hero?.image),
      imageAlt: hero?.imageAlt || '',
      caption: hero?.caption || null,
    },
    challenge: {
      eyebrow: challenge?.eyebrow || '',
      title: challenge?.title || '',
      copy: challenge?.copy || '',
      role: challenge?.role || '',
      context: challenge?.context || '',
    },
    contribution: {
      eyebrow: contribution?.eyebrow || '',
      title: contribution?.title || '',
      items: Array.isArray(contribution?.items) ? [...contribution.items] : [],
      process: normalizeProcessStages(contribution?.process).map((stage) => ({
        ...stage,
        media: stage.media.map((item) => ({
          ...item,
          url: item.url ? (resolveAsset(item.url) || item.url) : '',
        })),
      })),
      ...(contribution?.codeExample && typeof contribution.codeExample === 'object'
        ? { codeExample: { ...contribution.codeExample } }
        : {}),
    },
    evidence: {
      eyebrow: evidence?.eyebrow || '',
      title: evidence?.title || '',
      image: cleanFileName(evidence?.image),
      imageAlt: evidence?.imageAlt || '',
      caption: evidence?.caption || null,
      gallery: Array.isArray(evidence?.gallery)
        ? evidence.gallery.map((g) => ({
            image: cleanFileName(g?.image),
            imageAlt: g?.imageAlt || '',
            caption: g?.caption || null,
          }))
        : [],
    },
    technology: {
      eyebrow: technology?.eyebrow || '',
      title: technology?.title || '',
      tags: Array.isArray(technology?.tags) ? [...technology.tags] : [],
    },
  };
}

/**
 * Validates a caseStudy object for completeness and schema compliance.
 */
export function validateCaseStudyContent(caseStudy) {
  const errors = [];
  const warnings = [];

  if (!caseStudy || typeof caseStudy !== 'object') {
    return {
      valid: false,
      errors: ['Case study content is missing or not an object.'],
      warnings: [],
    };
  }

  if (![1, 2, 3].includes(caseStudy.version)) {
    errors.push(`Invalid or missing case study version: ${caseStudy.version} (expected 1, 2 or 3).`);
  }

  if (caseStudy.version === 3) {
    if (!Array.isArray(caseStudy.sections)) {
      errors.push('V3 case study sections must be an array.');
    } else {
      const ids = new Set();
      caseStudy.sections.forEach((section, index) => {
        if (!section || typeof section !== 'object' || typeof section.id !== 'string' || !section.id.trim()) {
          errors.push(`V3 section #${index + 1} is missing a stable id.`);
        } else if (ids.has(section.id)) {
          errors.push(`V3 section id "${section.id}" is duplicated.`);
        } else {
          ids.add(section.id);
        }
        if (!section || typeof section.type !== 'string' || !section.type.trim()) {
          errors.push(`V3 section #${index + 1} is missing a section type.`);
        }
        if (section && section.content !== undefined && (typeof section.content !== 'object' || section.content === null || Array.isArray(section.content))) {
          errors.push(`V3 section #${index + 1} content must be a locale object.`);
        }
      });
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  if (caseStudy.type !== 'standard' && caseStudy.type !== 'custom') {
    errors.push(`Invalid case study type: ${caseStudy.type} (expected 'standard' or 'custom').`);
  }

  if (caseStudy.type === 'custom') {
    if (!caseStudy.title) warnings.push('Custom case study has no title.');
    if (Array.isArray(caseStudy.customSections)) {
      caseStudy.customSections.forEach((section, index) => {
        if (section?.type === 'image' && !section.image) {
          warnings.push(`Custom section #${index + 1} is an image section without an image source.`);
        }
        if (section?.type === 'image' && section.image && !section.alt?.trim()) {
          warnings.push(`Custom section #${index + 1} is missing image alt text.`);
        }
      });
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Standard case study validation
  const { hero, challenge, contribution, evidence, technology } = caseStudy;

  if (!hero || !hero.title?.trim()) {
    errors.push('Hero section is missing a title.');
  }
  if (!hero || !hero.lead?.trim()) {
    warnings.push('Hero section has no lead text.');
  }

  if (!challenge || !challenge.title?.trim() || !challenge.copy?.trim()) {
    errors.push('Challenge section is missing title or copy.');
  }

  if (!contribution || !contribution.title?.trim()) {
    errors.push('Contribution section is missing a title.');
  }
  if (!contribution || !Array.isArray(contribution.items) || contribution.items.length === 0) {
    warnings.push('Contribution section has no item bullets.');
  }

  if (!evidence || !evidence.title?.trim()) {
    warnings.push('Evidence section has no title.');
  }
  if (evidence?.image && !evidence?.imageAlt?.trim()) {
    warnings.push('Evidence main image is missing alt text.');
  }
  if (Array.isArray(evidence?.gallery)) {
    evidence.gallery.forEach((g, idx) => {
      if (g.image && !g.imageAlt?.trim()) {
        warnings.push(`Evidence gallery item #${idx + 1} is missing alt text.`);
      }
    });
  }

  if (!technology || !Array.isArray(technology.tags) || technology.tags.length === 0) {
    warnings.push('Technology section has no tags.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Normalizes case-study content from Registry metadata for public rendering.
 * Resolves static/bundled image asset strings into active Vite URLs.
 */
const V3_MEDIA_FIELDS = new Set(['image', 'src', 'cover', 'heroImage', 'estimatorImage', 'wbsImage', 'dashboardImage', 'closingImage']);

function normalizeV3SectionMedia(section) {
  const content = section?.content && typeof section.content === 'object' ? section.content : {};
  const normalizedContent = Object.fromEntries(Object.entries(content).map(([locale, raw]) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [locale, raw];
    const next = { ...raw };
    for (const field of V3_MEDIA_FIELDS) {
      if (typeof next[field] === 'string' && next[field].trim()) next[field] = resolveAsset(next[field]) || next[field];
    }
    if (Array.isArray(next.gallery)) {
      next.gallery = next.gallery.map((item) => (
        item && typeof item === 'object' && typeof item.image === 'string'
          ? { ...item, image: resolveAsset(item.image) || item.image }
          : item
      ));
    }
    if (Array.isArray(next.process)) {
      next.process = next.process.map((stage) => ({
        ...stage,
        media: Array.isArray(stage?.media) ? stage.media.map((item) => ({
          ...item,
          url: typeof item?.url === 'string' ? (resolveAsset(item.url) || item.url) : item?.url,
          image: typeof item?.image === 'string' ? (resolveAsset(item.image) || item.image) : item?.image,
        })) : stage?.media,
      }));
    }
    return [locale, next];
  }));
  return { ...section, content: normalizedContent };
}

export function normalizeCaseStudyContent(caseStudy, slug = '', i18n = {}) {
  if (!caseStudy) return null;

  // V3 is already a unified section collection. Preserve its metadata and section payloads
  // instead of projecting it back into the legacy Standard V1 shape.
  if (caseStudy.version === 3) {
    const normalized = normalizeCaseStudyToV3(caseStudy, { slug, i18n });
    return {
      ...normalized,
      slug,
      type: 'standard',
      version: 3,
      metadata: {
        ...(normalized.metadata && typeof normalized.metadata === 'object' ? normalized.metadata : {}),
        cover: typeof normalized.metadata?.cover === 'string' ? (resolveAsset(normalized.metadata.cover) || normalized.metadata.cover) : normalized.metadata?.cover,
      },
      sections: normalized.sections.map(normalizeV3SectionMedia),
    };
  }

  if (caseStudy.type === 'custom') {
    return {
      slug,
      type: 'custom',
      title: caseStudy.title || '',
      subtitle: caseStudy.subtitle || '',
      customComponent: caseStudy.customComponent || null,
      customSections: Array.isArray(caseStudy.customSections) ? caseStudy.customSections : [],
      nativeSections: caseStudy.nativeSections && typeof caseStudy.nativeSections === 'object' ? caseStudy.nativeSections : {},
      nativeSectionOrder: Array.isArray(caseStudy.nativeSectionOrder) ? caseStudy.nativeSectionOrder : [],
      nativeSectionVisibility: caseStudy.nativeSectionVisibility && typeof caseStudy.nativeSectionVisibility === 'object' ? caseStudy.nativeSectionVisibility : {},
      translations: caseStudy.translations && typeof caseStudy.translations === 'object' ? caseStudy.translations : {},
      version: caseStudy.version || 1,
    };
  }

  const hero = caseStudy.hero || {};
  const evidence = caseStudy.evidence || {};

  return {
    slug,
    type: 'standard',
    version: caseStudy.version || 1,
    hero: {
      ...hero,
      image: hero.image ? resolveAsset(hero.image) : null,
      metaChips: Array.isArray(hero.metaChips) ? hero.metaChips : [],
    },
    challenge: {
      ...(caseStudy.challenge || {}),
    },
    contribution: {
      ...(caseStudy.contribution || {}),
      items: Array.isArray(caseStudy.contribution?.items) ? caseStudy.contribution.items : [],
      process: normalizeProcessStages(caseStudy.contribution?.process).map((stage) => ({
        ...stage,
        media: stage.media.map((item) => ({
          ...item,
          url: item.url ? (resolveAsset(item.url) || item.url) : '',
        })),
      })),
    },
    evidence: {
      ...evidence,
      image: evidence.image ? resolveAsset(evidence.image) : null,
      gallery: Array.isArray(evidence.gallery)
        ? evidence.gallery.map((g) => ({
            ...g,
            image: g.image ? resolveAsset(g.image) : null,
          }))
        : [],
    },
    technology: {
      ...(caseStudy.technology || {}),
      tags: Array.isArray(caseStudy.technology?.tags) ? caseStudy.technology.tags : [],
    },
    sectionOrder: Array.isArray(caseStudy.sectionOrder) ? caseStudy.sectionOrder : null,
  };
}

/**
 * Executes migration of all case studies to Supabase Content Registry metadata.caseStudy.
 * Idempotent: Skips already-migrated entries unless forced; forced custom migrations preserve CMS content.
 */
export async function executeCaseStudiesMigration(entries = null, force = false) {
  let list = entries;
  if (!list || list.length === 0) {
    const res = await getAdminContentRegistry();
    if (res.error) return { success: false, error: res.error, results: [] };
    list = res.data || [];
  }

  const results = [];
  for (const entry of list) {
    if (entry.content_type !== 'case-study') continue;
    const legacy = legacyCaseStudiesData[entry.slug];
    if (!legacy) continue;

    if (shouldSkipCaseStudyMigration(entry.metadata?.caseStudy, force)) {
      results.push({ slug: entry.slug, status: 'already-migrated', error: null });
      continue;
    }

    const migratedCaseStudy = migrateCaseStudyToRegistry(legacy);
    const nextCaseStudy = migratedCaseStudy?.type === 'custom'
      ? preserveCustomCaseStudyCmsContent(migratedCaseStudy, entry.metadata?.caseStudy)
      : migratedCaseStudy;
    const updatedMetadata = {
      ...(entry.metadata || {}),
      caseStudy: nextCaseStudy,
    };

    const updateRes = await updateContentRegistryEntry(entry.id, {
      metadata: updatedMetadata,
    });

    if (updateRes.error) {
      results.push({ slug: entry.slug, status: 'failed', error: updateRes.error });
    } else {
      results.push({ slug: entry.slug, status: 'migrated', error: null });
    }
  }

  const allSuccess = results.every(
    (r) => r.status === 'migrated' || r.status === 'already-migrated'
  );
  return { success: allSuccess, results };
}
