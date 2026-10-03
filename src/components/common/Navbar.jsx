import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getHeaderNavigation, getPublicSiteSettings } from '../../services/siteCms';

export default function Navbar() {
  const [navItems, setNavItems] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    async function fetchNavAndSettings() {
      const [navRes, settingsRes] = await Promise.all([
        getHeaderNavigation(),
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeNav = () => setIsNavOpen(false);

  const isHome = location.pathname === '/';

  const brandName = siteSettings?.site_name || 'NAÏM BSILI';
  const ctaLabel = siteSettings?.contact_cta_label || "Let's Talk";
  const ctaHref = siteSettings?.contact_cta_href || '#contact';

  const renderNavLink = (item) => {
    const isExternal = Boolean(item.open_in_new_tab) || item.href.startsWith('http://') || item.href.startsWith('https://');

    if (isExternal) {
      return (
        <a
          key={item.id}
          className="nav-link"
          href={item.href}
          target={item.open_in_new_tab ? '_blank' : undefined}
          rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
          onClick={closeNav}
        >
          {item.label}
        </a>
      );
    }

    if (item.href.startsWith('#')) {
      if (isHome) {
        return (
          <a key={item.id} className="nav-link" href={item.href} onClick={closeNav}>
            {item.label}
          </a>
        );
      }
      return (
        <Link key={item.id} className="nav-link" to={`/${item.href}`} onClick={closeNav}>
          {item.label}
        </Link>
      );
    }

    return (
      <Link key={item.id} className="nav-link" to={item.href} onClick={closeNav}>
        {item.label}
      </Link>
    );
  };

  const hasCmsNav = Boolean(navItems && navItems.length > 0);

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
            {hasCmsNav ? (
              navItems.map((item) => (
                <li key={item.id} className="nav-item">
                  {renderNavLink(item)}
                </li>
              ))
            ) : (
              <>
                <li className="nav-item">
                  {isHome ? (
                    <a className="nav-link" href="#work" onClick={closeNav}>Work</a>
                  ) : (
                    <Link className="nav-link" to="/work" onClick={closeNav}>Work</Link>
                  )}
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/agents" onClick={closeNav}>Agents</Link>
                </li>
                <li className="nav-item">
                  {isHome ? (
                    <a className="nav-link" href="#copilot" onClick={closeNav}>Copilot</a>
                  ) : (
                    <Link className="nav-link" to="/copilot" onClick={closeNav}>Copilot</Link>
                  )}
                </li>
                <li className="nav-item">
                  {isHome ? (
                    <a className="nav-link" href="#career" onClick={closeNav}>Career</a>
                  ) : (
                    <Link className="nav-link" to="/#career" onClick={closeNav}>Career</Link>
                  )}
                </li>
                <li className="nav-item">
                  {isHome ? (
                    <a className="nav-link" href="#lab" onClick={closeNav}>Lab</a>
                  ) : (
                    <Link className="nav-link" to="/#lab" onClick={closeNav}>Lab</Link>
                  )}
                </li>
                <li className="nav-item">
                  {isHome ? (
                    <a className="nav-link" href="#about" onClick={closeNav}>About</a>
                  ) : (
                    <Link className="nav-link" to="/about" onClick={closeNav}>About</Link>
                  )}
                </li>
              </>
            )}
          </ul>
          {ctaHref.startsWith('#') && !isHome ? (
            <Link className="btn btn-dark rounded-pill px-4" to={`/${ctaHref}`} onClick={closeNav}>
              {ctaLabel} <i className="bi bi-arrow-up-right ms-1"></i>
            </Link>
          ) : (
            <a className="btn btn-dark rounded-pill px-4" href={ctaHref} onClick={closeNav}>
              {ctaLabel} <i className="bi bi-arrow-up-right ms-1"></i>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
