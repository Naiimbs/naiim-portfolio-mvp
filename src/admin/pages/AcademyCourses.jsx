import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const EMPTY_FORM = { title: '', slug: '', summary: '', description: '', status: 'draft' };

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function StatusBadge({ status }) {
  const styles = {
    published: 'text-bg-success',
    draft: 'text-bg-secondary',
    archived: 'text-bg-light text-secondary border',
  };
  return <span className={`badge rounded-pill ${styles[status] || styles.draft}`}>{status}</span>;
}

export default function AcademyCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadCourses = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setError('Supabase is not configured in this environment.');
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('iqra_courses')
      .select('id, slug, title, summary, description, status, created_at, updated_at, published_at, archived_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(
        queryError.code === '42P01' || queryError.code === 'PGRST205'
          ? 'IQRA database tables are not installed yet. Apply and verify the Academy migrations before managing courses.'
          : queryError.message
      );
      setCourses([]);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setNotice('');
    setShowForm(true);
  };

  const startEdit = (course) => {
    setEditingId(course.id);
    setForm({
      title: course.title || '',
      slug: course.slug || '',
      summary: course.summary || '',
      description: course.description || '',
      status: course.status || 'draft',
    });
    setError('');
    setNotice('');
    setShowForm(true);
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    if (!supabase || !isSupabaseConfigured) return;

    const title = form.title.trim();
    const slug = slugify(form.slug || title);
    if (!title || !slug) {
      setError('Add a course title. A valid URL slug will be generated automatically.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      title,
      slug,
      summary: form.summary.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      published_at: form.status === 'published'
        ? (courses.find((course) => course.id === editingId)?.published_at || new Date().toISOString())
        : null,
      archived_at: form.status === 'archived'
        ? (courses.find((course) => course.id === editingId)?.archived_at || new Date().toISOString())
        : null,
    };

    let result;
    if (editingId) {
      result = await supabase.from('iqra_courses').update(payload).eq('id', editingId);
    } else {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setSaving(false);
        setError('Your admin session could not be verified. Sign in again and retry.');
        return;
      }
      result = await supabase.from('iqra_courses').insert({
        ...payload,
        created_by: authData.user.id,
      });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setNotice(editingId ? 'Course updated.' : 'Course created as a draft.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadCourses();
    }
    setSaving(false);
  };

  const archiveCourse = async (course) => {
    if (!supabase || !window.confirm(`Archive “${course.title}”? It will remain in the database and can be restored later.`)) return;
    setError('');
    setNotice('');
    const { error: updateError } = await supabase
      .from('iqra_courses')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', course.id);
    if (updateError) setError(updateError.message);
    else {
      setNotice('Course archived. Its learning history has not been deleted.');
      await loadCourses();
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <Link to="/admin/academy" className="small text-decoration-none text-secondary">
            <i className="bi bi-arrow-left me-1" /> My Academy
          </Link>
          <h1 className="h2 fw-bold mt-2 mb-1">Courses</h1>
          <p className="text-secondary mb-0">Create and manage the learning catalogue.</p>
        </div>
        <button type="button" className="btn btn-success rounded-pill px-4" onClick={startCreate}>
          <i className="bi bi-plus-lg me-2" />New course
        </button>
      </div>

      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      {showForm && (
        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-bold mb-0">{editingId ? 'Edit course' : 'Create a course'}</h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={saveCourse}>
              <div className="row g-3">
                <div className="col-12 col-lg-7">
                  <label className="form-label" htmlFor="academy-course-title">Course title *</label>
                  <input id="academy-course-title" className="form-control" required maxLength={160}
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
                </div>
                <div className="col-12 col-lg-5">
                  <label className="form-label" htmlFor="academy-course-slug">URL slug *</label>
                  <input id="academy-course-slug" className="form-control" required maxLength={180}
                    value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
                  <div className="form-text">Lowercase letters, numbers and hyphens.</div>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="academy-course-summary">Short summary</label>
                  <textarea id="academy-course-summary" className="form-control" rows={2} maxLength={500}
                    value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="academy-course-description">Description</label>
                  <textarea id="academy-course-description" className="form-control" rows={4}
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="academy-course-status">Status</label>
                  <select id="academy-course-status" className="form-select" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="form-text">Archived courses are restored from the course list.</div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create course'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 px-4 pt-4 pb-2">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h5 fw-bold mb-0">Course catalogue</h2>
            <span className="small text-secondary">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-secondary"><span className="spinner-border spinner-border-sm me-2" />Loading courses…</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-5 px-3">
              <i className="bi bi-journal-richtext display-5 text-secondary" />
              <h3 className="h5 mt-3">No courses yet</h3>
              <p className="text-secondary mb-3">Create the first course when the Academy database is ready.</p>
              <button type="button" className="btn btn-outline-success rounded-pill" onClick={startCreate}>Create first course</button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr><th className="ps-4">Course</th><th>Slug</th><th>Status</th><th>Updated</th><th className="text-end pe-4">Actions</th></tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="ps-4"><strong>{course.title}</strong>{course.summary && <div className="small text-secondary">{course.summary}</div>}</td>
                      <td><code>{course.slug}</code></td>
                      <td><StatusBadge status={course.status} /></td>
                      <td className="small text-secondary">{course.updated_at ? new Date(course.updated_at).toLocaleDateString() : '—'}</td>
                      <td className="text-end pe-4">
                        <Link to={`/admin/academy/courses/${course.id}`} className="btn btn-sm btn-outline-success me-2">Curriculum</Link>
                        <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(course)}>Edit</button>
                        {course.status !== 'archived' && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => archiveCourse(course)}>Archive</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
