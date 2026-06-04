# Pass 160 - Browseable / Verified / Restorable Implementation

## 1. Files Inspected
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase15/pass158_backup_restore_authority_mapping_human_spot_check_closure.md`
- `docs/roadmap/deferred_work_matrix.md`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`

## 2. Current Authority Model Summary
- `RDM-BACKUP-001` is closed and now supplies explicit source authority labels for backup / restore sources.
- Restore-as-copy remains closed with a performance caveat and is not reopened by this pass.
- This lane only separates visible backup sources from trust and restore permission.

## 3. State Definitions
- `browseable`: the source can be listed and inspected locally.
- `verified`: the source has enough integrity evidence to be trusted as a valid bundle.
- `restorable`: the source is verified and safe to copy-restore for the current project scope.
- `blocked`: the source is visible, but restore must be denied for an explicit reason.
- `stale`: the source is visible, but it belongs to another project and must not masquerade as current truth.

## 4. State Differences
- `browseable` is visibility only.
- `verified` adds integrity evidence.
- `restorable` adds safe target semantics and current-project eligibility.
- `blocked` is visible but restore-denied.
- `stale` is visible but current-project mismatch prevents restore.

## 5. Backend Fields
- `browseable`
- `verified`
- `restorable`
- `blocked`
- `stale`
- `authority_state`
- `authority_reasons`
- `source_family`
- `selection_mode`
- `source_label`
- `source_scope`
- `source_project_id`
- `expected_project_id`
- `target_semantics`

## 6. Renderer Surfaces
- Backup rows in `SnapshotsPanel`
- Restore CTA gating in `SnapshotsPanel`
- Row state badge and note copy
- Restore-disabled title / warning wording

## 7. User-Facing Wording
- `Browseable` for visible, unverified rows.
- `Verified` for trusted but not restorable rows.
- `Restorable` for safe copy-restore rows.
- `Blocked` for visible rows that cannot be restored.
- `Stale` for visible rows that belong to another project.

## 8. Blocked From Restore
- Missing or unreadable source
- Missing or invalid manifest evidence
- Checksum mismatch or unavailable required checksum evidence
- Scope mismatch
- Destination unavailability
- Destination collision
- Overwrite intent
- Policy-blocked sources

## 9. Visible But Not Restorable
- Stale backup bundles
- Blocked backup bundles
- Verified sources that fail restore safety checks

## 10. Continuity Gate Checks
- Project switch must not leak stale source labels into the next project.
- Stale sources must stay visible but disabled.
- Restore CTA must follow `restorable`, not visibility.
- Current project root must not be overwritten.

## 11. Authorized Files
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/main/preload.ts` only if bridge serialization is required
- `app/renderer/App.tsx` only if it must consume the new state

## 12. Forbidden Files
- Snapshot ontology files
- Recovery routes
- Restore-as-copy health-cascade files
- GUI redesign / splash / launcher / workflow / Memory Lab
- Export / packaging / restore speed work
- `useServiceHealth.ts` unless a narrow guard becomes unavoidable

## 13. Required Tests
- Backup rows can be browseable without being restorable.
- Stale sources remain visible but not restorable.
- Blocked sources remain visible with explicit reasons.
- Latest/named labels remain correct.
- Restore CTA gating follows `restorable`.
- Renderer state text uses the new source-state language.

## 14. Human Spot-Check Checklist
- Open Black Skies and load Esther Estate.
- Open the backup/restore panel.
- Confirm restorable rows are enabled.
- Confirm stale rows are visible but disabled.
- Confirm blocked rows are visible but disabled.
- Confirm restore wording does not collapse states into `available`.
- Confirm `Restore backup as copy` still works for a valid source.
- Confirm the current project is not overwritten.

## 15. Definition of Done
- Backend backup listings now expose browseable / verified / restorable / blocked / stale explicitly.
- Renderer uses the source-state labels and does not imply restore permission from visibility alone.
- Stale and blocked rows remain visible with reasons.
- Restore CTA is enabled only for truly restorable sources.
- Restore-as-copy remains unchanged.
- The current project remains safe from overwrite.
- Required tests pass.

## 16. Final Verdict
- `BROWSEABLE VERIFIED RESTORABLE IMPLEMENTED`
