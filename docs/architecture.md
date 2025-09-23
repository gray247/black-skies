# docs/architecture.md — System Architecture (Source of truth)
**Status:** LOCKED · 2025-09-23  
**Version:** v1 (Phase 1 / 1.0)  
**Platform:** Windows 11 only

This document defines how Black Skies runs on-device: processes, data flow, storage, packaging, and non‑functional guarantees. It is the reference for implementation choices and code organization.

---

## 1) Overview
Black Skies is a **local‑first desktop app** for long‑form fiction. The UI is Electron + React; authoring uses **CodeMirror 6**. Local **FastAPI** services handle outline building, drafting, rewrites, and critique. All project data lives in a user‑chosen **project folder** on disk.

**Key constraints**
- No telemetry. No auto‑updates in 1.0.  
- Network calls only occur in **API Mode** when the user supplies a key.  
- All model outputs must **validate** against JSON Schemas before being written.  
- Performance targets: edit **15k–20k** words with **<150 ms** avg keystroke; first diff render **<500 ms**.

---

## 2) Components
### 2.1 Desktop App (Electron)
- **Main process:** window lifecycle, single‑instance lock, file dialogs, spawn/monitor Python services, open external browser for Companion.  
- **Renderer (React):** panes (Wizard, Draft Board, Critique, History), CM6 editor + merge view, Preflight, Read‑Through.  
- **Styling:** Tailwind + shadcn/ui, accessible defaults (focus rings, contrast).  
- **Hotkeys (global):** Ctrl+Enter (Generate), Ctrl+Shift+E (Critique), Ctrl+D (Diff), Ctrl+/ (hotkeys help), F6 (pane cycle).

### 2.2 Local Services (FastAPI)
- **Services:** outline, draft, rewrite, critique (see `docs/endpoints.md`).  
- **Port:** pick free localhost port in range `127.0.0.1:43750–43850`; persist during session.  
- **Health:** `/health` endpoint returns `{status, version}`. UI polls on launch and before jobs.  
- **Concurrency:** in‑process queue with a single worker per service; jobs cancelable from UI.

### 2.3 Storage
- Human‑readable files in the **project folder**:
```

/project-root/
  project.json
  outline.json
  drafts/sc_0001.md
  revisions/{problem_finder.md, continuity_review.md, agents/*}
  history/{snapshots/*, diagnostics/*}
  lore/*.yaml
```
- Scene files are **Markdown + YAML front‑matter** (see `docs/data_model.md`).  
- Snapshots are created on **Accept**/**Lock** and stored under `history/snapshots/`.

---

## 3) Process Topology & Boot
1. App starts → single‑instance lock.  
2. Choose/create project folder → store recent list in app config.  
3. Spawn Python **FastAPI** subprocess via a launcher script (`python -m blackskies.services`).  
4. Wait for `/health` (with timeout) → enable UI actions.  
5. On quit: graceful shutdown → terminate Python process.

**Crash handling**
- If the app or services crash, next boot shows **Recovery** with links to `history/diagnostics/*` and “Reopen last project.”

---

## 4) Data Flow (happy path)
Wizard decisions → **Outline build** → `outline.json`  
→ **Draft generate** (≤5 scenes) → writes scene text to files + returns Draft artifact envelope  
→ **Critique** → returns structured comments + suggested edits  
→ **Accept** → apply diffs to scene files → **Snapshot** created  
→ **Export** → `draft_full.md`

**Validation gates**
- Every service response is validated against its **Schema v1**. If invalid, return `VALIDATION` and **do not write** to disk.

---

## 5) Packaging & Runtime
- **Builder:** electron‑builder; targets **win** only.  
- **Installers:** **NSIS** and **portable ZIP**.  
- **Runtime:** Chromium bundled with Electron; no WebView2 dependency.  
- **Updates:** disabled in 1.0 (manual download).  
- **Signing:** dev‑signed during beta; Authenticode optional post‑1.0.  
- **Environment:** Node 20.x LTS; Python 3.11.

---

## 6) Security & Privacy
- **Local‑first:** All project I/O is on disk.  
- **API Mode:** Off by default; when enabled, keys are stored locally and used only for explicit calls.  
- **Network:** No background requests; CORS locked to `127.0.0.1`.  
- **File safety:** Never overwrite without temp file + atomic rename; snapshots for destructive operations.  
- **Companion:** Opens system browser to ChatGPT; the app only copies text to clipboard on explicit user action.

---

## 7) Error Handling & Limits
- Common error model `{code,message,details?}` with codes: **VALIDATION, RATE_LIMIT, BUDGET_EXCEEDED, CONFLICT, INTERNAL**.  
- Request caps: generate ≤**5** scenes (or 1 chapter); rewrite **1** unit; critique ≤**3** units; one outline build at a time.  
- Diagnostics written to `history/diagnostics/` (local only).

---

## 8) Performance & Resource Targets
- CM6 configuration emphasizes virtualization and debounced updates.  
- Diff hunk anchoring uses ±3–5 token context; large scenes load hunks lazily.  
- Baseline hardware (target): 4‑core CPU, 8–16 GB RAM, SSD.  
- Time budgets: keystroke <150 ms avg; first diff <500 ms.

---

## 9) Accessibility & Motion
- **Keyboard complete** (see hotkeys).  
- **Reduced motion:** spinner rotation off, opacity pulse retained.  
- Contrast: 4.5:1 for text; 3:1 for icons/focus rings.  
- ARIA labels for toggles; live regions for toasts.

---

## 10) Dev & Build (informative)
- **Monorepo layout (suggested):**
```
/app/            # Electron + React (renderer + main)
/services/       # FastAPI code
/docs/           # these specs
/tools/          # packaging scripts, schema validators
/sample_project/ # Esther Estate
```
- **Dev run:**
  - `pnpm dev` (starts Electron + Vite)  
  - `uv run services/dev.py` or `python -m blackskies.services` (starts FastAPI)
- **Env keys:** `BLACKSKIES_API_MODE=1` with `OPENAI_API_KEY=` if user enables API Mode.

---

## 11) Versioning
- This document: **v1**. Any change to platform, topology, storage, or data flow must update this file and be recorded in `phase_log.md`.
