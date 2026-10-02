import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../../config/site';
import { getPublicSiteSettings } from '../../services/siteCms';

export default function SEO({
  title,
  description,
  canonical,
  type = 'website',
  image,
  robots = 'index, follow',
  schema,
}) {
  const [cmsSettings, setCmsSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getPublicSiteSettings().then((res) => {
      if (isMounted && res.data) {
        setCmsSettings(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const siteName = cmsSettings?.site_name || siteConfig.name;
  const defaultTitle = cmsSettings?.default_seo_title || siteConfig.title;
  const fullTitle = title ? `${title} · ${siteName}` : defaultTitle;

  const metaDescription = description || cmsSettings?.default_seo_description || siteConfig.description;

  const canonicalUrl = canonical
    ? `${siteConfig.url}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
    : siteConfig.url;

  const rawImage = image || cmsSettings?.default_og_image;
  const ogImage = rawImage
    ? rawImage.startsWith('http')
      ? rawImage
      : `${siteConfig.url}${rawImage.startsWith('/') ? rawImage : `/${rawImage}`}`
    : `${siteConfig.url}/assets/images/naim-portrait.jpg`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
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

      {/* Global Custom CSS Injection */}
      {cmsSettings?.custom_css && (
        <style id="cms-custom-css">{cmsSettings.custom_css}</style>
      )}
    </Helmet>
  );
}
