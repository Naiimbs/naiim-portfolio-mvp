/**
 * caseStudyRegistryMigration.js
 *
 * Deterministic normalization and migration utilities for Case Study content
 * transitioning into the authoritative Supabase Content Registry (metadata.caseStudy).
 */

import { resolveAsset } from './assetRegistry.js';
import { updateContentRegistryEntry, getAdminContentRegistry } from './contentRegistry.js';
import legacyCaseStudiesData from '../data/caseStudiesData.json';

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
      process: Array.isArray(contribution?.process)
        ? contribution.process.map((p) => ({
            step: p.step || '',
            title: p.title || '',
            desc: p.desc || '',
          }))
        : [],
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

  if (caseStudy.version !== 1) {
    errors.push(`Invalid or missing case study version: ${caseStudy.version} (expected 1).`);
  }

  if (caseStudy.type !== 'standard' && caseStudy.type !== 'custom') {
    errors.push(`Invalid case study type: ${caseStudy.type} (expected 'standard' or 'custom').`);
  }

  if (caseStudy.type === 'custom') {
    if (!caseStudy.title) warnings.push('Custom case study has no title.');
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
export function normalizeCaseStudyContent(caseStudy, slug = '') {
  if (!caseStudy) return null;

  if (caseStudy.type === 'custom') {
    return {
      slug,
      type: 'custom',
      title: caseStudy.title || '',
      subtitle: caseStudy.subtitle || '',
      customComponent: caseStudy.customComponent || null,
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
      process: Array.isArray(caseStudy.contribution?.process) ? caseStudy.contribution.process : [],
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
 * Idempotent: Skips entries where metadata.caseStudy.version === 1 unless forced.
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

    if (!force && entry.metadata?.caseStudy?.version === 1) {
      results.push({ slug: entry.slug, status: 'already-migrated', error: null });
      continue;
    }

    const migratedCaseStudy = migrateCaseStudyToRegistry(legacy);
    const updatedMetadata = {
      ...(entry.metadata || {}),
      caseStudy: migratedCaseStudy,
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
