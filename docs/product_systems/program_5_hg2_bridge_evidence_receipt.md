# Program 5 Human Gate 2 Bridge Evidence Receipt

## Status

- Status: `AUTOMATED DEVELOPMENT GATE PASSED; MANUAL COMMIT/PUSH CHECKPOINT REQUIRED`
- Date: `2026-08-13`
- Starting commit: `707dfae60fdcc0752e5f638b94105e90418bfd4d`
- Branch: `codex/foundation-audit`
- Scope: `Program 5 continuous-manuscript projection and stable-anchor bridge only`
- Protected evidence: `NOT USED`
- Git authority: `Jason alone stages, commits, and pushes`

## Delivered Boundary

This bridge makes the current safely segmented manuscript read and navigate as
one story without pretending that the full Program 5 intake system is already
complete:

- every written section is visible in one vertically continuous manuscript;
- only the active section owns a live editor, while the other sections remain
  readable and can be activated in place, keeping substantial unit counts
  bounded;
- unsaved buffers remain visible when the writer moves between sections;
- a story point created from a cursor or selected passage receives a compact
  project-local source anchor;
- the anchor stores offsets and fingerprints, never a second copy of the
  manuscript passage;
- selecting an anchored story point returns to the exact passage when it is
  unchanged, relocates it when surrounding edits move it, and reports an
  ambiguous or unresolved state instead of guessing;
- legacy story points without an anchor remain valid; and
- moving a story point to a different written section clears an incompatible
  old anchor rather than silently misrepresenting its source.

The authoritative manuscript files, their durable Save/recovery behavior, and
the existing `living-outline.json` planning sidecar remain the storage owners.
This is a migration-safe projection and anchor foundation, not a manuscript
format migration.

## Automated Evidence

| Check | Result |
| --- | --- |
| Anchor exact, relocated, cursor, missing, ambiguous, and substantial-input tests | Green |
| Repository and IPC validation, persistence, isolation, malformed-data, and relink behavior | Green |
| Continuous renderer behavior, unsaved-buffer switching, 100-section projection, and source return | Green |
| Full application unit/component inventory | Green: 115 files, 1,101 passed and 2 intentional skips |
| First-party and active Stage 19 lint | Green with zero warnings |
| Full application TypeScript boundary | Green |
| Production renderer and main-process build | Green |
| Complete fixed Stage 19 development regression | Green: 44 critical files with 694 passed and 2 intentional skips; all 29 Electron journeys |
| Built-Electron continuous manuscript and anchored Story Rail return | Green |
| Existing 100-unit responsiveness witness | Green: creation about 3.8 seconds; activation about 0.12 seconds, within existing ceilings |
| Built-Electron WCAG A/AA axe witness | Green inside the 29-journey regression |
| Existing targeted Windows visual references | Green inside the 29-journey regression |
| Diff whitespace check before documentation reconciliation | Green |

The first complete Electron run found one old critique assertion that assumed
`Unsaved` appeared only in the Story Rail. The continuous manuscript now also
truthfully marks an unsaved active section, so the assertion was scoped to the
Story Rail it intended to test. The critique journey then passed. The new
built-Electron bridge journey also exposed two imprecise test locators; both
were corrected to the exact accessible controls and the complete regression
passed.

## Explicit Non-Claims

This receipt does not claim:

- lossless two-hundred-page paste/import qualification;
- automatic chapter, scene, unit, gap, or story-truth acceptance;
- structural discovery, ghost proposals, split/merge, or accepted-section
  drag reordering;
- full Program 5 completion or Human Gate 3 acceptance;
- the repaired real-Focus or Companion doorway batch;
- a local LLM, provider route, generic chat, or durable Companion memory;
- package/install or hosted exact-candidate qualification; or
- Human Gate 2 author acceptance.

## Post-bridge author findings / pre-closure requirement

The automated bridge evidence above remains green for its stated mechanical
boundary. Jason's follow-up screenshots nevertheless opened `P5-UX-01` before
Program 5 can close: the manuscript canvas must own long-document scrolling;
Story, Review, Project, and Writing Session rails must remain stable and
independently usable; Unit must be the stacked spine while Notes are quiet
subordinate title/body markers with a selected-Unit default and optional
unlinked path; `+` creation must support Cancel, outside-click, and Escape
without leaving a placeholder; Unit navigation and rename must remain reliable;
top notices and Companion/session surfaces must not overlap writing; and help
plus story-plan comparison must be summonable, readable, and preview-only.

These are author-experience findings, not a retroactive failure of the bridge
receipt. They are not verified yet, and they do not authorize local-LLM,
provider, broad import, accepted-prose mutation, or Human Gate 3 work. Program
5 and Human Gate 2 remain open until `P5-UX-01` has its own automated geometry
and workflow evidence and the complete candidate is re-qualified.

## P5-UX-01 three-slice automated qualification update

The approved repair was implemented as three bounded slices without changing
manuscript authority or opening backend, provider, local-LLM, Wizard, Emotion
Graph, or broad interchange work.

- Slice 1 made the Writing Studio a stable workspace: the manuscript canvas is
  the long-document scroll owner, the outer viewport and open rails remain
  stable, Unit selection navigates only the canvas, Companion/session surfaces
  do not cover prose, and Focus mode removes support chrome.
- Slice 2 aligned the rail with the writer model: Units are the manuscript
  spine, Notes are subordinate title/body planning records with linked and
  explicitly unlinked paths, creation is transactional, and `+`, `−`, inline
  rename, and `More` are the primary controls.
- Slice 3 added derived-context highlighting and optional multi-select, a
  summonable help explanation, shared light/dark semantic tokens, readable
  status/export/destructive/disabled states, and unit-local presentation-only
  line references. Runtime warnings were classified without hiding actionable
  signals.

Focused renderer, editor-reference, outline persistence/IPC, and companion
boundary tests passed 145/145. The complete Stage 19 regression then passed:
44 critical test files, 709 passing tests, 2 skipped, startup preflight 1/1,
Electron matrix 31/31, plus typecheck, lint, and production builds. The
development dirty-worktree override was used; protected exact-candidate
evidence and package/install qualification were not used for this receipt.

The automated P5-UX-01 candidate is green. Human Gate 2 is the next required
step: one complete author review of the whole Writing Studio. Program 5 must
remain open until that review is recorded and any resulting bounded repair is
qualified; automation alone does not authorize closure or Human Gate 3.

## Next Exact Step

The automated `P5-UX-01` candidate is green. The next exact step is one
complete Human Gate 2 review of the whole Writing Studio against the approved
author-experience contract. Do not close Program 5 from automation alone; any
failed human finding becomes a new bounded repair slice. Exact package/install
qualification, full Program 5 intake/discovery, local-LLM Companion capability,
Emotion Graph computation, and Human Gate 3 remain later authorized work.
