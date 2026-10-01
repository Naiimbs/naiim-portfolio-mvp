import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getFooterNavigation, getPublicSiteSettings } from '../../services/siteCms';

export default function Footer() {
  const [navItems, setNavItems] = useState(null);
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
          setNavItems([]);
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

  const hasCmsNav = Boolean(navItems && navItems.length > 0);

  const renderFooterLink = (item) => {
    const isExternal = Boolean(item.open_in_new_tab) || item.href.startsWith('http://') || item.href.startsWith('https://');

    if (isExternal) {
      return (
        <a
          key={item.id}
          href={item.href}
          target={item.open_in_new_tab ? '_blank' : undefined}
          rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
        >
          {item.label}
        </a>
      );
    }

    if (item.href.startsWith('#')) {
      if (isHome) {
        return <a key={item.id} href={item.href}>{item.label}</a>;
      }
      return <Link key={item.id} to={`/${item.href}`}>{item.label}</Link>;
    }

    return <Link key={item.id} to={item.href}>{item.label}</Link>;
  };

  return (
    <footer className="footer">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <Link className="brand" to="/">
          {brandName} <span className="beta-badge">Beta</span>
        </Link>
        <div className="footer-links">
          {hasCmsNav ? (
            navItems.map((item) => renderFooterLink(item))
          ) : isHome ? (
            <>
              <a href="#work">Work</a>
              <a href="#case-studies">Case Studies</a>
              <Link to="/agents">Agents</Link>
              <a href="#copilot">Copilot</a>
              <a href="#career">Career</a>
              <a href="#lab">Lab</a>
              <a href="#about">About</a>
            </>
          ) : (
            <>
              <Link to="/work">Work</Link>
              <Link to="/work">Case Studies</Link>
              <Link to="/agents">Agents</Link>
              <Link to="/copilot">Copilot</Link>
              <Link to="/#career">Career</Link>
              <Link to="/#lab">Lab</Link>
              <Link to="/about">About</Link>
            </>
          )}
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
