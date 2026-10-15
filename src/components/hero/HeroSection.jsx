import React, { useState } from 'react';
import VoicePlayer from './VoicePlayer';
import MotionHero from '../../motion/MotionHero';
import portraitCutout from '../../assets/images/naim-portrait.webp';
import { HERO_DEFAULTS } from './heroDefaults';

/**
 * Homepage Hero.
 *
 * Content (left column: eyebrow, title, lead, CTAs, "currently building")
 * is driven by `config` when rendered as the `home_hero` CMS section, and
 * falls back to HERO_DEFAULTS field-by-field so an empty config renders the
 * original hero verbatim. The right column (Motion / Portrait + audio) is
 * presentation and stays as-is.
 */
export default function HeroSection({ config = {} }) {
  const [heroMode, setHeroMode] = useState('motion'); // 'motion' | 'portrait'

  const cfg = { ...HERO_DEFAULTS, ...(config || {}) };
  const titleLines = Array.isArray(cfg.titleLines) && cfg.titleLines.length ? cfg.titleLines : HERO_DEFAULTS.titleLines;
  const buildingItems = Array.isArray(cfg.buildingItems) && cfg.buildingItems.length ? cfg.buildingItems : HERO_DEFAULTS.buildingItems;
  const primaryCta = { ...HERO_DEFAULTS.primaryCta, ...(cfg.primaryCta || {}) };
  const secondaryCta = { ...HERO_DEFAULTS.secondaryCta, ...(cfg.secondaryCta || {}) };

  // Right-column visual controls
  const showVisual = cfg.showVisual !== false;
  const showMotion = cfg.showMotion !== false;
  const showPortrait = cfg.showPortrait !== false;
  const modes = [showMotion ? 'motion' : null, showPortrait ? 'portrait' : null].filter(Boolean);
  const activeMode = modes.includes(heroMode) ? heroMode : modes[0] || 'motion';
  const showToggle = modes.length > 1;

  return (
    <section className="hero section-pad">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 hero-copy">
            {cfg.eyebrow && (
              <div className="eyebrow">
                <span></span> {cfg.eyebrow}
              </div>
            )}

            <h1>
              {titleLines.map((line, i) => {
                const isLast = i === titleLines.length - 1;
                return (
                  <React.Fragment key={i}>
                    {isLast && cfg.emphasizeLastLine ? <em>{line}</em> : line}
                    {i < titleLines.length - 1 && <br />}
                  </React.Fragment>
                );
              })}
            </h1>

            {(cfg.lead || cfg.leadStrong) && (
              <p className="hero-lead">
                {cfg.lead}
                {cfg.leadStrong && <strong>{cfg.leadStrong}</strong>}
              </p>
            )}

            <div className="d-flex flex-wrap gap-3 mb-4">
              {primaryCta.label && (
                <a className="btn btn-primary-custom btn-lg rounded-pill px-4" href={primaryCta.href || '#work'}>
                  {primaryCta.label} <i className="bi bi-arrow-right"></i>
                </a>
              )}
              {secondaryCta.label && (
                <a className="btn btn-outline-custom btn-lg rounded-pill px-4" href={secondaryCta.href || '#copilot'}>
                  <i className="bi bi-stars"></i> {secondaryCta.label}
                </a>
              )}
            </div>

            {cfg.buildingLabel && <div className="building-label">{cfg.buildingLabel}</div>}
            {buildingItems.length > 0 && (
              <div className="building-list">
                {buildingItems.map((item, i) => (
                  <a key={i} href={item.href || '#'}>
                    {item.iconText && (
                      <span className={`mini-icon ${item.iconClass || ''}`.trim()}>{item.iconText}</span>
                    )}{' '}
                    {item.label} {item.note && <small>{item.note}</small>}
                  </a>
                ))}
              </div>
            )}
          </div>

          {showVisual && modes.length > 0 && (
          <div className="col-lg-6">
            {showToggle && (
            <div className="d-flex justify-content-end mb-3 gap-2">
              {showMotion && (
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${
                  activeMode === 'motion'
                    ? 'btn-primary-custom'
                    : 'btn-outline-secondary text-dark'
                }`}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
                onClick={() => setHeroMode('motion')}
              >
                <i className="bi bi-play-circle-fill me-1"></i> Motion Sequence (24s)
              </button>
              )}
              {showPortrait && (
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${
                  activeMode === 'portrait'
                    ? 'btn-primary-custom'
                    : 'btn-outline-secondary text-dark'
                }`}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
                onClick={() => setHeroMode('portrait')}
              >
                <i className="bi bi-person-fill me-1"></i> Portrait & Audio
              </button>
              )}
            </div>
            )}

            {activeMode === 'motion' ? (
              <MotionHero />
            ) : (
              <div className="hero-visual">
                <div className="hero-photo-wrap">
                  <img src={portraitCutout} alt="Naïm Bsili" className="hero-photo" />
                </div>
                <div className="hero-note">
                  Design<br />
                  Technology<br />
                  <strong>Impact</strong>
                </div>

                <VoicePlayer />

                <div className="listen-note" aria-label="Listen to Naïm introduction">
                  <svg
                    viewBox="0 0 190 100"
                    role="img"
                    aria-label="Curved hand-drawn arrow pointing to the audio player"
                  >
                    <path
                      d="M10 72 C62 95, 96 90, 122 63 C141 43, 151 25, 166 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M155 17 L168 20 L160 31"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Listen to me</span>
                </div>

                <div className="shape shape-one"></div>
                <div className="shape shape-two"></div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
