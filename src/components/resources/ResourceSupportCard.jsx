import React from 'react';
import { useTranslation } from 'react-i18next';
import ba9chichLogo from '../../assets/images/logo-bakchich.svg';

export default function ResourceSupportCard({
  supportUrl = 'https://ba9chich.com/en/NaiimBsy',
  title,
  description,
  label,
}) {
  const { t } = useTranslation();
  const displayTitle = title || t('resourceDetail.support.title');
  const displayDescription = description || t('resourceDetail.support.description');
  const displayLabel = label || t('resourceDetail.support.label');
  // Normalize Ba9chich URL
  const normalizedUrl = (supportUrl || 'https://ba9chich.com/en/NaiimBsy').replace('ba9chich.com//', 'ba9chich.com/');

  return (
    <div
      className="p-4 rounded-4 border shadow-xs"
      style={{
        backgroundColor: '#ffffff',
        borderColor: 'var(--line)',
        background: 'linear-gradient(135deg, #ffffff 0%, var(--green-soft) 100%)',
      }}
    >
      <div className="d-flex flex-column align-items-start gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="badge px-2.5 py-1 rounded-pill bg-warning text-dark font-monospace" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
            {displayTitle}
          </span>
        </div>
        
        <p className="text-secondary small mb-1 whitespace-pre-line" style={{ fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
          {displayDescription}
        </p>

        <div className="mt-2 d-flex align-items-center gap-3">
          <a
            href={normalizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2 shadow-xs text-decoration-none"
            style={{ fontSize: '0.85rem' }}
          >
            <span>{displayLabel}</span>
          </a>
          <img src={ba9chichLogo} alt="Ba9chich" style={{ height: '24px', opacity: 0.8 }} />
        </div>
        
        <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
          {t('resourceDetail.support.optionalNote')}
        </div>
      </div>
    </div>
  );
}
