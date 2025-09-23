# docs/architecture.md — System Architecture (Source of truth)
**Status:** LOCKED · 2025-09-15  
Covers: components & boundaries, process/data flow.  
Does NOT cover: endpoint payloads (see `docs/endpoints.md`), schemas (`docs/data_model.md`).

## Components
- **Desktop UI:** Electron + React (Tailwind/shadcn). Dockable panes.
- **Local Services:** Python FastAPI — outline, draft, rewrite, critique.
- **Storage:** Project folder on disk per project.

## Data Flow (high level)
Wizard decisions → Outline → Draft (scene-by-scene) → Rewrites/Critiques → Revisions/History → Exports

## Process Boundary
Electron/React (renderer) ⇄ HTTP/IPC ⇄ FastAPI services ⇄ Local filesystem

## Modes
- **API Mode:** model calls via services (with caching/budget warnings).
- **Companion Mode:** opens ChatGPT; no API traffic or content exfiltration.
