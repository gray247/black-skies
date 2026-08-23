# Program 5 Human Gate 2 Bridge Evidence Receipt

## Status

- Status: `AUTOMATED CANDIDATE GREEN; ELEVATED LIFECYCLE WITNESS AND HUMAN GATE 2 REQUIRED`
- Date: `2026-08-20`
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

## Launcher qualification follow-up — 2026-08-20

The development launcher was reconciled into the canonical candidate as a
separate operational slice. `pnpm dev` probes `127.0.0.1:5173` before starting
Vite, reuses an existing healthy Black Skies document, reports the owner/PID
when another listener occupies the port, and never terminates a renderer it did
not create. A newly owned renderer must become healthy before Electron starts.

Focused evidence passed with `node --test scripts/dev-runner.test.mjs` (4/4),
covering healthy, available, occupied, listener-identification, and timeout
classification. This is development-launch evidence only; it does not replace
the exact Windows package/install qualification and does not change the
automated P5-UX-01 or Human Gate 2 status.

## Exact-candidate package follow-up — 2026-08-20

The original exact Windows installer failure was isolated to electron-builder's
NSIS generator emitting an absolute template include through the canonical pnpm
virtual-store path (274 characters). NSIS rejected that path even though the
include file existed. The narrow `patches/app-builder-lib@26.15.3.patch` repair
stages the NSIS include directory under a short per-process temporary path and
emits short absolute include paths; the existing per-user installer patch is
retained in the same dependency patch.

After `pnpm install --offline --frozen-lockfile`, fresh
`package:win` and `package:verify:installer` runs passed. The receipt-bound
installer is `BlackSkies-Setup-1.0.0-rc1.exe`, SHA-256
`2e762ad6fb147aa5ddfdd7fef68c4725f4e94eb7a164ad2c10ab828aa08204ad`, for
qualified commit `985dd98d892db20bcc101b9b148d24c7a42d16f6`; unpacked forbidden
runtime descendants remain zero.

The installer then installed successfully, the packaged runtime passed the
installed smoke witness (including exact Markdown export and the 100-unit
representative workflow), and silent uninstall removed the installed
executable. The exact lifecycle witness also requires outbound firewall
isolation; this session could not create `New-NetFirewallRule` and Windows
returned `Access is denied`. That is a host-privilege qualification blocker,
not a package or application failure, and the supplemental no-firewall
install/smoke/uninstall witness must not be promoted to the exact gate.

The lifecycle harness was hardened after that observation: the default exact
lane now checks elevation before installation and explains that firewall rules
belong only to qualification; `-SkipFirewallIsolation` provides an explicit
application-only install/smoke/uninstall lane and records
`qualificationMode=application-only-no-firewall`. The app-only lane passed the
packaged one-window/optional-Command smoke, zero-forbidden-process check,
exact Markdown export, 100-unit representative workflow, uninstall, external
data preservation, and same-installer reinstall checks.

The full Electron matrix also produced two non-failing `Viewport failed to
stabilize` warnings in the P3-D journey. They are recorded as a harness/viewport
signal, not as a P5 product failure, unless a reproducible user-facing failure
is found.

## Pre-human exact candidate follow-up — 2026-08-23

The corrected closeout product commit is
`13da251c516bbed67a1373499c7a81c8e72b9eb3`. Its clean Stage 19 regression
passed `49` critical files with `745` tests passed and `2` skipped, startup
preflight `1/1`, and Electron `32/32`. The clean 100-Unit journey measured
`3.67s` creation and `65ms` Unit selection, and no viewport warning recurred.

The exact NSIS installer is `BlackSkies-Setup-1.0.0-rc1.exe`, SHA-256
`09a41ef179b9d42a32ee42fb2cc0aa3cfe91bae838c2206145d0d30ca056aa69`.
The package receipt matches the commit and hash, the unpacked forbidden-path
count is zero, and signature truth is `NotSigned` under the private
unsigned-internal-RC policy.

The no-skip lifecycle stopped before installation because this session is not
elevated, preserving `exact-blocked-external` without creating a firewall rule.
The explicit application-only lifecycle passed packaged startup, optional
Command transition, zero forbidden processes, exact Markdown export, the
representative 100-Unit workflow, uninstall, external-data preservation, and
same-installer reinstall. The candidate is installed under the qualification
root for hands-on product review. This permits the author usability review to
begin but does not satisfy the formal elevated firewall witness or claim Human
Gate 2 acceptance.

## Next Exact Step

The exact installer build and receipt verification are green. The remaining
qualification step is one elevated clean Windows lifecycle witness that can
create and remove the outbound firewall rule, followed by one complete Human
Gate 2 review of the whole Writing Studio against the approved author-
experience contract. Do not close Program 5 from automation alone; any failed
human finding becomes a new bounded repair slice. Full Program 5
intake/discovery, local-LLM Companion capability, Emotion Graph computation,
and Human Gate 3 remain later authorized work.

## Bounded rail-and-controls repair — 2026-08-23

The post-review repair stays scoped to the Writing Studio rail and control
boundary. Note detail now exposes a visible `Save note and close` action plus
an explicitly labelled discard-close control. Edge controls use the writer
labels `Project Tools`, `Story`, `Review`, and `Writing Session`; Project Tools
and Writing Session content is compacted, edge marks and titles are readable,
and the final empty CodeMirror line keeps source bytes intact without showing
an orphan gutter number. Required scoped text uses semantic readable aliases
and the `0.8rem` floor; unrelated renderer palettes remain untouched.

Renderer tests passed `119/119`. The rebuilt Writing Studio Electron shell
passed `5/5`, including computed action/edge geometry, Note save/reopen, focus
return, rail containment, and the complete existing Structure journey. The
exact dirty command `node .\\scripts\\stage19-regression.mjs --allow-dirty`
passed `49` critical files with `747` tests passed and `2` skipped, startup
preflight `1/1`, and Electron `32/32`; no viewport-stabilization warning
recurred. This is mechanically tested dirty evidence only: no clean commit,
package qualification, exact-installed status, Human Gate 2/3 acceptance, or
Program 5 closure is claimed.

Gate 1 marker/detail-panel repair is mechanically green and is no longer a
current blocker. The next steps remain a focused conventional commit, clean
regression, exact package/install evidence, and separate human review.

## Rail-and-controls replacement candidate — 2026-08-23

The bounded rail-and-controls repair was committed and pushed as focused
candidate `b47caa3e2ee4fa6d9a855a69c9364527fbb7aa38` after the dirty evidence passed.
The clean Stage 19 regression passed
`49` critical files with `747` tests passed and `2` skipped, startup preflight
`1/1`, and Electron `32/32`; no viewport-stabilization warning recurred.

The replacement Windows installer was rebuilt and verified against that exact
candidate. Its SHA-256 was
`e65e851b62f55dfd2e61db97d7aaae27c57f35a0c2da6cb6a9f61868098eb140`.
The package receipt records the exact candidate binding, zero unpacked
forbidden paths, and `NotSigned` signature truth
under the private unsigned-internal-RC policy.

The explicit application-only lifecycle passed packaged startup, optional
Command transition, zero forbidden runtime processes, exact Markdown export,
the representative 100-Unit workflow, uninstall, external-data preservation,
and same-installer reinstall. The elevated firewall-isolated lane was not run
because this session is not elevated; no firewall rule was created. This is
application-only installed evidence, not exact-installed qualification.

Human Gate 2/3 acceptance and Program 5 closure remain unclaimed.

## No-project startup composition follow-up — 2026-08-23

The author review of installed candidate `b47caa3e` found one blocking startup
composition defect and one misleading disabled-state presentation. The
no-project lifecycle parent still used the pre-grouping five-column template
after Open and Create had become two grouped tool blocks. That mismatch
squeezed the Create title, helper, input, and button into intersecting columns
even at the photographed desktop width. The non-color disabled treatment also
explicitly applied `line-through`, making unavailable actions appear deleted.
The no-project save summary still said `All changes saved`, and recent-project
paths inherited an old low-contrast color outside the scoped semantic repair.

The bounded repair changes the lifecycle parent to two auto-fitting grouped
columns with a one-column compact fallback, constrains the Create input and
helper block inside their group, removes strikethrough while retaining dashed
disabled borders and a not-allowed cursor, adds reason-specific action
tooltips, reports `No project open`, and maps recent paths to the scoped
semantic text colors. It does not change project persistence, provider access,
firewall behavior, manuscript authority, or deferred Program 5 capability.

A new built-Electron journey now opens the empty Story rail over the no-project
startup and checks the photographed `1900x1000` viewport plus a compact
`1000x800` viewport. It rejects overlapping lifecycle groups, helper text,
inputs, or buttons; group overflow; crossed-out disabled text; and missing
unavailable-state explanation. Focused renderer evidence passed `110/110` and
the complete Writing Studio Electron file passed `6/6`. The exact dirty command
`node .\\scripts\\stage19-regression.mjs --allow-dirty` passed `49` critical
files with `748` tests passed and `2` skipped, startup preflight `1/1`, and the
expanded Electron matrix `33/33`; no viewport-stabilization warning recurred.

This section is implemented and mechanically tested dirty evidence only. The
`b47caa3e` installer is superseded for Human Gate purposes. A clean commit,
clean regression, replacement package/install evidence, push, and the resumed
author review remain required; Human Gate 2/3 and Program 5 closure remain
unclaimed.
