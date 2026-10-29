import React, { useEffect, useState } from 'react';
import { updateContentRegistryEntry } from '../../../services/contentRegistry';
import {
  LEARNING_LANGUAGES,
  LEARNING_FORMATS,
  LEARNING_EXPERIENCE_METADATA_KEY,
  mergeLearningExperienceMetadata,
  normalizeLearningExperienceMetadata,
} from '../../../utils/learningExperience';

const LANGUAGE_LABELS = { en: 'English', fr: 'Français', ar: 'العربية' };

export default function LearningExperienceOverviewEditor({ page, onSaved }) {
  const registryEntry = page?.registryEntry;
  const [form, setForm] = useState(() => normalizeLearningExperienceMetadata(registryEntry?.metadata?.[LEARNING_EXPERIENCE_METADATA_KEY]));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm(normalizeLearningExperienceMetadata(registryEntry?.metadata?.[LEARNING_EXPERIENCE_METADATA_KEY]));
    setDirty(false);
    setError('');
    setSuccess('');
  }, [page?.id, registryEntry?.id]);

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!registryEntry?.id) {
      setError('This page has no linked Content Registry entry. Save/synchronize the page first; no metadata was written.');
      return;
    }
    if (page.status === 'published' || registryEntry.status === 'published' || registryEntry.visibility === 'public') {
      setError('To avoid publishing metadata changes immediately, first set this page to Draft in Page Settings and save it.');
      return;
    }

    setSaving(true);
    setError('');
    const metadata = mergeLearningExperienceMetadata(registryEntry.metadata || {}, form);
    const result = await updateContentRegistryEntry(registryEntry.id, { metadata });
    setSaving(false);
    if (result.error || !result.data) {
      setError(result.error?.message || 'The learning overview could not be saved.');
      return;
    }
    setForm(normalizeLearningExperienceMetadata(result.data.metadata?.[LEARNING_EXPERIENCE_METADATA_KEY]));
    setDirty(false);
    setSuccess('Learning overview saved to the linked Content Registry entry.');
    onSaved?.(result.data);
  };

  const isPublished = page?.status === 'published' || registryEntry?.status === 'published' || registryEntry?.visibility === 'public';

  return (
    <div className="p-3">
      <h2 className="h6 fw-bold mb-1">Learning experience overview</h2>
      <p className="text-muted small mb-3">Title, slug, status, and template stay on the Page Builder page. These learning-specific fields are stored under the linked Content Registry entry’s metadata JSONB.</p>

      {isPublished && <div className="alert alert-warning py-2 small" role="alert">This experience is published. Set it to Draft in Page Settings before changing metadata, so the update is not exposed immediately.</div>}
      {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
      {success && <div className="alert alert-success py-2 small" role="status">{success}</div>}

      <form onSubmit={handleSave}>
        <label className="form-label small fw-semibold w-100">Short description
          <textarea className="form-control form-control-sm rounded-3 mt-1" rows="3" value={form.description} onChange={(event) => update({ description: event.target.value })} placeholder="A practical workshop for art and design students…" />
        </label>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold w-100">Format
              <select className="form-select form-select-sm mt-1" value={form.format} onChange={(event) => update({ format: event.target.value })}>
                {LEARNING_FORMATS.map((format) => <option value={format} key={format}>{format === 'course' ? 'Course' : 'Workshop'}</option>)}
              </select>
            </label>
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold w-100">Primary language
              <select className="form-select form-select-sm mt-1" value={form.primaryLanguage} onChange={(event) => update({ primaryLanguage: event.target.value })}>
                {LEARNING_LANGUAGES.map((language) => <option value={language} key={language}>{LANGUAGE_LABELS[language]}</option>)}
              </select>
            </label>
          </div>
        </div>

        <label className="form-label small fw-semibold w-100">Learning objectives (one per line)
          <textarea className="form-control form-control-sm rounded-3 mt-1" rows="4" value={form.objectives.join('\n')} onChange={(event) => update({ objectives: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="Move from an initial idea to a testable MVP\nUse AI tools to support product thinking and building" />
        </label>

        <label className="form-label small fw-semibold w-100">Intended audience
          <input className="form-control form-control-sm rounded-3 mt-1" value={form.intendedAudience} onChange={(event) => update({ intendedAudience: event.target.value })} placeholder="Art and design students at Beaux-Arts Nabeul" />
        </label>

        <label className="form-label small fw-semibold w-100">Estimated duration
          <input className="form-control form-control-sm rounded-3 mt-1" value={form.estimatedDuration} onChange={(event) => update({ estimatedDuration: event.target.value })} placeholder="e.g. 1 day · 6 hours" />
        </label>

        <div className="d-flex justify-content-end border-top pt-3 mt-2">
          <button type="submit" className="btn btn-sm btn-primary rounded-pill px-4" disabled={!dirty || saving || isPublished}>
            {saving ? 'Saving…' : 'Save learning overview'}
          </button>
        </div>
      </form>
    </div>
  );
}
