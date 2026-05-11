# Phase 13 Pass 17 - GUI Interaction Authority Audit

## A. Full GUI Interaction Inventory

The default flag-off GUI still contains a broad interaction surface. The exhaustive family-by-family inventory from Pass 15 remains the canonical row-level map; this pass revalidated the authority boundaries and the highest-risk controls against the current runtime.

Current totals:
- Visible interactive control families: 59
- Registry-only command actions: 10
- Covered by Playwright: 19
- Covered by renderer/unit tests: 32
- Covered by truth lane: 3

Primary authority classes:
- backend-mutating controls: create snapshot, verify snapshots, generate, critique, export, create backup, restore backup, restore ZIP copy
- local/file-system controls: open snapshots panel, open report file, reveal, manifest, snapshot details, toast actions that reopen UI state
- state-sync controls: refresh status, re-run verification, sync draft view, panel focus/expand/float/close, recent project selection
- display-only metadata: service health pill/banner, command registry metadata, narrative overview facts, inactive placeholder panels

## B. Coverage Matrix

| Surface | Family | Authority | Playwright | Unit | Truth lane | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Workspace header | Snapshot / Verify / Snapshots / Export | backend + panel open | Partial/Yes | Yes | No | High |
| Project home | Open project / recents / diagnostics | local + project-load | Partial | Yes | No | Medium |
| Preflight | Generate / Proceed / Close | backend + modal | Yes | Yes | Yes | Medium |
| Critique modal | Generate saved rewrite / Sync draft view / Close preview | backend-save + local-sync | Yes | Yes | Yes | High |
| Recovery banner | Restore snapshot / Reopen / Refresh | recovery state | Partial | Yes | No | Medium |
| Dock panes | Expand / Close / Float / Focus | layout authority | Yes | Yes | No | Medium |
| Snapshots panel | Refresh status / Run verification / Open report file | mixed | Partial | Yes | No | High |
| Snapshot rows | Reveal / Manifest / View details / Re-run verification | mixed | Partial | Yes | No | High |
| Backups | Create backup / Restore backup / Restore latest ZIP as copy | backend | No | Yes | No | High |
| Toast actions | Open snapshots panel / View snapshot details / recovery toasts | mixed | Yes | Partial | No | High |

## C. High-Risk Controls

Still the most fragile controls:
- `Open report file`
- `Reveal`
- `Manifest`
- `View snapshot details`
- `Re-run verification for this snapshot`
- `Refresh status`
- `Create backup`
- `Restore backup` row actions
- `Restore latest ZIP as copy`
- `Focus` on dock panes, but this is a separate authority problem and not currently blocked by snapshot work

Controls that can silently fail or confuse operators:
- any action that opens a file browser path without verifying existence first
- any action that mutates service state but has only a toast-level success indicator
- any action whose visible label implies a report/file exists when the underlying authority is just a panel reopen
- any action whose enabled state is driven by `serviceStatus` even though the action is local-only

## D. Root-Cause Findings

1. Shared service-health state is still the primary source of backend availability truth.
- `Writing tools offline` is not snapshot-specific.
- `Request timed out after 45000ms` is a bridge timeout, not a snapshot authority failure.

2. Local snapshot browsing had been incorrectly coupled to backend health.
- That was repaired for `Open report file`.
- `Reveal`, `Manifest`, and `View snapshot details` already use local path validation and should remain local-only.

3. Snapshot freshness confusion is fundamentally a refresh-authority problem.
- The mounted snapshots panel must be refreshed after snapshot creation and verification.
- External file changes can still desync the renderer until refresh is triggered.

4. Report authority is now mostly canonical, but still split across renderer + preload + backend.
- Canonical report file: `.snapshots/last_verification.json`
- Backend persistence: `run_backup_verifier` writes that report
- Renderer reading: `snapshotReader.ts` and `revealPathFeedback.ts`
- Toast/file action: `App.tsx` and `SnapshotsPanel.tsx`

5. Modal reliability remains dependent on clean path hydration and snapshot metadata availability.
- Missing metadata paths are now surfaced as controlled errors.
- Blank/white modal risk has been reduced by explicit styling, but async/race behavior still deserves higher coverage.

## E. Recommended Repair Plan

1. Add targeted Playwright assertions for the remaining snapshot controls.
- `Open report file`
- `Reveal`
- `Manifest`
- `Refresh status`
- `Re-run verification for this snapshot`

2. Add renderer tests for missing-path fallbacks and stale-state refresh.
- report unavailable
- snapshot directory unavailable
- stale list refresh after create / verify
- stale `Last check` update after rerun

3. Keep backend-gated controls disabled when the service bridge is truly offline.
- snapshot creation
- verification
- backups
- restore copy

4. Keep local-file browsing available when the report/directory exists, even if backend health is degraded.

## F. Recommended Refactor Plan

The current code works, but authority is still duplicated.

Refactor candidates:
- centralize snapshot/report path resolution into one helper that both `App.tsx` and `SnapshotsPanel.tsx` use
- centralize service-offline copy so local browsing is not conflated with backend downtime
- centralize verification/report refresh into a single panel authority helper
- extract shared missing-path toast builders for reveal/report/manifest failures
- reduce brittle snapshot-row selectors by standardizing data-testid names for the row and actions

Safe now:
- small helper extraction for repeated missing-path error text
- small test-ID normalization
- explicit refresh-token handling around snapshot create/verify

Later or frozen:
- broader toolbar consolidation
- command-surface redesign
- any default GUI switch

## G. Documentation Gaps

- `phase15` and `phase16` capture the important facts, but the repo still lacks a single operator-grade explanation of:
  - local browsing versus backend availability
  - what `Writing tools offline` actually means
  - which snapshot actions are local and which are backend-mutating
- The truth lane does not yet document snapshot/report authority at the same depth as editorial workflows.
- The operator checklist still needs a clearer “what can I do while services are offline?” section.

## H. Suggested Future Phase 13 Passes

1. Snapshot file-browser end-to-end hardening
- Goal: prove `Open report file`, `Reveal`, and `Manifest` across success and missing-path cases.
- Validation: Playwright + renderer tests.

2. Snapshot freshness / refresh authority pass
- Goal: prove create + verify always refresh the mounted panel and the newest snapshot is visible.
- Validation: renderer tests + Playwright smoke.

3. Offline/local-action authority pass
- Goal: prove local browsing remains available when backend health is degraded, but backend-mutation actions stay disabled.
- Validation: renderer tests + focused UI behavior assertions.

4. Truth-lane expansion pass
- Goal: add at least one controlled snapshot/report authority lane to the truth harness.
- Validation: truth lane + backend contract checks.

## I. Suggested Future Phase 14 Priorities

- operator-grade verification checklist completion
- Playwright assertions for report/file-browser control paths
- snapshot/report authority cleanup if duplicate logic remains
- stale-state / refresh-authority smoke for the snapshots panel
- documentation alignment for service-health versus local-file behavior

## J. GUI Authority Trust Statement

The GUI authority model is **better than before, but not fully trustworthy yet**.

What is trustworthy:
- backend-gated actions are now more truthful and less likely to poison local browsing
- report/path failures are surfaced more clearly
- snapshot list refresh after create/verify is now explicit

What is not yet fully trustworthy:
- the snapshot interaction surface still has several controls with weak e2e coverage
- Playwright still misses some behavior-critical file-browser outcomes
- the truth lane is still too shallow on snapshot/report authority
- duplicated authority logic still exists across renderer, preload, and backend layers

Bottom line:
- the snapshot/report authority model is **serviceable**, not **fully hardened**
- it should not be treated as closure-grade until the remaining high-risk controls are behavior-verified
