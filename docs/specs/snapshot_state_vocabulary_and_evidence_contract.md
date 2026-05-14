Status: Produced
Last Reviewed: Not yet reviewed.
Owner: Phase 14 Authority Reconciliation planning

# Snapshot State Vocabulary And Evidence Contract

## Purpose

This spec is the execution-readiness home for `Phase 14A.1 - Snapshot State Vocabulary and Evidence Contract`.

It exists because governance readiness does not define the vocabulary itself, and the existing specs do not cleanly own snapshot-state authority semantics:

- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md) is the backend/runtime baseline, not a snapshot-authority contract
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md) owns workflow sequencing, not filesystem/report authority semantics
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md) owns error-surface behavior, not snapshot-state ontology

This artifact is planning-ready only. It does not implement behavior.

## Phase 14A.1 Readiness Packet

| Field | Value |
| --- | --- |
| Phase/slice name | `Phase 14A.1 - Snapshot State Vocabulary and Evidence Contract` |
| Status | `Produced` |
| Owned scope | snapshot state vocabulary and evidence contract only |
| Non-goals | no production behavior changes; no restore implementation; no GUI redesign; no test implementation; no `Phase 14B` alignment; no alias migration implementation |
| Source IDs | `P2-SNAP-001`, `P2-REPORT-001`, `P2-ALIAS-001`, `P2-DEGRADE-001`, `P2-DOCS-001`, `PA26-T01`, `PA26-T02`, `PA26-T04`, `PA26-T05`, `PA26-T06` |
| RDM inputs | `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-SNAP-003`, `RDM-ALIAS-001`, `RDM-GUI-001`, `RDM-DOCS-001` |
| Authority references | [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md) |
| Candidate affected surfaces | snapshot/report docs and specs; backend snapshot/report state model; preload path/report action surfaces; renderer snapshot row/details/modal surfaces; truth-lane assertions; Playwright snapshot witness flow; human verification checklist |
| Validation method | docs/spec review first; later implementation validation belongs to `Phase 14B` and `Phase 14C` |
| Human verification need | note now; direct rerun after implementation alignment, not during this vocabulary-only pass |

## Vocabulary Normalization Rules

- `verified` is a scoped claim, not a blanket health badge.
- `historical-only` is required when the strongest available support is persisted-record evidence at `A3`.
- `browseable` is a local-access claim only; it does not certify freshness, integrity, or restore eligibility.
- `restorable` belongs to the restore contract in Phase 15, not to snapshot vocabulary shortcuts in `14A.1`.
- `integrity-valid` requires current supporting evidence, not remembered or displayed state.
- `integrity-unavailable` must remain distinct from corruption, fatal failure, or permanent loss.
- `stale`, `orphaned`, `missing-directory`, and `missing-manifest` must stay distinguishable.
- `degraded` is a reduced-confidence family of states, not a boolean synonym for broken/not-broken.

## Vocabulary Candidates

| Term | Plain definition | Required evidence class | Authority layer required | Must not imply | Likely UI/operator meaning | Future implementation owner phase/pass |
| --- | --- | --- | --- | --- | --- | --- |
| `verified` | A verification result exists and the scoped claim has the required current evidence behind it at the time of the claim | backend/runtime evidence plus filesystem evidence when filesystem truth is claimed | `A2` and `A1` when applicable | that every related file, directory, report, alias root, browse action, or restore action is safe by default | this exact claim was checked at the correct layer, not merely remembered or rendered | `Phase 14A.1`, `14A.2`, `14B.4` |
| `historical-only` | A persisted verification record exists, but the strongest available support is still historical record evidence rather than current authority evidence | persisted-record evidence | `A3` | current integrity, current filesystem existence, current freshness, or restore safety | a record exists, but it does not prove the present state by itself | `Phase 14A.1`, `14A.4` |
| `stale` | A stored state or report no longer has enough current backing evidence to be treated as present-state truth | persisted-record evidence plus contradictory or missing current filesystem/runtime evidence | `A3` plus `A1` or `A2` contradiction | current OK status, current integrity, or current restore-readiness | this information may describe the past correctly, but it is not current enough to trust now | `Phase 14A.1`, `14A.4`, `14B.4` |
| `orphaned` | A record, report, or reference still exists, but the artifact or target it refers to is missing, detached, or no longer coherent with the active root | persisted-record evidence plus missing or detached filesystem evidence | `A3` plus `A1` | that the orphaned record is still actionable, fresh, or root-correct | this record points at something the app cannot currently back up with local truth at the active root | `Phase 14A.1`, `14A.4`, `14B.4` |
| `missing-directory` | The expected snapshot directory does not exist at the active loaded root | filesystem evidence | `A1` | manifest absence, report staleness, or backend failure by itself | the folder the UI expects is not there now | `Phase 14A.1`, `14B.4` |
| `missing-manifest` | The snapshot directory exists, but the expected manifest file is absent or unreadable for the scoped manifest claim | filesystem evidence | `A1` | missing directory, verified report freshness, invalid restore by itself, or zero-file snapshot | the snapshot directory exists, but its expected manifest authority is incomplete | `Phase 14A.1`, `14B.4` |
| `browseable` | A local file or directory can be opened, revealed, or inspected from the current environment | filesystem evidence with optional UI witness | `A1` and `A4` witness only | verified, current integrity, report freshness, or restorable safety | you can open the thing locally; that does not certify its authority, health, or restore eligibility | `Phase 14A.1`, `Phase 15`, `Phase 17` |
| `restorable` | A restore path has passed the restore-specific eligibility contract for the scoped action | backend/runtime evidence plus any required filesystem checks | `A2` and `A1` when applicable | browseable, verified, or backup existence alone | the restore action is currently allowed under the restore contract | `Phase 15` |
| `integrity-valid` | The current artifact passed the required integrity checks for the scoped claim under current authority evidence | current backend/runtime evidence and filesystem evidence | `A2` and `A1` | historical verification only, clean UI badge only, browseability, or restored path safety | current integrity checks passed for this claim now | `Phase 14A.1`, `14B.1`, `14B.4` |
| `integrity-unavailable` | The system cannot currently establish current integrity from the required evidence layers for the scoped claim | missing or contradictory current evidence | `A1` and/or `A2` missing, with `A4` witness possible | that the artifact is permanently broken, safe to restore, or disproven historically | the app cannot currently verify integrity from the right live layers | `Phase 14A.1`, `14B.4`, `Phase 17` |
| `degraded` | The system is operating with reduced confidence, reduced capability, missing supporting artifacts, or contradictory supporting signals that must be surfaced explicitly | current contradictory or incomplete evidence | depends on the degraded condition; typically `A1`, `A2`, `A3`, `A4` | a generic failure, a boolean broken/not-broken state, safe restore, or silent success | something remains available, but trust, freshness, or completeness is reduced in a way the operator should see | `Phase 14A.1`, `Phase 17` |
| `report-fresh` | The persisted verification report still matches the current loaded-root artifact state closely enough for its scoped claim after current checks | persisted-record evidence validated by current runtime/filesystem checks | `A3` plus `A1` and/or `A2` | that all UI actions are valid, that restore is safe, or that every alias root agrees | the stored report is current enough for this specific claim at this root | `Phase 14A.1`, `14A.4`, `14B.4` |
| `report-stale` | The persisted verification report no longer has enough current backing evidence to be treated as present-state truth | persisted-record evidence contradicted by current checks | `A3` plus contradictory `A1` and/or `A2` | current OK, current integrity, or local action safety | the report is old or mismatched against the current state | `Phase 14A.1`, `14A.4`, `14B.4` |
| `alias-divergent` | Different project roots or aliases produce materially different snapshot/report truth for the same project identity | filesystem evidence, persisted-record evidence, and UI witness as needed | `A1`, `A3`, `A4` | that either alias can be trusted interchangeably | the current loaded root and the stored/canonical root disagree | `Phase 14A.1`, `14A.3`, `14B.5` |

## Evidence Contract

| Claim type | Required evidence | Authority layer requirement | Must not be closed by |
| --- | --- | --- | --- |
| filesystem existence | filesystem evidence | `A1` | renderer state alone, report record alone, harness state alone |
| backend verification run occurred | backend/runtime evidence | `A2` | renderer badge alone or CI-only evidence |
| persisted verification record exists | persisted-record evidence | `A3` | inferred history or UI copy alone |
| renderer displays a state | UI witness evidence | `A4` | assumed filesystem truth |
| harness/fixture behavior | harness evidence | `A5` | product-truth claims outside harness scope |
| synthetic-mode result | synthetic evidence | `A6` | real runtime truth or restore safety claims |
| mock/stub behavior | mock/stub evidence | `A7` | operational safety or authority closure claims |
| historical verification | persisted-record evidence, optionally supported by docs/history | `A3` | current integrity or current existence claims |
| alias divergence | filesystem evidence plus persisted-record or UI witness as support | `A1` with `A3`/`A4` supporting | historical records alone |
| browseable claim | filesystem evidence with optional UI witness | `A1`, `A4` witness only | verified/restorable implication |
| restorable claim | backend/runtime evidence plus required filesystem checks | `A2` and `A1` | browseability, report freshness, or UI label alone |

### Contract Rules

- filesystem existence requires `A1` evidence
- backend verification requires `A2` evidence
- persisted verification record is `A3` historical evidence
- renderer display is `A4` witness evidence
- harness state is `A5` scoped evidence only
- synthetic mode cannot prove real runtime behavior
- `A4` must not upgrade `A3` historical evidence into `A1` or `A2` truth
- `A3` historical evidence must not silently imply current integrity, current freshness, or restore readiness
- browseable state must not silently imply restorable state
- restore-ready language must not silently imply integrity-valid state
- degraded state must remain a typed reduced-confidence condition, not a universal fallback verdict
- restore safety is out of scope for this pass and must not be implied by snapshot vocabulary alone

## Known Terminology Drift

### Overloaded Or Contradictory Language

- `verified`
  - still appears in historical and UI-adjacent language as if it were a blanket health claim rather than a scoped claim
- `verification report`
  - can sound current even when the strongest support is only `A3` persisted-record evidence
- `Latest snapshot verified`
  - likely UI wording drift because it can imply current integrity-valid status rather than a scoped verification result
- `No snapshots verified`
  - can blur the distinction between “no current report”, “no fresh report”, and “no snapshot has current verification support”
- `Verification issues detected`
  - useful as a warning surface, but too broad to distinguish stale, orphaned, missing-manifest, and integrity-unavailable conditions
- `integrity`
  - backend naming is narrower and more current-evidence-oriented than some renderer-facing summary text suggests

### Future Cleanup Candidates

- align renderer snapshot-status labels with `verified`, `historical-only`, `integrity-valid`, and `integrity-unavailable`
- align report wording with `report-fresh` versus `report-stale`
- align local browse/reveal wording with `browseable`, not `verified`
- align missing snapshot artifact wording so `missing-directory` and `missing-manifest` do not collapse into one generic error
- align alias-root language so root disagreement is surfaced as `alias-divergent` rather than a generic missing-state condition

### Terms Requiring Future GUI Alignment

- `Latest snapshot verified`
- `Verification data unavailable`
- `No snapshots verified`
- `Verification issues detected`
- local `report`, `manifest`, and `reveal` action wording where the visible affordance can sound more authoritative than the evidence allows

### Terms Requiring Future Restore Alignment

- `restorable`
- `restore latest`
- any wording that implies restore eligibility from browseability, report freshness, or historical verification alone

## Scoped Code-Inspection Notes

- renderer terminology drift surface:
  - `app/renderer/components/SnapshotsPanel.tsx` still contains labels such as `Latest snapshot verified`, `No snapshots verified`, and `Verification issues detected`
- report wording drift surface:
  - `app/renderer/components/SnapshotsPanel.tsx` and `app/main/preload.ts` still use generic `verification report` language that does not by itself distinguish `report-fresh` from `report-stale`
- backend naming drift surface:
  - backend integrity naming in `services/src/blackskies/services/backup_verifier.py` and restore routes is more specific than some renderer-facing summary text
- continuity dependency note:
  - project-switch and draft-preview continuity remain separate constraints and should not be folded into snapshot-state semantics in this pass

## Stop Conditions For Entering Implementation

- vocabulary conflicts with [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- terms imply runtime behavior before acceptance
- missing evidence is treated as fact
- `RDM-*` inputs disagree with the source ledger or roadmap references
- alias semantics are assumed without an explicit decision path
- restore safety is implied before `Phase 15`

## Exit Criteria

- spec home is chosen and documented
- vocabulary candidates are documented
- evidence contract is documented
- non-goals are explicit
- the next implementation/spec pass is identified
- tracker is updated

## Planned Next Pass

The next implementation-facing pass for this slice is not runtime alignment.

Immediate next agreed risk-reduction pass:

- wrapper/launcher/CWD audit

Then:

- critique/project-switch `RDM` ownership follow-up
- `Phase 14A.1` implementation/spec pass to finalize and accept the vocabulary contract before any `14B` behavior alignment begins
