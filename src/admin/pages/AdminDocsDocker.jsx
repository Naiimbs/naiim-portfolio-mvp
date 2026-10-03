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

export default function AdminDocsDocker() {
  return (
    <div>
      <Helmet>
        <title>Docker Guide — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Docker Architecture & Commands
        </h2>
        <p className="text-muted small mb-0">
          How Docker packages and runs the portfolio, multi-stage builds, build-time arguments, and container management.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="admin-card h-100 mb-0">
            <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
              <i className="bi bi-layers text-success me-2" />
              Multi-Stage Build Architecture
            </h5>
            <p className="small text-muted mb-2">
              The portfolio uses a 2-stage Docker build to keep the production image tiny and secure:
            </p>
            <ol className="small text-muted ps-3 mb-0" style={{ lineHeight: 1.6 }}>
              <li><strong>Stage 1 (Builder):</strong> Uses <code>node:20-alpine</code>. Injects Vite build arguments, installs dependencies, and compiles the React app into static files via <code>npm run build</code>.</li>
              <li><strong>Stage 2 (Runtime):</strong> Uses <code>nginx:alpine</code>. Copies only the static <code>dist/</code> folder into Nginx web root. No Node.js runtime, no npm, and no source code exist in production!</li>
            </ol>
          </div>
        </div>
        <div className="col-md-6">
          <div className="admin-card h-100 mb-0">
            <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
              <i className="bi bi-hdd-network text-success me-2" />
              The &ldquo;proxy&rdquo; Network
            </h5>
            <p className="small text-muted mb-2">
              All public web services on the VPS connect to a shared Docker bridge network named <code>proxy</code>.
            </p>
            <ul className="small text-muted ps-3 mb-0" style={{ lineHeight: 1.6 }}>
              <li>Caddy runs on this network and routes requests by container name (e.g. <code>http://naiimbsili-portfolio:80</code>).</li>
              <li>No ports need to be published to the host (no <code>-p 80:80</code>). Containers talk internally inside Docker.</li>
              <li>If the portfolio is not connected to <code>proxy</code>, Caddy returns <strong>502 Bad Gateway</strong>.</li>
            </ul>
          </div>
        </div>
      </div>

      <InfoBox type="warning">
        <strong>Vite Build-Time Arguments:</strong> React is an SPA compiled in the browser. <code>VITE_*</code> environment variables are baked into static JavaScript during <code>npm run build</code>. Changing a <code>.env</code> file on the VPS has zero effect unless you re-run <code>docker build</code> with <code>--build-arg</code>.
      </InfoBox>

      {/* Build Command */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-hammer text-success me-2" />
          Building the Production Image
        </h5>
        <p className="small text-muted mb-3">
          Always provide the Supabase public URL and publishable anon key as build arguments.
        </p>

        <CommandBlock
          command="docker build \
  --build-arg VITE_SUPABASE_URL='https://your-project.supabase.co' \
  --build-arg VITE_SUPABASE_ANON_KEY='your-anon-key' \
  -t naiimbsili-portfolio:latest ."
          risk="safe"
          arabicExplanation="هذا الكوموند يبني الـ Image متع الدوكر. نعطيوه الـ URL و الـ Key متع Supabase باش Vite يدمجهم في كود الجافاسكربت وقت الـ build."
          prerequisites={['Be inside /srv/projects/naiimbsili/app with latest git pull.']}
          expectedOutput="Successfully built ... Successfully tagged naiimbsili-portfolio:latest"
          verificationCommand="docker images | grep naiimbsili-portfolio"
        />
      </div>

      {/* Run Command */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-play-circle text-success me-2" />
          Running the Production Container
        </h5>
        <p className="small text-muted mb-3">
          Starts the container attached to the <code>proxy</code> network with automatic restart policy.
        </p>

        <CommandBlock
          command="docker run -d \
  --name naiimbsili-portfolio \
  --network proxy \
  --restart unless-stopped \
  naiimbsili-portfolio:latest"
          risk="caution"
          arabicExplanation="يشغل الكونتينر في الخلفية (-d) ويربطو بشبكة proxy باش Caddy ينجم يوصلو ويبعثلو الزوار. الـ restart unless-stopped تخليه يعاود يخدم أوتوماتيكيا إذا السيرفر طاح وعاود قام."
          prerequisites={['Make sure previous container is stopped and removed, or use a test container name.']}
          warningText="If a container named naiimbsili-portfolio is already running, this command will error with 'Conflict: container name already in use'."
          expectedOutput="A 64-character container ID (e.g. 9d4f2e8b...)"
          verificationCommand="docker ps --filter 'name=naiimbsili-portfolio'"
        />
      </div>

      {/* Routine Management Commands */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-terminal text-success me-2" />
          Routine Container Operations
        </h5>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Check Running Containers & Network</h6>
          <CommandBlock
            command="docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Networks}}'"
            risk="safe"
            arabicExplanation="يوريك كل الكونتينرات اللي قاعدين يخدمو توة، الحالة متاعهم، والريزو اللي مربوطين بيه."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Inspect Container Logs</h6>
          <CommandBlock
            command="docker logs --tail 100 -f naiimbsili-portfolio"
            risk="safe"
            arabicExplanation="يوريك آخر 100 سطر من الـ logs متع Nginx داخل الكونتينر مع المتابعة الحية."
          />
        </div>

        <div className="mb-4">
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Stop and Remove Container (Replacement Cycle)</h6>
          <CommandBlock
            command="docker stop naiimbsili-portfolio && docker rm naiimbsili-portfolio"
            risk="caution"
            arabicExplanation="يوقّف الكونتينر القديم ويفسخو باش يفرغ البلاصة للكونتينر الجديد المبني."
            warningText="This immediately stops public traffic to the site until the new container is started (downtime < 2 seconds)."
          />
        </div>

        <div>
          <h6 className="fw-bold small text-muted text-uppercase mb-2">Prune Unused Images (Clean Disk Space)</h6>
          <CommandBlock
            command="docker image prune -f"
            risk="caution"
            arabicExplanation="يفسخ الـ images اللي معندهمش اسم (dangling images) بعد كل build جديد باش ميعبيوش الديسك."
            expectedOutput="Total reclaimed space: ..."
          />
        </div>
      </div>
    </div>
  );
}
