import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CommandBlock from '../components/infra/CommandBlock';

const ISSUES = [
  {
    id: 1,
    category: 'Supabase',
    title: '1. Supabase unconfigured on production',
    symptoms: 'Admin shows "Supabase unconfigured. Add credentials to .env to enable live CMS editing."',
    cause: 'Docker build was executed without --build-arg VITE_SUPABASE_URL or variables were not declared in Dockerfile before npm run build.',
    diagnosis: 'Inspect client JS bundle: docker exec naiimbsili-portfolio grep -o "supabase" /usr/share/nginx/html/assets/*.js',
    fixCommand: `docker build \\
  --build-arg VITE_SUPABASE_URL='https://your-project.supabase.co' \\
  --build-arg VITE_SUPABASE_ANON_KEY='your-anon-key' \\
  -t naiimbsili-portfolio:latest .`,
    risk: 'safe',
    arabic: 'الـ build صار من غير ما تمررلو الـ build-arg متع Supabase. عاود ابنيه بالكوموند هذا ومرر المفاتيح.'
  },
  {
    id: 2,
    category: 'Docker',
    title: '2. Docker build cache using old code',
    symptoms: 'Git pull shows new commits, but after docker build the old site still displays.',
    cause: 'Docker cached intermediate layer steps because package.json or COPY layers matched cache hashes.',
    diagnosis: 'Check docker build logs for "CACHED" lines on step COPY . .',
    fixCommand: `docker build --no-cache \\
  --build-arg VITE_SUPABASE_URL='https://your-project.supabase.co' \\
  --build-arg VITE_SUPABASE_ANON_KEY='your-anon-key' \\
  -t naiimbsili-portfolio:latest .`,
    risk: 'caution',
    arabic: 'الدوكر استعمل الكاش القديم وما شافش التغييرات الجديدة. استعمل --no-cache باش يعاود يبني كل شي ماللول.'
  },
  {
    id: 3,
    category: 'Git',
    title: '3. Git pull conflict or local changes on VPS',
    symptoms: 'error: Your local changes to the following files would be overwritten by merge',
    cause: 'Files were modified or generated directly on the VPS instead of being pulled cleanly.',
    diagnosis: 'git status -s',
    fixCommand: `git stash && git pull --ff-only origin migration/react-phase-1`,
    risk: 'caution',
    arabic: 'فما ملفات تبدلو مباشرة ع السيرفر. نخبّيوهم بـ git stash ونجبدو التحديثات النظيفة بـ --ff-only.'
  },
  {
    id: 4,
    category: 'Docker',
    title: '4. Container not running after deployment (Exited)',
    symptoms: 'docker ps does not show naiimbsili-portfolio; visitors get 502.',
    cause: 'Container crashed immediately upon startup (e.g. Nginx configuration syntax error).',
    diagnosis: 'docker ps -a --filter "name=naiimbsili-portfolio"',
    fixCommand: `docker logs naiimbsili-portfolio`,
    risk: 'safe',
    arabic: 'الكونتينر طاح أول ما بدا. استعمل docker logs باش تشوف السطر اللي تسبب في الـ crash بالضبط.'
  },
  {
    id: 5,
    category: 'Caddy',
    title: '5. Caddy 502 — Container not on proxy network',
    symptoms: '502 Bad Gateway returned by Caddy, but docker ps shows container is running.',
    cause: 'Container was started without --network proxy, so Caddy cannot resolve its hostname.',
    diagnosis: 'docker inspect naiimbsili-portfolio --format "{{.NetworkSettings.Networks}}"',
    fixCommand: `docker network connect proxy naiimbsili-portfolio`,
    risk: 'caution',
    arabic: 'الكونتينر يخدم أما ماهوش في شبكة proxy. الكوموند هذا يربطو بالشبكة في ثانية وترجع الخدمة.'
  },
  {
    id: 6,
    category: 'Docker',
    title: '6. Wrong Docker network name',
    symptoms: 'Error response from daemon: network not found.',
    cause: 'External bridge network was named differently or deleted.',
    diagnosis: 'docker network ls',
    fixCommand: `docker network create proxy`,
    risk: 'caution',
    arabic: 'شبكة proxy موش موجودة أصلاً على الدوكر. نكريوها بالكوموند هذا.'
  },
  {
    id: 7,
    category: 'Caddy',
    title: '7. 502 Bad Gateway — Port 80 not responding inside container',
    symptoms: 'Caddy error log shows "dial tcp: lookup naiimbsili-portfolio on 127.0.0.11:53: no such host" or connection refused.',
    cause: 'Nginx failed to bind to port 80 inside the container.',
    diagnosis: 'docker exec naiimbsili-portfolio nginx -t',
    fixCommand: `docker restart naiimbsili-portfolio`,
    risk: 'caution',
    arabic: 'Nginx داخل الكونتينر موش قاعد يجاوب على البورت 80. نثبتو في صحة ملف التكوين ونعملولو restart.'
  },
  {
    id: 8,
    category: 'Caddy',
    title: '8. HTTPS certificate error or SSL handshake failure',
    symptoms: 'Browser shows NET::ERR_CERT_COMMON_NAME_INVALID or SSL_ERROR_SYSCALL.',
    cause: 'DNS record does not point to VPS IP, or ports 80/443 are blocked by firewall.',
    diagnosis: 'curl -Iv https://naiimbsili.com',
    fixCommand: `docker logs --tail 100 caddy | grep -i "certificate"`,
    risk: 'safe',
    arabic: 'Caddy معرفش يجدد الشهادة خاطر الـ DNS متبدل وإلا الـ Firewall مسكر. تفقد logs متع Caddy.'
  },
  {
    id: 9,
    category: 'Supabase',
    title: '9. Wrong environment variable naming',
    symptoms: 'Variables declared as SUPABASE_URL instead of VITE_SUPABASE_URL.',
    cause: 'Vite ignores variables that do not start with VITE_ by security design.',
    diagnosis: 'grep -E "(SUPABASE|VITE)" Dockerfile .env.example',
    fixCommand: `# Use strictly: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY`,
    risk: 'safe',
    arabic: 'أي متغير في Vite لازم يبدا بـ VITE_ وإلا يتجاهلو السيستيم تماماً لأسباب أمنية.'
  },
  {
    id: 10,
    category: 'Docker',
    title: '10. Name conflict: container name already in use',
    symptoms: 'docker: Error response from daemon: Conflict. The container name "/naiimbsili-portfolio" is already in use.',
    cause: 'The previous container was not removed before running the new one.',
    diagnosis: 'docker ps -a --filter "name=naiimbsili-portfolio"',
    fixCommand: `docker rm -f naiimbsili-portfolio`,
    risk: 'destructive',
    arabic: 'فما كونتينر قديم يحمل نفس الاسم. نفسخوه بالقوة بـ rm -f باش نجمو نحطو الجديد.'
  },
  {
    id: 11,
    category: 'Git',
    title: '11. Pulling from wrong Git remote',
    symptoms: 'git pull says "Already up to date" but new commits are clearly on GitLab.',
    cause: 'VPS tracked a different remote or branch.',
    diagnosis: 'git remote -v && git branch -vv',
    fixCommand: `git pull --ff-only origin migration/react-phase-1`,
    risk: 'safe',
    arabic: 'السيرفر يجبد من remote غالط. origin لازم يكون GitLab ومش GitHub.'
  },
  {
    id: 12,
    category: 'Git',
    title: '12. Detached HEAD or wrong branch on VPS',
    symptoms: 'You are in detached HEAD state.',
    cause: 'A specific commit hash was checked out directly.',
    diagnosis: 'git status',
    fixCommand: `git checkout migration/react-phase-1`,
    risk: 'safe',
    arabic: 'السيرفر واقف على commit معين موش على فرع. نرجعوه للفرع الصحيح بـ checkout.'
  },
  {
    id: 13,
    category: 'Git',
    title: '13. Production commit differs from Git HEAD',
    symptoms: 'Site shows changes from 3 commits ago.',
    cause: 'Docker build was run before git pull, so it built the prior checkout.',
    diagnosis: 'git log -1 --oneline',
    fixCommand: `git pull --ff-only origin migration/react-phase-1 && docker build -t naiimbsili-portfolio:latest .`,
    risk: 'caution',
    arabic: 'تبنى الدوكر قبل ما يتعمل pull للـ Git. أعمل pull ومن بعد عاود الـ build.'
  },
  {
    id: 14,
    category: 'Docker',
    title: '14. VPS Disk space full (No space left on device)',
    symptoms: 'docker build fails with: write /var/lib/docker/... no space left on device.',
    cause: 'Accumulated unused layers and old container logs filled disk.',
    diagnosis: 'df -h /',
    fixCommand: `docker system prune -af --volumes`,
    risk: 'destructive',
    arabic: 'الديسك تعبّى بالصور القديمة متع دوكر. الكوموند هذا ينظف كل الصور غير المستخدمة ويفرّغ مساحة كبيرة.'
  },
  {
    id: 15,
    category: 'Admin',
    title: '15. infra_projects sync status shows UNKNOWN',
    symptoms: 'Registry displays status UNKNOWN for project commit.',
    cause: 'Local SHA has not been synced against remote git repository yet.',
    diagnosis: 'Verify repository_url in public.infra_projects',
    fixCommand: `git rev-parse --short HEAD`,
    risk: 'safe',
    arabic: 'الحالة موش معروفة خاطر مازال ما تعملش مقارنة مع GitLab. نتحققو من الـ hash الحالي بـ rev-parse.'
  },
];

export default function AdminDocsTroubleshooting() {
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Docker', 'Git', 'Caddy', 'Supabase', 'Admin'];

  const filtered = filter === 'All' ? ISSUES : ISSUES.filter((i) => i.category === filter);

  return (
    <div>
      <Helmet>
        <title>Troubleshooting Guide — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Production Troubleshooting Guide
        </h2>
        <p className="text-muted small mb-0">
          The 15 documented infrastructure and deployment problems with symptoms, root causes, and verified fixes.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`admin-btn ${filter === cat ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setFilter(cat)}
          >
            {cat} {cat === 'All' ? `(${ISSUES.length})` : `(${ISSUES.filter(i => i.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Issues Accordion / List */}
      <div className="d-flex flex-column gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="admin-card mb-0">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
              <h5 className="fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.96rem' }}>
                {item.title}
              </h5>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: '#e8f5f1',
                  color: '#087f66',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}
              >
                {item.category}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-muted small fw-bold">Symptom: </span>
              <span className="small text-danger" style={{ fontFamily: 'monospace' }}>{item.symptoms}</span>
            </div>

            <div className="mb-3">
              <span className="text-muted small fw-bold">Cause: </span>
              <span className="small text-muted">{item.cause}</span>
            </div>

            {item.diagnosis && (
              <div className="mb-3 p-2 rounded" style={{ background: '#f8faf9', border: '1px solid #dfe7e4' }}>
                <span className="text-muted small fw-bold d-block mb-1">
                  <i className="bi bi-search me-1 text-primary" />Diagnosis Command:
                </span>
                <code style={{ fontSize: '0.8rem', color: '#10242a' }}>{item.diagnosis}</code>
              </div>
            )}

            <div>
              <span className="text-muted small fw-bold d-block mb-1">
                <i className="bi bi-wrench me-1 text-success" />Resolution:
              </span>
              <CommandBlock
                command={item.fixCommand}
                risk={item.risk}
                arabicExplanation={item.arabic}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
