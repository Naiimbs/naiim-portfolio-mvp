export const RESOURCE_TYPE_DETAILS = {
  skill: {
    title: 'Agent Skill details',
    description: 'Define the capability, execution workflow, installation, and compatible agent environments.',
    fields: [
      { key: 'compatibility', label: 'Compatible environments', type: 'compatibility', help: 'List the agents, IDEs, or runtimes that can execute this skill.' },
    ],
  },
  template: {
    title: 'Template details',
    description: 'Describe what the starter kit contains and how another person should adapt it.',
    fields: [
      { key: 'template_format', label: 'Template format', type: 'select', options: ['Starter kit', 'Boilerplate', 'Checklist', 'Document template', 'Code template', 'Design template'] },
      { key: 'framework', label: 'Framework / tool', type: 'text', placeholder: 'React, Figma, Notion, Excel…' },
      { key: 'included_files', label: 'Included files or sections', type: 'textarea', rows: 4, placeholder: 'One item per line' },
      { key: 'setup_instructions', label: 'Setup and customization instructions', type: 'markdown', rows: 6 },
    ],
  },
  figma: {
    title: 'Figma file details',
    description: 'Connect the source file and explain what is included in the design system or UI kit.',
    fields: [
      { key: 'figma_url', label: 'Figma file URL', type: 'url', required: true, placeholder: 'https://www.figma.com/file/…' },
      { key: 'figma_embed', label: 'Figma embed URL', type: 'url', placeholder: 'https://www.figma.com/embed?embed_host=share&url=…' },
      { key: 'figma_file_key', label: 'Figma file key', type: 'text', placeholder: 'Optional API file key' },
      { key: 'design_scope', label: 'Design scope', type: 'textarea', rows: 3, placeholder: 'Pages, components, tokens, flows…' },
      { key: 'access_requirements', label: 'Access requirements', type: 'textarea', rows: 3, placeholder: 'View, duplicate, edit, or community access notes' },
    ],
  },
  document: {
    title: 'Document / report details',
    description: 'Capture publication context so visitors understand the format, provenance, and intended use.',
    fields: [
      { key: 'document_format', label: 'Document format', type: 'select', options: ['PDF', 'DOCX', 'Markdown', 'HTML', 'Presentation', 'Other'] },
      { key: 'document_category', label: 'Document category', type: 'text', placeholder: 'Audit report, whitepaper, research note…' },
      { key: 'page_count', label: 'Page count', type: 'number', placeholder: '10' },
      { key: 'publication_date', label: 'Publication date', type: 'date' },
      { key: 'citation', label: 'Citation / provenance', type: 'textarea', rows: 3, placeholder: 'Source, client, edition, or attribution details' },
    ],
  },
  guide: {
    title: 'Guide & playbook details',
    description: 'Make the learning path explicit: audience, prerequisites, effort, and expected outcome.',
    fields: [
      { key: 'audience', label: 'Intended audience', type: 'text', placeholder: 'Product designers, founders, developers…' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
      { key: 'estimated_time', label: 'Estimated completion time', type: 'text', placeholder: '30 minutes, 2 hours…' },
      { key: 'prerequisites', label: 'Prerequisites', type: 'textarea', rows: 3, placeholder: 'One prerequisite per line' },
      { key: 'learning_outcomes', label: 'Learning outcomes', type: 'textarea', rows: 4, placeholder: 'One outcome per line' },
    ],
  },
  prompt: {
    title: 'System prompt details',
    description: 'Document model compatibility, variables, examples, and safe operating boundaries.',
    fields: [
      { key: 'prompt_format', label: 'Prompt format', type: 'select', options: ['System prompt', 'Agent instructions', 'Workflow prompt', 'Evaluation prompt', 'Prompt template'] },
      { key: 'model_compatibility', label: 'Model compatibility', type: 'text', placeholder: 'GPT-4.1, Claude, Gemini, model-agnostic…' },
      { key: 'variables', label: 'Variables / inputs', type: 'textarea', rows: 3, placeholder: 'One variable per line, e.g. {{product_url}}' },
      { key: 'example_input', label: 'Example input', type: 'textarea', rows: 4 },
      { key: 'example_output', label: 'Example output', type: 'textarea', rows: 4 },
      { key: 'safety_notes', label: 'Safety and usage notes', type: 'textarea', rows: 3 },
    ],
  },
  example: {
    title: 'Example / artifact details',
    description: 'Explain the demonstrated outcome and provide a live demo or implementation context when available.',
    fields: [
      { key: 'demo_url', label: 'Live demo URL', type: 'url', placeholder: 'https://…' },
      { key: 'implementation_status', label: 'Implementation status', type: 'select', options: ['Concept', 'Prototype', 'Beta', 'Production', 'Archived'] },
      { key: 'stack', label: 'Technology / stack', type: 'text', placeholder: 'React, Supabase, Python…' },
      { key: 'outcome', label: 'Outcome demonstrated', type: 'textarea', rows: 4, placeholder: 'What should the visitor learn or verify from this artifact?' },
    ],
  },
  spreadsheet: {
    title: 'Spreadsheet / model details',
    description: 'Describe the workbook structure, compatible tools, and what the model calculates or tracks.',
    fields: [
      { key: 'spreadsheet_format', label: 'Spreadsheet format', type: 'select', options: ['XLSX', 'CSV', 'Google Sheets', 'Airtable', 'Other'] },
      { key: 'compatible_tools', label: 'Compatible tools', type: 'text', placeholder: 'Excel, Google Sheets, LibreOffice…' },
      { key: 'sheet_names', label: 'Sheet names', type: 'textarea', rows: 3, placeholder: 'One sheet per line' },
      { key: 'model_purpose', label: 'Model purpose / calculations', type: 'textarea', rows: 4 },
      { key: 'sample_data_notes', label: 'Sample data and update notes', type: 'textarea', rows: 3 },
    ],
  },
  file: {
    title: 'File / archive details',
    description: 'Identify the downloadable file and give visitors enough information to use it safely.',
    fields: [
      { key: 'file_format', label: 'File format', type: 'text', placeholder: 'ZIP, PDF, JSON, PY…' },
      { key: 'platform', label: 'Target platform', type: 'text', placeholder: 'Windows, macOS, Linux, browser…' },
      { key: 'checksum', label: 'Checksum (optional)', type: 'text', placeholder: 'SHA-256…' },
      { key: 'usage_notes', label: 'Usage notes', type: 'textarea', rows: 4 },
    ],
  },
  reference: {
    title: 'Reference / link details',
    description: 'Capture the canonical external source, authority, version, and access notes.',
    fields: [
      { key: 'official_url', label: 'Canonical / official URL', type: 'url', required: true, placeholder: 'https://…' },
      { key: 'reference_type', label: 'Reference type', type: 'select', options: ['Official documentation', 'Standard', 'API reference', 'Repository', 'Article', 'Tool', 'Other'] },
      { key: 'provider', label: 'Publisher / provider', type: 'text', placeholder: 'W3C, GitHub, OpenAI…' },
      { key: 'reference_version', label: 'Referenced version', type: 'text', placeholder: 'v1.2, 2026 edition…' },
      { key: 'access_notes', label: 'Access notes', type: 'textarea', rows: 3, placeholder: 'Authentication, license, or access limitations' },
    ],
  },
};

export function getResourceTypeDetails(type) {
  return RESOURCE_TYPE_DETAILS[type] || RESOURCE_TYPE_DETAILS.file;
}

export function validateTypeSpecificFields(type, metadata = {}) {
  const details = getResourceTypeDetails(type);
  const missing = details.fields
    .filter((field) => field.required && !String(metadata[field.key] || '').trim())
    .map((field) => field.label);
  return missing;
}
