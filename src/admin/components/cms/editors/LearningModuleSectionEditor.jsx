import React, { useMemo, useState } from 'react';
import {
  LEARNING_CONTENT_BLOCK_TYPES,
  createLearningContentBlock,
  createLearningId,
  createLearningQuizQuestion,
  moveLearningItem,
  normalizeLearningModule,
} from '../../../../utils/learningExperience';

function TextInput({ label, value, onChange, multiline = false, rows = 3, placeholder = '' }) {
  const Component = multiline ? 'textarea' : 'input';
  return (
    <label className="form-label small fw-semibold w-100">
      {label}
      <Component
        className="form-control form-control-sm rounded-3 mt-1"
        value={value || ''}
        rows={multiline ? rows : undefined}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function LearningModuleSectionEditor({ config = {}, onChange }) {
  const normalized = useMemo(() => normalizeLearningModule(config), [config]);
  const [newBlockType, setNewBlockType] = useState('instruction');

  const update = (patch) => onChange({ ...normalized, ...patch });
  const updateBlock = (blockId, patch) => update({
    contentBlocks: normalized.contentBlocks.map((block) => block.id === blockId ? { ...block, ...patch } : block),
  });
  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= normalized.contentBlocks.length) return;
    const blocks = moveLearningItem(normalized.contentBlocks, index, target);
    update({ contentBlocks: blocks });
  };
  const updateQuestion = (questionId, patch) => update({
    quiz: {
      ...normalized.quiz,
      questions: normalized.quiz.questions.map((question) => question.id === questionId ? { ...question, ...patch } : question),
    },
  });
  const addQuestion = () => update({ quiz: { ...normalized.quiz, questions: [...normalized.quiz.questions, createLearningQuizQuestion()] } });

  return (
    <div className="p-3">
      <div className="alert alert-info py-2 small">
        <i className="bi bi-info-circle me-1" /> Structured content saves with this ordered module. Draft authoring only; learner quiz interactions are part of the next phase.
      </div>

      <TextInput label="Module title" value={normalized.title} onChange={(value) => update({ title: value })} placeholder="e.g. 01 · Find the real problem" />
      <TextInput label="Short description" value={normalized.description} onChange={(value) => update({ description: value })} multiline rows={2} placeholder="What this module covers" />
      <TextInput
        label="Learning objectives (one per line)"
        value={normalized.objectives.join('\n')}
        onChange={(value) => update({ objectives: value.split('\n').map((item) => item.trim()).filter(Boolean) })}
        multiline rows={3}
        placeholder="Identify a specific user problem\nTurn observations into a testable opportunity"
      />

      <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
        <h6 className="fw-bold small text-uppercase mb-0">Ordered learning content</h6>
        <span className="text-muted small">{normalized.contentBlocks.length} blocks</span>
      </div>
      <div className="input-group input-group-sm mb-2">
        <select className="form-select" value={newBlockType} onChange={(event) => setNewBlockType(event.target.value)} aria-label="Content block type">
          {LEARNING_CONTENT_BLOCK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button type="button" className="btn btn-outline-primary" onClick={() => update({ contentBlocks: [...normalized.contentBlocks, createLearningContentBlock(newBlockType)] })}>
          <i className="bi bi-plus-lg me-1" /> Add block
        </button>
      </div>

      {normalized.contentBlocks.map((block, index) => {
        const blockType = LEARNING_CONTENT_BLOCK_TYPES.find((item) => item.value === block.type)?.label || 'Content';
        return (
          <div className="border rounded-3 bg-light p-2 mb-2" key={block.id}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-white text-secondary border">{index + 1}. {blockType}</span>
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-sm btn-light py-0" disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label={`Move ${blockType} up`}><i className="bi bi-chevron-up" /></button>
                <button type="button" className="btn btn-sm btn-light py-0" disabled={index === normalized.contentBlocks.length - 1} onClick={() => moveBlock(index, 1)} aria-label={`Move ${blockType} down`}><i className="bi bi-chevron-down" /></button>
                <button type="button" className="btn btn-sm btn-link text-danger py-0" onClick={() => update({ contentBlocks: normalized.contentBlocks.filter((item) => item.id !== block.id) })} aria-label={`Delete ${blockType}`}><i className="bi bi-trash" /></button>
              </div>
            </div>
            <TextInput label="Heading (optional)" value={block.title} onChange={(value) => updateBlock(block.id, { title: value })} />
            {block.type === 'resource' ? (
              <>
                <TextInput label="Resource URL" value={block.url} onChange={(value) => updateBlock(block.id, { url: value })} placeholder="https://… or /resources/template.pdf" />
                <TextInput label="Link description (optional)" value={block.text} onChange={(value) => updateBlock(block.id, { text: value })} multiline rows={2} placeholder="What learners will find at this link" />
              </>
            ) : (
              <TextInput label={block.type === 'code' ? 'Code / text' : 'Content (Markdown supported)'} value={block.text} onChange={(value) => updateBlock(block.id, { text: value })} multiline rows={block.type === 'code' ? 5 : 4} placeholder={block.type === 'activity' ? 'Describe the practical exercise and expected output' : 'Add the instructional content'} />
            )}
          </div>
        );
      })}
      {normalized.contentBlocks.length === 0 && <p className="text-muted small border rounded-3 p-3 bg-light">Add instructional content, examples, exercises, prompts, resources, or a recap.</p>}

      <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-4 mb-2">
        <h6 className="fw-bold small text-uppercase mb-0">Optional practice QCM</h6>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addQuestion}><i className="bi bi-plus-lg me-1" /> Add question</button>
      </div>
      <p className="text-muted small">Questions and answer feedback are stored as practice content. The public interactive quiz is not part of this phase.</p>

      {normalized.quiz.questions.map((question, questionIndex) => (
        <div className="border rounded-3 p-2 mb-3" key={question.id}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong className="small">Question {questionIndex + 1}</strong>
            <button
              type="button"
              className="btn btn-sm btn-link text-danger"
              onClick={() => update({ quiz: { ...normalized.quiz, questions: normalized.quiz.questions.filter((item) => item.id !== question.id) } })}
              aria-label={`Delete question ${questionIndex + 1}`}
            ><i className="bi bi-trash" /></button>
          </div>
          <TextInput label="Question" value={question.prompt} onChange={(value) => updateQuestion(question.id, { prompt: value })} multiline rows={2} placeholder="What should a useful MVP validate first?" />
          <div className="small fw-semibold mb-1">Answer options <span className="text-muted fw-normal">(select the correct option)</span></div>
          {question.options.map((option, optionIndex) => (
            <div className="input-group input-group-sm mb-2" key={option.id}>
              <span className="input-group-text bg-white">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctOptionId === option.id}
                  onChange={() => updateQuestion(question.id, { correctOptionId: option.id })}
                  aria-label={`Mark option ${optionIndex + 1} correct`}
                />
              </span>
              <input
                className="form-control"
                value={option.text}
                onChange={(event) => updateQuestion(question.id, { options: question.options.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item) })}
                placeholder={`Option ${optionIndex + 1}`}
                aria-label={`Answer option ${optionIndex + 1}`}
              />
              {question.options.length > 2 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => {
                    const options = question.options.filter((item) => item.id !== option.id);
                    const correctOptionId = question.correctOptionId === option.id ? options[0]?.id || '' : question.correctOptionId;
                    updateQuestion(question.id, { options, correctOptionId });
                  }}
                  aria-label={`Remove option ${optionIndex + 1}`}
                ><i className="bi bi-x-lg" /></button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-link px-0"
            onClick={() => updateQuestion(question.id, { options: [...question.options, { id: createLearningId('option'), text: '' }] })}
          ><i className="bi bi-plus-lg me-1" /> Add answer option</button>
          <TextInput label="Answer explanation" value={question.explanation} onChange={(value) => updateQuestion(question.id, { explanation: value })} multiline rows={2} placeholder="Explain why this is the best answer" />
        </div>
      ))}
    </div>
  );
}
