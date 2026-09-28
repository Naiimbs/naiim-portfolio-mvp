import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main id="top">
        {children}
      </main>
      <Footer />
    </>
  );
}
