import React from 'react';

/**
 * Editor for the homepage Hero (`home_hero` composite section).
 * Edits the left-column content; the motion/portrait visual is fixed.
 */
export default function HomeHeroSectionEditor({ config = {}, onChange }) {
  const titleLines = Array.isArray(config.titleLines) ? config.titleLines : [];
  const buildingItems = Array.isArray(config.buildingItems) ? config.buildingItems : [];
  const primaryCta = config.primaryCta || {};
  const secondaryCta = config.secondaryCta || {};

  const set = (patch) => onChange({ ...config, ...patch });

  const updateItem = (index, field, val) => {
    const updated = buildingItems.map((it, i) => (i === index ? { ...it, [field]: val } : it));
    set({ buildingItems: updated });
  };
  const addItem = () => set({ buildingItems: [...buildingItems, { iconText: '', iconClass: '', label: 'New item', href: '#', note: '' }] });
  const removeItem = (index) => set({ buildingItems: buildingItems.filter((_, i) => i !== index) });

  return (
    <div className="card border-0 bg-light rounded-3 p-3 mb-3">
      <h6 className="fw-bold mb-3 small text-uppercase">Hero Properties</h6>

      <div className="mb-3 p-2 border rounded-3 bg-white">
        <span className="small text-uppercase fw-bold text-muted d-block mb-2">Right-column visual</span>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="hero-show-visual"
            checked={config.showVisual !== false}
            onChange={(e) => set({ showVisual: e.target.checked })}
          />
          <label className="form-check-label small" htmlFor="hero-show-visual">Show the visual panel</label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="hero-show-motion"
            checked={config.showMotion !== false}
            disabled={config.showVisual === false}
            onChange={(e) => set({ showMotion: e.target.checked })}
          />
          <label className="form-check-label small" htmlFor="hero-show-motion">Offer “Motion Sequence”</label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="hero-show-portrait"
            checked={config.showPortrait !== false}
            disabled={config.showVisual === false}
            onChange={(e) => set({ showPortrait: e.target.checked })}
          />
          <label className="form-check-label small" htmlFor="hero-show-portrait">Offer “Portrait &amp; Audio”</label>
        </div>
        <div className="small text-muted mt-1" style={{ fontSize: '0.72rem' }}>
          Uncheck both modes (or the panel) to hide the right-column visual entirely.
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Eyebrow</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          value={config.eyebrow || ''}
          placeholder="SENIOR UX/UI DESIGNER · AI PRODUCT BUILDER"
          onChange={(e) => set({ eyebrow: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Title lines <span className="text-muted">(one per line)</span></label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="3"
          value={titleLines.join('\n')}
          placeholder={'I DESIGN.\nI BUILD.\nI EXPERIMENT.'}
          onChange={(e) => set({ titleLines: e.target.value.split('\n') })}
        />
        <div className="form-check mt-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="hero-emph-last"
            checked={config.emphasizeLastLine !== false}
            onChange={(e) => set({ emphasizeLastLine: e.target.checked })}
          />
          <label className="form-check-label small" htmlFor="hero-emph-last">
            Emphasize last line (italic)
          </label>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Lead paragraph</label>
        <textarea
          className="form-control form-control-sm rounded-3"
          rows="2"
          value={config.lead || ''}
          placeholder="I turn ambiguous problems into usable digital products at the intersection of "
          onChange={(e) => set({ lead: e.target.value })}
        />
        <label className="form-label small fw-semibold mt-2">Lead bold tail <span className="text-muted">(optional, rendered in bold)</span></label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          value={config.leadStrong || ''}
          placeholder="product design, AI, low-code and automation."
          onChange={(e) => set({ leadStrong: e.target.value })}
        />
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12"><span className="small text-uppercase fw-bold text-muted">Primary button</span></div>
        <div className="col-7">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            value={primaryCta.label || ''}
            placeholder="Explore my work"
            onChange={(e) => set({ primaryCta: { ...primaryCta, label: e.target.value } })}
          />
        </div>
        <div className="col-5">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            value={primaryCta.href || ''}
            placeholder="#work"
            onChange={(e) => set({ primaryCta: { ...primaryCta, href: e.target.value } })}
          />
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12"><span className="small text-uppercase fw-bold text-muted">Secondary button</span></div>
        <div className="col-7">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            value={secondaryCta.label || ''}
            placeholder="Talk to Naïm Copilot"
            onChange={(e) => set({ secondaryCta: { ...secondaryCta, label: e.target.value } })}
          />
        </div>
        <div className="col-5">
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            value={secondaryCta.href || ''}
            placeholder="#copilot"
            onChange={(e) => set({ secondaryCta: { ...secondaryCta, href: e.target.value } })}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">"Currently building" label</label>
        <input
          type="text"
          className="form-control form-control-sm rounded-3"
          value={config.buildingLabel || ''}
          placeholder="CURRENTLY BUILDING"
          onChange={(e) => set({ buildingLabel: e.target.value })}
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="small text-uppercase fw-bold text-muted">Building items</span>
        <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={addItem}>
          <i className="bi bi-plus-lg me-1" /> Add item
        </button>
      </div>
      <div className="d-flex flex-column gap-2">
        {buildingItems.map((it, idx) => (
          <div key={idx} className="p-2 border rounded-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge bg-secondary-subtle text-secondary small">Item {idx + 1}</span>
              <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeItem(idx)} title="Remove item">
                <i className="bi bi-trash" />
              </button>
            </div>
            <div className="row g-2">
              <div className="col-3">
                <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Icon</label>
                <input type="text" className="form-control form-control-sm" value={it.iconText || ''} placeholder="W" onChange={(e) => updateItem(idx, 'iconText', e.target.value)} />
              </div>
              <div className="col-4">
                <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Icon style</label>
                <input type="text" className="form-control form-control-sm" value={it.iconClass || ''} placeholder="winni" onChange={(e) => updateItem(idx, 'iconClass', e.target.value)} />
              </div>
              <div className="col-5">
                <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Link</label>
                <input type="text" className="form-control form-control-sm" value={it.href || ''} placeholder="#work" onChange={(e) => updateItem(idx, 'href', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Label</label>
                <input type="text" className="form-control form-control-sm" value={it.label || ''} placeholder="WINNI" onChange={(e) => updateItem(idx, 'label', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted mb-0" style={{ fontSize: '0.7rem' }}>Note</label>
                <input type="text" className="form-control form-control-sm" value={it.note || ''} placeholder="Product / Operations OS" onChange={(e) => updateItem(idx, 'note', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {buildingItems.length === 0 && (
          <div className="text-muted small p-2 bg-white rounded border text-center">No items. Click &quot;Add item&quot;.</div>
        )}
      </div>
    </div>
  );
}
