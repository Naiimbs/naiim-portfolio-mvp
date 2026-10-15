import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Eager: landing page + tiny shared components (keep initial load instant, no flash)
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import LegacyCaseStudyRedirect from './components/common/LegacyCaseStudyRedirect';
import GlobalThemeApplier from './components/common/GlobalThemeApplier';
import { AuthProvider } from './admin/context/AuthContext';

// Lazy: secondary public pages (loaded on navigation, not on first paint)
const WorkPage = lazy(() => import('./pages/WorkPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const AgentCaseStudyPage = lazy(() => import('./pages/AgentCaseStudyPage'));
const AgentDemoPage = lazy(() => import('./pages/AgentDemoPage'));
const CaseStudyRenderer = lazy(() => import('./components/case-study/CaseStudyRenderer'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage'));
const CmsDynamicPage = lazy(() => import('./pages/CmsDynamicPage'));

// Lazy: entire Admin CMS (never shipped to public visitors)
const AdminGuard = lazy(() => import('./admin/components/AdminGuard'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminContent = lazy(() => import('./admin/pages/AdminContent'));
const AdminBlogEditor = lazy(() => import('./admin/pages/AdminBlogEditor'));
const AdminProjects = lazy(() => import('./admin/pages/AdminProjects'));
const AdminProjectEditor = lazy(() => import('./admin/pages/AdminProjectEditor'));
const AdminCaseStudies = lazy(() => import('./admin/pages/AdminCaseStudies'));
// Legacy standalone case-study editor (AdminCaseStudyEditor) is retired: it wrote
// the old case_studies tables that no public route reads. Case studies are now
// edited via the Content Registry (/admin/registry/:id).
const AdminResources = lazy(() => import('./admin/pages/AdminResources'));
const AdminResourceEditor = lazy(() => import('./admin/pages/AdminResourceEditor'));
const AdminAgents = lazy(() => import('./admin/pages/AdminAgents'));
const AdminAgentEditor = lazy(() => import('./admin/pages/AdminAgentEditor'));
const AdminMCPConnections = lazy(() => import('./admin/pages/AdminMCPConnections'));
const AdminMCPConnectionEditor = lazy(() => import('./admin/pages/AdminMCPConnectionEditor'));
const AdminRuntimeConsole = lazy(() => import('./admin/pages/AdminRuntimeConsole'));
const AdminMedia = lazy(() => import('./admin/pages/AdminMedia'));
const AdminPages = lazy(() => import('./admin/pages/AdminPages'));
const AdminPageEditor = lazy(() => import('./admin/pages/AdminPageEditor'));
const AdminNavigation = lazy(() => import('./admin/pages/AdminNavigation'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'));
const AdminThemeSettings = lazy(() => import('./admin/pages/AdminThemeSettings'));
const AdminRegistry = lazy(() => import('./admin/pages/AdminRegistry'));
const AdminRegistryEntry = lazy(() => import('./admin/pages/AdminRegistryEntry'));
const AdminMarketingLeads = lazy(() => import('./admin/pages/AdminMarketingLeads'));
const AdminMarketingDownloads = lazy(() => import('./admin/pages/AdminMarketingDownloads'));
const AdminMarketingSupporters = lazy(() => import('./admin/pages/AdminMarketingSupporters'));
const AdminMarketingCampaigns = lazy(() => import('./admin/pages/AdminMarketingCampaigns'));
const AdminFeedback = lazy(() => import('./admin/pages/AdminFeedback'));

// Lazy: Admin Documentation
const AdminDocs = lazy(() => import('./admin/pages/AdminDocs'));
const AdminDocsDeployment = lazy(() => import('./admin/pages/AdminDocsDeployment'));
const AdminDocsGit = lazy(() => import('./admin/pages/AdminDocsGit'));
const AdminDocsDocker = lazy(() => import('./admin/pages/AdminDocsDocker'));
const AdminDocsVPS = lazy(() => import('./admin/pages/AdminDocsVPS'));
const AdminDocsCaddy = lazy(() => import('./admin/pages/AdminDocsCaddy'));
const AdminDocsSupabase = lazy(() => import('./admin/pages/AdminDocsSupabase'));
const AdminDocsTroubleshooting = lazy(() => import('./admin/pages/AdminDocsTroubleshooting'));
const AdminDocsRollback = lazy(() => import('./admin/pages/AdminDocsRollback'));
const AdminDocsNewProject = lazy(() => import('./admin/pages/AdminDocsNewProject'));

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalThemeApplier />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/:slug" element={<CaseStudyRenderer />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:slug" element={<AgentCaseStudyPage />} />
          <Route path="/agents/:slug/demo" element={<AgentDemoPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:slug" element={<ResourceDetailPage />} />
          <Route path="/plugins" element={<PlaceholderPage title="Figma Plugins" description="Tools and utilities built for design systems." />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/copilot" element={<PlaceholderPage title="Naïm Copilot" description="Interactive AI Assistant." />} />
          <Route path="/p/:slug" element={<CmsDynamicPage />} />

          {/* Legacy redirects for old static URLs */}
          <Route path="/projects" element={<Navigate to="/work" replace />} />
          <Route path="/case-studies" element={<Navigate to="/work" replace />} />
          <Route path="/case-studies/:slug" element={<LegacyCaseStudyRedirect />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />

          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin CMS Routes */}
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="content/blog/new" element={<AdminBlogEditor />} />
              <Route path="content/blog/:id" element={<AdminBlogEditor />} />
              <Route path="registry" element={<AdminRegistry />} />
              <Route path="registry/:id" element={<AdminRegistryEntry />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="projects/:id" element={<AdminProjectEditor />} />
              <Route path="case-studies" element={<AdminCaseStudies />} />
              {/* Legacy editor retired — redirect any deep links to the list (editing is via Content Registry) */}
              <Route path="case-studies/:id" element={<Navigate to="/admin/case-studies" replace />} />

              {/* Resources Management Routes */}
              <Route path="resources" element={<AdminResources />} />
              <Route path="resources/new" element={<AdminResourceEditor />} />
              <Route path="resources/:id" element={<AdminResourceEditor />} />

              {/* AI & Automation Routes */}
              <Route path="agents" element={<AdminAgents />} />
              <Route path="agents/new" element={<AdminAgentEditor />} />
              <Route path="agents/:id" element={<AdminAgentEditor />} />
              <Route path="mcp-connections" element={<AdminMCPConnections />} />
              <Route path="mcp-connections/new" element={<AdminMCPConnectionEditor />} />
              <Route path="mcp-connections/:id" element={<AdminMCPConnectionEditor />} />
              <Route path="runtime-console" element={<AdminRuntimeConsole />} />

              {/* Marketing & Leads Routes */}
              <Route path="marketing/leads" element={<AdminMarketingLeads />} />
              <Route path="marketing/downloads" element={<AdminMarketingDownloads />} />
              <Route path="marketing/supporters" element={<AdminMarketingSupporters />} />
              <Route path="marketing/feedback" element={<AdminFeedback />} />
              <Route path="marketing/campaigns" element={<AdminMarketingCampaigns />} />

              {/* Media & Pages */}
              <Route path="media" element={<AdminMedia />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="pages/:id" element={<AdminPageEditor />} />
              <Route path="navigation" element={<AdminNavigation />} />

              {/* Settings */}
              <Route path="settings" element={<AdminSettings />} />
              <Route path="settings/theme" element={<AdminThemeSettings />} />

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
      </Suspense>
    </AuthProvider>
  );
}
