# Black Skies

Local‑first novelist tool for Windows 11: guided outline → draft → rewrite → critique → export.

> **Status:** Tabletop complete. Phase 1 (1.0) docs are LOCKED as of 2025-09-29.

## Platform
Windows 11 only (1.0). macOS/Linux planned post‑1.0.

## Dev Quickstart
Prereqs: **Node 20 LTS**, **PNPM**, **Python 3.11**

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
3. **Run the desktop shell + renderer**
   ```bash
   pnpm run dev
   ```
   The script uses `pnpm exec concurrently` to launch the Vite renderer dev server alongside a placeholder Electron shell task. Replace `scripts/electron-dev-placeholder.mjs` with the real Electron bootstrap when wiring up the desktop shell locally.
4. **Run the FastAPI services**
   ```bash
   python -m blackskies.services
   ```
   The dev server exposes http://127.0.0.1:8000 with a `GET /healthz` probe.

### Observability

- Health probe: `GET http://127.0.0.1:8000/healthz`
- Metrics: `GET http://127.0.0.1:8000/metrics` (Prometheus text format)
- Traceability: every response includes an `X-Trace-Id` header; capture it when filing bugs or correlating logs.

### Python lint checks

Use the locked development requirements to ensure the expected Flake8 plug-ins and configuration are available before running
the linter.

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
The renderer queries `/draft/preflight` before the **Generate** CTA unlocks. The service responds with the model that will run,
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
- **Soft limit** — projected total crosses $5 but stays below $10. The modal renders the warning message, adds a `Soft limit
  exceeded` badge, and the **Proceed** button stays enabled so the user can confirm the spend.
- **Blocked** — projected total would exceed the hard limit. The modal swaps the primary button text to **Blocked** and keeps it
  disabled until the spend is reduced.

### Safety layer
- Tool registry preflight runs `black_skies.tools.safety.preflight_check` before granting access so budget and privacy policies
  from `docs/policies.md` are enforced consistently across adapters.
- Structured tool telemetry is sanitized with `postflight_scrub`, which removes emails/API keys before they hit the log streams
  shared with the FastAPI service.

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
- `docs/agents_and_services.md` — Services now, agents later
- `phase_log.md` — Change history

## License
License: [MIT](LICENSE.txt)
