# Pass 220 - Modular Salvage Architecture Blueprint

## Purpose

This blueprint defines the modular architecture rules for the salvage shell before more code is added.
It exists to prevent a new `App.tsx` or `preload.ts` style monolith from reappearing under a new folder.

It also fixes the foundation model:

- `Narrative Insertion / Narrative Assertion` is the salvage-shell foundation,
- prose and scene are projections or containers,
- projection compatibility may appear later,
- projection is not the root authority for narrative cognition.

## Proposed Folder/Module Structure

Recommended salvage structure:

```text
app/renderer/salvage/
  shell/
  surfaces/
    writing/
    commandCenter/
  narrative/
    insertions/
    assertions/
    gaps/
    relationships/
  projections/
    prose/
    scene/
  project/
  state/
  testing/
```

What belongs in each:

- `shell/`
  - minimal shell composition only
  - top-level two-surface arrangement
  - no domain-heavy logic
- `surfaces/writing/`
  - Writing Surface components
  - insertion/assertion/prose drafting presentation
  - no projection-first shell spine
- `surfaces/commandCenter/`
  - Command Center components
  - support/planning/inspection presentation
  - future tool-slot containers
- `narrative/`
  - base narrative primitives
  - insertion, assertion, gap, and relationship models or helpers
  - root narrative authority for the salvage shell
- `projections/`
  - views and containers derived from base narrative primitives
  - prose projection now or later
  - scene projection later as compatibility only
- `project/`
  - salvage-only project context models and helpers
  - static models now
  - future loader-boundary adapters later
- `state/`
  - local salvage-shell state helpers
  - no global god object
- `testing/`
  - salvage-specific test helpers or fixtures when needed
  - no runtime bridge dependencies

## Surface Separation Rules

### Writing Surface

- owns insertion, assertion, and prose drafting focus
- owns direct writing
- owns prose projection display when needed
- does not depend on Command Center to be usable
- must not default to scene-list-first navigation

### Command Center Surface

- owns support, planning, and inspection tools
- may show narrative insertions, assertions, gaps, relationships, continuity, and signals
- may later show prose or scene projection compatibility views
- does not gate writing
- does not become dashboard clutter

The two surfaces are peers inside one shell, not a single workspace with side panels pretending to be architecture.

## Component Size and Responsibility Rules

Anti-monster rules:

- component files should stay small and focused
- no `App.tsx` replacement monster
- no `preload.ts` replacement monster
- no component should own UI plus IO plus state orchestration plus domain logic
- extract model or state helpers before files become unreadable
- require review when files exceed the size thresholds below

Recommended thresholds:

- target UI component files under 250 lines
- review above 300 lines
- split or justify above 400 lines
- bridge modules split by domain before any one file becomes large

The threshold is a warning system, not a substitute for judgment.
If a file is below the threshold but already mixed-authority, it still needs splitting.

## Import Boundary Rules

Allowed directions:

- salvage UI may import salvage model helpers
- salvage UI may import shared pure contracts
- salvage narrative modules may import shared pure contracts
- projection modules may import base narrative modules
- salvage tests may inspect salvage source for isolation assertions

Forbidden or restricted directions:

- salvage UI must not import old runtime loader, recovery, export, or project-switch code directly
- shared contracts must not import renderer components
- projection modules must not become root authority over base narrative objects
- base narrative modules must not depend on projection modules in reverse
- Command Center must not import Writing Surface internals in a way that gates writing
- future bridge code must be narrow and domain-split
- salvage modules must not silently depend on `window.projectLoader`, `window.services`, or `ipcRenderer` until that boundary is explicitly approved
- scene projection modules must not become the root authority for shell state or narrative cognition

## State Ownership Rules

- static state model now
- local shell state later
- base narrative state before projection state
- projection state derived later, not authoritative
- project IO boundary later
- no global god object
- no runtime persistence until approved
- no hidden project writes

The current salvage shell should keep state explicit and local.
Once IO exists, it should enter through a later dedicated boundary rather than through renderer-wide ambient access.

## Testing Strategy

Future salvage slices should require:

- isolated render tests
- surface separation tests
- no-gating tests
- import-boundary searches
- forbidden-file edit checks
- no project IO unless explicitly allowed
- size and responsibility review for growing files
- projection-versus-foundation boundary review when projection modules appear

Tests should continue proving that the salvage shell can evolve in isolation before it ever gains runtime authority.

## Future Extraction Sequence

Recommended next safe sequence:

1. reorganize the current salvage scaffold into the modular folder structure
2. keep the current static project context intact while reframing it as projection placeholder material rather than foundation
3. split Writing Surface and Command Center Surface into focused components
4. introduce a salvage narrative model centered on Narrative Insertion / Assertion
5. add tests proving behavior did not change
6. only later add prose or scene projection compatibility

Do not add real project IO yet.
Do not recommend static scene selection as the next interaction slice.

## Acceptance Criteria

This blueprint is acceptable only if:

- it preserves two work surfaces,
- it prevents monster file recreation,
- it clearly separates carry-forward, reference-only, rebuild-from-scratch, and projection-only categories,
- it does not implement code,
- it gives a modular next implementation slice.
