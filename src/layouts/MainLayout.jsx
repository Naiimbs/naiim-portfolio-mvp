import React from 'react';
import OccasionBanner from '../components/common/OccasionBanner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CvDownloadModal from '../components/common/CvDownloadModal';
import { useEffect, useState } from 'react';

export default function MainLayout({ children }) {
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);

  useEffect(() => {
    const openModal = () => setIsCvModalOpen(true);
    window.addEventListener('open-cv-download', openModal);
    return () => window.removeEventListener('open-cv-download', openModal);
  }, []);

  return (
    <>
      <OccasionBanner />
      <Navbar />
      <main id="top">
        {children}
      </main>
      <Footer />
      <CvDownloadModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} />
    </>
  );
}
