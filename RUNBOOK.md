# RUNBOOK.md - Black Skies Service

## Authority note
This runbook is operational guidance, not runtime or phase authority.
- Runtime authority: `build/runtime_truth.json`, `docs/specs/current_state.md`
- Status authority: `docs/roadmap.md`

## Overview
Bootstrap, configure, and operate the FastAPI service locally.

## Setup
1. Ensure Python 3.11+ is installed.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # PowerShell
   . .venv\Scripts\Activate.ps1
   # bash
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -c constraints.txt -r requirements.lock -r requirements.dev.lock
   ```
4. Optional `.env` overrides can be added from `.env.example`.

## Run API
```bash
uvicorn blackskies.services.app:create_app --factory --reload --port 8080
```

- Health: `GET http://localhost:8080/api/v1/healthz`
- Metrics: `GET http://localhost:8080/api/v1/metrics`

## Maintenance
- Unit lane: `pytest -q services/tests/unit`
- Full suite: `pytest -q`
- Runtime truth check: `pytest -q services/tests/unit/test_runtime_truth.py`
- Service truth lane (PASS 2 authority): `python scripts/run_service_truth.py`

## Troubleshooting
- Missing deps: reinstall lockfile-constrained dependencies.
- Data path errors: verify configured project base path exists and is writable.
- Flag confusion: verify feature flags/maturity vars in `.env` and `feature_flags.py`.
