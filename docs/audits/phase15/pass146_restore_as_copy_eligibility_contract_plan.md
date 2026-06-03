# PASS 146 - RESTORE-AS-COPY ELIGIBILITY CONTRACT PLAN

## 1. Files inspected

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase19/pass145_next_forward_build_arc_selection.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/backup_and_migration.md`
- `docs/specs/snapshot_state_vocabulary_and_evidence_contract.md`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/backup_verifier.py`
- `services/src/blackskies/services/restore_service.py`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/App.tsx`
- `app/main/preload.ts`

## 2. Existing backup/snapshot/restore flow summary

- Snapshot creation is a short-term safety-copy flow owned by `services/src/blackskies/services/persistence/snapshot.py` and `services/src/blackskies/services/snapshots.py`.
- In-place snapshot recovery is a separate lane owned by `services/src/blackskies/services/routers/recovery.py`; it replaces current project files and is not a restore-as-copy flow.
- ZIP restore is the current copy-materialization lane and is routed through `services/src/blackskies/services/routers/restore.py`.
- Backup bundle restore is the long-term archive copy lane and is routed through `services/src/blackskies/services/routers/backups.py` and `services/src/blackskies/services/backup_service.py`.
- The frontend exposes both restore surfaces in `app/renderer/components/SnapshotsPanel.tsx`, with `app/main/preload.ts` bridging the calls.
- The current semantic baseline in `docs/specs/snapshot_state_vocabulary_and_evidence_contract.md` already reserves `restorable` for Phase 15 and warns that `browseable` must not imply `restorable`.

## 3. Current restore-as-copy behavior, if any

- The restore-as-copy behavior already exists operationally for ZIP and backup archive restore.
- `app/renderer/components/SnapshotsPanel.tsx` shows a `Restore latest ZIP as copy` button when `projectId`, `services.restoreFromZip`, and backend availability are present.
- The restore confirmation copy says the current project will not be overwritten.
- `app/main/preload.ts` forwards `restoreFromZip` requests and includes `restoreAsNew`, but the backend does not currently treat that field as an eligibility gate.
- `services/src/blackskies/services/routers/restore.py` and `services/src/blackskies/services/routers/backups.py` both materialize a sibling copy rather than replacing the current project root.
- `services/src/blackskies/services/restore_service.py` and `services/src/blackskies/services/backup_service.py` both use sibling destination creation and post-materialization validation.
- The current gap is not copy materialization itself. The gap is the absence of an explicit restore-as-copy eligibility contract before the copy is attempted.

## 4. Current eligibility signals

| Signal | Current owner | What it currently proves | Gap |
| --- | --- | --- | --- |
| `projectId` present | renderer + preload | A project-specific action can be issued | Not a restore decision |
| backend online / bridge present | renderer + preload | The request can be sent | Not source eligibility |
| latest backup or latest ZIP exists | `restore.py`, `backup_service.py` | A source archive is available | Not yet a restore-safe decision |
| backup checksum bundle exists | `backup_service.py` | The archive carries a checksum manifest | Not a preflight decision by itself |
| required files exist after extraction | `restore_service.py`, `backup_service.py` | The restored copy is structurally usable | Happens after materialization in the current flow |
| validation of restored copy | `restore_service.py` | The materialized copy passed integrity validation | Post-copy, not eligibility gating |
| backup verifier state / report | `backup_verifier.py` | Integrity and degraded-state facts exist | Not wired into restore authorization yet |
| sibling destination creation | `restore_service.py`, `backup_service.py` | The flow avoids simple overwrite collisions | Not exposed as a preflight eligibility result |

## 5. Missing eligibility signals

- No dedicated `eligible / ineligible` decision object exists before restore materialization.
- No explicit source-kind contract distinguishes `latest-backup`, `named-backup`, `latest-zip`, and `named-zip` at the decision layer.
- No structured blocked-reason list is returned to the caller before restore starts.
- No explicit source-ownership check is shown to the user before copy restore.
- No explicit policy-level freshness gate ties restore eligibility to a recent verification record.
- No explicit enforcement of `restoreAsNew: true` exists in the backend contract.
- No preflight destination preview is returned before materialization.
- No dedicated zip-slip or path-traversal eligibility verdict is surfaced before extraction.
- Snapshot in-place recovery remains separate and should not be folded into this contract.

## 6. What makes a snapshot/backup eligible for restore-as-copy

- The caller explicitly requests copy mode.
- The source archive exists and is readable.
- The source kind is explicit and supported by the route.
- The source archive belongs to the current project identity or selected project scope.
- The archive structure is valid enough for the selected source type.
- Required archive evidence exists, including checksum or manifest data where that source type requires it.
- The destination can be materialized as a unique sibling path.
- The restore will not mutate the active project root.
- The selected source is not known to be invalid, stale, or structurally degraded under the policy selected for this lane.
- If a freshness gate is added for Phase 15, the source must satisfy it before restore is allowed.

## 7. What makes it ineligible

- The source archive is missing.
- The source kind is ambiguous or unsupported.
- The caller requests overwrite semantics instead of copy semantics.
- The archive is malformed, corrupt, or missing required source files.
- The checksum or manifest contract is missing when required.
- The source archive does not belong to the current project scope.
- The backend or restore bridge is unavailable for the action.
- The destination cannot be created as a unique sibling copy.
- The source is explicitly marked blocked by policy, such as a failed eligibility preflight or a future freshness rule.
- The request tries to use copy restore as a hidden in-place replacement path.

## 8. What evidence must be shown to the user before restore

- The source name and source kind.
- The project identity the source belongs to.
- Whether the action is copy-only and will leave the current project untouched.
- The destination preview or the rule that the destination will be a new sibling copy.
- The freshness or verification status that the policy uses to permit the restore.
- Any warnings that do not block restore.
- Any blocked reasons that do block restore.
- The validation result that will be used after materialization.
- The success path should expose the restored path so the user can inspect it.

## 9. What restore-as-copy must never overwrite

- The active project root.
- The source archive or backup bundle.
- The original export ZIP.
- The source snapshot tree.
- The source backup tree.
- An existing sibling restore destination.
- Any manifest or checksum file outside the new materialized copy.
- Any current project content in place.

## 10. Backend ownership map

| File | Ownership for this lane |
| --- | --- |
| `services/src/blackskies/services/routers/restore.py` | Owns the ZIP restore endpoint, source selection, copy-materialization response semantics, and any future restore preflight gate for archive restore |
| `services/src/blackskies/services/routers/backups.py` | Owns backup-bundle restore, backup validation wrapping, and post-restore validation response semantics |
| `services/src/blackskies/services/backup_service.py` | Owns backup archive creation, listing, latest-backup selection, destination naming, and archive-level restore behavior |
| `services/src/blackskies/services/restore_service.py` | Owns non-destructive ZIP extraction, sibling destination creation, restored-copy validation, and the copy-preservation failure path |
| `services/src/blackskies/services/backup_verifier.py` | Owns integrity facts, degraded reasons, and verification state that can inform eligibility but does not yet authorize restore itself |
| `services/src/blackskies/services/persistence/snapshot.py` | Owns snapshot create and in-place snapshot restore, but not copy-restore eligibility |
| `services/src/blackskies/services/routers/recovery.py` | Owns in-place snapshot recovery and must stay separate from restore-as-copy semantics |
| `services/src/blackskies/services/snapshots.py` | Owns snapshot orchestration and recovery bookkeeping, not archive restore authorization |

## 11. Frontend ownership map

| File | Ownership for this lane |
| --- | --- |
| `app/renderer/components/SnapshotsPanel.tsx` | Primary owner of restore-copy CTA gating, confirmation copy, source listing, and user-facing blocked or success messaging |
| `app/main/preload.ts` | Bridge owner for `restoreFromZip`, `restoreBackup`, and request-payload shape, including the `restoreAsNew` field contract |
| `app/renderer/App.tsx` | Shell-level consumer of restore state and project-label coherence; should not own eligibility logic itself |

## 12. Contract shape proposal

### Request

- Keep `projectId` mandatory.
- Keep the source selector explicit.
- Make `restoreAsNew: true` mandatory for this lane.
- Treat `restoreAsNew: false` as ineligible until a separate overwrite-capable lane is designed.

### Decision object

```ts
type RestoreCopyEligibilityDecision = {
  eligible: boolean;
  source_kind: 'latest-backup' | 'named-backup' | 'latest-zip' | 'named-zip';
  source_name: string;
  source_path: string;
  project_id: string;
  restore_mode: 'copy';
  destination_preview?: string | null;
  blocked_reasons: string[];
  warnings: string[];
  checks: {
    source_exists: boolean;
    source_readable: boolean;
    source_kind_matches: boolean;
    source_belongs_to_project: boolean;
    source_structure_valid: boolean;
    checksum_or_manifest_valid: boolean;
    sibling_destination_available: boolean;
    restore_as_new_requested: boolean;
  };
};
```

### Response fields that should remain visible

- `status`
- `restored_path`
- `restored_project_slug`
- `operation`
- `restore_observation`
- `restore_semantic_context`
- `eligibility_decision`

### Contract rule

- The frontend should not infer `restorable` from `browseable` or `verified`.
- The backend should be the source of truth for whether the copy restore is allowed.

## 13. Required tests for implementation

- `services/tests/unit/test_restore_service.py`
  - unique sibling destination creation
  - invalid archive rejection
  - post-restore validation failure cleanup
- `services/tests/test_backups.py`
  - backup bundle restore creates a copy
  - missing checksum bundle is rejected
  - invalid materialized copy is handled safely
- `services/tests/test_snapshot_endpoints.py`
  - snapshot recovery remains separate and in-place
- `services/tests/test_snapshot_authority_enforcement.py`
  - snapshot authority remains distinct from copy restore
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
  - restore CTA text and gating
  - confirmation modal copy
  - success and failure toasts
- `app/renderer/__tests__/AppRestore.test.tsx`
  - restore workflow copy semantics
  - no-overwrite messaging
- `app/main/preload.ts` contract coverage
  - `restoreFromZip` payload shape
  - `restoreAsNew: true` propagation
- If a dedicated eligibility helper is added, add direct unit coverage for the helper before wiring the UI.

## 14. Manual validation checklist

| Step | Pass criteria | Fail criteria | Evidence to capture |
| --- | --- | --- | --- |
| Open a project and open the snapshots panel | Restore CTA appears only when the source and backend are available | CTA appears without a valid source or while backend is unavailable | Screenshot of the panel and CTA state |
| Open the restore confirmation modal | Modal says the current project will not be overwritten | Modal copy is ambiguous or implies in-place overwrite | Screenshot of the modal copy |
| Restore a known-good backup or ZIP | A new sibling folder is created and the current project remains unchanged | The current project is altered or no sibling folder is created | Screenshot of success toast and filesystem view of the sibling folder |
| Restore a missing or invalid archive | The restore is blocked with a clear reason and no folder is created | The restore proceeds or fails without a clear reason | Error toast, trace ID, and absence of a new folder |
| Retry while backend is offline | The action is disabled or blocked cleanly | The action still fires or produces misleading success copy | Disabled button screenshot and no request trace |
| Reveal the restored path | The path is browseable and matches the returned restored path | The returned path cannot be opened or does not match the materialized copy | Explorer reveal and path comparison |

## 15. Risks and edge cases

- The current `/restore` endpoint mixes backup-bundle restore and ZIP restore selection logic, so source-kind ambiguity is the biggest contract risk.
- `restoreAsNew` is already present in the request shape but is not yet authoritative in the backend.
- `restore_service.py` currently extracts ZIP content before validation, so zip-slip and malformed-archive handling should be explicitly bounded in the implementation pass.
- Restore destination collision handling depends on suffixing, not on overwriting, and that behavior should remain explicit.
- A stale verification record could be mistaken for a restore approval if the contract does not distinguish source integrity from source eligibility.
- Backend offline and bridge-unavailable states should stay hard-blocked for the copy CTA.
- Snapshot in-place recovery must not be conflated with copy restore.
- Windows path and permission errors may surface only after materialization unless the preflight contract checks them earlier.

## 16. Recommended Phase 15.2 implementation lane

- Implement a shared restore-eligibility decision helper for `/restore` and `/backups/restore`.
- Make the helper return blocked reasons, warnings, source kind, and destination preview before any restore is considered eligible.
- Enforce `restoreAsNew: true` for copy restore.
- Surface the decision in `SnapshotsPanel.tsx` before the user can confirm restore.
- Keep snapshot in-place recovery in `services/src/blackskies/services/routers/recovery.py` unchanged.

## 17. Final verdict

`READY FOR RESTORE-AS-COPY CONTRACT IMPLEMENTATION`
