import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { answerFor } from './copilotMock';

// The `question` values are the lookup keys for the mock knowledge base
// (answerFor), so they stay in English; only the displayed text is translated.
const SUGGESTION_QUESTIONS = [
  "What are Naïm's strongest skills?",
  'Show me relevant projects.',
  'What AI tools does he use?',
  'Is Naïm available for a project?',
  'Why should I work with Naïm?',
];

export default function CopilotWidget() {
  const { t, i18n } = useTranslation();
  const suggestionTexts = t('copilot.suggestions', { returnObjects: true }) || [];
  const [userMsg, setUserMsg] = useState(t('copilot.defaultUser'));
  const [aiMsg, setAiMsg] = useState(t('copilot.defaultAi'));
  const [inputValue, setInputValue] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sync default welcome messages if the user hasn't started their own conversation
  React.useEffect(() => {
    if (!hasInteracted) {
      setUserMsg(t('copilot.defaultUser'));
      setAiMsg(t('copilot.defaultAi'));
    }
  }, [i18n.language, hasInteracted, t]);

  const handleAsk = (displayQuestion, lookupKey) => {
    const cleanDisplay = (displayQuestion || '').trim();
    if (!cleanDisplay) return;

    setHasInteracted(true);
    setUserMsg(cleanDisplay);
    setAiMsg(t('copilot.thinking'));
    setInputValue('');

    setTimeout(() => {
      setAiMsg(answerFor(lookupKey || cleanDisplay, i18n.language));
    }, 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAsk(inputValue, inputValue);
  };

  return (
    <div className="feature-card copilot-card h-100">
      <div className="feature-head">
        <div className="feature-icon green">
          <i className="bi bi-stars"></i>
        </div>
        <div>
          <div className="feature-kicker">{t('copilot.kicker')}</div>
          <h2>
            Naïm Copilot <span>AI</span>
          </h2>
          <p>{t('copilot.subtitle')}</p>
        </div>
        <span className="online-dot">● {t('copilot.online')}</span>
      </div>

      <div className="chat-layout">
        <div className="chat-window">
          <div className="chat-message user-msg" id="userMessage">
            {userMsg}
          </div>
          <div className="chat-message ai-msg" id="aiMessage">
            {aiMsg}
          </div>

          <form onSubmit={handleSubmit} className="chat-input">
            <input
              id="copilotInput"
              type="text"
              placeholder={t('copilot.inputPlaceholder')}
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button id="copilotSend" type="submit" aria-label={t('copilot.send')}>
              <i className="bi bi-arrow-up"></i>
            </button>
          </form>
        </div>

        <div className="suggestions">
          <small>{t('copilot.tryAsking')}</small>
          {SUGGESTION_QUESTIONS.map((question, index) => {
            const label = suggestionTexts[index] || question;
            return (
              <button
                key={index}
                type="button"
                data-question={question}
                onClick={() => handleAsk(label, question)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="powered-note">
        <i className="bi bi-diagram-3"></i> {t('copilot.poweredNote')}
      </div>
    </div>
  );
}
