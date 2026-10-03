import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublishedCaseStudyBySlug } from '../../services/caseStudies';
import StandardCaseStudy from './StandardCaseStudy';
import CMSCaseStudyRenderer from './CMSCaseStudyRenderer';
import CaseStudyNotFound from './CaseStudyNotFound';
import WinniCaseStudy from '../../pages/custom-case-studies/WinniCaseStudy';
import AssestiniCaseStudy from '../../pages/custom-case-studies/AssestiniCaseStudy';

export default function CaseStudyRenderer() {
  const { slug } = useParams();
  const cleanSlug = (slug || '').replace(/\.html$/i, '');
  const [studyData, setStudyData] = useState(null);
  const [isCMS, setIsCMS] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Custom flagship routes stay code-driven in React
    if (cleanSlug === 'winni' || cleanSlug === 'assestini') {
      setLoading(false);
      return;
    }

    async function loadStudy() {
      setLoading(true);
      const res = await getPublishedCaseStudyBySlug(cleanSlug);
      setStudyData(res.data);
      setIsCMS(Boolean(res.isCMS));
      setLoading(false);
    }

    loadStudy();
  }, [cleanSlug]);

  // 1. Custom Flagship React Case Studies
  if (cleanSlug === 'winni') {
    return <WinniCaseStudy />;
  }
  if (cleanSlug === 'assestini') {
    return <AssestiniCaseStudy />;
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading case study...</span>
        </div>
      </div>
    );
  }

  // 2. Case study not found in CMS nor local fallback
  if (!studyData) {
    return <CaseStudyNotFound slug={slug} />;
  }

  // 3. Render via Public CMS Block Renderer if CMS data exists
  if (isCMS) {
    return <CMSCaseStudyRenderer caseStudy={studyData} />;
  }

  // 4. Otherwise render via standard fallback renderer
  return <StandardCaseStudy data={studyData} />;
}
