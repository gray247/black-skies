# Black Skies — Build Plan (through 2.0)

**Purpose:** A single, executable checklist that Codex can follow step-by-step.  
**How to use with Codex CLI:** Pick the next unchecked task. Copy the **Codex ask** under it and paste into Codex. When it opens a PR, review/commit, then return here and proceed to the next task.

> Grounding docs this plan references:
> - `docs/architecture.md`
> - `docs/agents_and_services.md`
> - `docs/endpoints.md`
> - `docs/data_model.md`
> - `docs/policies.md`
> - `docs/exports.md`
> - `docs/gui_layouts.md`
> - `docs/phase_charter.md`, `docs/phase_log.md`

---

## Milestone 1.0 — MVP service (local, offline-friendly)

### 1.1 Project skeleton & settings
**Do:**
- Create Python package `black_skies/` with modules: `app/`, `core/`, `agents/`, `storage/`, `util/`.
- Add `pyproject.toml` (PEP 621) with `black-skies` metadata.
- Implement `black_skies/core/settings.py` using **pydantic-settings** with `.env` support:
  - `OPENAI_API_KEY` (default `"dummy"`), `BLACK_SKIES_MODE` (default `"companion"`).
- Add `black_skies/app/factory.py` with `create_app()` (FastAPI), set common middleware (CORS, gzip), and health route.

**Accept when:**
- `import black_skies` works.
- `uvicorn black_skies.app.factory:create_app` boots with `/healthz -> {"ok":true}`.

**Codex ask:**  
“Implement BUILD_PLAN 1.1: create the Python package skeleton and pydantic settings, and a FastAPI app factory with `/healthz`. Follow docs/architecture.md.”

---

### 1.2 Data model scaffolding (IDs & folders)
**Do:**
- From `docs/data_model.md`, create dataclasses/Pydantic models:
  - `Outline`, `DraftUnit`, `Revision`, `HistoryEntry` with locked ID scheme (`sc_0001`, `ch_0001`, …).
- Add `black_skies/storage/fs_layout.py` with paths: `outline.json`, `drafts/`, `revisions/`, `history/`.

**Accept when:**
- Creating models and serializing/deserializing round-trips.
- A tiny helper can init a blank project folder.

**Codex ask:**  
“Implement BUILD_PLAN 1.2: Pydantic models for Outline/DraftUnit/Revision/HistoryEntry and a file-system layout helper per docs/data_model.md.”

---

### 1.3 Service endpoints (MVP set)
**Do (per `docs/endpoints.md`):**
- Implement routes:
  - `GET /v1/projects/{id}/outline`
  - `PUT /v1/projects/{id}/outline`
  - `POST /v1/projects/{id}/drafts`
  - `GET /v1/projects/{id}/drafts/{draft_id}`
  - `POST /v1/projects/{id}/revisions`
  - `GET /healthz`
- Use the storage layer from 1.2.

**Accept when:**
- OpenAPI shows all endpoints with schemas.
- Basic read/write OK against a temp project dir.

**Codex ask:**  
“Implement BUILD_PLAN 1.3: the MVP FastAPI endpoints wired to the FS storage, matching docs/endpoints.md.”

---

### 1.4 Agents skeletons
**Do (per `docs/agents_and_services.md`):**
- Create interfaces & stubs:
  - `OutlineAgent`, `DraftAgent`, `RevisionAgent`, `CritiqueService`
- No LLM calls yet; just pure functions with TODOs and docstrings citing the doc.

**Accept when:**
- Stubs are importable and unit-tested with ‘does not raise’.

**Codex ask:**  
“Implement BUILD_PLAN 1.4: create agent/service class stubs with signatures and docstrings from docs/agents_and_services.md.”

---

### 1.5 Policy hooks
**Do (per `docs/policies.md`):**
- Add a small policy module (`black_skies/core/policies.py`) with:
  - `check_project_limits()`, `redact_sensitive()`, `validate_export_target()`
- Call minimal hooks inside endpoints where relevant.

**Accept when:**
- Unit tests show policy calls are invoked and can block bad input.

**Codex ask:**  
“Implement BUILD_PLAN 1.5: minimal policy functions and call sites per docs/policies.md, with unit tests.”

---

### 1.6 Exporters
**Do (per `docs/exports.md`):**
- Implement `black_skies/exports/markdown.py` and `black_skies/exports/jsonl.py`.
- Add `POST /v1/projects/{id}/export` with `{"format":"markdown"|"jsonl"}`.

**Accept when:**
- Sample project exports produce files with expected headers/fields.

**Codex ask:**  
“Implement BUILD_PLAN 1.6: markdown and jsonl exporters and the export endpoint, from docs/exports.md.”

---

### 1.7 Tests, lint, formatting
**Do:**
- Add `tests/` covering: settings, models, storage RT, endpoints happy path, policies invoked, exporters.
- Configure `ruff` or `flake8` and `black`.
- Provide `make` (or `tasks.py`) shortcuts: `fmt`, `lint`, `test`, `serve`.

**Accept when:**
- `pytest -q` passes locally (or within the codex environment with wheels).
- `black --check` and `ruff/flake8` pass.

**Codex ask:**  
“Implement BUILD_PLAN 1.7: tests for core paths, plus black/ruff (or flake8) wiring and basic make/task commands.”

---

### 1.8 Offline wheels & pinned deps
**Do:**
- Add `vendor/wheels/` and a `scripts/freeze_wheels.sh` to pre-download:
  - `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `python-dotenv`, `httpx`, `tenacity`, `anyio`, `typing-extensions`, test/lint tools.
- Add `requirements.lock` (exact versions).
- Document offline install in `README.md#offline-install`.

**Accept when:**
- `pip install --no-index --find-links vendor/wheels -r requirements.lock` succeeds on a clean venv.

**Codex ask:**  
“Implement BUILD_PLAN 1.8: vendor offline wheels + lockfile + freeze script and README instructions.”

---

### 1.9 Minimal UI stub (optional in sandbox)
**Do (per `docs/gui_layouts.md`):**
- Create a static HTML stub in `ui/` that hits `/healthz` and displays status.
- Defer full Node stack if registry is blocked; prefer plain HTML+fetch.

**Accept when:**
- Open `ui/index.html` in a browser and it shows service health and version.

**Codex ask:**  
“Implement BUILD_PLAN 1.9: a static HTML status page per docs/gui_layouts.md; no build tooling required.”

---

### 1.10 Docs polish
**Do:**
- Update `README.md` with run, test, export examples.
- Back-link each module to its source doc (architecture/agents/endpoints/etc.).
- Add `CHANGELOG.md` and tag `v1.0.0`.

**Accept when:**
- Fresh clone → follow README → run server → pass tests → export works.

**Codex ask:**  
“Implement BUILD_PLAN 1.10: README/CHANGELOG polish and tag for v1.0.0.”

---

## Milestone 2.0 — Orchestration, critique, and UX pass

### 2.1 Agent orchestration path
**Do:**
- Implement a simple pipeline: Outline → Draft → Revision, with clear intermediate artifacts, retries (tenacity), and structured logs.
- Add `/v2/projects/{id}/draft` that triggers the pipeline (no external LLM call yet; keep stubs).

**Accept when:**
- Pipeline runs deterministically using stubbed agents and produces a Revision.

**Codex ask:**  
“Implement BUILD_PLAN 2.1: agent pipeline orchestration with retries and logs; add /v2/projects/{id}/draft (stubbed).”

---

### 2.2 Critique rubric integration
**Do (per `docs/critique_rubric.md`):**
- Create `black_skies/critique/rubric.py` and apply rubric during revisions.
- Persist rubric results in `history/` entry.

**Accept when:**
- Unit tests show rubric scores attached to revision output.

**Codex ask:**  
“Implement BUILD_PLAN 2.2: wire the critique rubric into the revision stage and persist results.”

---

### 2.3 Decision checklist gating
**Do (per `docs/decision_checklist.md`):**
- Add pre-flight checklist enforcement before exports and publishing endpoints.
- Return actionable errors when gates fail.

**Accept when:**
- Tests cover pass/fail paths for each checklist item.

**Codex ask:**  
“Implement BUILD_PLAN 2.3: decision checklist gating for export/publish operations, with tests.”

---

### 2.4 Observability & health
**Do:**
- Add `/metrics` (Prometheus text format) with basic counters (requests by route, failures, pipeline runs).
- Add structured JSON logging and request IDs.

**Accept when:**
- Metrics endpoint exposes counters; logs show request IDs and pipeline spans.

**Codex ask:**  
“Implement BUILD_PLAN 2.4: basic Prometheus metrics and structured logging with request IDs.”

---

### 2.5 UX round 1
**Do (per `docs/gui_layouts.md`):**
- If Node is available, create a tiny SPA (or HTMX) that can:
  - Load outline, trigger draft pipeline, view latest revision, export.
- Keep it build-light (Vite or plain), or continue with enhanced static pages if registries are blocked.

**Accept when:**
- User can click through the MVP loop end-to-end locally.

**Codex ask:**  
“Implement BUILD_PLAN 2.5: minimal UI to drive outline→draft→revision→export; prefer no heavy toolchains.”

---

### 2.6 Packaging & release
**Do:**
- Provide `uv`/`pipx` friendly entrypoint `black-skies` (console script) with subcommands:
  - `serve`, `init-project`, `export`.
- Tag `v2.0.0`, release notes.

**Accept when:**
- `black-skies serve` runs the app; `init-project` creates folders; `export` works.

**Codex ask:**  
“Implement BUILD_PLAN 2.6: CLI entrypoints (serve/init/export) and package for v2.0.0.”

---

## Conventions for Codex
- Always read referenced docs before coding.
- Touch only the files listed in the current task unless refactoring is required.
- Write tests with each task; keep PRs small (1 task per PR).
- Use pinned versions from `requirements.lock`; prefer offline wheels if available.
- If Node registry is unavailable, prefer static assets and skip npm/pnpm.

---

## Appendix — Quick commands (local dev)
- Create venv & install (online): `python -m venv .venv && source .venv/bin/activate && pip install -e . && pip install -r requirements.lock`
- Offline install: `pip install --no-index --find-links vendor/wheels -r requirements.lock`
- Serve: `uvicorn black_skies.app.factory:create_app --reload`
- Test: `pytest -q`
- Lint/format: `ruff check . && black .`
