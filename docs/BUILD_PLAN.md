# Build Plan – Milestones P1–P4

This plan tracks the originally scoped Phase 1 milestones. Even though the work is complete, the details remain useful when auditing regressions or porting tasks forward. All routes, copy, and acceptance language below reflects the current API (`/api/v1/...`) and renderer vocabulary (Outline/Writing/Feedback).

## API routes reference
| Method | Path | Request | Response |
| :----- | :--- | :------ | :------- |
| POST | `/api/v1/draft/preflight` | Outline/Writing payload (project + unit metadata) | Budget status (`ok`/`soft-limit`/`blocked`) plus token & cost estimates |
| POST | `/api/v1/draft/accept` | Feedback acceptance payload (suggestion diff + metadata) | Updated draft metadata, history handles, snapshot IDs |
| POST | `/api/v1/draft/restore` | Snapshot identifier | Restored draft metadata + status |

Refer to [docs/ui_copy_spec_v1.md](./ui_copy_spec_v1.md) for the approved UI strings. Any PR that updates renderer flows must align to the spec, and the “Accept when” criteria below assume that copy.

## Superseded content index
| Legacy section | Canonical reference |
| :------------- | :------------------ |
| P2 detailed tasks | [docs/P2_ACCEPT_PLAN.md](./P2_ACCEPT_PLAN.md) |
| Historic `black_skies/` vs `services/src/...` layout notes | [docs/phase_log.md](./phase_log.md) – 2025-09 entries |
| Critique UX wireframes | [docs/phase8_gui_enhancements.md](./phase8_gui_enhancements.md) |

---

## Milestone P1 – Preflight & Budgeting  
*Status: Completed 2025-09-29 (original implementation under the `black_skies` package).*

### P1.0 Preflight service endpoint
**Do**
- Add a real `POST /api/v1/draft/preflight` FastAPI route inside the draft router.
- Accept outline + writing payloads, normalise IDs, estimate tokens using existing drafts.
- Return budget status (`ok`, `soft-limit`, `blocked`) with cost metadata.
- Log validation errors via diagnostics; add pytest coverage.

**Accept when**
- `/api/v1/draft/preflight` responds with a status + estimate for valid requests and surfaces validation errors for bad IDs/over-limit batches.
- Pytest includes success + validation cases.
- API examples appear in [docs/endpoints.md](./endpoints.md#draft-preflight).

### P1.1 Renderer integration
**Do**
- Update the preload bridge to call `/api/v1/draft/preflight` (remove the offline stub).
- Enhance `PreflightModal` to display returned budget info and validation errors using copy from `ui_copy_spec_v1.md`.
- Update Outline/Writing flows so “Write draft” waits on preflight status.
- Add Vitest coverage for modal states and error handling.

**Accept when**
- The renderer hits the service, displays estimate/status/error conditions, and disables actions on `blocked`.
- Vitest covers happy path + validation failure.
- Playwright smoke exercises the Outline → Writing preflight flow.

### P1.2 Docs & regression tests
**Do**
- Document the preflight workflow in `README.md` and `docs/endpoints.md`.
- Add regression tests for the Outline → Writing flow (pytest + Vitest).
- Update `phase_log.md` with the new capability.

**Accept when**
- Fresh clone can follow README to run preflight + writing; docs show request/response samples.
- Test suites cover success + validation regression paths.
- Phase log records completion with links to the merged PRs.

---

## Milestone P2 – Feedback Accept & Snapshots  
*Status: Completed 2025-09-29. Detailed guidance now lives in [docs/P2_ACCEPT_PLAN.md](./P2_ACCEPT_PLAN.md).*

### P2.0 Feedback accept API
**Do**
- Extend the service with `POST /api/v1/draft/accept` for Feedback suggestions.
- Apply accepted revisions to scene markdown, create history entry, and bump order metadata when required.
- Ensure diagnostics log conflicts; add pytest coverage.

**Accept when**
- Accepting a suggestion updates the draft file, logs snapshots/history, and returns updated metadata.
- Tests cover accept success, stale/conflict errors, and history logging.

### P2.1 Snapshots & crash recovery
**Do**
- Persist snapshots under `history/snapshots/` on successful accepts.
- Add crash recovery detection (flag file) and show the recovery banner on next launch.
- Provide CLI/renderer affordance to restore from the most recent snapshot using `/api/v1/draft/restore`.

**Accept when**
- Simulated crash triggers the banner and allows restore.
- Tests cover snapshot creation and restore.

### P2.2 Feedback UI & UX polish
**Do**
- Expose accept/reject controls in the renderer with clear state (pending/applied/conflict) aligned to `ui_copy_spec_v1.md`.
- Surface history entries and snapshot timestamps in the UI.
- Add Vitest/Playwright smoke tests for accept/reject/restore flows.

**Accept when**
- Users can accept/reject feedback suggestions and view history from the UI.
- Automated smoke tests cover the flow.

---

## Milestone P3 – Export & Packaging  
*Status: Completed 2025-09-29 (now maintained by export/packaging tooling).*

### P3.0 Export pipeline polish
**Do**
- Produce `draft_full.md` and YAML snapshots per [docs/data_model.md](./data_model.md).
- Ensure exports include latest accepted revisions and metadata.
- Add pytest coverage for export outputs.

**Accept when**
- Exported files match schema/format expectations and tests assert on content.
- Export CLI emits artifacts to `build/exports/` with checksums.

### P3.1 Windows packaging
**Do**
- Script NSIS installer and portable ZIP build for the Electron app.
- Document prerequisites and ensure builds include the FastAPI service + renderer.
- Smoke-test installs on Windows.

**Accept when**
- Both installer and portable builds run Outline → Writing → Feedback end-to-end.
- Packaging instructions updated in [docs/packaging.md](./packaging.md).

### P3.2 README & phase log updates
**Do**
- Refresh `README.md` with quickstart, preflight, feedback, export instructions.
- Update `docs/phase_log.md` with milestones achieved.
- Add CHANGELOG entry summarising Phase 1 completion.

**Accept when**
- Fresh clone can follow README to run the workflow; phase log/changelog reflect the release.

---

## Milestone P4 – Observability & Release Wrap  
*Status: Completed 2025-09-29.*

### P4.0 Metrics & structured logging
**Do**
- Add request ID middleware and structured JSON logging.
- Expose `/metrics` with counters for key endpoints and pipeline runs.
- Update docs with monitoring guidance.

**Accept when**
- Metrics increase under tests, logs show structured entries, docs describe usage.
- CI captures log/metric artifacts for auditing.

### P4.1 Final doc sweep & release tag
**Do**
- Perform a final documentation sweep across `docs/`, `README`, and the renderer help text.
- Tag the release (e.g., `v1.0.0-phase1`) and note it in `phase_log.md`.
- Ensure CI builds run clean.

**Accept when**
- Docs are up-to-date, tests pass, tag is created, and CI reports success.
- `scripts/next.sh` reflects the completed milestone.

---

### Working with Codex
- Keep PRs focused: one step per PR and reference the step ID in the description.
- Touch only necessary files; keep existing behaviour intact.
- Each step must update or add tests relevant to the change.
- Honour offline constraints when possible (reuse existing wheels / skip Node installs if blocked).
- After merging a step, run `bash scripts/next.sh` (or `powershell -File scripts/next.ps1`) to record progress and surface the next task.
