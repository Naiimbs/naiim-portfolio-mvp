import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/story-presentation.css';

const CHANNEL_PREFIX = 'naiim-story-presentation';

function clampIndex(index, length) {
  if (!length) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

function getInitialIndex(length) {
  if (typeof window === 'undefined') return 0;
  const raw = Number(new URL(window.location.href).searchParams.get('chapter'));
  return Number.isFinite(raw) && raw > 0 ? clampIndex(raw - 1, length) : 0;
}

function isTypingTarget(target) {
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}

function updateAddress({ index, view }) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('chapter', String(index + 1));
  if (view === 'speaker') url.searchParams.set('view', 'speaker');
  else url.searchParams.delete('view');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function openSpeakerView(index) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('view', 'speaker');
  url.searchParams.set('chapter', String(index + 1));
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

function StoryImageSlot({ item }) {
  if (!item.imageUrl && !item.imageCue) return null;
  if (item.imageUrl) {
    return (
      <figure className="story-image-slot story-image-slot--filled">
        <img src={item.imageUrl} alt={item.imageAlt || item.title || ''} />
        {item.imageAlt && <figcaption>{item.imageAlt}</figcaption>}
      </figure>
    );
  }
  return (
    <div className="story-image-slot" aria-label="موضع صورة فارغ">
      <span className="story-image-slot__icon" aria-hidden="true"><i className="bi bi-image" /></span>
      <span className="story-image-slot__title">موضع صورة</span>
      <span className="story-image-slot__cue">{item.imageCue}</span>
      <span className="story-image-slot__hint">يمكن إضافة صورة حقيقية أو تصور تجريدي لاحقاً من محرر الصفحة.</span>
    </div>
  );
}

export default function StoryPresentationSection({ config = {} }) {
  const items = useMemo(() => (Array.isArray(config.items) ? config.items : []).filter(Boolean), [config.items]);
  const channelName = String(config.channelName || 'beaux-arts-nabeul');
  const [activeIndex, setActiveIndex] = useState(() => getInitialIndex(items.length));
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'deck';
    return new URL(window.location.href).searchParams.get('view') === 'speaker' ? 'speaker' : 'deck';
  });
  const [channel, setChannel] = useState(null);
  const current = items[clampIndex(activeIndex, items.length)] || {};
  const isSpeaker = viewMode === 'speaker';

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return undefined;
    let nextChannel;
    try { nextChannel = new BroadcastChannel(`${CHANNEL_PREFIX}:${channelName}`); } catch { return undefined; }
    setChannel(nextChannel);
    return () => nextChannel.close();
  }, [channelName]);

  useEffect(() => {
    if (!items.length) return;
    setActiveIndex((index) => clampIndex(index, items.length));
  }, [items.length]);

  useEffect(() => {
    if (!isSpeaker || typeof document === 'undefined') return undefined;
    const root = document.getElementById('root');
    if (!root) return undefined;
    const previousValue = root.getAttribute('aria-hidden');
    root.setAttribute('aria-hidden', 'true');
    return () => {
      if (previousValue === null) root.removeAttribute('aria-hidden');
      else root.setAttribute('aria-hidden', previousValue);
    };
  }, [isSpeaker]);

  const selectChapter = useCallback((nextIndex, announce = true) => {
    const safeIndex = clampIndex(nextIndex, items.length);
    setActiveIndex(safeIndex);
    updateAddress({ index: safeIndex, view: viewMode });
    if (!announce || typeof window === 'undefined') return;
    const message = { index: safeIndex, timestamp: Date.now() };
    if (channel) channel.postMessage(message);
    // Keep the storage signal as a fallback for a tab whose BroadcastChannel
    // listener has not initialized yet (or is unavailable in that browser).
    try { window.localStorage.setItem(`${CHANNEL_PREFIX}:${channelName}`, JSON.stringify(message)); } catch { /* storage can be unavailable */ }
  }, [channel, channelName, items.length, viewMode]);

  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
    updateAddress({ index: activeIndex, view: mode });
  }, [activeIndex]);

  useEffect(() => {
    const receive = (event) => {
      const message = event?.data;
      if (!message || !Number.isInteger(message.index)) return;
      const index = clampIndex(message.index, items.length);
      setActiveIndex(index);
      updateAddress({ index, view: viewMode });
    };
    if (channel) {
      channel.addEventListener('message', receive);
      return () => channel.removeEventListener('message', receive);
    }
    const receiveStorage = (event) => {
      if (event.key !== `${CHANNEL_PREFIX}:${channelName}` || !event.newValue) return;
      try { receive({ data: JSON.parse(event.newValue) }); } catch { /* ignore malformed storage events */ }
    };
    window.addEventListener('storage', receiveStorage);
    return () => window.removeEventListener('storage', receiveStorage);
  }, [channel, channelName, items.length, viewMode]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        selectChapter(activeIndex + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        selectChapter(activeIndex - 1);
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (isSpeaker) changeViewMode('deck');
        else openSpeakerView(activeIndex);
      } else if (event.key === 'Escape' && isSpeaker) {
        changeViewMode('deck');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, changeViewMode, isSpeaker, selectChapter]);

  if (!items.length) {
    return <section className="story-empty-state">أضف محطات إلى هذا القسم من محرر الصفحة.</section>;
  }

  const progress = ((activeIndex + 1) / items.length) * 100;
  const speechParagraphs = String(current.speech || '').split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);

  return (
    <>
      {!isSpeaker ? (
        <section className="story-presentation" dir="rtl">
        <div className="story-deck">
          <div className="story-deck__topline">
            <a className="story-brand" href="/" aria-label="Naïm Bsili — الصفحة الرئيسية">NB<span>.</span></a>
            <div className="story-deck__event">{config.eyebrow || 'CREATIVE TALK DAY · BEAUX ARTS NABEUL'}</div>
            <button type="button" className="story-script-button" onClick={() => openSpeakerView(activeIndex)} aria-label="فتح نص المتحدث في صفحة مستقلة، الاختصار S">
              <kbd>S</kbd><span>نص المتحدث</span><i className="bi bi-box-arrow-up-right" aria-hidden="true" />
            </button>
          </div>

          <div className="story-deck__intro">
            <p className="story-kicker">{config.eyebrow || 'CREATIVE TALK DAY · BEAUX ARTS NABEUL'}</p>
            <h1>{config.title || 'من الهندسة الميكانيكية إلى تصميم منتجات الذكاء الاصطناعي'}</h1>
            <p className="story-deck__subtitle">{config.subtitle || 'تعلّم، بناء، ومشاركة — مسار غير مستقيم تعلّمت فيه كيف أبني طريقي.'}</p>
            {config.openingQuote && <p className="story-opening-quote">“{config.openingQuote}”</p>}
          </div>

          <div className="story-stage" aria-live="polite" aria-atomic="true">
            <div className="story-stage__copy">
              <div className="story-stage__meta"><span>{current.period || `محطة ${activeIndex + 1}`}</span><span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span></div>
              <h2>{current.title}</h2>
              {current.summary && <p className="story-stage__summary">{current.summary}</p>}
              {current.studentTakeaway && (
                <aside className="story-takeaway"><span>للطلبة</span><p>{current.studentTakeaway}</p></aside>
              )}
            </div>
            <StoryImageSlot item={current} />
          </div>

          <div className="story-deck__controls">
            <button type="button" className="story-nav-button" onClick={() => selectChapter(activeIndex - 1)} disabled={activeIndex === 0} aria-label="المحطة السابقة">
              <i className="bi bi-arrow-right" aria-hidden="true" /><span>السابق</span>
            </button>
            <div className="story-progress" aria-label={`المحطة ${activeIndex + 1} من ${items.length}`}>
              <div className="story-progress__caption"><span>{current.period || current.title}</span><span>{Math.round(progress)}%</span></div>
              <div className="story-progress__track"><span style={{ width: `${progress}%` }} /></div>
            </div>
            <button type="button" className="story-nav-button story-nav-button--next" onClick={() => selectChapter(activeIndex + 1)} disabled={activeIndex === items.length - 1} aria-label="المحطة التالية">
              <span>التالي</span><i className="bi bi-arrow-left" aria-hidden="true" />
            </button>
          </div>

          <nav className="story-chapter-rail" aria-label="اختر محطة من المسار">
            {items.map((item, index) => (
              <button type="button" key={`${item.period || ''}-${index}`} className={index === activeIndex ? 'is-active' : ''} onClick={() => selectChapter(index)} aria-current={index === activeIndex ? 'step' : undefined} aria-label={`${index + 1}. ${item.period || item.title}`}>
                <span className="story-chapter-rail__dot" /><span className="story-chapter-rail__label">{item.period || item.title}</span>
              </button>
            ))}
          </nav>
          <footer className="story-deck__footer"><span>{config.motto || 'I think. I design. I experiment.'}</span><span>استعمل ← → للتنقّل · S لفتح نص المتحدث</span></footer>
        </div>
        </section>
      ) : createPortal(
        <section className="story-presentation story-presentation--speaker" dir="rtl" role="dialog" aria-modal="true" aria-label="نص المتحدث">
        <div className="story-speaker-overlay">
          <header className="story-speaker__bar">
            <div className="story-speaker__identity"><span className="story-speaker__live-dot" /><div><strong>نص المتحدث</strong><small>{current.period || `محطة ${activeIndex + 1}`} · {activeIndex + 1} من {items.length}</small></div></div>
            <div className="story-speaker__actions">
              <button type="button" className="story-speaker__return" onClick={() => changeViewMode('deck')}><i className="bi bi-easel2" aria-hidden="true" /> العودة للعرض</button>
              <button type="button" className="story-speaker__close" onClick={() => changeViewMode('deck')} aria-label="العودة إلى العرض"><i className="bi bi-x-lg" /></button>
            </div>
          </header>
          <main className="story-speaker__main" aria-live="polite" aria-atomic="false">
            <div className="story-speaker__chapter"><span>{current.period || `محطة ${activeIndex + 1}`}</span><span>الجزء {String(activeIndex + 1).padStart(2, '0')}</span></div>
            <h1>{current.title}</h1>
            {current.summary && <p className="story-speaker__summary">{current.summary}</p>}
            <div className="story-speaker__text">
              {speechParagraphs.length ? speechParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="story-speaker__empty">لا يوجد نص إلقاء لهذه المحطة بعد. أضفه من محرر الصفحة.</p>}
            </div>
            {current.studentTakeaway && <aside className="story-speaker__aside"><strong>رسالة للطلبة</strong><p>{current.studentTakeaway}</p></aside>}
          </main>
          <footer className="story-speaker__controls">
            <button type="button" onClick={() => selectChapter(activeIndex - 1)} disabled={activeIndex === 0}><i className="bi bi-arrow-right" /> المحطة السابقة</button>
            <div className="story-speaker__progress"><span style={{ width: `${progress}%` }} /></div>
            <button type="button" onClick={() => selectChapter(activeIndex + 1)} disabled={activeIndex === items.length - 1}>المحطة التالية <i className="bi bi-arrow-left" /></button>
          </footer>
        </div>
        </section>,
        document.body
      )}
    </>
  );
}
