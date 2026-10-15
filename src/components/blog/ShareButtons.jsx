import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Social share buttons for an article.
 */
export default function ShareButtons({ url, title = '' }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const u = encodeURIComponent(shareUrl);
  const titleEnc = encodeURIComponent(title);

  const links = [
    { label: 'LinkedIn', icon: 'bi-linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'X', icon: 'bi-twitter-x', href: `https://twitter.com/intent/tweet?url=${u}&text=${titleEnc}` },
    { label: 'Facebook', icon: 'bi-facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'WhatsApp', icon: 'bi-whatsapp', href: `https://wa.me/?text=${titleEnc}%20${u}` },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="d-flex align-items-center flex-wrap gap-2">
      <span className="small fw-semibold text-uppercase text-muted me-1" style={{ fontSize: '0.7rem' }}>
        {t('share.label')}
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center"
          title={t('share.on', { network: l.label })}
          aria-label={t('share.on', { network: l.label })}
        >
          <i className={`bi ${l.icon}`}></i>
        </a>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center"
        onClick={handleCopy}
        title={t('share.copy')}
      >
        <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-link-45deg'} me-1`}></i>
        {copied ? t('share.copied') : t('share.copy')}
      </button>
    </div>
  );
}
