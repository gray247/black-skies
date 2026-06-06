# Pass 212 - Rebuild vs Salvage Decision Record

## Purpose

This pass records a decision on whether Black Skies should continue evolving inside the current app or pivot to a salvage rebuild.
It is a planning record only. No rebuild starts here.

## Option A - Continue Internal Rebuild

### What this means

Keep the current Electron app, preload bridge, renderer shell, and project-family authority as the primary architecture and continue layering Phase 32 work into them.

### What gets preserved

- current project loader and bootstrap behavior,
- current project file family,
- current renderer shell and workspace surfaces,
- current recovery, export, project-switch, and diagnostics surfaces,
- the new Phase 32 shared foundation.

### Required next arcs

- persistence contract types or schema only,
- later persistence boundary implementation,
- later runtime read path for a narrative-object store,
- later UI consumption boundary for narrative objects or qualitative signals,
- later migration planning.

### Risks

- the current shell already concentrates too many responsibilities,
- scene-first authority and narrative-object authority are likely to collide,
- more adapters would be needed before cleaner runtime boundaries exist,
- preload sprawl and test-mode gravity would continue to grow,
- recovery, export, and project-switch would become harder to keep stable while ontology work is added.

### Likely cost

Medium to high, with a high risk of hidden complexity cost.

### When to stop

Stop choosing this path if:

- persistence requires invasive changes to `LoadedProject` loading and scene authority,
- StoryUnit or scene compatibility adapters start acting as permanent authority,
- runtime truth repeatedly diverges from test truth,
- each new ontology feature requires another shell-level workaround.

## Option B - Salvage Rebuild / Smaller Clean Solution

### What this means

Build a smaller clean Black Skies shell that preserves the known-good contracts and current project-family knowledge, while leaving behind the largest renderer and preload tangles.

### What known-good parts should be carried forward

- `narrativeObjectContract.ts`
- `narrativeObjectValidation.ts`
- `narrativeQualitativeSignals.ts`
- `narrativeQualitativeSignalValidation.ts`
- `narrativeStaticQualitativeEvaluator.ts` as test-only logic
- `app/shared/ipc/projectLoader.ts`
- selected loader and bootstrap logic from `projectLoaderIpc.ts` and `projectBootstrap.ts`
- `vitest` setup and the focused Phase 32 tests

### What should be left behind

- the current `App.tsx` orchestration shell,
- the current `preload.ts` bridge as a whole,
- the current `ProjectHome.tsx` as a direct carry-forward component,
- test-mode-heavy shell behavior,
- docking, floating-pane, split-command, and multi-mode shell complexity as a starting point,
- Companion-driven workflow assumptions,
- compatibility scaffolding as authority.

### What the smallest clean Black Skies shell would include

- clean project shell,
- create project,
- open project,
- current scene-first project loading,
- scene list and scene editor,
- basic project summary,
- reused narrative object contract modules in shared space,
- tests proving authority boundaries stay clean.

### What should be explicitly excluded at first

- Companion,
- Memory Lab,
- full GUI redesign,
- runtime qualitative evaluator wiring,
- migration,
- narrative-object persistence writes,
- export beyond the current basic stable subset or a placeholder,
- recovery expansion beyond a minimal bounded contract.

### Risks

- a salvage line still has upfront setup cost,
- current behaviors must be reselected instead of copied wholesale,
- some existing runtime conveniences may be delayed while the clean shell is established.

### Likely cost

Medium, but with lower long-term architectural risk than continued internal layering.

### When to choose it

Choose this when:

- shared foundation modules are worth preserving,
- current runtime/UI structure is too tangled to extend safely,
- a smaller shell can preserve scene-first validity while giving ontology work a cleaner future landing zone.

## Option C - Full Scratch Rebuild

### What this means

Discard the existing app structure entirely and rebuild Black Skies from zero, re-deriving loader contracts, project shell, renderer, persistence planning, and future ontology integration.

### What gets thrown away

- most current runtime implementation knowledge,
- current loader/bootstrap behavior as direct carry-forward code,
- existing bridge surfaces,
- existing renderer flows,
- current shared runtime contracts unless re-copied manually.

### What must be rebuilt

- loader bridge,
- project shell,
- scene editing experience,
- recovery and export integration points,
- all runtime authority boundaries,
- all future persistence integration paths.

### Risks

- highest cost,
- high schedule slip risk,
- unnecessary loss of working contracts and tested shared foundation,
- strong chance of reintroducing old problems while rebuilding basics.

### Likely cost

High.

### When it becomes justified

Only if salvage proves impossible because:

- even the loader/bootstrap/project-family logic cannot be carried forward safely,
- the current project format itself becomes untenable,
- static inspection or bounded tests show the preserved parts are misleading rather than useful.

## Recommended Decision

Recommended decision: `salvage rebuild / smaller clean solution`.

This recommendation is evidence-based:

- the Phase 32 shared foundation is compact, tested, and portable,
- `projectLoader.ts` and the existing scene-first project family are coherent enough to preserve as bounded authority inputs,
- `App.tsx`, `ProjectHome.tsx`, and `preload.ts` are large enough and coupled enough that layering persistence and narrative-object runtime authority into them would likely deepen the tangle,
- full scratch rebuild would discard too much useful code and project knowledge for too little gain.

The evidence does not support continuing the current shell as the main vehicle for ontology and persistence evolution.
It also does not support throwing away the known-good foundation entirely.

## If Salvage Rebuild Is Recommended

### Candidate Salvage Arc 1 - Minimal Black Skies Core

Possible contents:

- clean project shell,
- create or open project,
- scene list,
- scene editor,
- minimal project summary,
- reused narrative object contract and validation modules,
- reused loader contract shape,
- no Companion,
- no Memory Lab,
- no full GUI redesign,
- no migration yet,
- no runtime qualitative evaluator,
- no persistence writes beyond the current scene-first family.

The intent is to establish a smaller shell with fewer authorities before persistence and ontology runtime integration begin.

## If Continue Internal Rebuild Is Recommended

If this path is chosen despite the recommendation, the next safe arc remains:

- persistence contract types or schema only,
- no runtime writes,
- no migration,
- no GUI wiring.

That would be the least risky internal continuation path.

## Kill Criteria

Any future path should pivot if these conditions appear:

- persistence requires invasive changes to scene loading,
- the GUI cannot consume the foundation without brittle adapters,
- project switch or recovery keeps regressing under small changes,
- compatibility adapters become de facto authority,
- tests continue to pass while runtime truth remains weak or contradictory,
- a salvage shell cannot preserve current scene-first validity without reimporting the same tangles.

## Acceptance Criteria

This decision record is acceptable only if:

- it does not implement code,
- it does not delete or move files,
- it does not claim rebuild has started,
- it clearly separates evidence from recommendation,
- it gives the user a real decision point.
