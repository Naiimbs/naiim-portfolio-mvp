/**
 * Default content for the homepage Hero.
 *
 * Single source of truth shared by:
 *  - the Hero component (src/components/hero/HeroSection.jsx) for rendering, and
 *  - the CMS section schema (src/components/cms/sectionSchemas.js) for the
 *    builder's editor defaults.
 *
 * These values mirror the original hardcoded hero exactly, so an un-edited
 * `home_hero` section renders identically to the previous static homepage.
 */
export const HERO_DEFAULTS = {
  eyebrow: 'SENIOR UX/UI DESIGNER · AI PRODUCT BUILDER',
  titleLines: ['I DESIGN.', 'I BUILD.', 'I EXPERIMENT.'],
  emphasizeLastLine: true,
  lead: 'I turn ambiguous problems into usable digital products at the intersection of ',
  leadStrong: 'product design, AI, low-code and automation.',
  primaryCta: { label: 'Explore my work', href: '#work' },
  secondaryCta: { label: 'Talk to Naïm Copilot', href: '#copilot' },
  buildingLabel: 'CURRENTLY BUILDING',
  buildingItems: [
    { iconText: 'W', iconClass: 'winni', label: 'WINNI', href: '#work', note: '' },
    { iconText: '✦', iconClass: 'copilot', label: 'Naïm Copilot', href: '#copilot', note: '' },
    { iconText: 'A', iconClass: 'assestini', label: 'Assestini', href: '#work', note: 'Product / Operations OS' },
  ],
};
