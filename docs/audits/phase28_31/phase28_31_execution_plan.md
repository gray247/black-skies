# Phase 28-31 Correction Block Execution Plan

Status: Draft
Date: 2026-05-21

## 1. Correction Block Overview

Phases 28-31 are correction and governance phases, not feature phases.

Phase 28 is closed. Its artifacts are inputs to Phase 29, not active work.

Purpose of the block:

- reconcile planning docs with runtime truth
- classify real/current/historical/future-only/fantasy claims
- inventory issues, risks, errors, tools, buttons, panes, placeholders, and dev-only surfaces
- define the future writing surface and command center workflow
- define Story Unit workflow questions without prematurely building the system
- rewrite the roadmap only after evidence from Phases 28-30
- prevent architectural romanticism, panel accumulation, speculative intelligence, and roadmap mythology

This block is documentation-first and evidence-first. Runtime code changes are out of scope.
No new build work begins during the correction block except documented validation blockers approved under the build-freeze exception policy.

## 2. Pass Structure Per Phase

### Phase 28 - Planning / Roadmap Authority Audit (3-6 passes)

- Pass 1: Authority Inventory
- Pass 2: Conflict Detection
- Pass 3: Governance Definition
- Optional Passes 4-6: warning labels, archive labels, runtime-truth references, migration notes

Phase 28 is closed; use its final authority map, stale register, conflict register, runtime-truth alignment notes, and closure artifact as Phase 29 input evidence.

### Phase 29 - Issue / Risk / Error Reconciliation (5-10 passes)

- Pass 1: Surface Inventory
- Pass 2: Workflow Mapping
- Pass 3: Intelligence Audit
- Pass 4: Dev vs Production Audit
- Pass 5: Keep/Merge/Hide/Delete Matrix
- Optional Passes 6-10: deeper overlap analysis, runtime verification, UX contradiction review, historical cleanup, unresolved-risk documentation

Phase 29 inventory items must use stable IDs and evidence-quality scoring. IDs are never recycled.

### Phase 30 - GUI / Workflow Realignment Spec (4-8 passes)

- Pass 1: Workflow Spine
- Pass 2: Story Unit Workflow
- Pass 3: Visibility Rules
- Pass 4: Multi-Monitor Policy
- Pass 5: Dev GUI vs Production GUI
- Optional Passes 6-8: workflow mockups, interaction sequencing, state ownership diagrams, panel lifecycle definitions, migration planning

### Phase 31 - Roadmap Rewrite + Phase Renumbering (2-5 passes)

- Pass 1: Dependency Rewrite
- Pass 2: Gate Definition
- Pass 3: Migration Preservation
- Optional Passes 4-5: final cleanup, numbering fixes, roadmap compression/expansion, candidate Phase 32 insertion decision if proven required

### Candidate Phase 32 if inserted later - Story Unit Data Model + Qualitative Evaluation Foundation (5-12 passes)

- Story Unit persistence and governance
- scene/draft/outline compatibility
- migration planning
- local/API model evaluation
- cost/quality rubric
- human validation fixtures

## 3. Estimated Pass Counts

| Phase | Estimated passes |
| --- | --- |
| Phase 28 | 3-6 |
| Phase 29 | 5-10 |
| Phase 30 | 4-8 |
| Phase 31 | 2-5 |
| Candidate Phase 32 (if inserted) | 5-12 |

Warning:
Do not run Phases 28-31 as one mega-pass. The correction block must proceed as forensic investigations with explicit artifacts and stop conditions.

Operating constraint:
Do not compress multiple correction-block phases into one run unless explicitly instructed.
Phase 29 work must not begin Phase 30 decisions.

## 4. Artifact Registry

### Phase 28 artifacts

- `docs/audits/phase28/authority_map.md`
- `docs/audits/phase28/stale_doc_register.md`
- `docs/audits/phase28/conflict_register.md`
- `docs/audits/phase28/runtime_truth_alignment_notes.md`

### Phase 29 artifacts

- `docs/audits/phase29/gui_surface_inventory.csv` or `docs/audits/phase29/gui_surface_inventory.md`
- `docs/audits/phase29/tool_button_control_inventory.md`
- `docs/audits/phase29/intelligence_surface_matrix.md`
- `docs/audits/phase29/dev_vs_prod_surface_audit.md`
- `docs/audits/phase29/workflow_conflict_register.md`
- `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md`

### Phase 30 artifacts

- `docs/audits/phase30/writing_surface_spec.md`
- `docs/audits/phase30/command_center_spec.md`
- `docs/audits/phase30/story_unit_workflow_spec.md`
- `docs/audits/phase30/visibility_and_progressive_disclosure_rules.md`
- `docs/audits/phase30/multi_monitor_policy.md`
- `docs/audits/phase30/dev_gui_vs_production_gui_policy.md`
- `docs/audits/phase30/story_unit_governance_questions.md`

### Phase 31 artifacts

- `docs/audits/phase31/roadmap_dependency_gate_map.md`
- `docs/audits/phase31/roadmap_migration_map.md`
- `docs/audits/phase31/phase_renumbering_preservation_notes.md`
- `docs/audits/phase31/build_resume_decision.md`
- `docs/audits/phase31/candidate_phase32_decision.md`

### Correction-block decision log

- `docs/audits/phase28_31/decision_log.md`

## 5. Phase 29 Classification ID Scheme

Phase 29 inventory items must use stable IDs:

- `P29-SURF-001` for GUI/user-visible surfaces
- `P29-CTRL-001` for buttons, toggles, commands, palette entries, and menu/control surfaces
- `P29-WFLOW-001` for workflows
- `P29-INTEL-001` for intelligence/AI/analysis surfaces
- `P29-DEV-001` for dev/test/diagnostic surfaces
- `P29-RISK-001` for risks or unresolved hazards
- `P29-DOC-001` for doc-only claims that affect tool/workflow interpretation

Rules:

- IDs remain stable once assigned.
- IDs are not recycled.
- If an item is later merged, hidden, deferred, or deleted, keep the original ID and mark the new disposition.
- Later corrections must reference the original ID.

## 6. Inventory Schema (Phase 29)

Required fields:

- `classification_id`
- `surface_or_item`
- `type`
- `source_area`
- `file_or_component_path`
- `owner_doc_or_runtime_source`
- `user_facing_or_dev_only`
- `runtime_backed_or_placeholder`
- `current_visibility`
- `workflow_role`
- `overlaps_with`
- `recommended_disposition`
- `disposition_reason`
- `evidence`
- `evidence_quality`
- `confidence`
- `risk_level`
- `target_phase`
- `review_status`
- `notes`

Allowed values:

- `recommended_disposition`: `keep`, `merge`, `hide`, `defer`, `delete_candidate`, `dev_only`, `validate_first`
- `runtime_backed_or_placeholder`: `runtime_backed`, `partial`, `placeholder`, `mock`, `experimental_flagged`, `historical`, `future_only`, `unknown`
- `evidence_quality`: `direct_runtime_file`, `direct_doc_claim`, `test_reference`, `config_or_flag`, `inferred_from_multiple_sources`, `weak_needs_review`
- `confidence`: `high`, `medium`, `low`
- `review_status`: `pending`, `accepted`, `accepted_with_exceptions`, `rejected`, `needs_rework`
- `risk_level`: `low`, `medium`, `high`, `blocker`

## 7. Source Boundaries

Phase 29 inventory must inspect, at minimum:

- renderer components
- workspace/layout/docking components
- visible controls/buttons/toggles
- command registry or command-like structures
- IPC/preload bridges that expose visible behavior
- runtime flags/config that expose or hide GUI behavior
- docs-declared GUI surfaces
- tests/dev controls that may leak into product assumptions
- intelligence/analysis surfaces
- workflow entry points

It must not become an unbounded repo-wide fishing expedition.

If a new source area is needed, Phase 29 must record why.

## 8. Evidence Quality Requirements

Every inventory row must include evidence that can be checked without guessing.

Preferred evidence hierarchy:

1. `direct_runtime_file`
2. `direct_doc_claim`
3. `test_reference`
4. `config_or_flag`
5. `inferred_from_multiple_sources`
6. `weak_needs_review`

Rules:

- cite exact file paths
- note whether the item is runtime-backed, partial, placeholder, mock, experimental-flagged, historical, future-only, or unknown
- do not promote weak evidence to high confidence
- if evidence is weak, mark it for review instead of inferring product truth

## 9. No-Fantasy-Promotion Rule

Any future intelligence surface must be labeled as one of:

- `runtime_backed`
- `partial`
- `placeholder`
- `mock`
- `future_only`
- `unknown`

Do not let future intelligence claims read as current runtime capability.

## 10. Human Review Sign-Off Format

Each major Phase 29 pass must end with one of:

- `accepted`
- `accepted_with_exceptions`
- `rejected`
- `needs_rework`

The sign-off note must include:

- reviewer
- date
- scope reviewed
- evidence used
- exceptions or blockers
- next step

## 11. Correction and Rollback Mechanism

Wrong classifications are corrected without silent overwrite.

Process:

1. update the original row or artifact status
2. preserve the original `classification_id`
3. add a `decision_log` entry with the new decision
4. cite the evidence that invalidated the prior decision
5. keep the old disposition visible in notes when helpful

## 12. Build-Freeze Exception Policy

Runtime/code work is frozen during Phases 29-31 unless a validation blocker prevents audit progress.

Allowed exceptions only:

- validation blocker prevents docs/audit completion
- typo, lint, or doc-tooling fix blocks validation
- repository hygiene issue blocks audit progress
- fix is documented in the tracker or closure notes

Not allowed:

- new GUI features
- new intelligence features
- new Story Unit runtime behavior
- roadmap renumbering outside Phase 31
- Candidate Phase 32 insertion before the Phase 31 decision

## 13. Stop Conditions

Pause the correction block when any of the following occurs:

- unresolved authority conflicts
- inability to classify runtime truth
- Story Unit governance contradictions
- roadmap contradiction that affects phase order
- missing persistence authority
- dev-only surfaces that cannot be separated from production GUI
- fake intelligence surface that cannot be classified
- evidence that current phase scope is too broad to close
- human review required but not yet completed
- a classification cannot be corrected without erasing provenance
- a build-freeze exception is requested for non-validation work

## 14. Candidate Phase 32 Trigger Rules

### Candidate Phase 32 becomes required if Phase 28-31 cannot safely answer

- Are Story Units canonical persisted data or an adapter over scenes?
- How do Story Units relate to drafts, scenes, outline nodes, metadata, and exports?
- What are merge/split/delete/undo rules?
- What is the qualitative scoring model for local vs API routing?
- What fixture set proves intelligence usefulness without fake confidence?
- What migration path protects existing projects?
- What persistence authority owns Story Units?
- What human validation gates prove the workflow helps writers?

### Candidate Phase 32 may be deferred if

- Story Units can safely remain a workflow/spec concept for now
- GUI cleanup can proceed without changing persistence
- existing scene/draft/outline model can support the next safe slice
- qualitative model testing can be scoped into a later AI evaluation phase

### Candidate Phase 32 may be rejected only if

- Phase 30 proves Story Units are not the near-term architecture spine
- the roadmap explicitly chooses scene-first continuation with Story Units deferred
- all implications are documented in Phase 31

Candidate Phase 32 is not active numbering in this plan. It is candidate-only until Phase 31 evidence-based decision.

## 15. Human Validation Requirements

Human validation is mandatory for workflow-direction decisions.

- Phase 28: closed; no further review required for current closure unless reopened by operator instruction
- Phase 29: operator review of keep/merge/hide/defer/delete classifications
- Phase 30: operator review of Writing Surface, Command Center, Story Unit workflow, and dev-vs-production GUI policy
- Phase 31: operator approval before build resumes or candidate Phase 32 is inserted

## 16. Handoff Requirements

Each pass must report:

- files inspected
- files changed
- artifacts created
- decisions made
- evidence used
- assumptions invalidated
- unresolved questions
- stop conditions triggered
- validation commands/results
- recommended next prompt

Assistant continuity risk note:
Future assistants must treat this execution plan as the correction-block operating guide. They must not collapse phases, skip inventories, or resume feature work without the Phase 31 build-resume decision.

## 17. Validation

For each pass in this correction block, run at minimum:

- `git diff --check`
- `python scripts/check_repo_hygiene.py --tracked`

Also run obvious doc validation commands when available in repo tooling.

## 18. Cross-Phase Handoff Note

- Phase 28 identifies authority.
- Phase 29 inventories what survives.
- Phase 30 defines the future workflow.
- Phase 31 rewrites the roadmap.
- Candidate Phase 32 resolves Story Unit persistence and model-quality evaluation before GUI rebuild if and only if Phase 28-31 evidence proves it is required.
