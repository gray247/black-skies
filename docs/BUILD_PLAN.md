# Black Skies — Phase 1 Execution Plan

**Status:** Updated 2025-09-29 - Milestones P0-P3 are complete in the new black_skies API; use this plan as historical context and staging for P4+.
**Goal:** Complete the remaining Phase 1 items from `docs/phase_charter.md` so the desktop app can run the outline → draft → critique workflow end-to-end, recover from crashes, and ship with documented packaging.

**How to use this plan:** Start at the top. For each step, copy the **Codex ask** into the Codex CLI, review the PR, merge, and then continue. Steps are grouped into milestones to make progress easy to track.

For finer-grained tasks (~85 steps), see `docs/BUILD_STEPS_DETAILED.md` and log progress alongside this plan.

> Grounding docs: `docs/architecture.md`, `docs/agents_and_services.md`, `docs/endpoints.md`, `docs/data_model.md`, `docs/policies.md`, `docs/gui_layouts.md`, `docs/phase_charter.md`, `docs/phase_log.md`.

---

## Milestone P1 — Preflight & Budgeting
*Status: Completed 2025-09-29 - implemented in the black_skies package.*

### P1.0 Preflight service endpoint
**Do**
- Add a real `POST /draft/preflight` FastAPI route inside the draft router.
- Accept project/unit payload, reuse outline normalization, and estimate token counts from existing drafts.
- Return budget status (`ok`, `soft-limit`, `blocked`) with cost metadata.
- Log validation errors via diagnostics; add pytest coverage.

**Accept when**
- `/draft/preflight` responds with status + estimate for valid requests and surfaces validation errors for bad IDs/over-limit batches.
- Pytest includes success + validation cases.

**Codex ask**
“Implement Phase P1.0: add `/draft/preflight` to the FastAPI service, returning budget status and estimates with tests.”

---

### P1.1 Renderer integration
**Do**
- Update the preload bridge to call the real `/draft/preflight` endpoint (remove offline fallback).
- Enhance `PreflightModal` to display returned budget info and validation errors.
- Update wizard/project flows so `Generate` waits on preflight state.
- Add Vitest coverage for modal states and error handling.

**Accept when**
- UI hits the service, displays estimate/status/error conditions, and disables actions on `blocked`.
- Vitest covers happy path + validation failure.

**Codex ask**
“Implement Phase P1.1: hook the renderer into `/draft/preflight`, update the modal, and add Vitest coverage.”

---

### P1.2 Docs & regression tests
**Do**
- Document the preflight workflow in `README.md` and `docs/endpoints.md`.
- Add regression tests for preflight → generate (pytest + Vitest as appropriate).
- Update `phase_log.md` with the new capability.

**Accept when**
- Fresh clone can follow README to run preflight + generate; docs show request/response.
- Test suites cover the regression path.

**Codex ask**
“Implement Phase P1.2: document the preflight flow, add regression tests, and update the phase log.”

---

## Milestone P2 — Critique Accept & Snapshots
*Status: Completed 2025-09-29 - superseded by new acceptance and snapshot flows.*

> Detailed breakdown for these steps now lives in `docs/P2_ACCEPT_PLAN.md` (see numbered tasks for routing, snapshots, and renderer UX follow-ups).

### P2.0 Critique accept API
**Do**
- Extend the service with an endpoint to accept critique suggestions (e.g., `POST /draft/accept`).
- Apply accepted revisions to scene markdown, create history entry, and bump order metadata as needed.
- Ensure diagnostics log conflicts; add pytest coverage.

**Accept when**
- Accepting a critique updates the draft file, logs snapshots/history, and returns updated metadata.
- Tests cover accept success, stale/conflict errors, and history logging.

**Codex ask**
“Implement Phase P2.0: add an accept endpoint that applies critique diffs, persists history, and includes tests.”

---

### P2.1 Snapshots & crash recovery
**Do**
- Persist snapshots under `history/snapshots/` on successful accepts.
- Add crash recovery detection (e.g., flag file) and show banner on next launch.
- Provide CLI/renderer affordance to restore from the most recent snapshot.

**Accept when**
- A simulated crash triggers the recovery banner and allows restore.
- Tests cover snapshot creation and restore path.

**Codex ask**
“Implement Phase P2.1: add snapshot persistence and crash recovery banner with tests.”

---

### P2.2 Critique UI & UX polish
**Do**
- Expose accept/reject controls in the renderer with clear state (pending, applied, conflict).
- Surface history entries and snapshot timestamps in the UI.
- Add Vitest/Playwright smoke tests for accept/reject/recover flows.

**Accept when**
- Users can accept/reject critique suggestions and view history from the UI.
- Automated smoke tests cover the flow.

**Codex ask**
“Implement Phase P2.2: build the renderer UX for critique accept/reject and history with tests.”

---

## Milestone P3 — Export & Packaging
*Status: Completed 2025-09-29 - exports and packaging handled by new tooling.*

### P3.0 Export pipeline polish
**Do**
- Produce `draft_full.md` and YAML snapshots per `docs/data_model.md`.
- Ensure exports include latest accepted revisions and metadata.
- Add pytest coverage for export outputs.

**Accept when**
- Exported files match schema/format expectations and tests assert on content.

**Codex ask**
“Implement Phase P3.0: finalize the export pipeline (Markdown + YAML) with tests.”

---

### P3.1 Windows packaging
**Do**
- Script NSIS installer and portable ZIP build for the Electron app.
- Document prerequisites and ensure builds include the FastAPI service + renderer.
- Smoke-test installs on Windows.

**Accept when**
- Both installer and portable builds run the app end-to-end.

**Codex ask**
“Implement Phase P3.1: produce Windows installer/portable builds and document the process.”

---

### P3.2 README & phase log updates
**Do**
- Refresh `README.md` with quickstart, preflight, critique, export instructions.
- Update `docs/phase_log.md` with milestones achieved.
- Add CHANGELOG entry summarizing Phase 1 completion.

**Accept when**
- Fresh clone can follow README to run full workflow; phase log/changelog reflect the release.

**Codex ask**
“Implement Phase P3.2: document the completed workflow in README/phase_log/CHANGELOG.”

---

## Milestone P4 — Observability & Release Wrap

### P4.0 Metrics & structured logging
**Do**
- Add request ID middleware and structured JSON logging.
- Expose `/metrics` with counters for key endpoints and pipeline runs.
- Update docs with monitoring guidance.

**Accept when**
- Metrics increase under tests, logs show structured entries, docs describe usage.

**Codex ask**
“Implement Phase P4.0: add metrics and structured logging with documentation.”

---

### P4.1 Final doc sweep & release tag
**Do**
- Perform a final documentation sweep across `docs/`, `README`, and the renderer help text.
- Tag the release (e.g., `v1.0.0-phase1`) and note it in `phase_log.md`.
- Ensure CI builds (if configured) run clean.

**Accept when**
- Docs are up-to-date, tests pass, tag is created, and CI reports success.

**Codex ask**
“Implement Phase P4.1: finalize documentation, tag the release, and ensure CI passes.”

---

### Working with Codex
- Keep PRs focused: one step per PR and reference the step ID.
- Touch only necessary files; keep existing behaviour intact.
- Each step must update or add tests relevant to the change.
- Honour offline constraints when possible (use existing wheels/skip Node installs if blocked).
- After merging a step, run `bash scripts/next.sh` to record progress and see the next step.
\n## 2025-09-29 � Observability baseline (LOCKED)
- Added structured JSON logging with trace IDs and unified error payloads.
- Introduced `/metrics` endpoint shipping counters for HTTP and domain requests.
- Updated RUNBOOK with logging/metrics guidance.


## 2025-09-29 - Agents and orchestration scaffolding (LOCKED)\n- Introduced retry-capable agents (outline, draft, rewrite, critique) under black_skies/agents/.\n- Added AgentOrchestrator utilities coordinating serial and parallel runs using shared settings.\n- Added pytest coverage for retry backoff and orchestration flows.\n\n
