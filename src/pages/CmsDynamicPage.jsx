import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageRenderer from '../components/cms/PageRenderer';
import { getPageBySlug, getPageSections } from '../services/siteCms';

/**
 * Dynamic CMS Page Route Component.
 * Resolves published pages by slug without overriding reserved application routes.
 */
export default function CmsDynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPageData() {
      if (!slug) return;
      setLoading(true);
      setError(null);

      const pageRes = await getPageBySlug(slug);
      if (pageRes.error || !pageRes.data) {
        setError(pageRes.error || new Error('Page not found'));
        setPage(null);
        setSections([]);
        setLoading(false);
        return;
      }

      setPage(pageRes.data);

      const secRes = await getPageSections(pageRes.data.id);
      setSections(secRes.data || []);
      setLoading(false);
    }

    loadPageData();
  }, [slug]);

  return <PageRenderer page={page} sections={sections} loading={loading} error={error} />;
}
