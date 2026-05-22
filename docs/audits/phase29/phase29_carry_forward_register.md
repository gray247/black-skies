# Phase 29 Carry-Forward Register

Status: Draft carry-forward register
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 6 - Closure Synthesis and Carry-Forward Governance

## Purpose

This register preserves unresolved or deferred governance issues that must survive beyond Phase 29.
Blocking classifications in Phase 29 refer to blocking future workflow promotion, authority approval, or implementation progression in affected areas unless a row explicitly states that it also blocks Phase 29 closure itself.

## Carry-Forward Rows

### P29-CARRY-001

- carry_forward_id: `P29-CARRY-001`
- related_ids: `P29-SURF-002`; `P29-BOUND-002`
- issue: Workspace Header authority overload still requires explicit decomposition policy
- category: workflow_authority
- why_not_resolved_in_phase29: Phase 29 classified the overload but did not redesign or specify replacement workflow architecture
- required_future_phase: Phase 30
- blocking_or_nonblocking: blocking
- risk_level: high
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/workspace_header_disposition_review.md`; `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-SURF-002`
- notes: Blocking here means blocking future promotion of the current header as an accepted workflow authority, not blocking Phase 29 closure.

### P29-CARRY-002

- carry_forward_id: `P29-CARRY-002`
- related_ids: `P29-SURF-010`; `P29-INTEL-006`; `P29-BOUND-005`
- issue: rewrite/apply trust and mutation boundary remains unresolved
- category: mutation_risk
- why_not_resolved_in_phase29: Phase 29 confirmed the risk but did not perform qualitative validation or policy approval
- required_future_phase: Phase 30 and Candidate Phase 32 if promoted
- blocking_or_nonblocking: blocking
- risk_level: severe
- recommended_next_owner: Phase 30 workflow realignment spec with possible Candidate Phase 32 validation
- evidence: `docs/audits/phase29/mutation_authority_review.md`; `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-SURF-010`
- notes: This is the highest-risk carry-forward item.

### P29-CARRY-003

- carry_forward_id: `P29-CARRY-003`
- related_ids: `P29-SURF-013`; `P29-CTRL-010+011`; `P29-BOUND-007`
- issue: snapshot, backup, and restore visibility must be fenced into support authority
- category: persistence
- why_not_resolved_in_phase29: Phase 29 classified support-only governance but did not define future product policy for when and how users reach these controls
- required_future_phase: Phase 30
- blocking_or_nonblocking: nonblocking
- risk_level: high
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/persistence_and_recovery_surface_review.md`; `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-SURF-013`
- notes: Nonblocking for Phase 29 closure, but must remain explicit before GUI rebuild work.

### P29-CARRY-004

- carry_forward_id: `P29-CARRY-004`
- related_ids: `P29-SURF-014`; `P29-DEV-005`; `P29-BOUND-008`; `P29-BOUND-009`
- issue: support-versus-diagnostics boundary remains mixed
- category: support_vs_dev
- why_not_resolved_in_phase29: audit evidence is sufficient, but actual support policy and containment decisions are later work
- required_future_phase: Phase 30
- blocking_or_nonblocking: blocking
- risk_level: high
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/support_vs_dev_boundary_review.md`; `docs/audits/phase29/dev_vs_product_surface_disposition.md`
- notes: Blocking here applies to product promotion of these surfaces, not to Phase 29 closure.

### P29-CARRY-005

- carry_forward_id: `P29-CARRY-005`
- related_ids: `P29-SURF-006`; `P29-INTEL-001`; `P29-SURF-012`; `P29-INTEL-002`
- issue: Story Insights and Companion authority must stay contextual unless later policy and validation justify more
- category: intelligence_authority
- why_not_resolved_in_phase29: the audit classified them, but usefulness and long-term authority are not proven
- required_future_phase: Phase 30 and possibly Candidate Phase 32
- blocking_or_nonblocking: nonblocking
- risk_level: high
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/intelligence_surface_disposition_review.md`; `docs/audits/phase29/phase29_pass5_disposition_summary.md`
- notes: Nonblocking for closure, but promotion beyond contextual authority needs stronger proof.

### P29-CARRY-006

- carry_forward_id: `P29-CARRY-006`
- related_ids: `P29-SURF-008`; `P29-INTEL-004`
- issue: Relationship Graph remains capped at advanced-only pending stronger justification
- category: visibility_governance
- why_not_resolved_in_phase29: the audit did not attempt to prove that the graph deserves broader visibility or deeper product authority
- required_future_phase: Phase 30
- blocking_or_nonblocking: nonblocking
- risk_level: medium
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/intelligence_surface_disposition_review.md`
- notes: The cap is explicit; later phases would need to overturn it with evidence.

### P29-CARRY-007

- carry_forward_id: `P29-CARRY-007`
- related_ids: `P29-SURF-015`; `P29-INTEL-007`; `P29-BOUND-010`
- issue: Split Command remains deferred experimental workflow pressure
- category: experimental_workflow
- why_not_resolved_in_phase29: Phase 29 explicitly avoided turning experimental shells into stable roadmap authority
- required_future_phase: Phase 30 and Phase 31
- blocking_or_nonblocking: nonblocking
- risk_level: high
- recommended_next_owner: Phase 30 workflow realignment spec with Phase 31 roadmap rewrite follow-through
- evidence: `docs/audits/phase29/experimental_workflow_pressure_review.md`; `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-SURF-015`
- notes: The experimental shell remains visible evidence, but not accepted product direction.

### P29-CARRY-008

- carry_forward_id: `P29-CARRY-008`
- related_ids: `P29-CTRL-017`; `P29-INTEL-008`
- issue: command-style access future visibility remains unresolved
- category: orchestration
- why_not_resolved_in_phase29: audit evidence showed overlap and maturity risk, but user-facing strategy is a later policy question
- required_future_phase: Phase 30
- blocking_or_nonblocking: nonblocking
- risk_level: medium
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-CTRL-017`; `docs/audits/phase29/phase29_pass5_disposition_summary.md`
- notes: This carry-forward also affects command palette assumptions.

### P29-CARRY-009

- carry_forward_id: `P29-CARRY-009`
- related_ids: `P29-CTRL-006`
- issue: export workflow authority remains unresolved
- category: workflow_authority
- why_not_resolved_in_phase29: audit evidence was sufficient to cap export as advanced-only, but not to define its future place in workflow policy
- required_future_phase: Phase 30
- blocking_or_nonblocking: nonblocking
- risk_level: medium
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-CTRL-006`; `docs/audits/phase29/phase29_pass5_disposition_summary.md`
- notes: This remains one of the explicit human-review checkpoints.

### P29-CARRY-010

- carry_forward_id: `P29-CARRY-010`
- related_ids: `P29-SURF-005`; `P29-CTRL-003+004`
- issue: Writing Surface authority boundaries still need explicit future policy
- category: workflow_authority
- why_not_resolved_in_phase29: Phase 29 protected the authoring core but did not define the final surrounding workflow envelope
- required_future_phase: Phase 30
- blocking_or_nonblocking: blocking
- risk_level: high
- recommended_next_owner: Phase 30 workflow realignment spec
- evidence: `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md:P29-SURF-005`; `docs/audits/phase29/phase29_closure_readiness_report.md`
- notes: Blocking here means future rebuild work must not assume this policy is already decided.
