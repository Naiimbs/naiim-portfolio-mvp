import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import '../styles/admin.css';

export default function AdminLayout() {
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path === '/admin') return 'Dashboard';
    if (path.startsWith('/admin/projects')) return 'Projects';
    if (path.startsWith('/admin/case-studies')) return 'Case Studies';
    if (path.startsWith('/admin/pages')) return 'Pages';
    if (path.startsWith('/admin/navigation')) return 'Navigation Management';
    if (path.startsWith('/admin/settings')) return 'Global Site Settings';
    if (path.startsWith('/admin/media')) return 'Media Library';
    return 'Admin CMS';
  };

  const title = getPageTitle(location.pathname);
  const isPageEditor = location.pathname.startsWith('/admin/pages/') && location.pathname !== '/admin/pages';

  return (
    <div className="admin-layout">
      <Helmet>
        <title>{`${title} — Admin CMS`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminSidebar />
      <div className={`admin-main ${isPageEditor ? 'overflow-hidden' : ''}`}>
        <AdminHeader title={title} />
        <main className={`admin-content ${isPageEditor ? 'builder-mode' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
