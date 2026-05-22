# Phase 28-31 Correction Block Execution Plan

Status: Draft
Date: 2026-05-21

## 1. Correction Block Overview

Phases 28-31 are correction and governance phases, not feature phases.

Purpose of the block:

- reconcile planning docs with runtime truth
- classify real/current/historical/future-only/fantasy claims
- inventory issues, risks, errors, tools, buttons, panes, placeholders, and dev-only surfaces
- define the future writing surface and command center workflow
- define Story Unit workflow questions without prematurely building the system
- rewrite the roadmap only after evidence from Phases 28-30
- prevent architectural romanticism, panel accumulation, speculative intelligence, and roadmap mythology

This block is documentation-first and evidence-first. Runtime code changes are out of scope.

## 2. Pass Structure Per Phase

### Phase 28 - Planning / Roadmap Authority Audit (3-6 passes)

- Pass 1: Authority Inventory
- Pass 2: Conflict Detection
- Pass 3: Governance Definition
- Optional Passes 4-6: warning labels, archive labels, runtime-truth references, migration notes

### Phase 29 - Issue / Risk / Error Reconciliation (5-10 passes)

- Pass 1: Surface Inventory
- Pass 2: Workflow Mapping
- Pass 3: Intelligence Audit
- Pass 4: Dev vs Production Audit
- Pass 5: Keep/Merge/Hide/Delete Matrix
- Optional Passes 6-10: deeper overlap analysis, runtime verification, UX contradiction review, historical cleanup, unresolved-risk documentation

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

## 5. Inventory Schema (Phase 29)

Required fields:

- `surface`
- `type`
- `location`
- `current_owner`
- `user_facing_or_dev_only`
- `runtime_backed_or_placeholder`
- `current_visibility`
- `workflow_role`
- `overlaps_with`
- `keep_merge_hide_defer_delete`
- `risk_level`
- `evidence`
- `target_phase`
- `notes`

Allowed values:

- `keep_merge_hide_defer_delete`: `keep`, `merge`, `hide`, `defer`, `delete_candidate`, `dev_only`, `validate_first`
- `runtime_backed_or_placeholder`: `runtime_backed`, `partial`, `placeholder`, `mock`, `experimental_flagged`, `historical`, `future_only`, `unknown`
- `risk_level`: `low`, `medium`, `high`, `blocker`

## 6. Stop Conditions

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

## 7. Candidate Phase 32 Trigger Rules

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

## 8. Human Validation Requirements

Human validation is mandatory for workflow-direction decisions.

- Phase 28: operator review of authority hierarchy and stale/future-only labels
- Phase 29: operator review of keep/merge/hide/defer/delete classifications
- Phase 30: operator review of writing surface, command center, Story Unit workflow, and dev-vs-production GUI policy
- Phase 31: operator approval before build resumes or candidate Phase 32 is inserted

## 9. Handoff Requirements

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

## 10. Validation

For each pass in this correction block, run at minimum:

- `git diff --check`
- `python scripts/check_repo_hygiene.py --tracked`

Also run obvious doc validation commands when available in repo tooling.

## 11. Cross-Phase Handoff Note

- Phase 28 identifies authority.
- Phase 29 inventories what survives.
- Phase 30 defines the future workflow.
- Phase 31 rewrites the roadmap.
- Candidate Phase 32 resolves Story Unit persistence and model-quality evaluation before GUI rebuild if and only if Phase 28-31 evidence proves it is required.
