import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import AgentsPage from './pages/AgentsPage';
import AgentCaseStudyPage from './pages/AgentCaseStudyPage';
import AgentDemoPage from './pages/AgentDemoPage';
import CaseStudyRenderer from './components/case-study/CaseStudyRenderer';
import LegacyCaseStudyRedirect from './components/common/LegacyCaseStudyRedirect';

import AboutPage from './pages/AboutPage';

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
import AdminSettings from './admin/pages/AdminSettings';

// Admin Documentation
import AdminDocs from './admin/pages/AdminDocs';
import AdminDocsDeployment from './admin/pages/AdminDocsDeployment';
import AdminDocsGit from './admin/pages/AdminDocsGit';
import AdminDocsDocker from './admin/pages/AdminDocsDocker';
import AdminDocsVPS from './admin/pages/AdminDocsVPS';
import AdminDocsCaddy from './admin/pages/AdminDocsCaddy';
import AdminDocsSupabase from './admin/pages/AdminDocsSupabase';
import AdminDocsTroubleshooting from './admin/pages/AdminDocsTroubleshooting';
import AdminDocsRollback from './admin/pages/AdminDocsRollback';
import AdminDocsNewProject from './admin/pages/AdminDocsNewProject';

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
        <Route path="/about" element={<AboutPage />} />
        <Route path="/copilot" element={<PlaceholderPage title="Naïm Copilot" description="Interactive AI Assistant." />} />
        <Route path="/p/:slug" element={<CmsDynamicPage />} />

        {/* Legacy redirects for old static URLs */}
        <Route path="/case-studies" element={<Navigate to="/work" replace />} />
        <Route path="/case-studies/:slug" element={<LegacyCaseStudyRedirect />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />

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
            <Route path="settings" element={<AdminSettings />} />

            {/* Documentation Routes */}
            <Route path="docs" element={<AdminDocs />} />
            <Route path="docs/deployment" element={<AdminDocsDeployment />} />
            <Route path="docs/git" element={<AdminDocsGit />} />
            <Route path="docs/docker" element={<AdminDocsDocker />} />
            <Route path="docs/vps" element={<AdminDocsVPS />} />
            <Route path="docs/caddy" element={<AdminDocsCaddy />} />
            <Route path="docs/supabase" element={<AdminDocsSupabase />} />
            <Route path="docs/troubleshooting" element={<AdminDocsTroubleshooting />} />
            <Route path="docs/rollback" element={<AdminDocsRollback />} />
            <Route path="docs/new-project" element={<AdminDocsNewProject />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" description="The page you are looking for does not exist." />} />
      </Routes>
    </AuthProvider>
  );
}
