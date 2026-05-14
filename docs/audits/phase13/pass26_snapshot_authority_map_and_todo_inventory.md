# Phase 13 Pass 26 - Snapshot Authority Map and TODO Inventory

## Executive Summary

Human verification proved that snapshot authority is still drifting across three different layers that CI does not fully unify:

- the verification report JSON can say the project is healthy while the renderer cannot find the local snapshot directory or report file for the loaded alias root
- the snapshot details modal can show degraded local integrity state even when the report says the project is OK
- restore and copy workflows can reject a request even when the GUI copy suggests the latest artifact should be available

CI did not prove that these authorities are aligned. CI proved the harness can run the lanes and that the current assertions pass in the paths the tests cover, but it did not prove the loaded project alias, the verification report, and the snapshot directories are the same truth source under real operator interaction.

Snapshot authority is therefore not closure-grade yet. This is not a silent failure: the product is surfacing explicit degraded states such as "Verification report unavailable", "Snapshot directory could not be located", "Snapshot manifest unavailable", and "Request validation failed". The remaining work is to decide which authority should be canonical and which surfaces should be derived, stale, mirrored, or degraded.

## Authority Source Inventory

| Authority source | File/module | What it claims | What it reads/writes | Authority class | Known drift risk |
| --- | --- | --- | --- | --- | --- |
| Backend snapshot creation | `services/src/blackskies/services/snapshots.py` | A snapshot exists and has a manifest, metadata, file list, and path | Reads project root; writes `.snapshots` for manual snapshots and `history/snapshots` for accept snapshots | Canonical for snapshot materialization, derived for list/report views | Medium. Accept/manual snapshot roots differ and can diverge from UI expectations |
| Backend verification report | `services/src/blackskies/services/routers/backup_verifier.py` + `services/src/blackskies/services/backup_verifier.py` | The latest verification result for a project | Reads the project root and snapshot inventory; writes `.snapshots/last_verification.json` across matched alias roots | Canonical for verification result, cached for UI persistence | High. Report may remain OK while a loaded alias root lacks the files the renderer reads |
| `.snapshots/last_verification.json` | Filesystem report file | The last stored verification report for the loaded project path | Read by preload and renderer; written by backend verifier and E2E stubs | Cached authority, not the source of truth itself | High. Missing or stale file under the loaded alias produces UI false negatives |
| Snapshot directories | `.snapshots/snapshot-current`, `.snapshots/pw-wizard-final`, `history/snapshots/*` | Snapshot payloads exist on disk with files the panel can inspect | Read by renderer details modal and reveal actions; written by backend snapshot creation and fixture materializers | Canonical filesystem evidence for browse/detail flows | High. Alias mismatch or incomplete fixture trees produce "directory unavailable" states |
| `manifest.json` | Snapshot directory file | The included files list for a snapshot | Read by `snapshotReader` and UI actions; written by snapshot creation and fixture materializers | Derived file, often synthetic in harness | High. Missing manifest forces fallback scan and can make detail counts disagree with the report |
| `metadata.json` | Snapshot directory file | Snapshot identity and timestamp | Read by `snapshotReader`; written by snapshot creation and fixture materializers | Derived file | Medium. Missing metadata can be masked by fallback to `snapshot.json` |
| `snapshot.json` | Snapshot directory file | Alternate detail payload for the snapshot | Read by `snapshotReader`; written by fixture materializers | Derived file | Medium. Can exist even when manifest is missing, producing partial detail views |
| Renderer snapshot list | `app/renderer/components/SnapshotsPanel.tsx` | The panel list and health badge reflect the current verification and snapshot inventory | Reads `listProjectSnapshots` and `getLastVerification`; writes React state | UI-only, derived from bridge data | High. The list can look healthy while the detail modal fails to resolve the local path |
| Preload `getLastVerification` / reveal bridge | `app/main/preload.ts` | Local file-backed report and reveal operations for the currently loaded `projectPath` | Reads `projectPath/.snapshots/last_verification.json`; opens local paths through the bridge | Canonical for current loaded-root reads, not for global project truth | High. Alias drift immediately turns into `null` / "unavailable" |
| `SnapshotsPanel` state | `app/renderer/components/SnapshotsPanel.tsx` | The panel shows snapshot health, details, report actions, and per-row controls | Combines bridge state, filesystem probes, modal state, and toast state | UI-only derived state | High. Multiple sources can disagree inside the same panel |
| `App.tsx` snapshot actions | `app/renderer/App.tsx` | Verify and open-report actions should reflect the latest backend result and local report file | Calls `runBackupVerification`, composes toasts, computes local report path, refreshes panel state | UI-only derived orchestration | High. Toast copy can imply success even when the loaded alias root is missing files |
| Service stubs | `app/tests/e2e/utils/serviceStubs.ts` | Synthetic backend and persisted report files that satisfy harness expectations | Writes `last_verification.json` for both aliases and serves synthetic snapshot/backup payloads | Synthetic/cached authority | High. Can hide alias drift if the synthetic tree is more complete than the real one |
| E2E fixture materializer | `scripts/materialize_e2e_fixture.mjs` and `app/tests/e2e/utils/sampleProject.ts` | The loaded project alias tree the app will mount in CI | Writes both sample-project aliases, snapshot directories, and report files | Synthetic fixture authority | High. If any alias is omitted, the renderer reads a different truth than the fixture writer seeded |
| Truth lane | `scripts/truth-with-backend.mjs` | Real backend and Electron lane that validates authority with a temp project base | Reads/writes accept snapshots under `history/snapshots` and verification reports under `.snapshots/last_verification.json` | Canonical for the truth lane it exercises | Medium. It proves the backend path, but not every GUI alias / preload combination |
| Backup restore | `app/renderer/App.tsx`, `app/shared/ipc/services.ts`, `services/src/blackskies/services/routers/recovery.py` | A restore request should either succeed or fail with a concrete validation/error reason | Reads the request, validates the project root, calls recovery restore logic, writes recovery state | Canonical backend authority with UI-derived copy | High. Copy can imply availability while backend validation rejects the requested restore target |

## Current Authority Flow

### A. Snapshot creation

- Input: accept action, wizard lock, or manual snapshot creation
- Source of truth used: backend snapshot persistence
- Filesystem dependency: snapshot directory must be created and populated
- Backend dependency: `SnapshotPersistence`, snapshot pruning, recovery finalization
- UI state dependency: refresh of snapshot list, recovery state, and toasts
- Failure mode: snapshot exists in one root but not the loaded alias, or manifest/metadata is incomplete
- Current user-facing message: "Snapshot created", "Latest snapshot verified", or a degraded toast/error if persistence fails

### B. Verify snapshots

- Input: run verification from the snapshot panel or the app-level snapshot action
- Source of truth used: backend verification report
- Filesystem dependency: `.snapshots/last_verification.json` must exist on the loaded alias root
- Backend dependency: `backup_verifier/run` and `backup_verifier/report`
- UI state dependency: health badge, verification timestamp, toast copy, panel refresh
- Failure mode: report says OK but the loaded alias root is missing the file the renderer reads
- Current user-facing message: "Latest snapshot verified", "Verification data unavailable", or "Backup verification failed"

### C. Open snapshots panel

- Input: open the snapshots panel or refresh it from the app shell
- Source of truth used: `listProjectSnapshots` plus `getLastVerification`
- Filesystem dependency: local snapshot directories and report file
- Backend dependency: snapshot list endpoint and verification bridge
- UI state dependency: panel loading state and health label
- Failure mode: panel list loads but health badge says unavailable, or vice versa
- Current user-facing message: "Verification data unavailable" or "No snapshots verified"

### D. View snapshot details

- Input: "View snapshot details"
- Source of truth used: local snapshot directory plus `metadata.json` / `manifest.json` / `snapshot.json`
- Filesystem dependency: the target snapshot directory must exist and be readable
- Backend dependency: none once the local path is chosen
- UI state dependency: modal state and derived file totals
- Failure mode: directory missing, manifest missing, metadata missing, or counts fall back to zero
- Current user-facing message: "Integrity: Unavailable", "Integrity: Unknown", "Integrity: Not verified", or "Snapshot directory could not be located"

### E. Open report file

- Input: "Open report file" button or toast action
- Source of truth used: the local `.snapshots/last_verification.json` file at the loaded project path
- Filesystem dependency: report file must exist at the active alias root
- Backend dependency: indirect, only through the verifier that wrote the file
- UI state dependency: toast and reveal feedback
- Failure mode: report file exists for one alias but not the alias the renderer loaded
- Current user-facing message: "Verification report unavailable" or "Unable to open verification report"

### F. Reveal

- Input: reveal snapshot directory or manifest
- Source of truth used: local path resolution from the loaded `projectPath`
- Filesystem dependency: reveal target must exist
- Backend dependency: none
- UI state dependency: toast feedback only
- Failure mode: path is derived from a row that no longer exists, or alias resolution points at the wrong tree
- Current user-facing message: "Snapshot directory unavailable", "Snapshot manifest unavailable", or the corresponding "Unable to open..." message

### G. Manifest

- Input: "Manifest" row button
- Source of truth used: `manifest.json` in the resolved snapshot directory
- Filesystem dependency: file must exist and be readable
- Backend dependency: none at click time
- UI state dependency: row expansion and toast feedback
- Failure mode: manifest missing, malformed, or the directory itself missing
- Current user-facing message: "Snapshot manifest unavailable" or a degraded details note

### H. Re-run verification for one snapshot

- Input: row-level "Re-run verification for this snapshot"
- Source of truth used: backend verification run result
- Filesystem dependency: result should be persisted back to the loaded alias root
- Backend dependency: `backup_verifier/run`
- UI state dependency: row spinner, toast, panel refresh
- Failure mode: rerun succeeds on the backend but the UI still reads an older alias root
- Current user-facing message: "Re-running verification" followed by "Latest snapshot verified" or a warning/error

### I. Refresh status

- Input: panel refresh button
- Source of truth used: the same bridge reads as the panel open flow
- Filesystem dependency: report and snapshot directories
- Backend dependency: list/report endpoints if the bridge is proxied through services
- UI state dependency: loading state
- Failure mode: refresh updates one piece of state but not the detail modal or row mapping
- Current user-facing message: "Refreshing verification..." or a health label that no longer matches the local filesystem

### J. Restore latest ZIP as copy

- Input: restore latest ZIP / restore as new copy
- Source of truth used: backend restore validation
- Filesystem dependency: ZIP or restore target must be valid for the selected project root
- Backend dependency: `restoreFromZip` / restore router validation and recovery status updates
- UI state dependency: toast copy and trace ID handling
- Failure mode: the UI implies the latest artifact is restorable while backend validation rejects the request
- Current user-facing message: "Project restore failed" or "Request validation failed" with a trace ID

## Contradiction Matrix

| Contradiction | Likely cause | Affected control | Severity | Phase 13 closure blocker | Proposed phase/pass destination |
| --- | --- | --- | --- | --- | --- |
| Verification report says OK, snapshot directory is missing | Loaded alias drift; report mirrored to one root, renderer reads another | Open report file, refresh status, snapshot details | High | Yes | Phase 14, authority reconciliation |
| Snapshot row says OK, details modal says Integrity unavailable | UI list is derived from report data while the local directory probe fails | View snapshot details | High | Yes | Phase 14, report/path unification |
| `last_verification.json` exists, individual snapshot artifact is missing | Report cached after a path was deleted or never materialized under this alias | Open report file, snapshot badge, details modal | High | Yes | Phase 15, stale/orphaned snapshot detection |
| Snapshot list contains a historical snapshot, manifest is missing | Snapshot directory exists but is partial or pruned | Manifest, reveal, details modal | Medium | Yes | Phase 15, missing-manifest behavior |
| Project root alias points to a different `.snapshots` tree | Canonical root and loaded root diverged, often due to fixture/materializer aliasing | Preload bridge, panel, report action | High | Yes | Phase 14, root alias migration/unification |
| Restore says duplicate will be created, backend rejects validation | UI copy assumes a permissive restore path while backend validates request shape or target root | Restore latest ZIP as copy | High | Yes | Phase 17, backup/restore authority hardening |
| Offline state says browsing remains available, but local artifact is missing | UI local-browse path is available even when the target file was never mirrored to the loaded root | Open report file, reveal, manifest | Medium | Yes | Phase 16, offline authority docs and copy |

## Canonical Truth Recommendation

This section is recommendation only. No implementation is proposed here.

- Snapshot existence should be canonicalized to the on-disk snapshot directory plus the required detail files for the active loaded root.
- Verification status should be canonicalized to the backend report, but the report should be treated as stale or degraded when its referenced artifact paths disappear.
- Report availability should be canonicalized to the readable `last_verification.json` file for the currently loaded project path, not to a global alias cache.
- Restore availability should be canonicalized to backend validation of the requested restore target and the project root that the restore will actually touch.
- Verification reports should be invalidated or explicitly degraded when the artifact paths they reference disappear.
- Stale or orphaned snapshots should remain visible, but they should be marked degraded and their file-backed actions should explain why they are not safe.
- Missing manifests should be shown as degraded, not hidden. Hidden failures make operator recovery harder.
- Aliases should be migrated toward one canonical loaded-root authority. Until that is complete, alias mirroring is acceptable as a compatibility bridge, but divergence should be forbidden.

## TODO Ledger

| ID | Category | Problem | Evidence | Proposed fix direction | Risk if ignored | Suggested phase | Suggested pass | Blocker status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PA26-T01 | Snapshot authority reconciliation | Report, list, and filesystem views can disagree on whether a snapshot is healthy | Human verification saw OK report text alongside missing snapshot directories and unavailable detail views | Define one canonical authority and derive all UI states from it | Operators will keep seeing healthy badges next to broken actions | Phase 14 | Pass 1-2 | blocker | Core unresolved contradiction |
| PA26-T02 | Stale snapshot detection | Cached verification reports can outlive deleted or moved artifact trees | `last_verification.json` can exist while the loaded alias no longer has the target snapshot tree | Mark reports stale/degraded when referenced paths disappear | False confidence in verification results | Phase 14 | Pass 2-3 | blocker | Should feed both panel and restore UI |
| PA26-T03 | Orphaned verification records | Report files may remain after the snapshot directory is pruned or mirrored elsewhere | `.snapshots/last_verification.json` is mirrored across aliases | Decide whether orphaned reports are shown, mirrored, or invalidated | Report says OK while detail modal fails | Phase 15 | Pass 1 | high | Needs a deterministic rule |
| PA26-T04 | Missing manifest behavior | Snapshot dirs can exist without `manifest.json` | SnapshotReader falls back to scanning and can show zero/derived totals | Show degraded state with explicit fallback explanation | Details modal can look empty or misleading | Phase 15 | Pass 2 | high | Should preserve operator trust |
| PA26-T05 | Missing snapshot directory behavior | UI actions can point at a directory that no longer exists | `Snapshot directory could not be located` and `Snapshot directory unavailable` are surfaced today | Keep the error visible and add a stronger classification for deleted vs never-created | Reveal/report actions fail without guidance | Phase 15 | Pass 2 | high | Good candidate for a deterministic contract test |
| PA26-T06 | Root alias migration or unification | `Esther_Estate` and `proj_esther_estate` behave like two authorities | Harness and truth lane both seed alias roots independently | Migrate to a canonical loaded root, mirror only during transition, then forbid divergence | Alias drift will keep resurfacing | Phase 14 | Pass 1 | blocker | Loaded-root authority rule should be explicit |
| PA26-T07 | Details modal degraded-state clarity | Integrity/file count/size can look like "zero" instead of "missing" | Human verification saw `Integrity: Unavailable`, `Files: 0`, `Total size: 0 B` | Distinguish missing, unreadable, empty, and verified-zero states in copy | Operators cannot tell whether the issue is data loss or path mismatch | Phase 16 | Pass 1 | medium | UI copy simplification candidate |
| PA26-T08 | Report availability semantics | The panel can say unavailable while the report exists under a different alias | Preload reads a single `projectPath` root | Make report availability path-aware and alias explicit | Users will keep seeing "unavailable" despite a valid backend report | Phase 14 | Pass 2 | blocker | Must align with loaded-root authority |
| PA26-T09 | Restore latest ZIP validation clarity | Restore-as-copy can fail with request validation even when the operator expects the latest archive to exist | Human verification saw `Project restore failed` and `Request validation failed` | Surface the exact validation rule and the target path in the UI | Restore looks broken instead of constrained | Phase 17 | Pass 1 | high | Keep trace IDs visible |
| PA26-T10 | Local browsing vs verified browsing distinction | Browsing to a local file is not the same as having a verified snapshot/report | Offline behavior improved but still requires authority notes | Keep local browsing available where safe, but label it clearly as unverified | Offline operators may mistake browseability for verified truth | Phase 16 | Pass 2 | medium | Should be reflected in docs and copy |
| PA26-T11 | Fixture/test contract alignment | E2E stubs can satisfy tests while hiding authority drift | Service stubs and fixture materializers seed both aliases | Add contract checks for both aliases and the required snapshot files | CI passes while human verification still fails | Phase 15 | Pass 1 | high | Preserve negative-toast guard |
| PA26-T12 | Truth lane authority scope | Truth lane proves backend/report freshness but not every GUI alias path | `scripts/truth-with-backend.mjs` validates temp roots and report reread | Keep the lane narrow and document what it does not prove | Roadmap decisions may overstate coverage | Phase 19 | Pass 1 | medium | Helpful for future handoff |
| PA26-T13 | Negative-toast guard preservation | Snapshot/report errors should stay visible, not be suppressed | Human verification surfaced the exact failure toasts | Preserve guardrails while changing authority model, not message hiding | Suppressing errors would create silent failure | Phase 15 | Pass 1 | blocker | This is a non-goal for any fix |
| PA26-T14 | Backup/restore authority mapping | Restore flows need the same root/alias map as snapshot verification | Restore failures and validation messages show copy-path drift | Map restore targets to the same canonical authority model as snapshots | Restore will continue to fail in ways that look arbitrary | Phase 17 | Pass 2 | high | Needs a single path policy |
| PA26-T15 | Operator docs update | Existing docs describe some snapshot authority rules but not the current drift | Pass 19/20/21/23/25 docs cover parts of the story, not the full map | Publish one operator-facing map and reuse it in trackers | Operators will keep rediscovering the same contradictions | Phase 19 | Pass 1 | medium | This artifact is the seed |
| PA26-T16 | GUI simplification | Snapshot / Verify / Refresh / Reveal controls are overloaded and overlap conceptually | Pass 15/17 audits and human verification show multiple entry points | Simplify the GUI around one primary snapshot authority surface | More controls mean more places for drift | Phase 16 | Pass 3 | medium | Future UX pass |
| PA26-T17 | Focus button deprecation note | Older GUI surfaces still carry a Focus action that is no longer central to snapshot authority | Earlier audits marked focus as a separate concern | Deprecate or migrate the old Focus control with a clear note | Operators may read outdated controls as current authority | Phase 16 | Pass 3 | low | Documented migration note only |
| PA26-T18 | Phase 14 refactor candidates | Some shared helpers are carrying multiple authority responsibilities | Current code paths mix list, detail, report, and reveal concerns | Consider small authority-helper extraction only after the map is agreed | Future fixes will keep reintroducing duplication | Phase 14 | Pass 4 | low | Refactor only after authority decision |
| PA26-T19 | New GUI migration requirements | New GUI work needs a stable authority contract before promotion | Human verification exposed multiple contradictory states | Define migration gates before any new GUI promotion | New UI could magnify existing contradictions | Phase 18 | Pass 1 | high | Gate item, not a feature request |

## Proposed Future Phase Allocation

| Phase | Purpose | Suggested pass scope |
| --- | --- | --- |
| Phase 13 remaining closure | Finish Pass 26 handoff, keep the current audit boundary intact, and do not close the phase until the handoff is reviewed | Pass 26 artifact review only |
| Phase 14 | Authority reconciliation and refactor planning | Canonical truth decision, alias unification, report invalidation rules |
| Phase 15 | Test-harness and fixture hardening | Contract tests for stale/orphan/missing-file cases, fixture alignment, negative-toast guard preservation |
| Phase 16 | GUI simplification and operator UX | Snapshot/Verify/Refresh surface simplification, clearer degraded copy, focus deprecation note |
| Phase 17 | Backup/restore authority hardening | Restore copy validation, trace ID clarity, exact target-path semantics |
| Phase 18 | New GUI migration gate | Promotion rules for future GUI surfaces, authority preconditions, deprecation gates |
| Phase 19 | Roadmap / deferred ledger reconciliation | Merge this TODO inventory back into the broader roadmap and close out duplicated notes |
| Phase 20+ | Research or feature gates | Any future expansion must wait for the authority map to stabilize |

## Pass 25 Human Verification Outcome Summary

Human verification was partially successful. It proved the product can still expose explicit authority drift even while CI remains green. It did not constitute release signoff.

What it proved:

- snapshot list health, detail modal health, and report availability are not yet controlled by one canonical authority
- alias roots can diverge from the loaded project path
- restore/copy behavior can fail on backend validation even when the GUI copy suggests the artifact should exist

What it did not prove:

- that the current CI contract is closure-grade for real operator use
- that the report JSON and the local filesystem tree always agree
- that backup/restore semantics are documented well enough for the new GUI authority model

This evidence is sufficient to create Pass 26 and the authority map. Phase 13 closure should wait until the TODO ledger and handoff are reviewed.

## Recommended Next Thread Handoff Inputs

- current branch: `phase-b2-memory-lab`
- latest green CI status for the harness repair work
- the unresolved human-verification screenshots and toast text for the snapshot/report/restore contradictions
- this Pass 26 authority map
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/phases/phase13_audit_trust_validation_plan.md`
- the existing Pass 19, 20, 21, 23, 24, and 25 audit artifacts
- instruction to build a full phase/pass roadmap from the TODO ledger rather than jumping to implementation

## Stop Conditions

- No Phase 13 closure until this TODO ledger and handoff are reviewed.
- No new GUI promotion until the authority model is reconciled or consciously deferred.
- No snapshot or report suppressions unless they are documented as degraded-state behavior.
- No silent alias mirroring beyond the documented compatibility window.

