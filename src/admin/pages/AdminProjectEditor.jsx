import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAdminProjectById, updateProject } from '../../services/projects';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function AdminProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    kicker: '',
    short_description: '',
    category: 'Product Design',
    year: 2026,
    roles: '',
    tools: '',
    is_featured: false,
    sort_order: 0,
    status: 'draft',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadProject() {
      if (id === 'new') {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getAdminProjectById(id);
      if (res.data) {
        const p = res.data;
        setFormData({
          title: p.title || '',
          slug: p.slug || '',
          kicker: p.kicker || '',
          short_description: p.short_description || p.shortDescription || '',
          category: p.category || 'Product Design',
          year: p.year || 2026,
          roles: Array.isArray(p.role || p.roles) ? (p.role || p.roles).join(', ') : '',
          tools: Array.isArray(p.tools) ? p.tools.join(', ') : '',
          is_featured: Boolean(p.is_featured || p.featured),
          sort_order: p.sort_order || p.order || 0,
          status: p.status || 'published',
        });
      } else if (res.error) {
        setError(res.error.message || 'Project not found');
      }
      setLoading(false);
    }
    loadProject();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    if (!isSupabaseConfigured) {
      setSuccessMsg('Local mode preview: Fields updated in state (database offline).');
      setSaving(false);
      return;
    }

    const payload = {
      title: formData.title,
      slug: formData.slug,
      kicker: formData.kicker,
      short_description: formData.short_description,
      category: formData.category,
      year: parseInt(formData.year, 10),
      roles: formData.roles.split(',').map((s) => s.trim()).filter(Boolean),
      tools: formData.tools.split(',').map((s) => s.trim()).filter(Boolean),
      is_featured: formData.is_featured,
      sort_order: parseInt(formData.sort_order, 10),
      status: formData.status,
    };

    const res = await updateProject(id, payload);
    if (res.error) {
      setError(res.error.message || 'Failed to save project');
    } else {
      setSuccessMsg('Project saved successfully!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-card text-center py-5 text-muted">
        <div className="spinner-border text-success mb-3" role="status"></div>
        <div>Loading project details...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/projects" className="text-muted small text-decoration-none">
            ← Back to projects
          </Link>
          <h2 className="fs-4 fw-bold mt-1 mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {id === 'new' ? 'Create Project' : `Edit: ${formData.title || id}`}
          </h2>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/projects')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-3">
          <i className="bi bi-info-circle-fill"></i>
          <div>
            <strong>Preview Mode:</strong> Changes cannot be saved to PostgreSQL because Supabase is not connected in <code>.env</code>.
          </div>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error mb-3">
          <i className="bi bi-x-circle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="admin-alert admin-alert-success mb-3">
          <i className="bi bi-check-circle-fill"></i>
          <div>{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="admin-card">
        <div className="row g-3">
          <div className="col-md-8">
            <div className="admin-form-group">
              <label className="admin-form-label">Project Title *</label>
              <input
                type="text"
                name="title"
                className="admin-form-input"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="admin-form-group">
              <label className="admin-form-label">Slug (URL identifier) *</label>
              <input
                type="text"
                name="slug"
                className="admin-form-input"
                value={formData.slug}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">Kicker / Tagline</label>
              <input
                type="text"
                name="kicker"
                className="admin-form-input"
                value={formData.kicker}
                onChange={handleChange}
                placeholder="PRODUCT · OPERATIONAL INTELLIGENCE"
              />
            </div>
          </div>

          <div className="col-md-3">
            <div className="admin-form-group">
              <label className="admin-form-label">Category</label>
              <input
                type="text"
                name="category"
                className="admin-form-input"
                value={formData.category}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="col-md-3">
            <div className="admin-form-group">
              <label className="admin-form-label">Year</label>
              <input
                type="number"
                name="year"
                className="admin-form-input"
                value={formData.year}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="admin-form-group">
              <label className="admin-form-label">Short Description</label>
              <textarea
                name="short_description"
                className="admin-form-textarea"
                value={formData.short_description}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
          </div>

          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">Roles (comma separated)</label>
              <input
                type="text"
                name="roles"
                className="admin-form-input"
                value={formData.roles}
                onChange={handleChange}
                placeholder="Product Designer, UX/UI, AI"
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="admin-form-group">
              <label className="admin-form-label">Tools / Tech (comma separated)</label>
              <input
                type="text"
                name="tools"
                className="admin-form-input"
                value={formData.tools}
                onChange={handleChange}
                placeholder="Figma, React, Supabase"
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="admin-form-group">
              <label className="admin-form-label">Status</label>
              <select
                name="status"
                className="admin-form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <div className="admin-form-group">
              <label className="admin-form-label">Sort Order</label>
              <input
                type="number"
                name="sort_order"
                className="admin-form-input"
                value={formData.sort_order}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="col-md-4 d-flex align-items-center mt-4">
            <div className="form-check">
              <input
                type="checkbox"
                name="is_featured"
                id="is_featured"
                className="form-check-input"
                checked={formData.is_featured}
                onChange={handleChange}
              />
              <label className="form-check-label fw-semibold ms-2" htmlFor="is_featured">
                Featured on Homepage
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
