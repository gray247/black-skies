# Phase 8 Fix Plan

This checklist summarizes every item from the Phase 8 master audit so we can methodically scope work, prioritize gating issues, and surface batchable workgroups before moving forward.

Critical: 1 · High: 6 · Medium: 2 · Low: 0

## Master Table

| ID | Priority | Category | Short name | Source text |
| --- | --- | --- | --- | --- |
| P8-001 | High | API & Endpoints | Remove deferred voice-note API | Voice-note endpoints are absent from the Phase 8 API surface; docs/endpoints.md now states `/api/v1/voice/*` is deferred and architecture/policies reference the Phase 9 plan (`docs/voice_notes_transcription.md`). |
| P8-002 | High | Runtime & Storage | Scope BackupVerifier to Phase 8 storage | BackupVerifier daemon processes voice notes/snapshots only when `backup_verifier_enabled` and `BLACKSKIES_ENABLE_VOICE_NOTES=1`; Phase 8 docs highlight the gate and missing voice analysis (`services/backup_verifier.py`, `docs/backup_verification_daemon.md`). |
| P8-003 | High | Runtime & Storage | Localize BackupVerifier storage | BackupVerifier reads/writes global `_runtime/` state instead of per-project storage (status: now uses `project_root/history/backup_verifier/` + atomic state files (see `services/backup_verifier.py`, `docs/data_model.md`, `docs/policies.md`, `services/io.py`). |
| P8-004 | High | Runtime & Storage | Harden `_runtime/` boundaries | Global `_runtime/` folder used for caches and run ledgers; violates data_model and risks cross-project leakage (status: cache/runs now stored per-project under `history/cache/` and `history/runs/` with atomic helpers; see `services/cache.py`, `services/runs.py`, `docs/data_model.md`, `docs/policies.md`). |
| P8-005 | Critical | Security & Plugins/Agents | Sandboxed plugin runner | Plugin runner execution stays disabled unless `BLACKSKIES_ENABLE_PLUGINS=1`; docs/architecture.md and docs/policies.md explain the deferred status while services/plugins/registry.py enforces the guard. |
| P8-006 | Medium | Security & Plugins/Agents | Scrub sensitive logs | Diagnostic logging now redacts path/project/snapshot metadata before persisting diagnostics, preventing leaks of sensitive file locations (`services/diagnostics.py`). |
| P8-007 | Medium | General | Tighten exception handling | Broad `except Exception` handlers now chain causes through `raise_service_error(..., cause=exc)` so crashes bubble with their stack traces (`services/http.py`, `services/routers/draft/generation.py`, `services/routers/draft/acceptance.py`, `services/routers/draft/revision.py`, `services/routers/analytics.py`). |
| P8-008 | High | Runtime & Storage | Lock `_runtime/` writes | `_runtime/` writes have no locking; risk of concurrent corruption (status: atomic JSON writes using `services/io.py` ensure durability for per-project files in `history/` and global resilience state under `_runtime/resilience`; see `services/app.py`, `docs/data_model.md`, `docs/policies.md`). |
| P8-009 | High | Analytics & Phase Scope | Gate analytics endpoints | Analytics endpoints (`/analytics/*`) now 404 unless `BLACKSKIES_ENABLE_ANALYTICS=1`, exports skip analytics bundles, and docs emphasize the Phase 9-only surface (`services/routers/analytics.py`, `services/routers/draft/export.py`, `services/operations/draft_export.py`, `docs/endpoints.md`, `docs/exports.md`, `docs/gui_layouts.md`, `docs/analytics_service_spec.md`, `docs/policies.md`). |

## Checklists by Priority

### Critical

- [x] P8-005 — Sandboxed plugin runner (Security & Plugins/Agents) — execution gated via `BLACKSKIES_ENABLE_PLUGINS` (`services/plugins/registry.py`) and documented in architecture/policies.

### High

- [x] P8-001 – Remove deferred voice-note API (API & Endpoints) – docs explicitly mark voice endpoints as Phase 9-only and no `/api/v1/voice/*` routes exist.
- [x] P8-002 – Scope BackupVerifier to Phase 8 storage (Runtime & Storage) – voice checks require `backup_verifier_enabled` and `BLACKSKIES_ENABLE_VOICE_NOTES`, with docs and code describing the gate.
- [x] P8-003 – Localize BackupVerifier storage (Runtime & Storage) – addressed by `services/backup_verifier.py`, `docs/data_model.md`, and `docs/policies.md`, all writing under `<project>/history/backup_verifier/`.
- [x] P8-004 – Harden `_runtime/` boundaries (Runtime & Storage) – now using `services/cache.py`, `services/runs.py`, and atomic helpers so caches/runs live under `<project>/history/`.
- [x] P8-008 – Lock `_runtime/` writes (Runtime & Storage) – atomic JSON writes via `services/io.py` protect per-project history files and `_runtime/resilience/`.
- [x] P8-009 – Gate analytics endpoints (Analytics & Phase Scope) – analytics router and exports now gate via `BLACKSKIES_ENABLE_ANALYTICS`, docs call out Phase 9-only surface.

### Medium

- [x] P8-006 — Scrub sensitive logs (Security & Plugins/Agents) — diagnostic details now redact paths/projects before persisting (`services/diagnostics.py`).
- [x] P8-007 — Tighten exception handling (General) — broad handlers flow `cause=exc` into `raise_service_error` so stack traces surface (`services/http.py`, relevant routers).

### Low

*(No Phase 8 issues were assessed at Low priority.)*

## Suggested Batches

1. **Batch 1 – Harden Plugin Security**  
   *IDs:* P8-005, P8-006  
   *Intent:* Sandbox the plugin runner before it loads arbitrary Python modules and scrub logs so no sensitive metadata leaks from the same subsystem.

2. **Batch 2 – Lock Down `_runtime/` Storage**  
   *IDs:* P8-002, P8-003, P8-004, P8-008  
   *Intent:* Rework BackupVerifier and related daemons to respect per-project storage, prevent `_runtime/` cross-project leaks, and add locking for concurrent writes.

3. **Batch 3 – Align API Scope**  
   *IDs:* P8-001  
   *Intent:* Remove or gate the deferred voice-note endpoints so the exposed API surface matches Phase 8 commitments.

4. **Batch 4 – Analytics Scope Cleanup**  
   *IDs:* P8-009  
   *Intent:* Reconcile `/analytics/summary` and related routes with the Phase 9 gating plan so analytics endpoints never surface prematurely.

5. **Batch 5 – Logging & Error Hygiene**  
   *IDs:* P8-006, P8-007  
   *Intent:* Improve observability by sanitizing log outputs and tightening exception handling so silent failures don’t hide ongoing issues.

6. **Batch 6 – Phase 8 Scope Audit Round-up**  
   *IDs:* P8-001, P8-002, P8-003, P8-004, P8-008, P8-009  
   *Intent:* Review every surfaced scope violation in runtime/storage and analytics so final documentation and code match the Phase 8 charter.

7. **Batch 7 – Dependency Risk Sweep**  
   *IDs:* P8-005  
   *Intent:* Specifically harden the plugin runner’s dynamic imports and confirm no untrusted code can be executed before we move on to later phases.

8. **Batch 8 – Documentation Sync**  
   *IDs:* P8-001, P8-009  
   *Intent:* Double-check doc references for voice-note APIs and analytics so guides match the gated functionality and don’t promise unavailable features.
