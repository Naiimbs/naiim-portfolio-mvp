import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { captureCvDownload, validateResourceEmail } from '../../services/marketing';

const CV_URL = '/downloads/Naiim_Bsili_CV_v2.3.1.pdf';

export default function CvDownloadModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setMarketingConsent(false);
      setLoading(false);
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerDownload = () => {
    const link = document.createElement('a');
    link.href = CV_URL;
    link.download = 'Naiim_Bsili_CV_v2.3.1.pdf';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const validation = validateResourceEmail(email);
    if (!validation.valid) {
      setError(validation.reason === 'disposable'
        ? t('cvDownload.disposableEmailError')
        : t('cvDownload.emailError'));
      return;
    }

    setLoading(true);
    try {
      await captureCvDownload({ email: validation.email, marketingConsent });
      setSuccess(true);
      triggerDownload();
    } catch (err) {
      console.error('[CvDownloadModal] Submit error:', err);
      setError(err.message || t('cvDownload.downloadError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resource-lightbox-modal" onClick={onClose} role="presentation">
      <div className="resource-lightbox-dialog" style={{ maxWidth: '520px' }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cv-download-title">
        <div className="resource-lightbox-header">
          <div className="d-flex align-items-center gap-2">
            <div className="asset-icon-box bg-success bg-opacity-10 text-success" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              <i className="bi bi-file-earmark-person"></i>
            </div>
            <div>
              <div id="cv-download-title" className="fw-bold text-dark small">{t('cvDownload.title')}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem', maxWidth: '320px' }}>Naiim_Bsili_CV_v2.3.1.pdf</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-light rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }} aria-label={t('cvDownload.close')}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="p-4 bg-white">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                <i className="bi bi-check-lg"></i>
              </div>
              <h4 className="fw-bold font-heading mb-1 text-dark">{t('cvDownload.readyTitle')}</h4>
              <p className="text-secondary small mb-3">{t('cvDownload.successBody')}</p>
              <button type="button" onClick={triggerDownload} className="btn btn-primary-custom rounded-pill px-4 fw-bold">
                <i className="bi bi-download me-1"></i>{t('cvDownload.downloadAgain')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-secondary small mb-3">{t('cvDownload.intro')}</p>
              {error && <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">{error}</div>}
              <label className="form-label small fw-bold text-dark mb-1" htmlFor="cv-download-email">
                {t('cvDownload.email')} <span className="text-danger">*</span>
              </label>
              <input
                id="cv-download-email"
                type="email"
                required
                autoComplete="email"
                placeholder={t('cvDownload.emailPlaceholder')}
                className="form-control form-control-sm rounded-3 mb-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="form-text small mb-3">{t('cvDownload.emailPrivacy')}</div>
              <div className="form-check mb-4">
                <input type="checkbox" className="form-check-input" id="cv-marketing-consent" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
                <label className="form-check-label text-secondary" htmlFor="cv-marketing-consent" style={{ fontSize: '0.78rem' }}>{t('cvDownload.marketingConsent')}</label>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" onClick={onClose} className="btn btn-sm btn-outline-secondary rounded-pill px-3">{t('cvDownload.cancel')}</button>
                <button type="submit" disabled={loading} className="btn btn-sm btn-primary-custom rounded-pill px-4 fw-bold">
                  {loading ? <span className="spinner-border spinner-border-sm" role="status"></span> : <><i className="bi bi-download me-1"></i>{t('cvDownload.download')}</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
