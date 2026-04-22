# Black Skies

Local-first novelist tool for Windows 11: guided outline -> draft -> rewrite -> critique -> export.

> Status note: README is onboarding-oriented, not runtime or phase authority.
> Runtime authority: `build/runtime_truth.json` and `docs/specs/current_state.md`.
> Current phase status authority: `docs/roadmap.md`.

## Platform
Windows 11 only (current desktop target).

## Dev Quickstart
Prereqs: **Node 20 LTS**, **PNPM**, **Python 3.11**

1. **Install workspace dependencies**
   ```bash
   pnpm install --recursive
   ```
2. **Set up the Python services environment**
   ```bash
   cd services
   python -m venv .venv
   # PowerShell
   .\.venv\Scripts\Activate.ps1
   # bash
   source .venv/bin/activate
   pip install -c ../constraints.txt -e .[dev]
   ```
3. **Launch smoke stack**
   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 -SmokeTest
   ```

## Runtime pointers
- Canon runtime state: `docs/specs/current_state.md`
- Memory runtime boundary: `docs/specs/memory_runtime.md`
- Model/provider runtime boundary: `docs/specs/model_runtime.md`
- Runtime truth ledger: `build/runtime_truth.json`

## Companion overlay and budget meter
- Companion overlay supports rubric editing and batch critique flows.
- Budget meter updates from preflight and operation telemetry in workspace header.

## Observability
- Health probe: `GET http://127.0.0.1:8000/api/v1/healthz`
- Metrics: `GET http://127.0.0.1:8000/api/v1/metrics`
- Traceability: responses include `X-Trace-Id`.

## CI and validation
[![Eval Harness](https://github.com/black-skies/black-skies/actions/workflows/eval.yml/badge.svg?branch=main)](https://github.com/black-skies/black-skies/actions/workflows/eval.yml)

The validation workflow includes runtime-truth checks, service unit tests, long-form hardening tests, route smoke, and UI smoke lanes.

## Repo map
```
/app               Electron + React
/services          FastAPI services
/docs              Specs and planning docs
/tools             Runtime truth and utility tooling
/sample_project    Example project for dev and QA
```
