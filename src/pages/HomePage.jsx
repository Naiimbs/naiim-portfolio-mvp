import React from 'react';
import MainLayout from '../layouts/MainLayout';
import HeroSection from '../components/hero/HeroSection';
import SelectedWorkSection from '../components/work/SelectedWorkSection';

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <SelectedWorkSection />
    </MainLayout>
  );
}
