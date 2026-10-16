import React, { useRef, useMemo, useEffect } from 'react';
import { formatCssCode } from '../../../ui/theme/customCssFormatter';

const SNIPPET_TEMPLATES = [
  {
    label: 'Glow Effect Badge',
    code: `/* Interactive Glow Effect */\n.hero-badge-glow {\n  box-shadow: 0 0 20px rgba(8, 127, 102, 0.45);\n  transition: box-shadow 0.3s ease;\n}\n\n.hero-badge-glow:hover {\n  box-shadow: 0 0 30px rgba(8, 127, 102, 0.7);\n}`,
  },
  {
    label: 'Glassmorphism Card',
    code: `/* Glassmorphic Surface */\n.custom-glass-card {\n  background: rgba(255, 255, 255, 0.06);\n  backdrop-filter: blur(14px);\n  -webkit-backdrop-filter: blur(14px);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  border-radius: 1rem;\n}`,
  },
  {
    label: 'Mobile Viewport Rule',
    code: `/* Mobile Viewport Customization */\n@media (max-width: 768px) {\n  .preview-container {\n    padding-left: 16px !important;\n    padding-right: 16px !important;\n  }\n}`,
  },
  {
    label: 'Dark Mode Surface Override',
    code: `/* Dark Surface Palette Override */\nbody {\n  background-color: #0d1117 !important;\n  color: #f0f6fc !important;\n}\n\n.preview-card {\n  background: #161b22 !important;\n  border-color: #30363d !important;\n  color: #f0f6fc !important;\n}`,
  },
];

/**
 * CustomCssCodeEditor
 * Enhanced monospaced code editor with:
 * - Line numbers gutter synchronized on scroll
 * - Tab indentation support (2 spaces)
 * - Safe CSS formatter tool
 * - Pre-built snippet insertion
 * - Responsive layout for desktop and mobile
 */
export default function CustomCssCodeEditor({
  value = '',
  onChange,
  error,
  warnings = [],
  disabled = false,
}) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Calculate lines for gutter
  const lineCount = useMemo(() => {
    return Math.max(1, (value || '').split('\n').length);
  }, [value]);

  const lineNumbersArray = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [lineCount]);

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard navigation & indentation handling
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = value || '';

      if (!e.shiftKey) {
        // Insert 2 spaces
        const updated = currentVal.substring(0, start) + '  ' + currentVal.substring(end);
        onChange(updated);
        // Advance cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      } else {
        // Shift + Tab: un-indent up to 2 spaces before cursor
        if (start >= 2 && currentVal.substring(start - 2, start) === '  ') {
          const updated = currentVal.substring(0, start - 2) + currentVal.substring(start);
          onChange(updated);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }, 0);
        } else if (start >= 1 && currentVal.substring(start - 1, start) === ' ') {
          const updated = currentVal.substring(0, start - 1) + currentVal.substring(start);
          onChange(updated);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 1;
          }, 0);
        }
      }
    }
  };

  // Format CSS handler
  const handleFormat = () => {
    if (!value || !value.trim()) return;
    const formatted = formatCssCode(value);
    if (formatted !== value) {
      onChange(formatted);
    }
  };

  // Insert snippet handler
  const handleInsertSnippet = (snippetCode) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((value ? value + '\n\n' : '') + snippetCode);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';

    const prefix = currentVal ? (start > 0 && currentVal[start - 1] !== '\n' ? '\n\n' : '\n') : '';
    const updated = currentVal.substring(0, start) + prefix + snippetCode + '\n' + currentVal.substring(end);
    onChange(updated);
  };

  return (
    <div className="custom-css-code-editor d-flex flex-column h-100">
      {/* Editor Toolbar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 p-2 bg-light rounded-3 border">
        <div className="d-flex align-items-center gap-2">
          <span className="small fw-semibold text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-code me-1 text-primary"></i>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {value?.length || 0} chars
          </span>
          {error ? (
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.68rem' }}>
              <i className="bi bi-x-circle me-1"></i>Syntax Error
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
              <i className="bi bi-check-circle me-1"></i>Syntax Valid
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-1">
          {/* Quick Snippets Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-xs btn-outline-secondary py-1 px-2 rounded-2 dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ fontSize: '0.72rem' }}
              disabled={disabled}
            >
              <i className="bi bi-plus-circle me-1"></i>Snippets
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 small">
              <li><h6 className="dropdown-header small text-uppercase">Insert Template</h6></li>
              {SNIPPET_TEMPLATES.map((tmpl) => (
                <li key={tmpl.label}>
                  <button
                    type="button"
                    className="dropdown-item py-1 small"
                    onClick={() => handleInsertSnippet(tmpl.code)}
                  >
                    {tmpl.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Format CSS Button */}
          <button
            type="button"
            className="btn btn-xs btn-outline-primary py-1 px-2 rounded-2"
            onClick={handleFormat}
            disabled={disabled || !value.trim()}
            title="Auto-format and beautify CSS indentation"
            style={{ fontSize: '0.72rem' }}
          >
            <i className="bi bi-magic me-1"></i>Format CSS
          </button>
        </div>
      </div>

      {/* Validation Diagnostic Alerts */}
      {error && (
        <div className="alert alert-danger p-2 mb-2 rounded-3 small d-flex align-items-start gap-2" role="alert" style={{ fontSize: '0.78rem' }}>
          <i className="bi bi-exclamation-octagon-fill text-danger fs-6 mt-0 flex-shrink-0" />
          <div>
            <strong>Validation Error:</strong> {error}
          </div>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="alert alert-warning py-1 px-2 mb-2 rounded-2 small d-flex align-items-center gap-2" role="alert" style={{ fontSize: '0.72rem' }}>
          <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0" />
          <span>{warnings.join(' ')}</span>
        </div>
      )}

      {/* Editor Body with Synchronized Line Numbers */}
      <div
        className={`code-editor-shell flex-grow-1 position-relative d-flex rounded-3 overflow-hidden border ${
          error ? 'border-danger' : 'border-secondary-subtle'
        }`}
        style={{
          backgroundColor: '#12161a',
          minHeight: '380px',
        }}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="line-gutter user-select-none text-end py-3 pe-2 ps-2 font-monospace"
          style={{
            backgroundColor: '#1a2026',
            color: '#5c6f84',
            fontSize: '0.82rem',
            lineHeight: '1.45',
            minWidth: lineCount >= 100 ? '42px' : '34px',
            overflowY: 'hidden',
            fontFamily: '"Space Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          aria-hidden="true"
        >
          {lineNumbersArray.map((n) => (
            <div key={n} style={{ height: '1.189rem' }}>
              {n}
            </div>
          ))}
        </div>

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          rows={14}
          className="form-control border-0 rounded-0 bg-transparent text-light p-3 flex-grow-1 font-monospace shadow-none"
          placeholder={`/* Example custom CSS rules */\n.my-custom-section {\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(12px);\n  border-radius: 1rem;\n}\n\n.hero-badge-glow {\n  box-shadow: 0 0 20px rgba(13, 110, 253, 0.4);\n}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            fontSize: '0.82rem',
            lineHeight: '1.45',
            resize: 'none',
            outline: 'none',
            fontFamily: '"Space Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            tabSize: 2,
          }}
        />
      </div>

      {/* Editor Sub-Footer / Keyboard Shortcuts Helper */}
      <div className="d-flex flex-wrap justify-content-between align-items-center text-muted px-1 mt-1" style={{ fontSize: '0.7rem' }}>
        <span>
          <kbd className="bg-dark text-light border me-1">Tab</kbd> Indent 2 spaces ·
          <kbd className="bg-dark text-light border ms-1 me-1">Shift+Tab</kbd> Outdent
        </span>
        <span>
          <i className="bi bi-shield-lock me-1 text-success"></i>Admin protected
        </span>
      </div>
    </div>
  );
}
