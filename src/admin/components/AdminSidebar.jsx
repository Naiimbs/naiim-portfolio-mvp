import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <Link to="/admin" className="admin-brand">
          NAÏM BSILI <span className="cms-badge">CMS</span>
        </Link>
      </div>

      <nav className="admin-nav">
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/admin/projects" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-folder2-open"></i>
          <span>Projects</span>
        </NavLink>

        <NavLink to="/admin/case-studies" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-journal-richtext"></i>
          <span>Case Studies</span>
        </NavLink>

        <NavLink to="/admin/agents" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-robot"></i>
          <span>AI Agents</span>
        </NavLink>

        <NavLink to="/admin/mcp-connections" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-hdd-network"></i>
          <span>MCP Connections</span>
        </NavLink>

        <NavLink to="/admin/runtime-console" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-terminal"></i>
          <span>Runtime Console</span>
        </NavLink>

        <NavLink to="/admin/media" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-images"></i>
          <span>Media</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <span className="admin-user-email" title={user?.email}>{user?.email || 'admin'}</span>
          <span className="admin-user-role">{profile?.role || 'admin'}</span>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout} title="Sign Out">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </aside>
  );
}
