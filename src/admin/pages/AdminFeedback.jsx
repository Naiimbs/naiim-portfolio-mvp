import React, { useEffect, useMemo, useState } from 'react';
import { getAllFeedback, getAllViews, getBlogTitles } from '../../services/engagement';

function Stars({ value }) {
  const v = Math.round(value || 0);
  return (
    <span style={{ color: '#f5b301', whiteSpace: 'nowrap' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bi ${n <= v ? 'bi-star-fill' : 'bi-star'}`} style={{ fontSize: '0.8rem' }}></i>
      ))}
    </span>
  );
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [views, setViews] = useState([]);
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [fb, vw, ti] = await Promise.all([getAllFeedback(), getAllViews(), getBlogTitles()]);
      if (!mounted) return;
      setFeedback(fb.data || []);
      setViews(vw.data || []);
      setTitles(ti || {});
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const viewsBySlug = useMemo(() => {
    const m = {};
    views.forEach((v) => { m[v.slug] = v.views; });
    return m;
  }, [views]);

  // Per-article aggregation
  const perArticle = useMemo(() => {
    const map = {};
    feedback.forEach((f) => {
      const m = map[f.slug] || { slug: f.slug, sum: 0, count: 0, comments: 0 };
      m.sum += f.rating;
      m.count += 1;
      if (f.comment && f.comment.trim()) m.comments += 1;
      map[f.slug] = m;
    });
    // include articles that have views but no ratings
    Object.keys(viewsBySlug).forEach((slug) => {
      if (!map[slug]) map[slug] = { slug, sum: 0, count: 0, comments: 0 };
    });
    return Object.values(map)
      .map((m) => ({ ...m, avg: m.count ? m.sum / m.count : 0, views: viewsBySlug[m.slug] || 0 }))
      .sort((a, b) => b.views - a.views || b.count - a.count);
  }, [feedback, viewsBySlug]);

  const totals = useMemo(() => {
    const ratings = feedback.length;
    const avg = ratings ? feedback.reduce((s, f) => s + f.rating, 0) / ratings : 0;
    const totalViews = views.reduce((s, v) => s + (v.views || 0), 0);
    const comments = feedback.filter((f) => f.comment && f.comment.trim()).length;
    return { ratings, avg, totalViews, comments };
  }, [feedback, views]);

  const comments = useMemo(() => feedback.filter((f) => f.comment && f.comment.trim()), [feedback]);

  const titleFor = (slug) => titles[slug] || slug;
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="h3 mb-1 fw-bold">Reader Feedback</h1>
        <p className="text-muted small mb-0">Views, star ratings and private comments left by readers on your articles.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total views', value: totals.totalViews.toLocaleString(), icon: 'bi-eye' },
              { label: 'Ratings', value: totals.ratings, icon: 'bi-star-fill' },
              { label: 'Average rating', value: totals.avg ? totals.avg.toFixed(2) : '—', icon: 'bi-graph-up' },
              { label: 'Comments', value: totals.comments, icon: 'bi-chat-left-text' },
            ].map((c) => (
              <div className="col-6 col-lg-3" key={c.label}>
                <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                  <div className="d-flex align-items-center gap-2 text-muted small mb-1"><i className={`bi ${c.icon}`}></i> {c.label}</div>
                  <div className="h4 fw-bold mb-0">{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-article table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div className="card-header bg-white fw-bold py-3">By article</div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Article</th>
                    <th className="text-end">Views</th>
                    <th>Rating</th>
                    <th className="text-end">Ratings</th>
                    <th className="text-end pe-4">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {perArticle.length === 0 && (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No engagement data yet.</td></tr>
                  )}
                  {perArticle.map((a) => (
                    <tr key={a.slug}>
                      <td className="ps-4">
                        <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" className="fw-semibold text-dark text-decoration-none">
                          {titleFor(a.slug)}
                        </a>
                        <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>/{a.slug}</div>
                      </td>
                      <td className="text-end">{a.views.toLocaleString()}</td>
                      <td>{a.count ? <span className="d-inline-flex align-items-center gap-2"><Stars value={a.avg} /> <span className="small text-muted">{a.avg.toFixed(1)}</span></span> : <span className="text-muted small">—</span>}</td>
                      <td className="text-end">{a.count || '—'}</td>
                      <td className="text-end pe-4">{a.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments feed */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white fw-bold py-3">Comments ({comments.length})</div>
            <div className="list-group list-group-flush">
              {comments.length === 0 && <div className="text-center text-muted py-4">No comments yet.</div>}
              {comments.map((c) => (
                <div key={c.id} className="list-group-item py-3">
                  <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Stars value={c.rating} />
                      <a href={`/blog/${c.slug}`} target="_blank" rel="noreferrer" className="small fw-semibold text-dark text-decoration-none">{titleFor(c.slug)}</a>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>{fmtDate(c.created_at)}</span>
                  </div>
                  <p className="mb-0 text-secondary small">{c.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
