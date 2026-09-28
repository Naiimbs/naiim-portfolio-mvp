import { siteConfig } from '../config/site';

export const getPersonSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: siteConfig.name,
  url: siteConfig.url,
  jobTitle: siteConfig.author.role,
  description: siteConfig.description,
  sameAs: [
    siteConfig.socials.linkedin,
    siteConfig.socials.instagram,
    siteConfig.socials.tiktok,
    siteConfig.socials.github,
  ],
});

export const getWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.title,
  url: siteConfig.url,
  description: siteConfig.description,
  author: {
    '@type': 'Person',
    name: siteConfig.name,
  },
});

export const getCaseStudySchema = ({ title, description, slug, image, datePublished = '2026-01-01' }) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  headline: title,
  description: description,
  url: `${siteConfig.url}/work/${slug}`,
  image: image ? (image.startsWith('http') ? image : `${siteConfig.url}${image}`) : undefined,
  datePublished,
  author: {
    '@type': 'Person',
    name: siteConfig.name,
  },
});
