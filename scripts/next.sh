#!/usr/bin/env bash
# Black Skies step runner: executes the "next" step from RUNBOOK.md
# Usage:
#   scripts/next.sh            # run next step
#   scripts/next.sh --reset    # reset progress to 0
#   scripts/next.sh --step N   # run a specific step number (doesn't change saved progress)

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROGRESS_FILE="$ROOT_DIR/.codex_step"

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
info()  { echo "$(color '1;34' '➤')" "$@"; }
ok()    { echo "$(color '1;32' '✓')" "$@"; }
warn()  { echo "$(color '1;33' '⚠')" "$@"; }
err()   { echo "$(color '1;31' '✗')" "$@" >&2; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

# ---- helpers ---------------------------------------------------------------

step_header() {
  local n="$1" ; shift
  echo
  info "Step $n — $*"
  echo "----------------------------------------------------------------"
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

ensure_work_branch() {
  if git_branch_exists work; then
    git switch work >/dev/null
  else
    git switch -c work >/dev/null
  fi
}

# ---- the steps -------------------------------------------------------------

run_step_1() {
  step_header 1 "Setup Python env & deps"
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

  # Dev tooling is nice-to-have
  python -m pip install --no-cache-dir black==25.9.0 flake8==7.3.0 pytest==8.4.2 pytest-cov==7.0.0 pytest-rerunfailures==16.0.1 || true

  # .env defaults
  touch .env
  grep -q '^OPENAI_API_KEY=' .env 2>/dev/null || echo "OPENAI_API_KEY=${OPENAI_API_KEY:-dummy}" >> .env
  grep -q '^BLACK_SKIES_MODE=' .env 2>/dev/null || echo "BLACK_SKIES_MODE=${BLACK_SKIES_MODE:-companion}" >> .env

  ok "Python environment ready."
}

run_step_2() {
  step_header 2 "Lint (non-blocking)"
  cd "$ROOT_DIR"
  # shellcheck disable=SC1091
  [[ -d .venv ]] && source .venv/bin/activate || true

  if has_cmd black; then
    black --check . || warn "black check failed (will be auto-fixed in Step 5)."
  else
    warn "black not installed; skipping."
  fi

  if has_cmd flake8; then
    flake8 --exclude .venv,**/.venv,**/__pycache__ || warn "flake8 found issues (will re-run after auto-fix)."
  else
    warn "flake8 not installed; skipping."
  fi

  ok "Lint step completed (with warnings if any)."
}

run_step_3() {
  step_header 3 "Test (smart-skip)"
  cd "$ROOT_DIR"
  # shellcheck disable=SC1091
  [[ -d .venv ]] && source .venv/bin/activate || true

  local missing
  missing="$(deps_present)"
  if [[ -n "$missing" ]]; then
    warn "Skipping tests — missing deps: $missing"
    return 0
  fi

  if has_cmd pytest; then
    pytest -q || err "Tests failed. Fix locally, then re-run this step."
  else
    warn "pytest not installed; skipping."
  fi
}

run_step_4() {
  step_header 4 "Optional frontend install (sandbox-safe)"
  cd "$ROOT_DIR"

  if [[ "${BS_ALLOW_NODE:-0}" != "1" ]]; then
    warn "BS_ALLOW_NODE != 1; skipping Node/pnpm step."
    return 0
  fi

  if ! has_cmd node || ! has_cmd npm; then
    warn "Node/npm not found; skipping."
    return 0
  fi

  # If pnpm is available, prefer it; otherwise npm
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
}

run_step_5() {
  step_header 5 "Auto-fix & re-lint"
  cd "$ROOT_DIR"
  # shellcheck disable=SC1091
  [[ -d .venv ]] && source .venv/bin/activate || true

  if has_cmd black; then
    black . || true
  fi
  if has_cmd flake8; then
    flake8 --exclude .venv,**/.venv,**/__pycache__ || true
  fi
  ok "Formatting/lint pass done."
}

run_step_6() {
  step_header 6 "Commit work branch"
  cd "$ROOT_DIR"

  ensure_work_branch
  git add -A || true
  if git diff --cached --quiet; then
    warn "Nothing to commit."
  else
    git commit -m "chore(black-skies): housekeeping after steps 1–5" || true
    ok "Committed to branch 'work'."
  fi
}

run_step_7() {
  step_header 7 "Push & open PR (best effort)"
  cd "$ROOT_DIR"

  ensure_work_branch

  if git remote get-url origin >/dev/null 2>&1; then
    git push -u origin work || warn "Push failed; set up 'origin' and auth, then retry."
  else
    warn "No 'origin' remote configured; skipping push."
  fi

  if has_cmd gh; then
    gh pr create -B main -H work -t "Black Skies: work → main" -b "Automated PR from step runner." || warn "gh pr create failed."
  else
    warn "GitHub CLI not installed. To open PR manually:"
    echo "    # On GitHub UI: open a PR from 'work' into 'main'."
  fi
}

# ---- driver ---------------------------------------------------------------

read_step()  { [[ -f "$PROGRESS_FILE" ]] && cat "$PROGRESS_FILE" || echo 0; }
write_step() { echo "$1" > "$PROGRESS_FILE"; }

NEXT=
if [[ "${1:-}" == "--reset" ]]; then
  write_step 0
  ok "Progress reset."
  exit 0
elif [[ "${1:-}" == "--step" ]]; then
  shift
  [[ $# -ge 1 ]] || { err "Missing step number"; exit 2; }
  NEXT="$1"
else
  CUR="$(read_step)"
  NEXT="$(( CUR + 1 ))"
  write_step "$NEXT"
fi

case "$NEXT" in
  1) run_step_1 ;;
  2) run_step_2 ;;
  3) run_step_3 ;;
  4) run_step_4 ;;
  5) run_step_5 ;;
  6) run_step_6 ;;
  7) run_step_7 ;;
  *) warn "No step $NEXT defined. Use --reset to start over."; exit 0 ;;
esac

ok "Step $NEXT done."
