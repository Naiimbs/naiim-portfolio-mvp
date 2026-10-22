import React from 'react';

function updateLocaleField(locale, field, value) {
  const next = { ...locale };
  if (value === '') delete next[field];
  else next[field] = value;
  return next;
}

function updateItemLocale(item, lang, field, value) {
  const translations = { ...(item.i18n || {}) };
  const locale = updateLocaleField(translations[lang] || {}, field, value);
  if (Object.keys(locale).length) translations[lang] = locale;
  else delete translations[lang];

  if (Object.keys(translations).length) return { ...item, i18n: translations };
  const { i18n, ...itemWithoutTranslations } = item;
  return itemWithoutTranslations;
}

export default function StoryTimelineTranslationsEditor({
  config = {},
  lang = 'ar',
  onChange,
  onSave,
  saving = false,
}) {
  const items = Array.isArray(config.items) ? config.items : [];
  const configTranslations = config.i18n || {};
  const translatedConfig = configTranslations[lang] || {};
  const direction = lang === 'ar' ? 'rtl' : 'ltr';
  const languageName = lang === 'ar' ? 'Arabic' : 'French';

  const setSectionField = (field, value) => {
    const locale = updateLocaleField(translatedConfig, field, value);
    const nextTranslations = { ...configTranslations };
    if (Object.keys(locale).length) nextTranslations[lang] = locale;
    else delete nextTranslations[lang];
    onChange({ ...config, i18n: nextTranslations });
  };

  const setItemField = (index, field, value) => {
    const nextItems = items.map((item, itemIndex) => (
      itemIndex === index ? updateItemLocale(item, lang, field, value) : item
    ));
    onChange({ ...config, items: nextItems });
  };

  const renderSectionField = (field, label, rows = 1) => (
    <div className="mb-2" dir={direction} key={field}>
      <label className="form-label small fw-semibold">{label}</label>
      {rows > 1 ? (
        <textarea
          className="form-control form-control-sm rounded-3"
          rows={rows}
          dir="auto"
          value={translatedConfig[field] || ''}
          placeholder={config[field] || ''}
          onChange={(event) => setSectionField(field, event.target.value)}
        />
      ) : (
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          dir="auto"
          value={translatedConfig[field] || ''}
          placeholder={config[field] || ''}
          onChange={(event) => setSectionField(field, event.target.value)}
        />
      )}
    </div>
  );

  const renderItemField = (item, index, field, label, rows = 1) => {
    const translatedItem = item.i18n?.[lang] || {};
    const commonProps = {
      className: 'form-control form-control-sm rounded-3',
      dir: 'auto',
      value: translatedItem[field] || '',
      placeholder: item[field] || '',
      onChange: (event) => setItemField(index, field, event.target.value),
    };
    return (
      <div className="mb-2" dir={direction} key={field}>
        <label className="form-label small fw-semibold">{label}</label>
        {rows > 1 ? <textarea {...commonProps} rows={rows} /> : <input type="text" {...commonProps} />}
      </div>
    );
  };

  return (
    <div className="border-top pt-3 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold small mb-0 text-primary">Story Presentation · {languageName} translation</h6>
        <span className="badge bg-light text-secondary border">{items.length} milestones</span>
      </div>
      <p className="small text-muted mb-3">
        Translate the selected section here. Empty fields use the default English text. Image URLs and milestone order stay shared across languages.
      </p>

      {renderSectionField('eyebrow', 'Presentation eyebrow')}
      {renderSectionField('title', 'Presentation title')}
      {renderSectionField('subtitle', 'Subtitle', 3)}
      {renderSectionField('openingQuote', 'Opening quote', 2)}
      {renderSectionField('motto', 'Closing motto')}

      <div className="border-top pt-3 mt-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold small mb-0">Milestones and speaker scripts</h6>
          <span className="small text-muted">{languageName} · {items.length} total</span>
        </div>
        <div className="d-flex flex-column gap-2">
          {items.map((item, index) => (
            <details className="card border rounded-3" key={`${item.period || 'chapter'}-${index}`}>
              <summary className="d-flex align-items-center gap-2 p-2" style={{ cursor: 'pointer', listStyle: 'none' }}>
                <span className="badge text-bg-dark rounded-pill">{String(index + 1).padStart(2, '0')}</span>
                <span className="small fw-semibold flex-grow-1">{item.i18n?.[lang]?.title || item.title || `Milestone ${index + 1}`}</span>
                <span className="small text-muted">{item.i18n?.[lang]?.period || item.period}</span>
                <i className="bi bi-chevron-down text-muted" aria-hidden="true" />
              </summary>
              <div className="p-3 border-top">
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    {renderItemField(item, index, 'period', 'Period / date')}
                  </div>
                  <div className="col-12 col-md-8">
                    {renderItemField(item, index, 'title', 'Milestone title')}
                  </div>
                  <div className="col-12">
                    {renderItemField(item, index, 'summary', 'Slide summary', 3)}
                  </div>
                  <div className="col-12">
                    {renderItemField(item, index, 'studentTakeaway', 'Student takeaway (optional)', 2)}
                  </div>
                  <div className="col-12">
                    {renderItemField(item, index, 'speech', 'Full speaker script', 8)}
                  </div>
                  <div className="col-12 col-md-6">
                    {renderItemField(item, index, 'imageAlt', 'Image alt text')}
                  </div>
                  <div className="col-12 col-md-6">
                    {renderItemField(item, index, 'imageCue', 'Image placeholder cue', 2)}
                  </div>
                </div>
              </div>
            </details>
          ))}
          {items.length === 0 && (
            <div className="alert alert-warning small mb-0">Add milestones in Section Properties before translating this presentation.</div>
          )}
        </div>
      </div>

      <button type="button" className="btn btn-sm btn-primary rounded-pill w-100 py-2 mt-3" onClick={onSave} disabled={saving}>
        {saving ? 'Saving section…' : `Save ${languageName} section translations`}
      </button>
    </div>
  );
}
