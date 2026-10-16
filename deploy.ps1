# =============================================================================
#  deploy.ps1 — Naïm Portfolio / naiimbsili.com (PowerShell)
#  Usage: .\deploy.ps1 "feat(blog): mon message de commit"
#  Optionnel: .\deploy.ps1  (sans argument = invite interactive)
# =============================================================================

param (
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

# ─── Lecture de .deploy.env si présent ──────────────────────────────────────
$envFile = Join-Path $PSScriptRoot ".deploy.env"
$deployConfig = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            $deployConfig[$key] = $val
        }
    }
}

# Configuration avec fallbacks
$Branch = if ($deployConfig.ContainsKey("DEPLOY_BRANCH")) { $deployConfig["DEPLOY_BRANCH"] } else { "migration/react-phase-1" }
$RemoteGitlab = if ($deployConfig.ContainsKey("DEPLOY_REMOTE_GITLAB")) { $deployConfig["DEPLOY_REMOTE_GITLAB"] } else { "origin" }
$RemoteGithub = if ($deployConfig.ContainsKey("DEPLOY_REMOTE_GITHUB")) { $deployConfig["DEPLOY_REMOTE_GITHUB"] } else { "github" }

$VpsUser = if ($deployConfig.ContainsKey("DEPLOY_VPS_USER")) { $deployConfig["DEPLOY_VPS_USER"] } else { "debian" }
$VpsHost = if ($deployConfig.ContainsKey("DEPLOY_VPS_HOST")) { $deployConfig["DEPLOY_VPS_HOST"] } else { "146.59.226.213" }
$RawKey = if ($deployConfig.ContainsKey("DEPLOY_SSH_KEY")) { $deployConfig["DEPLOY_SSH_KEY"] } else { "~/.ssh/ovh_vps_2026" }

# Expansion du chemin de clé SSH pour Windows
$SshKey = $RawKey.Replace("~", $env:USERPROFILE).Replace("/", "\")

$VpsProjectPath = if ($deployConfig.ContainsKey("DEPLOY_VPS_PROJECT_PATH")) { $deployConfig["DEPLOY_VPS_PROJECT_PATH"] } else { "/srv/projects/naiimbsili/app" }
$DockerImage = if ($deployConfig.ContainsKey("DEPLOY_DOCKER_IMAGE_NAME")) { $deployConfig["DEPLOY_DOCKER_IMAGE_NAME"] } else { "naim-portfolio" }
$DockerContainer = if ($deployConfig.ContainsKey("DEPLOY_DOCKER_CONTAINER_NAME")) { $deployConfig["DEPLOY_DOCKER_CONTAINER_NAME"] } else { "naim-portfolio" }

function Step($msg) { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "✓ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

# Validation clé SSH
if (-not (Test-Path $SshKey)) {
    Fail "Clé SSH introuvable : $SshKey`n  Vérifie DEPLOY_SSH_KEY dans .deploy.env"
}

# Message de commit
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = Read-Host "Message de commit"
}
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    Fail "Message de commit vide — annulation."
}

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor White
Write-Host "  Deploy → naiimbsili.com" -ForegroundColor White
Write-Host "  Branch : $Branch" -ForegroundColor Cyan
Write-Host "  VPS    : ${VpsUser}@${VpsHost}" -ForegroundColor Cyan
Write-Host "  Commit : $CommitMessage" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════" -ForegroundColor White

# ─── Phase 1 : Tests automatisés ───────────────────────────────────────────
Step "Phase 1/4 — Tests automatisés"
$testScript = Join-Path $PSScriptRoot "scratch\test_phase19_content_operations_verification.mjs"
$loaderScript = Join-Path $PSScriptRoot "scratch\mock-loader.mjs"
if ((Test-Path $testScript) -and (Test-Path $loaderScript)) {
    & node --loader ./scratch/mock-loader.mjs ./scratch/test_phase19_content_operations_verification.mjs
    if ($LASTEXITCODE -eq 0) {
        Ok "Tests passés"
    } else {
        Fail "Tests échoués — déploiement annulé."
    }
} else {
    Warn "Suite de tests introuvable — étape ignorée"
}

# ─── Phase 2 : Git commit + push ───────────────────────────────────────────
Step "Phase 2/4 — Git commit & push"
$stagedOrChanged = (git status --porcelain)
if (-not $stagedOrChanged) {
    Warn "Aucun changement à committer — push quand même"
} else {
    git add -A
    git commit -m $CommitMessage
    if ($LASTEXITCODE -eq 0) {
        Ok "Commit créé"
    }
}

git push $RemoteGitlab $Branch
if ($LASTEXITCODE -ne 0) { Fail "Échec du push vers $RemoteGitlab" }
Ok "Pushé vers GitLab ($RemoteGitlab)"

git push $RemoteGithub $Branch
if ($LASTEXITCODE -ne 0) { Fail "Échec du push vers $RemoteGithub" }
Ok "Pushé vers GitHub ($RemoteGithub)"

# ─── Phase 3 : Déploiement sur le VPS ──────────────────────────────────────
Step "Phase 3/4 — Déploiement sur le VPS"

$remoteScript = @"
set -euo pipefail
echo ""
echo "── [VPS] Pull derniers changements"
cd "$VpsProjectPath"
git pull origin "$Branch"

echo ""
echo "── [VPS] Lecture des variables Supabase depuis .env"
source .env
SUPABASE_URL="\${VITE_SUPABASE_URL:-}"
SUPABASE_KEY="\${VITE_SUPABASE_ANON_KEY:-}"

if [[ -z "\$SUPABASE_URL" || -z "\$SUPABASE_KEY" ]]; then
  echo "ERREUR: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env"
  exit 1
fi

DOCKER="docker"
if ! docker ps >/dev/null 2>&1; then
  if sudo -n docker ps >/dev/null 2>&1 || sudo docker ps >/dev/null 2>&1; then
    DOCKER="sudo docker"
  fi
fi

echo ""
echo "── [VPS] Build Docker image"
\$DOCKER build \
  --build-arg VITE_SUPABASE_URL="\$SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="\$SUPABASE_KEY" \
  -t $DockerImage \
  .

echo ""
echo "── [VPS] Restart container"
\$DOCKER stop $DockerContainer 2>/dev/null || true
\$DOCKER rm   $DockerContainer 2>/dev/null || true

\$DOCKER run -d \
  --name $DockerContainer \
  --restart unless-stopped \
  -p 80:80 \
  $DockerImage

echo ""
echo "── [VPS] Nettoyage images orphelines"
\$DOCKER image prune -f

echo ""
echo "── [VPS] Status container"
\$DOCKER ps --filter name=$DockerContainer --format "  ✓ {{.Names}} | {{.Status}} | {{.Ports}}"
"@

$remoteScriptUnix = $remoteScript -replace "`r`n", "`n"

# Exécution SSH
$sshArgs = @(
    "-o", "IdentitiesOnly=yes",
    "-o", "StrictHostKeyChecking=accept-new",
    "-i", $SshKey,
    "${VpsUser}@${VpsHost}",
    "bash", "-s"
)

$remoteScriptUnix | & ssh @sshArgs

if ($LASTEXITCODE -ne 0) {
    Fail "Le déploiement sur le VPS a rencontré une erreur."
}
Ok "Conteneur Docker mis à jour sur le VPS"

# ─── Phase 4 : Vérification HTTP ───────────────────────────────────────────
Step "Phase 4/4 — Vérification HTTP"
Start-Sleep -Seconds 3

try {
    $resp = Invoke-WebRequest -Uri "https://naiimbsili.com" -Method Head -TimeoutSec 10 -UseBasicParsing
    if ($resp.StatusCode -eq 200 -or $resp.StatusCode -eq 301 -or $resp.StatusCode -eq 302) {
        Ok "Site répond — HTTP $($resp.StatusCode)"
    } else {
        Warn "Site a retourné HTTP $($resp.StatusCode)"
    }
} catch {
    Warn "Vérification HTTP : $($_.Exception.Message)"
}

Write-Host "`n══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ Deploy terminé — naiimbsili.com" -ForegroundColor Green
Write-Host "══════════════════════════════════════════`n" -ForegroundColor Green
