import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const EMPTY_FORM = { email: '', courseId: '' };

export default function AcademyEnrollments() {
  const [profiles, setProfiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured in this environment.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [profileResult, courseResult, enrollmentResult] = await Promise.all([
      supabase.from('profiles').select('id,email,full_name,role').order('email'),
      supabase.from('iqra_courses').select('id,title,slug,status').order('title'),
      supabase.from('iqra_enrollments').select('id,course_id,student_id,status,enrolled_at,completed_at').order('enrolled_at', { ascending: false }),
    ]);
    const failed = profileResult.error || courseResult.error || enrollmentResult.error;
    if (failed) {
      setError(failed.code === '42P01' || failed.code === 'PGRST205'
        ? 'IQRA tables are not installed in this database yet. Keep working on the feature branch until the migration baseline is verified.'
        : failed.message);
      setLoading(false);
      return;
    }
    setProfiles(profileResult.data || []);
    setCourses(courseResult.data || []);
    setEnrollments(enrollmentResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const visibleEnrollments = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return enrollments;
    return enrollments.filter((item) => {
      const profile = profileById.get(item.student_id);
      const course = courseById.get(item.course_id);
      return [profile?.email, profile?.full_name, course?.title, item.status]
        .some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [enrollments, filter, profileById, courseById]);

  const addEnrollment = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    const email = form.email.trim().toLowerCase();
    if (!email || !form.courseId) {
      setError('Choose a course and enter the email of an existing learner account.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,role')
      .eq('email', email)
      .maybeSingle();
    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }
    if (!profile) {
      setError('No existing account was found for this email. Create the learner account through the approved Auth process first, then enroll them here.');
      setSaving(false);
      return;
    }
    if (profile.role === 'admin' || profile.role === 'editor') {
      setError('This email belongs to a CMS administrator/editor account. Use a learner account instead.');
      setSaving(false);
      return;
    }
    const { error: insertError } = await supabase.from('iqra_enrollments').upsert({
      course_id: form.courseId,
      student_id: profile.id,
      status: 'active',
      completed_at: null,
    }, { onConflict: 'course_id,student_id' });
    if (insertError) setError(insertError.message);
    else {
      setNotice(`Enrollment activated for ${profile.email}.`);
      setForm(EMPTY_FORM);
      await loadData();
    }
    setSaving(false);
  };

  const changeStatus = async (enrollment, status) => {
    if (!supabase) return;
    setError('');
    setNotice('');
    const { error: updateError } = await supabase.from('iqra_enrollments')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', enrollment.id);
    if (updateError) setError(updateError.message);
    else {
      setNotice(status === 'revoked' ? 'Enrollment revoked. Learning history is preserved.' : 'Enrollment status updated.');
      await loadData();
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <Link to="/admin/academy" className="small text-decoration-none text-secondary"><i className="bi bi-arrow-left me-1" />My Academy</Link>
          <h1 className="h2 fw-bold mt-2 mb-1">Enrollments</h1>
          <p className="text-secondary mb-0">Grant an existing learner account access to a course. No student accounts are created here.</p>
        </div>
        <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={loadData} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2" />Refresh
        </button>
      </div>

      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 fw-bold mb-1">Enroll a learner</h2>
          <p className="small text-secondary mb-3">The learner must already have an Auth account. The first MVP iteration does not create accounts or send invitations.</p>
          <form onSubmit={addEnrollment}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-5">
                <label className="form-label" htmlFor="academy-enrollment-email">Learner email *</label>
                <input id="academy-enrollment-email" className="form-control" type="email" autoComplete="off" required
                  placeholder="learner@example.com" value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="col-12 col-lg-5">
                <label className="form-label" htmlFor="academy-enrollment-course">Course *</label>
                <select id="academy-enrollment-course" className="form-select" required value={form.courseId}
                  onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))}>
                  <option value="">Select a published course</option>
                  {courses.filter((course) => course.status === 'published').map((course) => (
                    <option key={course.id} value={course.id}>{course.title} ({course.status})</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-2 d-grid">
                <button type="submit" className="btn btn-success" disabled={saving || loading || !courses.some((course) => course.status === 'published')}>
                  {saving ? 'Saving…' : 'Enroll'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 px-4 pt-4 pb-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div><h2 className="h5 fw-bold mb-0">Enrollment records</h2><span className="small text-secondary">{visibleEnrollments.length} records</span></div>
          <input className="form-control form-control-sm" style={{ maxWidth: 280 }} aria-label="Filter enrollments"
            placeholder="Filter by learner, course or status" value={filter} onChange={(event) => setFilter(event.target.value)} />
        </div>
        <div className="card-body p-0">
          {loading ? <div className="text-center py-5 text-secondary"><span className="spinner-border spinner-border-sm me-2" />Loading enrollments…</div>
            : visibleEnrollments.length === 0 ? <div className="text-center py-5 px-3">
              <i className="bi bi-people display-5 text-secondary" /><h3 className="h5 mt-3">No enrollments yet</h3>
              <p className="text-secondary mb-0">Enroll an existing learner account to give them access to a course.</p>
            </div> : <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light"><tr><th className="ps-4">Learner</th><th>Course</th><th>Status</th><th>Enrolled</th><th className="text-end pe-4">Actions</th></tr></thead>
                <tbody>{visibleEnrollments.map((item) => {
                  const learner = profileById.get(item.student_id);
                  const course = courseById.get(item.course_id);
                  return <tr key={item.id}>
                    <td className="ps-4"><strong>{learner?.full_name || 'Learner'}</strong><div className="small text-secondary">{learner?.email || 'Account profile unavailable'}</div></td>
                    <td>{course?.title || 'Course unavailable'}</td>
                    <td><span className={`badge rounded-pill ${item.status === 'active' ? 'text-bg-success' : item.status === 'completed' ? 'text-bg-primary' : 'text-bg-secondary'}`}>{item.status}</span></td>
                    <td className="small text-secondary">{item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : '—'}</td>
                    <td className="text-end pe-4">
                      {item.status === 'active' ? <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => changeStatus(item, 'revoked')}>Revoke</button>
                        : <button type="button" className="btn btn-sm btn-outline-success" onClick={() => changeStatus(item, 'active')}>Reactivate</button>}
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            </div>}
        </div>
      </section>
    </div>
  );
}
