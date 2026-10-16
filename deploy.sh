#!/usr/bin/env bash
# =============================================================================
#  deploy.sh — Naïm Portfolio / naiimbsili.com
#  Usage: ./deploy.sh "feat(blog): mon message de commit"
#  Optionnel: ./deploy.sh  (sans message = demande interactive)
# =============================================================================

set -euo pipefail

# Charge un fichier .deploy.env local si il existe (jamais commité)
if [[ -f ".deploy.env" ]]; then
  # shellcheck disable=SC1091
  source .deploy.env
fi

# ─── Configuration ──────────────────────────────────────────────────────────
BRANCH="${DEPLOY_BRANCH:-migration/react-phase-1}"
REMOTE_GITLAB="${DEPLOY_REMOTE_GITLAB:-origin}"
REMOTE_GITHUB="${DEPLOY_REMOTE_GITHUB:-github}"

# VPS — valeurs lues depuis .deploy.env ou variables d'environnement
VPS_USER="${DEPLOY_VPS_USER:-debian}"
VPS_HOST="${DEPLOY_VPS_HOST:-146.59.226.213}"
VPS_SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/ovh_vps_2026}"
VPS_SSH_KEY="${VPS_SSH_KEY/#\~/$HOME}"
VPS_PROJECT_PATH="${DEPLOY_VPS_PROJECT_PATH:-/srv/projects/naiimbsili/app}"
DOCKER_IMAGE_NAME="${DEPLOY_DOCKER_IMAGE_NAME:-naim-portfolio}"
DOCKER_CONTAINER_NAME="${DEPLOY_DOCKER_CONTAINER_NAME:-naim-portfolio}"

# ─── Couleurs ───────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; exit 1; }

# ─── Validation de la config ────────────────────────────────────────────────
if [[ -z "$VPS_USER" || -z "$VPS_HOST" ]]; then
  fail "VPS_USER ou VPS_HOST manquant.\n  Vérifie le fichier .deploy.env"
fi

if [[ ! -f "$VPS_SSH_KEY" ]]; then
  fail "Clé SSH introuvable : $VPS_SSH_KEY\n  Vérifie DEPLOY_SSH_KEY dans .deploy.env"
fi

# ─── Message de commit ──────────────────────────────────────────────────────
COMMIT_MSG="${1:-}"
if [[ -z "$COMMIT_MSG" ]]; then
  echo -e "${BOLD}Message de commit :${RESET}"
  read -r COMMIT_MSG
fi
if [[ -z "$COMMIT_MSG" ]]; then
  fail "Message de commit vide — annulation."
fi

echo ""
echo -e "${BOLD}══════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Deploy → naiimbsili.com${RESET}"
echo -e "${BOLD}  Branch : ${CYAN}${BRANCH}${RESET}"
echo -e "${BOLD}  VPS    : ${CYAN}${VPS_USER}@${VPS_HOST}${RESET}"
echo -e "${BOLD}  Commit : ${CYAN}${COMMIT_MSG}${RESET}"
echo -e "${BOLD}══════════════════════════════════════════${RESET}"
echo ""

# ─── Phase 1 : Tests ────────────────────────────────────────────────────────
step "Phase 1/4 — Tests automatisés"
if [[ -f "scratch/mock-loader.mjs" && -f "scratch/test_phase19_content_operations_verification.mjs" ]]; then
  if node --loader ./scratch/mock-loader.mjs scratch/test_phase19_content_operations_verification.mjs; then
    ok "Tests passés"
  else
    fail "Tests échoués — deploy annulé. Corrige les erreurs avant de déployer."
  fi
else
  warn "Suite de tests non trouvée — étape ignorée"
fi

# ─── Phase 2 : Git commit + push ────────────────────────────────────────────
step "Phase 2/4 — Git commit & push"

if git diff --quiet && git diff --cached --quiet; then
  warn "Aucun changement à committer — push quand même"
else
  git add -A
  git commit -m "$COMMIT_MSG"
  ok "Commit créé"
fi

git push "$REMOTE_GITLAB" "$BRANCH"
ok "Pushé vers GitLab (origin)"

git push "$REMOTE_GITHUB" "$BRANCH"
ok "Pushé vers GitHub"

# ─── Phase 3 : Build & Deploy sur VPS ──────────────────────────────────────
step "Phase 3/4 — Déploiement sur le VPS"

SSH_CMD="ssh -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -i $VPS_SSH_KEY $VPS_USER@$VPS_HOST"

$SSH_CMD bash <<REMOTE
set -euo pipefail

echo ""
echo "── [VPS] Pull derniers changements"
cd "$VPS_PROJECT_PATH"
git pull origin "$BRANCH"

echo ""
echo "── [VPS] Lecture des variables Supabase depuis .env"
source .env
SUPABASE_URL="\${VITE_SUPABASE_URL:-}"
SUPABASE_KEY="\${VITE_SUPABASE_ANON_KEY:-}"

if [[ -z "\$SUPABASE_URL" || -z "\$SUPABASE_KEY" ]]; then
  echo "ERREUR: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env"
  exit 1
fi

# Détection de permissions Docker
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
  -t $DOCKER_IMAGE_NAME \
  .

echo ""
echo "── [VPS] Restart container"
\$DOCKER stop $DOCKER_CONTAINER_NAME 2>/dev/null || true
\$DOCKER rm   $DOCKER_CONTAINER_NAME 2>/dev/null || true

\$DOCKER run -d \
  --name $DOCKER_CONTAINER_NAME \
  --restart unless-stopped \
  -p 80:80 \
  $DOCKER_IMAGE_NAME

echo ""
echo "── [VPS] Nettoyage images orphelines"
\$DOCKER image prune -f

echo ""
echo "── [VPS] Status container"
\$DOCKER ps --filter name=$DOCKER_CONTAINER_NAME --format "  ✓ {{.Names}} | {{.Status}} | {{.Ports}}"
REMOTE

# ─── Phase 4 : Vérification rapide ──────────────────────────────────────────
step "Phase 4/4 — Vérification HTTP"

sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://naiimbsili.com" || echo "000")
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "301" || "$HTTP_CODE" == "302" ]]; then
  ok "Site répond — HTTP $HTTP_CODE"
else
  warn "Site a retourné HTTP $HTTP_CODE — vérification manuelle recommandée"
fi

# ─── Résumé ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  ✓ Deploy terminé — naiimbsili.com${RESET}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════${RESET}"
echo ""
