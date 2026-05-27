# Rollback / Failure Semantics Reconstruction - Pass 36

## Purpose

This document reconstructs rollback, partial failure, failed mutation, failed restore/reopen, failed retrieval-linked action, stale-after-failure state, and recovery-after-failure semantics before any retrieval-linked command routes, structural command/search inheritance, or batch structural authority can stabilize.

It is a reconstruction-planning artifact only. It does not authorize rollback implementation, command/search implementation, topology architecture, graph architecture, Story Unit persistence, structural canon, workflow-state canon, retrieval-linked execution, GUI redesign, roadmap rewrite, phase renumbering, or Phase 32 activation.

Assumption handling:
- Current GUI remains transitional evidence, not workflow-state canon.
- Source-of-truth vocabulary remains unstable.
- Grouped retrieval traversal pressure does not split in this pass.
- Diagnostics evidence grouping remains deferred.
- Structural command/search inheritance remains deferred until rollback/failure semantics are reconstructed.
- Where evidence conflicts, this pass reports conflict instead of resolving it into implementation direction.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/retrieval_batching_grouping_pressure_pass35.md`
- `docs/audits/structural_retrieval_governance_pass34.md`
- `docs/audits/topology_containment_reconstruction_pass33.md`
- `docs/audits/stale_state_source_of_truth_reconstruction_pass32.md`
- `docs/audits/structural_mutation_governance_pass31.md`
- `docs/audits/continuity_authority_reconstruction_pass30.md`
- `docs/audits/story_unit_pressure_reconstruction_pass29.md`
- `docs/audits/batch_authority_multiselection_governance_pass28.md`
- `docs/audits/recovery_restore_reopen_governance_pass27.md`
- `docs/audits/command_search_inheritance_reconstruction_pass26.md`
- `docs/audits/workflow_state_authority_question_matrix_pass22.md`
- `docs/audits/provisional_workflow_state_family_inventory_pass21.md`

## Rollback / Failure Semantics Model

This model is provisional only. It is not implementation authorization, not command/search authorization, not topology authorization, not structural canon, and not workflow-state canon.

Failure semantics define how failed, partial, stale-after-failure, recovery-after-failure, and rollback-pressure states should be understood before any execution or retrieval-linked command route is authorized.

Core distinctions:
- rollback visibility is not rollback authority
- partial success is not canonical source-of-truth authority
- failed mutation output is not accepted continuity
- recovery-after-failure is not ordinary workflow
- failed action is not partial action
- rollback is not restore
- retry is not rollback
- stale-after-failure is not current authority

Provisional failure families:
- `Failed Action`: action did not complete and should not be treated as having changed authority.
- `Partial Action`: some effect may exist, but scope, authority, and source-of-truth status remain unsettled.
- `Rollback Pressure`: user/system desire to return to a prior state without automatically authorizing rollback.
- `Recovery-After-Failure`: exceptional path after failure, not ordinary workflow.
- `Stale-After-Failure`: state, retrieval result, advisory result, grouping, or continuity claim that may no longer govern.
- `Failure Evidence`: inspection or support evidence about failure, not repair or rollback permission.

## Executive Findings

- Rollback/failure semantics must remain a governance layer before any retrieval-linked execution, command route, batch authority, or structural command/search inheritance can stabilize.
- Partial success is the highest source-of-truth risk because it can make both old and new states appear authoritative.
- Failed mutation output must not become accepted continuity, structural identity, or source-of-truth authority.
- Rollback is separate from restore, retry, reopen, and recovery mutation.
- Stale-after-failure states are likely to appear meaningful and retrievable while no longer governing current work.
- Recovery-after-failure must remain exceptional and must not normalize support/recovery as ordinary workflow.
- Grouped retrieval and batch pressure magnify failure ambiguity because partial group effects can look coherent.

## Failed Mutation Findings

### Generation Failure

- Failed generation may leave prompt context, partial output, service evidence, or stale generated candidates.
- Failed generation output is not accepted continuity.
- Failed generation should not imply current draft mutation.
- Runtime/support truth may explain failure without granting retry, rollback, or diagnostics authority.

### Rewrite/Apply Failure

- Failed rewrite/apply can blur candidate rewrite, saved rewrite, attempted apply, and current draft authority.
- A failed apply attempt is not accepted mutation authority.
- A saved rewrite may remain a candidate, not applied state.
- Failure evidence must distinguish advisory result, candidate result, and accepted result.

### Structural Mutation Failure

- Structural mutation remains unauthorized, but failure pressure must still be reconstructed because future pressure may involve move, split, merge, reorder, group, ungroup, promote, or demote.
- Failed structural mutation can leave recomputed structures, stale groupings, or continuity claims that appear authoritative.
- Failed structural mutation must not create Story Unit persistence by accident.
- Recomputed structure after failure is not durable identity.

### Batch Mutation Failure

- Batch mutation failure is higher risk than single-action failure because some items may appear changed while others appear unchanged.
- Partial group effects must not become source-of-truth canon.
- Batch failure requires per-item and set-level authority separation.
- Batch mutation authorization remains blocked.

### Recovery Mutation Failure

- Failed restore, reopen, repair, or recovery mutation can create the strongest source-of-truth confusion.
- Recovery failure may leave prior, attempted, restored, reopened, or stale states visible at once.
- Recovery-after-failure is exceptional and not ordinary workflow.
- Failed recovery should not authorize diagnostics expansion or command/search recovery routes.

## Partial Failure Findings

- Partial failure occurs when effect, scope, completion, or authority cannot be treated as all-or-nothing.
- Partial failure may affect text, structure, grouping, retrieval results, recovery state, or continuity interpretation.
- Partial success must not be treated as canonical source-of-truth authority.
- Partial failure needs later rollback/recovery/source-of-truth vocabulary before implementation can be considered.
- Grouped retrieval can hide partial failure by presenting a coherent set after an incomplete operation.

## Rollback Authority Findings

- Rollback authority is not authorized in this pass.
- Rollback visibility is not rollback authority.
- Rollback is not restore; restore may use a backup/source state while rollback implies undoing or reversing a prior action.
- Rollback is not retry; retry attempts an operation again and may create new effects.
- Rollback is not reopen; reopen may load or rehydrate a state without reversing an action.
- Any future rollback authority would require source state, target state, affected scope, continuity impact, failure evidence, reversibility, and source-of-truth boundaries.

## Stale-After-Failure Findings

- Failure can make prior selections, retrieval sets, advisory outputs, generated results, rewrite candidates, recomputed groups, recovery evidence, and continuity claims stale.
- Stale-after-failure state can remain meaningful without governing current authority.
- Stale-after-failure retrieval is especially risky because it can look like current evidence.
- Stale-after-failure labels should not imply latest, current, clean, valid, recovered, or accepted authority.
- Command/search should not expose stale-after-failure state as actionable.

## Failure Visibility / Legitimacy Drift Findings

- Visible failure evidence can imply repair, rollback, retry, restore, or diagnostics authority.
- Repeated failure affordances can normalize recovery tooling.
- Grouped failure displays can imply batch recovery or batch rollback authority.
- Failure summaries can hide partial effects.
- Failure visibility near command/search can imply executable routes.
- Failure visibility near diagnostics can leak developer/test authority.

## Recovery-After-Failure Findings

- Recovery-after-failure is exceptional authority.
- Recovery-after-failure may be justified by real failure evidence, but evidence is not mutation permission.
- Recovery-after-failure must distinguish support truth, inspection evidence, recovery diagnostics, restore/reopen, repair, retry, and rollback.
- Recovery-after-failure should not become ordinary workflow or a global command/search route.
- Recovery diagnostics may support investigation but cannot authorize recovery mutation.

## Retrieval-Linked Failure Findings

- Retrieval-linked failure can occur when retrieval results are stale, partial, incomplete, inconsistent, or derived from failed reconstruction.
- Failed retrieval should not imply missing canonical objects.
- Partial retrieval should not imply partial object sets.
- Stale retrieval should not imply current source-of-truth authority.
- Retrieval-linked execution remains unauthorized.
- Retrieval failure must not become command/search failure recovery without later governance.

## Command/Search Failure Implications

- Command/search structural inheritance remains deferred.
- Command/search failure semantics would need route, prepare, preview, inspect, request, and execute distinctions before implementation.
- A failed command route should not imply failed execution.
- A failed preview should not imply failed apply.
- A failed inspection should not imply failed mutation.
- Retrieval-linked command routes remain blocked until rollback/failure semantics, source-of-truth vocabulary, and structural retrieval governance stabilize.

## Batch Failure Implications

- Batch failure multiplies ambiguity across items and across the group.
- A batch result can include failed, completed, skipped, stale, unchanged, partially changed, and unknown items.
- Grouped visibility can make partial outcomes look coherent.
- Batch rollback and batch recovery remain unauthorized.
- Batch failure requires later per-item and set-level source-of-truth semantics.
- Batch structural authority remains blocked.

## Highest-Risk Failure Ambiguities

- failed action versus partial action
- partial success versus source-of-truth authority
- failed mutation output versus accepted continuity
- rollback versus restore
- retry versus rollback
- reopen versus rollback
- stale-after-failure versus current authority
- failure evidence versus repair permission
- recovery-after-failure versus ordinary workflow
- failed retrieval versus missing canonical object
- batch partial result versus stable object set
- failed command route versus failed execution

## Deferred Dependencies

- `Structural Command/Search Inheritance`: required before retrieval-linked command routes or structural commands can inherit failure semantics.
- `Topology-Aware Mutation / Recovery Pressure`: required before relationship, hierarchy, traversal, or graph-like failure effects can be analyzed beyond pressure.
- `Diagnostics Evidence Grouping`: required before grouped failure evidence can be separated from diagnostics authority.
- `Retrieval-Linked Execution Pressure`: required before retrieved results can be considered action-bearing.
- `Source-Of-Truth Vocabulary`: required before current, stale, failed, partial, recovered, rolled back, retried, restored, or reopened states can be labeled safely.
- `Restore/Reopen Boundary Detail`: required before restore/reopen failure and rollback distinctions can stabilize.
- `Batch Continuity Authority`: required before grouped failure outcomes can claim continuity.
- `Structural Retrieval Failure Governance`: required before failed/stale retrieval can be exposed safely.

## What Must Not Be Promoted Yet

- rollback implementation
- structural command/search inheritance
- retrieval-linked execution
- Story Unit persistence
- topology architecture
- graph architecture
- structural canon
- workflow-state canon
- rollback visibility as rollback authority
- partial success as canonical source-of-truth authority
- failed mutation output as accepted continuity
- recovery-after-failure as ordinary workflow
- retry as rollback
- rollback as restore
- stale-after-failure as current authority
- batch rollback authority
- current GUI placement as rollback/failure design
- roadmap rewrite or phase renumbering

## Contradictions Found

- Failure evidence is necessary for support, yet visibility can imply repair or rollback authority.
- Partial success may contain real changes, yet cannot be treated as canonical authority without source-of-truth rules.
- Rollback may feel safer than restore, yet rollback still needs its own authority boundaries.
- Retry may feel harmless, yet retry can create new effects.
- Recovery-after-failure is necessary, yet repeated recovery visibility normalizes exceptional tooling.
- Retrieval failure can mean missing data, stale data, partial reconstruction, or no canonical object, but those meanings can look identical.
- Batch failure needs coherent presentation, yet coherence can hide partial authority splits.

## Areas Too Ambiguous To Stabilize Yet

- final rollback/failure vocabulary
- whether partial success can ever become current authority without explicit confirmation
- how rollback differs from undo, restore, reopen, retry, and repair
- how stale-after-failure should expire or be invalidated
- how failed retrieval should be labeled without implying missing canonical objects
- how batch partial outcomes should be represented
- how recovery-after-failure exits back to ordinary workflow
- how diagnostics evidence grouping interacts with failure evidence
- how command/search routes should report prepare, preview, inspect, request, and execute failures

## Questions For Orchestrator

- Should Pass 37 reconstruct diagnostics evidence grouping next, or source-of-truth vocabulary for failure states first?
- Should restore/reopen boundary detail be split before command/search structural inheritance resumes?
- Should failed retrieval semantics receive a dedicated pass before retrieval-linked execution pressure?
- Should batch partial outcome semantics split from general rollback/failure semantics?
- Should recovery-after-failure exit rules be stabilized before diagnostics evidence grouping?
- Should command/search structural inheritance remain fully deferred until source-of-truth vocabulary stabilizes?

## Recommended Reconstruction Pass 37

Run a thirty-seventh reconstruction pass focused on diagnostics evidence grouping.

Pass 37 should:
- keep diagnostics expansion unauthorized
- distinguish diagnostics evidence grouping from structural retrieval grouping, failure evidence grouping, support truth, and source-of-truth authority
- preserve rollback/failure semantics as provisional
- keep structural command/search inheritance deferred
- preserve topology architecture, graph architecture, Story Unit persistence, structural canon, command/search implementation, GUI redesign, roadmap rewrite, phase renumbering, and Phase 32 activation as unauthorized
