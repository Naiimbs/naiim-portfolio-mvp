import React from 'react';
import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../../config/site';

export default function SEO({
  title,
  description,
  canonical,
  type = 'website',
  image,
  robots = 'index, follow',
  schema,
}) {
  const fullTitle = title ? `${title} · ${siteConfig.name}` : siteConfig.title;
  const metaDescription = description || siteConfig.description;
  const canonicalUrl = canonical
    ? `${siteConfig.url}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
    : siteConfig.url;
  const ogImage = image
    ? image.startsWith('http')
      ? image
      : `${siteConfig.url}${image}`
    : `${siteConfig.url}/assets/images/naim-portrait.jpg`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
