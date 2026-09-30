import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import AgentsPage from './pages/AgentsPage';
import AgentCaseStudyPage from './pages/AgentCaseStudyPage';
import AgentDemoPage from './pages/AgentDemoPage';
import CaseStudyRenderer from './components/case-study/CaseStudyRenderer';

import CmsDynamicPage from './pages/CmsDynamicPage';

// Admin CMS
import { AuthProvider } from './admin/context/AuthContext';
import AdminGuard from './admin/components/AdminGuard';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminProjects from './admin/pages/AdminProjects';
import AdminProjectEditor from './admin/pages/AdminProjectEditor';
import AdminCaseStudies from './admin/pages/AdminCaseStudies';
import AdminCaseStudyEditor from './admin/pages/AdminCaseStudyEditor';
import AdminAgents from './admin/pages/AdminAgents';
import AdminAgentEditor from './admin/pages/AdminAgentEditor';
import AdminMCPConnections from './admin/pages/AdminMCPConnections';
import AdminMCPConnectionEditor from './admin/pages/AdminMCPConnectionEditor';
import AdminRuntimeConsole from './admin/pages/AdminRuntimeConsole';
import AdminMedia from './admin/pages/AdminMedia';
import AdminPages from './admin/pages/AdminPages';
import AdminPageEditor from './admin/pages/AdminPageEditor';
import AdminNavigation from './admin/pages/AdminNavigation';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/work" element={<PlaceholderPage title="Selected Work" description="Case studies & digital products directory." />} />
        <Route path="/work/:slug" element={<CaseStudyRenderer />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:slug" element={<AgentCaseStudyPage />} />
        <Route path="/agents/:slug/demo" element={<AgentDemoPage />} />
        <Route path="/plugins" element={<PlaceholderPage title="Figma Plugins" description="Tools and utilities built for design systems." />} />
        <Route path="/blog" element={<PlaceholderPage title="Blog & Articles" description="Writing about design, AI and technology." />} />
        <Route path="/blog/:slug" element={<PlaceholderPage title="Article" description="Post details." />} />
        <Route path="/about" element={<PlaceholderPage title="About Me" description="Career journey, experience and skills." />} />
        <Route path="/copilot" element={<PlaceholderPage title="Naïm Copilot" description="Interactive AI Assistant." />} />
        <Route path="/p/:slug" element={<CmsDynamicPage />} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin CMS Routes */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="projects/:id" element={<AdminProjectEditor />} />
            <Route path="case-studies" element={<AdminCaseStudies />} />
            <Route path="case-studies/:id" element={<AdminCaseStudyEditor />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="agents/new" element={<AdminAgentEditor />} />
            <Route path="agents/:id" element={<AdminAgentEditor />} />
            <Route path="mcp-connections" element={<AdminMCPConnections />} />
            <Route path="mcp-connections/new" element={<AdminMCPConnectionEditor />} />
            <Route path="mcp-connections/:id" element={<AdminMCPConnectionEditor />} />
            <Route path="runtime-console" element={<AdminRuntimeConsole />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="pages/:id" element={<AdminPageEditor />} />
            <Route path="navigation" element={<AdminNavigation />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" description="The page you are looking for does not exist." />} />
      </Routes>
    </AuthProvider>
  );
}
