import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

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

  return (
    <nav className={`navbar navbar-expand-lg fixed-top site-nav ${isScrolled ? 'scrolled' : ''}`} id="siteNav">
      <div className="container">
        <Link className="navbar-brand brand" to="/" onClick={closeNav}>
          NAÏM BSILI <span className="beta-badge">Beta</span>
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
            <li className="nav-item">
              {isHome ? (
                <a className="nav-link" href="#work" onClick={closeNav}>Work</a>
              ) : (
                <Link className="nav-link" to="/work" onClick={closeNav}>Work</Link>
              )}
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
          </ul>
          <a className="btn btn-dark rounded-pill px-4" href="#contact" onClick={closeNav}>
            Let's Talk <i className="bi bi-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </nav>
  );
}
