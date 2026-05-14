Status: Reviewed
Canonical role: Shared proof doctrine for roadmap-governance artifacts and operational truth claims.
Scope: Define authority hierarchy, evidence classes, closure terms, missing-evidence handling, canonical-source rules, roadmap artifact status rules, ID namespace rules, and rebuild edit rules for snapshot, restore, authority, harness, workflow, human verification, and closure semantics.
Owns: Proof and authority rules for roadmap governance; shared roadmap artifact header template; acceptance-state rules; stale-source rules; evidence-limit rules.
Does not own: Phase sequencing, deferred backlog allocation, runtime implementation, GUI redesign, snapshot ontology implementation, restore behavior implementation, or Phase 14 execution planning.
Upstream dependencies: [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md), [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md), [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md), [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase13_audit_trust_validation_plan.md](/C:/Dev/black-skies/docs/phases/phase13_audit_trust_validation_plan.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
Downstream dependencies: [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
Last reviewed: 2026-05-14.
Acceptance record: 2026-05-14 - Codex - Reviewed after combined roadmap governance review; no operator acceptance recorded yet.

# Authority Reconciliation Strategy

## Purpose

This artifact defines a concise proof doctrine skeleton for operational truth claims.

It is initially applied to snapshot, restore, authority, harness, workflow, human verification, and closure semantics. It exists to standardize what evidence can support, what evidence can close, and which authority layer is allowed to prove which claim.

## Non-Goals

This artifact does not:

- implement snapshot ontology
- implement restore behavior
- modify runtime behavior
- define detailed phase sequencing
- create deferred backlog tables
- redesign GUI
- begin Phase 14 implementation

## Authority Hierarchy

| Rank | Authority | Definition | Can support | Cannot close |
| --- | --- | --- | --- | --- |
| A1 | Real filesystem/runtime | Live files, directories, paths, and runtime-observed behavior at the active project root | Filesystem existence claims, artifact readability, live operational behavior | Backend-only claims without runtime evidence |
| A2 | Real backend service | Live service behavior and service-validated operations | Verification runs, restore validation, backend action results | Filesystem claims not re-checked at runtime |
| A3 | Canonical persisted records | Persisted records such as `last_verification.json` and committed docs | Historical state, stored outcomes, cached operational context | Current integrity or live artifact existence by itself |
| A4 | Renderer/UI state | Visible UI state, labels, buttons, toasts, and modal content | UI-observed claims, operator-facing behavior, copy and gating states | A1 filesystem truth or A2 backend truth by itself |
| A5 | Harness/fixture state | E2E fixtures, seeded project roots, harness bootstrap rules | Harness-scoped contracts, fixture completeness, test setup assumptions | Real project behavior or filesystem truth outside the fixture boundary |
| A6 | Synthetic mode | Synthetic lanes that alter runtime behavior for controlled testing | Wiring, timing, contract shape, synthetic-only performance behavior | Real backend guarantees or real filesystem semantics |
| A7 | Mock/stub behavior | Mocked service or bridge responses | Isolated UI/harness contracts, fallback copy expectations | Operational safety, restore safety, or runtime authority |

### Hierarchy Rules

- `A4` cannot prove `A1`.
- `A5` cannot prove `A1`.
- `A6` cannot prove `A2`.
- `A7` cannot prove operational safety.
- Historical verification cannot prove current integrity.
- Renderer visibility cannot prove filesystem existence.
- Fixture materialization cannot prove real project behavior.
- Green CI cannot prove authority closure.

## Evidence Classes

| Evidence class | Typical sources | Can support | Cannot close by itself |
| --- | --- | --- | --- |
| Repo/document evidence | Committed docs, checked-in contracts, local file contents | What the repo claims, documented ownership, known non-goals | Live runtime truth, live filesystem truth, current GitHub state |
| Git history evidence | Commits, commit messages, local history | When a change landed, provenance, sequence of decisions | Current runtime behavior or operator safety |
| CI/workflow evidence | Workflow runs, job results, lane logs | That a configured lane passed, workflow wiring behavior, lane-specific regression coverage | Filesystem existence, restore safety, authority closure |
| Playwright/harness evidence | E2E runs, harness fixtures, synthetic servers | UI witness behavior, harness contracts, end-to-end wiring within harness scope | Real project-root truth outside the harness or full operational safety |
| Backend/runtime evidence | Live backend runs, service endpoints, runtime validations | Service behavior, restore validation, verification execution, runtime contracts | Filesystem truth not checked in the same runtime path |
| Filesystem evidence | On-disk directories, manifests, metadata, report files | Artifact existence, local readability, alias-root divergence | Backend policy decisions not exercised at runtime |
| Human/operator evidence | Operator observation, screenshots, manual runs | Real user-facing contradictions, degraded UX, operator trust risks | Repo-native proof unless reproduced or committed intentionally |
| Inference / needs verification | Cross-source reasoning, unresolved gaps | Planning hypotheses, suspected drift, next-step candidates | Closure or authority-grade claims |

### Evidence Rules

- Repo/document evidence can define policy and historical context, but it does not prove live behavior.
- Git history evidence can explain how the project changed, but it does not prove the project is correct now.
- CI/workflow evidence can close docs-only and lane-scoped claims when the lane definition is explicit.
- Playwright/harness evidence can close harness-scoped UI witness claims, not real filesystem authority.
- Backend/runtime evidence can close backend action claims only when the runtime path actually exercised the claim.
- Filesystem evidence is required for filesystem-existence claims.
- Human/operator evidence can block closure when it contradicts lower-authority witnesses.
- Inference remains `needs verification` until upgraded by the correct authority layer.

## Closure Terms

| Term | Definition |
| --- | --- |
| closure-grade | Sufficient evidence to close a scoped pass or phase claim, using the correct evidence class and required human verification where applicable |
| authority-grade | Evidence from the correct authority layer for the claim being made |
| CI-only acceptable | Acceptable only for low-risk docs-only work, static formatting/lint expectations, or harness-scoped claims that explicitly say they are harness-scoped |
| CI-only not acceptable | Not acceptable for snapshot integrity, restore safety, filesystem existence, alias migration, backup validity, operational safety, or degraded-state correctness |
| harness-only never enough | Never enough for real filesystem authority, real restore eligibility, real operator safety, current integrity, or project-root migration safety |
| human verification required | Required for snapshot browse/restore/report flows, backup/restore flows, degraded-state UX, offline behavior, new GUI migration gates, and destructive or copy/restore behavior |

## Missing Evidence Rules

- Missing evidence may block closure.
- Missing evidence may force `needs verification` status.
- Missing evidence may be recorded as absent.
- Missing evidence cannot be upgraded into fact.
- Operator screenshots remain operator-observed evidence unless committed or reproduced intentionally.

### Known Missing-Evidence Examples

| Missing evidence | Current handling |
| --- | --- |
| `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` missing at that path | Record as missing evidence; do not invent its contents |
| Operator screenshots not committed to the repo | Treat as operator-observed evidence only |
| Latest green GitHub workflow not repo-provable locally | Treat as unverified locally until checked with GitHub tooling or recorded evidence |

## Canonical Source and Stale-Source Rules

### Canonical Ownership

| Question | Canonical source |
| --- | --- |
| Current operational status | [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md) |
| Proof and authority rules | [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md) |
| Phase/pass sequencing | [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md) once created |
| Deferred/future allocation | [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md) once created |

### Stale Canonical-Source Rule

For governance and planning claims, update the stale canonical source before acting on the disputed claim.

### Emergency Exception

For urgent runtime repairs, work may proceed if the stale-source mismatch is recorded in the tracker during the same pass. Closure still requires canonical-source reconciliation.

## Roadmap Artifact Status and Acceptance Rules

### Required Header Template

Every roadmap governance artifact must start with:

```text
Status:
Canonical role:
Scope:
Owns:
Does not own:
Upstream dependencies:
Downstream dependencies:
Last reviewed:
Acceptance record:
```

### Acceptance States

- `Produced`
- `Reviewed`
- `Accepted`
- `Accepted with exceptions`
- `Rejected / revise`

### Acceptance Rules

- New roadmap governance artifacts start as `Produced`.
- Only operator/user instruction may move an artifact beyond `Produced`.
- Every status change during the rebuild requires a tracker update.
- Acceptance record must include date, actor, status, basis, and exceptions.

## ID Namespace Rules

- `RDM-*` IDs belong only to [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md).
- `P2-*` IDs remain historical source references from [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md).
- IDs are never reused.
- Retired IDs remain reserved.
- Merged IDs point to the surviving ID.
- Split IDs point to all child IDs.
- Source IDs remain searchable.
- Roadmap IDs stay stable even if title, severity, or status changes.

## Primary and Secondary Artifact Edit Rule

- Primary artifact per rebuild pass: one.
- Allowed secondary edits: tracker always.
- Earlier roadmap artifacts may be edited only to fix contradictions discovered during the current pass.
- No later roadmap artifact may be created early.

## Minimum Cross-Link Rule

Each roadmap governance artifact must reference:

- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- direct upstream evidence
- sibling roadmap artifacts if they exist
- planned sibling roadmap artifacts if they do not yet exist

For this artifact, planned sibling artifacts are:

- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)

## Phase 14 Applicability

Phase 14 should use this doctrine to evaluate:

- snapshot vocabulary
- stale and orphan semantics
- filesystem-existence claims
- historical verification claims
- browseability claims
- restorability claims
- report freshness claims
- degraded-state claims

This artifact does not draft Phase 14 sequencing. It only defines how Phase 14 claims must be evaluated.

## Open Questions and Deferred Decisions

| Question | Current status |
| --- | --- |
| Whether human screenshot evidence will later be reproduced or committed as audit evidence | Deferred; keep as operator-observed evidence until reproduced or intentionally documented |
| Whether Phase 14A.1 should update an existing spec or create a narrow new spec | Deferred; inspect existing spec ownership before deciding |
| Whether latest green GitHub workflow evidence should be verified with GitHub tooling before closure | Deferred; local repo state cannot prove it today |
