# PASS 142 - ROADMAP SOURCE INVENTORY AND CONTRADICTION REGISTER

## 1. Files and artifacts reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase19/pass141_roadmap_authority_audit.md`
- `docs/roadmap.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/phases/phase_charter.md`
- `docs/phases/phase_log.md`
- `docs/memory-lab/roadmap.md`
- `docs/BUILD_PLAN.md`
- `docs/phases/README.md`
- `docs/reviews/canonical_authority_and_validation_lanes.md`
- `docs/ops/README.md`
- `docs/agent_reading_guide.md`
- `docs/black_skies_docs_cleanup_checklist.md`
- `docs/backup_and_migration.md`
- `docs/diagnostics.md`
- `docs/critique_rubric.md`
- `docs/idea_backlog.md`
- `docs/deferred/voice_notes_transcription.md`
- `docs/deferred/smart_merge_tool.md`
- `docs/gui/accessibility_toggles.md`
- `docs/audits/phase14/pass131_scene_authority_human_retest_closure_review.md`
- `docs/audits/phase14/pass136_snapshot_timeout_human_retest_closure_review.md`
- `docs/audits/phase14/pass137_human_validation_remaining_checklist_review.md`
- `docs/audits/phase14/pass138_human_validation_results_and_baseline_readiness_review.md`
- `docs/audits/phase14/pass139_baseline_recovery_closure_review.md`
- `docs/audits/phase14/pass140_recovered_baseline_roadmap_checkpoint.md`
- `docs/audits/phase28/authority_map.md`
- `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md`
- `docs/audits/phase28/stale_doc_register.md`
- `docs/audits/phase28/conflict_register.md`
- `docs/audits/phase28/phase28_authority_audit_closure.md`

Note:

- The requested `docs/phase_log.md` path does not exist in this repository.
- The actual history ledger is `docs/phases/phase_log.md`.

## 2. Roadmap authority source inventory

### Current authoritative sources

| Source | Role | Classification |
| --- | --- | --- |
| `docs/BLACK_SKIES_FIX_TRACKER.md` | Live operational status, blockers, closures, and watch items | Canonical current operational status |
| `docs/roadmap/authority_reconciliation_strategy.md` | Proof doctrine, authority hierarchy, evidence classes, and closure rules | Canonical authority doctrine |
| `docs/roadmap/master_phase_allocation_plan.md` | Future phase and pass sequencing, gates, and renumbering | Canonical sequencing authority |
| `docs/roadmap/deferred_work_matrix.md` | Stable `RDM-*` IDs, deferred allocation, lifecycle state, and future destinations | Canonical deferred-work authority |
| `docs/phases/phase_charter.md` | Forward-looking scope contract | Scope authority only, not current status authority |

### Legacy or stale roadmap sources

| Source | Role | Classification |
| --- | --- | --- |
| `docs/roadmap.md` | High-level status spine with old live-authority language | Legacy / stale current-status snapshot |
| `docs/BUILD_PLAN.md` | Broad implementation map and phase summary | Supporting planning reference, not live authority |
| `docs/phases/README.md` | Phase index and navigation guide | Derivative index, not live authority |
| `docs/reviews/canonical_authority_and_validation_lanes.md` | Authority/validation guidance | Derivative guidance with stale authority mapping |
| `docs/ops/README.md` | Operational index and incident pointer guide | Derivative guidance, not authoritative phase status |
| `docs/audits/phase28/authority_map.md` | Finalized Phase 28 authority map | Historical authority map with stale roadmap classification |
| `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md` | Phase 28 authority audit closure | Historical closure artifact, not live authority |

## 3. Deferred-work source inventory

| Source | Role | Classification |
| --- | --- | --- |
| `docs/roadmap/deferred_work_matrix.md` | Canonical deferred ledger and `RDM-*` allocation | Current deferred-work authority |
| `docs/deferred/voice_notes_transcription.md` | Deferred feature plan | Deferred topic reference |
| `docs/deferred/smart_merge_tool.md` | Deferred feature plan | Deferred topic reference |
| `docs/gui/accessibility_toggles.md` | Planned accessibility feature plan | Deferred topic reference |
| `docs/idea_backlog.md` | Non-canonical future ideas list | Supporting backlog note |
| `docs/backup_and_migration.md` | Draft backup / migration guidance | Topic-specific planning reference |
| `docs/diagnostics.md` | Diagnostics policy draft | Topic-specific planning reference |
| `docs/critique_rubric.md` | Critique rubric source | Topic-specific spec reference, not roadmap authority |

Current deferred-work shape:

- `docs/roadmap/deferred_work_matrix.md` owns the stable backlog IDs and their future destinations.
- `docs/deferred/*`, `docs/gui/accessibility_toggles.md`, `docs/backup_and_migration.md`, `docs/diagnostics.md`, and `docs/critique_rubric.md` are topic references, not allocation authorities.
- `docs/idea_backlog.md` is a supporting ideas list and should not override the deferred matrix.

## 4. Historical-only source inventory

| Source | Why it is historical |
| --- | --- |
| `docs/phases/phase_log.md` | History ledger only |
| `docs/audits/phase14/pass131_scene_authority_human_retest_closure_review.md` | Closed recovery evidence |
| `docs/audits/phase14/pass136_snapshot_timeout_human_retest_closure_review.md` | Closed recovery evidence |
| `docs/audits/phase14/pass137_human_validation_remaining_checklist_review.md` | Human validation planning history |
| `docs/audits/phase14/pass138_human_validation_results_and_baseline_readiness_review.md` | Human validation record history |
| `docs/audits/phase14/pass139_baseline_recovery_closure_review.md` | Baseline closure evidence |
| `docs/audits/phase14/pass140_recovered_baseline_roadmap_checkpoint.md` | Recovered-baseline checkpoint history |
| `docs/audits/phase28/authority_map.md` | Finalized Phase 28 authority map, now historical context |
| `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md` | Closed Phase 28 planning/audit artifact |
| `docs/audits/phase28/stale_doc_register.md` | Closed stale-doc register |
| `docs/audits/phase28/conflict_register.md` | Closed conflict register |
| `docs/audits/phase28/phase28_authority_audit_closure.md` | Closed authority-audit record |
| `docs/black_skies_docs_cleanup_checklist.md` | Historical cleanup record |

## 5. Branch-specific source inventory

| Source | Role | Classification |
| --- | --- | --- |
| `docs/memory-lab/roadmap.md` | Memory Lab program roadmap for contested memory and memory-core work | Branch-specific planning, not repo-wide authority |

This file remains valid only when the workstream intentionally switches to Memory Lab.

## 6. Contradiction register

| Source A | Source B | Conflict | Risk if unresolved | Recommended correction | Safe now or later |
| --- | --- | --- | --- | --- | --- |
| `docs/roadmap.md` | `docs/BLACK_SKIES_FIX_TRACKER.md`, `docs/roadmap/master_phase_allocation_plan.md`, `docs/roadmap/authority_reconciliation_strategy.md` | `docs/roadmap.md` still claims to be the single planning and status authority, but the tracker is now canonical for current status and the master plan is canonical for sequencing. | Future edits may keep writing live status into the wrong file and reintroduce phase-order confusion. | Rewrite `docs/roadmap.md` as a legacy/high-level snapshot and route live status to the tracker and sequencing to the master plan. | Safe now |
| `docs/phases/phase_charter.md` | `docs/BLACK_SKIES_FIX_TRACKER.md` | The charter still points `Current phase status` at `docs/roadmap.md`, which is stale for live status. | Scope docs will continue to direct readers to a stale status source. | Point current status to the tracker and keep the charter as scope authority only. | Safe now |
| `docs/phases/phase_log.md` | `docs/BLACK_SKIES_FIX_TRACKER.md` | The history ledger still points `Current status authority` at `docs/roadmap.md` and tells readers to track active status changes there. | Historical ledger language can masquerade as active status authority. | Relabel the ledger as history-only and point current status changes to the tracker. | Safe now |
| `docs/BUILD_PLAN.md` | `docs/BLACK_SKIES_FIX_TRACKER.md`, `docs/roadmap/master_phase_allocation_plan.md` | The build plan says to use `docs/roadmap.md` / `phase_log.md` for current status and lock history. | The broad build map can be mistaken for a live status source. | Demote the build plan to supporting context and point current status to the tracker. | Safe now |
| `docs/phases/README.md` | `docs/BLACK_SKIES_FIX_TRACKER.md`, `docs/roadmap/master_phase_allocation_plan.md` | The phase index tells readers to use `docs/roadmap.md` for the current status snapshot. | The phase index repeats the stale status split and can mislead contributors. | Point readers to the tracker for current status and the master plan for sequencing. | Safe now |
| `docs/reviews/canonical_authority_and_validation_lanes.md` | `docs/BLACK_SKIES_FIX_TRACKER.md`, `docs/roadmap/master_phase_allocation_plan.md` | The authority map still labels roadmap.md as the current status source and lists phase_log as the dated ledger. | Validation guidance can continue to encode the old authority split and muddy closure criteria. | Update the authority map to the tracker/master-plan split and demote roadmap.md to supporting history. | Safe now |
| `docs/audits/phase28/authority_map.md`, `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md` | `docs/BLACK_SKIES_FIX_TRACKER.md`, `docs/audits/phase19/pass141_roadmap_authority_audit.md` | The Phase 28 authority artifacts still classify `docs/roadmap.md` as roadmap authority / status spine. | Later readers may treat the Phase 28 authority map as a live authority override and resurrect the stale roadmap claim. | Mark the Phase 28 authority artifacts as historical closure evidence only, or add an explicit stale-vs-live note tied back to the tracker. | Later decision |

## 7. Deferred ledger categories

### Keep deferred

- `RDM-CRITIQUE-001`
- `RDM-SYNTH-001`
- `RDM-TEARDOWN-001`
- `RDM-CI-001`
- `RDM-DOCS-001`
- `RDM-RISK-001`

### Promote soon

- `RDM-WRAPPER-001`
- `RDM-CONTINUITY-001`
- `RDM-RESTORE-001`
- `RDM-BACKUP-001`
- `RDM-BROWSE-001`
- `RDM-GUI-001`
- `RDM-MIGRATE-001`

### Obsolete or superseded

- `RDM-FUTURE-001`

### Needs new spec

- None identified in the current ledger. If a later pass discovers a gap, it should be derived from the chosen next build arc instead of invented now.

### Watch-only

- `RDM-FOCUS-001`

### Candidate next build arc

- Core repo-wide candidate arc: Phase 15 through Phase 18 after roadmap reconciliation, with Phase 15 the first likely build lane.
- Branch-specific candidate arc: Memory Lab Phase 5A only if the workstream intentionally switches to the Memory Lab program.

## 8. Candidate next build arcs, without selecting one yet

- Phase 15 - Backup / Restore Authority Hardening
- Phase 16 - Test Harness / Fixture Governance
- Phase 17 - GUI Authority Simplification
- Phase 18 - New GUI Migration Gate
- Memory Lab Phase 5A -> 8, if and only if the program scope intentionally switches to Memory Lab

## 9. Docs that should be edited in the next pass

- `docs/roadmap.md`
- `docs/phases/phase_charter.md`
- `docs/phases/phase_log.md`
- `docs/BUILD_PLAN.md`
- `docs/phases/README.md`
- `docs/reviews/canonical_authority_and_validation_lanes.md`
- `docs/ops/README.md`

## 10. Docs that should not be edited yet

- `docs/memory-lab/roadmap.md`
- `docs/audits/phase28/authority_map.md`
- `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md`
- `docs/audits/phase28/stale_doc_register.md`
- `docs/audits/phase28/conflict_register.md`
- `docs/audits/phase28/phase28_authority_audit_closure.md`
- `docs/audits/phase14/pass131_scene_authority_human_retest_closure_review.md`
- `docs/audits/phase14/pass136_snapshot_timeout_human_retest_closure_review.md`
- `docs/audits/phase14/pass137_human_validation_remaining_checklist_review.md`
- `docs/audits/phase14/pass138_human_validation_results_and_baseline_readiness_review.md`
- `docs/audits/phase14/pass139_baseline_recovery_closure_review.md`
- `docs/audits/phase14/pass140_recovered_baseline_roadmap_checkpoint.md`
- `docs/agent_reading_guide.md`
- `docs/black_skies_docs_cleanup_checklist.md`
- `docs/backup_and_migration.md`
- `docs/diagnostics.md`
- `docs/critique_rubric.md`
- `docs/idea_backlog.md`
- `docs/deferred/voice_notes_transcription.md`
- `docs/deferred/smart_merge_tool.md`
- `docs/gui/accessibility_toggles.md`

Reason:

- These files are historical, branch-specific, or topic-specific references. They should not be touched until the live authority pointers are reconciled first.

## 11. Recommended Phase 19.3 task

Recommended Phase 19.3 task:

- controlled roadmap docs alignment

Scope:

- patch the live authority pointers in `docs/roadmap.md`, `docs/phases/phase_charter.md`, `docs/phases/phase_log.md`, `docs/BUILD_PLAN.md`, `docs/phases/README.md`, and `docs/reviews/canonical_authority_and_validation_lanes.md`
- decide whether the Phase 28 authority artifacts should be relabeled as historical-only now or held for a later cleanup pass
- re-run `git diff --check` and `pnpm lint:docs` after the pointer cleanup

## 12. Final verdict

`READY FOR CONTROLLED ROADMAP DOCS ALIGNMENT`
