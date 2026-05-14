Status: Produced
Canonical role: Canonical deferred and backlog allocation surface for stable roadmap IDs, source mapping, lifecycle state, and future phase/pass destinations.
Scope: Convert Handoff Pass 2, Pass 26, tracker evidence, and relevant audit/spec findings into a stable deferred-work matrix with `RDM-*` IDs, lifecycle state, ownership, authority impact, runtime impact, and future allocation.
Owns: Stable `RDM-*` roadmap IDs, source ID mapping, deferred item lifecycle state, future phase/pass destination, severity, ownership, authority impact, runtime impact, and human verification requirement.
Does not own: Proof doctrine, phase/pass sequencing, runtime implementation, snapshot ontology implementation, restore behavior implementation, test creation, or Phase 14 execution.
Upstream dependencies: [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md), [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md), [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md), [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase13_audit_trust_validation_plan.md](/C:/Dev/black-skies/docs/phases/phase13_audit_trust_validation_plan.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
Downstream dependencies: No downstream roadmap artifact is required to exist for this pass; this matrix is expected to feed governance acceptance review and later Phase 14 slice mapping.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

# Deferred Work Matrix

## Purpose

This artifact converts Handoff Pass 2, Pass 26, tracker evidence, and relevant audit/spec findings into the canonical deferred and backlog allocation system.

It normalizes repeated symptoms into stable roadmap items, preserves source references, and assigns future phase/pass destinations without starting implementation work.

## Inputs and Dependencies

### Upstream Dependencies

- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md)
- [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md)
- [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md)
- [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [phase13_audit_trust_validation_plan.md](/C:/Dev/black-skies/docs/phases/phase13_audit_trust_validation_plan.md)
- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
- repo searches for `TODO`, `FIXME`, `deferred`, `later`, `stub`, `mock`, `synthetic`, `snapshot`, `manifest`, `restore`, `backup`, `verification`, `verified_at`, `last_verification`, `authority`, `alias`, `Esther_Estate`, `proj_esther_estate`, `fixture`, `materialize`, `teardown`, `workflow`, `Playwright`, `truth lane`, `runtime truth`, `degraded`, `stale`, `orphan`, `report`, `browse`, `restore latest`, `human verification`, `acceptance`, and `closure`

### Missing Artifact Note

- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` remains missing at that path and is treated as missing evidence rather than inferred content.

## Relationship to Other Governance Docs

- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md) owns proof and authority rules.
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md) owns phase and pass sequencing.
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md) owns deferred and backlog allocation plus stable `RDM-*` IDs.
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md) owns current operational status.

## ID Namespace and Lifecycle Rules

- `RDM-*` IDs belong only to [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md).
- `P2-*` IDs remain historical source references from [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md).
- `PA26-*` IDs remain historical source references from [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md).
- IDs are never reused.
- Retired IDs remain reserved.
- Merged IDs point to the surviving ID.
- Split IDs point to all child IDs.
- Source IDs remain searchable.
- Roadmap IDs stay stable even if title, severity, or status changes.

## Item Classification Model

### Unresolved Classes

- `Active blocker`
- `Deferred future work`
- `Frozen risk`

### Record States

- `Open`
- `Active`
- `Deferred`
- `Frozen`
- `Resolved`
- `Obsolete`
- `Merged`
- `Split`
- `Historical`

`Historical` is an archive state, not a live unresolved class.

## Matrix Fields

| Field | Meaning |
| --- | --- |
| Roadmap ID | Stable `RDM-*` identifier |
| Source ID(s) | Historical source references from Pass 2, Pass 26, tracker, or other evidence |
| Title | Canonical normalized issue title |
| Severity | `S0 Blocker`, `S1 Closure-critical`, `S2 High-value stabilization`, `S3 Future improvement`, or `S4 Parking lot` |
| Ownership area | Backend, Electron/preload, Renderer/UI, Playwright/harness, Snapshots/recovery, Truth lane/runtime truth, Docs/roadmap, CI/GitHub Actions, Operator workflow |
| Unresolved class | `Active blocker`, `Deferred future work`, or `Frozen risk` |
| Record state | Lifecycle state from the record-state model |
| Authority layer(s) | One or more of `A1` through `A7` from the authority strategy |
| Runtime impact | Summary of current or future runtime/operator impact |
| Human verification required | `Yes`, `No`, or `Later` |
| Future phase | Planned phase destination |
| Future pass/slice | Planned pass or slice destination |
| Dependencies | Other roadmap items or phase dependencies required first |
| Evidence/source | Short evidence provenance |
| Notes | Merge, split, scope, or caution notes |

## Canonical Matrix

| Roadmap ID | Source ID(s) | Title | Severity | Ownership area | Unresolved class | Record state | Authority layer(s) | Runtime impact | Human verification required | Future phase | Future pass/slice | Dependencies | Evidence/source | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RDM-SNAP-001 | `P2-SNAP-001`, `PA26-T01` | Snapshot authority ontology overload | S0 Blocker | Snapshots/recovery | Active blocker | Open | `A1`, `A2`, `A3`, `A4` | Snapshot rows, reports, and actions can disagree about what “verified” means | Yes | Phase 14 | `14A.1`, `14A.2` | None | Handoff Pass 2, Pass 26, operator-observed evidence | Collapses verified snapshot but missing manifest, verified snapshot but missing physical directory, UI says verified while integrity is unavailable, and historical verification treated as current integrity |
| RDM-SNAP-002 | `P2-REPORT-001`, `PA26-T02`, `PA26-T03`, `PA26-T08` | Stale, orphaned, and path-divergent verification records | S0 Blocker | Snapshots/recovery | Active blocker | Open | `A1`, `A2`, `A3`, `A4` | Cached report state can outlive or diverge from the loaded artifact tree | Yes | Phase 14 | `14A.4`, `14B.4` | `RDM-SNAP-001`, `RDM-ALIAS-001` | Handoff Pass 2, Pass 26 | Collapses stale report freshness undefined, orphaned verification records, and report availability semantics |
| RDM-SNAP-003 | `PA26-T04`, `PA26-T05` | Missing manifest and missing directory behavior | S1 Closure-critical | Snapshots/recovery | Active blocker | Open | `A1`, `A4` | Local snapshot actions degrade into missing-file or zero-count states without a stable contract | Yes | Phase 14 | `14A.1`, `14B.4` | `RDM-SNAP-001` | Pass 26 contradiction matrix and TODO ledger | Narrower than `RDM-SNAP-001`; keeps file-backed degradation behavior explicit |
| RDM-ALIAS-001 | `P2-ALIAS-001`, `PA26-T06` | Project-root alias unification | S0 Blocker | Electron/preload | Active blocker | Open | `A1`, `A3`, `A4`, `A5` | Loaded-root drift breaks report reads, detail resolution, and restore assumptions | Yes | Phase 14 | `14A.3`, `14B.5` | None | Handoff Pass 2, Pass 26, tracker alias notes | Covers `Esther_Estate` vs `proj_esther_estate` and the loaded-root authority rule |
| RDM-RESTORE-001 | `P2-RESTORE-001`, `PA26-T09` | Restore availability and validation clarity | S1 Closure-critical | Backend | Active blocker | Open | `A1`, `A2`, `A4` | UI can imply restore availability while backend validation rejects the action | Yes | Phase 15 | restore-as-copy eligibility contract | `RDM-SNAP-001`, `RDM-ALIAS-001` | Handoff Pass 2, Pass 26, operator-observed evidence | Covers restore latest ZIP validation clarity as the primary operator-facing restore issue |
| RDM-BACKUP-001 | `PA26-T14` | Backup and restore authority mapping | S1 Closure-critical | Backend | Active blocker | Open | `A1`, `A2`, `A3`, `A4` | Restore target semantics can drift from snapshot/report authority semantics | Yes | Phase 15 | target path collision and restore gating slices | `RDM-RESTORE-001`, `RDM-ALIAS-001` | Pass 26 TODO ledger | Separate from restore copy wording because it governs the shared path and target model |
| RDM-BROWSE-001 | `P2-BROWSE-001`, `PA26-T10` | Browseable vs verified vs restorable distinction | S1 Closure-critical | Operator workflow | Active blocker | Open | `A1`, `A4` | Local browsing can be mistaken for verified or safe state | Yes | Phase 15 | browseability and local-file distinction slice | `RDM-SNAP-001`, `RDM-RESTORE-001` | Handoff Pass 2, Pass 26, offline authority notes | Keeps “open file works” separate from “artifact is authoritative” |
| RDM-HARNESS-001 | `P2-HARNESS-001`, `PA26-T11`, `PA26-T13` | Fixture and test contract governance | S1 Closure-critical | Playwright/harness | Active blocker | Open | `A5`, `A6`, `A7` | Harnesses can go green while hiding authority drift if fixture scope is not governed | No | Phase 16 | fixture authority contract | None | Handoff Pass 2, Pass 26, tracker harness chain | Includes negative-toast guard preservation as a non-negotiable constraint |
| RDM-TRUTH-001 | `P2-TRUTH-001`, `PA26-T12` | Truth-lane authority scope | S1 Closure-critical | Truth lane/runtime truth | Active blocker | Open | `A2`, `A3`, `A5` | Truth lane can be overstated as product proof if its scope is not bounded | No | Phase 16 | truth-lane scope matrix | `RDM-HARNESS-001` | Handoff Pass 2, Pass 26 | Keeps truth-lane proof narrow and explicit |
| RDM-SYNTH-001 | `P2-SYNTH-001` | Synthetic-mode authority limits | S2 High-value stabilization | Playwright/harness | Deferred future work | Deferred | `A6` | Synthetic success can be misread as real-service or filesystem truth | No | Phase 16 | synthetic-mode scope documentation | `RDM-HARNESS-001` | Handoff Pass 2, tracker load audit notes | Remains governance, not runtime behavior work |
| RDM-TEARDOWN-001 | `P2-TEARDOWN-001` | Playwright teardown governance | S2 High-value stabilization | Playwright/harness | Deferred future work | Deferred | `A5`, `A6` | Harness teardown is stable now but remains a regression-prone governance area | No | Phase 16 | Playwright teardown governance | `RDM-HARNESS-001` | Handoff Pass 2, tracker follow-up chain | Explicitly governance-only; runtime behavior is not in scope |
| RDM-CI-001 | `P2-WORKFLOW-001` | Workflow trigger and docs-only branch expectations | S2 High-value stabilization | CI/GitHub Actions | Deferred future work | Deferred | `A3`, `A5` | Planning assumptions drift if branch-trigger behavior is forgotten | No | Phase 19 | repo/docs trigger reconciliation | None | Handoff Pass 2, workflow audits, tracker | Collapses workflow trigger clarity and docs-only workflow expectations |
| RDM-DOCS-001 | `P2-DOCS-001`, `P2-EVID-001`, `PA26-T15` | Missing and uncertain evidence handling | S2 High-value stabilization | Docs/roadmap | Deferred future work | Deferred | `A3` | Missing artifacts and chat-only evidence weaken closure quality and future handoff continuity | Later | Phase 19 | docs deferred scan and evidence intake | None | Handoff Pass 1, Pass 2, Pass 26 | Covers missing Pass 6 artifact path, operator screenshots, and operator-facing authority map reuse |
| RDM-GUI-001 | `P2-DEGRADE-001`, `PA26-T07`, `PA26-T16` | Degraded-state GUI semantics and control-surface simplification | S1 Closure-critical | Renderer/UI | Active blocker | Open | `A1`, `A4` | Degraded states and overloaded controls make authority contradictions harder to interpret correctly | Yes | Phase 17 | degraded-state display copy and control review | `RDM-SNAP-001`, `RDM-SNAP-003` | Handoff Pass 2, Pass 26, workflow and error-visibility specs | Includes “UI says verified while integrity unavailable” and the overloaded snapshot surface |
| RDM-MIGRATE-001 | `P2-MIGRATE-001`, `PA26-T19` | New GUI authority migration gate | S1 Closure-critical | Docs/roadmap | Active blocker | Open | `A3`, `A4` | GUI promotion without an authority gate would spread unresolved contradictions into a larger surface | Later | Phase 18 | migration blockers and promotion criteria | `RDM-SNAP-001`, `RDM-GUI-001` | Handoff Pass 2, Pass 26 | Gate item, not a runtime feature request |
| RDM-FOCUS-001 | `P2-GUI-001`, `PA26-T17` | Legacy Focus behavior deprecation or obsolescence check | S3 Future improvement | Renderer/UI | Deferred future work | Deferred | `A4` | If the old Focus affordance still exists, it may imply stale authority semantics | No | Phase 17 | dead and legacy control cleanup | `RDM-GUI-001` | Pass 26 TODO ledger, tracker notes | Keep as a separate low-risk item until existence is rechecked |
| RDM-REF-001 | `P2-REF-001`, `PA26-T18` | Shared authority helper refactor follow-up | S3 Future improvement | Renderer/UI | Deferred future work | Deferred | `A3`, `A4` | Duplication can reintroduce drift after semantics are settled | No | Phase 14 | `14D` or later refactor follow-up | `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-ALIAS-001` | Handoff Pass 2, Pass 26 | Refactor is explicitly downstream of semantic decisions |
| RDM-FUTURE-001 | `P2-ROADMAP-001` | Phase 20+ provisional future governance buckets | S4 Parking lot | Docs/roadmap | Frozen risk | Frozen | `A3` | Future research themes need a parking zone without being treated as committed execution | No | Phase 20+ | provisional buckets only | None | Handoff Pass 2, Handoff Pass 3 | Buckets remain provisional and should not be promoted into commitments during stabilization |

## Phase Allocation Summary

| Phase | Allocated roadmap items |
| --- | --- |
| Phase 14 - Authority Reconciliation | `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-SNAP-003`, `RDM-ALIAS-001`, `RDM-REF-001` |
| Phase 15 - Backup / Restore Authority Hardening | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-BROWSE-001` |
| Phase 16 - Test Harness / Fixture Governance | `RDM-HARNESS-001`, `RDM-TRUTH-001`, `RDM-SYNTH-001`, `RDM-TEARDOWN-001` |
| Phase 17 - GUI Authority Simplification | `RDM-GUI-001`, `RDM-FOCUS-001` |
| Phase 18 - New GUI Migration Gate | `RDM-MIGRATE-001` |
| Phase 19 - Roadmap / Deferred Ledger Reconciliation | `RDM-CI-001`, `RDM-DOCS-001` |
| Phase 20+ - provisional future governance buckets only | `RDM-FUTURE-001` |

## Active vs Deferred Relationship

- Some active blockers also exist in this matrix because they have future phase and pass allocation.
- The tracker remains canonical for current active status.
- This matrix remains canonical for future allocation and lifecycle state.
- If an item moves between active, deferred, frozen, or resolved and that move affects both operational status and future allocation, tracker and matrix must be reconciled in the same pass.

## Merge, Split, and Obsolete Protocol

- If duplicate items merge, keep one surviving `RDM-*` ID and record merged IDs in `Notes`.
- If one item splits, record child IDs in `Notes` and keep the parent as `Split` or `Historical` as appropriate.
- Obsolete items are never deleted; mark them `Obsolete` or `Historical`.
- Retired IDs remain reserved.

## Missing Evidence and Operator-Observed Evidence Handling

- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` remains missing and must stay `needs verification` unless found.
- Operator screenshots remain operator-observed evidence unless committed or reproduced intentionally.
- Latest green GitHub workflow evidence remains `needs verification` unless verified with GitHub tooling or equivalent recorded evidence.
- Missing evidence cannot be upgraded into fact.

## Phase 14 Starting Slice Readiness

This matrix does not itself start Phase 14, but it must support mapping the first slice:

`Phase 14A.1 - Snapshot State Vocabulary and Evidence Contract`

Items most likely to feed that slice:

- `RDM-SNAP-001`
- `RDM-SNAP-002`
- `RDM-SNAP-003`
- `RDM-ALIAS-001`
- `RDM-GUI-001`
- `RDM-DOCS-001`

Slice acceptance remains separate and pending.

## Open Questions and Deferred Decisions

| Question | Current status |
| --- | --- |
| Whether governance acceptance with exceptions can proceed if exceptions do not affect the starting slice | Deferred; likely yes only when exceptions are explicitly marked non-blocking for the slice |
| Whether Phase 13 closure should happen immediately after governance acceptance or after slice acceptance | Deferred; current plan allows slice acceptance to remain pending after Phase 13 closes |
| Whether screenshot evidence should be reproduced into committed verification artifacts | Deferred; keep as operator-observed evidence until intentionally reproduced |
| Whether Phase 20+ buckets should remain unnamed categories until stabilization phases complete | Deferred; current plan keeps them provisional only |
| Whether old or dead Focus behavior still exists and belongs in Phase 17 or is already obsolete | Deferred; recheck source surfaces before final allocation or obsolescence |
