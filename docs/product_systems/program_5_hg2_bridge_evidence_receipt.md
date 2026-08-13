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

## Next Exact Step

Jason manually stages, commits, and pushes this complete bridge batch. After
that durable checkpoint, `HG2-RPR-C` repairs true Focus and the supported
local-facts Companion doorway. `HG2-RPR-D` then qualifies the complete
package/install candidate before Human Gate 2 is repeated. Full Program 5
intake/discovery and Human Gate 3 remain later work.
