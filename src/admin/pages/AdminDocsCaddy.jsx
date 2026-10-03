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

export default function AdminDocsCaddy() {
  return (
    <div>
      <Helmet>
        <title>Caddy & HTTPS — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Caddy Reverse Proxy & HTTPS Automation
        </h2>
        <p className="text-muted small mb-0">
          Public HTTPS termination, zero-config TLS certificates, internal container routing, and 502 troubleshooting.
        </p>
      </div>

      {/* Architecture flow */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-shield-check text-success me-2" />
          How Caddy Protects and Routes Traffic
        </h5>
        <p className="small text-muted mb-3">
          Caddy is the only service that listens on public internet ports <strong>80</strong> and <strong>443</strong>.
        </p>

        <div style={{ background: '#f8faf9', border: '1px solid #dfe7e4', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#10242a', lineHeight: 1.6 }}>
          <div>Internet (HTTPS :443)</div>
          <div className="text-muted ps-3">│ (Automatic Let&apos;s Encrypt / ZeroSSL certificate management)</div>
          <div>▼</div>
          <div>Caddy Server (attached to Docker network: &quot;proxy&quot;)</div>
          <div className="text-muted ps-3">│ (Proxy pass by container DNS name: &quot;naiimbsili-portfolio:80&quot;)</div>
          <div>▼</div>
          <div>naiimbsili-portfolio:80 (Nginx static bundle)</div>
        </div>
      </div>

      <InfoBox type="info">
        <strong>Automatic HTTPS:</strong> Caddy obtains and renews TLS certificates automatically as long as the DNS A/AAAA records point to the VPS IP address and ports 80 and 443 are open.
      </InfoBox>

      {/* Caddyfile Inspection */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-file-earmark-code text-success me-2" />
          The Caddyfile Configuration
        </h5>
        <p className="small text-muted mb-3">
          Located at <code>/srv/proxy/caddy/Caddyfile</code>. Routing blocks are defined per domain:
        </p>

        <div style={{ background: '#10242a', color: '#e8f5f1', borderRadius: '8px', padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '16px' }}>
          <span style={{ color: '#5eead4' }}>naiimbsili.com</span> {'{'}
          <br />
          &nbsp;&nbsp;<span style={{ color: '#93c5fd' }}>reverse_proxy</span> naiimbsili-portfolio:80
          <br />
          {'}'}
        </div>

        <CommandBlock
          command="cat /srv/proxy/caddy/Caddyfile"
          risk="safe"
          arabicExplanation="يقرأ محتوى ملف التكوين Caddyfile باش تشوف العناوين والكونتينرات المربوطة بالسيرفر."
          expectedOutput="Listing of configured domain blocks and proxy targets"
        />
      </div>

      {/* Reload Command */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-arrow-repeat text-success me-2" />
          Validating & Reloading Caddy
        </h5>
        <p className="small text-muted mb-3">
          When adding new domains or editing Caddyfile, reload Caddy with zero downtime:
        </p>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Step 1: Validate Caddyfile Syntax</h6>
          <CommandBlock
            command="docker exec -w /etc/caddy caddy caddy validate"
            risk="safe"
            arabicExplanation="يتأكد أنو ملف Caddyfile مريڤل وما فيهش أخطاء قبل ما يطبّق التغييرات."
            expectedOutput="Valid configuration"
          />
        </div>

        <div>
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Step 2: Reload Active Configuration (Zero Downtime)</h6>
          <CommandBlock
            command="docker exec -w /etc/caddy caddy caddy reload"
            risk="caution"
            arabicExplanation="يعاود يشحن التغييرات الجديدة في Caddy بدون ما يقطع الاتصال على الزوار الحاليين."
            expectedOutput="200 OK or 'Reload complete'"
          />
        </div>
      </div>

      {/* Troubleshooting 502 Bad Gateway */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-exclamation-diamond text-danger me-2" />
          Troubleshooting 502 Bad Gateway
        </h5>
        <p className="small text-muted mb-3">
          A <strong>502 Bad Gateway</strong> returned by Caddy always means Caddy cannot communicate with the upstream container (<code>naiimbsili-portfolio:80</code>).
        </p>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">1. Check if the container is running</h6>
          <CommandBlock
            command="docker ps | grep naiimbsili-portfolio"
            risk="safe"
            arabicExplanation="نتأكدو اللي الكونتينر يخدم ماهوش طايح أو معمولّو Exited."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">2. Verify container is attached to network &ldquo;proxy&rdquo;</h6>
          <CommandBlock
            command="docker network inspect proxy --format '{{json .Containers}}' | grep naiimbsili-portfolio"
            risk="safe"
            arabicExplanation="نتأكدو أنو الكونتينر موجود داخل نفس شبكة الدوكر (proxy) مع Caddy."
            expectedOutput="JSON block containing container IP inside proxy network"
          />
        </div>

        <div>
          <h6 className="fw-bold small text-muted text-uppercase mb-2">3. Hotfix: Connect running container to proxy network immediately</h6>
          <CommandBlock
            command="docker network connect proxy naiimbsili-portfolio"
            risk="caution"
            arabicExplanation="إذا الكونتينر تشغّل بالغلط بدون شبكة proxy، الكوموند هذا يربطو فورياً وتخدم الصفحة طول بلا إعادة بناء."
            verificationCommand="curl -I https://naiimbsili.com"
          />
        </div>
      </div>
    </div>
  );
}
