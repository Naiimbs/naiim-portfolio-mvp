import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MotionHero from '../../motion/MotionHero';
import heroCutout from '../../assets/images/naim-hero-img1371.png';
import { HERO_DEFAULTS } from './heroDefaults';

/**
 * Homepage Hero.
 *
 * Content (left column: eyebrow, title, lead, CTAs, "currently building")
 * is driven by `config` when rendered as the `home_hero` CMS section, and
 * falls back to i18n translations (and then HERO_DEFAULTS) so an empty or
 * default config renders localized content in EN, FR, and AR. The right
 * column (Motion / Portrait + audio) is presentation and stays as-is.
 */
export default function HeroSection({ config = {} }) {
  const { t } = useTranslation();
  const [heroMode, setHeroMode] = useState('portrait'); // 'motion' | 'portrait'

  const cfg = { ...HERO_DEFAULTS, ...(config || {}) };

  // Localized fallbacks
  const eyebrow = config?.eyebrow || HERO_DEFAULTS.eyebrow || t('hero.eyebrow');
  const titleLines = Array.isArray(config?.titleLines) && config.titleLines.length
    ? config.titleLines
    : HERO_DEFAULTS.titleLines;

  const legacyLead = config?.lead === 'I turn ambiguous ideas into clear product experiences, combining UX strategy, interface design, AI workflows and hands-on building.'
    || config?.lead === 'I turn ambiguous problems into usable digital products at the intersection of '
    || config?.lead === 'I turn ambiguous problems into usable digital products at the intersection of product design, AI, low-code and automation.';
  const hasConfiguredLead = Object.prototype.hasOwnProperty.call(config || {}, 'lead');
  const lead = legacyLead
    ? (config?.leadStrong || HERO_DEFAULTS.lead || t('hero.lead'))
    : (hasConfiguredLead ? config.lead : (config?.leadStrong || HERO_DEFAULTS.lead || t('hero.lead')));
  const leadStrong = '';

  const primaryCta = {
    ...HERO_DEFAULTS.primaryCta,
    ...(cfg.primaryCta || {}),
    label: config?.primaryCta?.label || HERO_DEFAULTS.primaryCta.label || t('hero.exploreWork'),
  };

  const secondaryCta = {
    ...HERO_DEFAULTS.secondaryCta,
    ...(cfg.secondaryCta || {}),
    label: config?.secondaryCta?.label || HERO_DEFAULTS.secondaryCta.label || t('hero.talkCopilot'),
  };

  const buildingLabel = config?.buildingLabel || t('hero.currentlyBuilding');
  const availabilityLabel = config?.availabilityLabel || t('hero.availability', 'Available for freelance projects');
  const accentFromLine = Number.isInteger(cfg.accentFromLine)
    ? cfg.accentFromLine
    : (cfg.emphasizeLastLine ? titleLines.length - 1 : -1);

  const buildingItems = Array.isArray(cfg.buildingItems) && cfg.buildingItems.length ? cfg.buildingItems : HERO_DEFAULTS.buildingItems;

  // Right-column visual controls
  const showVisual = cfg.showVisual !== false;
  const showMotion = cfg.showMotion !== false;
  const showPortrait = cfg.showPortrait !== false;
  const modes = [showMotion ? 'motion' : null, showPortrait ? 'portrait' : null].filter(Boolean);
  const activeMode = modes.includes(heroMode) ? heroMode : modes[0] || 'motion';
  const showToggle = modes.length > 1 && cfg.showModeToggle === true;

  return (
    <section className="hero editorial-hero section-pad">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 hero-copy">
            {eyebrow && (
              <div className="eyebrow">
                <span></span> {eyebrow}
              </div>
            )}

            <h1>
              {titleLines.map((line, i) => {
                return (
                  <React.Fragment key={i}>
                    {i >= accentFromLine ? <em>{line}</em> : line}
                    {i < titleLines.length - 1 && <br />}
                  </React.Fragment>
                );
              })}
            </h1>

            {(lead || leadStrong) && (
              <p className="hero-lead">
                {lead}
                {leadStrong && <span>{leadStrong}</span>}
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

            {cfg.showBuilding && buildingLabel && <div className="building-label">{buildingLabel}</div>}
            {cfg.showBuilding && buildingItems.length > 0 && (
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
          <div className="col-lg-6 editorial-hero-media">
            {showToggle && (
            <div className="d-flex justify-content-end mb-3 gap-2 editorial-hero-mode-toggle">
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
                <i className="bi bi-play-circle-fill me-1"></i> {t('hero.motionSequence', 'Motion Sequence (24s)')}
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
                <i className="bi bi-person-fill me-1"></i> {t('hero.portraitAudio', 'Portrait & Audio')}
              </button>
              )}
            </div>
            )}

            {activeMode === 'motion' ? (
              <MotionHero />
            ) : (
              <div className="hero-visual editorial-hero-stage">
                <div className="editorial-hero-arc editorial-hero-arc-one" aria-hidden="true"></div>
                <div className="editorial-hero-arc editorial-hero-arc-two" aria-hidden="true"></div>
                <div className="hero-photo-wrap">
                  <img src={heroCutout} alt="Naïm Bsili" className="hero-photo" />
                </div>

                {availabilityLabel && (
                  <div className="editorial-hero-availability">
                    <span aria-hidden="true"></span>{availabilityLabel}
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
