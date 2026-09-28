import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProjects } from '../../services/projects';
import { getAdminCaseStudies } from '../../services/caseStudies';
import { getAdminMedia } from '../../services/media';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    projectsCount: 0,
    publishedCount: 0,
    draftsCount: 0,
    caseStudiesCount: 0,
    mediaCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [projRes, csRes, mediaRes] = await Promise.all([
        getAdminProjects(),
        getAdminCaseStudies(),
        getAdminMedia(),
      ]);

      const projects = projRes.data || [];
      const published = projects.filter((p) => p.status === 'published').length;
      const drafts = projects.filter((p) => p.status === 'draft').length;

      setStats({
        projectsCount: projects.length,
        publishedCount: published,
        draftsCount: drafts,
        caseStudiesCount: csRes.data?.length || 0,
        mediaCount: mediaRes.data?.length || 0,
      });
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div>
      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-4">
          <i className="bi bi-info-circle-fill"></i>
          <div>
            <strong>Local Mode Active:</strong> Supabase credentials are not detected in <code>.env</code>. The CMS is displaying fallback snapshot data.
          </div>
        </div>
      )}

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Projects</div>
          <div className="admin-stat-value">{loading ? '—' : stats.projectsCount}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Published</div>
          <div className="admin-stat-value text-success">{loading ? '—' : stats.publishedCount}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Drafts</div>
          <div className="admin-stat-value text-warning">{loading ? '—' : stats.draftsCount}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Case Studies</div>
          <div className="admin-stat-value">{loading ? '—' : stats.caseStudiesCount}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Media Assets</div>
          <div className="admin-stat-value">{loading ? '—' : stats.mediaCount}</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="fs-5 text-white mb-3">Quick Navigation</h3>
        <p className="text-muted small mb-4">
          Manage your portfolio content, case studies and media assets.
        </p>

        <div className="d-flex flex-wrap gap-3">
          <Link to="/admin/projects" className="admin-btn admin-btn-primary">
            <i className="bi bi-folder2-open"></i> Manage Projects
          </Link>
          <Link to="/admin/case-studies" className="admin-btn admin-btn-secondary">
            <i className="bi bi-journal-richtext"></i> Manage Case Studies
          </Link>
          <Link to="/admin/media" className="admin-btn admin-btn-secondary">
            <i className="bi bi-images"></i> Media Library
          </Link>
        </div>
      </div>
    </div>
  );
}
