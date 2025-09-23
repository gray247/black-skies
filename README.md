# Black Skies

Local‑first novelist tool for Windows 11: guided outline → draft → rewrite → critique → export.

> **Status:** Tabletop complete. Phase 1 (1.0) docs are LOCKED as of 2025-09-23.

## Platform
Windows 11 only (1.0). macOS/Linux planned post‑1.0.

## Dev Quickstart
- Prereqs: **Node 20 LTS**, **PNPM**, **Python 3.11**
- Install: `pnpm install`
- Run app: `pnpm dev`  (Electron + Vite)
- Run services: `python -m blackskies.services`  (FastAPI on localhost)
- Sample project: see `/sample_project` (e.g., *Esther Estate*)

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
