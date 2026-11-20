import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export default function AcademyProgress() {
  const [progress, setProgress] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured in this environment.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [progressResult, profileResult, courseResult, moduleResult, lessonResult] = await Promise.all([
      supabase.from('iqra_lesson_progress').select('id,lesson_id,student_id,status,progress_percent,last_position_seconds,started_at,completed_at,updated_at').order('updated_at', { ascending: false }),
      supabase.from('profiles').select('id,email,full_name,role').order('email'),
      supabase.from('iqra_courses').select('id,title,slug,status'),
      supabase.from('iqra_modules').select('id,course_id,title,position'),
      supabase.from('iqra_lessons').select('id,module_id,title,status,position'),
    ]);
    const failed = [progressResult, profileResult, courseResult, moduleResult, lessonResult].find((item) => item.error);
    if (failed) {
      setError(failed.error.code === '42P01' || failed.error.code === 'PGRST205'
        ? 'IQRA tables are not installed in this database yet.'
        : failed.error.message);
    } else {
      setProgress(progressResult.data || []);
      setProfiles(profileResult.data || []);
      setCourses(courseResult.data || []);
      setModules(moduleResult.data || []);
      setLessons(lessonResult.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const profileById = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);
  const courseById = useMemo(() => new Map(courses.map((item) => [item.id, item])), [courses]);
  const moduleById = useMemo(() => new Map(modules.map((item) => [item.id, item])), [modules]);
  const lessonById = useMemo(() => new Map(lessons.map((item) => [item.id, item])), [lessons]);

  const rows = useMemo(() => progress.map((item) => {
    const lesson = lessonById.get(item.lesson_id);
    const module = lesson ? moduleById.get(lesson.module_id) : null;
    const course = module ? courseById.get(module.course_id) : null;
    const learner = profileById.get(item.student_id);
    return { ...item, lesson, module, course, learner };
  }).filter((item) => {
    const query = filter.trim().toLowerCase();
    if (!query) return true;
    return [item.learner?.email, item.learner?.full_name, item.course?.title, item.lesson?.title, item.status]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [progress, lessonById, moduleById, courseById, profileById, filter]);

  const completed = progress.filter((item) => item.status === 'completed').length;
  const average = progress.length ? Math.round(progress.reduce((sum, item) => sum + Number(item.progress_percent || 0), 0) / progress.length) : 0;
  const learners = new Set(progress.map((item) => item.student_id)).size;

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div><Link to="/admin/academy" className="small text-decoration-none text-secondary"><i className="bi bi-arrow-left me-1" />IQRA</Link><h1 className="h2 fw-bold mt-2 mb-1">Learning progress</h1><p className="text-secondary mb-0">Read-only view of learner progress stored by IQRA.</p></div>
        <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={load} disabled={loading}><i className="bi bi-arrow-clockwise me-2" />Refresh</button>
      </div>
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="small text-secondary">Learners with activity</div><div className="h3 fw-bold mb-0">{learners}</div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="small text-secondary">Completed lessons</div><div className="h3 fw-bold mb-0">{completed}</div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="small text-secondary">Average lesson progress</div><div className="h3 fw-bold mb-0">{average}%</div></div></div></div>
      </div>
      <section className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 px-4 pt-4 pb-2 d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div><h2 className="h5 fw-bold mb-0">Learner activity</h2><span className="small text-secondary">{rows.length} progress records</span></div>
          <input className="form-control form-control-sm" style={{ maxWidth: 300 }} value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search learner, course or lesson" aria-label="Filter learner progress" />
        </div>
        <div className="card-body p-0">
          {loading ? <div className="text-center py-5 text-secondary">Loading progress…</div> : rows.length === 0 ? <div className="text-center py-5 text-secondary">No learner progress has been recorded yet.</div> : (
            <div className="table-responsive"><table className="table align-middle mb-0">
              <thead className="table-light"><tr><th className="ps-4">Learner</th><th>Course / Lesson</th><th>Progress</th><th>Status</th><th>Last activity</th></tr></thead>
              <tbody>{rows.map((item) => <tr key={item.id}>
                <td className="ps-4"><strong>{item.learner?.full_name || 'Learner'}</strong><div className="small text-secondary">{item.learner?.email || 'Profile unavailable'}</div></td>
                <td><strong>{item.course?.title || 'Course unavailable'}</strong><div className="small text-secondary">{item.module?.title ? `${item.module.title} · ` : ''}{item.lesson?.title || 'Lesson unavailable'}</div></td>
                <td style={{ minWidth: 150 }}><div className="progress" role="progressbar" aria-valuenow={Number(item.progress_percent)} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar bg-success" style={{ width: `${item.progress_percent}%` }} /></div><small className="text-secondary">{item.progress_percent}%</small></td>
                <td><span className={`badge rounded-pill ${item.status === 'completed' ? 'text-bg-success' : 'text-bg-light border text-secondary'}`}>{item.status}</span></td>
                <td className="small text-secondary">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </div>
      </section>
    </div>
  );
}
