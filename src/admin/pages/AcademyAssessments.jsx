import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const EMPTY_ASSESSMENT = { lessonId: '', title: '', description: '', passScore: '70', maxAttempts: '2' };
const EMPTY_QUESTION = { type: 'single_choice', prompt: '', options: 'a|Option A\nb|Option B', answer: '', points: '1' };

function parseOptions(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [optionValue, ...labelParts] = line.split('|');
    return { value: optionValue.trim(), label: (labelParts.join('|') || optionValue).trim() };
  });
}

export default function AcademyAssessments() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [assessmentForm, setAssessmentForm] = useState(EMPTY_ASSESSMENT);
  const [questionForms, setQuestionForms] = useState({});
  const [gradingForms, setGradingForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured in this environment.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [courseResult, moduleResult, lessonResult, assessmentResult, profileResult, attemptResult] = await Promise.all([
      supabase.from('iqra_courses').select('id,title,status').order('title'),
      supabase.from('iqra_modules').select('id,course_id,title,position').order('position'),
      supabase.from('iqra_lessons').select('id,module_id,title,status,position').order('position'),
      supabase.from('iqra_assessments').select('id,lesson_id,title,description,pass_score,max_attempts,is_published,created_at').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,email,full_name,role'),
      supabase.from('iqra_attempts').select('id,assessment_id,student_id,attempt_number,status,submitted_at').eq('status', 'submitted').order('submitted_at'),
    ]);
    const failed = [courseResult, moduleResult, lessonResult, assessmentResult, profileResult, attemptResult].find((item) => item.error);
    if (failed) {
      setError(failed.error.code === '42P01' || failed.error.code === 'PGRST205' ? 'IQRA tables are not installed in this database yet.' : failed.error.message);
      setLoading(false);
      return;
    }
    const nextAssessments = assessmentResult.data || [];
    const nextAttempts = attemptResult.data || [];
    const assessmentIds = nextAssessments.map((item) => item.id);
    const attemptIds = nextAttempts.map((item) => item.id);
    const [questionResult, answerResult] = await Promise.all([
      assessmentIds.length ? supabase.from('iqra_questions').select('id,assessment_id,question_type,prompt,options,points,position').in('assessment_id', assessmentIds).order('position') : Promise.resolve({ data: [], error: null }),
      attemptIds.length ? supabase.from('iqra_attempt_answers').select('id,attempt_id,question_id,answer').in('attempt_id', attemptIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (questionResult.error || answerResult.error) setError((questionResult.error || answerResult.error).message);
    setCourses(courseResult.data || []);
    setModules(moduleResult.data || []);
    setLessons(lessonResult.data || []);
    setAssessments(nextAssessments);
    setProfiles(profileResult.data || []);
    setAttempts(nextAttempts);
    setQuestions(questionResult.data || []);
    setAnswers(answerResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const courseById = useMemo(() => new Map(courses.map((item) => [item.id, item])), [courses]);
  const moduleById = useMemo(() => new Map(modules.map((item) => [item.id, item])), [modules]);
  const lessonById = useMemo(() => new Map(lessons.map((item) => [item.id, item])), [lessons]);
  const profileById = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);
  const questionById = useMemo(() => new Map(questions.map((item) => [item.id, item])), [questions]);

  const lessonLabel = (lessonId) => {
    const lesson = lessonById.get(lessonId);
    const module = lesson ? moduleById.get(lesson.module_id) : null;
    const course = module ? courseById.get(module.course_id) : null;
    return [course?.title, module?.title, lesson?.title].filter(Boolean).join(' / ');
  };

  const createAssessment = async (event) => {
    event.preventDefault();
    if (!supabase || !assessmentForm.lessonId || !assessmentForm.title.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: insertError } = await supabase.from('iqra_assessments').insert({
      lesson_id: assessmentForm.lessonId,
      title: assessmentForm.title.trim(),
      description: assessmentForm.description.trim() || null,
      pass_score: Number(assessmentForm.passScore),
      max_attempts: assessmentForm.maxAttempts ? Number(assessmentForm.maxAttempts) : null,
      is_published: false,
    });
    if (insertError) setError(insertError.message);
    else { setNotice('Assessment created as a draft.'); setAssessmentForm(EMPTY_ASSESSMENT); await load(); }
    setSaving(false);
  };

  const addQuestion = async (event, assessment) => {
    event.preventDefault();
    const form = questionForms[assessment.id] || EMPTY_QUESTION;
    if (!supabase || !form.prompt.trim()) return;
    const objective = ['single_choice', 'multiple_choice'].includes(form.type);
    const options = objective ? parseOptions(form.options) : [];
    const answers = form.answer.split(',').map((item) => item.trim()).filter(Boolean);
    if (objective && (options.length < 2 || !answers.length || answers.some((value) => !options.some((option) => option.value === value)))) {
      setError('For choice questions, add at least two options and a correct answer that matches an option value.');
      return;
    }
    setSaving(true); setError(''); setNotice('');
    const assessmentQuestions = questions.filter((item) => item.assessment_id === assessment.id);
    const { data: question, error: insertError } = await supabase.from('iqra_questions').insert({
      assessment_id: assessment.id,
      question_type: form.type,
      prompt: form.prompt.trim(),
      options,
      points: Number(form.points) || 1,
      position: assessmentQuestions.length + 1,
    }).select('id').single();
    if (insertError) setError(insertError.message);
    else if (objective) {
      const correctAnswer = form.type === 'single_choice' ? answers[0] : answers;
      const { error: keyError } = await supabase.from('iqra_question_answer_keys').insert({
        question_id: question.id,
        correct_answer: correctAnswer,
      });
      if (keyError) setError(`Question saved, but its answer key failed: ${keyError.message}`);
      else setNotice('Question and protected answer key saved.');
    } else {
      setNotice('Written-response question saved. Learner submissions will require manual grading.');
    }
    if (!insertError) {
      setQuestionForms((current) => ({ ...current, [assessment.id]: EMPTY_QUESTION }));
      await load();
    }
    setSaving(false);
  };

  const togglePublished = async (assessment) => {
    if (!supabase) return;
    if (!assessment.is_published) {
      const lesson = lessonById.get(assessment.lesson_id);
      const module = lesson ? moduleById.get(lesson.module_id) : null;
      const course = module ? courseById.get(module.course_id) : null;
      if (lesson?.status !== 'published' || course?.status !== 'published') {
        setError('Publish the parent course and lesson before publishing this assessment.');
        return;
      }
      const assessmentQuestions = questions.filter((item) => item.assessment_id === assessment.id);
      if (!assessmentQuestions.length) { setError('Add at least one question before publishing.'); return; }
      const objectiveIds = assessmentQuestions.filter((item) => ['single_choice', 'multiple_choice'].includes(item.question_type)).map((item) => item.id);
      if (objectiveIds.length) {
        const { data: keys, error: keyError } = await supabase.from('iqra_question_answer_keys').select('question_id').in('question_id', objectiveIds);
        if (keyError) { setError(keyError.message); return; }
        const keyed = new Set((keys || []).map((item) => item.question_id));
        if (objectiveIds.some((id) => !keyed.has(id))) { setError('Every choice question needs a protected answer key before publishing.'); return; }
      }
    }
    setSaving(true); setError(''); setNotice('');
    const { error: updateError } = await supabase.from('iqra_assessments').update({ is_published: !assessment.is_published }).eq('id', assessment.id);
    if (updateError) setError(updateError.message);
    else { setNotice(assessment.is_published ? 'Assessment unpublished.' : 'Assessment published.'); await load(); }
    setSaving(false);
  };

  const gradeManualAttempt = async (attempt) => {
    if (!supabase) return;
    const form = gradingForms[attempt.id] || { score: '', feedback: '' };
    const score = Number(form.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) { setError('Enter a score between 0 and 100.'); return; }
    const assessment = assessments.find((item) => item.id === attempt.assessment_id);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) { setError('Your admin session could not be verified.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { data: claimedAttempt, error: claimError } = await supabase.from('iqra_attempts')
      .update({ status: 'graded' })
      .eq('id', attempt.id)
      .eq('status', 'submitted')
      .select('id')
      .maybeSingle();
    if (claimError || !claimedAttempt) {
      setError(claimError?.message || 'This attempt has already been graded or changed. Refresh the queue.');
    } else {
      const { error: resultError } = await supabase.from('iqra_attempt_results').upsert({
        attempt_id: attempt.id,
        score_percent: score,
        passed: score >= Number(assessment?.pass_score || 70),
        feedback: form.feedback.trim() || null,
        graded_by: authData.user.id,
        graded_at: new Date().toISOString(),
      }, { onConflict: 'attempt_id' });
      if (resultError) {
        await supabase.from('iqra_attempts').update({ status: 'submitted' }).eq('id', attempt.id).eq('status', 'graded');
        setError(resultError.message);
      } else {
        setNotice('Manual grade saved.');
        await load();
      }
    }
    setSaving(false);
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div><Link to="/admin/academy" className="small text-decoration-none text-secondary"><i className="bi bi-arrow-left me-1" />IQRA</Link><h1 className="h2 fw-bold mt-2 mb-1">Assessments</h1><p className="text-secondary mb-0">Create quizzes, protect answer keys and review written submissions.</p></div>
        <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={load} disabled={loading}><i className="bi bi-arrow-clockwise me-2" />Refresh</button>
      </div>
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <section className="card border-0 shadow-sm mb-4"><div className="card-body p-4">
        <h2 className="h5 fw-bold mb-3">Create an assessment</h2>
        <form onSubmit={createAssessment}><div className="row g-3">
          <div className="col-12 col-lg-5"><label className="form-label" htmlFor="assessment-lesson">Lesson *</label><select id="assessment-lesson" className="form-select" required value={assessmentForm.lessonId} onChange={(event) => setAssessmentForm({ ...assessmentForm, lessonId: event.target.value })}><option value="">Select lesson</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lessonLabel(lesson.id)}</option>)}</select></div>
          <div className="col-12 col-lg-4"><label className="form-label" htmlFor="assessment-title">Title *</label><input id="assessment-title" className="form-control" required maxLength={160} value={assessmentForm.title} onChange={(event) => setAssessmentForm({ ...assessmentForm, title: event.target.value })} /></div>
          <div className="col-6 col-lg-1"><label className="form-label" htmlFor="assessment-pass">Pass %</label><input id="assessment-pass" className="form-control" type="number" min="0" max="100" value={assessmentForm.passScore} onChange={(event) => setAssessmentForm({ ...assessmentForm, passScore: event.target.value })} /></div>
          <div className="col-6 col-lg-2"><label className="form-label" htmlFor="assessment-attempts">Max attempts</label><input id="assessment-attempts" className="form-control" type="number" min="1" value={assessmentForm.maxAttempts} onChange={(event) => setAssessmentForm({ ...assessmentForm, maxAttempts: event.target.value })} placeholder="Unlimited" /></div>
          <div className="col-12"><label className="form-label" htmlFor="assessment-description">Description</label><textarea id="assessment-description" className="form-control" rows={2} value={assessmentForm.description} onChange={(event) => setAssessmentForm({ ...assessmentForm, description: event.target.value })} /></div>
          <div className="col-12 text-end"><button className="btn btn-success" type="submit" disabled={saving || loading || !lessons.length}>{saving ? 'Saving…' : 'Create draft assessment'}</button></div>
        </div></form>
      </div></section>

      <section className="card border-0 shadow-sm mb-4"><div className="card-header bg-white border-0 px-4 pt-4 pb-2"><h2 className="h5 fw-bold mb-0">Assessment library</h2><span className="small text-secondary">{assessments.length} assessments</span></div><div className="card-body p-0">
        {loading ? <div className="text-center py-5 text-secondary">Loading assessments…</div> : !assessments.length ? <div className="text-center py-5 text-secondary">No assessments created yet.</div> : assessments.map((assessment) => {
          const assessmentQuestions = questions.filter((item) => item.assessment_id === assessment.id);
          const form = questionForms[assessment.id] || EMPTY_QUESTION;
          return <article className="border-top p-4" key={assessment.id}>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
              <div><div className="small text-secondary">{lessonLabel(assessment.lesson_id)}</div><h3 className="h5 fw-bold mb-1">{assessment.title}</h3><p className="small text-secondary mb-0">{assessmentQuestions.length} questions · Pass {assessment.pass_score}% · {assessment.max_attempts || 'Unlimited'} attempts</p></div>
              <div className="d-flex align-items-center gap-2"><span className={`badge rounded-pill ${assessment.is_published ? 'text-bg-success' : 'text-bg-secondary'}`}>{assessment.is_published ? 'Published' : 'Draft'}</span><button type="button" className="btn btn-sm btn-outline-success" onClick={() => togglePublished(assessment)} disabled={saving}>{assessment.is_published ? 'Unpublish' : 'Publish'}</button></div>
            </div>
            {assessmentQuestions.map((question, index) => <div className="border rounded-3 p-3 mb-2" key={question.id}><div className="small text-secondary">QUESTION {index + 1} · {question.question_type} · {question.points} pts</div><strong>{question.prompt}</strong>{question.options?.length > 0 && <ul className="small text-secondary mb-0 mt-2">{question.options.map((option) => <li key={option.value}>{option.label}</li>)}</ul>}</div>)}
            <form className="bg-light rounded-3 p-3 mt-3" onSubmit={(event) => addQuestion(event, assessment)}>
              <h4 className="h6 fw-bold mb-3">Add question</h4><div className="row g-2">
                <div className="col-12 col-lg-3"><label className="form-label small" htmlFor={`question-type-${assessment.id}`}>Type</label><select id={`question-type-${assessment.id}`} className="form-select form-select-sm" value={form.type} onChange={(event) => setQuestionForms((current) => ({ ...current, [assessment.id]: { ...form, type: event.target.value } }))}><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="short_text">Short answer (manual)</option><option value="long_text">Long answer (manual)</option></select></div>
                <div className="col-12 col-lg-7"><label className="form-label small" htmlFor={`question-prompt-${assessment.id}`}>Question prompt *</label><input id={`question-prompt-${assessment.id}`} className="form-control form-control-sm" required value={form.prompt} onChange={(event) => setQuestionForms((current) => ({ ...current, [assessment.id]: { ...form, prompt: event.target.value } }))} /></div>
                <div className="col-12 col-lg-2"><label className="form-label small" htmlFor={`question-points-${assessment.id}`}>Points</label><input id={`question-points-${assessment.id}`} className="form-control form-control-sm" type="number" min="0.1" step="0.1" value={form.points} onChange={(event) => setQuestionForms((current) => ({ ...current, [assessment.id]: { ...form, points: event.target.value } }))} /></div>
                {['single_choice', 'multiple_choice'].includes(form.type) && <><div className="col-12 col-lg-7"><label className="form-label small" htmlFor={`question-options-${assessment.id}`}>Options (one per line: value|label)</label><textarea id={`question-options-${assessment.id}`} className="form-control form-control-sm" rows={3} value={form.options} onChange={(event) => setQuestionForms((current) => ({ ...current, [assessment.id]: { ...form, options: event.target.value } }))} /></div><div className="col-12 col-lg-5"><label className="form-label small" htmlFor={`question-answer-${assessment.id}`}>Correct value{form.type === 'multiple_choice' ? 's (comma separated)' : ''}</label><input id={`question-answer-${assessment.id}`} className="form-control form-control-sm" value={form.answer} onChange={(event) => setQuestionForms((current) => ({ ...current, [assessment.id]: { ...form, answer: event.target.value } }))} /></div></>}
                <div className="col-12 text-end"><button type="submit" className="btn btn-sm btn-success" disabled={saving}>{saving ? 'Saving…' : 'Add question'}</button></div>
              </div>
            </form>
          </article>;
        })}
      </div></section>

      <section className="card border-0 shadow-sm"><div className="card-header bg-white border-0 px-4 pt-4 pb-2"><h2 className="h5 fw-bold mb-0">Manual grading queue</h2><span className="small text-secondary">{attempts.length} submitted attempts awaiting review</span></div><div className="card-body p-0">
        {!attempts.length ? <div className="text-center py-5 text-secondary">No submitted attempts are waiting for manual grading.</div> : attempts.map((attempt) => {
          const assessment = assessments.find((item) => item.id === attempt.assessment_id);
          const learner = profileById.get(attempt.student_id);
          const attemptAnswers = answers.filter((item) => item.attempt_id === attempt.id);
          return <article className="border-top p-4" key={attempt.id}>
            <div className="d-flex flex-wrap justify-content-between gap-2"><div><strong>{learner?.full_name || learner?.email || 'Learner'}</strong><div className="small text-secondary">{assessment?.title || 'Assessment'} · Attempt {attempt.attempt_number} · Submitted {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : '—'}</div></div><span className="badge text-bg-warning">Awaiting review</span></div>
            <div className="mt-3">{attemptAnswers.map((answer) => { const question = questionById.get(answer.question_id); return <div className="small border rounded-3 p-2 mb-2" key={answer.id}><strong>{question?.prompt || 'Question'}</strong><div className="text-secondary mt-1">{typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer)}</div></div>; })}</div>
            <div className="row g-2 align-items-end mt-2"><div className="col-4 col-lg-2"><label className="form-label small" htmlFor={`grade-score-${attempt.id}`}>Score %</label><input id={`grade-score-${attempt.id}`} type="number" min="0" max="100" className="form-control form-control-sm" value={(gradingForms[attempt.id] || {}).score || ''} onChange={(event) => setGradingForms((current) => ({ ...current, [attempt.id]: { ...(current[attempt.id] || {}), score: event.target.value } }))} /></div><div className="col-8 col-lg-8"><label className="form-label small" htmlFor={`grade-feedback-${attempt.id}`}>Feedback</label><input id={`grade-feedback-${attempt.id}`} className="form-control form-control-sm" value={(gradingForms[attempt.id] || {}).feedback || ''} onChange={(event) => setGradingForms((current) => ({ ...current, [attempt.id]: { ...(current[attempt.id] || {}), feedback: event.target.value } }))} /></div><div className="col-12 col-lg-2 d-grid"><button type="button" className="btn btn-sm btn-success" onClick={() => gradeManualAttempt(attempt)} disabled={saving}>Save grade</button></div></div>
          </article>;
        })}
      </div></section>
    </div>
  );
}
