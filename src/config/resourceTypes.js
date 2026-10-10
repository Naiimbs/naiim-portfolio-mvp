/**
 * Centralized Resource Types Registry
 * Defines all supported first-class Resource types across CMS and Public interfaces.
 */

export const RESOURCE_TYPES = {
  skill: {
    id: 'skill',
    label: 'Agent Skill',
    pluralLabel: 'Skills',
    icon: 'bi-cpu',
    color: '#087f66',
    bg: 'rgba(8, 127, 102, 0.12)',
    description: 'Autonomous agent capability bundles with SKILL.md, tools, and execution workflows.',
    expectedAssetTypes: ['source', 'documentation', 'script', 'template', 'screenshot', 'output', 'example'],
    defaultBadge: 'Skill',
  },
  template: {
    id: 'template',
    label: 'Template',
    pluralLabel: 'Templates',
    icon: 'bi-layout-text-window-reverse',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    description: 'Reusable boilerplates, starter kits, and structured file templates.',
    expectedAssetTypes: ['template', 'documentation', 'source', 'example'],
    defaultBadge: 'Template',
  },
  figma: {
    id: 'figma',
    label: 'Figma File',
    pluralLabel: 'Figma',
    icon: 'bi-figma',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    description: 'Figma UI kits, design system component libraries, and canvas plugins.',
    expectedAssetTypes: ['reference', 'attachment', 'screenshot', 'documentation'],
    defaultBadge: 'Figma',
  },
  document: {
    id: 'document',
    label: 'Document / Report',
    pluralLabel: 'Documents',
    icon: 'bi-file-earmark-pdf',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.12)',
    description: 'Technical reports, heuristic audits, research papers, and whitepapers.',
    expectedAssetTypes: ['documentation', 'output', 'reference', 'attachment'],
    defaultBadge: 'Document',
  },
  guide: {
    id: 'guide',
    label: 'Guide & Playbook',
    pluralLabel: 'Guides',
    icon: 'bi-journal-code',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    description: 'Comprehensive tutorials, operational playbooks, and architectural guidelines.',
    expectedAssetTypes: ['documentation', 'example', 'reference'],
    defaultBadge: 'Guide',
  },
  prompt: {
    id: 'prompt',
    label: 'System Prompt',
    pluralLabel: 'Prompts',
    icon: 'bi-chat-square-quote',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    description: 'Curated LLM system prompts, agent instructions, and chain-of-thought protocols.',
    expectedAssetTypes: ['documentation', 'example', 'reference'],
    defaultBadge: 'Prompt',
  },
  example: {
    id: 'example',
    label: 'Example / Artifact',
    pluralLabel: 'Examples',
    icon: 'bi-collection-play',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    description: 'Reference implementations, interactive demos, and real-world sample artifacts.',
    expectedAssetTypes: ['example', 'output', 'screenshot', 'attachment'],
    defaultBadge: 'Example',
  },
  spreadsheet: {
    id: 'spreadsheet',
    label: 'Spreadsheet / Model',
    pluralLabel: 'Spreadsheets',
    icon: 'bi-file-earmark-spreadsheet',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
    description: 'Audit trackers, QA workbooks, calculation models, and evaluation matrices.',
    expectedAssetTypes: ['template', 'output', 'documentation', 'example'],
    defaultBadge: 'Spreadsheet',
  },
  file: {
    id: 'file',
    label: 'File / Archive',
    pluralLabel: 'Files',
    icon: 'bi-file-earmark-zip',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    description: 'Standalone downloadable assets, source code archives, and utility scripts.',
    expectedAssetTypes: ['source', 'attachment', 'reference'],
    defaultBadge: 'File',
  },
  reference: {
    id: 'reference',
    label: 'Reference / Link',
    pluralLabel: 'References',
    icon: 'bi-link-45deg',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.12)',
    description: 'External standards, official specifications, API docs, and repository references.',
    expectedAssetTypes: ['reference', 'documentation'],
    defaultBadge: 'Reference',
  },
};

export const RESOURCE_TYPE_LIST = Object.values(RESOURCE_TYPES);

export const ASSET_TYPES = {
  documentation: { label: 'Documentation', icon: 'bi-file-text', color: '#0284c7' },
  template: { label: 'Template', icon: 'bi-layout-text-window', color: '#3b82f6' },
  script: { label: 'Script / Code', icon: 'bi-code-slash', color: '#8b5cf6' },
  example: { label: 'Example / Output', icon: 'bi-file-earmark-check', color: '#059669' },
  screenshot: { label: 'Screenshot / Visual', icon: 'bi-image', color: '#ec4899' },
  source: { label: 'Source Bundle', icon: 'bi-file-earmark-zip', color: '#d97706' },
  attachment: { label: 'Attachment', icon: 'bi-paperclip', color: '#64748b' },
  reference: { label: 'Reference', icon: 'bi-link-45deg', color: '#14b8a6' },
};

export function getResourceTypeConfig(typeId) {
  return RESOURCE_TYPES[typeId] || RESOURCE_TYPES.file;
}

export function getAssetTypeConfig(typeId) {
  return ASSET_TYPES[typeId] || ASSET_TYPES.attachment;
}
