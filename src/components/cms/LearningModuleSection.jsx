import React from 'react';
import Markdown from './Markdown';
import { normalizeLearningModule, isSafeLearningResourceUrl } from '../../utils/learningExperience';

const BLOCK_LABELS = {
  instruction: 'Lesson',
  example: 'Example',
  activity: 'Practical exercise',
  prompt: 'Prompt',
  code: 'Code / text',
  resource: 'Resource',
  recap: 'Recap',
};

export default function LearningModuleSection({ config = {} }) {
  const module = normalizeLearningModule(config);
  return (
    <section className="cms-section py-4 learning-module-preview">
      <div className="container" style={{ maxWidth: '920px' }}>
        <article className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <header className="card-header bg-light border-0 px-4 py-3">
            <div className="small text-uppercase text-primary fw-bold mb-1">Learning module</div>
            <h2 className="h4 fw-bold mb-1">{module.title || 'Untitled module'}</h2>
            {module.description && <p className="text-muted mb-0">{module.description}</p>}
          </header>
          <div className="card-body p-4">
            {module.objectives.length > 0 && (
              <section className="mb-4" aria-label="Module objectives">
                <h3 className="h6 fw-bold">By the end of this module</h3>
                <ul className="mb-0">{module.objectives.map((objective, index) => <li key={`${index}-${objective}`}>{objective}</li>)}</ul>
              </section>
            )}
            <div className="d-flex flex-column gap-3">
              {module.contentBlocks.map((block, index) => (
                <section className="border-start border-3 border-primary ps-3 py-1" key={block.id || index}>
                  <div className="small text-uppercase text-muted fw-semibold mb-1">{BLOCK_LABELS[block.type] || 'Content'}</div>
                  {block.title && <h3 className="h6 fw-bold">{block.title}</h3>}
                  {block.type === 'code' ? (
                    <pre className="bg-dark text-light rounded-3 p-3 overflow-auto"><code>{block.text}</code></pre>
                  ) : block.type === 'resource' ? (
                    <>
                      {block.text && <Markdown text={block.text} />}
                      {isSafeLearningResourceUrl(block.url) && <a href={block.url} target={/^https?:\/\//i.test(block.url) ? '_blank' : undefined} rel="noreferrer" className="link-primary">{block.title || block.url}</a>}
                    </>
                  ) : <Markdown text={block.text} />}
                </section>
              ))}
            </div>
            {module.quiz.questions.length > 0 && (
              <section className="mt-4 border rounded-3 p-3 bg-light" aria-label="Practice quiz preview">
                <h3 className="h6 fw-bold"><i className="bi bi-patch-question me-2" />Practice QCM preview</h3>
                <p className="text-muted small mb-0">{module.quiz.questions.length} question{module.quiz.questions.length === 1 ? '' : 's'} configured. Interactive feedback is not included in this CMS-foundation phase.</p>
              </section>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
