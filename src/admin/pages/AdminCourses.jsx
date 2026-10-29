import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPage, getAdminPages } from '../../services/siteCms';
import { checkSlugAvailable } from '../../services/contentRegistry';
import { LEARNING_EXPERIENCE_TEMPLATE } from '../../utils/learningExperience';

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminCourses() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [creating, setCreating] = useState(false);

  async function loadPages() {
    setLoading(true);
    const result = await getAdminPages();
    if (result.error) setError(result.error.message || 'Could not load learning experiences.');
    setPages((result.data || []).filter((page) => page.template === LEARNING_EXPERIENCE_TEMPLATE));
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) loadPages();
  }, [isAdmin]);

  const sortedPages = useMemo(() => [...pages].sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || ''))), [pages]);

  const handleTitleChange = (value) => {
    setTitle(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedSlug = slugify(slug);
    if (!title.trim()) return setError('Enter a title for the course or workshop.');
    if (!normalizedSlug) return setError('Enter a valid slug using letters, numbers, and hyphens.');
    setCreating(true);
    const isAvailable = await checkSlugAvailable(normalizedSlug);
    if (!isAvailable) {
      setError('That slug is already in use. Choose a different URL slug.');
      setCreating(false);
      return;
    }
    const result = await createPage({
      title: title.trim(),
      slug: normalizedSlug,
      status: 'draft',
      template: LEARNING_EXPERIENCE_TEMPLATE,
    });
    setCreating(false);
    if (result.error || !result.data?.id) {
      setError(result.error?.message || 'The draft could not be created. Check the slug and your admin access.');
      return;
    }
    setShowCreate(false);
    setTitle('');
    setSlug('');
    setSlugManuallyEdited(false);
    navigate(`/admin/pages/${result.data.id}`);
  };

  if (!isAdmin) {
    return <div className="alert alert-warning m-4" role="alert"><i className="bi bi-shield-lock me-2" />Courses &amp; Workshops authoring is available to administrators only.</div>;
  }

  return (
    <div className="p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Courses &amp; Workshops</h1>
          <p className="text-muted small mb-0">Create learning experiences inside the existing Page Builder and Content Registry.</p>
        </div>
        <button type="button" className="btn btn-primary rounded-pill px-4" onClick={() => { setError(''); setShowCreate(true); }}>
          <i className="bi bi-plus-lg me-2" />Create learning experience
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {loading ? <div className="text-center py-5"><span className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading</span></span></div> : sortedPages.length ? (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr><th className="ps-4">Title</th><th>Slug</th><th>Status</th><th>Format</th><th>Updated</th><th className="text-end pe-4">Action</th></tr></thead>
              <tbody>
                {sortedPages.map((page) => {
                  const metadata = page.registryEntry?.metadata?.learningExperience || {};
                  return (
                    <tr key={page.id}>
                      <td className="ps-4"><div className="fw-semibold">{page.title}</div><div className="small text-muted">{metadata.description || 'Add a short description in the learning overview.'}</div></td>
                      <td><code>/p/{page.slug}</code></td>
                      <td><span className={`badge ${page.status === 'published' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>{page.status || 'draft'}</span></td>
                      <td className="text-capitalize">{metadata.format || '—'}</td>
                      <td className="small text-muted">{page.updated_at ? new Date(page.updated_at).toLocaleDateString() : '—'}</td>
                      <td className="text-end pe-4"><Link className="btn btn-sm btn-outline-primary rounded-pill" to={`/admin/pages/${page.id}`}>Open editor</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <i className="bi bi-journal-bookmark display-5 text-primary mb-3" />
          <h2 className="h5 fw-bold">No courses or workshops yet</h2>
          <p className="text-muted mb-3">Create a draft learning experience to start authoring its overview and ordered modules.</p>
          <div><button type="button" className="btn btn-primary rounded-pill px-4" onClick={() => setShowCreate(true)}>Create the first draft</button></div>
        </div>
      )}

      {showCreate && (
        <div className="modal d-block bg-dark bg-opacity-50" role="dialog" aria-modal="true" aria-labelledby="new-learning-title">
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content rounded-4 border-0 shadow">
            <form onSubmit={handleCreate}>
              <div className="modal-header"><h2 className="modal-title h5 fw-bold" id="new-learning-title">New course or workshop</h2><button type="button" className="btn-close" onClick={() => setShowCreate(false)} aria-label="Close" /></div>
              <div className="modal-body">
                <label className="form-label small fw-semibold w-100">Title
                  <input className="form-control mt-1" value={title} onChange={(event) => handleTitleChange(event.target.value)} autoFocus required />
                </label>
                <label className="form-label small fw-semibold w-100 mt-2">Slug
                  <div className="input-group mt-1"><span className="input-group-text">/p/</span><input className="form-control" value={slug} onChange={(event) => { setSlugManuallyEdited(true); setSlug(slugify(event.target.value)); }} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div>
                </label>
                <div className="form-text">This creates a draft Page Builder page using the learning-experience template. Add format and course details in the overview after creation.</div>
                {error && <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">{error}</div>}
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-light rounded-pill" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button><button type="submit" className="btn btn-primary rounded-pill" disabled={creating}>{creating ? 'Creating…' : 'Create draft'}</button></div>
            </form>
          </div></div>
        </div>
      )}
    </div>
  );
}
