# Black Skies

Local‑first novelist tool for Windows 11: guided outline → draft → rewrite → critique → export.

> **Status:** Release Candidate `v1.0.0-rc1` ready. Phase 1 (1.0) docs remain LOCKED as of 2025-09-29.

## Platform
Windows 11 only (1.0). macOS/Linux planned post‑1.0.

## Dev Quickstart
Prereqs: **Node 20 LTS**, **PNPM**, **Python 3.11**

> [!TIP]
> When copying PowerShell commands from this README (or the script banner), copy only the command itself. Including the leading
> `PS C:\...>` prompt causes PowerShell to interpret `PS` as the `Get-Process` alias and the command will fail before
> `start-codex.ps1` can run.

1. **Install workspace dependencies**
   ```bash
   pnpm run install
   ```
2. **Set up the Python services environment**
   ```bash
   cd services
   python -m venv .venv
   # PowerShell (Windows)
   .\.venv\Scripts\Activate.ps1
   # bash (WSL/macOS/Linux)
   source .venv/bin/activate
   pip install -e .[dev]
   ```
3. **Launch the smoke test (Vite + Electron + services)**
   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 -SmokeTest
   ```
   Two terminals open: one runs `pnpm --filter app dev -- --host 127.0.0.1 --port 5173`, the other launches Electron with the
   real preload and auto-starts the FastAPI bridge. When the status pill flips to “Services online” the stack is healthy. Close both
   windows to shut everything down.

   > Prefer manual control? Follow the step-by-step commands in `docs/quickstart.md`.

### Service configuration

- Copy `.env.example` to `.env` before launching the stack. Update
  `BLACKSKIES_PROJECT_BASE_DIR` to point at your project root (or leave the
  default `./sample_project` when working inside the repo).
- Runtime settings are provided by `ServiceSettings`
  (`blackskies.services.config`). Quoted paths, leading whitespace, and
  `export` prefixes are supported when you set
  `BLACKSKIES_PROJECT_BASE_DIR`.
- Packaging and QA builds can override the default budget ceilings and
  plugin allow/deny lists via the optional entries in `.env.example`. Keep
  the RC1 defaults (`$5` soft, `$10` hard) unless the release plan calls for
  different values.
- The configured project directory must exist (e.g.,
  `sample_project/Esther_Estate`). Misconfigured paths raise a validation
  error at startup so deployments fail fast.

### Observability

- Health probe: `GET http://127.0.0.1:8000/api/v1/healthz`
- Metrics: `GET http://127.0.0.1:8000/api/v1/metrics` (Prometheus text format)
- Traceability: every response includes an `X-Trace-Id` header; capture it when filing bugs or correlating logs.

### Security & operations

- Dependency scans: `.github/workflows/security.yml` runs `pip-audit --strict` on every pull request and daily at 06:00 UTC.
- Reproduce locally:
  ```bash
  python -m venv .venv
  source .venv/bin/activate
  pip install .[dev]
  pip install pip-audit
  pip-audit --strict -r requirements.lock -r requirements.dev.lock
  ```
- On Windows PowerShell, activate with `..\.venv\Scripts\Activate.ps1` before running the same commands.

### Continuous integration

[![Eval Harness](https://github.com/black-skies/black-skies/actions/workflows/eval.yml/badge.svg?branch=main)](https://github.com/black-skies/black-skies/actions/workflows/eval.yml)

The Eval Harness workflow now blocks merge until both lint (`black --check`, `flake8`) and type-checking (`mypy`, when configured) succeed.
The evaluation job waits on these gates before running `pytest -q` and the scripted harness so failures stop the pipeline early.

### Python lint checks

Use the locked development requirements to ensure the expected Flake8 plug-ins and configuration are available before running the linter.

```bash
cd services
source .venv/bin/activate
pip install -r ../requirements.dev.lock
flake8
```

On Windows PowerShell, activate the environment with:

```powershell
cd services
..\.venv\Scripts\Activate.ps1
pip install -r ..\requirements.dev.lock
flake8
```

> [!NOTE]
> The locked toolchain includes `uvloop`, which currently ships Linux/macOS wheels only. On native Windows shells `pip install -r ..\requirements.dev.lock` will fail while building `uvloop`. Either run the install from WSL, or install just the pinned linter directly and run Flake8:
>
> ```powershell
> cd services
> ..\.venv\Scripts\Activate.ps1
> pip install flake8==7.3.0
> flake8
> ```

The pinned toolchain applies the 100-character limit and vendor exclusions defined in `.flake8`, matching the CI configuration.

### Sample project: Esther Estate

During 0.1 testing, load the prebuilt project from `sample_project/Esther_Estate`.

1. Launch the desktop shell and choose **Open Existing Project**.
2. Browse to the `sample_project/Esther_Estate` folder (keep the folder structure intact).
3. Confirm the loader detects `project.json`; the outline will surface scenes `sc_0001`–`sc_0002` with matching drafts in `/drafts`.

The directory mirrors the schema in `docs/data_model.md` (`outline.json`, `project.json`, `drafts/`, `revisions/`, `history/`, `lore/`). Use it for smoke tests until the Wizard flow is stable.

## Budgets & Preflight
The renderer queries `/api/v1/draft/preflight` before the **Generate** CTA unlocks. The service responds with the model that will run,
scene metadata, and a `budget` block so the UI can enforce soft ($5) and hard ($10) caps tracked in each `project.json`.

### Sample request
```json
{
  "project_id": "proj_demo",
  "unit_scope": "scene",
  "unit_ids": ["sc_0001", "sc_0002"]
}
```

### Expected responses & UI states
- **OK** — projected total remains below the soft limit. The modal shows `Status: Within budget`, the proceed button stays
  enabled, and the budget message mirrors the `budget.message` string (e.g., "Estimate within budget.").
- **Soft limit** — projected total crosses $5 but stays below $10. The modal renders the warning message, adds a `Soft limit exceeded` badge, and the **Proceed** button stays enabled so the user can confirm the spend.
- **Blocked** — projected total would exceed the hard limit. The modal swaps the primary button text to **Blocked** and keeps it disabled until the spend is reduced.

### Safety layer
- Tool registry preflight runs `blackskies.services.tools.safety.preflight_check` before granting access so budget and privacy policies from `docs/policies.md` are enforced consistently across adapters.
- Structured tool telemetry is sanitized with `postflight_scrub`, which removes emails/API keys before they hit the log streams shared with the FastAPI service.

```jsonc
// Soft-limit example from the live service
{
  "project_id": "proj_demo",
  "unit_scope": "scene",
  "unit_ids": ["sc_0001", "sc_0002"],
  "model": {
    "name": "draft-synthesizer-v1",
    "provider": "black-skies-local"
  },
  "scenes": [
    { "id": "sc_0001", "title": "Storm Cellar", "order": 1, "chapter_id": "ch_0001" },
    { "id": "sc_0002", "title": "Basement Pulse", "order": 2, "chapter_id": "ch_0001" }
  ],
  "budget": {
    "estimated_usd": 5.42,
    "status": "soft-limit",
    "message": "Estimated total $5.42 exceeds soft limit $5.00.",
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 0.0,
    "total_after_usd": 5.42
  }
}
```

```jsonc
// Blocked example from the live service
{
  "project_id": "proj_demo",
  "unit_scope": "scene",
  "unit_ids": ["sc_0003"],
  "model": {
    "name": "draft-synthesizer-v1",
    "provider": "black-skies-local"
  },
  "scenes": [
    { "id": "sc_0003", "title": "Surface Impact", "order": 3, "chapter_id": "ch_0001" }
  ],
  "budget": {
    "estimated_usd": 11.38,
    "status": "blocked",
    "message": "Projected total $11.38 exceeds hard limit $10.00.",
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 0.0,
    "total_after_usd": 11.38
  }
}
```

See `docs/endpoints.md` for full contract notes and error responses.

## Repo Map
```
/app               Electron + React (renderer + main)
/services          FastAPI services
/docs              Specs (source of truth)
/tools             Packaging scripts, schema validators
/sample_project    Example project for dev & QA
```
(See **docs/architecture.md** for more detail.)

## Core Docs (v1)
- `docs/phase_charter.md` — Phase scope, milestones, DoD
- `docs/policies.md` — Platform, privacy, budgets, limits
- `docs/gui_layouts.md` — Screens, a11y, motion, hotkeys
- `docs/data_model.md` — Files & schemas (scene markdown, artifacts, lore)
- `docs/endpoints.md` — API contracts (error model, limits, validation)
- `docs/exports.md` — Manuscript/outline exports and reports
- `docs/architecture.md` — Processes, data flow, packaging
