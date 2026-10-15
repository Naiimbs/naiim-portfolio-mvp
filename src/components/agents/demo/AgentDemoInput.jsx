import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AgentDemoInput({
  input,
  setInput,
  onRun,
  loading,
  disabled,
  placeholder,
  suggestions = [],
  maxLength = 1000,
}) {
  const { t } = useTranslation();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && !disabled && input.trim()) {
      onRun(input.trim());
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    if (!loading && !disabled) {
      onRun(text);
    }
  };

  return (
    <div className="agent-demo-input-card">
      <form onSubmit={handleSubmit}>
        <label htmlFor="agentInput" className="agent-demo-label">
          <span>{t('agents.demo.promptLabel')}</span>
          <span className="text-muted small font-monospace">
            {input.length}/{maxLength}
          </span>
        </label>

        <div className="agent-demo-textarea-wrap">
          <textarea
            id="agentInput"
            rows="3"
            className="form-control agent-demo-textarea"
            placeholder={placeholder || t('agents.demo.inputPlaceholder')}
            value={input}
            maxLength={maxLength}
            disabled={loading || disabled}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          ></textarea>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small text-muted d-none d-md-block">
            <i className="bi bi-info-circle me-1"></i> {t('agents.demo.pressKey')} <kbd>Enter</kbd> {t('agents.demo.toRun')} <kbd>Shift + Enter</kbd> {t('agents.demo.forNewline')}
          </div>

          <button
            type="submit"
            disabled={loading || disabled || !input.trim()}
            className="btn btn-dark rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>{t('agents.demo.executing')}</span>
              </>
            ) : (
              <>
                <i className="bi bi-play-fill fs-5"></i>
                <span>{t('agents.demo.run')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Quick Prompts */}
      {suggestions.length > 0 && (
        <div className="agent-demo-suggestions mt-4">
          <div className="suggestion-label">{t('agents.demo.examples')}</div>
          <div className="suggestion-pill-row">
            {suggestions.map((item, idx) => {
              const text = typeof item === 'string' ? item : item.text || item.question;
              return (
                <button
                  key={idx}
                  type="button"
                  className="suggestion-pill"
                  disabled={loading || disabled}
                  onClick={() => handleSuggestion(text)}
                >
                  <i className="bi bi-chat-right-text me-1"></i> {text}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
