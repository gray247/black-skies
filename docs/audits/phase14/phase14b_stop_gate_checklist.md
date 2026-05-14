# Phase 14B Stop-Gate Checklist

Status: Produced
Canonical role: Mandatory stop-gate and rollback checklist for bounded `Phase 14B` implementation work.
Scope: Define when `14B` implementation may proceed, when it must stop, when operator verification becomes mandatory, what truth claims are forbidden, and when rollback is required.
Owns: `14B` implementation stop gates, mandatory human-verification gates, rollback conditions, forbidden claim categories, and checkpoint definitions for stale-state, continuity, restore, preload, and truth-lane-sensitive work.
Does not own: Runtime implementation, restore or continuity fixes, human-verification execution, phase sequencing, or closure-grade evidence review.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

`14B` is the first phase where semantic drift can become runtime regression.

This checklist exists so future implementation `/goals` stop before they overclaim truth, broaden beyond their slice, or trespass into operator-only proof.

## Implementation Stop Gates

Stop implementation immediately if any of these occur:

- a slice starts requiring continuity fixes that were not declared in scope
- a slice starts requiring restore-behavior changes that were not declared in scope
- a slice starts requiring preload or renderer rebind changes beyond its planned boundary
- a slice would need to redefine accepted `14A` semantics rather than align behavior to them
- local persisted-report reads and routed persisted-report reads stop agreeing on `A3` historical-only semantics
- the current tracker state contradicts the slice assumptions about wrapper/CWD, continuity, or required proof lanes
- truth-lane, harness, synthetic, or stub evidence is being used as if it were closure-grade runtime proof
- the implementation needs a human-verification-backed claim to continue honestly

## Mandatory Human-Verification Gates

Operator verification becomes mandatory before claiming success on any slice that changes:

- project-switch cleanliness
- reload or reopen continuity
- floating-pane reload or rebind correctness
- restore-latest user-visible trust behavior
- recovery or crash-reopen trust behavior
- degraded-state operator-facing correctness
- reveal, browse, or report actions when the visible trust claim is part of the slice contract

## Rollback Conditions

Rollback is required if implementation introduces any of these conditions:

- renderer labels imply stronger truth than current `A1` or `A2` evidence supports
- restore or backup flows imply safety from browseability, historical reports, or UI presence alone
- report access, report wording, or snapshot detail wording implies that a persisted verification record is current runtime truth
- cross-project contamination or stale local state appears where the prior baseline did not show it
- alias-root handling regresses and causes path-identity drift in the implemented slice
- preload or bridge behavior makes harness-only continuity appear equivalent to live continuity
- a bounded slice cannot remain bounded and starts forcing coupled changes across restore, continuity, preload, and renderer surfaces

## Forbidden Truth Claims

Future `14B` implementation must not claim:

- `verified` without claim scope
- current integrity from `A3` historical evidence alone
- local or routed `last_verification.json` reads as if they were current-run truth without explicit `A3` historical-only framing
- restore readiness from browseability or report presence
- continuity correctness from truth-lane or harness success alone
- project identity stability from cached localStorage or session state alone
- preload or renderer witness state as if it were live filesystem or backend truth

## Forbidden Closure Claims

Future `14B` implementation must not claim:

- Phase 14 closure
- continuity closure
- restore safety closure
- preload or renderer authority closure
- human-verification completion
- truth-lane realism closure
- harness realism closure

## Checkpoint Matrix

| Checkpoint family | Trigger | Required evidence before proceeding | Stop condition | Rollback trigger |
| --- | --- | --- | --- | --- |
| persisted-record-sensitive | slice touches `last_verification.json` reads, `report_observation` injection, or local-vs-routed report surfaces | explicit statement whether the claim comes from a current runtime run, persisted record, or renderer witness | local and routed reads stop agreeing on `A3` semantics or a persisted record starts reading as current truth | historical report access begins implying current integrity, freshness, or restore readiness |
| stale-state-sensitive | slice touches report rereads, localStorage, cached project summary, draft-preview state, or reopen state | explicit stale-state handling note plus correct authority-layer labeling | stale state starts standing in for current authority truth | stale or carried state changes visible truth incorrectly |
| continuity-sensitive | slice touches project load, project switch, reload, recovery, or post-action rebind | explicit continuity dependency note and later human-verification plan | slice starts needing real continuity proof to continue honestly | project-switch, reload, or reopen behavior regresses |
| restore-sensitive | slice touches restore copy, restore button gating, restore result copy, or backup restore semantics | explicit restore-sensitive scope note and separation from browseability/history | restore safety would need to be claimed before dedicated checkpoints exist | restore trust messaging or gating regresses |
| preload/rebind-sensitive | slice touches bridge wording, bridge routing, preload helpers, or renderer rebind logic | explicit harness/truth-lane limitation note and bounded scope | harness-only evidence becomes the strongest evidence for the claim | live runtime and harness views diverge materially |
| truth-lane limitation | slice wants to use truth-lane success as the main proof | lane limitation statement plus matching runtime authority class | truth-lane evidence is being overread as runtime closure | runtime contradiction appears despite lane success |

## When Implementation `/goals` Must Stop

Implementation `/goals` must stop before continuing if:

- the next required claim is operator-observed rather than repo-provable
- the slice would need a continuity-sensitive or restore-sensitive proof step that is not yet executed
- the slice starts touching more than one high-risk seam family at once
- wrapper/CWD or environment ambiguity makes local validation non-deterministic
- human-verification receipt fields would be needed to defend the claim honestly

## When Runtime Reconciliation May Proceed

Runtime reconciliation may proceed only when:

- `14A` acceptance is recorded
- the implementation slice is explicitly named and bounded
- affected `RDM-*` owners are named
- command/root/shell assumptions are explicit where relevant
- the slice does not require immediate operator verification to keep going honestly
- rollback boundaries are explicit before edits begin

## When Rollback Is Required

Rollback is required when:

- a slice broadens beyond its declared seam family
- user-visible trust language becomes less precise than the accepted semantic baseline
- the implementation cannot preserve the distinction between historical, current, browseable, restorable, stale, orphaned, degraded, or missing-artifact states
- a lane that is only `A5`, `A6`, or `A7` becomes the strongest available support for an `A1` or `A2` claim
- the implementation would force operator acceptance of new runtime truth without planned checkpoints

## Practical Enforcement Notes

- Small docs-only or mapping `/goals` can continue without operator checkpoints.
- Bounded implementation `/goals` may proceed only one slice at a time.
- Broad implementation `/goals` spanning backend, preload, renderer, restore, and continuity together remain out of bounds.
- `14B.2` and `14B.3` now establish that verification-record wording and report access are still non-closure surfaces; `14B.4` must not silently upgrade them into restore or continuity proof.
- Human verification is a hard stop, not a soft reminder, whenever the claim depends on operator-visible continuity or restore trust.
