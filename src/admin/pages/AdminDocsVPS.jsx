import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CommandBlock from '../components/infra/CommandBlock';

function InfoBox({ children, type = 'info' }) {
  const styles = {
    info: { bg: '#f0fdf7', border: '#b8e0d4', icon: 'bi-info-circle-fill', color: '#087f66' },
    warning: { bg: '#fef9e7', border: '#f5d97a', icon: 'bi-exclamation-triangle-fill', color: '#9a6c00' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <i className={`bi ${s.icon}`} style={{ color: s.color, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ fontSize: '0.84rem', color: '#10242a', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export default function AdminDocsVPS() {
  return (
    <div>
      <Helmet>
        <title>VPS Guide — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          VPS Environment & Server Management
        </h2>
        <p className="text-muted small mb-0">
          Debian host environment, directory hierarchy, SSH access, system resources, and health inspection.
        </p>
      </div>

      {/* VPS Specification Summary */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-server text-success me-2" />
          Server Profile & Directory Hierarchy
        </h5>
        <p className="small text-muted mb-3">
          The application runs on a Debian VPS hosted at OVHcloud. Standardized paths isolate each service cleanly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f8faf9', border: '1px solid #dfe7e4', borderRadius: '8px', padding: '14px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-folder2 text-success" />
              <strong style={{ fontSize: '0.85rem' }}>/srv/projects/naiimbsili/app</strong>
            </div>
            <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Root directory of the portfolio Git repository. Contains Dockerfile, src/, package.json, and deployment files.
            </p>
          </div>

          <div style={{ background: '#f8faf9', border: '1px solid #dfe7e4', borderRadius: '8px', padding: '14px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-folder2 text-success" />
              <strong style={{ fontSize: '0.85rem' }}>/srv/proxy/caddy</strong>
            </div>
            <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Houses the master <code>Caddyfile</code> and TLS certificate data for reverse-proxying all domains.
            </p>
          </div>

          <div style={{ background: '#f8faf9', border: '1px solid #dfe7e4', borderRadius: '8px', padding: '14px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-hdd-network text-success" />
              <strong style={{ fontSize: '0.85rem' }}>Docker Network: proxy</strong>
            </div>
            <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Bridge network connecting Caddy with backend containers. Individual apps do NOT bind to host ports.
            </p>
          </div>
        </div>
      </div>

      <InfoBox type="info">
        <strong>SSH Access Hygiene:</strong> Connect using your ed25519/RSA SSH key. Never edit code directly inside running containers; always pull commits to <code>/srv/projects/naiimbsili/app</code> and rebuild.
      </InfoBox>

      {/* Navigation Command */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-box-arrow-in-right text-success me-2" />
          Navigating to Project Root
        </h5>
        <CommandBlock
          command="cd /srv/projects/naiimbsili/app && pwd && git status -s"
          risk="safe"
          arabicExplanation="يدخل لدليل المشروع على السيرفر ويتحقق من مسار العمل وحالة الملفات الحالية."
          expectedOutput="/srv/projects/naiimbsili/app (clean working tree)"
        />
      </div>

      {/* Resource Monitoring Section */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-activity text-success me-2" />
          Health & Resource Inspection Commands
        </h5>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">1. Memory Usage (RAM & Swap)</h6>
          <CommandBlock
            command="free -h"
            risk="safe"
            arabicExplanation="يوريك شحال مستهلك مالرام (RAM) و الـ Swap. إذا الـ available طاح برشا لازم نثبتو في الكونتينرات."
            expectedOutput="Mem: total, used, free, shared, buff/cache, available"
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">2. Disk Space Availability</h6>
          <CommandBlock
            command="df -h / /var/lib/docker"
            risk="safe"
            arabicExplanation="يوريك قداش فما فضاء فارغ في الديسك. Docker يخزن الصور في /var/lib/docker ولازم ديما يبقى فيه 15% على الأقل فارغ."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">3. Real-Time Container CPU & Memory Load</h6>
          <CommandBlock
            command="docker stats --no-stream"
            risk="safe"
            arabicExplanation="يعطيك لقطة فورية (snapshot) لاستهلاك كل كونتينر للبروسيسور والرام."
            expectedOutput="CONTAINER ID   NAME                   CPU %     MEM USAGE / LIMIT"
          />
        </div>

        <div>
          <h6 className="fw-bold small text-muted text-uppercase mb-2">4. System Load Average & Uptime</h6>
          <CommandBlock
            command="uptime"
            risk="safe"
            arabicExplanation="يوريك السيرفر قداش عندو يخدم بدون انقطاع ومتوسط الضغط (load average) على 1 و 5 و 15 دقيقة."
          />
        </div>
      </div>
    </div>
  );
}
