# RUNBOOK.md — Black Skies Service

## Overview
This runbook describes how to bootstrap, configure, and operate the Black Skies FastAPI service locally.

## Setup
1. Ensure Python 3.11+ is installed.
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   . .venv/Scripts/activate  # PowerShell: . .venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r constraints.txt
   ```
4. If running with live agents, populate `.env`:
   ```bash
   echo "BLACK_SKIES_OPENAI_API_KEY=sk-..." >> .env
   echo "BLACK_SKIES_MODE=live" >> .env
   ```

## Running the API
```bash
uvicorn blackskies.services.app:create_app --factory --reload --port 8080
```
- Health check: `GET http://localhost:8080/api/v1/healthz` (legacy `/healthz` emits deprecation headers)
- Outline endpoint (v1): `POST http://localhost:8080/api/v1/outline/build`

## Logs and Data
- Runs: `data/runs/`
- Cache: `data/cache/`
- Exports: `data/exports/`

## Maintenance
- Tests: `python -m pytest -q`
- Lint: `flake8`

## Troubleshooting
- Missing dependencies: reinstall via `pip install -r constraints.txt`.
- Permission errors on data directory: ensure `data/` is writable.
- API key errors: verify `.env` entries and `BLACK_SKIES_MODE` (legacy `BLACK_SKIES_BLACK_SKIES_MODE` is still accepted but logs a rename warning).

## Observability
- Logs are emitted in JSON via stdout; each record includes `trace_id`, logger, and message metadata.
- Every request receives an `X-Trace-Id` header; include it when reporting issues.
- Metrics are exposed at `/api/v1/metrics` (legacy `/metrics` responds with deprecation headers) with counters such as `blackskies_requests_total` and `outline_requests_total`.
- Validation errors return `{code, detail, trace_id}` payloads to simplify client handling and troubleshooting.
