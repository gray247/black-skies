# Pass 219 - Salvage Exclusion Ledger

## Purpose

This ledger prevents accidental monster-file rebuilds.
It defines what will not be carried forward wholesale, what can only be referenced, and what can be extracted safely in smaller pieces.

It also prevents scene-first foundation drift.
For the salvage shell, the foundation is `Narrative Insertion / Narrative Assertion`.
Scene may survive later only as prose projection, compatibility surface, or export and recovery container.

## Do-Not-Carry-Forward List

### `app/renderer/App.tsx`

- classification: `do not carry forward`
- useful knowledge:
  - current shell feature inventory,
  - legacy projection authority edge cases,
  - service and recovery coordination touchpoints,
  - test-mode leakage risks.
- reason not to copy wholesale:
  - it is already a 3.5k-line mixed-authority shell that owns layout, UI, state, service coordination, legacy projection coordination, test behavior, and feature orchestration together.
- extraction risk:
  - critical
- clean replacement direction:
  - rebuild shell composition cleanly around small surface and state modules, carrying only narrow behavior concepts.

### `app/main/preload.ts`

- classification: `do not carry forward`
- useful knowledge:
  - existing IPC families,
  - bridge exposure patterns,
  - runtime API inventory.
- reason not to copy wholesale:
  - it is already a giant API dump with project loader, services, diagnostics, layout, runtime config, and test hooks collapsed into one file.
- extraction risk:
  - critical
- clean replacement direction:
  - rebuild a narrow domain-split bridge later, by capability, not by one monolithic preload surface.

### `app/renderer/components/ProjectHome.tsx`

- classification: `extract concept only`
- useful knowledge:
  - open/create/sample/recent project flows,
  - prose-container preview expectations,
  - local launcher affordances.
- reason not to copy wholesale:
  - it mixes launcher concerns, local storage, diagnostics, session-truth display, projection selection, draft preview, and project metadata.
- extraction risk:
  - high
- clean replacement direction:
  - rebuild a small launcher or project context surface from the behavior concepts, not the component structure.

### `app/renderer/components/workspace/StoryNavigationPanel.tsx`

- classification: `extract concept only`
- useful knowledge:
  - compact ordered-list presentation,
  - simple active-item display.
- reason not to copy wholesale:
  - it is tied to `StoryUnitV1` compatibility output and old scene-list-first workflow gravity, not a native salvage-shell narrative-navigation model.
- extraction risk:
  - medium
- clean replacement direction:
  - rebuild narrative insertion or assertion navigation first, and treat any later prose or scene projection navigation as compatibility only.

### `app/renderer/hooks/useRecovery.ts`

- classification: `reference only`
- useful knowledge:
  - recovery action states,
  - reopen flow patterns,
  - guarded async flow structure.
- reason not to copy wholesale:
  - it is tightly coupled to current services, diagnostics, test-mode overrides, and current recovery surfaces.
- extraction risk:
  - high
- clean replacement direction:
  - quarantine until recovery is explicitly reintroduced as a later domain with a fresh boundary.

### `app/renderer/utils/storyUnits.ts`

- classification: `do not carry forward`
- useful knowledge:
  - current compatibility mapping,
  - preview derivation heuristics.
- reason not to copy wholesale:
  - it promotes legacy projection-derived `StoryUnitV1` compatibility scaffolding into a UI-facing model that risks becoming accidental architecture authority.
- extraction risk:
  - high
- clean replacement direction:
  - rebuild native salvage-shell navigation around narrative insertions and assertions; only reintroduce Story Units later behind explicit narrative-object boundaries.

### `app/main/projectLoaderIpc.ts`

- classification: `extract small helper only`
- useful knowledge:
  - project-root discovery,
  - outline and projection metadata loading rules,
  - sample-path handling,
  - bootstrap-state classification ideas.
- reason not to copy wholesale:
  - it is coupled to the current project family, loader IPC handlers, bootstrap metadata, and runtime assumptions.
- extraction risk:
  - medium-high
- clean replacement direction:
  - extract only the minimal loader rules or helper ideas later, behind a narrower salvage-specific loader boundary.

### `app/main/projectBootstrap.ts`

- classification: `extract small helper only`
- useful knowledge:
  - minimal project creation semantics,
  - starter project bootstrap constraints,
  - safe temporary-workspace patterns.
- reason not to copy wholesale:
  - it carries current bootstrap semantics and file-family assumptions that should not be imported blindly.
- extraction risk:
  - medium
- clean replacement direction:
  - rebuild minimal create-project behavior later, borrowing only the narrow helper logic that survives the new boundary.

### `app/shared/ipc/projectLoader.ts`

- classification: `carry forward later with caveats`
- useful knowledge:
  - compact contract shape,
  - `LoadedProject` boundary,
  - project loader API vocabulary.
- reason not to copy wholesale:
  - it is one of the better old boundaries, but it still encodes the current legacy scene-first project family and current IPC surface.
- extraction risk:
  - medium
- clean replacement direction:
  - preserve as a reference and likely narrow it later into a salvage-specific loader contract, not as an automatic import into the salvage shell now.

### Explicit foundation exclusions

The salvage shell must not carry forward:

- scene-first architecture assumptions,
- scene as base object,
- scene navigation as the primary shell spine,
- old scene-list-first workflow gravity,
- projection modules acting as narrative authority.

If scene language appears later, it must be marked as projection, prose container, export or recovery compatibility, or other legacy compatibility posture rather than as salvage-shell foundation.

## Rebuild-From-Scratch List

### Salvage app shell composition

- why rebuild:
  - the old shell is already overloaded.
- preserve:
  - two-surface architecture,
  - writing-first availability,
  - explicit non-gating Command Center.
- drop:
  - mixed shell responsibilities,
  - test-mode-heavy orchestration,
  - dock and split-command legacy burden.
- first safe future slice:
  - split the current salvage shell into surface-focused components only.

### Writing Surface layout

- why rebuild:
  - the writing area must remain sovereign and small.
- preserve:
  - direct writing first,
  - prose-container workflows remain valid,
  - minimal insertion or assertion context,
  - prose projection compatibility later if needed.
- drop:
  - legacy shell framing,
  - projection-first default modeling,
  - preview side effects from old launcher patterns.
- first safe future slice:
  - separate `WritingSurface` component with static narrative-facing model props.

### Command Center Surface layout

- why rebuild:
  - this must not become dashboard clutter.
- preserve:
  - separate support, planning, and inspection role,
  - future capacity for narrative context, continuity, gaps, relationships, and later projection compatibility.
- drop:
  - panel soup,
  - mixed diagnostics and feature clutter,
  - scene dashboard gravity.
- first safe future slice:
  - separate `CommandCenterSurface` component with explicit placeholder slots.

### Narrow preload bridge

- why rebuild:
  - the old preload surface is too broad to salvage safely as one file.
- preserve:
  - domain-specific IPC exposure patterns only.
- drop:
  - one-file bridge sprawl.
- first safe future slice:
  - define domains and boundaries in docs before any bridge code is added.

### Minimal project loader contract

- why rebuild:
  - salvage needs a smaller boundary than the current runtime contract family.
- preserve:
  - explicit project identity,
  - prose-container and projection compatibility concepts only where later needed.
- drop:
  - broad bootstrap-state and current runtime coupling as the initial salvage shell default,
  - scene-first authority as the salvage-shell foundation.
- first safe future slice:
  - contract sketch only, not IO.

### Narrative insertion or assertion navigation plus prose projection navigation

- why rebuild:
  - the salvage shell must not depend on `StoryUnitV1` or treat projection as the root navigation model.
- preserve:
  - active writing-focus visibility,
  - minimal narrative context,
  - list clarity.
- drop:
  - compatibility-model coupling,
  - old scene-navigation-first assumptions.
- first safe future slice:
  - static insertion or assertion navigation, plus prose projection placeholders later if needed.

### Project state display

- why rebuild:
  - current project surfaces are overloaded.
- preserve:
  - simple project title and status visibility.
- drop:
  - diagnostics expansion,
  - mixed launcher and workspace concerns.
- first safe future slice:
  - static project context, already started.

### Future recovery/export/project-switch surfaces

- why rebuild:
  - these are high-coupling domains and should not be reintroduced through old runtime structures.
- preserve:
  - user-facing intent only,
  - authority separation,
  - explicit later boundaries.
- drop:
  - direct reuse of the current mixed shell patterns.
- first safe future slice:
  - quarantine until separately audited.

## Carry-Forward List

### `app/shared/narrativeObjectContract.ts`

- dependencies:
  - shared TypeScript only
- risk:
  - low
- entry timing:
  - later, when the salvage shell starts using shared narrative primitives beyond static placeholders

### `app/shared/narrativeObjectValidation.ts`

- dependencies:
  - narrative object contract
- risk:
  - low
- entry timing:
  - later, alongside real narrative-object input or contract tests

### `app/shared/narrativeQualitativeSignals.ts`

- dependencies:
  - shared provenance contract
- risk:
  - low
- entry timing:
  - later, before any future signal consumption, not now

### `app/shared/narrativeQualitativeSignalValidation.ts`

- dependencies:
  - qualitative signal contract
- risk:
  - low
- entry timing:
  - later, with future signal-facing work

### Selected tests and test patterns

- dependencies:
  - Vitest, Testing Library, renderer test setup
- risk:
  - low
- entry timing:
  - now, already in use by the salvage scaffold

### Selected package and Vitest patterns

- dependencies:
  - existing app toolchain
- risk:
  - low-medium
- entry timing:
  - now, as a build and test harness pattern, not as a direct feature dependency

## Quarantine List

- recovery domain
- export domain
- project switch domain
- old preload APIs
- diagnostics surfaces
- docking and workspace code
- static evaluator runtime use
- scene projection compatibility adapter runtime use

These areas may contain useful logic.
They should remain isolated until each domain is explicitly re-audited and bounded.

## Six-Month Untangle Prevention Notes

The salvage rebuild is recreating the same tangle if:

- salvage files start ballooning in size without clear domain splits,
- one shell component owns UI, IO, layout, surface orchestration, and domain logic together,
- Command Center turns into a dashboard junk drawer,
- bridge or preload surfaces start accreting unrelated APIs into one file,
- Story Units start acting like mandatory entry objects,
- projection modules start acting like base narrative authority,
- the evaluator starts acting like runtime authority too early,
- feature work lands before boundary docs or import rules exist.
