# Pass 215 - Salvage Branch Scaffold Readiness

## Purpose

This pass verifies the salvage branch state and defines the first isolated scaffold slice.
It does not replace the current runtime, alter runtime entrypoints, or start migration.

## Branch Confirmation

- current branch: `salvage/minimal-two-surface-shell`
- recent commit head: `37c9e7f docs(phase32): correct salvage shell work-surface boundary`
- recent supporting commits include:
  - `823744b docs(phase32): plan minimal salvage shell boundary`
  - `18c17bc docs(phase32): assess untangle and salvage rebuild options`
- Pass 214A present before scaffold work: yes
- `logs/` untouched before scaffold work: yes
  - expected untracked file remained `logs/pass133-backend.txt`

## Scaffold Placement Recommendation

Recommended isolated location: `app/renderer/salvage/`

Why this is the safest placement:

- renderer-side isolation keeps the scaffold outside `App.tsx`,
- the location is already covered by the existing Vitest renderer test glob,
- it can host static shell-boundary components without touching runtime data or project IO,
- import-boundary verification stays straightforward because the path is explicit and isolated,
- no new package is required for the first slice.

This placement should remain:

- not imported by `app/renderer/App.tsx`,
- not wired into current runtime routes,
- covered by targeted tests only.

## Scaffold Boundary

The first scaffold should be limited to:

- a `Writing Surface` placeholder or minimal static surface,
- a `Command Center Surface` placeholder or minimal static surface,
- a clean shell layout boundary,
- no runtime data,
- no project file IO,
- no persistence,
- no migration,
- no old dashboard or docking recreation.

The scaffold is a shell-shape proof only.
It should demonstrate the two-work-surface architecture without attempting old-app feature parity.

## Acceptance Criteria for Pass 216

Pass 216 is acceptable only if:

- two surfaces are explicit,
- the Writing Surface is sovereign,
- the Command Center does not gate writing,
- no runtime imports are introduced,
- no old components are copied wholesale,
- no `App.tsx`, `preload.ts`, or project-loader runtime edits are made,
- tests verify shell shape.
