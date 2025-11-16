Status: Draft
Version: 0.9.0
Last Reviewed: 2025-11-15

# docs/backup_and_migration.md — DRAFT

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
