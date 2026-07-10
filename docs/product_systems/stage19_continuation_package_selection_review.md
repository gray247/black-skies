# Stage 19 Continuation Package-Selection Review

## 1. Repository gate

Repository state was verified with:

- `git rev-parse HEAD`
- `git status -sb`
- `git status --short`
- `git log -10 --oneline`

Gate result: pass.

- `HEAD`: `45e708bf1928204f293754400e40a843e02f3dec`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean before this record was created
- first-slice closure commit: `45e708b` `docs(product): close Stage 19 first implementation slice`

## 2. Authority and purpose

Controlling starting disposition:

> Stage 19 first slice is closed; continuation requires a docs-only package-selection review that defines the Stage 19 completion boundary and authorizes exactly one next bounded implementation package.

This record performs that review.

It does not mutate runtime code, tests, fixtures, witnesses, protected evidence, dependencies, packaging, or generated artifacts.

The old `docs/audits/phase19/` family is historical roadmap-audit material. It does not control continuation of the current Stage 19 implementation stage.

## 3. Records and implementation seams inspected

Controlling records inspected:

- `docs/product_systems/stage17_vertical_slice_plan.md`
- `docs/product_systems/stage17_vertical_slice_spine.md`
- `docs/product_systems/stage18_closure_review.md`
- `docs/product_systems/post_stage18_future_plan_hardening_disposition.md`
- `docs/product_systems/stage19_implementation_entry_review.md`
- `docs/product_systems/stage19_first_mutation_review.md`
- `docs/product_systems/stage19_first_slice_runtime_progress_review.md`
- `docs/product_systems/stage19_first_slice_closure_review.md`

Read-only implementation seams inspected:

- `app/renderer/App.tsx`
- `app/renderer/salvage/MinimalTwoSurfaceShell.tsx`
- `app/renderer/salvage/MinimalTwoSurfaceShell.test.tsx`
- `app/renderer/salvage/salvageShellModel.ts`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- `app/renderer/__tests__/SplitCommandWorkspace.test.tsx`
- `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
- `app/main/projectBootstrap.ts`
- `app/main/projectLoaderIpc.ts`
- `app/main/runtimeSessionTruth.ts`
- `app/main/__tests__/projectLoaderIdentityWitness.test.ts`
- `app/shared/runtimeSessionTruth.ts`
- `app/shared/ipc/projectLoader.ts`

No protected-evidence path was inspected.

## 4. Current implementation finding

The closed first slice proved its contract in the isolated `MinimalTwoSurfaceShell` seam.

Repository inspection also found an existing application-integrated path:

- `App.tsx` already owns loaded-project activation and project identity rejection when `projectId` is absent
- `App.tsx` already derives an honest draft-session label from persisted, dirty, and unsaved state
- `App.tsx` already hosts `SplitCommandWorkspace` when the existing experimental split-command mode is requested
- `SplitCommandWorkspace` already preserves a wrapped writing surface and a separate `Command Center`
- the integrated workspace already consumes `LoadedProject` data and exposes deterministic, derived project context
- `projectLoaderIpc.ts` already loads project identity and drafts from disk
- `runtimeSessionTruth.ts` already separates runtime-only, persisted, dirty, unsaved, partial, and recovery-required classifications

The isolated first-slice component is not imported by `App.tsx` or any other production host.

Consequence:

- mounting a second shell in the application would duplicate an existing integrated two-surface path
- the next package should reconcile the accepted first-slice contract with the existing `App.tsx` plus `SplitCommandWorkspace` path
- it should not create a new application mode, a second project owner, a second save-state owner, or a parallel shell architecture

## 5. Stage 19 completion-boundary comparison

| Candidate boundary | What it would prove | Finding | Disposition |
| --- | --- | --- | --- |
| synthetic shell only | isolated two-surface presentation, local editing, and bounded synthetic status | already achieved by the closed first slice; too small to explain why Stage 19 remains open | reject as final Stage 19 boundary |
| application-integrated writing spine | the accepted surface and authority contract exists in the real application host | necessary intermediate proof, but it does not by itself prove durable author work | retain as Package `19.2`, not final boundary |
| durable local writing spine | one real project can be edited and durably saved with honest status | meaningful but incomplete if the saved work cannot be reopened through the same bounded spine | retain as Package `19.3`, not final boundary |
| project-open/save/re-entry spine | one local project can open, expose identity, support narrow prose editing, save durably, and reopen with honest state | finite, writer-meaningful, and aligned with the original Stage 17 spine without requiring restore/import breadth | select as Stage 19 completion boundary |
| larger implementation milestone | broader product capabilities or release-scale implementation | undefined and vulnerable to silent expansion | reject |

## 6. Selected Stage 19 completion boundary

Stage 19 completion boundary:

> A bounded local project-open/save/re-entry spine in which the application opens one project through the existing project authority path, visibly preserves project identity, exposes distinct Writing Surface and Command Center responsibilities, supports one narrow prose-editing flow, durably saves through the existing persistence owner, and reopens the saved work with honest state messaging.

Stage 19 closure requires all of the following:

1. the accepted first-slice authority contract is proven in the application-integrated path
2. one real local project can be opened through the existing loader without sample-root or protected-evidence dependence
3. the active project identity shown to the writer comes from the existing loaded-project authority
4. the Writing Surface remains the only prose-editing authority in the bounded spine
5. the Command Center remains advisory, derived, status-only, and non-gating
6. one deliberately invoked save path durably writes the narrow prose change through the existing persistence owner
7. dirty, unsaved, saving, saved, and failure posture is described honestly at the writer-facing boundary used by the package
8. the same project can be reopened through normal project loading and the saved prose is present
9. no package silently expands into restore/import, backup recovery, AI/model routing, critique, rewrite, outline expansion, export/import, connectors, provenance/sync, advanced diagnostics, or protected evidence
10. a final Stage 19 closure review verifies the integrated proof chain and names any later implementation work without treating it as part of Stage 19

Stage 19 completion does not mean:

- release readiness
- full product implementation
- full persistence, recovery, or migration coverage
- restore/import completion
- packaging completion
- AI, critique, rewrite, outline, export, connector, or advanced-diagnostics completion
- protected-evidence validation

## 7. Candidate continuation order

The following order is adopted as a dependency-guided candidate sequence. Only Package `19.2` is authorized by this record.

### Package 19.2 - Integrated first-slice reconciliation

Purpose:

- prove the closed first-slice surface, identity, writing-authority, Command Center, and save-state semantics in the existing application-integrated split-command path
- close only concrete gaps between the accepted first-slice contract and the existing integrated path

This package is authorized below.

### Package 19.3 - Narrow durable-save contract

Candidate purpose:

- connect one narrow prose-editing action to the existing durable persistence owner
- provide honest dirty, unsaved, saving, saved, and failure status

Status: candidate only; not authorized.

Package `19.3` requires a separate readiness and ownership review because first-slice persistence was explicitly excluded.

### Package 19.4 - Normal project re-entry proof

Candidate purpose:

- reopen the same normally loaded project after the narrow save and confirm the saved prose and identity remain correct

Status: candidate only; not authorized.

Normal project re-entry must remain distinct from restore, restore-as-copy, import, backup recovery, rollback, or migration.

### Package 19.5 - Integrated spine verification and Stage 19 closure review

Candidate purpose:

- verify the project-open/save/re-entry chain
- confirm all exclusions and authority boundaries remain intact
- close Stage 19 or block closure on a concrete unmet criterion

Status: candidate only; not authorized.

Numbering after `19.2` remains subject to the evidence produced by each completed package. A package may be split, reordered, or rejected through a later governance review, but it may not be silently widened.

## 8. Exactly one authorized next package

Authorized next package: `19.2` `Integrated first-slice reconciliation`.

### Required behavior

The package must verify and, only where a concrete gap exists, minimally adjust the existing application-integrated split-command path so that:

1. a normally loaded `LoadedProject` supplies visible project name and project identity
2. the existing wrapped writing surface remains available as the editing authority
3. `Command Center` remains separate, derived, non-gating, and unable to mutate manuscript truth
4. the integrated path exposes honest persisted versus dirty/unsaved session posture already derived by `App.tsx`
5. no synthetic project identity is presented as real loaded-project truth
6. the isolated `MinimalTwoSurfaceShell` remains evidence of the closed first slice and is not mounted as a duplicate production shell

### Initial allowed file scope

Read and, only if required by a proved gap, modify:

- `app/renderer/App.tsx`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- `app/renderer/__tests__/SplitCommandWorkspace.test.tsx`
- one focused existing or new `App` integration test under `app/renderer/__tests__/`

Reference-only for this package:

- `app/renderer/salvage/MinimalTwoSurfaceShell.tsx`
- `app/renderer/salvage/MinimalTwoSurfaceShell.test.tsx`
- `app/shared/ipc/projectLoader.ts`
- `app/shared/runtimeSessionTruth.ts`

No main-process, service, persistence, restore, recovery, configuration, preload, packaging, or protected-evidence file is authorized for mutation in Package `19.2`.

### Verification requirements

Package `19.2` must:

1. inspect actual Git state before mutation
2. establish a focused baseline for `SplitCommandWorkspace` and the selected `App` integration test
3. avoid runtime mutation if the integrated path already satisfies every required behavior
4. if a gap exists, make only the smallest renderer/test mutation inside the allowed scope
5. rerun the focused tests
6. inspect the final diff for scope leakage
7. produce a Package `19.2` closure review before any later package becomes eligible

### Stop conditions

Stop and block Package `19.2` if it requires:

- a new application mode or parallel shell owner
- new project loading or project identity authority
- persistence or file writing
- restore/import, recovery, rollback, or migration
- configuration, preload, main-process, or service mutation
- AI/model routing, critique, rewrite, outline expansion, export/import, connectors, or advanced diagnostics
- protected evidence, generated witnesses, regenerated fixtures, or snapshots
- broad refactoring or unrelated test repair

## 9. Non-authorized later work

This record does not authorize:

- Package `19.3`, `19.4`, or `19.5`
- any additional package inferred from the candidate order
- persistence implementation
- real save mutation
- restore/import or recovery implementation
- sample-root or protected-evidence use
- broad GUI redesign
- cleanup/archive execution
- model selection or routing optimization
- capability fixtures or evaluation-harness expansion

Completion of Package `19.2` makes the next governance review eligible only. It does not automatically authorize Package `19.3`.

## 10. Final disposition

Findings:

- Stage 19 remains open
- the synthetic first slice remains closed at `45e708b`
- the Stage 19 completion boundary is now the bounded local project-open/save/re-entry spine
- the continuation order remains evidence-driven rather than automatically fixed
- exactly one next package is authorized: Package `19.2` `Integrated first-slice reconciliation`
- no runtime mutation is authorized outside the Package `19.2` behavior, file, verification, and stop boundaries above

PZ_CONTINUE: Stage 19 continuation boundary defined; Package 19.2 integrated first-slice reconciliation authorized as the only next bounded implementation package
