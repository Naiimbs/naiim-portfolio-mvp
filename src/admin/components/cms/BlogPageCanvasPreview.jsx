import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminContentRegistry } from '../../../services/contentRegistry';
import { resolveAsset } from '../../../services/assetRegistry';

export default function BlogPageCanvasPreview({ page, activeLang = 'en', onSelectHeader }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getAdminContentRegistry();
      const all = res.data || [];
      const blogPosts = all.filter(
        (entry) =>
          entry.content_type === 'blog' ||
          entry.content_type === 'article' ||
          (entry.type === 'blog' || entry.type === 'article')
      );
      setPosts(blogPosts);
      setLoading(false);
    }
    load();
  }, []);

  const pageTx = (activeLang !== 'en' && page?.metadata?.i18n?.[activeLang]) || {};
  const headerEyebrow = pageTx.eyebrow || page?.metadata?.eyebrow || 'WRITING & THOUGHTS';
  const headerTitle = pageTx.title || page?.title || 'Blog & Writing';
  const headerLead =
    pageTx.description ||
    page?.seo_description ||
    'Articles, technical write-ups, and notes on design systems, AI engineering, and product craft.';

  const categories = ['ALL', ...new Set(posts.map((p) => p.metadata?.category).filter(Boolean))];

  const filtered = posts.filter((p) => {
    const meta = p.metadata || {};
    const matchesCat = activeCategory === 'ALL' || meta.category === activeCategory;
    const q = search.toLowerCase().trim();
    const matchesQ =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      meta.excerpt?.toLowerCase().includes(q) ||
      meta.category?.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="blog-canvas-preview bg-white rounded-3 p-3 p-md-4">
      {/* Editorial Guidance Strip */}
      <div className="alert alert-info border-0 rounded-4 py-2 px-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="small d-flex align-items-center gap-2">
          <i className="bi bi-info-circle-fill text-info"></i>
          <span>
            <strong>Live Blog Page Preview:</strong> This page dynamically catalogs your blog posts.
            Click any article card to edit it, or use the right panel to customize and translate the page header and SEO.
          </span>
        </div>
        <Link to="/admin/blog/new" className="btn btn-sm btn-dark rounded-pill px-3 py-1 shadow-xs">
          <i className="bi bi-plus-lg me-1"></i> New Article
        </Link>
      </div>

      {/* Header (Clickable to edit in right sidebar) */}
      <div
        className="text-center max-w-3xl mx-auto mb-5 p-3 rounded-4 transition-all"
        style={{ cursor: 'pointer', border: '1px dashed transparent' }}
        onClick={onSelectHeader}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bs-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
        title="Click to edit Blog page Title, Lead & SEO in the right panel"
      >
        <div className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 mb-2 fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
          <span>●</span> {headerEyebrow}
        </div>
        <h1 className="display-5 fw-bold font-heading mb-3">{headerTitle}</h1>
        <p className="lead text-secondary mb-2">{headerLead}</p>
        <small className="text-primary opacity-75">
          <i className="bi bi-pencil-square me-1"></i> Click to edit header & SEO in right sidebar
        </small>
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4 p-3 bg-light rounded-4 border">
        <div className="d-flex flex-wrap gap-1 align-items-center">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                activeCategory === cat ? 'btn-primary' : 'btn-outline-secondary bg-white'
              }`}
              style={{ fontSize: '0.78rem' }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'ALL' ? 'All Articles' : cat}
            </button>
          ))}
        </div>

        <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search preview..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading articles...</span>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="row g-4">
          {filtered.map((post) => {
            const meta = post.metadata || {};
            const tx = (activeLang !== 'en' && meta.i18n?.[activeLang]) || {};
            const cardTitle = tx.title || post.title;
            const cardExcerpt = tx.excerpt || meta.excerpt || post.description || '';
            const cover = meta.featuredImage ? resolveAsset(meta.featuredImage) : null;
            const isPublished = post.status === 'published';

            return (
              <div key={post.id} className="col-12 col-md-6 col-lg-4">
                <article className="card h-100 rounded-4 border shadow-sm bg-white overflow-hidden position-relative d-flex flex-column">
                  {/* Status & Edit Bar */}
                  <div className="p-2 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <span className={`badge rounded-pill ${isPublished ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.68rem' }}>
                      {post.status}
                    </span>
                    <Link
                      to={`/admin/registry/${post.id}`}
                      className="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-semibold"
                      style={{ fontSize: '0.72rem' }}
                      title="Edit this post in the Content Editor"
                    >
                      <i className="bi bi-pencil me-1"></i> Edit Post
                    </Link>
                  </div>

                  {cover && (
                    <div style={{ height: '160px', overflow: 'hidden' }}>
                      <img src={cover} alt={cardTitle} className="w-100 h-100 object-fit-cover" />
                    </div>
                  )}

                  <div className="card-body p-3 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1" style={{ fontSize: '0.68rem' }}>
                        {meta.category || 'Article'}
                      </span>
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {meta.readingTime || '4 min read'}
                      </small>
                    </div>

                    <h6 className="card-title fw-bold mb-2 font-heading">
                      {cardTitle}
                    </h6>

                    <p className="card-text text-secondary small flex-grow-1" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cardExcerpt || 'No excerpt configured.'}
                    </p>

                    <div className="pt-2 border-top mt-2 d-flex justify-content-between align-items-center">
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {meta.publishedAt ? new Date(meta.publishedAt).toLocaleDateString() : 'Draft'}
                      </small>
                      <Link
                        to={`/admin/registry/${post.id}`}
                        className="text-primary small fw-semibold text-decoration-none"
                      >
                        Edit <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5 border rounded-4 bg-light">
          <i className="bi bi-journal-text display-6 text-muted mb-2"></i>
          <p className="text-muted small mb-3">No blog posts found matching your search.</p>
          <Link to="/admin/blog/new" className="btn btn-sm btn-primary rounded-pill px-3">
            <i className="bi bi-plus-lg me-1"></i> Create First Blog Post
          </Link>
        </div>
      )}
    </div>
  );
}
