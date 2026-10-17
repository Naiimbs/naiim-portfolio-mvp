import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : (i18n.language?.startsWith('ar') ? 'ar' : 'en');
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
  const localizedResource = resource.i18n?.[currentLang] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('resourceDetail.downloadModal.nameError'));
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError(t('resourceDetail.downloadModal.emailError'));
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
      setError(t('resourceDetail.downloadModal.downloadError'));
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
              <div className="fw-bold text-dark small">{t('resourceDetail.downloadModal.title')}</div>
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
              <h4 className="fw-bold font-heading mb-1 text-dark">✓ {t('resourceDetail.downloadModal.readyTitle')}</h4>
              <p className="text-secondary small mb-4">
                {t('resourceDetail.downloadModal.successBody')}
              </p>
              
              <div className="text-start">
                <ResourceSupportCard 
                  supportUrl={resource.support_url}
                  title={localizedResource.support_title || resource.support_title}
                  description={localizedResource.support_description || resource.support_description}
                  label={localizedResource.support_label || resource.support_label}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-secondary small">
                {t('resourceDetail.downloadModal.intro')}
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
                  {t('resourceDetail.downloadModal.fullName')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('resourceDetail.downloadModal.namePlaceholder')}
                  className="form-control form-control-sm rounded-3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark mb-1">
                  {t('resourceDetail.downloadModal.email')} <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder={t('resourceDetail.downloadModal.emailPlaceholder')}
                  className="form-control form-control-sm rounded-3"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Role / Company */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark mb-1">
                  {t('resourceDetail.downloadModal.roleCompany')} <span className="text-muted fw-normal">({t('resourceDetail.downloadModal.optional')})</span>
                </label>
                <input
                  type="text"
                  placeholder={t('resourceDetail.downloadModal.rolePlaceholder')}
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
                  {t('resourceDetail.downloadModal.marketingConsent')}
                </label>
              </div>

              {/* Submit CTA */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                >
                  {t('resourceDetail.downloadModal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sm btn-primary-custom rounded-pill px-4 fw-bold d-flex align-items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>{t('resourceDetail.downloadModal.preparing')}</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download"></i>
                      <span>{t('resourceDetail.downloadModal.download')}</span>
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
