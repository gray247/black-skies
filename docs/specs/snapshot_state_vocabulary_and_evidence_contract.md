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

## Vocabulary Candidates

| Term | Plain definition | Required evidence class | Authority layer required | Must not imply | Likely UI/operator meaning | Future implementation owner phase/pass |
| --- | --- | --- | --- | --- | --- | --- |
| `verified` | A verification result exists and the scoped claim has the required current evidence behind it | backend/runtime evidence plus filesystem evidence when filesystem truth is claimed | `A2` and `A1` when applicable | that every related file, directory, report, or restore action is safe by default | this state has been checked at the correct layer, not just remembered | `Phase 14A.1`, `14A.2`, `14B.4` |
| `historical-only` | A persisted verification record exists, but it is not enough to claim current integrity | persisted-record evidence | `A3` | current integrity, current filesystem existence, or restore safety | a record exists, but it may be stale | `Phase 14A.1`, `14A.4` |
| `stale` | The stored state no longer has sufficient current evidence to represent the live artifact tree safely | persisted-record evidence plus contradictory filesystem/runtime evidence | `A3` plus `A1` or `A2` contradiction | current OK status | this information used to be valid but is no longer current | `Phase 14A.1`, `14A.4`, `14B.4` |
| `orphaned` | A record or report remains, but the artifact or target it refers to is missing or no longer coheres with the active root | persisted-record evidence plus missing filesystem evidence | `A3` plus `A1` | that the orphaned record is still actionable | this report points at something the app cannot currently back up with local truth | `Phase 14A.1`, `14A.4`, `14B.4` |
| `missing-directory` | The expected snapshot directory does not exist at the active loaded root | filesystem evidence | `A1` | manifest absence, report staleness, or backend failure by itself | the folder the UI expects is not there now | `Phase 14A.1`, `14B.4` |
| `missing-manifest` | The snapshot directory exists, but the expected manifest file is absent | filesystem evidence | `A1` | missing directory, invalid restore, or zero-file snapshot | the snapshot exists, but its expected manifest data is incomplete | `Phase 14A.1`, `14B.4` |
| `browseable` | A local file or directory can be opened or revealed from the current environment | filesystem evidence with optional UI witness | `A1` and `A4` witness only | verified, current integrity, or restorable safety | you can open the thing locally; that does not certify it | `Phase 14A.1`, `Phase 15`, `Phase 17` |
| `restorable` | A restore path has passed the restore-specific eligibility contract for the scoped action | backend/runtime evidence plus any required filesystem checks | `A2` and `A1` when applicable | browseable, verified, or backup existence alone | the restore action is currently allowed under the restore contract | `Phase 15` |
| `integrity-valid` | The current artifact passed the required integrity checks for the scoped claim | current backend/runtime evidence and filesystem evidence | `A2` and `A1` | historical verification only, clean UI badge only, or restored path safety | current integrity checks passed | `Phase 14A.1`, `14B.1`, `14B.4` |
| `integrity-unavailable` | The system cannot currently establish current integrity from the required evidence layers | missing or contradictory current evidence | `A1` and/or `A2` missing, with `A4` witness possible | that the artifact is broken beyond recovery or that historical records are false | the app cannot currently verify integrity | `Phase 14A.1`, `14B.4`, `Phase 17` |
| `degraded` | The system is operating with known reduced confidence or missing supporting artifacts and must say so explicitly | current contradictory or incomplete evidence | depends on the degraded condition; typically `A1`, `A2`, `A3`, `A4` | a generic failure, a safe restore, or silent success | something is available, but trust or completeness is reduced | `Phase 14A.1`, `Phase 17` |
| `report-fresh` | The persisted verification report still matches the current loaded-root artifact state closely enough for its scoped claim | persisted-record evidence validated by current runtime/filesystem checks | `A3` plus `A1` and/or `A2` | that all UI actions are valid or that restore is safe | the stored report is current enough for the specific claim | `Phase 14A.1`, `14A.4`, `14B.4` |
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
- restore safety is out of scope for this pass and must not be implied by snapshot vocabulary alone

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
