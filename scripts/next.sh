#!/usr/bin/env bash
# Black Skies step runner: executes the "next" step from RUNBOOK.md
# Usage:
#   scripts/next.sh            # run next step
#   scripts/next.sh --reset    # reset progress to 0
#   scripts/next.sh --step N   # run a specific step number (doesn't change saved progress)

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROGRESS_FILE="$ROOT_DIR/.codex_step"
TRACK_FILE="$ROOT_DIR/.codex_history"
DEFAULT_BRANCH="feature/wizard-preflight"

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
info()  { echo "$(color '1;34' '•')" "$@"; }
ok()    { echo "$(color '1;32' '✔')" "$@"; }
warn()  { echo "$(color '1;33' '!')" "$@"; }
err()   { echo "$(color '1;31' '✖')" "$@" >&2; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

# ---- helpers ---------------------------------------------------------------

step_header() {
  local n="$1" ; shift
  echo
  info "Step $n – $*"
  echo "----------------------------------------------------------------"
}

record_step() {
  local n="$1" ; shift
  local desc="$*"
  local ts
  ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "$ts | $n | $desc" >> "$TRACK_FILE"
}

py() { python - "$@"; }

deps_present() {
  py <<'PY'
import importlib, sys
needed = ("httpx", "fastapi")
missing = [m for m in needed if importlib.util.find_spec(m) is None]
sys.stdout.write(",".join(missing))
PY
}

git_branch_exists() {
  git rev-parse --verify "$1" >/dev/null 2>&1
}

ensure_feature_branch() {
  if git_branch_exists "$DEFAULT_BRANCH"; then
    git switch "$DEFAULT_BRANCH" >/dev/null
  else
    git switch -c "$DEFAULT_BRANCH" >/dev/null
  fi
}

# ---- the steps -------------------------------------------------------------

run_step_1_0() {
  step_header 1.0 "Setup Python env & deps"
  cd "$ROOT_DIR"

  if [[ ! -d .venv ]]; then
    info "Creating venv…"
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate

  python -m pip install --upgrade --no-cache-dir pip wheel

  if [[ -d wheels ]]; then
    info "Installing from local wheels/ (offline-friendly)…"
    python -m pip install --no-index --find-links=./wheels \
      fastapi==0.117.1 httpx==0.28.1 "uvicorn[standard]==0.37.0" \
      pydantic==2.11.9 pydantic-settings==2.10.1 python-dotenv==1.1.1 tenacity==9.1.2 || true
  else
    info "Installing runtime deps from PyPI…"
    python -m pip install --no-cache-dir \
      fastapi==0.117.1 httpx==0.28.1 "uvicorn[standard]==0.37.0" \
      pydantic==2.11.9 pydantic-settings==2.10.1 python-dotenv==1.1.1 tenacity==9.1.2 || true
  fi

  python -m pip install --no-cache-dir black==25.9.0 flake8==7.3.0 pytest==8.4.2 pytest-cov==7.0.0 pytest-rerunfailures==16.0.1 || true

  touch .env
  grep -q '^OPENAI_API_KEY=' .env 2>/dev/null || echo "OPENAI_API_KEY=${OPENAI_API_KEY:-dummy}" >> .env
  grep -q '^BLACK_SKIES_MODE=' .env 2>/dev/null || echo "BLACK_SKIES_MODE=${BLACK_SKIES_MODE:-companion}" >> .env

  ok "Python environment ready."
  record_step 1.0 "Setup Python env & deps"
}

run_step_1_1() {
  step_header 1.1 "Lint (non-blocking)"
  cd "$ROOT_DIR"
  [[ -d .venv ]] && source .venv/bin/activate || true

  if has_cmd black; then
    black --check . || warn "black check failed (will be auto-fixed later)."
  else
    warn "black not installed; skipping."
  fi

  if has_cmd flake8; then
    flake8 --exclude .venv,**/.venv,**/__pycache__ || warn "flake8 found issues (will re-run after auto-fix)."
  else
    warn "flake8 not installed; skipping."
  fi

  ok "Lint step completed."
  record_step 1.1 "Lint"
}

run_step_1_2() {
  step_header 1.2 "Test (smart-skip)"
  cd "$ROOT_DIR"
  [[ -d .venv ]] && source .venv/bin/activate || true

  local missing
  missing="$(deps_present)"
  if [[ -n "$missing" ]]; then
    warn "Skipping tests – missing deps: $missing"
    record_step 1.2 "Tests skipped (missing deps: $missing)"
    return 0
  fi

  if has_cmd pytest; then
    pytest -q || err "Tests failed. Fix locally, then re-run this step."
  else
    warn "pytest not installed; skipping."
  fi

  ok "pytest completed."
  record_step 1.2 "pytest"
}

run_step_1_3() {
  step_header 1.3 "Install Node deps (optional)"
  cd "$ROOT_DIR"

  if [[ "${BS_ALLOW_NODE:-0}" != "1" ]]; then
    warn "BS_ALLOW_NODE != 1; skipping Node/pnpm step."
    record_step 1.3 "Node install skipped"
    return 0
  fi

  if ! has_cmd node || ! has_cmd npm; then
    warn "Node/npm not found; skipping."
    record_step 1.3 "Node install skipped (missing node/npm)"
    return 0
  fi

  if has_cmd pnpm; then
    if [[ -d app ]]; then
      (cd app && pnpm install --frozen-lockfile || pnpm install) || warn "pnpm install had issues."
    else
      warn "app/ not found; skipping pnpm install."
    fi
  else
    warn "pnpm not found; using npm."
    if [[ -f package-lock.json ]]; then
      npm ci --audit=false --fund=false || warn "npm ci had issues."
    elif [[ -f package.json ]]; then
      npm install --no-audit --no-fund || warn "npm install had issues."
    else
      warn "No package.json; skipping."
    fi
  fi

  ok "Frontend step completed (if enabled)."
  record_step 1.3 "Node deps"
}

run_step_2_0() {
  step_header 2.0 "Auto-fix formatting"
  cd "$ROOT_DIR"
  [[ -d .venv ]] && source .venv/bin/activate || true

  if has_cmd black; then
    black . || true
  fi
  if has_cmd flake8; then
    flake8 --exclude .venv,**/.venv,**/__pycache__ || true
  fi
  ok "Formatting/lint pass done."
  record_step 2.0 "Auto-fix"
}

run_step_3_0() {
  step_header 3.0 "Commit feature branch"
  cd "$ROOT_DIR"

  ensure_feature_branch
  git add -A || true
  if git diff --cached --quiet; then
    warn "Nothing to commit."
  else
    git commit -m "chore(black-skies): housekeeping after steps 1.x" || true
    ok "Committed to branch '$DEFAULT_BRANCH'."
  fi
  record_step 3.0 "Commit"
}

run_step_4_0() {
  step_header 4.0 "Push & PR prep"
  cd "$ROOT_DIR"

  ensure_feature_branch

  if git remote get-url origin >/dev/null 2>&1; then
    git push -u origin "$DEFAULT_BRANCH" || warn "Push failed; set up 'origin' and auth, then retry."
  else
    warn "No 'origin' remote configured; skipping push."
  fi

  if has_cmd gh; then
    gh pr create -B main -H "$DEFAULT_BRANCH" -t "Black Skies: $DEFAULT_BRANCH" -b "Automated PR from step runner." || warn "gh pr create failed."
  else
    warn "GitHub CLI not installed. To open PR manually:"
    echo "    # On GitHub UI: open a PR from '$DEFAULT_BRANCH' into 'main'."
  fi

  record_step 4.0 "Push/PR"
}

# ---- driver ---------------------------------------------------------------

read_step()  { [[ -f "$PROGRESS_FILE" ]] && cat "$PROGRESS_FILE" || echo 0; }
write_step() { echo "$1" > "$PROGRESS_FILE"; }

NEXT=
if [[ "${1:-}" == "--reset" ]]; then
  write_step 0
  : > "$TRACK_FILE"
  ok "Progress reset."
  exit 0
elif [[ "${1:-}" == "--step" ]]; then
  shift
  [[ $# -ge 1 ]] || { err "Missing step number"; exit 2; }
  NEXT="$1"
else
  CUR="$(read_step)"
  case "$CUR" in
    0|0.0) NEXT=1.0 ;;
    1.0) NEXT=1.1 ;;
    1.1) NEXT=1.2 ;;
    1.2) NEXT=1.3 ;;
    1.3) NEXT=2.0 ;;
    2.0) NEXT=3.0 ;;
    3.0) NEXT=4.0 ;;
    *) warn "No step after $CUR defined. Use --reset to start over."; exit 0 ;;
  esac
  write_step "$NEXT"
fi

case "$NEXT" in
  1.0) run_step_1_0 ;;
  1.1) run_step_1_1 ;;
  1.2) run_step_1_2 ;;
  1.3) run_step_1_3 ;;
  2.0) run_step_2_0 ;;
  3.0) run_step_3_0 ;;
  4.0) run_step_4_0 ;;
  *) warn "No step $NEXT defined. Use --reset to start over."; exit 0 ;;
esac

ok "Step $NEXT done."
