# Human Gate 2 Repair Batch HG2-RPR-B Evidence Receipt

## Status

- Status: `AUTOMATED DEVELOPMENT GATE PASSED; MANUAL COMMIT/PUSH CHECKPOINT REQUIRED`
- Date: `2026-08-13`
- Starting commit: `28d2294a03461bd2cdef40ef7a7695a8374c27e2`
- Branch: `codex/foundation-audit`
- Scope: `HG2-RPR-B unified Story Rail only`
- Protected evidence: `NOT USED`
- Git authority: `Jason alone stages, commits, and pushes`

## Delivered Boundary

This batch turns the existing manuscript-unit and Living Outline projections
into one direct, contextual Story Rail without changing their qualified storage
owners:

- written sections and their linked story points appear in one ordered rail;
- `+` adds a story point at the selected passage, current written section, or
  `Not placed yet` when no writing context exists;
- starting a new written section is a secondary Story action rather than a
  permanent create form;
- double-click and `F2` rename a written section inline;
- `More` and right-click expose rename and explicitly confirmed delete actions;
- dragging a story point to a written section changes only its planning link;
- unplaced story points have a distinct, honest home;
- the former create-unit, selected-title, move-up, move-down, and visible delete
  forms are absent from the ordinary rail; and
- narrow layouts place the rail in document flow instead of covering writing.

The existing manuscript unit files and order remain authoritative. The existing
`living-outline.json` sidecar remains the planning owner. Linking or moving a
story point cannot rewrite manuscript prose, manuscript order, or `outline.json`.
Keyboard outline reordering remains available through the qualified
`Alt+Arrow` path while direct written-section reordering waits for the
continuous-manuscript and stable-anchor boundary.

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused renderer/controller/layout group during implementation | Green: 4 files, 114 tests |
| Final primary Writing Studio component file | Green: 96 tests |
| Focused affected built-Electron repair group | Green: 7 journeys |
| Story placement and reopen witness | Green: planning link survived reopen while `outline.json` and both manuscript drafts remained byte-for-byte unchanged |
| First-party application lint | Green with zero warnings |
| Full application TypeScript boundary | Green |
| Production renderer and main-process build | Green |
| Complete fixed Stage 19 development regression | Green: 43 files with 683 passed and 2 intentional skips; all 28 Electron journeys |
| Built-Electron WCAG A/AA axe witness | Green inside the 28-journey regression |
| Existing targeted Windows visual references | Green inside the 28-journey regression |
| Diff whitespace check before documentation reconciliation | Green |

The first complete Electron run found stale expectations that still described
the former separated forms and overlay geometry. Those expectations were
reconciled with the approved Story Rail contract. The final complete regression
passed without a retry or exception.

## Explicit Non-Claims

This receipt does not claim:

- a continuous manuscript or durable position/span anchors;
- drag-reordering of accepted written sections;
- import discovery or automatic chapter acceptance;
- the repaired real-Focus and Companion doorway batch;
- a local LLM, generic chat, persistent Companion memory, or provider use;
- package/install or hosted exact-candidate qualification; or
- Human Gate 2 author acceptance.

## Next Exact Step

Jason manually stages, commits, and pushes this complete HG2-RPR-B batch. Once
that durable checkpoint is confirmed, the pulled-forward Program 5 bridge is
the next bounded implementation: continuous manuscript projection and stable
anchors. Human review remains deferred until the complete repair candidate is
qualified.
