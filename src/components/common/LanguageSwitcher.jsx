import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, setAppLanguage, getSavedLanguage } from '../../i18n';

/**
 * LanguageSwitcher — in-place language toggle (FR / EN / AR).
 *
 * Changes the UI language without navigating (persisted to localStorage) and
 * flips the document direction to RTL for Arabic. Compact dropdown that fits in
 * the navbar.
 */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState(getSavedLanguage());
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Keep the saved language applied on first mount (direction + <html lang>).
  useEffect(() => {
    setAppLanguage(getSavedLanguage());
  }, []);

  // Reflect external language changes (e.g. from elsewhere in the app).
  useEffect(() => {
    const handler = (lng) => setCurrent(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (code) => {
    setAppLanguage(code);
    setCurrent(code);
    setOpen(false);
  };

  const active = SUPPORTED_LANGUAGES.find((l) => l.code === current) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`lang-switcher position-relative ${className}`} ref={ref}>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${active.name}`}
        title={active.name}
      >
        <i className="bi bi-translate"></i>
        <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>{active.label}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '0.65rem' }}></i>
      </button>

      {open && (
        <ul
          className="list-unstyled position-absolute end-0 mt-1 py-1 bg-white border rounded-3 shadow-sm"
          role="listbox"
          style={{ minWidth: '140px', zIndex: 1080 }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === current}>
              <button
                type="button"
                className={`dropdown-item-like w-100 text-start border-0 bg-transparent px-3 py-2 d-flex align-items-center justify-content-between ${
                  lang.code === current ? 'fw-semibold text-primary' : 'text-dark'
                }`}
                style={{ fontSize: '0.88rem', cursor: 'pointer' }}
                onClick={() => choose(lang.code)}
              >
                <span>{lang.name}</span>
                {lang.code === current && <i className="bi bi-check2"></i>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
