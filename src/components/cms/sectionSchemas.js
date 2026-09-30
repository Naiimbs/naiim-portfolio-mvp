/**
 * Section Configuration Schemas and Normalizers for Site-Wide Visual CMS.
 * Supports the 5 core editable section types:
 * - hero
 * - rich_text
 * - project_grid
 * - agent_grid
 * - cta
 */

export const SECTION_SCHEMAS = {
  hero: {
    type: 'hero',
    label: 'Hero Banner',
    defaultConfig: {
      eyebrow: '',
      title: 'Welcome to Naïm Portfolio',
      description: 'Building intelligent design systems and AI-powered interfaces.',
      imageId: null,
      imageUrl: '',
      imageAlt: '',
      primaryCta: { label: 'Explore Work', href: '/work' },
      secondaryCta: { label: 'Get in Touch', href: '/about' },
      layout: 'split', // 'split' | 'centered' | 'left'
    },
  },
  rich_text: {
    type: 'rich_text',
    label: 'Rich Text',
    defaultConfig: {
      eyebrow: '',
      title: 'About This Project',
      body: 'Write clean, structured narrative content for your portfolio page here.',
      alignment: 'left', // 'left' | 'center' | 'right'
    },
  },
  project_grid: {
    type: 'project_grid',
    label: 'Project Grid',
    defaultConfig: {
      eyebrow: 'Portfolio',
      title: 'Selected Case Studies',
      description: 'Handpicked products, design systems, and digital experiences.',
      projectIds: [],
      columns: 3, // 2 | 3 | 4
      show_excerpt: true,
      show_tags: true,
    },
  },
  agent_grid: {
    type: 'agent_grid',
    label: 'Agent Grid',
    defaultConfig: {
      eyebrow: 'Autonomous AI',
      title: 'Custom AI Agents',
      description: 'Specialized agentic workflows built for product engineering.',
      agentIds: [],
      columns: 3, // 2 | 3 | 4
      show_description: true,
    },
  },
  cta: {
    type: 'cta',
    label: 'Call to Action',
    defaultConfig: {
      eyebrow: 'Next Steps',
      title: 'Ready to collaborate on your next product?',
      description: 'Let’s build scalable design systems and AI experiences together.',
      buttonLabel: 'Contact Me',
      buttonHref: 'mailto:contact@example.com',
      alignment: 'centered', // 'centered' | 'left'
    },
  },
};

/**
 * Safely normalizes raw JSON config to match the controlled section schema defaults.
 */
export function normalizeSectionConfig(sectionType, rawConfig = {}) {
  const type = String(sectionType || '').toLowerCase().trim();
  const schema = SECTION_SCHEMAS[type];
  if (!schema) {
    return rawConfig || {};
  }

  const defaults = schema.defaultConfig;
  const config = { ...defaults, ...(rawConfig || {}) };

  // Type-specific normalization
  if (type === 'hero') {
    config.primaryCta = { ...defaults.primaryCta, ...(config.primaryCta || {}) };
    config.secondaryCta = { ...defaults.secondaryCta, ...(config.secondaryCta || {}) };
    if (!['split', 'centered', 'left'].includes(config.layout)) {
      config.layout = 'split';
    }
  }

  if (type === 'rich_text') {
    if (!['left', 'center', 'right'].includes(config.alignment)) {
      config.alignment = 'left';
    }
  }

  if (type === 'project_grid') {
    if (!Array.isArray(config.projectIds)) config.projectIds = [];
    config.columns = Number(config.columns) || 3;
  }

  if (type === 'agent_grid') {
    if (!Array.isArray(config.agentIds)) config.agentIds = [];
    config.columns = Number(config.columns) || 3;
  }

  if (type === 'cta') {
    if (!['centered', 'left'].includes(config.alignment)) {
      config.alignment = 'centered';
    }
  }

  return config;
}
