# Phase 14C Operator Execution Guide

Status: Ready for operator execution.
Scope: Human verification only. No runtime fixes, no test creation, no claim of closure.
Audience: Operator running the Phase 14C receipt bundle.

## Preflight Checklist

Before starting:

1. Confirm the worktree is clean or record the exact dirty state in the receipt packet.
2. Confirm the branch and commit hash you are starting from.
3. Confirm the project root you will use for each receipt.
4. Confirm whether each receipt will use a real local project or fixture comparison evidence.
5. Confirm screenshots are operator evidence by default and are not repo-tracked unless a specific failure must be preserved as canonical audit evidence.
6. Confirm destructive or chaotic crash testing is deferred to Phase 15.
7. Confirm floating-pane reload/rebind is observation-only in 14C and must not be fixed during receipt execution.
8. Confirm restore-latest has its own dedicated receipt section.
9. Record any seeded `localStorage` or session state before opening the app.

## Execution Order

Run the receipts in this order:

1. Project load
2. Project switch
3. Recovery snapshot restore
4. ZIP restore-as-copy
5. Backup restore
6. Restore-latest
7. Reopen after restore
8. Continuity after restore
9. Degraded restore state
10. Stale verification/report state
11. Reveal/open/report affordance behavior
12. Floating-pane reload/rebind observation
13. Preload/runtime/renderer agreement
14. Light recovery observation

If a receipt is blocked, record the block and stop the bundle if continuing would make later receipts misleading.

## What To Observe

For every receipt, observe:

- the visible wording
- the authority layer implied by the UI
- whether the claim is about current runtime state or persisted/report state
- whether a project reopen, switch, or restore changes the visible project identity
- whether stale state survives when it should not
- whether degraded surfaces stay honestly degraded
- whether preload, renderer, and runtime agree in the live session
- whether floating panes rebind to the current project after reload

## What Not To Claim

Do not claim:

- that a screenshot proves trust beyond the current visible authority layer
- that a restore is safe just because a snapshot, backup, or report exists
- that browseability means current validity
- that fixture evidence closes a real operator trust claim
- that a single clean surface proves continuity everywhere
- that a deterministic recovery observation generalizes to destructive crash recovery
- that a floating pane opening successfully proves it rebounded correctly

## Screenshot And Log Guidance

- Capture screenshots for each observed state transition that matters to the claim.
- Keep screenshots grouped by receipt section.
- Do not repo-track screenshots by default.
- Add log references when the UI wording, backend response, or bridge state is needed to explain the result.
- If a failure is severe enough to become permanent audit evidence, note that explicitly before promoting the screenshot into repo-tracked documentation.

## Reset And Cleanup Guidance

- Start each bundle from a known clean app state.
- Close and reopen the app between restore and continuity bundles if you need to prove reopen behavior.
- Clear local renderer state only when the receipt does not depend on preserved state.
- Record any intentionally preserved localStorage, session storage, or workspace state.
- Do not mix fixture and real-project evidence in the same claim unless the receipt packet explicitly treats fixture evidence as comparison-only.

## Stop Conditions

Stop the run and record escalation if:

- the UI starts implying stronger trust than the evidence supports
- current-run evidence becomes indistinguishable from persisted/report evidence
- a restore or continuity path becomes visually ambiguous
- a receipt starts requiring implementation changes instead of observation
- the result would need Phase 15 crash testing to become trustworthy
- the floating-pane reload/rebind observation contradicts the current 14B assumptions

## Recording Pass / Fail / Blocked

For each receipt, record one of:

- `Pass`
- `Fail`
- `Blocked`
- `Not run` only in the blank scaffold, not in a completed receipt bundle

Record the primary failure bucket if the receipt fails. Use one bucket only unless the operator explicitly documents a second contradiction as follow-up.

## Where To Paste Results

Paste completed receipt outcomes into:

- `docs/audits/phase14/phase14c_operator_receipt_results.md`

If a failure needs follow-up tracking, add the relevant `RDM-*` identifier in the receipt row and note the follow-up in the tracker.

## Operator Claims Boundaries

Real local projects are required for authority and continuity closure claims.
Fixtures may be used only as secondary comparison evidence.
Restore-latest has its own receipt section and cannot be folded into a different restore receipt.
Floating-pane reload/rebind is mandatory observation-only verification in 14C.
Destructive crash testing remains deferred to Phase 15.
