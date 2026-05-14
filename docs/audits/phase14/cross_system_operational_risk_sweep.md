Status: Produced
Canonical role: Bounded operational-risk confidence map for runtime-adjacent systems before deeper Phase 14 implementation.
Scope: Classify runtime-adjacent systems by operational risk class, evidence basis, authority layer, phase ownership, blocker status, and recommended next action.
Owns: Cross-system operational-risk classification for the scoped systems in this sweep; Phase 14A.1 and Phase 14B+ blocker/constraint summary for those systems.
Does not own: Proof doctrine, phase sequencing, deferred-matrix ID governance, production implementation, test implementation, GUI redesign, or the Phase 14A.1 vocabulary contract.
Upstream dependencies: [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase13_closure_review.md](/C:/Dev/black-skies/docs/handoffs/phase13_closure_review.md), [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md), [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md), [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md), [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md), [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md), [canonical_authority_and_validation_lanes.md](/C:/Dev/black-skies/docs/reviews/canonical_authority_and_validation_lanes.md), [false_confidence_reduction_plan.md](/C:/Dev/black-skies/docs/reviews/false_confidence_reduction_plan.md), [stable_environment_confirmation.md](/C:/Dev/black-skies/docs/reviews/stable_environment_confirmation.md), [pane_lifecycle.md](/C:/Dev/black-skies/docs/specs/pane_lifecycle.md)
Downstream dependencies: Future execution-readiness planning for `Phase 14A.1`, Phase 14B implementation-alignment gating, and any later dedicated `RDM-*` follow-up items created from this sweep.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

# Cross-System Operational Risk Sweep

## Purpose

Governance readiness does not equal runtime operational confidence.

This sweep classifies runtime-adjacent systems before deeper implementation work so the project does not treat accepted roadmap artifacts, green lanes, or historical fixes as equivalent to current operational trust.

This sweep does not fix issues.
This sweep does not start Phase 14 implementation.
This sweep informs:

- `Phase 14A.1` vocabulary and evidence-contract planning
- `Phase 14B` implementation-alignment readiness
- later phase allocation when risks are clearly outside snapshot authority alone

## Evidence Inspected

Primary governance and handoff inputs:

- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [phase13_closure_review.md](/C:/Dev/black-skies/docs/handoffs/phase13_closure_review.md)
- [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md)
- [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md)
- [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md)
- [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md)

Runtime and lane references:

- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
- [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md)
- [pane_lifecycle.md](/C:/Dev/black-skies/docs/specs/pane_lifecycle.md)
- [canonical_authority_and_validation_lanes.md](/C:/Dev/black-skies/docs/reviews/canonical_authority_and_validation_lanes.md)
- [false_confidence_reduction_plan.md](/C:/Dev/black-skies/docs/reviews/false_confidence_reduction_plan.md)
- [stable_environment_confirmation.md](/C:/Dev/black-skies/docs/reviews/stable_environment_confirmation.md)

Search surfaces inspected:

- repo searches for `critique`, `intelligence`, `rewrite`, `editorial`, `snapshot`, `freshness`, `report refresh`, `restore`, `backup`, `wrapper`, `launcher`, `CWD`, `truth lane`, `harness`, `fixture`, `serviceStubs`, `runtime JS`, `exception`, `debugLog`, `preload`, `bridge`, `memory`, `persistence`, `longform`, `generation`, `continuation`, `offline`, `degraded`, `recovery`, `load behavior`, `project load`, `project switch`, and `Focus`
- narrow source/doc references in `app/main`, `app/renderer`, `app/tests/e2e`, `scripts/`, `docs/specs/`, and `docs/reviews/`

Missing or weak evidence that remains weak:

- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` is still missing at that path.
- operator screenshots remain operator-observed evidence, not repo-native proof.
- latest green GitHub workflow state is still not locally repo-provable.

## Risk Classification Model

- `Trusted`: recently validated by the correct authority layer(s), with no unresolved contradiction for the scoped claim
- `Partially trusted`: improved or mitigated, but not fully revalidated across required evidence layers
- `Observed risk`: suspicious behavior was seen by operator, harness, CI, runtime, or docs, but has not been fully audited or reproduced
- `Governance-only`: planning or governance exists, but runtime behavior has not been validated
- `Deferred future`: known future area intentionally postponed and not authorized for implementation

## System Risk Table

| System | Risk class | Known symptoms / evidence | Authority layers affected | Current owner phase | Blocks Phase 14A.1? | Blocks Phase 14B or later? | Existing RDM item(s) | Recommended next action | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| critique/intelligence flow | Partially trusted | `critique` and `rewrite` are authoritative in the capability-truth matrix, but broader intelligence/analytics and UI-review surfaces remain mixed or harness-driven in review docs | `A2`, `A4`, `A5`, `A7` | No dedicated phase yet; sweep follow-up under Phase 19 and likely later dedicated phase work | No | Yes | none directly | Run a bounded critique/intelligence risk-allocation pass before using it as a dependency for broader `/goals` work | Critique is stronger than intelligence/analytics as a combined system |
| snapshot freshness and report refresh behavior | Partially trusted | Passes 15, 18, 21, and Pass 26 improved refresh and reread behavior, but stale/orphan semantics and alias-root drift remain unresolved | `A1`, `A2`, `A3`, `A4` | Phase 14 | No | Yes | `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-SNAP-003` | Keep as a primary `14A` and `14B` dependency; do not treat narrow truth-lane freshness as whole-system closure | Planning input for `14A.1`, implementation blocker for deeper alignment |
| restore and backup user-facing path | Observed risk | Operator-observed `Request validation failed`, restore/copy ambiguity, and unresolved restore eligibility semantics remain in tracker and Pass 26 | `A1`, `A2`, `A4` | Phase 15 | No | Yes | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-BROWSE-001` | Treat restore as blocked for deeper implementation until the restore-path contract is explicit | User-facing safety claim, not just a button-state problem |
| wrapper/launcher/CWD behavior | Observed risk | Review docs still call out smoke-fallback ambiguity, launcher forgiveness, and current-working-directory/path assumptions in validation flows | `A1`, `A3`, `A5`, `A6` | No dedicated phase yet; governance follow-up under Phase 19 with likely Phase 16 companion audit | No | Yes | `RDM-CI-001`, `RDM-RISK-001` | Run a dedicated wrapper/launcher/CWD audit before broad `/goals` work or deeper truth-lane dependence | This is a validation-trust dependency more than a snapshot-semantic problem |
| truth-lane realism | Partially trusted | Truth lane is authoritative and passing for its scoped claims, but review docs repeatedly warn against overclaiming it as full product proof | `A2`, `A3`, `A5` | Phase 16 | No | Yes | `RDM-TRUTH-001` | Preserve narrow scope and classify any new dependency against explicit lane authority | Trusted for narrow claims, not for broad runtime confidence |
| harness/fixture realism | Partially trusted | Harness controls are reduced and documented, but residual dataset/event paths, service stubs, and fixture assumptions remain active | `A5`, `A6`, `A7` | Phase 16 | No | Yes | `RDM-HARNESS-001`, `RDM-SYNTH-001`, `RDM-TEARDOWN-001` | Keep harness evidence fenced and prioritize fixture realism in any cross-system follow-up | Stable enough for harness use, not runtime proof |
| GUI authority flows | Observed risk | Snapshot control overload, degraded-state ambiguity, Focus uncertainty, and operator-visible contradictions remain documented across Passes 15-26 | `A1`, `A4` | Phase 17 | No | Yes | `RDM-GUI-001`, `RDM-FOCUS-001` | Treat GUI authority flows as constrained until semantics exist and a live-source Focus recheck is done | A4 cannot prove A1; this remains a user-trust seam |
| runtime JS exception capture | Observed risk | Debug-log seam and renderer noise were narrowed in harness work, but broad runtime exception visibility is not recently closure-grade across real flows | `A4`, `A5` | No dedicated phase yet; governance follow-up under Phase 19 | No | Yes | `RDM-RISK-001` | Run a bounded runtime JS exception visibility audit before relying on quiet UI runs as operational proof | Current evidence is stronger for harness cleanup than for broad live exception confidence |
| memory persistence/read-write flow | Governance-only | Current runtime docs name shipped memory/continuity code, but this phase has not revalidated cross-system memory persistence truth recently | `A2`, `A3` | Phase 20+ provisional | No | Yes | `RDM-FUTURE-001` | Keep out of active implementation planning until a dedicated memory risk classification pass exists | Runtime exists, but governance readiness is ahead of operational confidence |
| longform continuation/generation flow | Governance-only | Current runtime docs name shipped long-form execution, but no recent cross-system operational-confidence pass validated it here | `A2`, `A3`, `A4` | Phase 20+ provisional | No | Yes | `RDM-FUTURE-001` | Keep provisional until after authority/restore stabilization or a dedicated longform continuity audit | Not a current Phase 14 dependency unless explicitly accepted as risk |
| offline/degraded-state behavior | Partially trusted | Passes 16 and 20 improved the offline matrix, but degraded-state semantics and local-browse-vs-authority interpretation remain incomplete | `A1`, `A2`, `A4` | Phase 14 and Phase 17 | No | Yes | `RDM-GUI-001`, `RDM-BROWSE-001`, `RDM-SNAP-003` | Carry into `14A` semantics and `17` GUI simplification; do not treat offline clarity as solved | Improved, not closure-grade |
| report persistence chain | Partially trusted | Truth lane proves narrow report persistence and alias mirroring, but broader freshness, stale-report, and loaded-root coherence are still unresolved | `A1`, `A2`, `A3`, `A4`, `A5` | Phase 14 | No | Yes | `RDM-SNAP-002`, `RDM-DOCS-001` | Keep in the snapshot-authority core and treat narrow persistence proof as insufficient for broader closure | Strong example of “historical record != current integrity” |
| materialized fixture contract | Partially trusted | Fixture materialization was hardened and documented, but it remains synthetic fixture authority rather than real project proof | `A5`, `A6`, `A7` | Phase 16 | No | Yes | `RDM-HARNESS-001`, `RDM-SYNTH-001` | Use sweep findings to prioritize fixture realism and alias-root checks in Phase 16 | Important for CI confidence, not runtime trust |
| recovery/load behavior | Partially trusted | Recovery route is authoritative in the capability-truth matrix, but project load is only `mixed`, and recovery/load continuity still spans multiple layers | `A2`, `A3`, `A4` | Phase 15 with later governance follow-up | No | Yes | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-RISK-001` | Run a recovery/load/project-switch continuity audit before deeper alignment work depends on it | Recovery is stronger than project-load continuity as a combined system |
| preload/bridge boundary behavior | Observed risk | Review docs still flag broad preload test hooks, bridge availability failures, and harness-only override surfaces as a false-confidence risk | `A4`, `A5`, `A6`, `A7` | No dedicated phase yet; governance follow-up under Phase 19 with likely Phase 16 companion work | No | Yes | `RDM-HARNESS-001`, `RDM-CI-001`, `RDM-RISK-001` | Run a bounded preload/bridge boundary audit before broad execution campaigns | Important hidden dependency for truth vs harness distinction |
| project-load/project-switch continuity | Partially trusted | `project_load` is only `mixed` in the capability-truth matrix; pane/workflow contracts still call out stale-state risk on project switch | `A1`, `A3`, `A4` | No dedicated phase yet; governance follow-up under Phase 19 | No | Yes | `RDM-ALIAS-001`, `RDM-RISK-001` | Run a recovery/load/project-switch continuity audit and decide whether it needs a named RDM item | Closely related to alias/root authority but not fully the same problem |
| old/dead Focus behavior | Observed risk | Tracker and governance review still require a live-source recheck before Focus can be confirmed as active debt or obsolete | `A4` | Phase 17 | No | No | `RDM-FOCUS-001` | Decide whether to live-source check now or defer to Phase 17 | Low direct runtime risk, but it still muddies GUI authority |

## Phase 14A.1 Impact

No blocker-level evidence in this sweep requires stopping `Phase 14A.1 - Snapshot State Vocabulary and Evidence Contract`.

Current conclusion:

- most cross-system risks do not block `14A.1` because it is vocabulary and evidence-contract planning
- several systems constrain the language `14A.1` should use, especially snapshot freshness, report persistence, degraded-state semantics, alias/root authority, and browse/restore distinctions
- the sweep does not justify starting `14B` or later implementation alignment as if those systems were runtime-trusted

## Phase 14B+ Impact

The following systems should block or materially constrain deeper implementation alignment unless they are explicitly accepted as risk at a narrower scope:

- restore and backup user-facing path
- snapshot freshness and report refresh behavior
- alias/root authority as part of project-load continuity
- preload/bridge boundary behavior
- wrapper/launcher/CWD behavior
- runtime JS exception capture
- GUI authority flows
- truth-lane and harness realism when used as proof
- recovery/load behavior

These are primarily `14B+` risks, not `14A.1` planning blockers.

## Dedicated RDM Recommendation

| Area | Recommendation | Rationale |
| --- | --- | --- |
| critique/intelligence flow | needs dedicated RDM | no current `RDM-*` item cleanly owns the combined critique/intelligence runtime-confidence question |
| runtime JS exception capture | needs dedicated RDM | current evidence is spread across debug-log and harness cleanup history, but no canonical matrix item owns live exception-confidence |
| memory persistence/read-write flow | likely covered after sweep follow-up | current runtime exists, but it is better staged after authority/restore stabilization unless it becomes an immediate dependency |
| longform continuation/generation flow | deferred future | current runtime exists, but no current Phase 14-19 implementation path depends on treating it as trusted now |
| wrapper/launcher/CWD behavior | needs dedicated RDM | current risk is real and cross-cutting; `RDM-CI-001` is too narrow to own it cleanly |
| recovery/load behavior | likely covered after sweep follow-up | overlaps restore, recovery, alias, and project-load continuity; likely needs a narrower follow-up before deciding whether to split |
| project-load/project-switch continuity | needs dedicated RDM | `project_load` is only mixed, and the stale-state continuity risk is broader than alias alone |
| preload/bridge boundary behavior | needs dedicated RDM | current governance treats it as a false-confidence risk, but no dedicated deferred item owns it yet |

No new `RDM-*` item is created in this pass.

## Recommended Follow-Up Passes

Priority order:

1. `Phase 14A.1` execution-readiness planning
   - still the next direct planning step because this sweep found no blocker-level contradiction for vocabulary/evidence-contract work
2. wrapper/launcher/CWD audit
   - highest validation-trust seam outside snapshot authority itself
3. preload/bridge boundary audit
   - needed before broad `/goals` work or before treating harness/UI stability as product confidence
4. recovery/load/project-switch continuity audit
   - needed before deeper `14B` alignment that assumes project-load stability

Second tier, not immediate:

5. runtime JS exception visibility audit
6. critique/intelligence risk-allocation pass
7. memory persistence risk classification
8. longform generation continuity audit

## Open Questions

- Should critique/intelligence flow receive its own `RDM-*` item before Phase 14B?
- Should wrapper/launcher/CWD behavior be audited before using broad `/goals`?
- Should memory and longform continuity remain `Phase 20+` provisional until after authority and restore phases?
- Should the old Focus control be live-source checked now or deferred to Phase 17?
- Should project-load/project-switch continuity become a named risk item?
