import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { captureLeadAndDownload, getLeadByEmail, validateResourceEmail } from '../../services/marketing';
import { getAssetDownloadUrl } from '../../services/resources';
import ResourceSupportCard from './ResourceSupportCard';

const EMPTY_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  role: '',
  marketingConsent: true,
};

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
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(EMPTY_FORM);
      setStep(1);
      setLoading(false);
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !resource) return null;

  const targetAsset = asset || (resource.assets?.find((a) => a.file_url?.endsWith('.zip')) || resource.assets?.[0]);
  const downloadUrl = targetAsset ? getAssetDownloadUrl(targetAsset) : resource.bundle_download_url;
  const downloadName = targetAsset?.name || `${resource.slug}.zip`;
  const localizedResource = resource.i18n?.[currentLang] || {};

  const triggerDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completeDownload = async ({ knownLead = false, existingLead = null } = {}) => {
    setLoading(true);
    setError('');

    try {
      const utmSource = searchParams.get('utm_source') || '';
      const utmMedium = searchParams.get('utm_medium') || '';
      const utmCampaign = searchParams.get('utm_campaign') || '';
      const firstName = existingLead ? (existingLead.name || '').trim().split(/\s+/)[0] : formData.firstName.trim();
      const lastName = existingLead ? (existingLead.name || '').trim().split(/\s+/).slice(1).join(' ') : formData.lastName.trim();
      const name = existingLead?.name || `${firstName} ${lastName}`.trim();
      const role = existingLead?.role || formData.role.trim();

      await captureLeadAndDownload({
        email: formData.email,
        name,
        firstName,
        lastName,
        role,
        company: existingLead?.company || '',
        marketingConsent: formData.marketingConsent,
        knownLead,
        resourceId: resource.id,
        resourceSlug: resource.slug,
        resourceType: resource.resource_type,
        assetName: downloadName,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      setSuccess(true);
      triggerDownload();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('[ResourceLeadFormModal] Submit error:', err);
      setError(err.message?.includes('Disposable')
        ? t('resourceDetail.downloadModal.disposableEmailError')
        : t('resourceDetail.downloadModal.downloadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailContinue = async (event) => {
    event.preventDefault();
    setError('');
    const validation = validateResourceEmail(formData.email);
    if (!validation.valid) {
      setError(validation.reason === 'disposable'
        ? t('resourceDetail.downloadModal.disposableEmailError')
        : t('resourceDetail.downloadModal.emailError'));
      return;
    }

    setLoading(true);
    try {
      const result = await getLeadByEmail(validation.email);
      setFormData((current) => ({ ...current, email: validation.email }));
      if (result.known && result.data) {
        await completeDownload({ knownLead: true, existingLead: result.data });
      } else {
        setStep(2);
      }
    } catch (err) {
      console.error('[ResourceLeadFormModal] Email check error:', err);
      setError(t('resourceDetail.downloadModal.emailCheckError'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(t('resourceDetail.downloadModal.nameError'));
      return;
    }
    if (!formData.role.trim()) {
      setError(t('resourceDetail.downloadModal.roleError'));
      return;
    }
    await completeDownload();
  };

  return (
    <div className="resource-lightbox-modal" onClick={onClose}>
      <div className="resource-lightbox-dialog" style={{ maxWidth: '520px' }} onClick={(event) => event.stopPropagation()}>
        <div className="resource-lightbox-header">
          <div className="d-flex align-items-center gap-2">
            <div className="asset-icon-box bg-success bg-opacity-10 text-success" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              <i className="bi bi-download"></i>
            </div>
            <div>
              <div className="fw-bold text-dark small">{t('resourceDetail.downloadModal.title')}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem', maxWidth: '320px' }}>{downloadName}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-light rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }} aria-label={t('resourceDetail.downloadModal.close')}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="p-4 bg-white">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                <i className="bi bi-check-lg"></i>
              </div>
              <h4 className="fw-bold font-heading mb-1 text-dark">✓ {t('resourceDetail.downloadModal.readyTitle')}</h4>
              <p className="text-secondary small mb-4">{t('resourceDetail.downloadModal.successBody')}</p>
              <div className="text-start">
                <ResourceSupportCard
                  supportUrl={resource.support_url}
                  title={localizedResource.support_title || (currentLang === 'en' ? resource.support_title : undefined)}
                  description={localizedResource.support_description || (currentLang === 'en' ? resource.support_description : undefined)}
                  label={localizedResource.support_label || (currentLang === 'en' ? resource.support_label : undefined)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="d-flex align-items-center gap-2 mb-3" aria-label={t('resourceDetail.downloadModal.progressLabel')}>
                <span className={`badge rounded-pill ${step === 1 ? 'bg-success' : 'bg-success bg-opacity-25 text-success'}`}>1</span>
                <span className="small text-muted">{t('resourceDetail.downloadModal.stepEmail')}</span>
                <span className="flex-grow-1 border-top"></span>
                <span className={`badge rounded-pill ${step === 2 ? 'bg-success' : 'bg-light text-muted'}`}>2</span>
                <span className="small text-muted">{t('resourceDetail.downloadModal.stepProfile')}</span>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i><span>{error}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleEmailContinue}>
                  <p className="text-secondary small mb-3">{t('resourceDetail.downloadModal.emailIntro')}</p>
                  <label className="form-label small fw-bold text-dark mb-1" htmlFor="resource-download-email">
                    {t('resourceDetail.downloadModal.email')} <span className="text-danger">*</span>
                  </label>
                  <input
                    id="resource-download-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t('resourceDetail.downloadModal.emailPlaceholder')}
                    className="form-control form-control-sm rounded-3 mb-2"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                  <div className="form-text small mb-4">{t('resourceDetail.downloadModal.emailPrivacy')}</div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" onClick={onClose} className="btn btn-sm btn-outline-secondary rounded-pill px-3">{t('resourceDetail.downloadModal.cancel')}</button>
                    <button type="submit" disabled={loading} className="btn btn-sm btn-primary-custom rounded-pill px-4 fw-bold">
                      {loading ? <span className="spinner-border spinner-border-sm" role="status"></span> : <>{t('resourceDetail.downloadModal.continue')} <i className="bi bi-arrow-right ms-1"></i></>}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleProfileSubmit}>
                  <p className="text-secondary small mb-3">{t('resourceDetail.downloadModal.profileIntro')}</p>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-dark mb-1" htmlFor="resource-download-first-name">{t('resourceDetail.downloadModal.firstName')} <span className="text-danger">*</span></label>
                      <input id="resource-download-first-name" type="text" required autoComplete="given-name" className="form-control form-control-sm rounded-3" value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-dark mb-1" htmlFor="resource-download-last-name">{t('resourceDetail.downloadModal.lastName')} <span className="text-danger">*</span></label>
                      <input id="resource-download-last-name" type="text" required autoComplete="family-name" className="form-control form-control-sm rounded-3" value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} />
                    </div>
                  </div>
                  <div className="mt-3 mb-3">
                    <label className="form-label small fw-bold text-dark mb-1" htmlFor="resource-download-role">{t('resourceDetail.downloadModal.role')} <span className="text-danger">*</span></label>
                    <input id="resource-download-role" type="text" required autoComplete="organization-title" placeholder={t('resourceDetail.downloadModal.rolePlaceholder')} className="form-control form-control-sm rounded-3" value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })} />
                  </div>
                  <div className="form-check mb-4">
                    <input type="checkbox" className="form-check-input" id="marketingConsentCheck" checked={formData.marketingConsent} onChange={(event) => setFormData({ ...formData, marketingConsent: event.target.checked })} />
                    <label className="form-check-label text-secondary" htmlFor="marketingConsentCheck" style={{ fontSize: '0.78rem' }}>{t('resourceDetail.downloadModal.marketingConsent')}</label>
                  </div>
                  <div className="d-flex justify-content-between gap-2">
                    <button type="button" onClick={() => { setStep(1); setError(''); }} className="btn btn-sm btn-outline-secondary rounded-pill px-3"><i className="bi bi-arrow-left me-1"></i>{t('resourceDetail.downloadModal.back')}</button>
                    <button type="submit" disabled={loading} className="btn btn-sm btn-primary-custom rounded-pill px-4 fw-bold d-flex align-items-center gap-1">
                      {loading ? <><span className="spinner-border spinner-border-sm" role="status"></span><span>{t('resourceDetail.downloadModal.preparing')}</span></> : <><i className="bi bi-download"></i><span>{t('resourceDetail.downloadModal.download')}</span></>}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
