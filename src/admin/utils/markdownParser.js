export function parseMarkdownSkill(content) {
  const result = {
    title: '',
    version: '',
    description: '',
    tags: [],
    purpose: '',
    when_to_use: [],
    when_not_to_use: [],
    how_to_use: '',
    installation: '',
    compatibility: [],
    requirements: '',
    workflow: ''
  };

  // 1. Parse YAML frontmatter if present
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yaml = yamlMatch[1];
    yaml.split('\n').forEach(line => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length > 0) {
        const val = rest.join(':').trim();
        if (key.trim() === 'name' || key.trim() === 'title') result.title = val.replace(/^['"]|['"]$/g, '');
        if (key.trim() === 'version') result.version = val.replace(/^['"]|['"]$/g, '');
        if (key.trim() === 'description') result.description = val.replace(/^['"]|['"]$/g, '');
      }
    });
    // Extract tags from YAML (simple array parse)
    const tagsMatch = yaml.match(/tags:\n((?:  - .*\n?)*)/);
    if (tagsMatch) {
      result.tags = tagsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace('-', '').trim());
    }
  }

  // 2. Parse Markdown Headings
  if (!result.title) {
    const h1Match = content.match(/^#\s+(.*)/m);
    if (h1Match) result.title = h1Match[1].trim();
  }

  // Helper to extract content under a specific h2/h3 heading until the next heading
  const extractSection = (headingRegex) => {
    // We look for the heading, then capture everything until the next # heading or end of file
    const regex = new RegExp(`^#{2,3}\\s+${headingRegex}\\s*\\n([\\s\\S]*?)(?=^#|$)`, 'im');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  result.purpose = extractSection('(?:Purpose|Overview|Summary)');
  if (!result.description && result.purpose) {
    result.description = result.purpose;
  }

  result.how_to_use = extractSection('(?:Usage|How to use|Execution Protocol)');
  result.installation = extractSection('(?:Installation|Setup|Setup Instructions)');
  result.requirements = extractSection('(?:Requirements|Prerequisites)');
  result.workflow = extractSection('(?:Workflow|Pipeline)');

  // Extract lists for when_to_use and when_not_to_use
  const whenToUseRaw = extractSection('When to use');
  if (whenToUseRaw) {
    result.when_to_use = whenToUseRaw.split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  }

  const whenNotToUseRaw = extractSection('When NOT to use');
  if (whenNotToUseRaw) {
    result.when_not_to_use = whenNotToUseRaw.split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  }

  return result;
}
