import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Markdown from '../components/cms/Markdown';
import { isSafeLearningResourceUrl } from '../utils/learningExperience';
import {
  getLearningModules,
  getLearningExperienceMetadata,
  getLearningQuizFeedback,
  getLearningProgressPercent,
} from '../utils/learningExperiencePlayer';
import '../styles/learning-experience.css';

const BLOCK_LABELS = {
  instruction: 'Lesson',
  example: 'Example',
  activity: 'Practical activity',
  prompt: 'Prompt',
  code: 'Code / text',
  resource: 'Resource',
  recap: 'Recap',
};

const LANGUAGE_LABELS = { en: 'English', fr: 'French', ar: 'Arabic' };

function asText(value) {
  return typeof value === 'string' ? value : '';
}

function getFeedbackResult(question, selectedOptionId) {
  const feedback = getLearningQuizFeedback(question, selectedOptionId);
  const fallbackCorrect = selectedOptionId === question?.correctOptionId;
  const isCorrect = typeof feedback === 'boolean'
    ? feedback
    : Boolean(feedback?.isCorrect ?? feedback?.correct ?? fallbackCorrect);
  const answerValue = feedback?.correctAnswer ?? feedback?.answer;
  const correctAnswer = typeof answerValue === 'string'
    ? answerValue
    : answerValue?.text || question?.options?.find((option) => option.id === question?.correctOptionId)?.text || '';
  return { isCorrect, correctAnswer, explanation: asText(question?.explanation) };
}

function ResourceLink({ block }) {
  if (!isSafeLearningResourceUrl(block?.url)) return null;
  const href = String(block.url).trim();
  const externalHttps = /^https:\/\//i.test(href);
  return (
    <a
      className="learning-resource-link"
      href={href}
      target={externalHttps ? '_blank' : undefined}
      rel={externalHttps ? 'noreferrer' : undefined}
    >
      <span aria-hidden="true" className="learning-resource-icon">↗</span>
      <span>{block.title || href}</span>
      {externalHttps && <span className="visually-hidden"> (opens in a new tab)</span>}
    </a>
  );
}

function LearningBlock({ block, index, isLastModule, isLastActivity, isLastRecap }) {
  const type = block?.type;
  const label = isLastModule && isLastActivity
    ? 'Final challenge'
    : isLastModule && isLastRecap
      ? 'Workshop recap'
      : BLOCK_LABELS[type] || 'Learning content';
  const headingId = `learning-block-title-${block?.id || index}`;

  return (
    <section className={`learning-content-block learning-content-block--${type || 'default'}`} aria-labelledby={block?.title ? headingId : undefined}>
      <div className="learning-block-kicker">{label}</div>
      {block?.title && <h3 className="learning-block-title" id={headingId}>{block.title}</h3>}
      {type === 'code' ? (
        block.text ? <pre className="learning-code"><code>{block.text}</code></pre> : null
      ) : type === 'resource' ? (
        <>
          {block.text && <Markdown className="learning-prose" text={block.text} />}
          <ResourceLink block={block} />
        </>
      ) : (
        block?.text && <Markdown className="learning-prose" text={block.text} />
      )}
    </section>
  );
}

function QuizQuestion({ question, moduleId, questionIndex, answer, onSelect, onCheck }) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const feedback = answer?.checked ? getFeedbackResult(question, answer.selectedOptionId) : null;
  const groupId = `learning-question-${moduleId}-${question?.id || questionIndex}`;

  return (
    <fieldset className="learning-quiz-question">
      <legend className="learning-quiz-prompt">
        <span className="learning-quiz-number">Question {questionIndex + 1}</span>
        {question?.prompt}
      </legend>
      <div className="learning-quiz-options">
        {options.map((option, optionIndex) => {
          const inputId = `${groupId}-option-${option?.id || optionIndex}`;
          const isCorrectOption = answer?.checked && option.id === question?.correctOptionId;
          const isChosenWrong = answer?.checked && option.id === answer.selectedOptionId && !feedback?.isCorrect;
          return (
            <label className={`learning-quiz-option${isCorrectOption ? ' is-correct' : ''}${isChosenWrong ? ' is-incorrect' : ''}`} htmlFor={inputId} key={option?.id || optionIndex}>
              <input
                id={inputId}
                type="radio"
                name={groupId}
                value={option?.id || ''}
                checked={answer?.selectedOptionId === option?.id}
                onChange={() => onSelect(question, option?.id)}
              />
              <span>{option?.text}</span>
            </label>
          );
        })}
      </div>
      <div className="learning-quiz-actions">
        <button
          type="button"
          className="btn learning-button learning-button--secondary"
          onClick={() => onCheck(question)}
          disabled={!answer?.selectedOptionId}
          aria-label={`${answer?.checked ? 'Check updated answer for' : 'Check answer for'} question ${questionIndex + 1}`}
        >
          {answer?.checked ? 'Check updated answer' : 'Check answer'}
        </button>
        {!answer?.selectedOptionId && <span className="learning-quiz-hint">Choose an answer to continue.</span>}
      </div>
      {feedback && (
        <div className={`learning-answer-feedback ${feedback.isCorrect ? 'is-correct' : 'is-incorrect'}`} role="status" aria-live="polite">
          <strong>{feedback.isCorrect ? 'That’s correct.' : 'Not quite.'}</strong>
          <p><span className="fw-semibold">Correct answer:</span> {feedback.correctAnswer || 'The correct answer is marked above.'}</p>
          {feedback.explanation && <div className="learning-feedback-explanation"><Markdown text={feedback.explanation} /></div>}
        </div>
      )}
    </fieldset>
  );
}

export default function LearningExperiencePage({ page, sections = [], language = 'en', preview = false }) {
  const lang = String(language || 'en').split('-')[0].toLowerCase();
  const direction = lang === 'ar' ? 'rtl' : 'ltr';
  const registryEntry = page?.registryEntry || page?.registry_entry || page?.registry || null;
  const metadata = useMemo(
    () => getLearningExperienceMetadata(registryEntry, lang) || {},
    [registryEntry, lang],
  );
  const modules = useMemo(
    () => getLearningModules(Array.isArray(sections) ? sections : [], lang, Boolean(preview)) || [],
    [sections, lang, preview],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState(() => new Set());
  const [answers, setAnswers] = useState({});
  const moduleHeadingRef = useRef(null);
  const modulePaneRef = useRef(null);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, modules.length - 1)));
    const validIds = new Set(modules.map((module, index) => String(module?.id ?? index)));
    setCompletedIds((current) => new Set([...current].filter((id) => validIds.has(id))));
    setAnswers((current) => Object.fromEntries(Object.entries(current).filter(([id]) => validIds.has(id))));
  }, [modules]);

  const activeModule = modules[activeIndex] || null;
  const activeId = activeModule ? String(activeModule.id ?? activeIndex) : '';
  const completedCount = modules.reduce((count, module, index) => count + (completedIds.has(String(module?.id ?? index)) ? 1 : 0), 0);
  const progress = getLearningProgressPercent(modules.length, completedCount);
  const allComplete = modules.length > 0 && completedCount === modules.length;
  const title = metadata.title || page?.title || page?.name || 'Learning experience';
  const description = metadata.description || page?.description || '';
  const objectives = Array.isArray(metadata.objectives) ? metadata.objectives.filter(Boolean) : [];
  const moduleConfig = activeModule?.config || {};
  const blocks = Array.isArray(moduleConfig.contentBlocks) ? moduleConfig.contentBlocks : [];
  const questions = Array.isArray(moduleConfig.quiz?.questions) ? moduleConfig.quiz.questions : [];
  const moduleAnswers = answers[activeId] || {};
  const checkedAnswers = Object.values(moduleAnswers).filter((answer) => answer?.checked);
  const correctAnswers = checkedAnswers.filter((answer) => answer.correct).length;

  const moveToModule = (nextIndex, shouldFocus = true) => {
    if (nextIndex < 0 || nextIndex >= modules.length) return;
    setActiveIndex(nextIndex);
    if (!shouldFocus) return;
    window.requestAnimationFrame(() => {
      moduleHeadingRef.current?.focus({ preventScroll: true });
      modulePaneRef.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  };

  const updateAnswer = (question, patch) => {
    const questionId = String(question?.id || 'question');
    setAnswers((current) => ({
      ...current,
      [activeId]: {
        ...(current[activeId] || {}),
        [questionId]: { ...(current[activeId]?.[questionId] || {}), ...patch },
      },
    }));
  };

  const selectAnswer = (question, optionId) => updateAnswer(question, { selectedOptionId: optionId, checked: false, correct: false });
  const checkAnswer = (question) => {
    const answer = moduleAnswers[String(question?.id || 'question')];
    if (!answer?.selectedOptionId) return;
    const result = getFeedbackResult(question, answer.selectedOptionId);
    updateAnswer(question, { checked: true, correct: result.isCorrect });
  };

  const markComplete = () => {
    if (!activeModule) return;
    setCompletedIds((current) => new Set(current).add(activeId));
  };

  const getBlockPositionFlags = (index, type) => ({
    isLastActivity: type === 'activity' && !blocks.slice(index + 1).some((block) => block.type === 'activity'),
    isLastRecap: type === 'recap' && !blocks.slice(index + 1).some((block) => block.type === 'recap'),
  });

  const formatLabel = metadata.format === 'course' ? 'Course' : metadata.format === 'workshop' ? 'Workshop' : '';
  const duration = asText(metadata.estimatedDuration);
  const audience = asText(metadata.intendedAudience);
  const primaryLanguage = LANGUAGE_LABELS[metadata.primaryLanguage] || metadata.primaryLanguage || LANGUAGE_LABELS[lang] || lang.toUpperCase();

  return (
    <div className="learning-experience-page" dir={direction} lang={lang}>
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <main className="learning-experience-shell container-fluid">
        <header className="learning-course-header">
          <div className="learning-course-copy">
            <div className="learning-eyebrow"><span aria-hidden="true" /> Learning experience</div>
            <h1 className="learning-course-title">{title}</h1>
            {description && <Markdown className="learning-course-description" text={description} />}
            <div className="learning-course-meta" aria-label="Course details">
              {formatLabel && <span className="learning-meta-chip"><span aria-hidden="true">◇</span>{formatLabel}</span>}
              {duration && <span className="learning-meta-chip"><span aria-hidden="true">◷</span>{duration}</span>}
              <span className="learning-meta-chip"><span aria-hidden="true">◎</span>{primaryLanguage}</span>
              {audience && <span className="learning-meta-chip"><span aria-hidden="true">◌</span>{audience}</span>}
            </div>
          </div>
          {objectives.length > 0 && (
            <section className="learning-objectives-card" aria-labelledby="learning-objectives-title">
              <div className="learning-card-kicker">Your learning outcomes</div>
              <h2 id="learning-objectives-title">What you’ll be able to do</h2>
              <ul>{objectives.map((objective, index) => <li key={`${index}-${objective}`}>{objective}</li>)}</ul>
            </section>
          )}
        </header>

        <div className="learning-session-note" role="note">
          <span aria-hidden="true" className="learning-session-note-icon">↻</span>
          <p><strong>Session-only progress.</strong> Your completion and quiz answers stay in this page session only; reloading resets them. Nothing is saved to an account or device.</p>
        </div>

        {modules.length === 0 ? (
          <section className="learning-empty-state" aria-labelledby="learning-empty-title">
            <div className="learning-empty-icon" aria-hidden="true">＋</div>
            <h2 id="learning-empty-title">Modules are not available yet</h2>
            <p>This learning experience does not have any visible modules to display.</p>
          </section>
        ) : (
          <div className="learning-player-layout">
            <aside className="learning-outline" aria-label="Course progress and module outline">
              <div className="learning-outline-heading">
                <div>
                  <div className="learning-card-kicker">Your path</div>
                  <h2>Modules</h2>
                </div>
                <span className="learning-module-count">{completedCount}/{modules.length}</span>
              </div>
              <div className="learning-progress-copy">
                <span>Course progress</span><strong>{progress}%</strong>
              </div>
              <div className="progress learning-progress-track" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <nav aria-label="Module outline">
                <ol className="learning-module-list">
                  {modules.map((module, index) => {
                    const moduleId = String(module?.id ?? index);
                    const isCurrent = index === activeIndex;
                    const isComplete = completedIds.has(moduleId);
                    const moduleTitle = module?.config?.title || module?.label || `Module ${index + 1}`;
                    return (
                      <li key={moduleId}>
                        <button
                          type="button"
                          className={`learning-module-nav${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
                          onClick={() => moveToModule(index)}
                          aria-current={isCurrent ? 'step' : undefined}
                          aria-controls="learning-module-panel"
                          aria-label={`Module ${index + 1}: ${moduleTitle}${isComplete ? ', completed' : ''}${isCurrent ? ', current module' : ''}`}
                        >
                          <span className="learning-module-step" aria-hidden="true">{isComplete ? '✓' : String(index + 1).padStart(2, '0')}</span>
                          <span className="learning-module-nav-copy">
                            <span className="learning-module-name">{moduleTitle}</span>
                            <span className="learning-module-status">{isComplete ? 'Completed' : isCurrent ? 'In progress' : 'Not started'}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
              <p className="learning-outline-footnote">Choose any module to review or continue.</p>
            </aside>

            <div className="learning-main-column">
              {allComplete && (
                <section className="learning-completion-card" aria-labelledby="learning-completion-title" role="status">
                  <div className="learning-completion-mark" aria-hidden="true">✓</div>
                  <div>
                    <div className="learning-card-kicker">Course complete</div>
                    <h2 id="learning-completion-title">You’ve completed this {formatLabel.toLowerCase() || 'learning experience'}.</h2>
                    <p>Well done. You can return to any module from the outline to review the material.</p>
                    {objectives.length > 0 && <ul className="learning-completion-objectives">{objectives.map((objective, index) => <li key={`${index}-${objective}`}>{objective}</li>)}</ul>}
                    <button type="button" className="btn learning-button learning-button--secondary" onClick={() => moveToModule(0)}>Review from the beginning</button>
                  </div>
                </section>
              )}

              <article className="learning-module-panel" id="learning-module-panel" ref={modulePaneRef} aria-labelledby="learning-module-heading">
                <header className="learning-module-header">
                  <div className="learning-module-header-top">
                    <span className="learning-module-index">Module {activeIndex + 1} of {modules.length}</span>
                    {completedIds.has(activeId) && <span className="learning-complete-pill"><span aria-hidden="true">✓</span> Completed</span>}
                  </div>
                  <h2 id="learning-module-heading" className="learning-module-title" ref={moduleHeadingRef} tabIndex={-1}>{moduleConfig.title || activeModule?.label || `Module ${activeIndex + 1}`}</h2>
                  {moduleConfig.description && <Markdown className="learning-module-description" text={moduleConfig.description} />}
                </header>

                {Array.isArray(moduleConfig.objectives) && moduleConfig.objectives.filter(Boolean).length > 0 && (
                  <section className="learning-module-objectives" aria-label="Module learning objectives">
                    <h3>In this module</h3>
                    <ul>{moduleConfig.objectives.filter(Boolean).map((objective, index) => <li key={`${index}-${objective}`}>{objective}</li>)}</ul>
                  </section>
                )}

                {blocks.length > 0 ? (
                  <div className="learning-content-stack">
                    {blocks.map((block, index) => {
                      const flags = getBlockPositionFlags(index, block?.type);
                      return <LearningBlock key={block?.id || index} block={block} index={index} isLastModule={activeIndex === modules.length - 1} {...flags} />;
                    })}
                  </div>
                ) : (
                  <p className="learning-no-content">This module does not have any instructional content yet.</p>
                )}

                {questions.length > 0 && (
                  <section className="learning-quiz" aria-labelledby="learning-quiz-title">
                    <div className="learning-quiz-header">
                      <div><div className="learning-card-kicker">Knowledge check</div><h3 id="learning-quiz-title">Practice questions</h3></div>
                      <span className="learning-quiz-score" aria-live="polite">{correctAnswers}/{questions.length} correct{checkedAnswers.length > 0 ? ` · ${checkedAnswers.length} checked` : ''}</span>
                    </div>
                    <div className="learning-quiz-list">
                      {questions.map((question, index) => (
                        <QuizQuestion
                          key={question?.id || index}
                          question={question}
                          moduleId={activeId}
                          questionIndex={index}
                          answer={moduleAnswers[String(question?.id || 'question')]}
                          onSelect={selectAnswer}
                          onCheck={checkAnswer}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <div className="learning-module-actions">
                  <button type="button" className="btn learning-button learning-button--secondary" onClick={() => moveToModule(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Go to previous module">
                    <span aria-hidden="true">{direction === 'rtl' ? '→' : '←'}</span> Previous module
                  </button>
                  <div className="learning-module-actions-end">
                    {!completedIds.has(activeId) && (
                      <button type="button" className="btn learning-button learning-button--primary" onClick={markComplete} aria-label={`Mark module ${activeIndex + 1} complete`}>
                        Mark complete <span aria-hidden="true">✓</span>
                      </button>
                    )}
                    <button type="button" className="btn learning-button learning-button--primary" onClick={() => moveToModule(activeIndex + 1)} disabled={activeIndex === modules.length - 1} aria-label="Go to next module">
                      Next module <span aria-hidden="true">{direction === 'rtl' ? '←' : '→'}</span>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
