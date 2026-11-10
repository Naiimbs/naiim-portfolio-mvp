import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const emptyLesson = { title: '', summary: '', duration_minutes: '10', body: '' };

export default function AcademyCurriculum() {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [lessonForms, setLessonForms] = useState({});
  const [editingLesson, setEditingLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCurriculum = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured in this environment.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [courseResult, moduleResult] = await Promise.all([
      supabase.from('academy_courses').select('*').eq('id', courseId).maybeSingle(),
      supabase.from('academy_modules').select('*').eq('course_id', courseId).order('position'),
    ]);
    if (courseResult.error || moduleResult.error) {
      const err = courseResult.error || moduleResult.error;
      setError(err.code === '42P01' || err.code === 'PGRST205'
        ? 'Academy tables are not installed yet. Apply the verified migrations before editing curriculum.'
        : err.message);
      setLoading(false);
      return;
    }
    setCourse(courseResult.data);
    setModules(moduleResult.data || []);
    if ((moduleResult.data || []).length) {
      const { data, error: lessonError } = await supabase
        .from('academy_lessons')
        .select('*')
        .in('module_id', moduleResult.data.map((item) => item.id))
        .order('position');
      if (lessonError) setError(lessonError.message);
      else setLessons(data || []);
    } else {
      setLessons([]);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { loadCurriculum(); }, [loadCurriculum]);

  const addModule = async (event) => {
    event.preventDefault();
    if (!moduleTitle.trim() || !supabase) return;
    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('academy_modules').insert({
      course_id: courseId,
      title: moduleTitle.trim(),
      description: moduleDescription.trim() || null,
      position: modules.length + 1,
    });
    if (insertError) setError(insertError.message);
    else {
      setModuleTitle('');
      setModuleDescription('');
      setNotice('Module added.');
      await loadCurriculum();
    }
    setSaving(false);
  };

  const addLesson = async (event, module) => {
    event.preventDefault();
    const form = lessonForms[module.id] || emptyLesson;
    if (!form.title.trim() || !supabase) return;
    setSaving(true);
    setError('');
    const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);
    const content = {
      schema_version: 1,
      blocks: form.body.trim()
        ? [{ type: 'paragraph', text: form.body.trim() }]
        : [],
    };
    const { error: insertError } = await supabase.from('academy_lessons').insert({
      module_id: module.id,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      duration_minutes: Number(form.duration_minutes) || null,
      position: moduleLessons.length + 1,
      status: 'draft',
      content,
    });
    if (insertError) setError(insertError.message);
    else {
      setLessonForms((current) => ({ ...current, [module.id]: emptyLesson }));
      setNotice('Lesson added as a draft.');
      await loadCurriculum();
    }
    setSaving(false);
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    if (!editingLesson || !supabase) return;
    setSaving(true);
    setError('');
    const content = {
      schema_version: 1,
      blocks: editingLesson.body.trim()
        ? [{ type: 'paragraph', text: editingLesson.body.trim() }]
        : [],
    };
    const { error: updateError } = await supabase.from('academy_lessons').update({
      title: editingLesson.title.trim(),
      summary: editingLesson.summary.trim() || null,
      duration_minutes: Number(editingLesson.duration_minutes) || null,
      content,
    }).eq('id', editingLesson.id);
    if (updateError) setError(updateError.message);
    else {
      setEditingLesson(null);
      setNotice('Lesson updated.');
      await loadCurriculum();
    }
    setSaving(false);
  };

  const setLessonForm = (moduleId, key, value) => {
    setLessonForms((current) => ({
      ...current,
      [moduleId]: { ...(current[moduleId] || emptyLesson), [key]: value },
    }));
  };

  const beginEditLesson = (lesson) => {
    const firstParagraph = (lesson.content?.blocks || []).find((block) => block.type === 'paragraph');
    setEditingLesson({
      id: lesson.id,
      title: lesson.title || '',
      summary: lesson.summary || '',
      duration_minutes: String(lesson.duration_minutes || 10),
      body: firstParagraph?.text || '',
    });
  };

  if (loading) {
    return <div className="container-fluid py-5 text-center text-secondary"><span className="spinner-border spinner-border-sm me-2" />Loading curriculum…</div>;
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="mb-4">
        <Link to="/admin/academy/courses" className="small text-secondary text-decoration-none">
          <i className="bi bi-arrow-left me-1" /> Courses
        </Link>
        <h1 className="h2 fw-bold mt-2 mb-1">{course?.title || 'Course curriculum'}</h1>
        <p className="text-secondary mb-0">Build the course structure with ordered modules and lessons. All new content starts as draft.</p>
      </div>

      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {!course && !error && <div className="alert alert-light border">Course not found.</div>}

      {course && (
        <>
          <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold mb-3">Add a module</h2>
              <form onSubmit={addModule}>
                <div className="row g-3">
                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="academy-module-title">Module title *</label>
                    <input id="academy-module-title" className="form-control" value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)} required maxLength={160} />
                  </div>
                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="academy-module-description">Description</label>
                    <input id="academy-module-description" className="form-control" value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)} maxLength={500} />
                  </div>
                  <div className="col-12 col-lg-2 d-flex align-items-end">
                    <button className="btn btn-success w-100" type="submit" disabled={saving}>Add module</button>
                  </div>
                </div>
              </form>
            </div>
          </section>

          {modules.length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5">
              <i className="bi bi-collection display-5 text-secondary" />
              <h2 className="h5 mt-3">No modules yet</h2>
              <p className="text-secondary mb-0">Add the first module to start building this course.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {modules.map((module, index) => {
                const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);
                const form = lessonForms[module.id] || emptyLesson;
                return (
                  <section className="card border-0 shadow-sm" key={module.id}>
                    <div className="card-header bg-white px-4 py-3">
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <div>
                          <div className="small text-secondary">MODULE {String(index + 1).padStart(2, '0')}</div>
                          <h2 className="h5 fw-bold mb-0">{module.title}</h2>
                          {module.description && <div className="small text-secondary mt-1">{module.description}</div>}
                        </div>
                        <span className="badge text-bg-light border">{moduleLessons.length} lessons</span>
                      </div>
                    </div>
                    <div className="card-body p-4">
                      {moduleLessons.length > 0 && (
                        <div className="list-group list-group-flush mb-4">
                          {moduleLessons.map((lesson, lessonIndex) => (
                            <div className="list-group-item px-0 py-3" key={lesson.id}>
                              <div className="d-flex justify-content-between align-items-center gap-3">
                                <div>
                                  <div className="fw-semibold">{lessonIndex + 1}. {lesson.title}</div>
                                  <div className="small text-secondary">{lesson.duration_minutes || '—'} min · {lesson.status}</div>
                                  {lesson.summary && <div className="small text-secondary mt-1">{lesson.summary}</div>}
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => beginEditLesson(lesson)}>Edit</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <form onSubmit={(event) => addLesson(event, module)} className="rounded-3 bg-light p-3">
                        <h3 className="h6 fw-bold mb-3">Add lesson</h3>
                        <div className="row g-2">
                          <div className="col-12 col-lg-5">
                            <label className="form-label small" htmlFor={`lesson-title-${module.id}`}>Lesson title *</label>
                            <input id={`lesson-title-${module.id}`} className="form-control form-control-sm" value={form.title}
                              onChange={(e) => setLessonForm(module.id, 'title', e.target.value)} required maxLength={160} />
                          </div>
                          <div className="col-12 col-lg-2">
                            <label className="form-label small" htmlFor={`lesson-duration-${module.id}`}>Duration (min)</label>
                            <input id={`lesson-duration-${module.id}`} className="form-control form-control-sm" type="number" min="1" max="1440" value={form.duration_minutes}
                              onChange={(e) => setLessonForm(module.id, 'duration_minutes', e.target.value)} />
                          </div>
                          <div className="col-12 col-lg-5">
                            <label className="form-label small" htmlFor={`lesson-summary-${module.id}`}>Summary</label>
                            <input id={`lesson-summary-${module.id}`} className="form-control form-control-sm" value={form.summary}
                              onChange={(e) => setLessonForm(module.id, 'summary', e.target.value)} maxLength={500} />
                          </div>
                          <div className="col-12">
                            <label className="form-label small" htmlFor={`lesson-body-${module.id}`}>Lesson text</label>
                            <textarea id={`lesson-body-${module.id}`} className="form-control form-control-sm" rows={3} value={form.body}
                              onChange={(e) => setLessonForm(module.id, 'body', e.target.value)} placeholder="Write a short introductory lesson…" />
                          </div>
                          <div className="col-12 text-end">
                            <button className="btn btn-sm btn-success" type="submit" disabled={saving}>Add draft lesson</button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {editingLesson && (
        <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ background: 'rgba(15, 23, 42, .45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={saveLesson}>
                <div className="modal-header">
                  <h2 className="modal-title h5">Edit lesson</h2>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setEditingLesson(null)} />
                </div>
                <div className="modal-body">
                  <label className="form-label" htmlFor="edit-lesson-title">Title *</label>
                  <input id="edit-lesson-title" className="form-control mb-3" required value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} />
                  <label className="form-label" htmlFor="edit-lesson-summary">Summary</label>
                  <input id="edit-lesson-summary" className="form-control mb-3" value={editingLesson.summary}
                    onChange={(e) => setEditingLesson({ ...editingLesson, summary: e.target.value })} />
                  <label className="form-label" htmlFor="edit-lesson-duration">Duration in minutes</label>
                  <input id="edit-lesson-duration" className="form-control mb-3" type="number" min="1" value={editingLesson.duration_minutes}
                    onChange={(e) => setEditingLesson({ ...editingLesson, duration_minutes: e.target.value })} />
                  <label className="form-label" htmlFor="edit-lesson-body">Lesson text</label>
                  <textarea id="edit-lesson-body" className="form-control" rows={7} value={editingLesson.body}
                    onChange={(e) => setEditingLesson({ ...editingLesson, body: e.target.value })} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setEditingLesson(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving…' : 'Save lesson'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
