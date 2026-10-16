/**
 * customCssFormatter.js
 * Lightweight, zero-dependency CSS beautifier and formatter.
 *
 * Requirements:
 * - Normalizes indentation (2 spaces)
 * - Properly indents nested blocks (@media, @supports, @keyframes)
 * - Keeps comments intact
 * - Fast, deterministic, and safe (no external bundle bloat)
 */

export function formatCssCode(rawCss = '') {
  if (typeof rawCss !== 'string' || !rawCss.trim()) return '';

  const css = rawCss.trim();

  // 1. Temporarily protect comments
  const comments = [];
  const withProtectedComments = css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    comments.push(match.trim());
    return `___CSS_COMMENT_${comments.length - 1}___`;
  });

  // 2. Normalize whitespace around structural tokens: { } ;
  let normalized = withProtectedComments
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*/g, ';\n');

  const lines = normalized.split('\n');
  let indentLevel = 0;
  const resultLines = [];

  const getIndent = (lvl) => '  '.repeat(Math.max(0, lvl));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle closing brace: un-indent first
    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Format line with current indent
    resultLines.push(getIndent(indentLevel) + line);

    // Handle opening brace: indent following lines
    if (line.endsWith('{')) {
      indentLevel++;
    }

    // Insert an empty line after closing brace if followed by another rule
    if (line === '}' && indentLevel === 0 && i < lines.length - 1) {
      resultLines.push('');
    }
  }

  // 3. Restore comments
  let output = resultLines.join('\n');
  comments.forEach((comment, idx) => {
    output = output.replace(`___CSS_COMMENT_${idx}___`, comment);
  });

  return output.trim() + '\n';
}
