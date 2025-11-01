# RELEASE.md  Black Skies

## Prerequisites
- Target version: `v1.0.0-p9`
- Python 3.11+
- Node 20.x + pnpm 8.x
- Local wheel cache populated under `vendor/wheels/`
- Clean `git status`
- Regenerate documentation (`docs/endpoints.md`, `docs/gui_layouts.md`, `docs/voice_notes_transcription.md`) as features land

## Release Checklist
1. Update versions:
   - `pyproject.toml`
   - `services/src/blackskies/services/app.py::SERVICE_VERSION`
   - `app/package.json` + `app/main/main.ts` banner
2. Refresh API contract assets:
   - Verify `docs/endpoints.md` + `/openapi.json`
   - Confirm analytics + voice note samples match current responses
3. Regenerate desktop bundles:
   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter app lint
   pnpm --filter app test
   python -m pytest -q
   ```
4. Build release artifacts:
   ```bash
   pnpm --filter app build:production
   python -m build --wheel --no-isolation
   ```
5. Smoke the feature matrix:
   - Docking enabled (`ui.enable_docking=true`) → drag, float, preset hotkeys
   - `/api/v1/analytics/summary` response cached + rendered
   - Voice note record → transcribe → attach to scene
   - Plugin sandbox registry toggle + audit log
6. Verify export flows (`scripts/load.py --profile burst --slo-report reports/p9/slo.json`, `scripts/eval.py`)
7. Update `CHANGELOG.md`, `phase_log.md`, and support playbook with release highlights
8. Tag & publish:
   ```bash
   git tag v1.0.0-p9
   git push origin main --tags
   ```
9. Create GitHub release entry (attach Electron bundle + wheels)
10. Announce release, close milestone, and archive reports (`reports/p9/`)

## Rollback
- Revert to previous tag `git checkout v1.0.0-rc1` (or prior release).
- Restore prior config, rebuild artifacts, republish, and notify support channel.
