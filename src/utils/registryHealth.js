import { resolveAsset, DEFAULT_LOGO_MARKS } from '../services/assetRegistry.js';
import { isPublicRouteImplemented, getPublicRouteStatus } from '../services/contentRouteResolver.js';

/**
 * Computes a health report for a single content_registry entry.
 *
 * Health levels:
 *   'ok'      — no issues
 *   'warning' — non-blocking issues (missing optional but recommended fields)
 *   'error'   — blocking issues (missing required fields)
 *
 * Completeness score: 0–100 (percentage of recommended fields present)
 */
export function computeEntryHealth(entry) {
  const meta = entry?.metadata || {};
  const issues = [];
  let score = 0;
  const maxScore = entry.content_type === 'case-study' ? 11 : 10; // total recommended fields

  // ── Required fields ─────────────────────────────────────────────────────
  if (entry.title?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'error', code: 'MISSING_TITLE', field: 'title', message: 'Title is missing.' });
  }

  if (entry.slug?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'error', code: 'MISSING_SLUG', field: 'slug', message: 'Slug is missing.' });
  }

  if (entry.content_type?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'error', code: 'MISSING_CONTENT_TYPE', field: 'content_type', message: 'Content type is not set.' });
  }

  if (entry.public_route?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'warning', code: 'DEFAULT_ROUTE', field: 'public_route', message: 'No public route set (defaults to canonical route).' });
  }

  // ── Route readiness & implementation (Phase 12) ─────────────────────────
  const isPublishedAndPublic = entry.status === 'published' && entry.visibility === 'public';
  if (isPublishedAndPublic && !isPublicRouteImplemented(entry)) {
    issues.push({
      level: 'warning',
      code: 'PUBLIC_ROUTE_NOT_IMPLEMENTED',
      field: 'content_type',
      message: 'Public visibility is enabled, but this content type does not currently have an implemented public route.',
    });
  }

  // ── Route mismatch detection (Phase 12) ──────────────────────────────────
  const routeStatus = getPublicRouteStatus(entry);
  if (routeStatus.hasMismatch) {
    issues.push({
      level: 'warning',
      code: 'ROUTE_MISMATCH',
      field: 'public_route',
      message: routeStatus.mismatchReason || 'Configured route does not match canonical route pattern for this content type.',
    });
  }

  // ── Case Study Content Checks (Phase 13) ────────────────────────────────
  const isCaseStudy = entry.content_type === 'case-study';
  if (isCaseStudy) {
    if (!meta.caseStudy || typeof meta.caseStudy !== 'object') {
      if (isPublishedAndPublic) {
        issues.push({
          level: 'error',
          code: 'CASE_STUDY_CONTENT_MISSING',
          field: 'caseStudy',
          message: 'Case study content is missing from Registry metadata on published case study.',
        });
      } else {
        issues.push({
          level: 'warning',
          code: 'CASE_STUDY_CONTENT_MISSING',
          field: 'caseStudy',
          message: 'Case study content has not been migrated to Registry metadata.',
        });
      }
    } else {
      if (meta.caseStudy.version === 1) {
        score += 1;
      } else {
        issues.push({
          level: 'error',
          code: 'CASE_STUDY_VERSION_INVALID',
          field: 'caseStudy.version',
          message: `Case study version is invalid (${meta.caseStudy.version || 'missing'}, expected 1).`,
        });
      }

      if (meta.caseStudy.type === 'standard') {
        const hero = meta.caseStudy.hero || {};
        const challenge = meta.caseStudy.challenge || {};
        const contribution = meta.caseStudy.contribution || {};
        const evidence = meta.caseStudy.evidence || {};
        const technology = meta.caseStudy.technology || {};

        // Required for published + public
        if (!hero.title?.trim()) {
          issues.push({
            level: isPublishedAndPublic ? 'error' : 'warning',
            code: 'CASE_STUDY_HERO_TITLE_MISSING',
            field: 'caseStudy.hero.title',
            message: 'Case study hero section is missing a title.',
          });
        }
        if (!hero.lead?.trim()) {
          issues.push({
            level: isPublishedAndPublic ? 'error' : 'warning',
            code: 'CASE_STUDY_HERO_LEAD_MISSING',
            field: 'caseStudy.hero.lead',
            message: 'Case study hero section is missing lead text.',
          });
        }
        if (!challenge.title?.trim()) {
          issues.push({
            level: isPublishedAndPublic ? 'error' : 'warning',
            code: 'CASE_STUDY_CHALLENGE_TITLE_MISSING',
            field: 'caseStudy.challenge.title',
            message: 'Case study challenge section is missing a title.',
          });
        }

        // Recommended (warnings only)
        if (!contribution.items || !Array.isArray(contribution.items) || contribution.items.length === 0) {
          issues.push({
            level: 'warning',
            code: 'CASE_STUDY_CONTRIBUTION_INCOMPLETE',
            field: 'caseStudy.contribution.items',
            message: 'Case study contribution section has no bullet items.',
          });
        }
        if (!evidence.image?.trim()) {
          issues.push({
            level: 'warning',
            code: 'CASE_STUDY_EVIDENCE_IMAGE_MISSING',
            field: 'caseStudy.evidence.image',
            message: 'Case study evidence image reference is not set.',
          });
        }
        if (!technology.tags || !Array.isArray(technology.tags) || technology.tags.length === 0) {
          issues.push({
            level: 'warning',
            code: 'CASE_STUDY_TECH_TAGS_MISSING',
            field: 'caseStudy.technology.tags',
            message: 'Case study technology stack has no tags.',
          });
        }
      }
    }
  }

  // ── Presentation metadata (warnings) ────────────────────────────────────
  if (meta.description?.trim() || meta.subtitle?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'warning', field: 'description', message: 'No description or subtitle.' });
  }

  if (meta.kicker?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'warning', field: 'kicker', message: 'No kicker text.' });
  }

  if (meta.badge?.trim()) {
    score += 1;
  } else {
    issues.push({ level: 'warning', field: 'badge', message: 'No badge / number.' });
  }

  if (Array.isArray(meta.tags) && meta.tags.length > 0) {
    score += 1;
  } else {
    issues.push({ level: 'warning', field: 'tags', message: 'No tags set.' });
  }

  // ── Visual assets ─────────────────────────────────────────────────────
  const resolvedSlugAsset = entry.slug ? resolveAsset(entry.slug) : null;
  const hasHero =
    Boolean(meta.heroImage?.trim()) ||
    (resolvedSlugAsset !== null &&
      resolvedSlugAsset !== entry.slug &&
      !resolvedSlugAsset?.startsWith('/') === false);

  // Simpler: bundled asset exists if resolveAsset(slug) returns something other than the slug itself
  const bundledAsset = entry.slug ? resolveAsset(entry.slug) : null;
  const hasBundledHero = bundledAsset && bundledAsset !== entry.slug;
  const hasAnyHero = Boolean(meta.heroImage?.trim()) || hasBundledHero;

  if (hasAnyHero) {
    score += 1;
  } else {
    issues.push({ level: 'warning', field: 'heroImage', message: 'No hero image (no bundled asset or explicit reference).' });
  }

  const hasLogo =
    Boolean(meta.logoMark?.letter) ||
    Boolean(entry.slug && DEFAULT_LOGO_MARKS[entry.slug]);
  if (hasLogo) {
    score += 1;
  } else {
    issues.push({ level: 'warning', field: 'logoMark', message: 'No logo mark configured.' });
  }

  // ── Compute overall level ──────────────────────────────────────────────
  const hasErrors = issues.some((i) => i.level === 'error');
  const hasWarnings = issues.some((i) => i.level === 'warning');

  let level = 'ok';
  if (hasErrors) level = 'error';
  else if (hasWarnings) level = 'warning';

  return {
    level,
    score: Math.round((score / maxScore) * 100),
    issues,
    errorCount: issues.filter((i) => i.level === 'error').length,
    warningCount: issues.filter((i) => i.level === 'warning').length,
  };
}

/**
 * Evaluates whether a case study entry is ready to be published publicly.
 *
 * This answers a specific, narrow question: "Can this case-study safely be published?"
 * It is NOT the same as computeEntryHealth(), which measures broader content completeness
 * across ALL content types and infrastructure concerns.
 *
 * Distinction:
 *   computeEntryHealth()          → broad content/infrastructure health score (all types)
 *   getCaseStudyPublishingReadiness() → publish-gate check (case-study only)
 *
 * Returns:
 *   {
 *     isReady: boolean,
 *     gates: Array<{ id, message }>       — blocking issues (must fix before publish)
 *     advisories: Array<{ id, message }>  — non-blocking recommendations
 *   }
 *
 * Blocking gates (standard):
 *   - metadata.caseStudy must exist
 *   - version === 1
 *   - type === 'standard'
 *   - hero.title, hero.lead, challenge.title
 *   - public_route, title, slug
 *
 * Blocking gates (custom):
 *   - metadata.caseStudy must exist
 *   - version === 1
 *   - type === 'custom'
 *   - customComponent must be present
 *   - public_route, title, slug
 *
 * Advisories (never blocking — apply to standard only):
 *   Hero:         eyebrow, image, imageAlt, caption, metaChips
 *   Challenge:    eyebrow, copy, role, context
 *   Contribution: items, process
 *   Evidence:     image, imageAlt, caption
 *   Technology:   tags
 *   Registry:     description/subtitle, tags
 *   Alt text:     image exists but alt missing (hero, evidence)
 */
export function getCaseStudyPublishingReadiness(entry) {
  if (!entry || entry.content_type !== 'case-study') {
    return { isReady: false, gates: [{ id: 'NOT_CASE_STUDY', message: 'Entry is not a case study.' }], advisories: [] };
  }

  const meta = entry.metadata || {};
  const cs = meta.caseStudy;
  const gates = [];
  const advisories = [];

  // Gate: caseStudy block must exist
  if (!cs || typeof cs !== 'object') {
    gates.push({ id: 'MISSING_CASE_STUDY_BLOCK', message: 'Case study content block (metadata.caseStudy) is missing.' });
    // Can't continue evaluating sub-fields without the block
    if (!entry.public_route?.trim()) gates.push({ id: 'MISSING_PUBLIC_ROUTE', message: 'Public route is not configured.' });
    if (!entry.title?.trim()) gates.push({ id: 'MISSING_TITLE', message: 'Entry title is missing.' });
    if (!entry.slug?.trim()) gates.push({ id: 'MISSING_SLUG', message: 'Entry slug is missing.' });
    return { isReady: false, gates, advisories };
  }

  // Gate: version must be 1
  if (cs.version !== 1) {
    gates.push({ id: 'INVALID_VERSION', message: `Case study version is invalid (got ${cs.version ?? 'missing'}, expected 1).` });
  }

  if (cs.type === 'standard') {
    // ── Blocking (standard) ──────────────────────────────────────────────
    if (!cs.hero?.title?.trim()) {
      gates.push({ id: 'MISSING_HERO_TITLE', message: 'Hero section title is missing.' });
    }
    if (!cs.hero?.lead?.trim()) {
      gates.push({ id: 'MISSING_HERO_LEAD', message: 'Hero section lead text is missing.' });
    }
    if (!cs.challenge?.title?.trim()) {
      gates.push({ id: 'MISSING_CHALLENGE_TITLE', message: 'Challenge section title is missing.' });
    }

    // ── Advisories (standard) — NOT blocking ─────────────────────────────
    // Hero
    if (!cs.hero?.eyebrow?.trim()) {
      advisories.push({ id: 'MISSING_HERO_EYEBROW', message: 'Hero eyebrow label is not set.' });
    }
    if (!cs.hero?.image?.trim()) {
      advisories.push({ id: 'MISSING_HERO_IMAGE', message: 'Hero image reference is not set.' });
    } else if (!cs.hero?.imageAlt?.trim()) {
      advisories.push({ id: 'MISSING_HERO_IMAGE_ALT', message: 'Hero image exists but alt text is missing.' });
    }
    if (!cs.hero?.caption?.trim()) {
      advisories.push({ id: 'MISSING_HERO_CAPTION', message: 'Hero image caption is not set.' });
    }
    if (!Array.isArray(cs.hero?.metaChips) || cs.hero.metaChips.length === 0) {
      advisories.push({ id: 'MISSING_HERO_META_CHIPS', message: 'Hero meta chips (context pills) are not set.' });
    }

    // Challenge
    if (!cs.challenge?.eyebrow?.trim()) {
      advisories.push({ id: 'MISSING_CHALLENGE_EYEBROW', message: 'Challenge eyebrow label is not set.' });
    }
    if (!cs.challenge?.copy?.trim()) {
      advisories.push({ id: 'MISSING_CHALLENGE_COPY', message: 'Challenge copy is not set.' });
    }
    if (!cs.challenge?.role?.trim()) {
      advisories.push({ id: 'MISSING_CHALLENGE_ROLE', message: 'Challenge role field is not set.' });
    }
    if (!cs.challenge?.context?.trim()) {
      advisories.push({ id: 'MISSING_CHALLENGE_CONTEXT', message: 'Challenge context field is not set.' });
    }

    // Contribution
    if (!Array.isArray(cs.contribution?.items) || cs.contribution.items.length === 0) {
      advisories.push({ id: 'MISSING_CONTRIBUTION_ITEMS', message: 'Contribution bullet items are not set.' });
    }
    if (!Array.isArray(cs.contribution?.process) || cs.contribution.process.length === 0) {
      advisories.push({ id: 'MISSING_CONTRIBUTION_PROCESS', message: 'Contribution process steps are not set.' });
    }

    // Evidence
    if (!cs.evidence?.image?.trim()) {
      advisories.push({ id: 'MISSING_EVIDENCE_IMAGE', message: 'Evidence image reference is not set.' });
    } else if (!cs.evidence?.imageAlt?.trim()) {
      advisories.push({ id: 'MISSING_EVIDENCE_IMAGE_ALT', message: 'Evidence image exists but alt text is missing.' });
    }
    if (!cs.evidence?.caption?.trim()) {
      advisories.push({ id: 'MISSING_EVIDENCE_CAPTION', message: 'Evidence image caption is not set.' });
    }

    // Technology
    if (!Array.isArray(cs.technology?.tags) || cs.technology.tags.length === 0) {
      advisories.push({ id: 'MISSING_TECH_TAGS', message: 'Technology stack tags are not set.' });
    }

  } else if (cs.type === 'custom') {
    // ── Blocking (custom) ────────────────────────────────────────────────
    // Custom case studies must declare their rendering component
    if (!cs.customComponent?.trim()) {
      gates.push({ id: 'MISSING_CUSTOM_COMPONENT', message: 'Custom case study must declare a customComponent name (e.g. "WinniCaseStudy").' });
    }
    // No standard section requirements for custom — bespoke components self-render

  } else if (cs.version === 1) {
    // type is set but unrecognized
    gates.push({ id: 'UNKNOWN_TYPE', message: `Case study type "${cs.type}" is not recognized. Expected "standard" or "custom".` });
  }

  // ── Structural gates (all types) ───────────────────────────────────────
  if (!entry.public_route?.trim()) {
    gates.push({ id: 'MISSING_PUBLIC_ROUTE', message: 'Public route is not configured.' });
  }
  if (!entry.title?.trim()) {
    gates.push({ id: 'MISSING_TITLE', message: 'Entry title is missing.' });
  }
  if (!entry.slug?.trim()) {
    gates.push({ id: 'MISSING_SLUG', message: 'Entry slug is missing.' });
  }

  // ── Registry-level advisories (all types) ─────────────────────────────
  if (!meta.description?.trim() && !meta.subtitle?.trim()) {
    advisories.push({ id: 'MISSING_DESCRIPTION', message: 'No description or subtitle for catalog cards.' });
  }
  if (!Array.isArray(meta.tags) || meta.tags.length === 0) {
    advisories.push({ id: 'MISSING_TAGS', message: 'No registry tags configured.' });
  }

  return {
    isReady: gates.length === 0,
    gates,
    advisories,
  };
}


/**
 * Detects cross-entry data integrity issues across the full registry.
 * Returns an array of { level, field, slugs, message } objects.
 */
export function computeRegistryIntegrity(entries) {
  const issues = [];

  // ── Duplicate sort_order (among published entries only — warns on all) ──
  const sortOrderMap = {};
  for (const e of entries) {
    const so = e.sort_order;
    if (so === null || so === undefined) continue;
    if (!sortOrderMap[so]) sortOrderMap[so] = [];
    sortOrderMap[so].push(e.slug || e.id);
  }
  for (const [so, slugs] of Object.entries(sortOrderMap)) {
    if (slugs.length > 1) {
      issues.push({
        level: 'warning',
        field: 'sort_order',
        slugs,
        message: `Duplicate sort_order ${so}: [${slugs.join(', ')}]`,
      });
    }
  }

  // ── Duplicate public_route ─────────────────────────────────────────────
  const routeMap = {};
  for (const e of entries) {
    const route = e.public_route?.trim();
    if (!route) continue;
    if (!routeMap[route]) routeMap[route] = [];
    routeMap[route].push(e.slug || e.id);
  }
  for (const [route, slugs] of Object.entries(routeMap)) {
    if (slugs.length > 1) {
      issues.push({
        level: 'error',
        field: 'public_route',
        slugs,
        message: `Duplicate route "${route}": [${slugs.join(', ')}]`,
      });
    }
  }

  // ── Duplicate slug ─────────────────────────────────────────────────────
  const slugMap = {};
  for (const e of entries) {
    const slug = e.slug?.trim();
    if (!slug) continue;
    if (!slugMap[slug]) slugMap[slug] = [];
    slugMap[slug].push(e.id);
  }
  for (const [slug, ids] of Object.entries(slugMap)) {
    if (ids.length > 1) {
      issues.push({
        level: 'error',
        field: 'slug',
        slugs: [slug],
        message: `Duplicate slug "${slug}" across ${ids.length} entries.`,
      });
    }
  }

  return issues;
}

/**
 * Summarizes the overall health of the full registry.
 * Returns a summary object used by the AdminRegistry metrics bar and health panel.
 */
export function computeRegistryHealthSummary(entries) {
  const entryHealths = entries.map((e) => ({ ...computeEntryHealth(e), id: e.id, slug: e.slug }));
  const integrityIssues = computeRegistryIntegrity(entries);

  const totalEntryErrors = entryHealths.reduce((sum, h) => sum + h.errorCount, 0);
  const totalEntryWarnings = entryHealths.reduce((sum, h) => sum + h.warningCount, 0);
  const integrityErrors = integrityIssues.filter((i) => i.level === 'error').length;
  const integrityWarnings = integrityIssues.filter((i) => i.level === 'warning').length;

  const avgScore =
    entryHealths.length > 0
      ? Math.round(entryHealths.reduce((sum, h) => sum + h.score, 0) / entryHealths.length)
      : 0;

  // Build healthByEntryId lookup
  const healthByEntryId = {};
  for (const h of entryHealths) {
    healthByEntryId[h.id] = h;
  }

  const totalErrors = totalEntryErrors + integrityErrors;
  const totalWarnings = totalEntryWarnings + integrityWarnings;

  return {
    avgScore,
    totalErrors,
    totalWarnings,
    integrityIssues,
    healthByEntryId,
    level: totalErrors > 0 ? 'error' : totalWarnings > 0 ? 'warning' : 'ok',
  };
}

/* ==============================================================================
   PHASE 16.1 — PERSISTENCE CONSISTENCY & SINGLE PUBLICATION AUTHORITY
   ==============================================================================
   Architectural Distinctions:
     1. REGISTRY HEALTH:       "Is this content structurally & configurationally healthy?"
     2. PUBLISHING READINESS:  "Can this content safely transition to live public state?"
     3. PERSISTENCE CONSISTENCY: "Do related records across systems (e.g. pages vs content_registry) agree?"
   ============================================================================== */

/**
 * Checks persistence consistency between a Page Builder record (pages table)
 * and its corresponding Content Registry entry (content_registry table).
 * Deterministic and side-effect free.
 *
 * @param {object|null} page - Record from pages table
 * @param {object|null} registryEntry - Record from content_registry table
 * @returns {{ isConsistent: boolean, issues: Array<{ code: string, field: string, message: string }> }}
 */
export function getPageRegistryConsistency(page, registryEntry) {
  const issues = [];

  if (!page && !registryEntry) {
    return {
      isConsistent: false,
      issues: [{ code: 'BOTH_MISSING', field: 'all', message: 'Neither Page record nor Registry entry provided.' }],
    };
  }

  if (!registryEntry) {
    return {
      isConsistent: false,
      issues: [{
        code: 'MISSING_REGISTRY_ENTRY',
        field: 'registry',
        message: `Page "${page.title || page.slug}" (slug: "${page.slug}") has no corresponding Content Registry entry.`,
      }],
    };
  }

  if (!page) {
    return {
      isConsistent: false,
      issues: [{
        code: 'MISSING_PAGE_RECORD',
        field: 'page',
        message: `Registry entry "${registryEntry.title}" (slug: "${registryEntry.slug}") has no backing Page database record.`,
      }],
    };
  }

  // 1. Slug check
  if ((page.slug || '').trim() !== (registryEntry.slug || '').trim()) {
    issues.push({
      code: 'SLUG_MISMATCH',
      field: 'slug',
      message: `Slug mismatch: Page has "${page.slug}", but Registry entry has "${registryEntry.slug}".`,
    });
  }

  // 2. Title check
  if ((page.title || '').trim() !== (registryEntry.title || '').trim()) {
    issues.push({
      code: 'TITLE_MISMATCH',
      field: 'title',
      message: `Title mismatch: Page has "${page.title}", but Registry entry has "${registryEntry.title}".`,
    });
  }

  // 3. Status check
  if (page.status !== registryEntry.status) {
    issues.push({
      code: 'STATUS_MISMATCH',
      field: 'status',
      message: `Publication status mismatch: Page has "${page.status}", but Registry entry has "${registryEntry.status}".`,
    });
  }

  // 4. Visibility check
  if (registryEntry.status === 'published' && registryEntry.visibility !== 'public') {
    issues.push({
      code: 'VISIBILITY_MISMATCH',
      field: 'visibility',
      message: `Visibility inconsistency: Registry status is "published" but visibility is "${registryEntry.visibility}" (expected "public").`,
    });
  } else if (registryEntry.status === 'draft' && registryEntry.visibility === 'public') {
    issues.push({
      code: 'VISIBILITY_MISMATCH',
      field: 'visibility',
      message: 'Visibility inconsistency: Registry status is "draft" but visibility is "public" (expected "private").',
    });
  }

  // 5. Route check
  const expectedRoute = page.slug === 'about' ? '/about' : `/p/${page.slug}`;
  if (registryEntry.public_route && registryEntry.public_route !== expectedRoute) {
    issues.push({
      code: 'ROUTE_MISMATCH',
      field: 'public_route',
      message: `Route mismatch: Registry public_route is "${registryEntry.public_route}", expected "${expectedRoute}".`,
    });
  }

  return {
    isConsistent: issues.length === 0,
    issues,
  };
}

/**
 * PHASE 18.3: Authoritative consistency helper for CMS Page ↔ Registry ↔ Sections integrity.
 *
 * Verifies the complete data-flow relationship:
 *   pages table ↕ content_registry table ↕ page_sections table
 *
 * Detects:
 *   MISSING_PAGE
 *   MISSING_REGISTRY
 *   ORPHAN_REGISTRY
 *   REGISTRY_SLUG_MISMATCH
 *   REGISTRY_ROUTE_MISMATCH
 *   STATUS_MISMATCH
 *   SECTION_COUNT_MISMATCH
 *   INVALID_SECTION
 *   DUPLICATE_SECTION_ID
 *   INVALID_SORT_ORDER
 *
 * @param {object|null} pageInput - Page record, or composite object containing { page, registry, sections }
 * @param {object|null} [registryInput=null] - Corresponding Content Registry entry
 * @param {Array<object>|null} [sectionsInput=null] - Array of section records for this page
 * @returns {{
 *   isConsistent: boolean,
 *   issues: Array<{ code: string, field: string, level: string, message: string }>,
 *   warnings: Array<{ code: string, field: string, level: string, message: string }>,
 *   page: object|null,
 *   registry: object|null,
 *   sections: Array<object>
 * }}
 */
export function getPageContentIntegrity(pageInput, registryInput = null, sectionsInput = null) {
  let page = null;
  let registry = null;
  let sections = [];

  if (pageInput && typeof pageInput === 'object') {
    if ('page' in pageInput && ('registry' in pageInput || 'sections' in pageInput)) {
      page = pageInput.page || null;
      registry = pageInput.registry || registryInput || null;
      sections = pageInput.sections || sectionsInput || [];
    } else {
      page = pageInput;
      registry = registryInput || pageInput.registry || pageInput.registryEntry || pageInput.content_registry || null;
      sections = sectionsInput || pageInput.sections || pageInput.page_sections || [];
    }
  } else if (!pageInput && registryInput) {
    registry = registryInput;
    sections = sectionsInput || [];
  }

  const issues = [];
  const warnings = [];

  // 1. Page Record Existence
  if (!page) {
    if (registry) {
      issues.push({
        code: 'ORPHAN_REGISTRY',
        field: 'page',
        level: 'error',
        message: `Registry entry "${registry.title || registry.slug}" has no backing Page database record.`,
      });
    } else {
      issues.push({
        code: 'MISSING_PAGE',
        field: 'page',
        level: 'error',
        message: 'Page record is missing.',
      });
    }
    return {
      isConsistent: false,
      issues,
      warnings,
      page,
      registry,
      sections,
    };
  }

  // 2. Orphan check flag on page
  if (page.isOrphanRegistry) {
    issues.push({
      code: 'ORPHAN_REGISTRY',
      field: 'page',
      level: 'error',
      message: `Page "${page.title}" is an orphan registry entry with no backing Page record.`,
    });
  }

  // 3. Registry Entry Existence
  if (!registry) {
    issues.push({
      code: 'MISSING_REGISTRY',
      field: 'registry',
      level: 'error',
      message: `Page "${page.title || page.slug}" has no corresponding Content Registry entry.`,
    });
  } else {
    // 4. Slug Mismatch
    const pageSlug = (page.slug || '').trim();
    const regSlug = (registry.slug || '').trim();
    if (pageSlug !== regSlug) {
      issues.push({
        code: 'REGISTRY_SLUG_MISMATCH',
        field: 'slug',
        level: 'error',
        message: `Slug mismatch: Page has "${pageSlug}", but Registry entry has "${regSlug}".`,
      });
    }

    // 5. Canonical Route Mismatch
    const canonicalRoute = pageSlug === 'about' ? '/about' : `/p/${pageSlug}`;
    if (registry.public_route && registry.public_route.trim() !== canonicalRoute) {
      issues.push({
        code: 'REGISTRY_ROUTE_MISMATCH',
        field: 'public_route',
        level: 'error',
        message: `Registry route "${registry.public_route}" does not match canonical route "${canonicalRoute}".`,
      });
    }

    // 6. Publication Status Mismatch
    if (page.status !== registry.status) {
      issues.push({
        code: 'STATUS_MISMATCH',
        field: 'status',
        level: 'error',
        message: `Publication status mismatch: Page is "${page.status}", but Registry is "${registry.status}".`,
      });
    }
  }

  // 7. Section Collection & Ordering Integrity
  const secList = Array.isArray(sections) ? sections : [];
  const secCount = secList.length;

  if (page.status === 'published' && secCount === 0) {
    warnings.push({
      code: 'SECTION_COUNT_MISMATCH',
      field: 'sections',
      level: 'warning',
      message: 'Published page has 0 content sections configured.',
    });
  }

  // Check section uniqueness, validation, and sort orders
  const seenIds = new Set();
  const seenSortOrders = new Set();

  secList.forEach((sec, idx) => {
    if (!sec || typeof sec !== 'object') {
      issues.push({
        code: 'INVALID_SECTION',
        field: `sections[${idx}]`,
        level: 'error',
        message: `Section at index ${idx} is null or malformed.`,
      });
      return;
    }

    // ID check
    const secId = String(sec.id || `temp-${idx}`);
    if (seenIds.has(secId)) {
      issues.push({
        code: 'DUPLICATE_SECTION_ID',
        field: `sections[${idx}].id`,
        level: 'error',
        message: `Duplicate section ID "${secId}" detected at index ${idx}.`,
      });
    }
    seenIds.add(secId);

    // Section Type validation
    if (!sec.section_type || typeof sec.section_type !== 'string' || !sec.section_type.trim()) {
      issues.push({
        code: 'INVALID_SECTION',
        field: `sections[${idx}].section_type`,
        level: 'error',
        message: `Section "${sec.label || secId}" is missing required section_type.`,
      });
    }

    // Sort Order check
    const so = sec.sort_order;
    if (so === null || so === undefined || isNaN(so) || typeof so !== 'number' || so < 0) {
      warnings.push({
        code: 'INVALID_SORT_ORDER',
        field: `sections[${idx}].sort_order`,
        level: 'warning',
        message: `Section "${sec.label || secId}" has invalid or missing sort_order (${so}).`,
      });
    } else {
      if (seenSortOrders.has(so)) {
        warnings.push({
          code: 'INVALID_SORT_ORDER',
          field: `sections[${idx}].sort_order`,
          level: 'warning',
          message: `Duplicate sort_order ${so} detected on section "${sec.label || secId}".`,
        });
      }
      seenSortOrders.add(so);
    }
  });

  return {
    isConsistent: issues.length === 0,
    issues,
    warnings,
    page,
    registry,
    sections: secList,
  };
}

/**
 * Single Publication Authority gate for Pages.
 * Returns true if and only if both the Page record and Registry entry exist,
 * both are marked 'published', and Registry visibility is 'public'.
 *
 * @param {object|null} page
 * @param {object|null} registryEntry
 * @returns {boolean}
 */
export function isPagePubliclyAccessible(page, registryEntry) {
  if (!page || !registryEntry) return false;
  const isPagePublished = page.status === 'published';
  const isRegistryPublished = registryEntry.status === 'published';
  const isRegistryPublic = registryEntry.visibility === 'public';
  return isPagePublished && isRegistryPublished && isRegistryPublic;
}

/**
 * Single Publication Authority gate for Case Studies.
 *
 * @param {object|null} caseStudyEntry
 * @returns {boolean}
 */
export function isCaseStudyPubliclyAccessible(caseStudyEntry) {
  if (!caseStudyEntry) return false;
  const isPublished = caseStudyEntry.status === 'published';
  const isPublic = caseStudyEntry.visibility === 'public';
  const hasContent = Boolean(caseStudyEntry.metadata?.caseStudy);
  return isPublished && isPublic && hasContent;
}

/**
 * Evaluates publishing readiness for a Page Builder page before publication.
 *
 * @param {object} page
 * @param {Array<object>} sections
 * @returns {{ isReady: boolean, gates: Array<{ id: string, message: string }>, advisories: Array<{ id: string, message: string }> }}
 */
export function getPagePublishingReadiness(page = {}, sections = []) {
  const gates = [];
  const advisories = [];

  // Required gates
  if (!page.title?.trim()) {
    gates.push({ id: 'MISSING_TITLE', message: 'Page title is required.' });
  }

  if (!page.slug?.trim()) {
    gates.push({ id: 'MISSING_SLUG', message: 'Page slug is required.' });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug.trim())) {
    gates.push({ id: 'INVALID_SLUG', message: 'Page slug must be lowercase alphanumeric with hyphens.' });
  }

  const visibleSections = (sections || []).filter((s) => s.is_visible !== false);
  if (visibleSections.length === 0) {
    gates.push({ id: 'NO_VISIBLE_SECTIONS', message: 'Page must have at least one visible section to publish.' });
  }

  // Advisories (recommended)
  if (!page.seo_title?.trim()) {
    advisories.push({ id: 'MISSING_SEO_TITLE', message: 'SEO Title is recommended for search indexing.' });
  }

  if (!page.seo_description?.trim()) {
    advisories.push({ id: 'MISSING_SEO_DESCRIPTION', message: 'SEO Meta Description is recommended.' });
  }

  const imageSectionsWithoutAlt = visibleSections.filter(
    (s) => s.section_type === 'image' && s.config?.imageUrl && !s.config?.alt?.trim()
  );
  if (imageSectionsWithoutAlt.length > 0) {
    advisories.push({
      id: 'MISSING_IMAGE_ALT',
      message: `${imageSectionsWithoutAlt.length} image section(s) are missing accessibility alt text.`,
    });
  }

  const totalChecks = 5;
  const passedChecks =
    (page.title?.trim() ? 1 : 0) +
    (page.slug?.trim() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug.trim()) ? 1 : 0) +
    (visibleSections.length > 0 ? 1 : 0) +
    (page.seo_title?.trim() ? 1 : 0) +
    (page.seo_description?.trim() ? 1 : 0);
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    isReady: gates.length === 0,
    score,
    gates,
    advisories,
  };
}

