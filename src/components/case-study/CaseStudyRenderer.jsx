import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { caseStudies } from '../../data/caseStudies';
import StandardCaseStudy from './StandardCaseStudy';
import CaseStudyNotFound from './CaseStudyNotFound';
import WinniCaseStudy from '../../pages/custom-case-studies/WinniCaseStudy';
import AssestiniCaseStudy from '../../pages/custom-case-studies/AssestiniCaseStudy';

export default function CaseStudyRenderer() {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const study = caseStudies[slug];

  if (!study) {
    return <CaseStudyNotFound slug={slug} />;
  }

  if (study.type === 'custom') {
    if (slug === 'winni') {
      return <WinniCaseStudy />;
    }
    if (slug === 'assestini') {
      return <AssestiniCaseStudy />;
    }
  }

  return <StandardCaseStudy data={study} />;
}
