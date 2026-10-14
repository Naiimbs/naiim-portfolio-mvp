import React, { useEffect, useState } from 'react';
import { getPostRatingSummary, submitPostRating } from '../../services/engagement';

/**
 * Reader feedback widget: "Was this article helpful?" with a 1–5 star rating
 * and an optional private comment (visible only to the author in the DB).
 */
export default function PostFeedback({ slug }) {
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const storeKey = `post_rated_${slug}`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getPostRatingSummary(slug);
      if (mounted && res.data) setSummary(res.data);
    })();
    try {
      if (localStorage.getItem(storeKey) === '1') setDone(true);
    } catch { /* noop */ }
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please choose a star rating first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await submitPostRating(slug, rating, comment);
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message || 'Could not send your feedback. Please try again.');
      return;
    }
    try { localStorage.setItem(storeKey, '1'); } catch { /* noop */ }
    setDone(true);
    const fresh = await getPostRatingSummary(slug);
    if (fresh.data) setSummary(fresh.data);
  };

  const Stars = ({ interactive }) => (
    <div className="d-inline-flex align-items-center gap-1" role={interactive ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = interactive ? n <= (hover || rating) : n <= Math.round(summary.avg);
        return interactive ? (
          <button
            key={n}
            type="button"
            className="btn btn-link p-0 border-0 lh-1"
            style={{ fontSize: '1.6rem', color: filled ? '#f5b301' : '#cbd3da' }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <i className={`bi ${filled ? 'bi-star-fill' : 'bi-star'}`}></i>
          </button>
        ) : (
          <i key={n} className={`bi ${filled ? 'bi-star-fill' : 'bi-star'}`} style={{ color: filled ? '#f5b301' : '#cbd3da' }}></i>
        );
      })}
    </div>
  );

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h5 className="fw-bold font-heading mb-0">Was this article helpful?</h5>
        {summary.count > 0 && (
          <div className="d-flex align-items-center gap-2 small text-muted">
            <Stars interactive={false} />
            <span>{summary.avg.toFixed(1)} · {summary.count} rating{summary.count > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {done ? (
        <div className="text-success fw-semibold">
          <i className="bi bi-check-circle-fill me-2"></i> Thanks for your feedback!
        </div>
      ) : (
        <>
          <p className="text-muted small mb-2">Your rating helps me improve my writing. Comments are private.</p>
          <Stars interactive />
          <textarea
            className="form-control rounded-3 mt-3"
            rows="2"
            placeholder="Optional: what could be better? (private)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
          />
          {error && <div className="small text-danger mt-2"><i className="bi bi-exclamation-triangle me-1"></i>{error}</div>}
          <div className="mt-3">
            <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
