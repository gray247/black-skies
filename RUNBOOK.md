# Black Skies Developer Service Runbook

Status: developer-only retained service guidance; not installed V1 operation

The repository retains a Python/FastAPI service stack for development,
historical compatibility, and future work. The accepted packaged
`1.0.0-rc1` application does not require or launch this service for core
writing, Save, recovery, Markdown export, or Command Center.

End users and support operators must use:

- `docs/quickstart.md`;
- `docs/ops/support_playbook.md`; and
- `RELEASE.md`.

Do not install Python, start FastAPI, edit `.env`, or run repository scripts as
a remedy for an installed-product incident.

## Developer setup

From an authorized repository workspace:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -c constraints.txt -r requirements.lock -r requirements.dev.lock
```

Run the retained API:

```powershell
uvicorn blackskies.services.app:create_app --factory --reload --port 8080
```

Developer endpoints:

- `GET http://localhost:8080/api/v1/healthz`
- `GET http://localhost:8080/api/v1/metrics`

Developer verification commands:

```powershell
pytest -q services/tests/unit
python scripts/run_service_truth.py
```

These commands are not Package `19.21` user/operator guidance, do not qualify
the Stage 19 installed runtime, and do not replace `pnpm stage19:regression`.
