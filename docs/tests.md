# Test Strategy & Commands

## Test layers
- **unit**: pure functions, tool adapters (fast).
- **contract**: API schemas, status codes, error shapes.
- **e2e**: Wizard â†’ Draft â†’ Critique flows via HTTP.
- **eval**: offline dataset scoring (non-deterministic tolerant).

## Pytest markers
- unit, contract, e2e, eval

## How to run
- Unit+contract (fast): `pytest -m "unit or contract" -q`
- E2E (needs server): start API, then `pytest -m "e2e" -q`
- Eval harness: `python scripts/eval.py --html out/eval.html --json out/eval.json`
  - Optional flags: `--fail-under-pass-rate`, `--max-avg-latency-ms`, `--max-p95-latency-ms`.
  - The command writes structured JSON+HTML to the provided paths and exits non-zero on regression thresholds.

## Acceptance by phase
- **P5**: tool unit tests â‰¥90% stmt coverage; `eval.py` produces report; CI gate enabled.
- **P6**: all contract tests green; 3 e2e happy-paths green; session restore verified.
- **P7**: `scripts/smoke.sh` / `scripts/smoke.ps1` exit 0 on a fresh clone (API-only and full).
- **P8**: load test within budget; retries/timeouts observed; redaction tests green; SLO ledgers recorded for load + eval runs.
- **P9**: analytics accuracy verified against golden dataset (emotion/pacing/conflict within Â±5%); rewrite assistant diff tests stable; voice notes transcription success â‰¥98% on sample set.
- **P10**: export template diff suite passes for DOCX/EPUB/PDF; badge rendering validated in exports and UI.
- **P11**: plugin registry isolation tests green; agent hook integration contract tests pass; accessibility audits automated (axe-core) across new panels.
- Use `python scripts/load.py --total-cycles 4 --concurrency 2 --start-service` to run the light-load sanity check locally; pass `--service-command` to customise the uvicorn launch flags if needed.
- Critique telemetry derives spend from the scene body word count (fallback to `word_target`), with a minimum 0.25â€¯kt block so budgets never regress to zero between runs.
- Run `python scripts/check_slo.py sample_project/_runtime/runs/<run-id>/run.json` in CI to enforce `result.slo.status == ok` for load/eval jobs.
- Generate dependency manifests with `python scripts/dependency_report.py` and attach to security review artifacts.
- **Analytics tests**: add unit tests for metric calculators, contract tests for `/api/v1/analytics/summary`, and performance benchmarks (< 2â€¯s for sample project).
- **Voice notes tests**: mock transcription engine for unit tests, E2E covering record â†’ transcribe â†’ attach; privacy tests ensure deletion removes assets.
- **Plugin tests**: sandboxed execution harness, permission enforcement, audit log verification, failure injection.
- **Accessibility**: run `pnpm --filter app test:axe` (todo) to validate new UI flows meet WCAG AA.

## Frontend Automation TODOs

- [x] Introduce `app/renderer/utils/testIds.ts` and add `data-testid` hooks to ProjectHome, WizardPanel, DockWorkspace, and recovery banners for Playwright stability.
- [x] Add Playwright Electron fixture (`app/tests/e2e/electron.launch.ts`) plus updated `playwright.config.ts` and `package.json` scripts (`e2e:build`, `e2e`, `e2e:headed`, `e2e:report`).
- [x] Author Playwright specs: end-to-end smoke (`smoke.project.spec.ts`), visual snapshot (`visual.home.spec.ts`), and axe accessibility check (`a11y.smoke.spec.ts`).
- [x] Extend renderer Vitest coverage for recovery banner, dock workspace, analytics helpers, and runtime config caching.
- [x] Enable `eslint-plugin-jsx-a11y`, disable animations when `PLAYWRIGHT===1`, and ensure CI uploads Playwright traces/screenshots on failure.
## Phase ↔ Test Coverage Map

| Phase | Key Deliverables | Primary Tests / Gates |
| :---- | :--------------- | :-------------------- |
| P5 | Tool adapters, eval harness | `scripts/eval.py`, pytest unit+contract markers |
| P6 | `/api/v1` contracts, session restore | `pnpm --filter app test`, Playwright smoke hooks (IPC), pytest contract suite |
| P7 | RC packaging, smoke scripts | `scripts/smoke.sh`, `scripts/smoke.ps1`, `pnpm --filter app test` |
| P8 | Companion overlay, dock resilience | Vitest suites (`CompanionOverlay.test.tsx`), Playwright smoke/axe specs, manual docking QA (docs/phase8_gui_enhancements.md) |
| P9 | Analytics dashboards | Planned: analytics unit/contract tests, Playwright visual checks (`visual.home.spec.ts`) |
| P10 | Accessibility & exports | Planned: Axe automation, export diff harness |
| P11 | Agents & plugins | Planned: plugin contract tests, Playwright regression suites |

