import React, { useState, useEffect } from 'react';
import { getAdminSiteSettings, updateMultipleSiteSettings } from '../../services/siteCms';
import MediaPickerModal from '../components/cms/MediaPickerModal';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    site_name: '',
    tagline: '',
    logo_url: '',
    contact_email: '',
    contact_cta_label: '',
    contact_cta_href: '',
    linkedin: '',
    github: '',
    instagram: '',
    behance: '',
    dribbble: '',
    footer_text: '',
    copyright_text: '',
    default_seo_title: '',
    default_seo_description: '',
    default_og_image: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errors, setErrors] = useState({});

  // Media picker target state
  const [pickerTarget, setPickerTarget] = useState(null); // 'logo_url' | 'default_og_image' | null

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const res = await getAdminSiteSettings();
    if (res.data) {
      setSettings((prev) => ({ ...prev, ...res.data }));
    }
    setLoading(false);
  }

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Email validation
    if (settings.contact_email && settings.contact_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.contact_email.trim())) {
        newErrors.contact_email = 'Invalid email address format (e.g. name@domain.com)';
      }
    }

    // Social URLs validation
    const urlFields = ['linkedin', 'github', 'instagram', 'behance', 'dribbble'];
    const urlRegex = /^https?:\/\/.+/i;

    urlFields.forEach((field) => {
      const val = settings[field];
      if (val && val.trim() !== '' && !urlRegex.test(val.trim())) {
        newErrors[field] = 'Must be a valid URL starting with http:// or https://';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!validate()) {
      setFeedback({ type: 'danger', message: 'Please fix the validation errors before saving.' });
      return;
    }

    setSaving(true);
    const res = await updateMultipleSiteSettings(settings, true);
    setSaving(false);

    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save site settings.' });
    } else {
      setFeedback({ type: 'success', message: 'Site settings saved successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="admin-settings-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Global Site Settings</h1>
          <p className="text-muted small mb-0">Configure site identity, contact, social links, footer, and default SEO.</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${feedback.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading site settings...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* 1. SITE IDENTITY */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="card-title fw-bold mb-1">
                <i className="bi bi-person-badge me-2 text-primary"></i> Site Identity
              </h5>
              <p className="text-muted small mb-0">Global brand name, tagline, and site logo.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Site / Brand Name</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="e.g. Naïm Bsili"
                    value={settings.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Tagline / Professional Role</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="e.g. Senior UX/UI Designer · AI Product Builder"
                    value={settings.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Logo Image URL</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded-start-3"
                      placeholder="https://... or /assets/..."
                      value={settings.logo_url}
                      onChange={(e) => handleChange('logo_url', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-end-3"
                      onClick={() => setPickerTarget('logo_url')}
                    >
                      <i className="bi bi-images me-1"></i> Select Asset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CONTACT */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="card-title fw-bold mb-1">
                <i className="bi bi-envelope-at me-2 text-success"></i> Contact & CTA Settings
              </h5>
              <p className="text-muted small mb-0">Contact email address and global call-to-action button.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Contact Email</label>
                  <input
                    type="email"
                    className={`form-control rounded-3 ${errors.contact_email ? 'is-invalid' : ''}`}
                    placeholder="hi@naiimbsili.com"
                    value={settings.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                  />
                  {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">CTA Button Text</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Let's Talk"
                    value={settings.contact_cta_label}
                    onChange={(e) => handleChange('contact_cta_label', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">CTA Destination (href)</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="#contact or /about"
                    value={settings.contact_cta_href}
                    onChange={(e) => handleChange('contact_cta_href', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. SOCIAL LINKS */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="card-title fw-bold mb-1">
                <i className="bi bi-share me-2 text-info"></i> Social Network Profiles
              </h5>
              <p className="text-muted small mb-0">Social links rendered in footer and contact sections.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">LinkedIn URL</label>
                  <input
                    type="url"
                    className={`form-control rounded-3 ${errors.linkedin ? 'is-invalid' : ''}`}
                    placeholder="https://linkedin.com/in/..."
                    value={settings.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                  />
                  {errors.linkedin && <div className="invalid-feedback">{errors.linkedin}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">GitHub URL</label>
                  <input
                    type="url"
                    className={`form-control rounded-3 ${errors.github ? 'is-invalid' : ''}`}
                    placeholder="https://github.com/..."
                    value={settings.github}
                    onChange={(e) => handleChange('github', e.target.value)}
                  />
                  {errors.github && <div className="invalid-feedback">{errors.github}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Instagram URL</label>
                  <input
                    type="url"
                    className={`form-control rounded-3 ${errors.instagram ? 'is-invalid' : ''}`}
                    placeholder="https://instagram.com/..."
                    value={settings.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                  />
                  {errors.instagram && <div className="invalid-feedback">{errors.instagram}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Behance URL</label>
                  <input
                    type="url"
                    className={`form-control rounded-3 ${errors.behance ? 'is-invalid' : ''}`}
                    placeholder="https://behance.net/..."
                    value={settings.behance}
                    onChange={(e) => handleChange('behance', e.target.value)}
                  />
                  {errors.behance && <div className="invalid-feedback">{errors.behance}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Dribbble URL</label>
                  <input
                    type="url"
                    className={`form-control rounded-3 ${errors.dribbble ? 'is-invalid' : ''}`}
                    placeholder="https://dribbble.com/..."
                    value={settings.dribbble}
                    onChange={(e) => handleChange('dribbble', e.target.value)}
                  />
                  {errors.dribbble && <div className="invalid-feedback">{errors.dribbble}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* 4. FOOTER */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="card-title fw-bold mb-1">
                <i className="bi bi-layout-south me-2 text-warning"></i> Footer Content
              </h5>
              <p className="text-muted small mb-0">Global footer description text and copyright notice.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Footer Subtitle / Text</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Building intelligent digital products & AI systems."
                    value={settings.footer_text}
                    onChange={(e) => handleChange('footer_text', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Copyright Notice</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="© 2026 Naïm Bsili. All rights reserved."
                    value={settings.copyright_text}
                    onChange={(e) => handleChange('copyright_text', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. SEO DEFAULTS */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="card-title fw-bold mb-1">
                <i className="bi bi-search me-2 text-secondary"></i> Default SEO Metadata
              </h5>
              <p className="text-muted small mb-0">Fallback SEO title, meta description, and OpenGraph image when page-specific SEO is omitted.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Default SEO Title</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Naïm Bsili — Product Designer & AI Builder"
                    value={settings.default_seo_title}
                    onChange={(e) => handleChange('default_seo_title', e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Default Meta Description</label>
                  <textarea
                    rows={3}
                    className="form-control rounded-3"
                    placeholder="Naïm Bsili — Product Designer & AI Builder..."
                    value={settings.default_seo_description}
                    onChange={(e) => handleChange('default_seo_description', e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Default Open Graph Image URL</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded-start-3"
                      placeholder="/assets/images/naim-portrait.jpg"
                      value={settings.default_og_image}
                      onChange={(e) => handleChange('default_og_image', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-end-3"
                      onClick={() => setPickerTarget('default_og_image')}
                    >
                      <i className="bi bi-images me-1"></i> Select Asset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-end mb-5">
            <button type="submit" className="btn btn-primary rounded-pill px-5 py-2 fw-semibold" disabled={saving}>
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Media Picker Modal */}
      {pickerTarget && (
        <MediaPickerModal
          onSelectAsset={(asset) => {
            handleChange(pickerTarget, asset.public_url);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
