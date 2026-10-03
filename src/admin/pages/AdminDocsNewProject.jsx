import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import NewProjectChecklist from '../components/infra/NewProjectChecklist';
import CommandBlock from '../components/infra/CommandBlock';

export default function AdminDocsNewProject() {
  return (
    <div>
      <Helmet>
        <title>New Project Deployment — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          New Project Deployment Guide
        </h2>
        <p className="text-muted small mb-0">
          Standardized 7-layer checklist and workflow to onboard and deploy any new project or microservice on the VPS.
        </p>
      </div>

      {/* Interactive Checklist Component */}
      <div className="mb-4">
        <NewProjectChecklist />
      </div>

      {/* Detailed Layer Steps */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-terminal text-success me-2" />
          VPS Setup Commands for New Project
        </h5>
        <p className="small text-muted mb-3">
          Execute these standard commands when spinning up a new service directory on the server:
        </p>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">1. Create Project Directory on VPS</h6>
          <CommandBlock
            command="mkdir -p /srv/projects/<slug>/app && cd /srv/projects/<slug>/app"
            risk="safe"
            arabicExplanation="يصنع مجلد المشروع الجديد في مسار /srv/projects الموحد ويدخل فيه."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">2. Clone Git Repository</h6>
          <CommandBlock
            command="git clone <REPOSITORY_GIT_URL> /srv/projects/<slug>/app"
            risk="safe"
            arabicExplanation="يجري استنساخ (clone) للمشروع من GitLab أو GitHub داخل مجلد التطبيق."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">3. Build Docker Image</h6>
          <CommandBlock
            command="docker build -t <slug>:latest ."
            risk="safe"
            arabicExplanation="يبني صورة الدوكر الخاصة بالمشروع الجديد ويسميها باسم الـ slug متاعو."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">4. Run Container on Proxy Network</h6>
          <CommandBlock
            command="docker run -d --name <slug> --network proxy --restart unless-stopped <slug>:latest"
            risk="caution"
            arabicExplanation="يشغل الكونتينر ويربطو مباشرة بشبكة proxy باش ينجم Caddy يتعرف عليه."
          />
        </div>

        <div>
          <h6 className="fw-bold small text-muted text-uppercase mb-2">5. Add Domain to Caddyfile &amp; Reload</h6>
          <CommandBlock
            command={`echo -e "\\n<subdomain.naiimbsili.com> {\\n    reverse_proxy <slug>:80\\n}" >> /srv/proxy/caddy/Caddyfile && docker exec -w /etc/caddy caddy caddy reload`}
            risk="caution"
            arabicExplanation="يزيد عنوان الدومين الجديد في ملف Caddyfile ويعمل reload للـ proxy باش تتفعل شهادة HTTPS في الحين."
          />
        </div>
      </div>
    </div>
  );
}
