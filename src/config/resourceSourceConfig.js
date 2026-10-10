export const RESOURCE_SOURCE_CONFIG = {
  skill: {
    sourceKinds: ['bundle', 'file', 'repository', 'url'],
    tabs: ['basics', 'skill', 'reusable_files', 'evidence', 'source', 'publishing'],
  },
  template: {
    sourceKinds: ['file', 'url'],
    tabs: ['basics', 'template', 'reusable_files', 'source', 'publishing'],
  },
  document: {
    sourceKinds: ['file', 'url'],
    tabs: ['basics', 'document', 'source', 'publishing'],
  },
  figma: {
    sourceKinds: ['figma', 'url'],
    tabs: ['basics', 'figma', 'source', 'evidence', 'publishing'],
  },
  guide: {
    sourceKinds: ['file', 'url'],
    tabs: ['basics', 'guide', 'evidence', 'source', 'publishing'],
  },
  prompt: {
    sourceKinds: ['file', 'text', 'url'],
    tabs: ['basics', 'prompt', 'reusable_files', 'source', 'publishing'],
  },
  spreadsheet: {
    sourceKinds: ['file'],
    tabs: ['basics', 'spreadsheet', 'reusable_files', 'source', 'publishing'],
  },
  file: {
    sourceKinds: ['file'],
    tabs: ['basics', 'file', 'source', 'publishing'],
  },
  reference: {
    sourceKinds: ['url', 'document', 'file'],
    tabs: ['basics', 'reference', 'source', 'publishing'],
  },
  example: {
    sourceKinds: ['file', 'url'],
    tabs: ['basics', 'example', 'source', 'publishing'],
  },
};

/**
 * Helper to get active tabs for a given resource type.
 */
export function getTabsForResourceType(typeId) {
  const cfg = RESOURCE_SOURCE_CONFIG[typeId] || RESOURCE_SOURCE_CONFIG.file;
  return cfg.tabs || ['basics', 'file', 'source', 'publishing'];
}

/**
 * Helper to get allowed source kinds for a given resource type.
 */
export function getSourceKindsForResourceType(typeId) {
  const cfg = RESOURCE_SOURCE_CONFIG[typeId] || RESOURCE_SOURCE_CONFIG.file;
  return cfg.sourceKinds || ['file'];
}
