# Pass 213 - Minimal Clean Shell Boundary

## Purpose

This pass defines the minimal clean shell boundary for a Black Skies salvage rebuild.
It does not start the rebuild, move files, or implement a new shell.

## Salvage Rebuild Definition

For this project, salvage rebuild means:

- not a full scratch rewrite,
- not blind continuation inside the current app shell,
- not runtime migration yet,
- a smaller clean solution that reuses known-good modules, contracts, tests, and loader lessons while refusing to inherit the old shell's central tangles.

The core idea is selective carry-forward, not wholesale copy and not total reset.

## Minimal v0 Shell

The smallest useful Black Skies shell should include:

- Electron app shell,
- create project flow,
- open project flow,
- a two-work-surface system,
- a `Writing Surface`,
- a `Command Center Surface`,
- one scene or prose editor surface inside the Writing Surface,
- simple project state display,
- current scene-first local project data read or write plan at planning level only,
- test harness from day one,
- a narrow preload bridge,
- a narrow loader contract,
- no Companion,
- no Memory Lab,
- no runtime qualitative evaluator integration,
- no graph UI,
- no migration,
- no export beyond placeholder or a later low-risk slice.

### Writing Surface

The Writing Surface is the sovereign writing area.
It should provide:

- prose or scene writing,
- current project context,
- minimal scene navigation,
- low friction interaction,
- writer-first behavior,
- sovereign writing authority.

### Command Center Surface

The Command Center Surface is a separate support, planning, and inspection workspace.
It should provide:

- contextual tools,
- a future home for Story Units, gaps, relationships, continuity, qualitative signals, outline tools, lore tools, character tools, and graph or emotion tools later,
- support for writing without gating it,
- no requirement that it be populated before writing can begin,
- no dashboard-dumping-ground behavior.

Minimal v0 should be optimized for opening a project and writing scenes with a clear Writing Surface plus a bounded Command Center Surface, without inherited UI clutter or bridge sprawl.

## User Workflows That Must Remain Valid

The clean shell must preserve these workflow truths:

- direct writing first,
- scene-first writing,
- idea-first later,
- Story Unit-first later,
- gap-first later,
- discovery-after-writing later.

Boundary statements:

- Story Units are not a mandatory entry gate.
- Narrative objects are a foundation capability, not first-use friction.
- The first useful user experience remains "open project and write" rather than "construct ontology before writing."
- Writing may start before Command Center tools are populated.

## What the Clean Shell Must Exclude at First

The initial shell should exclude:

- the current cluttered dashboard model,
- docking complexity unless later proven necessary,
- diagnostics-heavy UI,
- Companion runtime,
- Memory Lab,
- automatic prose extraction,
- persistence migration,
- export, recovery, and project-switch complexity beyond the minimal safe shell,
- full graph or emotion-map UI,
- runtime qualitative evaluator use,
- test-mode gravity inside the main app shell.

This exclusion list is structural, not aesthetic.
The goal is to prevent the old coordination burden from reappearing immediately.
The Command Center Surface should remain a contextual workspace, not a dumping ground for everything excluded from the Writing Surface.

## Old App Relationship

The current app should be treated as:

- reference implementation,
- salvage source,
- compatibility reference,
- behavioral evidence source,
- not the architecture authority for the clean shell.

The old app remains valuable for truth about current project loading, current scene-first validity, and prior bug history.
It should not define the new shell's shape by default.

## Clean Shell Authority Rules

The clean shell should follow these authority rules:

- the Writing Surface is sovereign,
- the Command Center Surface supports writing and does not gate it,
- scene-first remains valid,
- narrative objects exist behind or beside scenes rather than blocking them,
- derived or inferred data is not authored truth,
- no grading,
- no fake AI certainty,
- no forced workflow gate,
- compatibility adapters cannot become permanent native authority.

These rules are needed before any later persistence or ontology runtime work begins.

## First Implementation Slice Recommendation

The first implementation slice after this planning bundle should be:

- user approval first,
- branch or package strategy selection first,
- no code until that approval exists,
- then a shell scaffold only or route-level minimal renderer reset,
- scaffold two surfaces,
- the Writing Surface may be minimally functional first,
- the Command Center Surface may begin as a minimal or empty contextual workspace,
- no full Command Center tools yet,
- carry forward the Phase 32 shared modules only after the new shell compiles and the narrowed bridge contract is defined.

The first code slice should not attempt Companion, Memory Lab, graph UI, persistence, migration, recovery expansion, export expansion, or qualitative evaluator runtime use.

## Acceptance Criteria

This boundary is acceptable only if:

- it is smaller than the current app,
- it avoids the current tangle centers,
- it preserves the two-work-surface architecture,
- it preserves scene-first writing,
- it allows future narrative-object integration,
- it does not require migration on day one,
- it gives the user a real approval point before rebuild starts.
