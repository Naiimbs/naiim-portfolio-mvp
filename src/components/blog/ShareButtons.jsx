import React, { useState } from 'react';

/**
 * Social share buttons for an article.
 */
export default function ShareButtons({ url, title = '' }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(title);

  const links = [
    { label: 'LinkedIn', icon: 'bi-linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'X', icon: 'bi-twitter-x', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: 'Facebook', icon: 'bi-facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'WhatsApp', icon: 'bi-whatsapp', href: `https://wa.me/?text=${t}%20${u}` },
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
        Share:
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center"
          title={`Share on ${l.label}`}
          aria-label={`Share on ${l.label}`}
        >
          <i className={`bi ${l.icon}`}></i>
        </a>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center"
        onClick={handleCopy}
        title="Copy link"
      >
        <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-link-45deg'} me-1`}></i>
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
