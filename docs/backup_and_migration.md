Status: Draft
Version: 0.9.0
Last Reviewed: 2025-11-15

# docs/backup_and_migration.md – DRAFT

## Snapshots vs Backups

- **Snapshots** are short-term, automatic safety copies stored inside the project tree (for example under `.snapshots/` or `history/snapshots/`). They use a rolling retention window (for example, the last N snapshots or roughly the last 7 days). Snapshots exist to recover from crashes, accidental edits, or “I want yesterday’s state back” while you are actively working on the project. They are NOT meant as long-term archives or a portable format for moving projects between machines.
  - Snapshots are stored at `.snapshots/{snapshot_id}/` and include `project.json`, `outline.json`, `/drafts/`, and a generated `manifest.json` with checksums. The default retention keeps the most recent 7 snapshots; older directories are pruned immediately after each creation.
  - Implemented endpoints:
    - `POST /api/v1/snapshots` with `{ "projectId": "<id>" }` creates a new snapshot.
    - `GET /api/v1/snapshots?projectId=<id>` lists existing snapshots.
  - Verification can be invoked via `POST /api/v1/backup_verifier/run?projectId=<id>` (add `&latest_only=true` to limit to the newest snapshot); this routine inspects each manifest and reports missing/corrupt files.
- **Scheduled verification:** A background runner (controlled by `VERIFIER_SCHEDULE_SECONDS`, default 3600) iterates project roots every interval, calls `run_verification`, and persists the latest report under `.snapshots/last_verification.json`.
- The Workspace header exposes “Snapshot” and “Verify” buttons that call these endpoints directly and show a toast with a “Reveal” action afterward.

- **Backups** are explicit, long-term ZIP archives that capture the entire project folder for migration and archival. The user triggers them (or they run on a slower schedule), and they live outside the active project tree (for example, under a `backups/` root or an external path). Backups are meant for long-term retention, machine migration, and “I never want to lose this point-in-time snapshot”, and they are not automatically deleted.

## Backup Story
- **Recommended backup:** Zip the entire project folder (`outline.json`, `/drafts/`, `/history/`, `/analytics/`, `/exports/`) and store it under `backups/` outside the project root. By default, exclude `logs/` and `.perf/`.
- Provide a “Create Backup Bundle” action in the UI (Settings > Project > Backup) that compresses the project, writes it to `backups/`, and records SHA-256 alongside a timestamp.
- Backup bundles follow `/backups/BS_YYYYmmdd_HHMMSS.zip` naming and include `checksums.json`.

## Migration Expectations
- To move a project to another machine, copy the zipped bundle, unzip it, and open the folder via the launcher; the onboarding service will detect the existing `project.json` and resume automatically.
- Schema upgrades: if `project.json::schema_version` bumps, run `scripts/migration.py` (TBD) or rehydrate via the `migration` helper (Future doc).
- Always verify `.blackskies/layout.json` for docking state and update if moving between machines with different display setups.

## Roll-forward & Cleanup
- Keep three most recent backup bundles; older ones can be pruned automatically during nightly maintenance.
- Provide a “Verify Backup” button that checks the zips’ SHA-256 against `checksums.json` and logs the result to `logs/backups.log`.
