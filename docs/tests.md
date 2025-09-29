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

## Acceptance by phase
- **P5**: tool unit tests ≥90% stmt coverage; `eval.py` produces report; CI gate enabled.
- **P6**: all contract tests green; 3 e2e happy-paths green; session restore verified.
- **P7**: `scripts/smoke.sh` exits 0 on fresh clone (API-only and full).
- **P8**: load test within budget; retries/timeouts observed; redaction tests green.
- **P9**: tag build reproducible; changelog and release docs present.
