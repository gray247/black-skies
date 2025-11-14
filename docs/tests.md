# Test Strategy & Commands

This guide maps every automated surface (services, renderer, packaging) to the current product vocabulary: Outline -> Writing -> Feedback. It documents the commands, artifacts, and thresholds that gate each release phase.

## Terminology
- **Outline flow** replaces the legacy "Wizard" language.
- **Writing flow** replaces the old "Generate/Draft" naming.
- **Feedback flow** replaces "Critique".
- **Insights overlay** covers the contextual assistant surface.
- **Budget meter** refers to the soft/hard budget component in Outline/Writing flows.

## Test layers
- **unit** – pure functions and adapters (fast).
- **contract** – HTTP schemas, status codes, error shapes.
- **e2e** – Outline -> Writing -> Feedback flows via HTTP + renderer.
- **eval** – offline dataset scoring (tolerates non-deterministic output).

## Pytest markers
unit, contract, e2e, eval

## How to run
- **Unit + contract** (fast): pytest -m "unit or contract" --cov=blackskies.services --cov-report=xml:coverage/unit-contract.xml -q
- **E2E** (requires API + renderer running): pytest -m "e2e" -q
- **Eval harness**: python scripts/eval.py --html out/eval.html --json out/eval.json --fail-under-pass-rate 0.90
  - Optional flags: --max-avg-latency-ms, --max-p95-latency-ms enforce latency regression budgets.
- **Frontend** (Vitest + Playwright): pnpm --filter app test and pnpm --filter app exec playwright test
- **Load sanity check**: python scripts/load.py --total-cycles 4 --concurrency 2 --start-service --service-command "uvicorn blackskies.services.app:create_app --factory"
- **SLO validation**: python scripts/check_slo.py sample_project/_runtime/runs/<run-id>/run.json
- **Dependency manifest**: python scripts/dependency_report.py --output build/dependency-report.json

### Token budgeting note
Feedback telemetry derives spend from scene word count (fallback to word_target). A minimum **0.25 k tokens** block is charged per invocation to avoid zero-cost regressions; the evaluator enforces this during load tests.

## Phase gates
| Phase | Goal | Command(s) | Artifact(s) | Threshold |
| :---- | :--- | :--------- | :----------- | :-------- |
| **P5** | Services foundation + eval harness | pytest -m "unit or contract" --cov=blackskies.services --cov-report=xml:coverage/unit-contract.xml -q<br>python scripts/eval.py --html out/eval.html --json out/eval.json --fail-under-pass-rate 0.90 | coverage/unit-contract.xml<br>out/eval.html, out/eval.json | Statement coverage ≥ 90%<br>Eval pass rate ≥ 90% |
| **P6** | Contracts + basic UI automation | pytest -m "e2e" -q<br>pnpm --filter app test<br>pnpm --filter app exec playwright test --project electron-smoke | 
eports/pytest-e2e.xml<br>pp/test-results/<br>pp/playwright-report/index.html | All e2e cases green<br>Vitest & Playwright suites green |
| **P7** | Packaging + smoke | scripts/smoke.ps1 -ProjectId proj_esther_estate -Cycles 3 -SkipInstall<br>scripts/smoke.sh --project proj_esther_estate --cycles 3 | sample_project/_runtime/runs/<timestamp>/run.json<br>logs/smoke/*.log | Smoke scripts exit 0 on fresh clone (Windows + bash) |
| **P8** | Load + resilience | python scripts/load.py --total-cycles 4 --concurrency 2 --start-service<br>python scripts/check_slo.py sample_project/_runtime/runs/<run-id>/run.json | sample_project/_runtime/runs/<run-id>/run.json<br>out/slo-report.txt | SLO status ok<br>Retries/timeouts logged |
| **P9** | Project Health analytics | pytest -m "analytics"<br>pnpm --filter app exec playwright test --project analytics-visual<br>curl -s "http://localhost:8080/api/v1/analytics/summary?project_id=proj_esther_estate" | reports/pytest-analytics.xml<br>app/playwright-report/analytics/<br>.blackskies/cache/analytics_summary.json | Analytics accuracy within +/-5% of golden dataset<br>Playwright visuals diff-free<br>Summary payload matches spec |
| **P10** | Accessibility + exports | pnpm --filter app exec playwright test --project axe<br>python scripts/export_diff.py --formats docx epub pdf | pp/playwright-report/axe/<br>out/export-diff/*.json | WCAG AA audits pass<br>No export diff regressions |
| **P11** | Plugins + Insights | pytest -m "plugins"<br>pnpm --filter app exec playwright test --project plugins | 
eports/pytest-plugins.xml<br>pp/playwright-report/plugins/ | Isolation harness green<br>Plugin gating flows pass |

## Frontend automation TODOs
- [x] Introduce pp/renderer/utils/testIds.ts and add data-testid hooks to OutlineHome, WritingPanel, DockWorkspace, and recovery banners for Playwright stability.
- [x] Add Playwright Electron fixture (pp/tests/e2e/electron.launch.ts) plus updated playwright.config.ts and package.json scripts (e2e:build, e2e, e2e:headed, e2e:report).
- [x] Author Playwright specs: end-to-end smoke (smoke.project.spec.ts), visual snapshot (
isual.home.spec.ts), and axe accessibility check (11y.smoke.spec.ts).
- [x] Extend renderer Vitest coverage for recovery banner, dock workspace, analytics helpers, and runtime config caching.
- [x] Enable eslint-plugin-jsx-a11y, disable animations when PLAYWRIGHT===1, and ensure CI uploads Playwright traces/screenshots on failure.

## Phase coverage map
| Phase | Key deliverables | Primary tests / gates |
| :---- | :--------------- | :-------------------- |
| P5 | Service adapters, eval harness | pytest -m "unit or contract", scripts/eval.py |
| P6 | /api/v1 contracts, session restore | pytest -m "e2e", pnpm --filter app test, Playwright smoke |
| P7 | RC packaging, smoke scripts | scripts/smoke.ps1, scripts/smoke.sh, Playwright smoke |
| P8 | Insights overlay, dock resilience | python scripts/load.py, python scripts/check_slo.py, Playwright axe |
| P9 | Project Health dashboard + Story insights | pytest -m "analytics", Playwright visual suite, analytics summary curl |
| P10 | Accessibility & exports | Playwright axe project, export diff harness |
| P11 | Plugins & automation | pytest -m "plugins", Playwright plugins suite |
