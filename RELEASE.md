# RELEASE.md - Black Skies

Minimal release process aligned to current runtime and CI.

## Authority note
Release checklists must align with:
- `build/runtime_truth.json`
- `docs/specs/current_state.md`
- `docs/roadmap.md`

## Preconditions
- Clean `git status`
- Passing validation workflow targets locally where feasible
- Runtime truth artifact regenerated and fresh

## Release checklist
1. Regenerate runtime truth artifacts:
   ```bash
   python tools/runtime_truth/build_runtime_truth.py
   ```
2. Verify runtime truth freshness/schema:
   ```bash
   pytest -q services/tests/unit/test_runtime_truth.py
   ```
3. Run core validation lanes:
   ```bash
   pytest -q services/tests/unit
   pytest -q services/tests/unit/test_long_form.py services/tests/unit/test_long_form_execution.py services/tests/unit/test_model_adapters.py
   ```
4. Run app checks:
   ```bash
   pnpm --filter app lint
   pnpm --filter app test
   ```
5. Run route smoke and eval/load harness as required by release scope:
   ```bash
   bash scripts/smoke.sh
   python scripts/eval.py --html out/eval.html --json out/eval.json
   ```
6. Update docs where needed:
   - `docs/roadmap.md` (status)
   - `docs/phases/phase_log.md` (dated history)
7. Tag and publish release artifacts.

## Explicit non-goals
- Do not assume deferred product flows (for example voice-note recording/transcription UI) are release blockers unless they are in current runtime truth.
