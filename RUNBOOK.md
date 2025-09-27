# Black Skies — Runbook

This runbook tracks day-to-day execution for the Phase 1 plan in `docs/BUILD_PLAN.md`.

## Daily workflow

1. **Open your shell** (WSL recommended) and change into the repo:
   ```bash
   cd /mnt/c/Dev/black-skies
   ```
2. **Optionally activate the Python env** when running commands manually:
   ```bash
   source .venv/bin/activate  # use .venv\Scripts\activate on Windows
   ```
3. **See the next build-plan step**:
   ```bash
   bash scripts/next.sh
   ```
   The script prints the next step name, summary, and the “Codex ask” to paste into Codex CLI. Each run records progress in `.codex_step` and `.codex_history`.
4. **Apply the step** by pasting the Codex ask into Codex CLI, reviewing the PR, merging, and running the project tests (`corepack pnpm --filter app test` and `PYTHONPATH=services/src python -m pytest`).
5. **After merging**, run `bash scripts/next.sh` again to advance the pointer.

## Utilities

- `scripts/next.sh --reset` — reset progress back to the first step (useful if you want to replay the plan).
- `.codex_history` — audit log of completed steps with timestamps.
- `.codex_step` — current step pointer (plain text).

## Testing shortcuts

- Renderer tests: `corepack pnpm --filter app test`
- Service tests: `PYTHONPATH=services/src python -m pytest`
- Format check: `black --check services app` (once dependencies installed)

## Notes

- Always consult the referenced docs before implementing a step.
- Keep PRs focused on the single step you are executing.
- Honour offline constraints: use existing wheels and skip Node installs if the registry is unavailable.

