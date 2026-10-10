import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { captureLeadAndDownload } from '../../services/marketing';
import { getAssetDownloadUrl } from '../../services/resources';
import ResourceSupportCard from './ResourceSupportCard';

export default function ResourceLeadFormModal({
  isOpen,
  onClose,
  resource,
  asset,
  onSuccess,
}) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleCompany: '',
    marketingConsent: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !resource) return null;

  const targetAsset = asset || (resource.assets?.find((a) => a.file_url?.endsWith('.zip')) || resource.assets?.[0]);
  const rawDownloadUrl = targetAsset ? getAssetDownloadUrl(targetAsset) : resource.bundle_download_url;
  
  // Clean up URL if it has download parameter for display/click purposes
  const downloadUrl = rawDownloadUrl;
  const downloadName = targetAsset?.name || `${resource.slug}.zip`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid work or personal email address.');
      return;
    }

    setLoading(true);

    try {
      // Capture UTMs from current URL query params
      const utmSource = searchParams.get('utm_source') || '';
      const utmMedium = searchParams.get('utm_medium') || '';
      const utmCampaign = searchParams.get('utm_campaign') || '';

      await captureLeadAndDownload({
        email: formData.email,
        name: formData.name,
        role: formData.roleCompany,
        company: formData.roleCompany,
        marketingConsent: formData.marketingConsent,
        resourceId: resource.id,
        resourceSlug: resource.slug,
        resourceType: resource.resource_type,
        assetName: downloadName,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      setSuccess(true);

      // Trigger automatic file download
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      if (onSuccess) {
        onSuccess();
      }

      // We do NOT auto-close the modal here so the user can see the Support Card
    } catch (err) {
      console.error('[ResourceLeadFormModal] Submit error:', err);
      setError(err.message || 'Failed to register download. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resource-lightbox-modal" onClick={onClose}>
      <div
        className="resource-lightbox-dialog"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="resource-lightbox-header">
          <div className="d-flex align-items-center gap-2">
            <div className="asset-icon-box bg-success bg-opacity-10 text-success" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              <i className="bi bi-download"></i>
            </div>
            <div>
              <div className="fw-bold text-dark small">Download Free Resource</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem', maxWidth: '320px' }}>
                {downloadName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light rounded-circle"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 bg-white">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                <i className="bi bi-check-lg"></i>
              </div>
              <h4 className="fw-bold font-heading mb-1 text-dark">✓ Your download is ready</h4>
              <p className="text-secondary small mb-4">
                The resource has been downloaded successfully.
              </p>
              
              <div className="text-start">
                <ResourceSupportCard 
                  supportUrl={resource.support_url}
                  title={resource.support_title}
                  description={resource.support_description}
                  label={resource.support_label}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-secondary small">
                Get free, instant access to the complete resource bundle. Enter your details below:
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark mb-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  className="form-control form-control-sm rounded-3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark mb-1">
                  Work or Personal Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="form-control form-control-sm rounded-3"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Role / Company */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark mb-1">
                  Role / Company <span className="text-muted fw-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Product Designer at Acme"
                  className="form-control form-control-sm rounded-3"
                  value={formData.roleCompany}
                  onChange={(e) => setFormData({ ...formData, roleCompany: e.target.value })}
                />
              </div>

              {/* Marketing Consent */}
              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="marketingConsentCheck"
                  checked={formData.marketingConsent}
                  onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                />
                <label className="form-check-label text-secondary" htmlFor="marketingConsentCheck" style={{ fontSize: '0.78rem' }}>
                  I would like to receive occasional updates about new AI agent skills, design systems, and toolkits.
                </label>
              </div>

              {/* Submit CTA */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sm btn-primary-custom rounded-pill px-4 fw-bold d-flex align-items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Preparing Download...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download"></i>
                      <span>Download for Free</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
