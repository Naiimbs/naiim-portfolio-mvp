/**
 * Section Configuration Schemas, Validation & Type Registry for Site-Wide Visual CMS.
 *
 * Centralized Single Source of Truth for Page Builder Section Types.
 */

export const PAGE_SECTION_TYPES = {
  hero: {
    type: 'hero',
    label: 'Hero Banner',
    category: 'CONVERSION',
    icon: 'bi-bullseye',
    description: 'Impactful headline, CTA buttons, and split or centered media.',
    hasEditor: true,
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
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Hero title is required.');
      if ((cfg.imageUrl || cfg.imageId) && !cfg.imageAlt?.trim()) {
        advisories.push('Image is missing descriptive alt text for accessibility.');
      }
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  cta: {
    type: 'cta',
    label: 'Call to Action',
    category: 'CONVERSION',
    icon: 'bi-megaphone',
    description: 'Conversion section with headline, description, and primary button.',
    hasEditor: true,
    defaultConfig: {
      eyebrow: 'Next Steps',
      title: 'Ready to collaborate on your next product?',
      description: 'Let’s build scalable design systems and AI experiences together.',
      buttonLabel: 'Contact Me',
      buttonHref: 'mailto:contact@example.com',
      alignment: 'centered', // 'centered' | 'left'
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('CTA headline is required.');
      if (!cfg.buttonHref?.trim()) advisories.push('Button link destination is recommended.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  project_grid: {
    type: 'project_grid',
    label: 'Project Grid',
    category: 'WORK',
    icon: 'bi-briefcase',
    description: 'Grid layout of handpicked portfolio case studies.',
    hasEditor: true,
    defaultConfig: {
      eyebrow: 'Portfolio',
      title: 'Selected Case Studies',
      description: 'Handpicked products, design systems, and digital experiences.',
      projectIds: [],
      columns: 3, // 2 | 3 | 4
      show_excerpt: true,
      show_tags: true,
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Section title is required.');
      if (!cfg.projectIds?.length) advisories.push('No projects explicitly selected; will display all default projects.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  agent_grid: {
    type: 'agent_grid',
    label: 'Agent Grid',
    category: 'WORK',
    icon: 'bi-robot',
    description: 'Grid display of autonomous AI agents.',
    hasEditor: true,
    defaultConfig: {
      eyebrow: 'Autonomous AI',
      title: 'Custom AI Agents',
      description: 'Specialized agentic workflows built for product engineering.',
      agentIds: [],
      columns: 3, // 2 | 3 | 4
      show_description: true,
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Section title is required.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  rich_text: {
    type: 'rich_text',
    label: 'Rich Text',
    category: 'CONTENT',
    icon: 'bi-file-text',
    description: 'Structured narrative heading, eyebrow, and body paragraphs.',
    hasEditor: true,
    defaultConfig: {
      eyebrow: '',
      title: 'About This Section',
      body: 'Write clean, structured narrative content for your portfolio page here.',
      alignment: 'left', // 'left' | 'center' | 'right'
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim() && !cfg.body?.trim()) {
        errors.push('Rich text section requires either a title or body content.');
      }
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  image: {
    type: 'image',
    label: 'Image Block',
    category: 'CONTENT',
    icon: 'bi-image',
    description: 'Single full-width or centered image with caption and alt text.',
    hasEditor: true,
    defaultConfig: {
      src: '',
      alt: '',
      caption: '',
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.src?.trim() && !cfg.imageUrl?.trim()) {
        errors.push('Image URL or source is required.');
      }
      if ((cfg.src || cfg.imageUrl) && !cfg.alt?.trim()) {
        advisories.push('Image is missing descriptive alt text for accessibility.');
      }
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  quote: {
    type: 'quote',
    label: 'Quote / Testimonial',
    category: 'CONTENT',
    icon: 'bi-quote',
    description: 'Pull quote block with author attribution and role.',
    hasEditor: true,
    defaultConfig: {
      quote: 'Good design is as little design as possible.',
      author: 'Dieter Rams',
      role: 'Industrial Designer',
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.quote?.trim()) errors.push('Quote text is required.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  metrics: {
    type: 'metrics',
    label: 'Key Metrics',
    category: 'CONTENT',
    icon: 'bi-bar-chart',
    description: 'Statistics and metric counters row.',
    hasEditor: true,
    defaultConfig: {
      eyebrow: 'Impact',
      title: 'Key Metrics & Outcomes',
      metrics: [
        { value: '10x', label: 'Faster Workflow' },
        { value: '99%', label: 'Design System Adoption' },
        { value: '4+', label: 'Shipped AI Products' },
      ],
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.metrics?.length) advisories.push('At least one metric item is recommended.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  timeline: {
    type: 'timeline',
    label: 'Experience Timeline',
    category: 'CONTENT',
    icon: 'bi-clock-history',
    description: 'Chronological timeline of milestones.',
    hasEditor: true,
    defaultConfig: {
      title: 'Career Milestones',
      items: [
        { year: '2026', title: 'Lead Product Designer', description: 'Designing AI-native product workflows.' },
      ],
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Timeline title is required.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  workflow: {
    type: 'workflow',
    label: 'Workflow Steps',
    category: 'CONTENT',
    icon: 'bi-diagram-3',
    description: 'Structured multi-step process overview.',
    hasEditor: true,
    defaultConfig: {
      title: 'Process Framework',
      steps: [
        { title: 'Understand & Frame', description: 'Deconstruct complex business problems.' },
        { title: 'Design & Systematize', description: 'Architect intuitive user flows.' },
        { title: 'Build & Automate', description: 'Implement with web tech and AI.' },
      ],
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Workflow title is required.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    category: 'CONTENT',
    icon: 'bi-images',
    description: 'Responsive multi-image showcase grid.',
    hasEditor: true,
    defaultConfig: {
      images: [
        { src: '', alt: '' },
      ],
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      const images = Array.isArray(cfg.images) ? cfg.images : [];
      if (images.length === 0) {
        errors.push('At least one gallery image is required.');
      } else {
        const missingSrc = images.some((img) => !(typeof img === 'string' ? img : img.src)?.trim());
        if (missingSrc) errors.push('All gallery items must have a valid image source URL.');
        const missingAlt = images.some((img) => typeof img === 'object' && !img.alt?.trim());
        if (missingAlt) advisories.push('Some gallery images are missing descriptive alt text.');
      }
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  video: {
    type: 'video',
    label: 'Video Embed',
    category: 'CONTENT',
    icon: 'bi-camera-video',
    description: 'Responsive embedded video player (YouTube, Vimeo, iframe).',
    hasEditor: true,
    defaultConfig: {
      src: '',
      title: 'Video Embed',
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.src?.trim()) errors.push('Video source embed URL is required.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  architecture: {
    type: 'architecture',
    label: 'System Architecture',
    category: 'CONTENT',
    icon: 'bi-diagram-2',
    description: 'Technical architecture diagram with explanatory description.',
    hasEditor: true,
    defaultConfig: {
      title: 'System Architecture',
      diagramUrl: '',
      description: 'High-level component topology and data-flow overview.',
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Architecture section title is required.');
      if (!cfg.diagramUrl?.trim()) advisories.push('Diagram image URL is recommended.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  contact: {
    type: 'contact',
    label: 'Contact Channels',
    category: 'CONVERSION',
    icon: 'bi-envelope-at',
    description: 'Direct contact section with email, LinkedIn, and GitHub links.',
    hasEditor: true,
    defaultConfig: {
      title: 'Get in Touch',
      email: 'hello@naiimbsili.com',
      linkedin: 'https://linkedin.com/in/naimbsili',
      github: 'https://github.com/naiimbsili',
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim() && !cfg.email?.trim()) {
        errors.push('Contact section requires either a title or an email address.');
      }
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  project_list: {
    type: 'project_list',
    label: 'Project List',
    category: 'WORK',
    icon: 'bi-list-ul',
    description: 'Compact vertical project index with directional arrows.',
    hasEditor: true,
    defaultConfig: {
      title: 'Featured Projects',
      projects: [],
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (!cfg.title?.trim()) errors.push('Project list title is required.');
      return { valid: errors.length === 0, errors, advisories };
    },
  },
  spacer: {
    type: 'spacer',
    label: 'Vertical Spacer',
    category: 'LAYOUT',
    icon: 'bi-arrows-vertical',
    description: 'Configurable vertical whitespace divider.',
    hasEditor: true,
    defaultConfig: {
      height: 40,
    },
    validate: (cfg = {}) => {
      const errors = [];
      const advisories = [];
      if (typeof cfg.height !== 'number' || cfg.height < 0) {
        errors.push('Spacer height must be a non-negative number.');
      }
      return { valid: errors.length === 0, errors, advisories };
    },
  },
};

/**
 * Backward-compatible schema map.
 */
export const SECTION_SCHEMAS = PAGE_SECTION_TYPES;

/**
 * Returns grouped section types for category-based pickers (e.g. AddSectionModal).
 */
export function getCategorizedSectionTypes() {
  const categoryMeta = {
    CONVERSION: { category: 'CONVERSION', icon: 'bi-bullseye', items: [] },
    WORK: { category: 'WORK', icon: 'bi-briefcase', items: [] },
    CONTENT: { category: 'CONTENT', icon: 'bi-file-text', items: [] },
    LAYOUT: { category: 'LAYOUT', icon: 'bi-layout-text-window-reverse', items: [] },
  };

  Object.values(PAGE_SECTION_TYPES).forEach((item) => {
    const catKey = item.category || 'CONTENT';
    if (!categoryMeta[catKey]) {
      categoryMeta[catKey] = { category: catKey, icon: 'bi-folder', items: [] };
    }
    categoryMeta[catKey].items.push({
      type: item.type,
      name: item.label,
      description: item.description,
      icon: item.icon,
      editable: Boolean(item.hasEditor),
    });
  });

  return Object.values(categoryMeta).filter((c) => c.items.length > 0);
}

/**
 * Safely normalizes raw JSON config to match the controlled section schema defaults.
 */
export function normalizeSectionConfig(sectionType, rawConfig = {}) {
  const type = String(sectionType || '').toLowerCase().trim();
  const schema = PAGE_SECTION_TYPES[type];
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

  if (type === 'image') {
    // Support either src or imageUrl seamlessly
    if (!config.src && config.imageUrl) config.src = config.imageUrl;
    if (!config.imageUrl && config.src) config.imageUrl = config.src;
  }

  if (type === 'gallery') {
    if (!Array.isArray(config.images)) config.images = [];
  }

  if (type === 'metrics') {
    if (!Array.isArray(config.metrics)) config.metrics = [];
  }

  if (type === 'timeline') {
    if (!Array.isArray(config.items)) config.items = [];
  }

  if (type === 'workflow') {
    if (!Array.isArray(config.steps)) config.steps = [];
  }

  if (type === 'project_list') {
    if (!Array.isArray(config.projects)) config.projects = [];
  }

  if (type === 'spacer') {
    config.height = Number(config.height) || 40;
  }

  return config;
}

/**
 * Validates a section config using its registered validator.
 */
export function validateSection(sectionType, config = {}) {
  const type = String(sectionType || '').toLowerCase().trim();
  const schema = PAGE_SECTION_TYPES[type];
  if (!schema || typeof schema.validate !== 'function') {
    return { valid: true, errors: [], advisories: [] };
  }
  return schema.validate(config);
}

/**
 * Creates a default section object with unique ID, type, is_visible, and default props.
 */
export function createDefaultSection(type, customProps = {}) {
  const schema = PAGE_SECTION_TYPES[type];
  const defaults = schema?.defaultConfig ? JSON.parse(JSON.stringify(schema.defaultConfig)) : {};
  return {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    is_visible: true,
    props: { ...defaults, ...customProps },
  };
}

