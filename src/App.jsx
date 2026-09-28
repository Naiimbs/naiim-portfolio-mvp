import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import CaseStudyRenderer from './components/case-study/CaseStudyRenderer';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/work" element={<PlaceholderPage title="Selected Work" description="Case studies & digital products directory." />} />
      <Route path="/work/:slug" element={<CaseStudyRenderer />} />
      <Route path="/agents" element={<PlaceholderPage title="AI Agents" description="Intelligent agents & automation systems." />} />
      <Route path="/agents/:slug" element={<PlaceholderPage title="AI Agent" description="Dedicated agent showcase." />} />
      <Route path="/plugins" element={<PlaceholderPage title="Figma Plugins" description="Tools and utilities built for design systems." />} />
      <Route path="/blog" element={<PlaceholderPage title="Blog & Articles" description="Writing about design, AI and technology." />} />
      <Route path="/blog/:slug" element={<PlaceholderPage title="Article" description="Post details." />} />
      <Route path="/about" element={<PlaceholderPage title="About Me" description="Career journey, experience and skills." />} />
      <Route path="/copilot" element={<PlaceholderPage title="Naïm Copilot" description="Interactive AI Assistant." />} />
      <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" description="The page you are looking for does not exist." />} />
    </Routes>
  );
}
