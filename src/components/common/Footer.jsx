import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getFooterNavigation, getPublicSiteSettings, DEFAULT_FOOTER_NAV } from '../../services/siteCms';

export default function Footer() {
  const [navItems, setNavItems] = useState(DEFAULT_FOOTER_NAV);
  const [siteSettings, setSiteSettings] = useState(null);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    let isMounted = true;
    async function fetchNavAndSettings() {
      const [navRes, settingsRes] = await Promise.all([
        getFooterNavigation(),
        getPublicSiteSettings(),
      ]);
      if (isMounted) {
        if (navRes.data && navRes.data.length > 0) {
          setNavItems(navRes.data);
        } else {
          setNavItems(DEFAULT_FOOTER_NAV);
        }
        if (settingsRes.data) {
          setSiteSettings(settingsRes.data);
        }
      }
    }
    fetchNavAndSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const brandName = siteSettings?.site_name || 'NAÏM BSILI';
  const copyrightText = siteSettings?.copyright_text || '© 2026 Naïm Bsili. All rights reserved.';
  const emailAddr = siteSettings?.contact_email ? `mailto:${siteSettings.contact_email}` : 'mailto:hi@naiimbsili.com';
  const linkedinUrl = siteSettings?.linkedin || 'https://tn.linkedin.com/in/bsili-naiim';
  const githubUrl = siteSettings?.github || 'https://github.com/naiimbsili';
  const instagramUrl = siteSettings?.instagram || 'https://www.instagram.com/designer.tunisien/';
  const behanceUrl = siteSettings?.behance || '';
  const dribbbleUrl = siteSettings?.dribbble || '';

  const displayNavItems = (navItems && Array.isArray(navItems) && navItems.length > 0 ? navItems : DEFAULT_FOOTER_NAV).filter(Boolean);

  const renderFooterLink = (item) => {
    if (!item) return null;
    const href = typeof item.href === 'string' ? item.href.trim() : '#';
    const label = item.label || 'Link';
    const isExternal = Boolean(item.open_in_new_tab) || href.startsWith('http://') || href.startsWith('https://');

    if (isExternal) {
      return (
        <a
          key={item.id || `ftr-${href}`}
          href={href}
          target={item.open_in_new_tab ? '_blank' : undefined}
          rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
        >
          {label}
        </a>
      );
    }

    const isAnchor = href.startsWith('#') || href.startsWith('/#');
    if (isAnchor) {
      const anchorHash = href.startsWith('/#') ? href.substring(1) : href;
      const cleanHash = anchorHash.startsWith('#') ? anchorHash : `#${anchorHash}`;
      if (isHome) {
        return <a key={item.id || `ftr-${cleanHash}`} href={cleanHash}>{label}</a>;
      }
      return <Link key={item.id || `ftr-${cleanHash}`} to={{ pathname: '/', hash: cleanHash }}>{label}</Link>;
    }

    return <Link key={item.id || `ftr-${href}`} to={href}>{label}</Link>;
  };

  return (
    <footer className="footer">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <Link className="brand" to="/">
          {brandName} <span className="beta-badge">Beta</span>
        </Link>
        <div className="footer-links">
          {displayNavItems.map((item) => renderFooterLink(item))}
        </div>
        <div className="socials">
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i className="bi bi-linkedin"></i>
            </a>
          )}
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <i className="bi bi-github"></i>
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="bi bi-instagram"></i>
            </a>
          )}
          {behanceUrl && (
            <a href={behanceUrl} target="_blank" rel="noopener noreferrer" aria-label="Behance">
              <i className="bi bi-behance"></i>
            </a>
          )}
          {dribbbleUrl && (
            <a href={dribbbleUrl} target="_blank" rel="noopener noreferrer" aria-label="Dribbble">
              <i className="bi bi-dribbble"></i>
            </a>
          )}
          <a href="https://www.tiktok.com/@bsilinaiim" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <i className="bi bi-tiktok"></i>
          </a>
          {emailAddr && (
            <a href={emailAddr} aria-label="Email">
              <i className="bi bi-envelope"></i>
            </a>
          )}
        </div>
      </div>
      <div className="container copyright">{copyrightText}</div>
    </footer>
  );
}
