/**
 * Minimal YAML front-matter parser for blog article imports.
 * Supports `key: value` pairs and simple block lists:
 *   tags:
 *     - A
 *     - B
 * Returns { frontMatter, body }. A leading H1 in the body (which usually
 * duplicates the title) is stripped.
 */
function stripQuotes(v) {
  const s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export function parseFrontMatter(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const fm = {};
  let body = src;

  const m = src.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (m) {
    body = m[2];
    const lines = m[1].split(/\r?\n/);
    let listKey = null;
    for (const raw of lines) {
      if (!raw.trim()) continue;
      const item = raw.match(/^\s*-\s+(.*)$/);
      if (item && listKey) {
        fm[listKey].push(stripQuotes(item[1]));
        continue;
      }
      const kv = raw.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (kv) {
        const key = kv[1];
        const val = kv[2];
        if (val === '') {
          fm[key] = [];
          listKey = key;
        } else {
          fm[key] = stripQuotes(val);
          listKey = null;
        }
      }
    }
  }

  // Drop a leading top-level "# Heading" that duplicates the title.
  body = body.replace(/^\s*#\s+.*\r?\n+/, '').trimStart();
  return { frontMatter: fm, body };
}
