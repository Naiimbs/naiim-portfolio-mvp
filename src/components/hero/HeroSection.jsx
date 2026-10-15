import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VoicePlayer from './VoicePlayer';
import MotionHero from '../../motion/MotionHero';
import portraitCutout from '../../assets/images/naim-portrait.webp';
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
  const [heroMode, setHeroMode] = useState('motion'); // 'motion' | 'portrait'

  const cfg = { ...HERO_DEFAULTS, ...(config || {}) };

  // Localized fallbacks
  const eyebrow = (!config?.eyebrow || config.eyebrow === HERO_DEFAULTS.eyebrow)
    ? t('hero.eyebrow')
    : config.eyebrow;

  const isDefaultTitleLines = !config?.titleLines || (
    Array.isArray(config.titleLines) &&
    config.titleLines.length === HERO_DEFAULTS.titleLines.length &&
    config.titleLines.every((l, idx) => l === HERO_DEFAULTS.titleLines[idx])
  );
  const localizedTitleLines = t('hero.titleLines', { returnObjects: true });
  const titleLines = isDefaultTitleLines && Array.isArray(localizedTitleLines) && localizedTitleLines.length
    ? localizedTitleLines
    : (Array.isArray(config?.titleLines) && config.titleLines.length ? config.titleLines : HERO_DEFAULTS.titleLines);

  const lead = (!config?.lead || config.lead === HERO_DEFAULTS.lead)
    ? t('hero.lead')
    : config.lead;

  const leadStrong = (!config?.leadStrong || config.leadStrong === HERO_DEFAULTS.leadStrong)
    ? t('hero.leadStrong')
    : config.leadStrong;

  const primaryCta = {
    ...HERO_DEFAULTS.primaryCta,
    ...(cfg.primaryCta || {}),
    label: (!config?.primaryCta?.label || config.primaryCta.label === HERO_DEFAULTS.primaryCta.label)
      ? t('hero.exploreWork')
      : config.primaryCta.label,
  };

  const secondaryCta = {
    ...HERO_DEFAULTS.secondaryCta,
    ...(cfg.secondaryCta || {}),
    label: (!config?.secondaryCta?.label || config.secondaryCta.label === HERO_DEFAULTS.secondaryCta.label)
      ? t('hero.talkCopilot')
      : config.secondaryCta.label,
  };

  const buildingLabel = (!config?.buildingLabel || config.buildingLabel === HERO_DEFAULTS.buildingLabel)
    ? t('hero.currentlyBuilding')
    : config.buildingLabel;

  const buildingItems = Array.isArray(cfg.buildingItems) && cfg.buildingItems.length ? cfg.buildingItems : HERO_DEFAULTS.buildingItems;

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
            {eyebrow && (
              <div className="eyebrow">
                <span></span> {eyebrow}
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

            {(lead || leadStrong) && (
              <p className="hero-lead">
                {lead}
                {leadStrong && <strong>{leadStrong}</strong>}
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

            {buildingLabel && <div className="building-label">{buildingLabel}</div>}
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
              <div className="hero-visual">
                <div className="hero-photo-wrap">
                  <img src={portraitCutout} alt="Naïm Bsili" className="hero-photo" />
                </div>
                <div className="hero-note">
                  {t('hero.noteDesign', 'Design')}<br />
                  {t('hero.noteTech', 'Technology')}<br />
                  <strong>{t('hero.noteImpact', 'Impact')}</strong>
                </div>

                <VoicePlayer />

                <div className="listen-note" aria-label={t('hero.listenToMe', 'Listen to me')}>
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
                  <span>{t('hero.listenToMe', 'Listen to me')}</span>
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
