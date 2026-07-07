# Stage 17 Vertical Slice Evidence Boundary

## 1. Repo gate result

Repository checkpoint commands reviewed:

- `git rev-parse HEAD`
- `git status -sb`
- `git status --short`
- `git log -8 --oneline`

Gate result: pass.

- `HEAD`: `52c3e8486a10789f813b1e3eb42ce53b2cdc9add`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean

Required recent history present:

- `docs(product): define Stage 17 vertical slice spine`
- `docs(product): define Stage 17 vertical slice scope`
- `docs(product): decide Stage 17 deferred issue slice impact`

## 2. Records inspected

The following records were inspected:

- `docs/product_systems/stage17_vertical_slice_spine.md`
- `docs/product_systems/stage17_vertical_slice_scope.md`
- `docs/product_systems/stage17_deferred_issue_slice_impact_decisions.md`
- `docs/product_systems/stage17_vertical_slice_entry_review.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`

## 3. Evidence/protection boundary purpose

Purpose:

- define what evidence, project data, fixtures, snapshots, receipts, runtime truth files, IPC evidence, and real projects the first vertical slice may or may not depend on
- preserve the current Stage 17 conclusion that the first slice is evidence-independent from protected sample/root/witness/receipt/snapshot/IPC/real-project material
- prevent Stage 17 planning from silently expanding into protected-evidence use, witness regeneration, fixture regeneration, or cleanup/archive behavior

## 4. Protected evidence list

Protected evidence remains off-limits:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

## 5. First-slice allowed data posture

Allowed first-slice planning posture:

- synthetic or minimal project data may be planned for Stage 19 implementation
- protected evidence may be referenced only as historical or governance context through existing records
- planning may describe a minimal slice that opens into a valid project context without depending on protected evidence
- planning may preserve clear separation between allowed synthetic/minimal project data and protected evidence

## 6. First-slice prohibited dependencies

The first vertical slice must not depend on:

1. protected evidence
2. sample-root paths
3. retained evidence-root paths
4. runtime truth receipts
5. `build/runtime_truth.json`
6. `build/runtime_truth.schema.json`
7. tracked snapshots
8. IPC snapshot evidence
9. generated witnesses
10. regenerated test fixtures
11. real user projects

The first slice also must not require:

- reading protected evidence as runtime input
- copying protected evidence into runtime inputs
- repairing protected evidence
- moving/archive/deleting protected evidence
- cleanup/archive execution

## 7. Synthetic/minimal project data posture

Synthetic/minimal project data posture:

- synthetic or minimal project data is the only allowed planning posture for first-slice build input
- that data must remain clearly distinct from protected evidence
- no existing protected sample-root, evidence-root, receipt, snapshot, IPC, or real-project material may be rebranded as synthetic/minimal data
- if the boundary between planned synthetic/minimal data and protected evidence becomes unclear, Stage 17 must block rather than silently widening scope

## 8. Relationship to retained sample-root/current-vs-historical classification

Relationship:

- Stage 17 slice-impact decisions excluded retained sample-root/current-vs-historical classification from first-slice dependence
- this boundary record makes that exclusion operational
- retained sample-root or retained evidence-root material may remain visible only as historical/governance context, not as slice input

## 9. Relationship to unsafe-to-classify traceability records

Relationship:

- unsafe-to-classify traceability records remain excluded from first-slice dependence unless a later readiness concern proves otherwise
- no such record may be used as protected-evidence runtime input for the slice
- any later readiness-relevant traceability concern goes to Stage 18 rather than silently entering the Stage 17 slice boundary

## 10. Relationship to restore/import identity exclusion

Relationship:

- restore/import identity remains excluded from the first slice
- this evidence boundary reinforces that exclusion by forbidding dependence on restore/import behavior, archive recovery, or protected sample-root/evidence-root material

## 11. Relationship to External Challenge / Current Validation promotion to Stage 18

Relationship:

- `External Challenge / Current Validation` substance remains promoted to Stage 18
- this Stage 17 boundary therefore does not require protected evidence or runtime truth evidence to satisfy Stage 17 slice definition
- if later readiness work shows evidence-boundary assumptions matter to current validation, Stage 18 must handle that explicitly

## 12. Stage 17 closure blockers

The following conditions block Stage 17 closure:

1. any first-slice dependency on protected evidence
2. any first-slice dependency on sample-root or retained evidence-root paths
3. any first-slice dependency on runtime truth receipts
4. any first-slice dependency on tracked snapshots or IPC evidence
5. any need to regenerate witnesses or test fixtures
6. any need to move, archive, delete, repair, or otherwise mutate protected material
7. any unclear boundary between synthetic/minimal project data and protected evidence

If later Stage 17 planning discovers that the slice requires protected evidence, Stage 17 must block rather than silently expanding scope.

## 13. Stage 18 carry-forward obligations

Stage 18 carry-forward obligations:

1. confirm the protected-evidence exclusion still holds before readiness closure
2. confirm restore/import identity exclusion still holds
3. perform full `External Challenge / Current Validation` review
4. confirm sample-root/protected-evidence exclusion still holds
5. receive any readiness-relevant traceability concern if one later arises

## 14. Stage 19 implementation guardrails

Stage 19 implementation guardrails:

1. Stage 17 does not authorize evidence mutation
2. Stage 17 does not authorize cleanup/archive execution
3. Stage 17 does not authorize runtime or test changes
4. Stage 19 must not assume access to protected sample/root/witness/receipt/snapshot/IPC/real-project material for the first slice
5. Stage 19 implementation remains blocked if the slice cannot be defined with synthetic/minimal project data separated cleanly from protected evidence

## 15. Recommended next safe action

Recommended next safe action:

- Jason review of this Stage 17 vertical slice evidence boundary record

After review, the next safe move is a read-only Stage 17 slice-boundary confirmation pass that checks the spine and scope against this evidence boundary before any later readiness work.

Required conclusions:

- the first slice is evidence-independent from protected sample/root/witness/receipt/snapshot/IPC/real-project material
- Stage 17 does not authorize evidence mutation
- Stage 17 does not authorize cleanup/archive execution
- Stage 17 does not authorize runtime or test changes
- Stage 18 must confirm the protected-evidence exclusion still holds before readiness closure

PZ_CONTINUE: Stage 17 vertical slice evidence boundary ready for Jason review
