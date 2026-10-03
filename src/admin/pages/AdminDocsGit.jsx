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

export default function AdminDocsGit() {
  return (
    <div>
      <Helmet>
        <title>Git Workflow — Admin CMS</title>
      </Helmet>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link to="/admin/docs" className="text-muted small">
            <i className="bi bi-arrow-left me-1" />Docs
          </Link>
        </div>
        <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Git Workflow
        </h2>
        <p className="text-muted small mb-0">
          How Git works in this project — remotes, branches, push/pull, and common errors.
        </p>
      </div>

      {/* Two remotes */}
      <div className="admin-card mb-3">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-diagram-2 me-2 text-success" />
          Two remotes: GitLab and GitHub
        </h5>
        <p className="small text-muted mb-3">
          This project has two Git remotes. They serve different purposes.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div className="admin-card mb-0" style={{ border: '1.5px solid #087f66' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', background: '#087f66', color: '#fff', borderRadius: '4px', padding: '2px 8px' }}>origin</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10242a' }}>GitLab</span>
            </div>
            <p className="small text-muted mb-1">
              <strong>Production source of truth.</strong> The VPS pulls from here.
              Pushing to <code>origin</code> makes changes available for deployment.
            </p>
            <code style={{ fontSize: '0.76rem', color: '#718187', wordBreak: 'break-all' }}>
              gitlab.com/Naiimbs/mywebsite.git
            </code>
          </div>
          <div className="admin-card mb-0">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', background: '#f0f4f2', color: '#42545a', borderRadius: '4px', padding: '2px 8px' }}>github</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10242a' }}>GitHub</span>
            </div>
            <p className="small text-muted mb-1">
              Mirror / dev visibility. Not used by the VPS directly.
              Can be pushed to as a secondary remote.
            </p>
            <code style={{ fontSize: '0.76rem', color: '#718187', wordBreak: 'break-all' }}>
              github.com/...
            </code>
          </div>
        </div>

        <InfoBox type="warning">
          <strong>Production deployments always go through <code>origin</code> (GitLab).</strong>{' '}
          Pushing only to <code>github</code> will not make changes visible to the VPS.
        </InfoBox>

        <CommandBlock
          command="git remote -v"
          purpose="List all configured remotes and their URLs"
          risk="safe"
          expectedOutput={`origin\thttps://gitlab.com/Naiimbs/mywebsite.git (fetch)\norigin\thttps://gitlab.com/Naiimbs/mywebsite.git (push)\ngithub\thttps://github.com/... (fetch)\ngithub\thttps://github.com/... (push)`}
          arabicExplanation="هاذا يوريك الـremotes اللي عندك. origin = GitLab = production source. github = mirror."
        />
      </div>

      {/* Current branch */}
      <div className="admin-card mb-3">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-signpost-split me-2 text-success" />
          Current branch: migration/react-phase-1
        </h5>
        <p className="small text-muted mb-3">
          The active production branch during the React migration phase. All changes should be made here.
        </p>

        <CommandBlock
          command="git branch -vv"
          purpose="Show all branches, their tracking remotes, and current upstream"
          risk="safe"
          expectedOutput="* migration/react-phase-1  6bd4c60 [origin/migration/react-phase-1] feat: add supabase arg injection"
          notes="The asterisk (*) marks the current branch. The remote in brackets is the upstream."
          arabicExplanation="هاذا يوريك على أي branch أنت، ومن وين تجيب وتدفع. الـremote بين [] هو الـupstream."
        />
        <CommandBlock
          command="git status"
          purpose="Check current branch state, modified files, and staging area"
          risk="safe"
          expectedOutput="On branch migration/react-phase-1\nYour branch is up to date with 'origin/migration/react-phase-1'.\n\nnothing to commit, working tree clean"
          arabicExplanation="استعمل هاذا دايمًا قبل ما تعمل أي شيء. يوريك الحالة الكاملة."
        />
        <CommandBlock
          command="git log --oneline -5"
          purpose="Show the last 5 commits on the current branch"
          risk="safe"
          expectedOutput="6bd4c60 feat: add supabase arg injection to Dockerfile\n..."
          arabicExplanation="هاذا يوريك آخر 5 commits. مفيد باش تشوف شنوة تغير مؤخرًا."
        />
      </div>

      {/* git pull --ff-only */}
      <div className="admin-card mb-3">
        <h5 className="fw-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-download me-2 text-success" />
          Why <code>git pull --ff-only</code>?
        </h5>
        <p className="small text-muted mb-3">
          On the VPS, we always pull with <code>--ff-only</code> to prevent accidental merge commits.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#f0fdf7', border: '1px solid #b8e0d4', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#087f66', marginBottom: '6px' }}>✓ WITH --ff-only</div>
            <p style={{ fontSize: '0.8rem', color: '#10242a', margin: 0, lineHeight: 1.5 }}>
              Remote branch is strictly ahead of local HEAD. Git advances the pointer. No merge commit created.
              Clean, linear history.
            </p>
          </div>
          <div style={{ background: '#fef9e7', border: '1px solid #f5d97a', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#9a6c00', marginBottom: '6px' }}>✗ WITHOUT --ff-only</div>
            <p style={{ fontSize: '0.8rem', color: '#10242a', margin: 0, lineHeight: 1.5 }}>
              Git may create a merge commit on the VPS, polluting the history and potentially causing issues
              if the VPS has diverged from origin.
            </p>
          </div>
        </div>

        <CommandBlock
          command="git pull --ff-only"
          purpose="Pull the latest commit from the tracked remote without creating a merge commit"
          risk="caution"
          expectedOutput="Updating 6bd4c60..def5678\nFast-forward\n..."
          notes="If this fails with 'fatal: Not possible to fast-forward, aborting', the VPS and GitLab have diverged. Do not force pull — investigate first."
          arabicExplanation="هاذا يجيب الكود الجديد من GitLab بدون ما يخلق merge commit. كان فشل، معناها في مشكلة تعارض — لا تعمل force pull."
        />
      </div>

      {/* Common errors */}
      <div className="admin-card mb-4">
        <h5 className="fw-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
          <i className="bi bi-bug me-2 text-danger" />
          Common Git Errors
        </h5>

        {[
          {
            error: 'error: Your local changes would be overwritten by merge',
            cause: 'The VPS has uncommitted local changes that conflict with the incoming pull.',
            fix: 'On VPS: git stash (then re-inspect — there should never be uncommitted changes on VPS). If safe: git checkout -- .',
          },
          {
            error: 'fatal: Not possible to fast-forward, aborting',
            cause: 'The VPS branch has diverged from origin. Someone may have committed directly on the VPS, or force-pushed to GitLab.',
            fix: 'Inspect with git log --oneline --graph. Do NOT force-pull. Evaluate if rollback is safer.',
          },
          {
            error: 'error: failed to push some refs',
            cause: 'The remote has commits that your local branch does not have.',
            fix: 'Run git pull --ff-only first, then push again.',
          },
          {
            error: "remote: Repository not found",
            cause: "The remote URL is wrong or SSH key / HTTPS credentials are not configured.",
            fix: "Run git remote -v and verify the URL. Ensure your GitLab credentials are valid.",
          },
        ].map((item) => (
          <div key={item.error} style={{ borderBottom: '1px solid #f0f4f2', paddingBottom: '14px', marginBottom: '14px' }}>
            <code style={{ fontSize: '0.78rem', color: '#b91c1c', display: 'block', background: '#fef0f0', borderRadius: '4px', padding: '4px 8px', marginBottom: '6px' }}>
              {item.error}
            </code>
            <p style={{ fontSize: '0.82rem', margin: '0 0 4px 0' }}>
              <strong>Cause:</strong> {item.cause}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#087f66', margin: 0 }}>
              <strong>Fix:</strong> {item.fix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
