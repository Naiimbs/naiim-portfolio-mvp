import React from 'react';
import OccasionBanner from '../components/common/OccasionBanner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function MainLayout({ children }) {
  return (
    <>
      <OccasionBanner />
      <Navbar />
      <main id="top">
        {children}
      </main>
      <Footer />
    </>
  );
}
