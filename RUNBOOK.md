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
   echo "BLACK_SKIES_BLACK_SKIES_MODE=live" >> .env
   ```

## Running the API
```bash
uvicorn black_skies.main:app --reload --port 8080
```
- Health check: `GET http://localhost:8080/healthz`
- Outline endpoint: `POST http://localhost:8080/outline`

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
- API key errors: verify `.env` entries and `BLACK_SKIES_BLACK_SKIES_MODE`.
\n## Observability\n- Logs are emitted in JSON via stdout; each record includes 	race_id, logger, and message metadata.\n- Every request receives an X-Trace-Id header; include it when reporting issues.\n- Metrics are exposed at /metrics (text format) with counters such as http_requests_total, outline_requests_total, etc.\n- Validation errors return {code, detail, trace_id} payloads to simplify client handling and troubleshooting.\n
