# Black Skies – Runbook

> Single source of truth Codex can follow, step by step.

## Step 1 — Setup Python env & deps
- Create/refresh `.venv`
- Install runtime deps from **wheels/** if present; otherwise from PyPI
- Write minimal `.env` with safe defaults

## Step 2 — Lint (non-blocking)
- `black --check .`
- `flake8 --exclude .venv,**/.venv,**/__pycache__`

## Step 3 — Test (non-blocking / smart-skip)
- If core deps (`httpx`, `fastapi`) are present, run `pytest -q`
- Otherwise **skip** with a clear message (don’t fail the workflow)

## Step 4 — Optional frontend install (sandbox-safe)
- If `BS_ALLOW_NODE=1` and a registry is reachable:
  - Prefer `pnpm i --frozen-lockfile` under `app/` when `pnpm` exists
  - Else fall back to `npm ci` (or `npm install` if no lockfile)
- If registry blocked or tool missing: **skip** gracefully

## Step 5 — Auto-fix & re-lint (non-blocking)
- `black .`
- `flake8 --exclude .venv,**/.venv,**/__pycache__`

## Step 6 — Commit work branch
- Ensure branch `work` exists (create if needed)
- `git add -A && git commit -m "chore(black-skies): step 6 housekeeping"` (no-op if nothing changed)

## Step 7 — Push & PR (best effort)
- Push `work` to `origin`
- If GitHub CLI `gh` is available, open a PR `work → main`
- Otherwise print the exact `git` command Codex should use to open the PR

---
