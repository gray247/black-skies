Status: Active operational policy
Version: 1.0.1
Last Reviewed: 2026-04-21

# Repo Hygiene (Operational Policy)

This repository treats hygiene as a reviewable policy, not an implicit cleanup step.
The goal is to keep generated artifacts, local tool state, and fixture snapshots out of normal commits unless a human explicitly approves an exception.

## What is enforced

- Playwright output: `playwright-report/`, `test-results/`, `app/playwright-report/`, `app/test-results/`
- Build output: `app/dist/`, `app/dist-electron/`
- Python caches: `__pycache__/`, `*.pyc`, `.hypothesis/`
- Logs and temp files: `*.log`, `*.tmp`
- Backup files: `*.bak`, `*.bak*`
- Local tool state: `.aider*`, `.codex*`
- Generated snapshot trees: `sample_project/**/.snapshots/`, `archive/**/.snapshots/`

## Tracked diagnostic scripts

Tracked diagnostic helpers are source files and must meet normal quality gates (including format checks).
For one-off trace/diff probes, prefer containment under `app/temp-trace/` or `tools/` instead of adding new repo-root helper scripts.
If such scripts are intentionally tracked, keep them formatted and periodically prune stale copies.

Current classification:
- `app/temp-trace/` is a tracked diagnostic workspace for trace inspection helpers and fixture-adjacent probes.
- Repo-root `diff*.py` / `*trace*.py` helpers are tracked ad-hoc diagnostics and should be treated as hygiene debt candidates for later consolidation under a contained diagnostics location.

## Install the local pre-commit hook

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_git_hooks.ps1
```

Unix-like shells, Git Bash, or WSL:

```bash
bash ./scripts/install_git_hooks.sh
```

The installers write a local `pre-commit` hook into `.git/hooks/pre-commit` from the tracked template in `scripts/hooks/pre-commit`.
The Windows installer rewrites the shebang to the installed Python launcher path so Git for Windows can execute it without shell handoff.

## Run the hygiene check manually

```bash
python scripts/check_repo_hygiene.py --tracked
git diff --check
```

Use `--staged` if you want to inspect only the current staged set before committing.
If you prefer the package script, run `pnpm repo:hygiene` in a shell that can execute the pnpm shim.
On Windows PowerShell, `cmd /c pnpm repo:hygiene` avoids the execution-policy block.
For a quick hook wiring check, run `git hook run pre-commit` after installation.

## If a generated file truly must be committed

- Do not loosen broad ignore rules casually.
- Add the smallest possible exception.
- Document the reason in the review or commit message.
- Prefer a targeted allowlist entry over a wide pattern change.

## `.gitignore` review rule

`.gitignore` changes must be reviewed carefully.
A broad ignore can hide real source files, so keep patterns narrow and confirm every new entry is intentional.
