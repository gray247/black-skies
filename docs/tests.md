# Test Strategy & Commands

## Test layers
- **unit**: pure functions, tool adapters (fast).
- **contract**: API schemas, status codes, error shapes.
- **e2e**: Wizard → Draft → Critique flows via HTTP.
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
- **P5**: tool unit tests ≥90% stmt coverage; `eval.py` produces report; CI gate enabled.
- **P6**: all contract tests green; 3 e2e happy-paths green; session restore verified.
- **P7**: `scripts/smoke.sh` / `scripts/smoke.ps1` exit 0 on a fresh clone (API-only and full).
- **P8**: load test within budget; retries/timeouts observed; redaction tests green; SLO ledgers recorded for load + eval runs.
- **P9**: analytics accuracy verified against golden dataset (emotion/pacing/conflict within ±5%); rewrite assistant diff tests stable; voice notes transcription success ≥98% on sample set.
- **P10**: export template diff suite passes for DOCX/EPUB/PDF; badge rendering validated in exports and UI.
- **P11**: plugin registry isolation tests green; agent hook integration contract tests pass; accessibility audits automated (axe-core) across new panels.
- Use `python scripts/load.py --total-cycles 4 --concurrency 2 --start-service` to run the light-load sanity check locally; pass `--service-command` to customise the uvicorn launch flags if needed.
- Critique telemetry derives spend from the scene body word count (fallback to `word_target`), with a minimum 0.25 kt block so budgets never regress to zero between runs.
- Run `python scripts/check_slo.py sample_project/_runtime/runs/<run-id>/run.json` in CI to enforce `result.slo.status == ok` for load/eval jobs.
- Generate dependency manifests with `python scripts/dependency_report.py` and attach to security review artifacts.
- **Analytics tests**: add unit tests for metric calculators, contract tests for `/api/v1/analytics/summary`, and performance benchmarks (< 2 s for sample project).
- **Voice notes tests**: mock transcription engine for unit tests, E2E covering record → transcribe → attach; privacy tests ensure deletion removes assets.
- **Plugin tests**: sandboxed execution harness, permission enforcement, audit log verification, failure injection.
- **Accessibility**: run `pnpm --filter app test:axe` (todo) to validate new UI flows meet WCAG AA.
