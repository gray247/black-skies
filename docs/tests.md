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
- Use `python scripts/load.py --total-cycles 4 --concurrency 2 --start-service` to run the light-load sanity check locally; pass `--service-command` to customise the uvicorn launch flags if needed.
- Critique telemetry derives spend from the scene body word count (fallback to `word_target`), with a minimum 0.25 kt block so budgets never regress to zero between runs.
- Run `python scripts/check_slo.py sample_project/_runtime/runs/<run-id>/run.json` in CI to enforce `result.slo.status == ok` for load/eval jobs.
- Generate dependency manifests with `python scripts/dependency_report.py` and attach to security review artifacts.
- **P9**: tag build reproducible; changelog and release docs present.
