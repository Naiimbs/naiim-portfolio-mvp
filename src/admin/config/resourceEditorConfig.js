export const RESOURCE_EDITOR_CONFIG = {
  skill: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'skill', label: 'Skill', icon: 'bi-robot' },
      { id: 'reusableFiles', label: 'Reusable Files', icon: 'bi-files' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  template: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'reusableFiles', label: 'Template Files', icon: 'bi-files' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  document: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'reusableFiles', label: 'Document Files', icon: 'bi-file-earmark-pdf' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  figma: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'source', label: 'Figma URLs', icon: 'bi-palette' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  guide: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  prompt: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'reusableFiles', label: 'Prompt Files', icon: 'bi-terminal' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  spreadsheet: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'reusableFiles', label: 'Spreadsheet Files', icon: 'bi-file-earmark-spreadsheet' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  file: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'reusableFiles', label: 'Files', icon: 'bi-file-earmark' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  reference: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'source', label: 'Reference URLs', icon: 'bi-link-45deg' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  _fallback: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  }
};

export function getEditorSectionsForType(type) {
  return RESOURCE_EDITOR_CONFIG[type] || RESOURCE_EDITOR_CONFIG['_fallback'];
}
