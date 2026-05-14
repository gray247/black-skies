Status: Produced
Canonical role: Bounded audit/allocation artifact for critique, intelligence, editorial-runtime, and adjacent continuity/orchestration risk before deeper implementation work depends on them.
Scope: Classify critique/intelligence/runtime-editorial surfaces by operational risk, authority layer, verification status, likely phase ownership, and roadmap follow-up need.
Owns: Critique/intelligence risk classification, ownership recommendation, dependency-pressure summary, and `RDM-*` recommendation for this area.
Does not own: Proof doctrine, phase sequencing, implementation work, critique/runtime fixes, test creation, GUI redesign, or Phase 14B execution.
Upstream dependencies: [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md), [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md), [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
Downstream dependencies: Future critique/intelligence follow-up allocation, human-verification planning, Phase 14B readiness review, and any later memory/longform/runtime-editorial stabilization work.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

# Critique / Intelligence Flow Risk Allocation

## Purpose

Critique and related intelligence/editorial flows have operational significance because they sit at the boundary between:

- backend model/routing behavior
- renderer workflow truth
- human-facing advisory output
- future memory and longform systems

Prior human verification and truth-lane history already exposed that critique/rewrite surfaces can appear healthier or more authoritative than they really are when launcher, harness, or runtime assumptions drift.

Governance now exists for this area, but runtime confidence remains partial and uneven.

This pass allocates ownership and risk only.
It does not implement fixes.

## Evidence Inspected

Governance and audit inputs:

- [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md)
- [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md)
- [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md)
- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
- [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md)
- [memory_runtime.md](/C:/Dev/black-skies/docs/specs/memory_runtime.md)
- [model_runtime.md](/C:/Dev/black-skies/docs/specs/model_runtime.md)
- [agents_and_services.md](/C:/Dev/black-skies/docs/specs/agents_and_services.md)
- [critique_rewrite_provenance.md](/C:/Dev/black-skies/docs/specs/critique_rewrite_provenance.md)
- [known_weaknesses_register.md](/C:/Dev/black-skies/docs/reviews/known_weaknesses_register.md)

Source and runtime surfaces inspected:

- [revision.py](/C:/Dev/black-skies/services/src/blackskies/services/routers/draft/revision.py)
- [critique.py](/C:/Dev/black-skies/services/src/blackskies/services/critique.py)
- [services.py](/C:/Dev/black-skies/services/src/blackskies/services/services.py)
- [draft_generation.py](/C:/Dev/black-skies/services/src/blackskies/services/operations/draft_generation.py)
- [long_form_execution.py](/C:/Dev/black-skies/services/src/blackskies/services/operations/long_form_execution.py)
- [orchestrator.py](/C:/Dev/black-skies/services/src/blackskies/services/memory_lab/orchestrator.py)
- [useCritique.ts](/C:/Dev/black-skies/app/renderer/hooks/useCritique.ts)
- [CritiqueModal.tsx](/C:/Dev/black-skies/app/renderer/components/CritiqueModal.tsx)
- [serviceStubs.ts](/C:/Dev/black-skies/app/tests/e2e/utils/serviceStubs.ts)

Search surfaces inspected:

- repo searches for `critique`, `critic`, `intelligence`, `editorial`, `rewrite`, `review`, `analysis`, `feedback`, `companion`, `memory`, `loop`, `longform`, `continuation`, `assistant`, `scene`, `draft`, `revision`, `chunk`, `orchestrator`, `agent`, `overseer`, `loreweaver`, `reflection`, `serviceStubs`, `overrideServices`, `generation`, `chat`, `completion`, `prompt`, `story`, and `phase-b2-memory-lab`

Missing or weak evidence:

- No fresh human-verification rerun exists for critique/intelligence after the roadmap-governance sequence.
- `docs/specs/agents_and_services.md` is explicitly planning/future scope, not runtime authority.
- Broader intelligence concepts such as Overseer/companion orchestration are not current runtime authority even though they appear in planning docs.

## Operational Classification

Risk classes used:

- `Trusted`
- `Partially trusted`
- `Observed risk`
- `Governance-only`
- `Deferred future`

Authority layers interpreted from the authority strategy:

- `A1` real filesystem/runtime
- `A2` real backend service
- `A3` canonical persisted records
- `A4` renderer/UI state
- `A5` harness/fixture state
- `A6` synthetic mode
- `A7` mock/stub behavior

## Intelligence Flow Table

| Surface | Evidence found | Risk class | Authority layers affected | Known symptoms or uncertainty | Runtime impact | Human verification status | Existing owner/RDM | Recommended owner phase | Recommended next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| critique/editorial flow | [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md) marks critique authoritative; [revision.py](/C:/Dev/black-skies/services/src/blackskies/services/routers/draft/revision.py) preserves provenance/budget telemetry; [useCritique.ts](/C:/Dev/black-skies/app/renderer/hooks/useCritique.ts) and [CritiqueModal.tsx](/C:/Dev/black-skies/app/renderer/components/CritiqueModal.tsx) keep critique advisory | Partially trusted | `A2`, `A3`, `A4` | Critique route and provenance are strong, but whole editorial-confidence story is broader than route truth alone | Medium | Historical route truth exists; no fresh post-governance human rerun | none direct | Phase 20+ provisional, with pre-longform stabilization support | Create a dedicated roadmap item and keep critique distinct from broader intelligence claims |
| draft/revision flow | Rewrite is authoritative in [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md); [critique_rewrite_provenance.md](/C:/Dev/black-skies/docs/specs/critique_rewrite_provenance.md) and tracker record conflict/provenance semantics | Partially trusted | `A2`, `A3`, `A4` | Rewrite/save/sync semantics are clearer than before, but still depend on project-root/path continuity and UI coordination | Medium | Human verification previously saw rewrite/path instability; not rerun after all later governance passes | covered indirectly by truth/editorial docs, not by a dedicated `RDM-*` item | Phase 20+ provisional, with dependency on restore/load continuity | Keep as a dependency note inside critique-confidence work rather than a separate new item in this pass |
| memory-assisted generation | [memory_runtime.md](/C:/Dev/black-skies/docs/specs/memory_runtime.md) says advisory memory is live but unification is incomplete; [draft_generation.py](/C:/Dev/black-skies/services/src/blackskies/services/operations/draft_generation.py) ingests continuity into advisory memory | Governance-only | `A2`, `A3` | Runtime exists, but the project explicitly says there is not yet one unified production “story mind” | High for future systems, low for current Phase 14A | No dedicated human verification for memory-assisted generation in current campaign | `RDM-FUTURE-001` | Phase 20+ provisional | Keep provisional until restore/load and authority semantics stabilize |
| longform continuation | [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md) lists long-form execution as implemented but off by default; [long_form_execution.py](/C:/Dev/black-skies/services/src/blackskies/services/operations/long_form_execution.py) contains fallback/provider gating | Governance-only | `A2`, `A3`, `A4` | Exists in code but not recently validated as an operationally trusted user-facing path | High for future systems | No current human verification in this governance chain | `RDM-FUTURE-001` | Phase 20+ provisional | Keep out of active implementation planning now |
| orchestration/agent assumptions | [services.py](/C:/Dev/black-skies/services/src/blackskies/services/services.py) has a local `AgentOrchestrator`; [agents_and_services.md](/C:/Dev/black-skies/docs/specs/agents_and_services.md) describes planned Overseer/companion roles and explicitly says they are not current runtime truth | Governance-only | `A2`, `A4`, `A7` | Planning language can be mistaken for live orchestration authority | Medium | Not human-verified as a runtime user-facing flow | none direct | Phase 20+ provisional | Keep governance-only until runtime ownership is explicit |
| companion/review loops | Planning docs mention companion mode and review automation, but current runtime authority does not present it as a validated baseline | Deferred future | `A2`, `A4`, `A7` | Concept exists in planning vocabulary more than current runtime confidence | Medium | Not verified in this campaign | none direct | Phase 20+ provisional | Defer until critique-confidence and runtime-boundary work are stronger |
| reflection/self-analysis behavior | Search results show no current baseline runtime authority for reflection-style self-analysis loops; any such behavior is planning or prototype-adjacent | Deferred future | `A2`, `A7` | No current trustworthy runtime claim should be made here | Low now, high if overclaimed | Never validated in this campaign | none direct | Phase 20+ provisional | Keep out of broad implementation `/goals` |
| runtime intelligence boundaries | [model_runtime.md](/C:/Dev/black-skies/docs/specs/model_runtime.md) says provider abstraction is improved but not provider-neutral everywhere; [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md) says provider calls are disabled by default unless enabled | Partially trusted | `A2`, `A3` | Routing and provider/runtime boundaries are real, but their operational trust depends on config and non-default paths | Medium | No dedicated human verification in this pass | none direct | Phase 20+ provisional, with support from current model/runtime docs | Keep as a constraint on future intelligence work, not a Phase 14 blocker |
| story-state continuity assumptions | [memory_runtime.md](/C:/Dev/black-skies/docs/specs/memory_runtime.md) and [draft_generation.py](/C:/Dev/black-skies/services/src/blackskies/services/operations/draft_generation.py) show continuity + advisory layering, not one canonical intelligence state | Partially trusted | `A2`, `A3` | Continuity exists, but any broader “story intelligence” claim would overstate the runtime | Medium | Not directly human-verified in this pass | `RDM-FUTURE-001` | Phase 20+ provisional | Keep continuity separate from intelligence confidence |
| editorial GUI/runtime coordination | [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md), and [CritiqueModal.tsx](/C:/Dev/black-skies/app/renderer/components/CritiqueModal.tsx) define user-facing critique/rewrite coordination | Partially trusted | `A2`, `A4` | UI truthfulness is stronger now, but coordination still depends on project-switch, wrapper/CWD, and runtime exception visibility constraints | Medium | Previous human verification and truth-lane diagnostics exist; no fresh dedicated rerun | indirectly constrained by `RDM-WRAPPER-001` and future project-switch work | Phase 17 for GUI coordination, Phase 20+ for broader intelligence confidence | Treat as a downstream dependency, not the primary owner |
| intelligence-related service stubs/synthetic behavior | [serviceStubs.ts](/C:/Dev/black-skies/app/tests/e2e/utils/serviceStubs.ts) and `__dev.overrideServices` surfaces remain harness-only | Observed risk | `A5`, `A6`, `A7` | Harness-only intelligence/critique behavior can look stable while live runtime trust remains unproven | High for false confidence | Not acceptable as human-verification substitute | `RDM-HARNESS-001`, `RDM-SYNTH-001` | Phase 16 | Keep synthetic and harness evidence explicitly non-authoritative |

## Human Verification Findings

### What was actually observed

- Human-verification and truth-lane history already observed critique/rewrite instability around:
  - rewrite/path continuity
  - route-root alignment
  - advisory UI truthfulness versus saved-state semantics
- Tracker history records critique-path regressions, rewrite conflict behavior, and manual/runtime observations that required later truthfulness cleanup.

### What remains uncertain

- Whether critique flow as a broader operational/editorial system is stable enough for future intelligence-heavy implementation work.
- Whether current critique confidence survives project-switch, wrapper/CWD, and deeper runtime-boundary audits without new contradictions.
- Whether broader intelligence concepts beyond critique/rewrite have any current closure-grade runtime confidence.

### What was never reproduced in this pass

- No new live human verification was run.
- No current runtime evidence was produced for Overseer, companion loops, or broad intelligence orchestration as a real operational baseline.
- No longform or memory-assisted generation user-flow verification was produced here.

### What likely belongs to future phases

- critique/intelligence confidence hardening
- memory-assisted generation classification
- longform continuation readiness
- orchestration/companion-runtime validation

### What may require dedicated audits later

- runtime JS exception visibility in critique-heavy flows
- recovery/load/project-switch continuity as it affects critique/rewrite state
- memory persistence risk classification
- longform continuation continuity audit

## Dependency Analysis

- `Phase 14A.1` is not blocked by critique/intelligence risk.
  - It is vocabulary/evidence-contract planning for snapshot authority, not critique implementation.
- `Phase 14B+` is indirectly constrained.
  - Deeper implementation work should not quietly assume critique/intelligence/runtime-editorial confidence that has not been validated.
- Future phases that depend on critique/intelligence stability:
  - `Phase 16` for harness/truth-lane realism where critique-facing stubs/harness behavior can distort evidence
  - `Phase 17` for editorial GUI/runtime coordination surfaces
  - `Phase 20+` for memory, longform, companion, and broader intelligence/runtime systems
- Memory and longform systems should remain `Phase 20+` provisional.
  - Current runtime exists.
  - Current operational confidence does not justify promoting them into near-term governed implementation.

## RDM Recommendation

Evidence supports a dedicated roadmap item.

Recommended item:

- `RDM-CRITIQUE-001`
- Title: `Critique / intelligence flow operational confidence`
- Severity: `S2 High-value stabilization`
- Ownership: `Backend / Renderer/UI / Operator workflow`
- Future phase: `Phase 20+`
- Future pass/slice: `critique/intelligence operational confidence follow-up`

Rationale:

- critique/rewrite route truth is stronger than the broader intelligence/runtime-editorial confidence story
- no current `RDM-*` item owns the operational-confidence question cleanly
- the problem is real enough to track now, but not immediate enough to promote ahead of current Phase 14/15/16 stabilization

## `/goals` Impact

Safe intelligence-related `/goals` scope now:

- docs/spec/governance planning
- read-only critique/runtime audits
- bounded ownership/allocation passes

Unsafe scope now:

- broad implementation `/goals` involving critique, intelligence, memory, longform, and orchestration together
- any campaign that treats harness critique behavior or planning-doc language as runtime truth

Required guardrails:

- explicitly classify whether the work touches:
  - route truth
  - renderer presentation
  - harness-only behavior
  - future/provisional intelligence concepts
- avoid combining critique confidence with memory/longform implementation assumptions in one campaign
- treat broader intelligence/orchestration concepts as governance-only until runtime confidence improves

Current recommendation:

- critique/intelligence should be excluded from broad implementation `/goals` until further validation and narrower ownership follow-up exist

## Open Questions for Operator

- Should critique/intelligence receive dedicated human verification later?
- Should memory-assisted generation remain provisional until after restore/load continuity stabilizes?
- Should longform continuation remain `Phase 20+` only?
- Should orchestration/agent concepts stay governance-only until runtime confidence improves?
- Do you want `RDM-CRITIQUE-001` to stay in `Phase 20+`, or should it be treated as explicit pre-longform stabilization support before any future intelligence campaign?
