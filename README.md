# Black Skies

Local‑first novelist tool for Windows 11: guided outline → draft → rewrite → critique → export.

> **Status:** Tabletop complete. Phase 1 (1.0) docs are LOCKED as of 2025-09-23.

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
   The dev server exposes http://127.0.0.1:8000 with a `/health` probe.

### Sample project: Esther Estate

During 0.1 testing, load the prebuilt project from `sample_project/Esther_Estate`.

1. Launch the desktop shell and choose **Open Existing Project**.
2. Browse to the `sample_project/Esther_Estate` folder (keep the folder structure intact).
3. Confirm the loader detects `project.json`; the outline will surface scenes `sc_0001`–`sc_0002` with matching drafts in `/drafts`.

The directory mirrors the schema in `docs/data_model.md` (`outline.json`, `project.json`, `drafts/`, `revisions/`, `history/`, `lore/`). Use it for smoke tests until the Wizard flow is stable.

## Budgets & Preflight
- The desktop shell asks the FastAPI services for a `/draft/preflight` estimate before it enables `/draft/generate`.
- Soft ($5) and hard ($10) caps are enforced per project; the running total lives in each `project.json`.
- See `docs/endpoints.md` for request/response details.


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
