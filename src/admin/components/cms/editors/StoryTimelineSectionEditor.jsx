import React from 'react';
import MediaUploadField from '../MediaUploadField';

function updateItem(items, index, field, value) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
}

export default function StoryTimelineSectionEditor({ config = {}, onChange }) {
  const items = Array.isArray(config.items) ? config.items : [];
  const patch = (values) => onChange({ ...config, ...values });
  const setItem = (index, field, value) => patch({ items: updateItem(items, index, field, value) });
  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    patch({ items: reordered });
  };

  return (
    <div className="story-cms-editor">
      <div className="card border-0 bg-light rounded-3 p-3 mb-3">
        <h6 className="fw-bold mb-3 small text-uppercase">عنوان العرض</h6>
        <div className="mb-3">
          <label className="form-label small fw-semibold">العنوان الرئيسي</label>
          <input className="form-control form-control-sm rounded-3" value={config.title || ''} onChange={(e) => patch({ title: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-semibold">المقدمة</label>
          <textarea className="form-control form-control-sm rounded-3" rows={3} value={config.subtitle || ''} onChange={(e) => patch({ subtitle: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-semibold">الاقتباس الافتتاحي</label>
          <input className="form-control form-control-sm rounded-3" dir="auto" value={config.openingQuote || ''} onChange={(e) => patch({ openingQuote: e.target.value })} />
        </div>
        <div className="mb-0">
          <label className="form-label small fw-semibold">الشعار الختامي</label>
          <input className="form-control form-control-sm rounded-3" dir="auto" value={config.motto || ''} onChange={(e) => patch({ motto: e.target.value })} />
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <div>
          <h6 className="fw-bold mb-1 small text-uppercase">محطات الرحلة ({items.length})</h6>
          <p className="text-muted mb-0" style={{ fontSize: '.73rem' }}>كل محطة تشمل ملخص العرض ونص الإلقاء الكامل. افتحها للتعديل.</p>
        </div>
        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => patch({ items: [...items, { period: 'مرحلة جديدة', title: 'عنوان المحطة', summary: '', studentTakeaway: '', speech: '', imageUrl: '', imageAlt: '', imageCue: 'أضف صورة أو تصوراً بصرياً لاحقاً' }] })}>
          <i className="bi bi-plus-lg me-1" /> إضافة محطة
        </button>
      </div>

      <div className="story-cms-editor__items">
        {items.map((item, index) => (
          <details className="card border rounded-3 mb-2 story-cms-editor__item" key={`${item.period || 'chapter'}-${index}`} open={items.length < 2}>
            <summary className="story-cms-editor__summary">
              <span className="badge text-bg-dark rounded-pill">{String(index + 1).padStart(2, '0')}</span>
              <span className="story-cms-editor__summary-text"><strong>{item.title || 'محطة بلا عنوان'}</strong><small>{item.period || 'بلا فترة محددة'}</small></span>
              <span className="story-cms-editor__reorder">
                <button type="button" className="btn btn-sm btn-light" disabled={index === 0} title="تحريك لأعلى" onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveItem(index, -1); }}><i className="bi bi-chevron-up" /></button>
                <button type="button" className="btn btn-sm btn-light" disabled={index === items.length - 1} title="تحريك لأسفل" onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveItem(index, 1); }}><i className="bi bi-chevron-down" /></button>
                <button type="button" className="btn btn-sm btn-outline-danger" title="حذف المحطة" onClick={(e) => { e.preventDefault(); e.stopPropagation(); patch({ items: items.filter((_, itemIndex) => itemIndex !== index) }); }}><i className="bi bi-trash" /></button>
              </span>
            </summary>
            <div className="p-3 border-top">
              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">الفترة/التاريخ</label>
                  <input className="form-control form-control-sm" dir="auto" value={item.period || ''} placeholder="مثال: 2018 أو مرحلة لاحقة" onChange={(e) => setItem(index, 'period', e.target.value)} />
                </div>
                <div className="col-12 col-md-8">
                  <label className="form-label small fw-semibold">عنوان المحطة</label>
                  <input className="form-control form-control-sm" dir="auto" value={item.title || ''} onChange={(e) => setItem(index, 'title', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">ملخص يظهر في العرض</label>
                  <textarea className="form-control form-control-sm" rows={3} dir="auto" value={item.summary || ''} onChange={(e) => setItem(index, 'summary', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">رسالة قصيرة للطلبة (اختيارية)</label>
                  <textarea className="form-control form-control-sm" rows={2} dir="auto" value={item.studentTakeaway || ''} onChange={(e) => setItem(index, 'studentTakeaway', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">نص الإلقاء الكامل</label>
                  <textarea className="form-control form-control-sm" rows={10} dir="auto" value={item.speech || ''} placeholder="أضف ما ستقوله في هذه المحطة…" onChange={(e) => setItem(index, 'speech', e.target.value)} />
                </div>
                <div className="col-12 col-md-6">
                  <MediaUploadField value={item.imageUrl || ''} folder="story" label="الصورة (اختيارية)" placeholder="رابط الصورة أو ارفع ملفاً لاحقاً" onChange={(url) => setItem(index, 'imageUrl', url)} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">النص البديل للصورة</label>
                  <input className="form-control form-control-sm" dir="auto" value={item.imageAlt || ''} placeholder="وصف موجز للصورة" onChange={(e) => setItem(index, 'imageAlt', e.target.value)} />
                  <label className="form-label small fw-semibold mt-2">اقتراح لموضع الصورة الفارغ</label>
                  <input className="form-control form-control-sm" dir="auto" value={item.imageCue || ''} placeholder="مثال: صورة شخصية أو تصور تجريدي" onChange={(e) => setItem(index, 'imageCue', e.target.value)} />
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
