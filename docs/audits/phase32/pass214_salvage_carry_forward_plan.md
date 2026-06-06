# Pass 214 - Salvage Carry-Forward Plan

## Purpose

This pass defines what should be carried forward into a salvage rebuild, what should wait, and what should remain reference-only.
It is a planning artifact only.

The target shell remains a two-work-surface system:

- `Writing Surface`
- `Command Center Surface`

The Writing Surface may be minimally functional first.
The Command Center Surface may begin as a minimal contextual workspace, but it should exist as a separate work surface from the start.

## Carry Forward Immediately

### Shared foundation modules

- `app/shared/narrativeObjectContract.ts`
  - decision: `carry forward`
  - reason: small, pure, portable contract authority
  - dependencies: minimal shared types only
  - risk: low

- `app/shared/narrativeObjectValidation.ts`
  - decision: `carry forward`
  - reason: strong validation authority for future shell and persistence planning
  - dependencies: contract types only
  - risk: low

- `app/shared/narrativeObjectFixtures.ts`
  - decision: `carry forward later`
  - reason: useful for tests, but not required for the first minimal shell runtime
  - dependencies: contract modules
  - risk: low

- `app/shared/narrativeSceneCompatibility.ts`
  - decision: `reference only`
  - reason: useful transitional logic, but dangerous if it enters the clean shell as native authority too early
  - dependencies: contract modules and scene-like input shapes
  - risk: medium-high

- `app/shared/narrativeQualitativeFixtures.ts`
  - decision: `carry forward later`
  - reason: useful for evaluator tests, not needed for the first writing shell
  - dependencies: contract modules
  - risk: low

- `app/shared/narrativeQualitativeSignals.ts`
  - decision: `carry forward`
  - reason: compact contract with bounded provenance and no grading language
  - dependencies: minimal shared types only
  - risk: low

- `app/shared/narrativeQualitativeSignalValidation.ts`
  - decision: `carry forward`
  - reason: strong signal validation boundary for later runtime use
  - dependencies: signal contract only
  - risk: low

- `app/shared/narrativeStaticQualitativeEvaluator.ts`
  - decision: `carry forward later`
  - reason: good pure logic, but should stay outside runtime until the clean shell, persistence boundary, and authority rules are proven
  - dependencies: qualitative fixtures and signal validation assumptions
  - risk: medium

### Foundation tests and scripts

- foundation tests under `app/renderer/utils/__tests__/`
  - decision: `carry forward`
  - reason: the new shell should inherit the boundary tests for the shared foundation immediately
  - dependencies: shared modules and vitest setup
  - risk: low

- `app/vitest.config.mjs`
  - decision: `carry forward`
  - reason: small and reusable
  - dependencies: existing test setup files
  - risk: low

- app test scripts from `app/package.json`
  - decision: `carry forward with trimming`
  - reason: `build`, `build:main`, `test`, and `lint` patterns are useful, but package surface should shrink for the minimal shell
  - dependencies: current app toolchain
  - risk: medium

## Carry Forward Later

These pieces are useful but should not enter the first clean shell:

- static qualitative evaluator runtime use,
- scene compatibility adapter runtime use,
- persistence schema implementation,
- export expansion,
- recovery expansion,
- project switch expansion,
- diagnostics UI,
- graph or emotion-map UI,
- Companion,
- Memory Lab,
- docking or split-command complexity,
- floating-pane and relocation workflows.

The first shell should prove Writing Surface flow, Command Center Surface separation, loading, and clean authority boundaries before any of these come back.

## Reference Only / Quarantine

- `app/renderer/App.tsx`
  - useful knowledge: project activation flow, current scene authority edge cases, shell feature inventory
  - wholesale-copy risk: concentrates too many responsibilities and test-mode paths
  - clean replacement should do instead: one minimal app root with clear Writing Surface and Command Center Surface boundaries, plus only the scene selection and editor behavior needed by minimal v0

- `app/main/preload.ts`
  - useful knowledge: existing IPC families and required bridge capabilities
  - wholesale-copy risk: API sprawl and mixed authority surface
  - clean replacement should do instead: expose only the narrow create/open/load/save project bridge required by minimal v0

- `app/renderer/components/ProjectHome.tsx`
  - useful knowledge: recent project behavior, sample open behavior, basic create/open interactions
  - wholesale-copy risk: mixes loader, diagnostics, session truth, local storage, scene selection, and preview responsibilities
  - clean replacement should do instead: separate project launcher concerns from the two work surfaces

- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
  - useful knowledge: compact scene-list rendering pattern
  - wholesale-copy risk: tied to `StoryUnitV1` compatibility scaffolding
  - clean replacement should do instead: render direct scene navigation inside the Writing Surface first, with no Story Unit dependency and no requirement that the Command Center be populated

- `app/renderer/hooks/useRecovery.ts`
  - useful knowledge: recovery-state gating and reopen-flow handling
  - wholesale-copy risk: coupled to current services, bridge assumptions, and test-mode behavior
  - clean replacement should do instead: keep recovery out of minimal v0 or reintroduce only after a narrower shell exists

- `app/main/projectLoaderIpc.ts`
  - useful knowledge: current project root discovery, outline loading, scene metadata loading, sample path handling
  - wholesale-copy risk: tied to current bootstrap classifications and existing project-family assumptions
  - clean replacement should do instead: preserve the good loader rules, but only behind a much narrower bridge and fewer shell assumptions

- `app/main/projectBootstrap.ts`
  - useful knowledge: current minimal project file creation path
  - wholesale-copy risk: direct reuse can import old starter and bootstrap assumptions
  - clean replacement should do instead: keep only the minimal create-project logic for the current scene-first family

- `app/shared/ipc/projectLoader.ts`
  - useful knowledge: compact `LoadedProject` contract and project loader API shape
  - wholesale-copy risk: lower than the others, but still bound to the current project family
  - clean replacement should do instead: likely preserve this shape with only minimal narrowing if needed

## Discard Candidates

These should probably not be carried forward unless later evidence changes:

- cluttered workflow assumptions,
- dashboard sprawl,
- test-mode-only runtime pathways inside the main shell,
- forced Story Unit entry assumptions,
- redundant compatibility bridges,
- diagnostics UI clutter,
- multi-mode shell orchestration as a starting point,
- preload-level bridge sprawl.

## Branch / Repo Strategy Options

### A. Continue on current branch with clean-shell subfolder

- pros
  - easiest immediate locality
  - simple diff visibility
- cons
  - high risk of accidental coupling to the old shell
  - weak isolation
  - easy to leak old assumptions into the new shell

### B. Create new salvage branch in same repo

- pros
  - preserves git history,
  - makes old and new easy to compare,
  - isolates implementation work from the current planning branch,
  - fits current monorepo and Codex workflow well
- cons
  - still requires discipline to avoid copying too much

### C. Create separate repo

- pros
  - maximum isolation
- cons
  - breaks easy comparison,
  - increases setup cost,
  - weakens shared test and foundation continuity,
  - adds user overhead too early

### D. Create experimental app package inside monorepo

- pros
  - strong implementation isolation with shared modules still available,
  - keeps history and comparison local
- cons
  - adds package-management complexity immediately,
  - may be more structure than the first salvage step needs

### Recommendation

Recommended strategy: `B. create new salvage branch in the same repo`.

Reason:

- it preserves the current app as reference,
- keeps comparison easy,
- avoids a separate-repo split before the direction is proven,
- avoids pushing clean-shell work directly into the current tangled branch state.

If the user later wants stronger structural isolation, `D` is the next-best option after branch-level approval.

## First Implementation Approval Gate

Before any rebuild implementation begins, the user should approve:

- branch or folder strategy,
- minimal shell scope,
- two-work-surface boundary,
- carry-forward list,
- first code slice,
- stop or kill criteria.

Without that approval, implementation should not begin.

## Kill Criteria

Salvage rebuild should stop or change direction if:

- the clean shell starts duplicating the old tangle,
- project loading complexity explodes again,
- the new shell cannot open or write minimal projects reliably,
- Phase 32 modules do not port cleanly,
- testing becomes weaker than the current repo,
- user workflow becomes more complex than the current app,
- Story Units begin acting like the first mandatory user entry gate.

## Acceptance Criteria

This plan is acceptable only if:

- it does not implement code,
- it clearly separates carry-forward from reference-only,
- it avoids dragging old tangle into the clean shell,
- it preserves known-good foundation work,
- it gives a concrete first implementation option.
