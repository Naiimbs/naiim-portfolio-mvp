import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CommandBlock from '../components/infra/CommandBlock';

function InfoBox({ children, type = 'info' }) {
  const styles = {
    info: { bg: '#f0fdf7', border: '#b8e0d4', icon: 'bi-info-circle-fill', color: '#087f66' },
    warning: { bg: '#fef9e7', border: '#f5d97a', icon: 'bi-exclamation-triangle-fill', color: '#9a6c00' },
    danger: { bg: '#fef2f2', border: '#fecaca', icon: 'bi-shield-exclamation', color: '#dc2626' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <i className={`bi ${s.icon}`} style={{ color: s.color, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ fontSize: '0.84rem', color: '#10242a', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export default function AdminDocsRollback() {
  return (
    <div>
      <Helmet>
        <title>Rollback Procedure — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Production Rollback Procedure
        </h2>
        <p className="text-muted small mb-0">
          The 12-step safe rollback sequence: verify before switching, zero blind deletions, and seamless recovery.
        </p>
      </div>

      <InfoBox type="danger">
        <strong>Golden Rule of Rollback:</strong> Never delete the current container or images in panic. First verify the previous image locally. Only swap containers when the replacement is verified.
      </InfoBox>

      {/* Step 1 */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          Step 1: Identify the Previous Working Docker Image or Commit
        </h5>
        <p className="small text-muted mb-3">
          Check existing local Docker images and recent Git history to identify the last known good state.
        </p>

        <CommandBlock
          command="docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}' | grep naiimbsili"
          risk="safe"
          arabicExplanation="يوريك كل صور الدوكر الخاصة بالمشروع مع تواريخ بنائها باش تختار الصورة السابقة اللي كانت تخدم."
          expectedOutput="Listing of naiimbsili-portfolio images with tags and timestamps"
        />
      </div>

      {/* Step 2 & 3 */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          Step 2 &amp; 3: Spin Up Test Container on Isolated Port
        </h5>
        <p className="small text-muted mb-3">
          Run the candidate image on host port 8081 without touching the production container or Caddy.
        </p>

        <CommandBlock
          command="docker run -d --name rollback-test -p 8081:80 <PREVIOUS_IMAGE_ID_OR_TAG>"
          risk="safe"
          arabicExplanation="نشغلو النسخة القديمة في كونتينر تجريبي مؤقت على البورت 8081 بدون ما نلمسو الموقع الحي."
          verificationCommand="curl -I http://localhost:8081"
          expectedOutput="HTTP/1.1 200 OK"
        />
      </div>

      {/* Step 4 & 5 */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          Step 4 &amp; 5: Stop Broken Container &amp; Clean Test Container
        </h5>
        <p className="small text-muted mb-3">
          Once the rollback image is verified 200 OK, remove the test container and stop the broken production container.
        </p>

        <CommandBlock
          command="docker rm -f rollback-test && docker stop naiimbsili-portfolio && docker rm naiimbsili-portfolio"
          risk="caution"
          arabicExplanation="نحيو الكونتينر التجريبي بعد ما تأكدنا منو، ونوقفو الكونتينر المضروب ونفرغو اسم naiimbsili-portfolio."
          warningText="Site will experience 1-2 seconds of downtime until the replacement is started in the next step."
        />
      </div>

      {/* Step 6 */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          Step 6: Launch Rollback Image as Production
        </h5>
        <p className="small text-muted mb-3">
          Start the verified image with the production container name and network attachment.
        </p>

        <CommandBlock
          command="docker run -d \
  --name naiimbsili-portfolio \
  --network proxy \
  --restart unless-stopped \
  <PREVIOUS_IMAGE_ID_OR_TAG>"
          risk="caution"
          arabicExplanation="نشغلو النسخة السليمة باسم الإنتاج الرسمي ونربطوها بشبكة proxy باش Caddy يعاود يوجّه الزوار ليها فوراً."
          expectedOutput="64-character container ID"
        />
      </div>

      {/* Step 7, 8, 9, 10 */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          Step 7 to 10: Production &amp; CMS Verification
        </h5>
        <p className="small text-muted mb-3">
          Perform end-to-end checks to ensure public traffic, TLS, and Admin CMS operate normally.
        </p>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Check Public HTTPS &amp; Headers</h6>
          <CommandBlock
            command="curl -Iv https://naiimbsili.com"
            risk="safe"
            arabicExplanation="يتأكد أنو شهادة SSL تخدم والموقع يرجع HTTP 200 OK."
            expectedOutput="HTTP/2 200"
          />
        </div>

        <div>
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Check Caddy Routing Logs</h6>
          <CommandBlock
            command="docker logs --tail 20 caddy"
            risk="safe"
            arabicExplanation="نتأكدو من logs متع Caddy أنو ما عادش فما 502."
          />
        </div>
      </div>

      {/* Step 11 & 12 */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          Step 11 &amp; 12: Clean Up Failed Image &amp; Post-Mortem
        </h5>
        <p className="small text-muted mb-3">
          Only after production is stable: tag or remove the faulty image, check git commit differences, and log the incident.
        </p>

        <CommandBlock
          command="git log -2 --stat"
          risk="safe"
          arabicExplanation="يوريك آخر الـ commits والتغييرات اللي صارت في الملفات باش تفهم سبب العطب في الكود وتصلحو محلياً."
        />
      </div>
    </div>
  );
}
