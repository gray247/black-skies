# Stage 19 Implementation Entry Review

## 1. Repo gate result

Repository checkpoint commands reviewed:

- `git rev-parse HEAD`
- `git status -sb`
- `git status --short`
- `git log -20 --oneline`

Gate result: pass.

- `HEAD`: `ef548254a13fe4d2f29e7b4cd6a16aae13d3244b`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean before this record was created

Required recent history present:

- `docs(product): disposition future-plan hardening after Stage 18`
- `docs(product): disposition hostile audit after Stage 18`
- `docs(product): close Stage 18 final readiness review`
- `docs(product): complete Stage 18 final readiness review`

Recent history reviewed:

```text
ef54825 docs(product): disposition future-plan hardening after Stage 18
a92e8dd docs(product): disposition hostile audit after Stage 18
8fb6073 docs(product): close Stage 18 final readiness review
a1ecf81 docs(product): complete Stage 18 final readiness review
5ace7a0 docs(product): disposition bounded loose ends for Stage 18
c5ccbdb docs(product): confirm protected evidence exclusion for Stage 18
726001b docs(product): complete Stage 18 external current validation review
fed8d60 docs(product): confirm restore import exclusion for Stage 18
ff3c945 docs(product): open Stage 18 final readiness review
572ed0a docs(product): disposition loose ends before Stage 18 entry
0ba429e docs(product): review loose ends before Stage 18 entry
2630437 docs(product): close Stage 17 vertical slice plan
da177cc docs(product): verify Stage 17 vertical slice plan
897a3ea docs(product): define Stage 17 vertical slice plan
41041e4 docs(product): confirm Stage 17 vertical slice boundaries
c4256fb docs(product): define Stage 17 vertical slice evidence boundary
52c3e84 docs(product): define Stage 17 vertical slice spine
630ac02 docs(product): define Stage 17 vertical slice scope
c2cd803 docs(product): decide Stage 17 deferred issue slice impact
8b10bbe docs(product): open Stage 17 vertical slice entry review
```

## 2. Jason authorization statement

Jason has explicitly authorized Stage 19 implementation entry.

That authorization opens Stage 19 only through this `19.0` implementation entry review / first implementation plan.

This authorization does not authorize:

- protected-evidence access or mutation
- witness creation or regeneration
- fixture creation or regeneration
- cleanup/archive execution
- automatic widening of the first slice

## 3. Stage 19 opening statement

Stage 19 is now the active stage.

Stage 19 begins only with a bounded implementation entry review and first implementation plan.

This record does not itself mutate runtime code or tests.

## 4. Records inspected

The following records were inspected:

- `docs/product_systems/stage18_closure_review.md`
- `docs/product_systems/stage18_final_pre_code_build_readiness_review.md`
- `docs/product_systems/stage18_post_closure_hostile_audit_disposition.md`
- `docs/product_systems/post_stage18_future_plan_hardening_disposition.md`
- `docs/product_systems/stage17_vertical_slice_plan.md`
- `docs/product_systems/stage17_vertical_slice_spine.md`
- `docs/product_systems/stage17_vertical_slice_evidence_boundary.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`

Repository structure was inspected only enough to identify likely first-slice implementation seams outside protected-evidence paths.

## 5. Current repo structure summary

High-level repo structure relevant to the first slice:

- `app/main/`
  likely Electron main-process authority, project bootstrap, project loading, runtime truth/session seams, and IPC registration
- `app/renderer/`
  likely renderer shell, screens, workspace composition, Writing Surface and `Command Center` presentation seams, and save-state/status UI
- `app/shared/`
  likely shared contracts for runtime session truth, split-command authority, mode policy, IPC payloads, and project-facing types
- `services/src/blackskies/services/`
  broader backend and capability surface, but much of it sits outside the bounded first slice and should be touched only if the first implementation mutation proves it is necessary
- `tests/`, `app/renderer/__tests__/`, `app/main/__tests__/`, `services/tests/`
  present but out of scope for mutation in this entry pass

Likely first-slice-adjacent files by name:

- `app/renderer/App.tsx`
- `app/renderer/salvage/MinimalTwoSurfaceShell.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/main/projectBootstrap.ts`
- `app/main/projectLoaderIpc.ts`
- `app/main/runtimeSessionTruth.ts`
- `app/shared/runtimeSessionTruth.ts`
- `app/shared/ipc/projectLoader.ts`
- `app/renderer/types/project.ts`

## 6. Controlling first implementation target

The controlling Stage 19 implementation target remains the Stage 17 first slice:

A minimal buildable spine proving Black Skies can open a project, preserve project truth/authority, expose the two-surface workflow, and support one narrow writer-facing flow without broad feature expansion.

Included spine:

1. Project context opens
2. Project truth/identity is visible
3. Two-surface shell is visible
4. Writing Surface supports narrow manuscript/prose work
5. Command Center supports minimal project/status awareness
6. Save-state/status is visible
7. Excluded systems remain excluded

## 7. Likely files to inspect or modify next

Most likely first-pass implementation files to inspect next:

1. `app/renderer/App.tsx`
2. `app/renderer/salvage/MinimalTwoSurfaceShell.tsx`
3. `app/renderer/components/ProjectHome.tsx`
4. `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
5. `app/renderer/components/WorkspaceHeader.tsx`
6. `app/main/projectBootstrap.ts`
7. `app/main/projectLoaderIpc.ts`
8. `app/main/runtimeSessionTruth.ts`
9. `app/shared/runtimeSessionTruth.ts`
10. `app/shared/ipc/projectLoader.ts`

Rationale:

- these names align most directly with project-open/load, visible project identity, two-surface composition, and bounded status visibility
- they appear closer to the smallest first-slice seam than the broader service, critique, export, restore, routing, or memory layers

## 8. Files and systems not to touch

Do not touch during initial Stage 19 first-slice work:

- protected evidence paths:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
  - `build/truth_receipts/**`
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
  - `ci_artifacts/**`
  - tracked snapshots
  - IPC snapshot evidence
  - real user projects
  - generated witnesses
  - regenerated fixtures
- restore/import paths and recovery-heavy systems
- broad AI/model routing and local/API dependency seams
- critique, rewrite, outline expansion, export/import, connectors, advanced diagnostics
- backup/rollback/migration/provenance/private-metadata/sync machinery
- packaging or theming/polish work beyond minimal two-surface visibility
- tests in this initial entry pass

## 9. First bounded implementation mutation recommendation

Recommended first bounded implementation mutation:

- start with the smallest renderer-shell seam that can make the two-surface shell plus visible project identity explicit without invoking excluded systems

Preferred first mutation target:

- renderer composition around `app/renderer/salvage/MinimalTwoSurfaceShell.tsx` and its immediate host shell

Why this is smaller than the whole slice:

- it can prove surface separation and visible project identity/status framing before deeper project-open/load or persistence behavior is widened
- it avoids immediate expansion into restore/import, export, critique, routing, or service-heavy seams
- it creates a narrow starting point for:
  - visible project context
  - Writing Surface presence
  - `Command Center` presence
  - minimal non-mutating status area

If that seam is not viable after file inspection, the next-smallest seam should be:

- bounded project identity/status handoff through `app/main/projectBootstrap.ts`, `app/main/projectLoaderIpc.ts`, and `app/shared/runtimeSessionTruth.ts` without widening into persistence, recovery, or restore behavior

## 10. Verification plan

Verification plan for the first implementation mutation:

1. verify the touched files remain inside the Stage 17/18 first-slice boundary
2. verify no excluded system is pulled in implicitly
3. verify Writing Surface and `Command Center` remain distinct
4. verify visible project identity/truth framing remains non-mutating
5. verify save-state/status remains narrow and informational
6. verify no protected evidence, witnesses, or fixtures are touched
7. verify no restore/import, export/import, critique, rewrite, routing, or packaging seams are widened by accident

## 11. Blockers

Blockers found at entry: none.

Potential re-block conditions:

1. the likely shell seam depends on excluded systems
2. visible project identity requires protected evidence or restore/import behavior
3. minimal status visibility cannot be added without dragging in broader degraded/recovery machinery
4. renderer shell work cannot be separated from routing, critique, export, or persistence expansion

## 12. Recommended next safe Codex prompt

Recommended next safe Codex prompt:

Create a narrow Stage 19 first-mutation review that inspects only the likely first-slice renderer-shell and project-identity files, confirms the smallest safe implementation seam, and then performs only that bounded mutation without touching tests, protected evidence, restore/import, routing, critique, export/import, or broader persistence machinery.

PZ_CONTINUE: Stage 19 implementation entry review ready for Jason review
