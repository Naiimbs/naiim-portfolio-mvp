import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// GitHub-flavored markdown; single newlines become <br> for author-friendly prose.
marked.setOptions({ gfm: true, breaks: true });

/**
 * Render sanitized markdown to HTML.
 * Plain text (no markdown syntax) renders as normal paragraphs, so existing
 * plain-text bodies keep working.
 */
export default function Markdown({ text = '', className }) {
  const html = useMemo(() => {
    if (!text) return '';
    try {
      const raw = marked.parse(String(text));
      return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    } catch {
      return '';
    }
  }, [text]);

  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
