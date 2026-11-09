import React from 'react';

const NON_CONTENT_KEYS = new Set([
  'i18n', 'style', 'layout', 'customClassName', 'customCss', 'href', 'url',
  'src', 'imageUrl', 'imageId', 'ogImageId', 'canonicalUrl', 'canonical_url',
]);

function contentLeaves(value, path = []) {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => contentLeaves(item, [...path, index]));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => {
      if (NON_CONTENT_KEYS.has(key)) return [];
      return contentLeaves(child, [...path, key]);
    });
  }
  return typeof value === 'string' && value.trim() ? [{ path, value }] : [];
}

function getAtPath(value, path) {
  return path.reduce((node, key) => node?.[key], value);
}

function setAtPath(value, path, nextValue) {
  if (!path.length) return nextValue;
  const [key, ...rest] = path;
  const clone = Array.isArray(value) ? [...value] : typeof key === 'number' ? [] : { ...(value || {}) };
  clone[key] = setAtPath(clone[key], rest, nextValue);
  return clone;
}

function formatLabel(path) {
  return path.map((part) => typeof part === 'number' ? `Item ${part + 1}` : String(part)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())).join(' / ');
}

export default function SectionTranslationsEditor({ section, lang, onChange, onSave, saving = false }) {
  if (!section) {
    return <div className="alert alert-light border small mb-0">Select a section to edit its translations.</div>;
  }

  const baseConfig = section.config || {};
  const translatedConfig = baseConfig.i18n?.[lang] || {};
  const fields = contentLeaves(baseConfig);
  const isArabic = lang === 'ar';

  const updateField = (path, value) => {
    const existing = baseConfig.i18n?.[lang] || {};
    const updatedTranslation = setAtPath(existing, path, value);
    onChange({
      ...section,
      config: {
        ...baseConfig,
        i18n: {
          ...(baseConfig.i18n || {}),
          [lang]: updatedTranslation,
        },
      },
    });
  };

  return (
    <div className="p-3 border-top" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div>
          <h6 className="fw-bold mb-1">Section Translation ({lang.toUpperCase()})</h6>
          <p className="small text-muted mb-0">Translate this section’s editable content. Empty overrides fall back to English.</p>
        </div>
        <span className="badge bg-light text-secondary border">{section.section_type}</span>
      </div>

      {fields.length === 0 ? (
        <div className="alert alert-light border small mb-2">This section has no text fields to translate.</div>
      ) : (
        <div className="d-flex flex-column gap-2 mb-3">
          {fields.map(({ path, value }) => {
            const current = getAtPath(translatedConfig, path);
            const fieldValue = typeof current === 'string' ? current : '';
            const isLong = value.length > 90 || /body|description|intro|subtitle|quote/i.test(String(path[path.length - 1]));
            const shared = {
              className: 'form-control form-control-sm rounded-3',
              value: fieldValue,
              placeholder: value,
              dir: isArabic ? 'rtl' : 'ltr',
              onChange: (event) => updateField(path, event.target.value),
              'aria-label': `${formatLabel(path)} (${lang.toUpperCase()})`,
            };
            return (
              <div key={path.join('.')}>
                <label className="form-label small fw-semibold mb-1">{formatLabel(path)}</label>
                {isLong ? <textarea {...shared} rows="3" /> : <input {...shared} type="text" />}
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="btn btn-sm btn-primary rounded-pill w-100" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : `Save ${lang.toUpperCase()} Section Translation`}
      </button>
    </div>
  );
}
