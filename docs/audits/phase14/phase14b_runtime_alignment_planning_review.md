# Phase 14B Runtime Alignment Planning Review

Status: Produced
Canonical role: Planning topology and implementation-order review for `Phase 14B` runtime alignment before any bounded implementation slice begins.
Scope: Map runtime-facing reconciliation surfaces, slice candidates, stop-boundary pressure, human-verification dependencies, and the safest bounded implementation order for `14B`.
Owns: `14B` planning topology, implementation-slice candidates, ordering guidance, bounded `/goal` guidance, and explicit statements about what should not be attempted in one implementation campaign.
Does not own: Runtime implementation, restore or continuity fixes, human-verification execution, deferred-matrix governance beyond planning references, or closure-grade proof.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

`14B` is where the accepted semantic contract begins touching live runtime behavior.

That makes `14B` materially more dangerous than `14A`.

This planning review maps the runtime-alignment battlefield before any code changes begin, so future implementation slices stay bounded and do not smuggle restore, continuity, preload, renderer, and proof-lane risk into one uncontrolled `/goal`.

## Evidence Inspected

- [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md)
- [phase14a_operator_acceptance_review.md](/C:/Dev/black-skies/docs/audits/phase14/phase14a_operator_acceptance_review.md)
- [phase14a_operator_acceptance_record.md](/C:/Dev/black-skies/docs/audits/phase14/phase14a_operator_acceptance_record.md)
- [phase14a_semantic_contract_acceptance_packet.md](/C:/Dev/black-skies/docs/audits/phase14/phase14a_semantic_contract_acceptance_packet.md)
- [recovery_load_project_switch_continuity_audit.md](/C:/Dev/black-skies/docs/audits/phase14/recovery_load_project_switch_continuity_audit.md)
- [project_switch_preload_continuity_followup.md](/C:/Dev/black-skies/docs/audits/phase14/project_switch_preload_continuity_followup.md)
- [human_verification_planning_for_continuity_sensitive_flows.md](/C:/Dev/black-skies/docs/audits/phase14/human_verification_planning_for_continuity_sensitive_flows.md)
- [human_verification_receipt_and_checkpoint_design.md](/C:/Dev/black-skies/docs/audits/phase14/human_verification_receipt_and_checkpoint_design.md)
- [canonical_command_recipe_and_preflight.md](/C:/Dev/black-skies/docs/audits/phase14/canonical_command_recipe_and_preflight.md)
- [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md)
- [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md)
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- scoped implementation-boundary inspection of:
  - [backup_verifier.py](/C:/Dev/black-skies/services/src/blackskies/services/backup_verifier.py)
  - [preload.ts](/C:/Dev/black-skies/app/main/preload.ts)
  - [projectLoaderIpc.ts](/C:/Dev/black-skies/app/main/projectLoaderIpc.ts)
  - [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx)
  - [SnapshotsPanel.tsx](/C:/Dev/black-skies/app/renderer/components/SnapshotsPanel.tsx)
  - [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx)
  - [useRecovery.ts](/C:/Dev/black-skies/app/renderer/hooks/useRecovery.ts)
  - [draftPreviewSync.ts](/C:/Dev/black-skies/app/renderer/utils/draftPreviewSync.ts)
  - [DockWorkspace.tsx](/C:/Dev/black-skies/app/renderer/components/docking/DockWorkspace.tsx)
  - [docs/tests.md](/C:/Dev/black-skies/docs/tests.md)

## Runtime-Alignment Surface Map

| Surface family | Representative surfaces | Primary risks | Authority layers | Existing risk owners | Human-verification dependency | Rollback pressure |
| --- | --- | --- | --- | --- | --- | --- |
| runtime authority result shapes | backend verifier outputs, persisted verification report shape, service payload semantics | semantic labels can still drift from actual runtime or filesystem checks | `A1`, `A2`, `A3` | `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-SNAP-003` | Later | Medium |
| freshness and persisted-record reconciliation | `last_verification.json`, snapshot/report rereads, stale/orphan transitions | historical state can still read as current truth | `A1`, `A2`, `A3`, `A4` | `RDM-SNAP-002`, `RDM-SNAP-003` | Later | Medium |
| renderer and preload authority presentation | snapshot labels, toast copy, reveal/report actions, preload bridge wording, action gating | UI witness can overclaim A1/A2 truth, or silently collapse stale/orphan/degraded states | `A2`, `A3`, `A4` | `RDM-SNAP-001`, `RDM-GUI-001` | Yes for operator-facing trust claims | High |
| restore-alignment surfaces | restore buttons, restore-result copy, backup-restore copy, restore action gating | restore safety can be implied from the wrong evidence class | `A1`, `A2`, `A4` | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-BROWSE-001` | Yes | High |
| continuity-sensitive surfaces | project load, project switch, reload-from-disk, recovery routes, recent-project reopen | stale state, cross-project contamination, or root drift can invalidate otherwise-correct semantics | `A1`, `A2`, `A3`, `A4`, `A5` | `RDM-CONTINUITY-001`, `RDM-ALIAS-001` | Yes | High |
| preload/bridge and rebind surfaces | `setDevProjectPath`, `overrideServices`, bridge availability, floating-pane reload and rebind | harness-only or synthetic seams can look like live continuity truth | `A2`, `A4`, `A5`, `A6`, `A7` | `RDM-WRAPPER-001`, `RDM-HARNESS-001`, `RDM-TRUTH-001` | Yes | High |
| stale-state-sensitive surfaces | localStorage, session state, draft preview sync, cached project summary, floating-pane layout state | stale local state can survive project or scene changes and distort runtime truth | `A3`, `A4` | `RDM-CONTINUITY-001` | Yes | High |
| cross-project contamination surfaces | alias-root transitions, project-home bootstrapping, persisted recent-project state | one project identity can borrow truth from another | `A1`, `A3`, `A4`, `A5` | `RDM-ALIAS-001`, `RDM-CONTINUITY-001` | Yes | High |
| truth-lane and harness realism boundaries | truth lane, service stubs, synthetic hooks, harness-only loaders | narrow lane success can be overread as runtime closure | `A2`, `A5`, `A6`, `A7` | `RDM-TRUTH-001`, `RDM-HARNESS-001`, `RDM-WRAPPER-001` | Later | Medium |

## Implementation-Slice Candidates

| Candidate slice | Scope | Primary RDM inputs | What it may touch later | What it must not touch in the same slice |
| --- | --- | --- | --- | --- |
| `14B.1` Backend / Runtime Authority Result Alignment | Normalize backend and persisted-result claim shapes so runtime outputs match the accepted `14A` vocabulary without changing restore or continuity behavior | `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-SNAP-003` | verifier payload semantics, report-structure semantics, integrity label semantics | renderer/preload copy alignment, restore gating, continuity fixes, project-switch handling |
| `14B.2` Snapshot Freshness And Persisted-Record Reconciliation | Align stale, orphaned, missing-manifest, missing-directory, and report-fresh/report-stale behavior against the accepted contract | `RDM-SNAP-002`, `RDM-SNAP-003`, `RDM-ALIAS-001` | freshness transitions, report-read semantics, missing-artifact state handling | restore coordination, floating-pane continuity, broad GUI simplification |
| `14B.3` Renderer / Preload Authority Presentation Alignment | Bring user-visible snapshot, report, reveal, and action wording closer to the accepted contract without claiming continuity closure | `RDM-SNAP-001`, `RDM-GUI-001`, `RDM-BROWSE-001` | panel labels, toast labels, action affordance wording, preload wording surfaces | restore behavior, project-switch rebinding, memory continuity, broad layout cleanup |
| `14B.4` Restore / Continuity Coordination | Coordinate restore-facing truth claims with continuity-sensitive rebinding and root-identity constraints | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-CONTINUITY-001`, `RDM-ALIAS-001` | restore gating, continuity-dependent copy, post-restore authority sequencing | broad GUI simplification, truth-lane governance overhaul, memory or longform rollout |
| `14B.5` Controlled Verification Checkpoint Preparation | Prepare bounded post-slice checkpoints and required receipts before closure claims | `RDM-RISK-001`, `RDM-WRAPPER-001`, `RDM-CONTINUITY-001` | explicit checkpoint wiring, receipt references, slice-specific stop points | closure claims, human-verification execution, full `14C` work |

## Ordering Analysis

### Lowest-Risk Reconciliation Surfaces

- backend/runtime authority result shapes that can be aligned without changing restore behavior
- persisted report semantics and stale/orphan label discipline
- wording and claim-shape normalization before continuity-sensitive rebinding changes

### Highest-Risk Runtime Seams

- restore and backup user-facing paths
- project-switch and cross-project continuity
- preload bridge state and harness-only override seams
- floating-pane reload and rebind
- localStorage, cached project-summary, and draft-preview carryover

### Safest Implementation Order

1. `14B.1` Backend / Runtime Authority Result Alignment
2. `14B.2` Snapshot Freshness And Persisted-Record Reconciliation
3. `14B.3` Renderer / Preload Authority Presentation Alignment
4. `14B.5` Controlled Verification Checkpoint Preparation
5. `14B.4` Restore / Continuity Coordination

This order intentionally pushes restore and continuity coordination later because they are the most likely to reopen stale-state, cross-project, and human-verification gates.

## Dangerous Dependency Chains

- restore copy or button gating that assumes continuity correctness
- renderer or preload copy updates that silently imply backend/runtime truth
- freshness reconciliation that assumes alias-root identity is already stable
- truth-lane or harness success being used to justify closure on live continuity-sensitive claims
- continuity-sensitive UI work being attempted before stale-state reset discipline and checkpoint planning exist

## Recommended Bounded `/goal` Scope For Future Implementation

Recommended first implementation slice:

- `14B.1` Backend / Runtime Authority Result Alignment

Recommended bounded scope:

- one backend/runtime-facing claim family at a time
- explicit mapping to `RDM-SNAP-001`, `RDM-SNAP-002`, and `RDM-SNAP-003`
- no restore or continuity behavior edits
- no preload or renderer rebind work
- no truth-lane or harness scope expansion

## What Should Not Be Attempted In One `/goal`

Do not combine these in one implementation campaign:

- backend/runtime authority alignment plus renderer/preload wording plus restore coordination
- freshness reconciliation plus project-switch continuity hardening plus human-verification closure
- alias-root identity correction plus restore behavior changes
- truth-lane or harness realism work plus user-visible runtime closure claims
- floating-pane rebind work plus broad snapshot semantics cleanup plus restore UX work

## Planning Determination

`14B` planning topology is now stable enough for bounded future implementation work.

That does not mean `14B` is open for broad implementation.

It means the first bounded `14B` slice can be chosen honestly, with explicit stop gates, explicit rollback boundaries, and explicit human-verification dependencies.
