/**
 * customCssFormatter.js
 * Lightweight, zero-dependency CSS beautifier and formatter.
 *
 * Requirements:
 * - Normalizes indentation (2 spaces)
 * - Properly indents nested blocks (@media, @supports, @keyframes)
 * - Keeps comments intact
 * - Preserves url(...) contents including data URIs and https URLs
 * - Does NOT mangle pseudo-selectors (a:hover, p::before, :root, ::after)
 * - Fast, deterministic, and safe (no external bundle bloat)
 *
 * Phase 5 Fix: resolved two confirmed bugs:
 *  1. Pseudo-selectors like "a:hover" were formatted as "a: hover {" (wrong space).
 *  2. Data URIs "url(data:image/svg+xml;base64,...)" were split at the colon.
 */

export function formatCssCode(rawCss = '') {
  if (typeof rawCss !== 'string' || !rawCss.trim()) return '';

  const css = rawCss.trim();

  // 1. Temporarily protect block comments /* ... */
  const comments = [];
  let withProtected = css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    comments.push(match.trim());
    return `___CSS_COMMENT_${comments.length - 1}___`;
  });

  // 2. Temporarily protect url(...) values to avoid corruption of colons and
  //    semicolons inside data URIs and external URLs.
  const urlTokens = [];
  withProtected = withProtected.replace(/url\([^)]*\)/gi, (match) => {
    urlTokens.push(match);
    return `___CSS_URL_${urlTokens.length - 1}___`;
  });

  // 3. Temporarily protect quoted strings ("..." and '...') to protect
  //    semicolons, braces, or colons inside attribute selectors or content properties.
  const stringTokens = [];
  withProtected = withProtected.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (match) => {
    stringTokens.push(match);
    return `___CSS_STR_${stringTokens.length - 1}___`;
  });

  // 4. Normalize feature queries in parentheses like (max-width:768px) -> (max-width: 768px)
  withProtected = withProtected.replace(/\(\s*([a-zA-Z0-9_-]+)\s*:\s*([^)]+?)\s*\)/g, '($1: $2)');

  // 5. Ensure missing final semicolon before closing brace is added.
  let normalized = withProtected.replace(/([^;{}\s]+(?:\s+[^;{}\s]+)*)\s*\}/g, '$1;\n}');

  // 6. Normalize whitespace around structural tokens: { } ;
  normalized = normalized
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*/g, ';\n');

  // 7. Ensure protected comments are placed on their own lines if adjacent to code
  normalized = normalized
    .replace(/(^|[^\s\n])(\s*___CSS_COMMENT_\d+___)/g, '$1\n$2')
    .replace(/(___CSS_COMMENT_\d+___)(\s*[^\s\n])/g, '$1\n$2');

  // 8. Line-by-line indentation pass
  const lines = normalized.split('\n');
  let indentLevel = 0;
  const resultLines = [];

  const getIndent = (lvl) => '  '.repeat(Math.max(0, lvl));

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Handle closing brace: un-indent first
    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Format property declarations spacing: ensure space after colon
    const isDeclaration =
      indentLevel > 0 &&
      line.endsWith(';') &&
      !line.includes('{') &&
      !line.includes('}') &&
      !line.startsWith('@');

    if (isDeclaration) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const beforeColon = line.substring(0, colonIndex).trim();
        const afterColon = line.substring(colonIndex + 1).trim();
        const isCssPropName = /^-{0,2}[a-zA-Z_][a-zA-Z0-9_-]*$/.test(beforeColon);
        if (isCssPropName) {
          line = `${beforeColon}: ${afterColon}`;
        }
      }
    }

    // Format line with current indent
    resultLines.push(getIndent(indentLevel) + line);

    // Handle opening brace: indent following lines
    if (line.endsWith('{')) {
      indentLevel++;
    }

    // Insert an empty line after a top-level closing brace for readability
    if (line === '}' && indentLevel === 0 && i < lines.length - 1) {
      resultLines.push('');
    }
  }

  // 9. Restore tokens in reverse order: strings, URLs, then comments
  let output = resultLines.join('\n');
  stringTokens.forEach((str, idx) => {
    output = output.replaceAll(`___CSS_STR_${idx}___`, str);
  });
  urlTokens.forEach((url, idx) => {
    output = output.replaceAll(`___CSS_URL_${idx}___`, url);
  });
  comments.forEach((comment, idx) => {
    output = output.replaceAll(`___CSS_COMMENT_${idx}___`, comment);
  });

  return output.trim() + '\n';
}
