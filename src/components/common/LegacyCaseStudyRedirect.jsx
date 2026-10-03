import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Handles backwards-compatible redirects for legacy static case study URLs
 * such as /case-studies/winni.html, /case-studies/winni, /case-studies/assestini.html, etc.
 * Redirects them permanently to canonical React routes: /work/:slug
 */
export default function LegacyCaseStudyRedirect() {
  const { slug } = useParams();
  const cleanSlug = slug ? slug.replace(/\.html$/i, '') : '';

  if (!cleanSlug) {
    return <Navigate to="/work" replace />;
  }

  return <Navigate to={`/work/${cleanSlug}`} replace />;
}
