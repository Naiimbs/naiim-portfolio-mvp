import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MotionHero from '../../motion/MotionHero';
import heroCutout from '../../assets/images/naim-hero-img1371.png';
import { HERO_DEFAULTS } from './heroDefaults';

/**
 * Homepage hero.
 *
 * The content remains CMS/i18n-driven while the presentation is scoped to this
 * component. The portrait and motion modes are preserved for existing CMS
 * configurations; the default homepage presentation uses the redesigned hero.
 */
export default function HeroSection({ config = {}, homepage = false }) {
  const { t } = useTranslation();
  const [heroMode, setHeroMode] = useState('portrait');

  const cfg = { ...HERO_DEFAULTS, ...(config || {}) };
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

  const primaryCta = {
    ...HERO_DEFAULTS.primaryCta,
    ...(cfg.primaryCta || {}),
    label: homepage
      ? t('hero.exploreWork', 'Explore projects')
      : (config?.primaryCta?.label || HERO_DEFAULTS.primaryCta.label || t('hero.exploreWork')),
  };
  const secondaryCta = {
    ...HERO_DEFAULTS.secondaryCta,
    ...(cfg.secondaryCta || {}),
    label: homepage
      ? t('hero.talk', 'Let’s talk')
      : (config?.secondaryCta?.label || HERO_DEFAULTS.secondaryCta.label || t('hero.talkCopilot')),
  };

  const availabilityLabel = config?.availabilityLabel || t('hero.availability');
  const accentFromLine = Number.isInteger(cfg.accentFromLine)
    ? cfg.accentFromLine
    : (cfg.emphasizeLastLine ? titleLines.length - 1 : -1);
  const buildingLabel = config?.buildingLabel || t('hero.currentlyBuilding');
  const buildingItems = Array.isArray(cfg.buildingItems) && cfg.buildingItems.length
    ? cfg.buildingItems
    : HERO_DEFAULTS.buildingItems;

  const showVisual = cfg.showVisual !== false;
  const showMotion = cfg.showMotion !== false;
  const showPortrait = cfg.showPortrait !== false;
  const modes = [showMotion ? 'motion' : null, showPortrait ? 'portrait' : null].filter(Boolean);
  const activeMode = modes.includes(heroMode) ? heroMode : modes[0] || 'portrait';
  const showToggle = modes.length > 1 && cfg.showModeToggle === true;

  return (
    <section className={`hero hero-redesign ${homepage ? 'hero-redesign--home' : ''}`} aria-labelledby="hero-title">
      <div className="hero-redesign__grid" aria-hidden="true" />
      <div className="hero-redesign__wrap">
        <div className="hero-redesign__copy">
          {homepage && availabilityLabel && (
            <div className="hero-redesign__status">
              <span aria-hidden="true" />
              {availabilityLabel}
            </div>
          )}

          {eyebrow && <p className="hero-redesign__eyebrow">{eyebrow}</p>}

          <h1 id="hero-title" className="hero-redesign__title">
            {titleLines.map((line, i) => (
              <span key={i} className={i >= accentFromLine ? 'is-accent' : ''}>
                {line}
              </span>
            ))}
          </h1>

          {lead && <p className="hero-redesign__lead">{lead}</p>}

          <div className="hero-redesign__actions">
            {primaryCta.label && (
              <a
                className="hero-redesign__primary"
                href={homepage ? '#work' : (primaryCta.href || '#work')}
              >
                {primaryCta.label}
                <span aria-hidden="true">{homepage ? '↓' : '→'}</span>
              </a>
            )}
            {secondaryCta.label && (
              <a
                className="hero-redesign__secondary"
                href={homepage ? '/about#contact' : (secondaryCta.href || '#copilot')}
              >
                {secondaryCta.label}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>

          {homepage && (
            <ul className="hero-redesign__proof" aria-label="Experience highlights">
              <li>
                <strong>KSA enterprise &amp; government</strong>
                <span>Delivered on-site and remotely</span>
              </li>
              <li>
                <strong>UX/UI + low-code</strong>
                <span>OutSystems · Mendix · UnifyApps</span>
              </li>
              <li>
                <strong>AI-native workflows</strong>
                <span>From idea to shipped product</span>
              </li>
            </ul>
          )}

          {cfg.showBuilding && buildingLabel && (
            <div className="building-label">{buildingLabel}</div>
          )}
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
          <div className="hero-redesign__visual-column">
            {showToggle && (
              <div className="hero-redesign__mode-toggle" role="group" aria-label="Hero visual mode">
                {showMotion && (
                  <button
                    type="button"
                    className={activeMode === 'motion' ? 'is-active' : ''}
                    onClick={() => setHeroMode('motion')}
                  >
                    {t('hero.motionSequence', 'Motion Sequence (24s)')}
                  </button>
                )}
                {showPortrait && (
                  <button
                    type="button"
                    className={activeMode === 'portrait' ? 'is-active' : ''}
                    onClick={() => setHeroMode('portrait')}
                  >
                    {t('hero.portraitAudio', 'Portrait & Audio')}
                  </button>
                )}
              </div>
            )}

            {activeMode === 'motion' ? (
              <div className="hero-redesign__motion"><MotionHero /></div>
            ) : (
              <div className="hero-redesign__visual" aria-label="Portrait of Naïm Bsili">
                <div className="hero-redesign__orbit hero-redesign__orbit--outer" aria-hidden="true" />
                <div className="hero-redesign__orbit hero-redesign__orbit--inner" aria-hidden="true" />
                <div className="hero-redesign__portrait-frame">
                  <img src={heroCutout} alt="Naïm Bsili" className="hero-redesign__portrait" />
                  <span className="hero-redesign__visual-label">PRODUCT DESIGN<br />AI · SYSTEMS · IMPACT</span>
                </div>
                <div className="hero-redesign__chip hero-redesign__chip--one">
                  <span aria-hidden="true" /> Design systems
                </div>
                <div className="hero-redesign__chip hero-redesign__chip--two">
                  <span aria-hidden="true" /> AI workflows
                </div>
                <div className="hero-redesign__chip hero-redesign__chip--three">
                  <span aria-hidden="true" /> Design → Build
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
