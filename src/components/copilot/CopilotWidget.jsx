import React, { useState } from 'react';
import { answerFor } from './copilotMock';

const SUGGESTIONS = [
  { text: "What are Naïm's strongest skills?", question: "What are Naïm's strongest skills?" },
  { text: 'Show me relevant projects', question: 'Show me relevant projects.' },
  { text: 'What AI tools does he use?', question: 'What AI tools does he use?' },
  { text: 'Is he available for a project?', question: 'Is Naïm available for a project?' },
  { text: 'Why should I work with Naïm?', question: 'Why should I work with Naïm?' },
];

export default function CopilotWidget() {
  const [userMsg, setUserMsg] = useState('What kind of products does Naïm build?');
  const [aiMsg, setAiMsg] = useState(
    'Naïm builds digital products combining design, technology and AI, with a focus on usable experiences and real business impact. His work spans UX/UI, Product Design, AI-driven solutions, Low-Code and Product Operations.'
  );
  const [inputValue, setInputValue] = useState('');

  const handleAsk = (question) => {
    const clean = question.trim();
    if (!clean) return;

    setUserMsg(clean);
    setAiMsg('Thinking…');
    setInputValue('');

    setTimeout(() => {
      setAiMsg(answerFor(clean));
    }, 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAsk(inputValue);
  };

  return (
    <div className="feature-card copilot-card h-100">
      <div className="feature-head">
        <div className="feature-icon green">
          <i className="bi bi-stars"></i>
        </div>
        <div>
          <div className="feature-kicker">AI ASSISTANT</div>
          <h2>
            Naïm Copilot <span>AI</span>
          </h2>
          <p>Ask about my work, projects, skills and professional journey.</p>
        </div>
        <span className="online-dot">● Online</span>
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
              placeholder="Ask another question..."
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button id="copilotSend" type="submit" aria-label="Send">
              <i className="bi bi-arrow-up"></i>
            </button>
          </form>
        </div>

        <div className="suggestions">
          <small>TRY ASKING:</small>
          {SUGGESTIONS.map((item, index) => (
            <button
              key={index}
              type="button"
              data-question={item.question}
              onClick={() => handleAsk(item.question)}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      <div className="powered-note">
        <i className="bi bi-diagram-3"></i> Prototype UI · ready to connect to n8n
      </div>
    </div>
  );
}
