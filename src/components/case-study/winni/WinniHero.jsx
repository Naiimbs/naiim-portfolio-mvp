import React from 'react';
import { Link } from 'react-router-dom';
import winniHeroPageImg from '../../../assets/images/winni-hero-page.png';

export default function WinniHero() {
  const metadata = [
    {
      icon: 'bi-person-badge',
      label: 'Role:',
      value: 'Product Designer · UX/UI · Product Strategy · Brand & Visual System',
    },
    {
      icon: 'bi-calendar3',
      label: 'Timeline:',
      value: '2026 · Ongoing',
    },
    {
      icon: 'bi-layers',
      label: 'Scope:',
      value: 'Physical Product · Web App · Mobile Flow',
    },
  ];

  return (
    <header className="winni-hero">
      <div className="container">
        <Link className="text-link" to="/#work">
          <i className="bi bi-arrow-left"></i> Back to selected work
        </Link>

        <div className="mt-4">
          <div className="winni-hero-badge">
            <span className="dot"></span> WINNI · PRODUCT DESIGN · BRAND · DIGITAL EXPERIENCE
          </div>
        </div>

        <h1 className="winni-hero-title">
          Giving lost things<br />a way back.
        </h1>

        <p className="winni-hero-desc">
          WINNI is a physical + digital identity system that helps people reconnect with lost belongings through a
          simple QR/NFC interaction.
        </p>

        <div className="winni-meta-row">
          {metadata.map((item, idx) => (
            <div className="winni-meta-chip" key={idx}>
              <i className={`bi ${item.icon}`}></i>
              <span>
                {item.label} <strong>{item.value}</strong>
              </span>
            </div>
          ))}
        </div>

        {/* PHOTO 01 — Hero: WINNI sticker attached to a real car */}
        <figure className="winni-hero-figure">
          <img
            src={winniHeroPageImg}
            alt="Close-up of WINNI sticker cleanly attached to a real car quarter window panel in neutral daylight"
            loading="eager"
          />
        </figure>
      </div>
    </header>
  );
}
