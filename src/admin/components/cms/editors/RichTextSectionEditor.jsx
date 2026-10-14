import React, { useRef, useState } from 'react';
import Markdown from '../../../../components/cms/Markdown';

/**
 * Rich text (markdown) section editor.
 * A single markdown writing surface with a formatting toolbar and a live
 * preview toggle. The body is stored as markdown and rendered via the shared
 * Markdown component on the public site.
 */
export default function RichTextSectionEditor({ config = {}, onChange }) {
  const bodyRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const body = config.body || config.content || '';

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  // Wrap/insert markdown around the current selection in the body textarea.
  const applyMarkdown = (kind) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end);
    let before = body.slice(0, start);
    let after = body.slice(end);
    let inserted = selected;
    let caretOffset = 0;

    switch (kind) {
      case 'bold': inserted = `**${selected || 'bold text'}**`; break;
      case 'italic': inserted = `*${selected || 'italic text'}*`; break;
      case 'h2': {
        if (before && !before.endsWith('\n')) before += '\n';
        inserted = `## ${selected || 'Heading'}`;
        break;
      }
      case 'h3': {
        if (before && !before.endsWith('\n')) before += '\n';
        inserted = `### ${selected || 'Subheading'}`;
        break;
      }
      case 'ul': {
        if (before && !before.endsWith('\n')) before += '\n';
        inserted = (selected || 'List item').split('\n').map((l) => `- ${l}`).join('\n');
        break;
      }
      case 'ol': {
        if (before && !before.endsWith('\n')) before += '\n';
        inserted = (selected || 'List item').split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
        break;
      }
      case 'quote': {
        if (before && !before.endsWith('\n')) before += '\n';
        inserted = `> ${selected || 'Quote'}`;
        break;
      }
      case 'code': inserted = selected.includes('\n') ? `\n\`\`\`\n${selected || 'code'}\n\`\`\`\n` : `\`${selected || 'code'}\``; break;
      case 'link': {
        const url = window.prompt('Link URL', 'https://');
        if (!url) return;
        inserted = `[${selected || 'link text'}](${url})`;
        break;
      }
      default: break;
    }

    const next = `${before}${inserted}${after}`;
    handleChange('body', next);
    // Restore focus/caret after React re-render.
    const nextCaret = before.length + inserted.length + caretOffset;
    requestAnimationFrame(() => {
      el.focus();
      try { el.setSelectionRange(nextCaret, nextCaret); } catch { /* noop */ }
    });
  };

  const tools = [
    { kind: 'bold', icon: 'bi-type-bold', title: 'Bold' },
    { kind: 'italic', icon: 'bi-type-italic', title: 'Italic' },
    { kind: 'h2', icon: 'bi-type-h2', title: 'Heading 2' },
    { kind: 'h3', icon: 'bi-type-h3', title: 'Heading 3' },
    { kind: 'ul', icon: 'bi-list-ul', title: 'Bullet list' },
    { kind: 'ol', icon: 'bi-list-ol', title: 'Numbered list' },
    { kind: 'quote', icon: 'bi-quote', title: 'Quote' },
    { kind: 'code', icon: 'bi-code', title: 'Code' },
    { kind: 'link', icon: 'bi-link-45deg', title: 'Link' },
  ];

  return (
    <div className="rich-text-section-editor">
      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. BACKGROUND & APPROACH"
          value={config.eyebrow || ''}
          onChange={(e) => handleChange('eyebrow', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Section Title</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Design Philosophy"
          value={config.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="form-label small fw-semibold mb-0">Body (Markdown)</label>
          <div className="btn-group btn-group-sm" role="group">
            <button type="button" className={`btn btn-sm py-0 px-2 ${!preview ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setPreview(false)}>Write</button>
            <button type="button" className={`btn btn-sm py-0 px-2 ${preview ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setPreview(true)}>Preview</button>
          </div>
        </div>

        {!preview && (
          <>
            <div className="d-flex flex-wrap gap-1 mb-1">
              {tools.map((t) => (
                <button
                  key={t.kind}
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-0 px-2"
                  title={t.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyMarkdown(t.kind)}
                >
                  <i className={`bi ${t.icon}`}></i>
                </button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              className="form-control form-control-sm rounded-3 font-monospace"
              rows="12"
              placeholder={'Write your article in markdown…\n\n## A heading\n\nA paragraph with **bold**, *italic* and a [link](https://example.com).\n\n- bullet one\n- bullet two'}
              value={body}
              onChange={(e) => handleChange('body', e.target.value)}
              style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
            />
            <small className="text-muted">Markdown: `**bold**`, `*italic*`, `## heading`, `- list`, `[text](url)`, `` `code` ``.</small>
          </>
        )}

        {preview && (
          <div className="border rounded-3 p-3 bg-white" style={{ minHeight: '12rem' }}>
            {body ? <Markdown text={body} /> : <span className="text-muted small">Nothing to preview yet.</span>}
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Text Alignment</label>
        <select
          className="form-select form-select-sm rounded-3"
          value={config.alignment || 'left'}
          onChange={(e) => handleChange('alignment', e.target.value)}
        >
          <option value="left">Left Aligned</option>
          <option value="center">Centered</option>
          <option value="right">Right Aligned</option>
        </select>
      </div>
    </div>
  );
}
