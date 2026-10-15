import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import AdSlot from '../components/monetization/AdSlot';
import { getPublishedBlogPosts } from '../services/contentOperations';
import { resolveAsset } from '../services/assetRegistry';

export default function BlogPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar' : 'en-US';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const res = await getPublishedBlogPosts();
      setPosts(res.data || []);
      setLoading(false);
    }
    loadPosts();
  }, []);

  const categories = ['ALL', ...new Set(posts.map((p) => p.metadata?.category).filter(Boolean))];

  const filteredPosts = posts.filter((post) => {
    const meta = post.metadata || {};
    const matchesCategory = activeCategory === 'ALL' || meta.category === activeCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.title?.toLowerCase().includes(q) ||
      meta.excerpt?.toLowerCase().includes(q) ||
      meta.category?.toLowerCase().includes(q) ||
      (Array.isArray(meta.tags) && meta.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];

  return (
    <MainLayout>
      <Helmet>
        <title>Blog & Writing — Naïm Bsili | Product Designer & AI Builder</title>
        <meta
          name="description"
          content="Articles, technical write-ups, and case studies on AI copilot architecture, design systems, and product automation."
        />
        <link rel="canonical" href="https://naiimbsili.com/blog" />
      </Helmet>

      <div className="pt-5 pb-5">
        <div className="container pt-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-5">
            <div className="eyebrow justify-content-center mb-2">
              <span></span> {t('blogList.eyebrow')}
            </div>
            <h1 className="display-4 fw-bold font-heading mb-3">
              {t('blogList.title')}
            </h1>
            <p className="lead text-secondary">
              {t('blogList.lead')}
            </p>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-5 p-3 bg-white rounded-4 shadow-sm border border-light-subtle">
            {/* Category Pills */}
            <div className="d-flex flex-wrap gap-1 align-items-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${
                    activeCategory === cat ? 'btn-primary' : 'btn-outline-secondary bg-white'
                  }`}
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'ALL' ? t('blogList.allArticles') : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder={t('blogList.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 bg-white"
                  onClick={() => setSearch('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('blogList.loading')}</span>
              </div>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="row g-4">
              {filteredPosts.map((post) => {
                const meta = post.metadata || {};
                const cover = meta.featuredImage ? resolveAsset(meta.featuredImage) : null;
                const dateStr = meta.publishedAt
                  ? new Date(meta.publishedAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })
                  : t('blogList.datePublished');

                return (
                  <div key={post.id} className="col-12 col-md-6 col-lg-4">
                    <article className="card h-100 rounded-4 border-0 shadow-sm bg-white overflow-hidden transition-all hover-translate-y">
                      {cover && (
                        <Link to={`/blog/${post.slug}`} className="d-block overflow-hidden" style={{ maxHeight: '220px' }}>
                          <img
                            src={cover}
                            alt={post.title}
                            className="w-100 object-fit-cover transition-transform"
                            style={{ height: '220px' }}
                          />
                        </Link>
                      )}

                      <div className="card-body p-4 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>
                            {meta.category || t('blog.categoryFallback')}
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {meta.readingTime || t('blog.readingFallback')}
                          </span>
                        </div>

                        <h5 className="card-title fw-bold mb-2 font-heading">
                          <Link to={`/blog/${post.slug}`} className="text-dark text-decoration-none hover-text-primary">
                            {post.title}
                          </Link>
                        </h5>

                        <p className="card-text text-secondary small flex-grow-1 line-clamp-3">
                          {meta.excerpt || t('blogList.excerptFallback')}
                        </p>

                        <div className="pt-3 border-top mt-3 d-flex justify-content-between align-items-center">
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {dateStr}
                          </span>
                          <Link to={`/blog/${post.slug}`} className="btn btn-sm btn-link text-primary p-0 fw-semibold text-decoration-none">
                            {t('blogList.readArticle')} <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5 my-5 bg-white rounded-4 border border-light-subtle p-5">
              <i className="bi bi-journal-text display-4 text-muted mb-3 d-block"></i>
              <h4 className="fw-bold mb-2">{t('blogList.emptyTitle')}</h4>
              <p className="text-secondary small mb-4">
                {search
                  ? t('blogList.emptyMatch', { search })
                  : t('blogList.emptyNone')}
              </p>
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-dark rounded-pill px-4"
                  onClick={() => {
                    setSearch('');
                    setActiveCategory('ALL');
                  }}
                >
                  {t('blogList.clearFilters')}
                </button>
              )}
            </div>
          )}
          <AdSlot placement="between_articles" />
        </div>
      </div>
    </MainLayout>
  );
}
