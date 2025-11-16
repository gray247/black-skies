Status: Draft
Version: 1.0
Last Reviewed: 2025-11-15
Phase: Phase 10 (Accessibility & recovery)
Source of Truth: See `docs/phases/phase_charter.md` for the Phase 10 commitments and out-of-scope list.

# docs/phases/phase10_recovery_pipeline.md — DRAFT
> Implementation trace: `docs/BUILD_PLAN.md` → Phase 10 row.

## Scope
Define the autosave cadence, snapshot schema, crash restoration, and History pane rollback experience that keep the writer in control after interruptions.

This phase focuses on automatic snapshots and short-term recovery flows. Long-term ZIP backups (for migration and archival) are defined in `backup_and_migration.md`.

## Done When
- Accessibility toggles (large-font/high-contrast) are wired through `docs/gui/accessibility_toggles.md`, persisted in settings, and remain accessible from the renderer without additional flags.
- Export templates deliver Markdown/PDF/EPUB bundles per `docs/gui/exports.md`, and the backend enforces the data shapes in `docs/specs/data_model.md`.
- Recovery snapshots, journal detection, and hash checks operate as described here with the failure UX referencing `docs/gui/gui_layouts.md`.

## Autosave & Snapshots
- Autosave every 30 seconds while any unit is dirty, with a 5 second debounce after edits stop to avoid excessive writes.
- Snapshots also emit when accepts/locks occur, at chapter boundary saves, on exports, and during clean shutdowns so a recovery point is always available.

## Snapshot Schema (extend `docs/specs/data_model.md`)
Snapshots live under `/history/SS_YYYYmmdd_HHMMSS.json` and include:
```
{
  "id": "ss_2025-11-12_213045",
  "version": 1,
  "created_at": "2025-11-12T21:30:45Z",
  "reason": "accept_edits|chapter_save|export|shutdown",
  "outline_ref": "outline.json#sha256:…",
  "draft_refs": [{"unit_id":"sc_0007","sha256":"…"}],
  "diff_summary": {"added":12,"removed":8,"changed":4},
  "note": "auto"
}
```
Each snapshot stores SHA-256 checksums for referenced draft files and the outline reference so integrity can be verified before restoration.

## Integrity & Quotas
- Keep the latest 50 snapshots per project uncompressed; older snapshots are gzipped and pruned down to 20 to limit disk usage.
- On load, verify every referenced hash; any mismatch warns the user and offers a best-effort open despite the integrity concern.

## Crash Restore
- At startup, detect `/history/_journal.lock`. If present and the last autosave is less than 2 minutes old, prompt “Restore Last Session” before opening the writing view.
- The journal records open units, caret positions, and pane layout so the UI can return to the same context upon restoration.

## History Pane UX
- Timeline list shows date, reason, and counts alongside preview diffs.
- Actions include Preview Diff, Restore, and Reveal Snapshot in Explorer/Finder.
- Filters allow focusing on reasons (`accept_edits`, `chapter_save`, `export`, `shutdown`) and highlight which snapshots contain more units.
- Restoring writes to the working copy while leaving the snapshot file immutable.

## Endpoints
- `GET /history/list` returns `id`, `created_at`, `reason`, `bytes`, and `diff_summary` for available snapshots plus a total count.
- `POST /history/restore` accepts `{ id }` and returns `{ restored_units }` so services can report the number of units rewritten during the restore.

## Acceptance
1. Kill the app mid-edit and relaunch; the prompt appears and recovery restores the previous context in under 5 seconds.
2. Hash mismatch simulations (e.g., intentional bit flip) surface a warning while still allowing the writer to continue safely.
