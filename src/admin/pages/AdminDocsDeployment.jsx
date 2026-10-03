import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CommandBlock from '../components/infra/CommandBlock';

function SectionHeader({ step, title, description }) {
  return (
    <div className="d-flex align-items-start gap-3 mb-3">
      <div
        style={{
          width: '32px',
          height: '32px',
          background: '#087f66',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#fff',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '0.85rem',
        }}
      >
        {step}
      </div>
      <div>
        <h5 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: '4px' }}>{title}</h5>
        {description && <p className="text-muted small mb-0">{description}</p>}
      </div>
    </div>
  );
}

export default function AdminDocsDeployment() {
  return (
    <div>
      <Helmet>
        <title>Deployment Guide — Admin CMS</title>
      </Helmet>

      {/* Page header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Deployment Guide
        </h2>
        <p className="text-muted small mb-0">
          The complete, real workflow for deploying the Naiim portfolio to production.
          Follow every step in order.
        </p>
      </div>

      {/* Flow summary */}
      <div className="admin-alert mb-4" style={{ background: '#f0fdf7', border: '1px solid #b8e0d4', borderRadius: '10px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.82rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#10242a' }}>
          <span>LOCAL</span><i className="bi bi-arrow-right text-muted" />
          <span>git push</span><i className="bi bi-arrow-right text-muted" />
          <span>VPS pull</span><i className="bi bi-arrow-right text-muted" />
          <span>docker build</span><i className="bi bi-arrow-right text-muted" />
          <span>test</span><i className="bi bi-arrow-right text-muted" />
          <span>replace container</span><i className="bi bi-arrow-right text-muted" />
          <span>verify HTTPS</span><i className="bi bi-arrow-right text-muted" />
          <span className="text-success">✓ done</span>
        </div>
      </div>

      {/* Step 1 — Local preparation */}
      <div className="admin-card mb-3">
        <SectionHeader step="1" title="Local preparation" description="Verify your local state before touching production." />
        <CommandBlock
          command="git status"
          purpose="Check for uncommitted local changes before starting"
          risk="safe"
          expectedOutput="On branch migration/react-phase-1\nnothing to commit, working tree clean"
          arabicExplanation="هاذا يوريك كيفاش حالة الـrepository محلي. لازم يكون clean قبل ما تبدا تعمل deployment."
        />
        <CommandBlock
          command="npm run build"
          purpose="Confirm the build passes locally before pushing"
          risk="safe"
          expectedOutput="✓ built in 8.24s"
          notes="Fix any build errors locally. Never push code that breaks the build."
          arabicExplanation="عمل build محلي قبل ما تدفع الكود. إذا فشل هنا، ما تدفعوش."
        />
      </div>

      {/* Step 2 — Git commit and push */}
      <div className="admin-card mb-3">
        <SectionHeader step="2" title="Git commit and push to GitLab" description="Commit your changes and push to the production source (origin = GitLab)." />

        <div className="admin-alert admin-alert-warning mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          <div>
            <strong>Important:</strong> The <code>origin</code> remote points to <strong>GitLab</strong>, which is the production source.
            Pushing to <code>origin</code> is what the VPS will later pull from.
          </div>
        </div>

        <CommandBlock
          command="git add -A && git commit -m 'feat: describe your change clearly'"
          purpose="Stage all changes and create a commit"
          risk="safe"
          notes="Use a clear commit message that describes what changed. This message will be visible in git log on the VPS."
          arabicExplanation="هاذا يحفظ التغييرات متاعك في الـrepository. اكتب رسالة واضحة باش تعرف بعدين شنوة عملت."
        />
        <CommandBlock
          command="git push origin migration/react-phase-1"
          purpose="Push the branch to GitLab (production source)"
          risk="caution"
          expectedOutput="To https://gitlab.com/Naiimbs/mywebsite.git\n   abc1234..def5678  migration/react-phase-1 -> migration/react-phase-1"
          verificationCommand="git log --oneline -3"
          notes="Replace 'migration/react-phase-1' with your current branch name if it has changed."
          prerequisites={['All tests pass locally', 'npm run build succeeds', 'No uncommitted sensitive files']}
          arabicExplanation="هاذا يدفع الكود متاعك لـGitLab. الـVPS بعدين يجيب منو. تأكد اللي الـbranch صحيح."
        />
      </div>

      {/* Step 3 — SSH into VPS */}
      <div className="admin-card mb-3">
        <SectionHeader step="3" title="Connect to VPS" description="SSH into the OVH VPS where the application runs." />
        <CommandBlock
          command="ssh <your-user>@<vps-ip>"
          purpose="Open an SSH session to the VPS"
          risk="safe"
          notes="Replace <your-user> and <vps-ip> with your actual VPS credentials. Use SSH key authentication — never password authentication."
          arabicExplanation="هاذا يدخلك للـVPS. استعمل دائمًا SSH key — ما تستعملش password."
        />
        <CommandBlock
          command="cd /srv/projects/naiimbsili/app"
          purpose="Navigate to the portfolio project directory"
          risk="safe"
          expectedOutput="(no output — you are now in the project directory)"
          verificationCommand="pwd"
          arabicExplanation="هاذا يروحك للمجلد متاع المشروع على الـVPS."
        />
      </div>

      {/* Step 4 — Git pull */}
      <div className="admin-card mb-3">
        <SectionHeader step="4" title="Pull latest code on VPS" description="Update the VPS working tree from GitLab. --ff-only prevents accidental merge commits." />
        <CommandBlock
          command="git status"
          purpose="Verify the VPS repository state before pulling"
          risk="safe"
          expectedOutput="On branch migration/react-phase-1\nnothing to commit, working tree clean"
          arabicExplanation="لازم تشوف الحالة قبل ما تعمل pull. إذا عندك تغييرات غير محفوظة، الـpull قد يفشل."
        />
        <CommandBlock
          command="git pull --ff-only"
          purpose="Pull the latest commit from GitLab without creating a merge commit"
          risk="caution"
          expectedOutput="Updating abc1234..def5678\nFast-forward\n src/admin/pages/AdminDocs.jsx | 120 +++\n..."
          verificationCommand="git log --oneline -3"
          notes="If --ff-only fails, there is a conflict. Do NOT force pull. Inspect the divergence first."
          prerequisites={['git status shows clean working tree', 'You are on the correct branch']}
          arabicExplanation="هاذا يجيب آخر كود من GitLab. استعملو --ff-only باش ما يعملش merge تلقائي. كان فشل، اشوف شنوة عندك من تعارض قبل ما تعمل حاجة."
        />
      </div>

      {/* Step 5 — Docker build */}
      <div className="admin-card mb-3">
        <SectionHeader step="5" title="Build Docker image" description="Build a new Docker image from the updated code. Vite variables are injected at build time." />

        <div className="admin-alert mb-3" style={{ background: '#fef9e7', border: '1px solid #f5d97a', borderRadius: '8px', padding: '12px 16px' }}>
          <i className="bi bi-info-circle-fill" style={{ color: '#9a6c00' }} />
          <div style={{ fontSize: '0.82rem' }}>
            <strong>Why build args?</strong> Vite embeds <code>VITE_*</code> variables into the JavaScript bundle at compile time.
            They must be passed as Docker <code>--build-arg</code> values — they cannot be injected at container runtime.
          </div>
        </div>

        <CommandBlock
          command={`docker build \\\n  --build-arg VITE_SUPABASE_URL=<your-supabase-url> \\\n  --build-arg VITE_SUPABASE_ANON_KEY=<your-anon-key> \\\n  -t naiimbsili-portfolio:<new-tag> \\\n  .`}
          purpose="Build a new tagged Docker image with Supabase configuration baked in"
          risk="caution"
          expectedOutput="[+] Building 45.2s (14/14) FINISHED\n => exporting to image\n => naming to docker.io/library/naiimbsili-portfolio:<new-tag>"
          verificationCommand="docker images | grep naiimbsili-portfolio"
          notes="Use a meaningful tag like the git commit SHA (e.g. 6bd4c60) so you can identify which code version the image contains."
          prerequisites={[
            'cd /srv/projects/naiimbsili/app',
            'git pull --ff-only completed successfully',
            'Supabase URL and anon key available (not committed — stored securely)',
          ]}
          arabicExplanation="هاذا يعمل image جديدة من الكود اللي جبتو. الـVITE_* variables تتحط هنا في الـbuild — مو وقت تشغيل الـcontainer. إذا ما حطيتهاش هنا، الـSupabase ما يخدمش."
        />
      </div>

      {/* Step 6 — Test container */}
      <div className="admin-card mb-3">
        <SectionHeader step="6" title="Verify with a test container" description="Start the new image under a temporary name to verify it works before touching production." />
        <CommandBlock
          command="docker run -d --name naiimbsili-test -p 8099:80 naiimbsili-portfolio:<new-tag>"
          purpose="Start the new image as a temporary test container on a different internal port"
          risk="safe"
          verificationCommand="docker ps | grep naiimbsili-test"
          notes="Do NOT use --network proxy for the test container. It should NOT appear on the public proxy network yet."
          arabicExplanation="هاذا يشغل الـimage الجديدة باش نتأكد أنها تخدم، بلا ما نلمسو الـproduction. استعمل اسم مختلف."
        />
        <CommandBlock
          command="curl -s -o /dev/null -w '%{http_code}' http://localhost:8099"
          purpose="Check that the test container responds with HTTP 200"
          risk="safe"
          expectedOutput="200"
          notes="Any 5xx response means the container has a startup error. Check docker logs naiimbsili-test."
          arabicExplanation="هاذا يتحقق أن الـcontainer الجديد يرد. إذا طلعلك 200، واخا. إذا طلعلك 5xx، شوف الـlogs."
        />
        <CommandBlock
          command="docker stop naiimbsili-test && docker rm naiimbsili-test"
          purpose="Remove the test container after verification"
          risk="safe"
          notes="The test container is temporary. Remove it once you have confirmed the new image works."
          arabicExplanation="بعد ما تأكدت، امسح الـcontainer المؤقت."
        />
      </div>

      {/* Step 7 — Replace production container */}
      <div className="admin-card mb-3">
        <SectionHeader step="7" title="Replace production container" description="Stop the current container, remove it, and start the new image as the production container." />

        <div className="admin-alert admin-alert-warning mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          <div>
            <strong>Careful sequence:</strong> Stop → Remove → Run. Do not skip steps. Do not remove the old container
            before starting the new one successfully.
          </div>
        </div>

        <CommandBlock
          command="docker stop naiimbsili-portfolio"
          purpose="Gracefully stop the currently running production container"
          risk="caution"
          expectedOutput="naiimbsili-portfolio"
          warningText="This takes the site offline. The new container must be ready to start immediately after."
          arabicExplanation="هاذا يوقف الـcontainer اللي يخدم production. الموقع راح يقع مؤقتًا. عندك باش تكمل سريع."
        />
        <CommandBlock
          command="docker rm naiimbsili-portfolio"
          purpose="Remove the stopped production container (the image is preserved)"
          risk="destructive"
          warningText="This permanently removes the container. The Docker image is not affected and can still be used for rollback."
          expectedOutput="naiimbsili-portfolio"
          arabicExplanation="هاذا يمسح الـcontainer — مو الـimage. الـimage تبقى موجودة وتقدر ترجع ليها كان محتجت."
        />
        <CommandBlock
          command={`docker run -d \\\n  --name naiimbsili-portfolio \\\n  --network proxy \\\n  --restart unless-stopped \\\n  naiimbsili-portfolio:<new-tag>`}
          purpose="Start the new image as the production container on the proxy network"
          risk="caution"
          expectedOutput="<container-id>"
          verificationCommand="docker ps | grep naiimbsili-portfolio"
          prerequisites={[
            'Test container verified in Step 6',
            'Old container stopped and removed',
          ]}
          notes="--network proxy is required for Caddy to route traffic to this container. Without it, Caddy returns 502."
          arabicExplanation="هاذا يشغل الـcontainer الجديد. --network proxy مهم جداً — بلاه، الـCaddy ما يلقاش الـcontainer."
        />
      </div>

      {/* Step 8 — Verify */}
      <div className="admin-card mb-3">
        <SectionHeader step="8" title="Verify Caddy and HTTPS" description="Confirm the production container is reachable through Caddy." />
        <CommandBlock
          command="docker network inspect proxy | grep naiimbsili-portfolio"
          purpose="Confirm the production container is on the proxy network"
          risk="safe"
          notes="If the container name does not appear in the proxy network, Caddy cannot reach it."
          arabicExplanation="هاذا يتحقق أن الـcontainer الجديد موجود على الـproxy network — اللي تحتاجها الـCaddy."
        />
        <CommandBlock
          command="curl -I https://naiimbsili.com"
          purpose="Verify the public site responds over HTTPS"
          risk="safe"
          expectedOutput="HTTP/2 200\ncontent-type: text/html\n..."
          notes="Run this from the VPS or locally. A 502 means Caddy cannot reach the container. A 200 means the deployment succeeded."
          arabicExplanation="هاذا يتحقق أن الموقع يخدم من الإنترنت عبر HTTPS. 200 = نجح، 502 = Caddy ما لقاش الـcontainer."
        />
      </div>

      {/* Step 9 — Post-deployment */}
      <div className="admin-card mb-3">
        <SectionHeader step="9" title="Post-deployment verification" description="Quick functional checks before considering the deployment complete." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            'Open https://naiimbsili.com in a browser — verify the public portfolio loads',
            'Open https://naiimbsili.com/admin — verify the admin login page appears',
            'Log in to the CMS — verify dashboard loads and Supabase is connected',
            'Check no "Supabase unconfigured" banner appears in the admin dashboard',
            'Run docker logs naiimbsili-portfolio — confirm no error lines',
          ].map((check, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#10242a' }}>
              <input type="checkbox" style={{ marginTop: '3px', accentColor: '#087f66' }} />
              <span>{check}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 10 — Record */}
      <div className="admin-card mb-4">
        <SectionHeader step="10" title="Record the deployment" description="After a successful deployment, record it in the Infrastructure Registry (Phase 2+)." />
        <CommandBlock
          command="git log --oneline -1"
          purpose="Get the deployed commit SHA to record in the Infrastructure Registry"
          risk="safe"
          expectedOutput="def5678 feat: add documentation center Phase 1"
          notes="Copy this SHA and record it in Admin → Deployments → [Project] after Phase 2 is deployed."
          arabicExplanation="هاذا يوريك الـcommit اللي رفعتو. احفظو باش تسجلو في سجل الـdeployments."
        />
      </div>

      {/* Rollback reference */}
      <div className="admin-alert" style={{ background: '#fef0f0', border: '1px solid #f5a5a5', borderRadius: '10px', padding: '14px 18px' }}>
        <i className="bi bi-arrow-counterclockwise" style={{ color: '#b91c1c' }} />
        <div>
          <strong>Something went wrong?</strong>{' '}
          Do not panic. The previous Docker image is still on the VPS.{' '}
          <Link to="/admin/docs/rollback" style={{ color: '#b91c1c', fontWeight: 600 }}>
            Follow the Rollback Procedure →
          </Link>
        </div>
      </div>
    </div>
  );
}
