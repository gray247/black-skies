Status: Proposed closeout
Date: 2026-03-19

# Phase 8 Closeout

Purpose: define the completion line for the Phase 8 editorial-control workflow, record what shipped, record what was intentionally deferred, and provide the bug/risk ledger and manual verification checklist required before Phase 9 begins.

## Phase 8 Completion Line

Phase 8 is closed when all of the following are true:
- the stable editorial baseline remains unchanged:
  - rescue model `gpt-5.4-mini`
  - rescue strategy `slot_patch`
  - clean bounded sample `6/10`
  - adversarial bounded sample `5/5`
- unresolved generation-side editorial misses are visible to writers through persisted project data
- carryover approval is separated from editorial flagging
- the writer can:
  - inspect why a scene is flagged
  - accept the current text
  - mark a scene for manual rewrite
  - clear the manual-review mark
  - request one bounded local repair retry
- persisted editorial workflow state survives project reload
- renderer, IPC, service-route, and Playwright coverage exist for the shipped workflow
- any remaining issues are either fixed or explicitly documented below

## What Phase 8 Includes

Shipped in Phase 8 closeout scope:
- `review_snapshot` exposure for unresolved editorial rescue misses
- `carryover_snapshot` exposure with explicit carryover risk handling
- carryover gating:
  - `safe`
  - `restricted`
  - `blocked_pending_review`
- renderer editorial review panel and scene-list review badges
- fully wired writer actions:
  - `show_flag_reason`
  - `accept_current_text`
  - `mark_for_manual_rewrite`
  - `clear_manual_review_mark`
  - `regenerate_local_repair`
- persisted accepted-review state
- persisted manual-review state
- persisted retry-action state for single-use local retry
- Playwright end-to-end coverage for the editorial workflow, including retry

## Intentionally Deferred

Deferred by choice, not by accident:
- rescue model or rescue strategy changes
- additional rescue-generation experimentation
- broader editor redesign
- background automation or silent retry on reload
- multi-attempt retry loops
- phase-9 analytics and dashboard work

## Stable Baseline Behavior

Current stable editorial baseline:
- rescue model: `gpt-5.4-mini`
- rescue strategy: `slot_patch`
- unresolved generation-side rescue misses are handled at the product layer rather than by more rescue-strategy churn

Effective writer-facing states:
- `Flagged`
- `Accepted`
- `Manual review`
- `Retry succeeded`
- `Still flagged`
- `Retry failed`

Carryover state remains separate from editorial review state:
- `carryover_risk`
- `carryover_mode`
- `carryover_allowed`

## Fixed In Phase 8

- persisted editorial review metadata now loads through the real project loader
- accepted current text persists and upgrades effective carryover to `safe` / `allowed`
- manual-review marks persist and reload cleanly
- original failure class and review reason remain visible for audit after accept/manual/retry actions
- local retry is limited to one attempt per flagged state
- Playwright editorial-review flow now uses a real temp fixture and the real loader path
- Playwright local retry now uses the same service-port fallback path as the rest of the app harness

## Bug / Risk Ledger

### Fixed

- stale docs that still described `regenerate_local_repair` as unwired
- Playwright editorial-review retry flow failing because main-process retry IPC only looked at `BLACKSKIES_SERVICES_PORT`
- Playwright editorial-review fixture nondeterminism caused by forcing a reload instead of using the normal project-open path

### Known issue

- `ProjectHome.tsx` remains a large coordination surface even after helper extraction. It is stable enough for Phase 8 closeout, but further renderer decomposition should happen before Phase 9 expands writer-side UI further.

### Deferred by choice

- broader decomposition of `app/main/projectLoaderIpc.ts`
- richer retry history beyond the current single persisted retry-action state
- more nuanced acceptance/manual-review policy combinations
- additional user-facing explanation copy/tooltips for all carryover modes

### Flaky / uncertain

- Electron e2e still depends on packaged renderer output and local temp-project copies. The workflow is now green, but the harness remains more brittle than pure component or IPC tests.

### Technical debt / refactor candidate

- [ProjectHome.tsx](C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx)
  - still owns loading, recents, diagnostics, draft display, and editorial workflow UI in one file
- [projectLoaderIpc.ts](C:/Dev/black-skies/app/main/projectLoaderIpc.ts)
  - mixes loader behavior, persisted editorial state, and retry orchestration
- docs still contain some older Phase 8 wording that describes the broader experimental rescue period; those historical notes are acceptable, but future docs should point here for the closeout baseline

## Manual Verification Checklist

Run these in the packaged app before Phase 9 starts:

1. Open a project with a flagged scene.
2. Confirm the scene list shows:
   - flagged badge/status
   - carryover mode
3. Select the flagged scene and confirm the editorial review panel shows:
   - failure class
   - carryover state
   - available writer actions
4. Click `Show Flag Reason` and confirm:
   - summary appears
   - `why_flagged` appears
   - `targeted_lines` appears
   - carryover risk block appears
5. Click `Hide Flag Reason` and confirm the detailed rationale collapses.
6. Click `Mark For Manual Rewrite` and confirm:
   - manual-review state is visible
   - the scene badge changes
   - `Clear Manual Review Mark` is available
7. Reload the app or reopen the project and confirm the manual-review mark persists.
8. Click `Clear Manual Review Mark` and confirm:
   - flagged state returns
   - manual-review marker disappears
9. Click `Accept Current Text` and confirm:
   - accepted state is visibly distinct
   - original failure class remains visible for audit
   - carryover changes to `safe` / `allowed`
10. Reload the app or reopen the project and confirm the accepted state persists.
11. Start from an unresolved flagged scene and click `Retry Local Repair`.
12. Confirm the UI shows one of:
   - `Retry succeeded`
   - `Still flagged`
   - `Retry failed`
13. Confirm the original flag reason can still be revealed after retry.
14. Confirm carryover state after retry matches the persisted retry result.
15. Reload the app or reopen the project and confirm retry state persists.
16. Confirm a second retry is not offered for the same unchanged flagged state.
17. Confirm accepted scenes do not present the same unresolved action posture.
18. Confirm manual-review and accepted states do not silently erase the original audit trail.

## Go / No-Go Read

Go for Phase 9 if:
- the tests listed in the closeout summary remain green
- the manual checklist above passes
- no new deterministic workflow bug appears in accepted/manual/retry persistence

Do not start Phase 9 if:
- the persisted editorial state becomes inconsistent across reload
- carryover state no longer matches accepted/retry outcomes
- the Playwright editorial workflow stops passing end to end
