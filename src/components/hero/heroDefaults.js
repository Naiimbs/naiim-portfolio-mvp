/**
 * Default content for the homepage Hero.
 *
 * Single source of truth shared by:
 *  - the Hero component (src/components/hero/HeroSection.jsx) for rendering, and
 *  - the CMS section schema (src/components/cms/sectionSchemas.js) for the
 *    builder's editor defaults.
 *
 * These English fallbacks are shared by the live hero and CMS section schema.
 * The homepage variant supplies localized, project-first CTA labels at render time.
 */
export const HERO_DEFAULTS = {
  eyebrow: 'SENIOR UX/UI DESIGNER · AI PRODUCT BUILDER',
  titleLines: ['I design and build', 'digital products that', 'make complex work', 'feel simple.'],
  accentFromLine: 2,
  emphasizeLastLine: false,
  lead: 'Product design, AI workflows, and digital experiences for ambitious teams and founders.',
  leadStrong: '',
  primaryCta: { label: 'Explore projects', href: '#work' },
  secondaryCta: { label: "Let’s talk", href: '/about#contact' },
  availabilityLabel: 'Available for freelance projects',
  showBuilding: false,
  // Right-column visual controls
  showVisual: true, // master toggle for the whole right-column visual
  showMotion: true, // offer the "Motion Sequence" mode
  showPortrait: true, // offer the "Portrait & Audio" mode
  showModeToggle: false, // keep the reference composition clean by default
  buildingLabel: 'CURRENTLY BUILDING',
  buildingItems: [
    { iconText: 'W', iconClass: 'winni', label: 'WINNI', href: '#work', note: '' },
    { iconText: '✦', iconClass: 'copilot', label: 'Naïm Copilot', href: '#copilot', note: '' },
    { iconText: 'A', iconClass: 'assestini', label: 'Assestini', href: '#work', note: 'Product / Operations OS' },
  ],
};
