import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getHeaderNavigation, getPublicSiteSettings, DEFAULT_HEADER_NAV } from '../../services/siteCms';

export default function Navbar() {
  const [navItems, setNavItems] = useState(DEFAULT_HEADER_NAV);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    async function fetchNavAndSettings() {
      try {
        const [navRes, settingsRes] = await Promise.all([
          getHeaderNavigation(),
          getPublicSiteSettings(),
        ]);
        if (isMounted) {
          if (navRes?.data && Array.isArray(navRes.data) && navRes.data.length > 0) {
            setNavItems(navRes.data.filter(Boolean));
          } else {
            setNavItems(DEFAULT_HEADER_NAV);
          }
          if (settingsRes?.data) {
            setSiteSettings(settingsRes.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setNavItems(DEFAULT_HEADER_NAV);
        }
      }
    }
    fetchNavAndSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isNavOpen) {
        setIsNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavOpen]);

  // Handle smooth scroll to hash when navigating between pages
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace(/^#/, '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const closeNav = () => setIsNavOpen(false);

  const isHome = location.pathname === '/';

  const brandName = siteSettings?.site_name || 'NAÏM BSILI';
  const ctaLabel = siteSettings?.contact_cta_label || "Let's Talk";
  const rawCtaHref = typeof siteSettings?.contact_cta_href === 'string' ? siteSettings.contact_cta_href.trim() : '#contact';
  const ctaHref = rawCtaHref || '#contact';

  const checkIsActive = (href) => {
    if (!href || typeof href !== 'string') return false;
    const currentPath = location.pathname;
    const currentHash = location.hash;

    // Anchor links
    if (href.startsWith('#') || href.startsWith('/#')) {
      const anchor = href.startsWith('/#') ? href.substring(1) : href;
      const cleanAnchor = anchor.startsWith('#') ? anchor : `#${anchor}`;
      return isHome && currentHash === cleanAnchor;
    }

    // Work section (including case studies)
    if (href === '/work') {
      return currentPath === '/work' || currentPath.startsWith('/work/') || currentPath.startsWith('/case-studies');
    }

    // Agents section
    if (href === '/agents') {
      return currentPath === '/agents' || currentPath.startsWith('/agents/');
    }

    // Blog section
    if (href === '/blog') {
      return currentPath === '/blog' || currentPath.startsWith('/blog/');
    }

    // About section
    if (href === '/about') {
      return currentPath === '/about';
    }

    // Copilot section
    if (href === '/copilot') {
      return currentPath === '/copilot';
    }

    // Home
    if (href === '/') {
      return currentPath === '/' && !currentHash;
    }

    // Generic exact match
    return currentPath === href;
  };

  const renderNavLink = (item) => {
    if (!item) return null;
    const href = typeof item.href === 'string' ? item.href.trim() : '#';
    const label = item.label || 'Link';
    const isExternal = Boolean(item.open_in_new_tab) || href.startsWith('http://') || href.startsWith('https://');
    const isActive = !isExternal && checkIsActive(href);
    const linkClass = `nav-link ${isActive ? 'active' : ''}`.trim();

    if (isExternal) {
      return (
        <a
          className={linkClass}
          href={href}
          target={item.open_in_new_tab ? '_blank' : undefined}
          rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
          onClick={closeNav}
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
        return (
          <a
            className={linkClass}
            href={cleanHash}
            onClick={closeNav}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </a>
        );
      }
      return (
        <Link
          className={linkClass}
          to={{ pathname: '/', hash: cleanHash }}
          onClick={closeNav}
          aria-current={isActive ? 'page' : undefined}
        >
          {label}
        </Link>
      );
    }

    return (
      <Link
        className={linkClass}
        to={href}
        onClick={closeNav}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </Link>
    );
  };

  const displayItems = (navItems && Array.isArray(navItems) && navItems.length > 0 ? navItems : DEFAULT_HEADER_NAV).filter(Boolean);

  const renderCtaButton = () => {
    const isCtaAnchor = ctaHref.startsWith('#') || ctaHref.startsWith('/#');
    if (isCtaAnchor) {
      const anchorHash = ctaHref.startsWith('/#') ? ctaHref.substring(1) : ctaHref;
      const cleanHash = anchorHash.startsWith('#') ? anchorHash : `#${anchorHash}`;
      if (isHome) {
        return (
          <a className="btn btn-dark rounded-pill px-4" href={cleanHash} onClick={closeNav}>
            {ctaLabel} <i className="bi bi-arrow-up-right ms-1"></i>
          </a>
        );
      }
      return (
        <Link className="btn btn-dark rounded-pill px-4" to={{ pathname: '/', hash: cleanHash }} onClick={closeNav}>
          {ctaLabel} <i className="bi bi-arrow-up-right ms-1"></i>
        </Link>
      );
    }

    if (ctaHref.startsWith('/')) {
      return (
        <Link className="btn btn-dark rounded-pill px-4" to={ctaHref} onClick={closeNav}>
          {ctaLabel} <i className="bi bi-arrow-up-right ms-1"></i>
        </Link>
      );
    }

    return (
      <a className="btn btn-dark rounded-pill px-4" href={ctaHref} onClick={closeNav}>
        {ctaLabel} <i className="bi bi-arrow-up-right ms-1"></i>
      </a>
    );
  };

  return (
    <nav className={`navbar navbar-expand-lg fixed-top site-nav ${isScrolled ? 'scrolled' : ''}`} id="siteNav">
      <div className="container">
        <Link className="navbar-brand brand" to="/" onClick={closeNav}>
          {siteSettings?.logo_url ? (
            <img src={siteSettings.logo_url} alt={brandName} height="28" className="me-2 rounded" />
          ) : null}
          {brandName} <span className="beta-badge">Beta</span>
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setIsNavOpen(!isNavOpen)}
          aria-controls="mainNav"
          aria-expanded={isNavOpen}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2"></i>
        </button>

        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="mainNav">
          <ul className="navbar-nav mx-auto gap-lg-2">
            {displayItems.map((item, idx) => (
              <li key={item.id || `nav-${item.href || idx}`} className="nav-item">
                {renderNavLink(item)}
              </li>
            ))}
          </ul>
          {renderCtaButton()}
        </div>
      </div>
    </nav>
  );
}
