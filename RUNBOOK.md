# Black Skies – Runbook
> Step-by-step automation plan with fine-grained milestones.

## Phase 1 – Environment & Tooling

### Step 1.0 – Setup Python env & deps
- Create/refresh `.venv`
- Install runtime deps (prefer `wheels/` when offline)
- Install dev tooling (`black`, `flake8`, `pytest`)
- Ensure `.env` contains safe defaults (`OPENAI_API_KEY`, `BLACK_SKIES_MODE`)

### Step 1.1 – Lint (non-blocking)
- `black --check .`
- `flake8 --exclude .venv,**/.venv,**/__pycache__`

### Step 1.2 – Test (smart-skip)
- If `fastapi` and `httpx` available, run `pytest -q`
- Otherwise skip with explanation (do not fail build)

### Step 1.3 – Optional frontend install
- If `BS_ALLOW_NODE=1` and Node tooling present:
  - Prefer `pnpm install --frozen-lockfile` inside `app/`
  - Fallback to `npm ci` / `npm install`
- Otherwise skip gracefully

## Phase 2 – Formatting & Housekeeping

### Step 2.0 – Auto-fix & re-lint
- `black .`
- `flake8 --exclude .venv,**/.venv,**/__pycache__`

## Phase 3 – Branch Management

### Step 3.0 – Commit feature branch
- Ensure working branch `feature/wizard-preflight` exists
- `git add -A`
- `git commit -m "chore(black-skies): housekeeping after steps 1.x"`

## Phase 4 – Push & PR Prep

### Step 4.0 – Push & open PR (best effort)
- Push `feature/wizard-preflight` to `origin`
- If GitHub CLI is available: `gh pr create -B main -H feature/wizard-preflight`
- Otherwise log instructions for manual PR creation

---
