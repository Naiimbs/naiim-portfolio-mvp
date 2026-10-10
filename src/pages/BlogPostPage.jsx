import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MainLayout from '../layouts/MainLayout';
import PageRenderer from '../components/cms/PageRenderer';
import AdSlot from '../components/monetization/AdSlot';
import { getBlogPostBySlug, resolveContentSeo } from '../services/contentOperations';
import { resolveAsset } from '../services/assetRegistry';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setNotFound(false);
      const res = await getBlogPostBySlug(slug, { isPreview });
      const foundPost = res?.data || res;
      if (foundPost && (foundPost.id || foundPost.title || foundPost.slug)) {
        setPost(foundPost);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    loadPost();
  }, [slug, isPreview]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-vh-50 d-flex align-items-center justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading article...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound || !post) {
    return (
      <MainLayout>
        <Helmet>
          <title>Article Not Found — Naïm Bsili</title>
        </Helmet>
        <div className="container d-flex flex-column align-items-center justify-content-center text-center py-5">
          <i className="bi bi-file-earmark-x display-3 text-muted mb-3"></i>
          <h2 className="fw-bold mb-2">Article Not Found</h2>
          <p className="text-secondary mb-4" style={{ maxWidth: '420px' }}>
            The requested article &quot;{slug}&quot; either does not exist or has not been published yet.
          </p>
          <Link to="/blog" className="btn btn-primary-custom rounded-pill px-4">
            <i className="bi bi-arrow-left me-1"></i> Back to Blog Catalog
          </Link>
        </div>
      </MainLayout>
    );
  }

  const meta = post.metadata || {};
  const seo = resolveContentSeo(post);
  const cover = meta.featuredImage ? resolveAsset(meta.featuredImage) : null;
  const relationships = Array.isArray(meta.relationships) ? meta.relationships : [];
  const sections = Array.isArray(meta.sections) ? meta.sections : [];

  const dateStr = meta.publishedAt
    ? new Date(meta.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Draft Preview';

  return (
    <MainLayout>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={`https://naimbsili.com${seo.canonical}`} />
        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Preview Notification Banner */}
      {isPreview && (
        <div className="bg-warning bg-opacity-25 border-bottom border-warning py-2 text-center text-dark small fw-semibold">
          <i className="bi bi-eye-fill me-1"></i> Preview Mode: Displaying saved content for &quot;{post.title}&quot; (Status: {post.status}).
        </div>
      )}

      <div className="flex-grow-1 pt-4 pb-5">
        <article className="container">
          {/* Breadcrumb & Meta Bar */}
          <div className="max-w-4xl mx-auto pt-3 mb-4">
            <div className="d-flex align-items-center gap-2 small text-muted mb-3">
              <Link to="/blog" className="text-secondary text-decoration-none hover-text-primary">
                Blog
              </Link>
              <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2">
                {meta.category || 'Article'}
              </span>
              <span className="ms-auto text-muted" style={{ fontSize: '0.75rem' }}>
                {meta.readingTime || '4 min read'}
              </span>
            </div>

            {/* Article Headline */}
            <h1 className="display-4 fw-bold font-heading mb-3 text-dark">
              {post.title}
            </h1>

            {/* Excerpt Lead */}
            {meta.excerpt && (
              <p className="lead text-secondary mb-4">
                {meta.excerpt}
              </p>
            )}

            {/* Author & Published Info */}
            <div className="d-flex align-items-center gap-3 pb-4 border-bottom">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                NB
              </div>
              <div>
                <div className="fw-semibold text-dark small">{meta.author || 'Naïm Bsili'}</div>
                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  {dateStr} · {meta.wordCount ? `${meta.wordCount} words` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Hero Cover Image */}
          {cover && (
            <div className="max-w-4xl mx-auto mb-5 rounded-4 overflow-hidden shadow-sm">
              <img src={cover} alt={post.title} className="w-100 object-fit-cover" style={{ maxHeight: '460px' }} />
            </div>
          )}

          {/* Article Structured Body via PageRenderer */}
          <div className="max-w-4xl mx-auto">
            <AdSlot placement="article_top" />
            {sections.length > 0 ? (
              <PageRenderer
                page={{ title: post.title, template: 'default' }}
                sections={sections}
                loading={false}
              />
            ) : (
              <div className="cms-prose py-4 text-secondary">
                <p>{meta.content || meta.body || 'No extended content available for this article.'}</p>
              </div>
            )}
            <AdSlot placement="article_bottom" />
          </div>

          {/* Tags */}
          {Array.isArray(meta.tags) && meta.tags.length > 0 && (
            <div className="max-w-4xl mx-auto pt-4 border-top mt-5">
              <span className="small fw-semibold text-uppercase text-muted me-2" style={{ fontSize: '0.7rem' }}>
                Tags:
              </span>
              <div className="d-inline-flex flex-wrap gap-1">
                {meta.tags.map((tag) => (
                  <span key={tag} className="badge bg-light text-secondary border rounded-pill px-2 py-1" style={{ fontSize: '0.75rem' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Content / Case Studies */}
          {relationships.length > 0 && (
            <div className="max-w-4xl mx-auto mt-5 pt-4 border-top">
              <h4 className="fw-bold mb-3 font-heading">Related Content &amp; Case Studies</h4>
              <div className="row g-3">
                {relationships.map((rel) => (
                  <div key={rel.id} className="col-12 col-md-6">
                    <div className="card h-100 rounded-3 p-3 border border-light-subtle bg-white shadow-xs">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill" style={{ fontSize: '0.65rem' }}>
                          {rel.type}
                        </span>
                      </div>
                      <h6 className="fw-bold mb-2">
                        <Link to={rel.public_route || `/work/${rel.slug}`} className="text-dark text-decoration-none hover-text-primary">
                          {rel.title}
                        </Link>
                      </h6>
                      <Link to={rel.public_route || `/work/${rel.slug}`} className="small text-primary fw-semibold text-decoration-none mt-auto">
                        Explore {rel.type} <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog CTA */}
          <div className="max-w-4xl mx-auto text-center mt-5 pt-4">
            <Link to="/blog" className="btn btn-outline-dark rounded-pill px-4">
              <i className="bi bi-arrow-left me-1"></i> View All Blog Articles
            </Link>
          </div>
        </article>
      </div>
    </MainLayout>
  );
}
