import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="footer">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <Link className="brand" to="/">
          NAÏM BSILI <span className="beta-badge">Beta</span>
        </Link>
        <div className="footer-links">
          {isHome ? (
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
          <a
            href="https://tn.linkedin.com/in/bsili-naiim"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <i className="bi bi-linkedin"></i>
          </a>
          <a
            href="https://www.instagram.com/designer.tunisien/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <i className="bi bi-instagram"></i>
          </a>
          <a
            href="https://www.tiktok.com/@bsilinaiim"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <i className="bi bi-tiktok"></i>
          </a>
          <a
            href="https://github.com/naiimbsili"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <i className="bi bi-github"></i>
          </a>
          <a href="mailto:hi@naiimbsili.com" aria-label="Email">
            <i className="bi bi-envelope"></i>
          </a>
        </div>
      </div>
      <div className="container copyright">© 2026 Naïm Bsili. All rights reserved.</div>
    </footer>
  );
}
