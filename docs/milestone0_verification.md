# Milestone 0 Verification Report

This report captures the final review for Milestone 0 (Environment, Offline Safety, Hygiene). Each step from the build plan is
listed with its completion evidence and recommended verification commands.

## Summary
- All twelve Milestone 0 tasks are complete and tracked in the repository.
- The automation scripts (`scripts/setup`, `scripts/maint`, `scripts/freeze_wheels.sh`) have offline-safe behavior and guard
  rails in place.
- Runtime and development dependencies are pinned with reproducible lockfiles, and cached wheel workflows are documented.
- Tooling configurations (`.gitignore`, `.editorconfig`, `.flake8`, `services/pyproject.toml`) enforce the hygiene guarantees
  described in the build plan.

## Detailed Checklist
| Step | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Offline-aware setup script | Complete | [`scripts/setup`](../scripts/setup) ensures `.venv` creation, wheel-first installs, `.env` defaults, and optional Node guard rails. |
| 2 | Maintenance helper | Complete | [`scripts/maint`](../scripts/maint) enforces Black, Ruff, and pytest checks without modifying the environment. |
| 3 | Runtime lockfile | Complete | [`requirements.lock`](../requirements.lock) pins the FastAPI stack with refresh instructions. |
| 4 | Development lockfile | Complete | [`requirements.dev.lock`](../requirements.dev.lock) pins test and lint tooling alongside runtime deps. |
| 5 | Wheel freezer | Complete | [`scripts/freeze_wheels.sh`](../scripts/freeze_wheels.sh) downloads wheels for both lockfiles into `vendor/wheels/`. |
| 6 | Setup prefers cached wheels | Complete | [`scripts/setup`](../scripts/setup) attempts offline installation before falling back to PyPI with clear logs. |
| 7 | Ignore junk files | Complete | [`.gitignore`](../.gitignore) includes `.venv/`, `vendor/wheels/`, and other build artifacts. |
| 8 | Editor configuration | Complete | [`.editorconfig`](../.editorconfig) defines UTF-8, LF endings, and Python indentation overrides. |
| 9 | Pytest ignores vendor dirs | Complete | `[tool.pytest.ini_options]` in [`services/pyproject.toml`](../services/pyproject.toml) excludes `.venv`, `vendor`, and node caches. |
| 10 | Linter configuration | Complete | [`.flake8`](../.flake8) sets `max-line-length = 100` and excludes generated directories. |
| 11 | Black configuration | Complete | `[tool.black]` in [`services/pyproject.toml`](../services/pyproject.toml) centralizes formatting rules. |
| 12 | Node guard rails | Complete | [`scripts/setup`](../scripts/setup) gates pnpm installation behind `BS_ALLOW_NODE` and verifies registry availability. |

## Recommended Verification Commands
Run the following from the repository root after activating `.venv`:

```bash
# Ensure dependencies are installed (uses wheel cache when available)
bash scripts/setup

# Populate the wheel cache for offline work
bash scripts/freeze_wheels.sh

# Run standard maintenance checks (format, lint, test)
bash scripts/maint

# Direct pytest invocation for services
pytest -q
```

## Follow-up
- Once Phase 1 Milestone 2 (Docs & Regression Tests) is ready to close, update [`phase_log.md`](../phase_log.md) to change the
  2025-09-24 entry from **ACTIVE** to **LOCKED**.
