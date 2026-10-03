import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('admin_sidebar_collapsed', String(nextState));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navFamilies = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        { to: '/admin/projects', label: 'Projects', icon: 'bi-folder2-open' },
        { to: '/admin/case-studies', label: 'Case Studies', icon: 'bi-journal-richtext' },
        { to: '/admin/agents', label: 'AI Agents', icon: 'bi-robot' },
        { to: '/admin/pages', label: 'Pages', icon: 'bi-file-earmark-richtext' },
      ],
    },
    {
      title: 'SITE',
      items: [
        { to: '/admin/navigation', label: 'Navigation', icon: 'bi-compass' },
        { to: '/admin/media', label: 'Media', icon: 'bi-images' },
        { to: '/admin/settings', label: 'Settings', icon: 'bi-gear' },
      ],
    },
    {
      title: 'AI / RUNTIME',
      items: [
        { to: '/admin/mcp-connections', label: 'MCP Connections', icon: 'bi-hdd-network' },
        { to: '/admin/runtime-console', label: 'Runtime Console', icon: 'bi-terminal' },
      ],
    },
    {
      title: 'DOCUMENTATION',
      items: [
        { to: '/admin/docs', label: 'Docs Overview', icon: 'bi-book', end: true },
        { to: '/admin/docs/deployment', label: 'Deployment Guide', icon: 'bi-rocket-takeoff' },
        { to: '/admin/docs/git', label: 'Git Workflow', icon: 'bi-git' },
        { to: '/admin/docs/docker', label: 'Docker Guide', icon: 'bi-box-seam' },
        { to: '/admin/docs/vps', label: 'VPS Guide', icon: 'bi-server' },
        { to: '/admin/docs/caddy', label: 'Caddy & HTTPS', icon: 'bi-shield-check' },
        { to: '/admin/docs/supabase', label: 'Supabase & CMS', icon: 'bi-database' },
        { to: '/admin/docs/troubleshooting', label: 'Troubleshooting', icon: 'bi-bug' },
        { to: '/admin/docs/rollback', label: 'Rollback', icon: 'bi-arrow-counterclockwise' },
        { to: '/admin/docs/new-project', label: 'New Project', icon: 'bi-plus-square' },
      ],
    },
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <Link to="/admin" className="admin-brand" title="NAÏM BSILI CMS">
          <span className="brand-text">NAÏM BSILI</span> <span className="cms-badge">CMS</span>
        </Link>
        <button
          type="button"
          className="admin-sidebar-toggle-btn"
          onClick={toggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </button>
      </div>

      <nav className="admin-nav overflow-auto">
        {navFamilies.map((family) => (
          <div key={family.title} className="nav-family-group mb-3">
            {!collapsed && (
              <div className="nav-family-title text-uppercase tracking-wider text-muted fw-bold px-3 mb-1" style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                {family.title}
              </div>
            )}
            {family.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end || false}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <i className={`bi ${item.icon}`}></i>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        {!collapsed && (
          <div className="admin-user-info">
            <span className="admin-user-email" title={user?.email}>{user?.email || 'admin'}</span>
            <span className="admin-user-role">{profile?.role || 'admin'}</span>
          </div>
        )}
        <button className="admin-logout-btn" onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </aside>
  );
}
