export const RESOURCE_EDITOR_CONFIG = {
  skill: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'skill', label: 'Skill', icon: 'bi-robot' },
      { id: 'typeDetails', label: 'Skill Details', icon: 'bi-sliders' },
      { id: 'reusableFiles', label: 'Reusable Files', icon: 'bi-files' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  template: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Template Details', icon: 'bi-layout-text-window-reverse' },
      { id: 'reusableFiles', label: 'Template Files', icon: 'bi-files' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  document: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Document Details', icon: 'bi-file-earmark-text' },
      { id: 'reusableFiles', label: 'Document Files', icon: 'bi-file-earmark-pdf' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  figma: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Figma Details', icon: 'bi-palette' },
      { id: 'source', label: 'Figma URLs', icon: 'bi-palette' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  guide: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Guide Details', icon: 'bi-journal-code' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  prompt: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Prompt Details', icon: 'bi-chat-square-quote' },
      { id: 'reusableFiles', label: 'Prompt Files', icon: 'bi-terminal' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  example: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Artifact Details', icon: 'bi-collection-play' },
      { id: 'reusableFiles', label: 'Files', icon: 'bi-files' },
      { id: 'evidence', label: 'Evidence', icon: 'bi-images' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  spreadsheet: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Model Details', icon: 'bi-file-earmark-spreadsheet' },
      { id: 'reusableFiles', label: 'Spreadsheet Files', icon: 'bi-file-earmark-spreadsheet' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  file: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'File Details', icon: 'bi-file-earmark' },
      { id: 'reusableFiles', label: 'Files', icon: 'bi-file-earmark' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  reference: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Reference Details', icon: 'bi-link-45deg' },
      { id: 'source', label: 'Reference URLs', icon: 'bi-link-45deg' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  },
  _fallback: {
    sections: [
      { id: 'basics', label: 'Basics', icon: 'bi-card-heading' },
      { id: 'typeDetails', label: 'Type Details', icon: 'bi-sliders' },
      { id: 'source', label: 'Source', icon: 'bi-diagram-3' },
      { id: 'translations', label: 'Translations', icon: 'bi-translate' },
      { id: 'publishing', label: 'Publishing', icon: 'bi-globe' },
    ]
  }
};

export function getEditorSectionsForType(type) {
  return RESOURCE_EDITOR_CONFIG[type] || RESOURCE_EDITOR_CONFIG['_fallback'];
}
