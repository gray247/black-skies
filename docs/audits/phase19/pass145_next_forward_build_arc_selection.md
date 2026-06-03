# PASS 145 - NEXT FORWARD-BUILD ARC SELECTION

## 1. Files inspected

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/phases/phase_charter.md`
- `docs/audits/phase14/pass139_baseline_recovery_closure_review.md`
- `docs/audits/phase14/pass140_recovered_baseline_roadmap_checkpoint.md`
- `docs/audits/phase19/pass141_roadmap_authority_audit.md`
- `docs/audits/phase19/pass142_source_inventory_and_contradiction_register.md`
- `docs/audits/phase19/pass143_controlled_roadmap_docs_alignment.md`
- `docs/audits/phase19/pass144_secondary_roadmap_reference_cleanup_sweep.md`

## 2. Current recovered baseline summary

The recovered baseline is stable enough to move from recovery into forward build selection:

- scene switching / scene flicker is closed with a monitoring caveat
- snapshot timeout / misleading snapshot failure is closed with a monitoring caveat
- the remaining human validation checklist passed, with item 12 accepted with an evidence caveat
- roadmap authority references are reconciled through Pass 144
- no new recovery lane is justified

The baseline is recovered, but the project still carries monitoring caveats and watch items.

## 3. Candidate next arcs

Evaluated candidate arcs:

- Phase 15
- Phase 16
- Phase 17
- Phase 18
- GUI / splash / launch-flow rebuild
- critique / feedback hardening
- rewrite / sync polish
- export / packaging hardening
- diagnostics / error visibility polish
- emotion graph / story-structure visualization planning
- Memory Lab Phase 5A only if intentionally switching workstreams

## 4. Pros and cons of each candidate

### Phase 15 - Backup / Restore Authority Hardening

Pros:

- directly addresses the highest-value deferred items near the recovered baseline: restore, backup, browseability, and continuity
- fits the recovered state because restore semantics and backup validity are the next major trust boundary after baseline recovery
- aligns with the deferred matrix and does not require reopening closed scene or snapshot lanes

Cons:

- restore hardening may expose launcher/CWD or continuity assumptions, so it needs disciplined gating
- it is broader than a single UI polish lane

### Phase 16 - Test Harness / Fixture Governance

Pros:

- reduces fake-green risk and makes later validation lanes more trustworthy
- helps wrapper / launcher / CWD and truth-lane classification

Cons:

- does not directly advance product-facing recovery from the recovered baseline
- useful as a foundation, but not the best first forward-build arc after recovery

### Phase 17 - GUI Authority Simplification

Pros:

- improves operator clarity and reduces control-surface confusion
- relevant to the current phase-governance cleanup state

Cons:

- too UI-facing for the first move after recovery
- should follow authority hardening rather than lead it

### Phase 18 - New GUI Migration Gate

Pros:

- useful once GUI authority is settled and migration criteria are explicit

Cons:

- too early; it assumes downstream GUI authority clarity that the project does not yet need to spend on
- not the next honest step from a recovered baseline

### GUI / splash / launch-flow rebuild

Pros:

- could improve onboarding and startup perception

Cons:

- this is a broad product move, not a bounded next-build arc
- launch hygiene is a watch item, not a validated build lane
- should not be promoted ahead of restore/continuity reconciliation

### Critique / feedback hardening

Pros:

- aligns with the product’s editorial workflow
- could leverage already-healthy critique/rewrite surfaces

Cons:

- belongs after higher-risk authority and recovery boundaries are settled
- not the next priority from the recovered baseline

### Rewrite / sync polish

Pros:

- the rewrite/sync path already has history of targeted validation and can be iterated later

Cons:

- this is polish, not the next phase of forward recovery
- it should not precede restore/continuity and harness governance

### Export / packaging hardening

Pros:

- useful for release readiness and artifact trust

Cons:

- packaging is downstream of restore, continuity, and harness governance
- better as a later forward-build lane, not the first one

### Diagnostics / error visibility polish

Pros:

- improves user-facing trust during future recovery and feature work

Cons:

- should not become a substitute for core authority hardening
- lower priority than restore/backup and harness governance

### Emotion graph / story-structure visualization planning

Pros:

- useful for long-term product direction

Cons:

- belongs in a planning/spec pass first
- too speculative for immediate forward build

### Memory Lab Phase 5A only if intentionally switching workstreams

Pros:

- valid if the program intentionally changes scope

Cons:

- requires an explicit workstream switch
- not the default path from the recovered baseline

## 5. Dependencies and risks

Key dependencies:

- Phase 15 depends on the recovered baseline staying stable under monitoring caveats
- wrapper / launcher / CWD determinism may need to be checked as a prerequisite for restore hardening
- continuity assumptions must be controlled before restore/backup work can be considered trustworthy
- GUI migration and broader GUI rebuild work should wait until authority hardening settles

Key risks:

- moving directly to GUI or visualization work would spend effort before the restore/continuity boundary is hardened
- starting broad build work too early could reintroduce stale authority assumptions
- Memory Lab should not be selected without an explicit workstream switch

## 6. What should NOT be built next

- do not start GUI / splash / launch-flow rebuild as the primary next arc
- do not start emotion graph / story-structure visualization as the next arc
- do not jump directly into export / packaging hardening before restore/backup and continuity are addressed
- do not treat critique/rewrite polish as the primary forward-build move
- do not switch to Memory Lab implicitly

## 7. Deferred items that should remain deferred

- `RDM-CRITIQUE-001`
- `RDM-SYNTH-001`
- `RDM-TEARDOWN-001`
- `RDM-CI-001`
- `RDM-DOCS-001`
- `RDM-RISK-001`
- `RDM-FOCUS-001`
- `RDM-FUTURE-001`

## 8. Deferred items that should be promoted soon

- `RDM-WRAPPER-001`
- `RDM-CONTINUITY-001`
- `RDM-RESTORE-001`
- `RDM-BACKUP-001`
- `RDM-BROWSE-001`
- `RDM-GUI-001`
- `RDM-MIGRATE-001`

These items are the strongest near-term candidates because they directly shape the next reliable build path after recovery.

## 9. Recommended next forward-build arc

Recommended next forward-build arc:

- `Phase 15 - Backup / Restore Authority Hardening`

Why this arc:

- it is the first concrete build lane that naturally follows the recovered baseline
- it advances the highest-value deferred trust boundary without reopening closed recovery lanes
- it aligns with the deferred matrix and keeps later GUI work in the correct order

## 10. Recommended first implementation lane

Recommended first implementation lane:

- restore-as-copy eligibility contract

Reason:

- it is the sharpest first slice inside Phase 15
- it keeps the work bounded to restore semantics before broadening to backup, browseability, and continuity
- it is the best first check on whether the recovered baseline truly supports the next build arc

## 11. Whether GUI/splash belongs now, later, or as part of the selected arc

- GUI/splash belongs later, not now.
- It may ultimately be informed by Phase 17 or a future GUI migration path, but it is not part of the selected Phase 15 arc.
- Launch-flow hygiene remains a watch item unless it reproduces as a validated app defect.

## 12. Whether emotion graph belongs now, later, or needs a planning spec first

- Emotion graph belongs later.
- It needs a planning/spec pass first.
- It should not be treated as the next build arc from the recovered baseline.

## 13. Final verdict

`READY TO START NEXT FORWARD-BUILD ARC`
