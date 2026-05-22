# Correction Block Decision Log

Status: Active
Date: 2026-05-22
Scope: Phase 28-31 correction block governance decisions

## Purpose

This log records correction-block decisions that affect authority, inventory, governance, and phase gating.
It is the canonical place to note corrections without silently overwriting the original audit record.

## Decision Records

| decision_id | date | phase | decision | status | evidence | affected_docs | rejected_alternatives | follow_up_required | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CB-001` | 2026-05-22 | 28 | Phase 28 closed and becomes input evidence for Phase 29 | accepted | `docs/audits/phase28/phase28_authority_audit_closure.md`; `docs/audits/phase28/authority_map.md`; `docs/audits/phase28/stale_doc_register.md`; `docs/audits/phase28/conflict_register.md`; `docs/audits/phase28/runtime_truth_alignment_notes.md` | `docs/audits/phase28_31/phase28_31_execution_plan.md`; Phase 28 closure artifacts | Keeping Phase 28 as active work; deferring closure evidence to Phase 29 | No | Phase 28 is closed from an audit-governance standpoint. |
| `CB-002` | 2026-05-22 | 28-31 | Candidate Phase 32 remains candidate-only | accepted | `docs/audits/phase28_31/phase28_31_execution_plan.md`; `docs/audits/phase31/phase31_roadmap_rewrite_and_phase_renumbering.md` | correction-block execution plan; Phase 30 spec; Phase 31 roadmap rewrite doc | Inserting Phase 32 into active numbering before Phase 31 evidence; promoting candidate language to committed scope | Yes | Candidate Phase 32 stays gated until Phase 31 evidence proves it is required. |
| `CB-003` | 2026-05-22 | 29 | Phase 29 requires stable IDs | accepted | `docs/audits/phase28_31/phase28_31_execution_plan.md`; `docs/audits/phase29/phase29_issue_risk_error_reconciliation.md` | correction-block execution plan; Phase 29 issue/risk/error reconciliation spec | Free-form inventory rows; recycled IDs; implicit references without stable IDs | No | IDs must remain stable and reusable only as historical references, never as new assignments. |
| `CB-004` | 2026-05-22 | 29 | Phase 29 requires human review before Phase 30 | accepted | `docs/audits/phase28_31/phase28_31_execution_plan.md`; `docs/audits/phase29/phase29_issue_risk_error_reconciliation.md` | correction-block execution plan; Phase 29 issue/risk/error reconciliation spec | Automatic promotion into Phase 30 without review sign-off | Yes | Phase 30 may not start until the Phase 29 closure gate is satisfied. |
| `CB-005` | 2026-05-22 | 28-31 | No new build work during the correction block except allowed validation blockers | accepted | `docs/audits/phase28_31/phase28_31_execution_plan.md` | correction-block execution plan | Untracked runtime/code changes, feature work, or roadmap jumps during correction work | Yes | Validation-blocker fixes only, with tracker or closure-note documentation. |
| `CB-006` | 2026-05-22 | 28-31 | Correction-block phases must not be compressed unless explicitly instructed | accepted | `docs/audits/phase28_31/phase28_31_execution_plan.md` | correction-block execution plan | Collapsing Phase 29-31 into one run without explicit instruction | No | Phase 29 work must not begin Phase 30 decisions. |

## Correction Rule

When a classification or gate decision changes:

1. Do not silently overwrite the old record.
2. Update the original row status or disposition.
3. Add or update a decision log entry.
4. Cite the evidence that invalidated the prior decision.
5. Preserve the original ID.
6. Record the rejected alternative and the reason it failed.
