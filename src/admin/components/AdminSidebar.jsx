import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  // Track expanded submenu groups in state & localStorage
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_expanded_groups');
      return saved ? JSON.parse(saved) : { CONTENT: true, RESOURCES: true, AI_AUTOMATION: true, SYSTEM: false };
    } catch {
      return { CONTENT: true, RESOURCES: true, AI_AUTOMATION: true, SYSTEM: false };
    }
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('admin_sidebar_expanded_groups', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('admin_sidebar_collapsed', String(nextState));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Define the comprehensive hierarchical navigation
  const navSections = useMemo(
    () => [
      {
        id: 'OVERVIEW',
        title: 'OVERVIEW',
        isGroup: false,
        items: [
          { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
        ],
      },
      {
        id: 'CONTENT',
        title: 'CONTENT',
        isGroup: true,
        icon: 'bi-kanban',
        rootPath: '/admin/content',
        activePrefixes: ['/admin/content', '/admin/pages', '/admin/projects', '/admin/case-studies', '/admin/navigation', '/admin/registry'],
        items: [
          { to: '/admin/pages', label: 'Pages', icon: 'bi-file-earmark-richtext' },
          { to: '/admin/content', label: 'Blog & Editorial', icon: 'bi-journal-text' },
          { to: '/admin/projects', label: 'Projects', icon: 'bi-folder2-open' },
          { to: '/admin/case-studies', label: 'Case Studies', icon: 'bi-journal-richtext' },
          { to: '/admin/navigation', label: 'Navigation', icon: 'bi-compass' },
          { to: '/admin/registry', label: 'Content Registry', icon: 'bi-grid-3x3-gap' },
        ],
      },
      {
        id: 'RESOURCES',
        title: 'RESOURCES',
        isGroup: true,
        icon: 'bi-collection',
        rootPath: '/admin/resources',
        badge: 'NEW',
        activePrefixes: ['/admin/resources'],
        items: [
          { to: '/admin/resources', label: 'All Resources', icon: 'bi-grid-fill', end: true },
          { to: '/admin/resources?type=skill', label: 'Skills', icon: 'bi-cpu' },
          { to: '/admin/resources?type=template', label: 'Templates', icon: 'bi-layout-text-window-reverse' },
          { to: '/admin/resources?type=document', label: 'Documents', icon: 'bi-file-earmark-pdf' },
          { to: '/admin/resources?type=guide', label: 'Guides', icon: 'bi-journal-code' },
          { to: '/admin/resources?type=figma', label: 'Figma', icon: 'bi-figma' },
          { to: '/admin/resources?type=prompt', label: 'Prompts', icon: 'bi-chat-square-quote' },
          { to: '/admin/resources?type=example', label: 'Examples', icon: 'bi-collection-play' },
          { to: '/admin/resources?type=file', label: 'Files & Bundles', icon: 'bi-file-earmark-zip' },
        ],
      },
      {
        id: 'AI_AUTOMATION',
        title: 'AI & AUTOMATION',
        isGroup: true,
        icon: 'bi-robot',
        rootPath: '/admin/agents',
        activePrefixes: ['/admin/agents', '/admin/mcp-connections', '/admin/runtime-console'],
        items: [
          { to: '/admin/agents', label: 'AI Agents', icon: 'bi-robot' },
          { to: '/admin/mcp-connections', label: 'MCP Connections', icon: 'bi-hdd-network' },
          { to: '/admin/runtime-console', label: 'Runtime Console', icon: 'bi-terminal' },
        ],
      },
      {
        id: 'MARKETING',
        title: 'MARKETING',
        isGroup: true,
        icon: 'bi-megaphone',
        rootPath: '/admin/marketing',
        badge: 'NEW',
        activePrefixes: ['/admin/marketing'],
        items: [
          { to: '/admin/marketing/leads', label: 'Leads', icon: 'bi-people-fill' },
          { to: '/admin/marketing/downloads', label: 'Downloads', icon: 'bi-download' },
          { to: '/admin/marketing/supporters', label: 'Supporters', icon: 'bi-cup-hot-fill' },
          { to: '/admin/marketing/campaigns', label: 'Campaigns', icon: 'bi-send-fill' },
        ],
      },
      {
        id: 'MEDIA',
        title: 'MEDIA',
        isGroup: false,
        items: [
          { to: '/admin/media', label: 'Media Library', icon: 'bi-images' },
        ],
      },
      {
        id: 'SYSTEM',
        title: 'SYSTEM',
        isGroup: true,
        icon: 'bi-sliders',
        rootPath: '/admin/settings',
        activePrefixes: ['/admin/settings', '/admin/docs'],
        items: [
          { to: '/admin/docs/deployment', label: 'Deployments', icon: 'bi-rocket-takeoff' },
          { to: '/admin/docs/vps', label: 'Infrastructure', icon: 'bi-server' },
          { to: '/admin/docs', label: 'Documentation', icon: 'bi-book' },
          { to: '/admin/settings', label: 'Site Settings', icon: 'bi-gear' },
          { to: '/admin/settings/theme', label: 'Theme Tokens', icon: 'bi-palette' },
        ],
      },
    ],
    []
  );

  // Auto-expand parent group if current location is active inside it
  useEffect(() => {
    const currentPath = location.pathname;
    navSections.forEach((section) => {
      if (section.isGroup && section.activePrefixes) {
        const matches = section.activePrefixes.some((prefix) => currentPath.startsWith(prefix));
        if (matches && !expandedGroups[section.id]) {
          setExpandedGroups((prev) => ({ ...prev, [section.id]: true }));
        }
      }
    });
  }, [location.pathname, navSections]);

  const isChildActive = (itemTo, end = false) => {
    const [pathPart, queryPart] = itemTo.split('?');
    const isPathMatch = end
      ? location.pathname === pathPart && (!queryPart || location.search === `?${queryPart}`)
      : location.pathname.startsWith(pathPart);

    if (queryPart) {
      return location.pathname === pathPart && location.search.includes(queryPart);
    }
    if (itemTo === '/admin/resources' && location.search) {
      // If we are at /admin/resources?type=... then "All Resources" shouldn't also be active
      return false;
    }
    return isPathMatch;
  };

  const isGroupActive = (section) => {
    if (!section.activePrefixes) return false;
    return section.activePrefixes.some((p) => location.pathname.startsWith(p));
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Admin Navigation Sidebar">
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
        {navSections.map((section) => {
          if (!section.isGroup) {
            // Standalone top-level family
            return (
              <div key={section.id} className="nav-family-group mb-2">
                {!collapsed && (
                  <div className="nav-family-title text-uppercase tracking-wider text-muted fw-bold px-3 mb-1" style={{ fontSize: '0.65rem', opacity: 0.65 }}>
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
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
            );
          }

          // Expandable Submenu Group
          const isExpanded = Boolean(expandedGroups[section.id]);
          const hasActiveChild = isGroupActive(section);

          return (
            <div key={section.id} className={`nav-family-group expandable-group mb-2 ${hasActiveChild ? 'has-active-child' : ''}`}>
              {!collapsed ? (
                <button
                  type="button"
                  className={`nav-group-toggle-btn ${hasActiveChild ? 'parent-active' : ''}`}
                  onClick={() => toggleGroup(section.id)}
                  aria-expanded={isExpanded}
                  title={`Toggle ${section.title}`}
                >
                  <div className="nav-group-title-wrapper">
                    <span className="nav-group-title">{section.title}</span>
                    {section.badge && <span className="nav-group-badge">{section.badge}</span>}
                  </div>
                  <i className={`bi bi-chevron-down nav-chevron ${isExpanded ? 'rotated' : ''}`}></i>
                </button>
              ) : (
                // Collapsed mode: single icon button for the group
                <div
                  className={`admin-nav-item group-collapsed-icon ${hasActiveChild ? 'active' : ''}`}
                  onClick={toggleCollapse}
                  title={`${section.title} (Click to expand sidebar)`}
                >
                  <i className={`bi ${section.icon || 'bi-folder'}`}></i>
                </div>
              )}

              {/* Submenu items */}
              {!collapsed && isExpanded && (
                <div className="nav-submenu-list">
                  {section.items.map((item) => {
                    const active = isChildActive(item.to, item.end);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`admin-nav-item admin-subnav-item ${active ? 'active' : ''}`}
                      >
                        <i className={`bi ${item.icon}`}></i>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        {!collapsed && (
          <div className="admin-user-info">
            <span className="admin-user-email" title={user?.email}>{user?.email || 'admin@naimbsili.com'}</span>
            <span className="admin-user-role">{profile?.role || 'administrator'}</span>
          </div>
        )}
        <button className="admin-logout-btn" onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </aside>
  );
}
