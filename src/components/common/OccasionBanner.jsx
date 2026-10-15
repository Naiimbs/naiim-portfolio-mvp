import React, { useEffect } from 'react';

/**
 * OccasionBanner — a lightweight editorial topbar shown above the main
 * navigation on special national occasions.
 *
 * Simple date-based selection (Tunisia timezone). The banner can also be
 * force-previewed any day with ?occasion=<id> in the URL.
 *
 * The illustration is a decorative CSS background; the quote and label are
 * real, accessible HTML text. While an occasion is active the component adds
 * the `has-occasion-topbar` class to <body>, which offsets the fixed navbar
 * and page content by --topbar-h (see style.css).
 */

const OCCASIONS = {
  jalaa: {
    id: 'jalaa',
    // Active on October 15 (Evacuation Day — عيد الجلاء)
    match: { month: 10, day: 15 },
    label: '15 أكتوبر — عيد الجلاء',
    quote: '« نَمُوتُ نَمُوتُ وَيَحْيَا الوَطَنْ »',
    image: '/hikayati_jalaa_illustration.webp',
    ariaLabel: 'عيد الجلاء — 15 أكتوبر',
  },
};

function getTunisMonthDay(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Tunis',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(now);
    return {
      month: Number(parts.find((p) => p.type === 'month')?.value),
      day: Number(parts.find((p) => p.type === 'day')?.value),
    };
  } catch (_) {
    return { month: now.getMonth() + 1, day: now.getDate() };
  }
}

function resolveActiveOccasion() {
  // Manual override for previewing: ?occasion=jalaa
  try {
    const forced = new URLSearchParams(window.location.search).get('occasion');
    if (forced && OCCASIONS[forced]) return OCCASIONS[forced];
  } catch (_) {
    /* ignore */
  }
  const { month, day } = getTunisMonthDay();
  return Object.values(OCCASIONS).find((o) => o.match.month === month && o.match.day === day) || null;
}

export default function OccasionBanner() {
  const occasion = resolveActiveOccasion();

  useEffect(() => {
    if (!occasion) return undefined;
    document.body.classList.add('has-occasion-topbar');
    return () => document.body.classList.remove('has-occasion-topbar');
  }, [occasion]);

  if (!occasion) return null;

  return (
    <aside
      className="occasion-topbar"
      role="region"
      aria-label={occasion.ariaLabel}
      dir="rtl"
      style={{ '--occasion-img': `url(${occasion.image})` }}
    >
      <div className="occasion-topbar-inner">
        <p className="occasion-quote" lang="ar">{occasion.quote}</p>
        <p className="occasion-label" lang="ar">{occasion.label}</p>
      </div>
    </aside>
  );
}
