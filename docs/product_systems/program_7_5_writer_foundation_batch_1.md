# Program 7.5 writer foundation — Batch 1

2026-10-23. Implemented in the authorized continuation checkout. Automated
development checks are recorded below; author acceptance and installed-candidate
qualification remain separate. Long-manuscript performance for this changed UI
is not requalified by the bounded desktop journey.

The author explicitly authorized this first batch in
`codex/program7-5-stabilization`, starting at
`8fc087d1c22e13bcf6eebd88864dd46547f77683`. This is the continuation checkout at
`C:\Users\gray2\Documents\ChatGPT\Black-skies program 8\work\program7-5-continuation`.
The pre-existing `.github/workflows/stage19-packaging.yml` edits are preserved.
The existing fix tracker is extended without replacing its earlier entries.

## Delivered behavior

| Slice | Delivered in Black Skies | Evidence and remaining acceptance |
| --- | --- | --- |
| B1.0 source and storage contract | Existing manuscript files and source identity remain authoritative. Writer units are range metadata in the existing Living Outline sidecar. | Compatible legacy-document reads, exclusive membership, stale-source/revision refusal, save/reopen tests. No installed or crash-recovery qualification inferred. |
| B1.1 ordinary writing | Permanent selected-word Bold/Italic, Undo/Redo, literal Find/Replace across the manuscript, current section or frozen selected words; preview, explicit Replace actions and guarded batch Undo; Save writing. Ctrl+Home/End and their selection variants use true document boundaries. | Real-editor tests and a native desktop journey, including saving changes in both sections and undoing the replacement. Emphasis remains Markdown, not a new rich-text format. |
| B1.2 Pin and outline | One Pin supports selected writing or beginning/end points, including several saved sections. A new Pin replaces intersecting memberships and retains outside pieces. Unpin, Undo Pin and label-only Rename are available. | Exclusive source membership, preserved outside fragments, cross-section Pin, unchanged prose files, deletion and Undo tests. Units do not impose chapters. |
| B1.3 passage Notes | Notes from selected writing, a caret, the outline or right-click; multiple independently reachable pencils; one Note can span several source sections; explicit source reading and reconnection. | Multi-passage repository/IPC tests, stale draft protection, edit/deletion/Undo tests, native three-Note save and reopen. |
| B1.4 follow and highlights | Pinned and unpinned writing appear together in page order; the outline follows writing scroll/selection and reopens at the reading area. Independent Pinned, Unpinned and Open concern switches. | All eight switch combinations leave source unchanged; native many-row outline follows to the end. Author appearance/feel check remains pending. |
| B1.5 quiet rails | Subdued edge dots with larger activation areas, delayed transient dismissal, explicit Keep open/Close, independent locks, bottom Companion reveal. | Controller hover/Escape tests and native simultaneous Story/Companion lock checks. No model route is enabled. |
| B1.6 steady work and return | Persistent Command Center task title/frame, retained visited tool state, Back for the previous surface/tool/source/selection/inner reading position and unfinished Note/search work. | Dedicated Back tests and native return from Command Center. Changed source invalidates the old selection instead of guessing. |

## Source and range rules

- `drafts/<unitId>.md` remains the existing saved-section owner. Pin never
  rewrites or reorders prose and does not decide chapter boundaries.
- `LivingOutlineDocumentV1` gains optional `writingGroups` in the existing
  `living-outline.json` owner. No third Note store or second manuscript store
  is introduced. Ordinary existing mutations preserve the new optional metadata.
- Generated unit names follow their own opening words after edits or regrouping.
  Explicitly renamed units retain their independent names (`customLabel`); names
  never edit prose or redefine range membership.
- Every character has at most one active writer-unit membership. Notes and
  findings can overlap without creating additional writer-unit memberships.
  Whitespace remains in the source and coverage calculation; blank gaps do not
  create empty outline cards.
- Anchors use existing UTF-16, half-open coordinates. Typing at a shared boundary
  belongs to the preceding group; following starts move forward. Exact
  replacement preserves the unit's outer bounds. Full deletion retains a
  position and identity, visibly marked as removed; source Undo restores ranges.
- One Note may carry several source anchors. `sourceAnchor` and
  `manuscriptUnitId` remain its primary first-passage projection for existing
  consumers. Editing the body preserves all passages. Reconnecting source is an
  explicit action, with the Note identity/body retained.
- Real editor transactions rebase linked ranges. Saves use the existing
  Writing-Studio-only, project/path/generation/revision boundary and verify all
  affected saved sources before an atomic metadata commit. An edited Note draft
  cannot silently attach its old offsets to different words.
- Missing, ambiguous or overlapping relocated sources remain unresolved. Their
  records stay visible for review; display marks do not guess source positions.
  Source and metadata writes are distinct existing operations, not a newly
  qualified cross-file crash-recovery transaction.
- Pencils and Pin glyphs are decorations and never enter saved prose. Red marks
  require a matching saved source fingerprint and are withheld for dirty source.
- Back is bounded, transient and project scoped. It retains unfinished Note and
  search work, cancels pending Pin endpoints, and validates the source before
  restoring an old selection.

## Verification

Final complete app Vitest run: **164 files; 1,628 passed, 2 skipped, 1 failed**.
The failure is `stage19PackagingWorkflowPolicy.test.ts`, reporting
“Artifact upload at line 101 is not bound to the exact source SHA.” It concerns
the packaging workflow that was already modified when this task began. That
file was not changed by this batch. Its observed SHA-256 is
`9c4c97195ce5c6cb8fc49ef035727c2ac54b35d7c2248e11b2c782268b59cc33`.
The full gate is therefore **not green** and no packaging/release readiness is
claimed.

Additional evidence:

- Focused regression run: 244 tests passed across 10 existing/new files. The
  subsequent expanded real-editor range/Undo slice passed 18 tests across two
  files; the final full run includes those changes. Counts are overlapping,
  not additive.
- Both renderer and main TypeScript checks pass. App lint and scoped main/new
  desktop-test lint pass. Renderer and main builds pass. The renderer build
  reports its existing large-chunk advisory; no splitting overhaul was made.
- Native Electron journey passes with disposable projects, isolated test data
  and local AI disabled. It exercises native selection/formatting, cross-section
  Pin and label-only Rename without prose-file changes, three multi-passage Notes and individual pencil
  access, manuscript replacement/save/Undo, many-row outline follow, Back,
  bottom Companion reveal and independent rail locks, and reload of saved data.
- The desktop screenshot was inspected; checkbox spacing, edge activation
  appearance and co-located pencil targets were corrected and retested.
- `git diff --check` passes. No credentials, dependencies, synced project
  sources, external delivery plans, installer or accepted installation changed.

Reproducible evidence files in the checkout (ignored local logs):

- `writer-b1-final-vitest.log`
- `writer-b1-final-focused.log`, `writer-b1-range-undo.log`,
  `writer-b1-rename-check.log` and `writer-b1-label-check.log`
- `writer-b1-final-lint.log` and `writer-b1-main-lint.log`
- `writer-b1-renderer-build.log`
- `writer-b1-electron.log`
- `app/test-results/stage19-writer-foundation--fb4f6-use-the-real-desktop-owners-electron/writer-foundation.png`

Earlier failures were retained as findings rather than promoted to passes:
native Ctrl+Home lacked a true-document command; co-located pencils overlapped;
multi-passage creation failed to forward all validated anchors; and an implicit
Note field label included the existing Note text. The last was a field-label/test
identification issue, not proof that the Note failed to open. Each repair has
subsequent focused or native evidence.

## Batch A follow-up — 2026-10-24

Assistant QA has now run the full Batch A in the built Electron app. This is
separate from the author's still-pending hands-on acceptance. The original
first-batch evidence above remains the dated baseline.

Three narrowly scoped corrections were made:

- **Find next hang:** an inline parent callback restarted the pending editor
  source-return effect on every surrounding update. The selection notification
  triggered another update, preventing the existing bounded layout measurement
  from settling. The callback now uses a current ref; callback identity does not
  restart the request. Source fingerprint checks, supersession/cancellation and
  the six-measurement bound remain. A new regression reproduced the failure
  before the fix and verifies the latest callback receives the result.
- **Replace next repeated its own insertion:** when replacing `shirt` with
  `shirt sleeve`, a subsequent click could produce `shirt sleeve sleeve` in the
  first occurrence. Single replacement now returns through the existing source
  navigation to the position after its inserted text. Search actions wait for
  that return to finish. The next occurrence is then used; source edits and
  frozen selected scopes retain their existing guards. A failing regression and
  subsequent native check cover this exact case.
- **Search scope label:** the implicit select label included its option text.
  An explicit accessible name makes the existing control consistently identifiable.

One test-harness issue was also corrected: a disabled Save button can mean a
save is in flight. The expanded test now waits for completed-save feedback and
polls the actual saved bodies before comparing them. The earlier premature
comparison was not evidence of a lost save.

Final follow-up checks:

- Real editor/navigation slice: **44 tests pass in four files**.
- Expanded Batch A plus the earlier complete desktop journey: **2/2 pass**.
- Complete app Vitest: **1,630 pass, 2 skip, 1 fail across 164 files**. The one
  failure is the same packaging-workflow SHA-binding policy issue described
  above; the packaging file remains untouched by this task.
- Renderer typecheck, app lint, scoped desktop-test lint and renderer build pass.
  No main-process behavior was changed in this follow-up.
- The final desktop test checks selected Bold/Italic/toggles, Undo/Redo, true
  document boundaries, all three search scopes, case/empty/no-match/literal
  search, preview, Replace next/all, advancement when replacement contains the
  query, Find next across sections and wrap, both-section Save, batch Undo,
  refusal to overwrite later writing, and exact saved-data reload.

Evidence: `writer-batch-a-return-repro.log`, `writer-batch-a-next-repro.log`,
`writer-batch-a-focused.log`, `writer-batch-a-electron.log`,
`writer-batch-a-vitest.log`, `writer-batch-a-lint.log`,
`writer-batch-a-test-lint.log` and `writer-batch-a-renderer-build.log` in the
checkout. These overlap earlier counts and must not be added together.

The development build was then opened for the author on the isolated project
**Batch A · Forest and poison**, with both test sections restored to their
original text and saved. The accepted installation/settings are separate. The
manual host reuses the existing development service-suppression flag; it has no
Playwright connection, test API hooks, service stub, model route or provider call.
The launch log confirms legacy services were not spawned. The project was opened
through the visible Recent projects control and its title/text were verified.

The durable test project and reopen manifest are under this chat project's
`implementation/first-batch/human-testing/`; `batch-a-handoff.json` records the
exact project path and isolated temporary user-data/config folders. The sibling
`open-batch-a.mjs` reopens those exact inputs and fails rather than falling back
if any input is missing. The ordinary installed app was not replaced.

## Author-reported formatting repair — 2026-10-24

The author failed Batch A steps 1 and 3: Bold and Italic exposed asterisks rather
than changing the visible words. The first Bold selection also included a line
break, placing the closing delimiter on the next line. Steps 2 (Undo/Redo) and
4 (Save) passed. Those two author passes remain recorded. Earlier automated A1
checks asserted Markdown marker strings, which was insufficient evidence for the
promised visible formatting; that appearance claim is superseded by this repair.

The existing editor now presents parsed emphasis as bold/italic text and hides
only valid formatting delimiters. The manuscript remains in the existing Markdown
files with original source coordinates. No new prose store, dependency, format
migration or rich-text framework was introduced. Literal asterisks, escaped stars
and inline code remain literal. Spaces and paragraph breaks stay outside newly
applied emphasis, so a drag including trailing whitespace does not create the
reported invalid delimiter placement. The command resolves selection boundaries
against parsed emphasis when a keyboard selection includes a hidden delimiter.
Inactive sections show the same styling and retain raw source text in hidden
presentation spans so cross-section native selections still map to exact source
offsets. The new Note regression verifies the stored range in such a section.

Evidence:

- `writer-visible-formatting-repro.log`: four failing-before visible/whitespace
  regressions, including the exact `**forest` plus newline `**` failure.
- `writer-visible-formatting-focused.log`: 49 tests pass in four files, covering
  visible markup, nested styles, newline/space selection, multiple paragraphs,
  hidden-delimiter selection, exact Note offsets and previous writing tools.
- `writer-visible-formatting-electron.log`: 2/2 native desktop journeys pass.
  A1 now asserts rendered font weight/style and absence of visible asterisks,
  checks exact saved source, reload and inactive-section appearance. All three
  Find/Replace scopes and the earlier Pin/Note/rail/follow/Back journey still pass.
- `app/test-results/stage19-writer-foundation--fef11-earch-scopes-and-saved-Undo-electron/batch-a-visible-formatting.png`:
  inspected screenshot with bold forest and italic red shirt; neighboring prose
  remains plain. These source/test counts overlap earlier evidence.
- Renderer typecheck, renderer build, app lint, scoped desktop-test lint and
  whitespace checks pass. The unrelated packaging workflow's recorded hash is
  unchanged. Complete app-suite evidence is in
  `writer-visible-formatting-vitest.log`: **1,635 pass, 2 skip, 1 fail (164 files)**.
  The same packaging-policy failure remains
  outside this task and prevents a fully green gate.

The assistant also selected forest and clicked Bold through the actual desktop
controls, inspected the visible change, then used Undo to restore the starting
text. The earlier author's saved failing attempt was preserved. A separate clean
Batch A project is open in the repaired development build for the two failed
steps to be retested. Its updated path/config are in the existing handoff manifest;
the old manifest is retained as `batch-a-before-visible-formatting.json` beside it.
The author subsequently confirmed that **Bold and Italic both passed** in this repaired development build. Together with the retained Undo/Redo and Save passes, the first four hands-on checks are accepted. Find/Replace and later batches still await author testing. No AI execution,
installation, delivery-plan change or release is claimed.

## Author-reported replacement history repair — 2026-10-24

The author clarified: **Undo replacement worked; ordinary Undo/Redo did not**
after replacement. Retain Undo replacement as an author pass for that reported
action; ordinary replacement history is a failure reopened under B1.1. The earlier
Undo/Redo author pass covered formatting, not replacements. Native observation
also confirmed Search scope was Whole manuscript: three shirt occurrences is the
correct count (two in Forest ideas and one in River revelation). The earlier
two-match instruction applied only to Current writing section; this count is not
evidence of a search-scope defect.

Root cause: replacements changed the existing manuscript buffers through the
parent action. The editor treated that controlled value as unrelated source and
cleared ordinary history. The separate replacement-only undo could still restore
its before/after snapshot. The repair extends those existing owners rather than
introducing a new prose store or editing framework:

- Explicit replacement provenance (expected before/after text, deltas and unique
  request) lets the editor retain the authored step and prior typing history.
  Stale, invalid or unrelated controlled values retain the prior history reset.
  Parent source/Note changes are not emitted twice.
- A bounded in-memory list (200 replacement batches) routes toolbar Undo/Redo
  and prose-focused Ctrl+Z/Ctrl+Y/Ctrl+Shift+Z through the same batch action across
  all affected sections. Exact source guards and the current editor's next
  history step preserve later typing/formatting order. New writing discards a
  replacement redo branch; undo in search input fields remains local to them.
- Undo replacement retains its explicit refusal to restore over changed affected
  writing, and its result can now be redone through ordinary Redo. Save does not
  erase the live history. Replacement controls are held while their source return
  is pending; ordinary Undo/Redo are also held during explicit linked saves.
- Exact source-return evidence is published even when an incremental edit already
  mapped the caret to that position. Otherwise, the absent selection event could
  leave Replace next using an older offset and revisit its inserted word.

Three failing-before ordinary-history regressions are in
`writer-replacement-history-repro.log`. The focused editor/navigation run passes
53 tests in four files; a further exact-provenance/reset regression is included
in the final full suite. `writer-replacement-history-vitest.log` records **1,640
passed, 2 skipped, 1 failed across 164 files**. The only failure remains the
untouched packaging-workflow source-SHA policy issue; full gate is not green.
`writer-replacement-history-electron.log` records **2/2 native desktop journeys
passed**, including three-match replacement, Save, ordinary toolbar Undo/Redo,
Ctrl+Z/Ctrl+Y, Undo replacement, later-edit protection, both saved sections and
exact saved-data reload. Earlier selected formatting, Notes, Pins, follow, rails
and Back checks continue to pass. Renderer types/build, app lint, scoped native
test lint and diff whitespace checks pass. Counts overlap earlier runs.

The author's existing test text (three blouses) was saved through the visible
linked-save control before restarting the isolated development host. Both saved
drafts were additionally retained in the chat's
`human-testing/replacement-history-author-saved.json`. The same project is reopened
with that text, not reset to a clean shirt fixture. No AI, services, installation,
release or external plan changed. Ordinary replacement Undo/Redo is
**assistant-verified; author retest pending**. Volatile undo history is not
persisted across restarting the app; perform a new replacement for the retest.


## 2026-10-24 continuation — outline arrangement and comparison

The author reported the replacement-history retest **passed**. Ordinary Undo/Redo
after the saved, three-occurrence manuscript replacement and explicit Undo
replacement now have author acceptance. This supersedes the pending retest above;
it does not promote other search scopes or Batches B–F to author passes.

The author explicitly requested continuing tested tools in the development build
and no new mockup. This bounded continuation implements OUT03's planning order
and OUT09's passage comparison using existing writing groups, draft buffers,
Living Outline Notes, Command task host and Back. No new dependency, prose store,
route enum or metadata schema was introduced.

- **Plan arrangement:** Writing order / Planning order, Earlier/Later, drag and
  Undo plan move. Group-array order is saved in the existing outline file.
  Written pages do not move. Loose passages stay beside their preceding pinned
  passage in planning order without becoming part of that unit. Self, malformed,
  foreign-project and stale-generation drops cannot move groups. Undo refuses to
  resurrect a plan after membership changes; source spans and current labels are
  retained. Move history is bounded and session-local.
- **Compare selected:** choose at least two pinned units, read their exact source
  excerpts and attached Notes, return to each source, close or clear comparison.
  Removed/unresolved selected units show an explicit changed-source message;
  unresolved Notes are not projected as current evidence. Comparison does not
  generate suggestions or mutate prose.
- **Expand and return:** Outline expands into the existing current-window Command
  canvas, with matching menu/title, the same selection/order/comparison and Back.
  The existing WritingPageProvider now spans both same-window surfaces. Detached
  Command remains a prose-free projection and explicitly directs this work to the
  Writing Studio window; this slice does not qualify complete detached-tool use.
- **Desktop corrections:** outline follow now exposes the row through enclosing
  rail scroll areas after tool reflow. Compact checkbox/action styling avoids
  full-width checkbox controls. Saving a changed plan skips equivalent Note
  anchors, preserving untouched Note timestamps and legacy single-anchor shape.

### Evidence and limits

`writer-outline-tools-focused.log`: **33 passed** across real editor integration,
Back restoration and repository persistence checks. Covers intact source/Notes,
co-located loose passages, plan Undo/membership guard, invalid drops, exact
comparison, source navigation and removal of stale excerpts.

`writer-outline-tools-electron.log`: **3/3 real desktop journeys passed**. The new
journey exercises Earlier, Undo, native drag and self-drop in the expanded tool,
both order views, exact excerpts/Note text, expansion/Back, source return and
saved-data reload. Both earlier native journeys continue to cover formatting,
replacement scopes/history, cross-section Pin/Notes, many-row follow and rails.
The initial run caught a real nested-scroll/follow regression and an empty
expanded tool; both were repaired. Distant native dragging is exercised where
both targets are visible in the expanded tool; long-rail edge/autoscroll and
sustained large-draft use remain explicit author/qualification work.

`writer-outline-tools-vitest-final.log`: **1,644 passed, 2 skipped, 1 failed across
164 files**. The sole failure remains the unchanged packaging-workflow policy:
artifact upload at line 101 is not bound to the exact source SHA. The packaging
workflow SHA256 remains
`9c4c97195ce5c6cb8fc49ef035727c2ac54b35d7c2248e11b2c782268b59cc33`.
Full gate is not green. Renderer types/build, app lint, scoped native/storage-test
lint and patch-whitespace checks pass. Counts overlap earlier evidence.

Before refreshing, the author's current two unsaved sections were saved through
the visible linked-save control and **Saved durably** was verified. Both exact
drafts were retained in this chat's
`implementation/outline-tools/author-saved-before-refresh.json`. The same project
was reopened from Recent projects in the updated development host, PID 11832 at
handoff, with all three blouses preserved. No replacement test fixture was copied
over the author's writing. The isolated manifest/launcher paths remain unchanged.

No new mockup, AI/provider run, scheduler, external-plan change, replacement
installation, package, release, commit or push was performed. New tools remain
assistant-verified pending author checks. Use the original B–F checks below, then
add: pin at least two units, Earlier/Later, Planning order, Undo plan move,
Compare selected, expand into Command Center, Back, Save/reopen. The live project
has no pinned units yet; disabled comparison is expected until two are defined.

The chat's existing demo-to-application gap list now contains a dated current
build ledger and a grouped remaining-work list. The old review tables retain
their original baseline evidence and are superseded only by dated implementation
updates. Remaining deterministic journeys and actual AI qualification are distinct.

## Human checks — use a disposable project in this development build

Do not use the accepted installed app as evidence for these source changes.
The existing development launcher/build process must point at this continuation
checkout. No replacement installation was performed by this task.

### Batch A — select, format and replace

1. Enter a page containing a one-word idea, rough paragraphs and repeated words.
2. Highlight a few words. Bold and Italic must affect only that selection. Undo
   and Redo must preserve surrounding text. Ctrl+Home/End must reach true edges.
3. Open Find & replace. Check the preview, then test current-section, selected
   words and manuscript scopes. Use the visible Replace action.
4. Use Save writing, revisit both affected sections, then try Undo replacement.
   If you edit after a replacement, the batch Undo must refuse to overwrite it.

### Batch B — make and reshape units

1. Highlight a phrase and Pin it. The outline must show it once, alongside the
   surrounding unpinned writing.
2. Clear the highlight. Press Pin, choose the beginning, then the end across
   multiple saved sections. It must form one writer unit with two endpoint pins.
3. Rename a unit; its prose and Notes must remain unchanged. Pin a range cutting through an existing unit. Both outside pieces remain;
   no word belongs to two units. Try Unpin and Undo Pin.
4. Cancel an unfinished Pin with Escape. Editing after its first point must
   cancel the old endpoint rather than bind stale offsets.

### Batch C — Notes stay with writing

1. Select words, right-click and choose Notes. Enter a Note and Keep Note.
2. Add two more Notes to that writing. Open each pencil and each outline entry;
   editing Note two must not create a fourth Note.
3. Attach one Note to a unit crossing saved sections. Read each source passage.
4. Insert text before it, delete its passage, Undo and Save/reopen. The Note and
   unit identities remain; uncertain links request explicit reconnection.

### Batch D — follow and highlights

1. With many outline rows, scroll near the end of the writing and open Story.
   The outline must expose that area without a separate scroll hunt.
2. Browse elsewhere in the outline; it should not pull back until another
   writing scroll/selection or rail reopening asks it to follow.
3. Try unpinned-only, concern-only and no highlights. Words and Pin membership
   must not change. Confirm whether the colors make concerns easy to find.

### Batch E — quiet rails and Companion

1. Use each edge dot. An unlocked rail dismisses after leaving it.
2. Keep Story open. Move away, press Escape, open Review and reveal Companion.
   The deliberate Story lock remains until explicitly closed.
3. Keep Companion open too; close it manually. Story stays locked. Reopening a
   manually closed rail must accurately show Keep open rather than Locked open.

### Batch F — return and reopen

1. Leave an unfinished Note/search, select writing and note its reading position.
2. Visit Command Center tools and use Back. Check the previous tool, text
   selection, reading position and unfinished work.
3. If the source changed, Back must retain work without guessing an old range.
4. Save and reopen the disposable project. Check all units, Notes and exact prose.

## What follows this batch

The 69-item design register remains the catalog. Automated passes here do not
turn its remaining demo-only, undecided, AI-dependent or untested rows into
completed application work. Record author results by behavior and build.

Genre, story direction, draft stage and “Use as…” require a real behavior
contract with the later AI systems; they are not discharged by decorative Note
categories. The forest and poison examples remain evaluation fixtures. Existing
Program 7 closure and Program 8/9 admission/owner checkpoints are unchanged.
No model/provider execution, scheduler, AI admission, commit, push, package,
release or replacement installation was performed.

## 2026-10-24 continuation — testing-method experiment

The combined experimental/implementation handover is complete. Before any
documentation edits, all 24 local changed/untracked files matched the recorded
handover hashes at the same branch and HEAD. No application source or builds
changed in this experiment. The existing behavior register/ledger remains the
inventory; earlier author acceptance and historical uncertainty remain intact.

Reused the unchanged 0.19 HTML demo for a bounded Graph count/manual-observation
to exact-source workflow. CUA's first sandbox-loopback attempt timed out; its
second attempt with approved local server access succeeded through source return
and exact word selection. An isolated Playwright script passed two clean runs
and caught a deliberately wrong source target between them. The defect existed
only in a disposable page DOM; the reference HTML and writing stayed unchanged.
Single manual metric selection does not establish simultaneous Emotion/Pacing,
automatic interpretation or useful Companion behavior. Exact token usage was
unavailable; no numerical token savings are claimed.

One existing Outline arrangement/comparison Electron journey was rerun for the
specific purpose of transferring the method to the actual built application:
**1 passed (10.1s)**, on its own disposable project with AI disabled and the
author-handoff environment unset. It covers order/drag/Undo, exact prose/Note
comparison, Back/source return and saved-data reload. This overlaps the earlier
three desktop journeys and is not another author acceptance. The full suite was
not repeated; its latest 1,644 pass, 2 skip and one pre-existing packaging-policy
failure remains the baseline. Full gate is not green.

Commands, versions, build/source hashes, failure evidence, screenshots, traces,
method comparison and limits are in the
[testing-method record](<C:/Users/gray2/Documents/ChatGPT/Black-skies program 8/outputs/testing-method-2026-10-24/REPORT.md>).
Only small workspace test helpers and documentation were added. No live author
project, installed app, AI/provider, external plan or release was changed.
Next author checks remain Pin/regrouping, Notes, then planning/comparison in
short batches; no new author pass is recorded here.

## 2026-10-25 — remaining-work execution and efficient build plan

The author confirms **Batch A was completed before the handover**. Treat Batch A
as closed, including its earlier scope-specific pending wording. The retained
project name `Batch A · Forest and poison` is a project identity, not an
instruction to repeat Batch A. The previous request to Pin in that project was
Batch B and should have been labelled explicitly. New checks below are assistant
edge-case verification, not demands that the author repeat accepted checks.

Work through the remaining ordinary behaviors in the following dependency order.
Every row has at least two explicit edge cases. `Queued` means no new pass is
claimed. Built/partial status does not mean accepted, and a missing feature is
recorded as missing rather than tested through a simulation. Preserve the
existing historical Uncertain records and the separate AI/installed gates.

| Order / existing home | Work and starting state | Edge case 1 | Edge case 2 | Current action |
| --- | --- | --- | --- | --- |
| 01 / OUT01, ED08 | Pin/regrouping, built | Undo another Pin after naming a surviving unit must retain the later name. | Unpin/rename/Unicode insertion/Undo must retain identities and correct UTF-16 ranges. | Both new checks reproduced name loss, then passed after repair; native name/Undo journey passed. |
| 02 / ED09 | Passage Notes, built | Three identical Note labels: edit the middle identity without creating a fourth Note. | Insert surrogate pairs before the source, Save and source Undo; retain the exact Note identity/range. | Both new checks passed; no new product defect found in these cases. |
| 03 / OUT03 | Plan arrangement, built | Rename after a plan move, then Undo the move; keep the name. | Repeated clicks while saving must not create hidden extra moves/history entries. | Both new checks passed; source and Note state retained. |
| 04 / OUT09 | Exact passage comparison, built | Literal HTML-looking text, Unicode, blank lines and spaces must remain exact and inert. | Delete both compared sources; show changed/removed status, withhold every stale excerpt. | Both new checks passed; no stale excerpts or rendered HTML. |
| 05 / WS01, OUT14 | Follow/highlights, built; long-rail qualification open | Manual outline scrolling must not be pulled back by duplicate unchanged selection events. | Dirty source must withhold stale concern marks; disabling red must preserve independent pinned/unpinned switches and source. | Two new highlight checks and native manual-browse/reopen/source-follow checks passed. Deliberate writing clicks remain valid follow requests. |
| 06 / WS02, WS03, WS06 | Quiet rails and Companion shell, built | Lock a rail while its delayed dismissal is pending. | Lock both side rails, Escape, then close one; retain the other lock. | Both new checks passed. Companion AI remains unavailable. |
| 07 / WS08, WS10 | Back/retained work, built | A delayed failed surface return after project switch must not revive old-project history. | A delayed failed unit return after project switch must not publish the old failure/draft into the new project. | Both checks reproduced project-scope leaks, then passed after guarding failure completions. |
| 08 / WS01, WS05, OUT14 | Long/narrow/multiple-window qualification, partial | At least 30,000 words with many tiny units; preserve last-word navigation, source and Notes. | Narrow window and distant rail drag; controls remain reachable and failed/invalid drops preserve order. | New native 30,000-word/80-pin and 760px/640px/120-pin checks, plus repository 1,000-unit checks. Header clipping at 760px reproduced and repaired. Sustained growth, distant drag/autoscroll and complete detached continuity remain open. |
| 09 / OUT03 | Move actual manuscript, bounded writer-unit slice built | Move across saved sections with linked Notes and compare exact before/after source. | Cancel or edit source after preview; refuse stale Apply and Undo over newer writing/links. | Assistant unit/integration and real Electron journey passed; see the organization checkpoint below for protected-boundary/save-format limits. Unrestricted arrangement remains unqualified. |
| 10 / OUT04 | Explicit writer-unit split and join built | Split beside surrogate pairs/format delimiters without breaking prose or Note identity; join cross-section/nonadjacent selections in writing order. | Outer-end/empty split and fewer than two join selections are no-ops; Undo restores exact membership. | Assistant integration and real Electron Save/reopen/split/join/Undo passed. These controls change pins only; Notes retain their identities. |
| 11 / OUT05, OUT06 | Gap fill/retirement and later organization, partial | Empty or canceled gap fill preserves the gap and all original writing. | Retire a gap or change a planning label with Notes attached; preserve their identities and Undo. | Confirm the bounded manual journey in existing owners before adding controls. |
| 12 / ED09, OUT17 | All-story Notebook browse/search/delete/Undo, partial | Duplicate titles and unlinked/removed sources remain independently searchable/openable. | Delete while a Note draft is dirty or a save is pending; recover only the deleted identity, never overwrite a later edit. | Existing stale/concurrent writer guards passed; two new temporary/permanent replacement-lock checks passed after bounded retry repair. Full browse/search/delete/Undo UI remains implementation work. |
| 13 / OUT10, OUT11, CR03, CR06 | Manual concerns/quiet icons/paired evidence, partial | Several concerns at the same words retain separate identities and both exact sources. | Edit or delete either source, dismiss/resolve/reopen; show stale status rather than current evidence. | Reuse Program 7 lifecycle and source contracts. Semantic discovery remains AI work. |
| 14 / CR04–CR07 | Revision alternatives/partial acceptance/History, partial | Source changes after preview; acceptance refuses without altering either version. | Partial acceptance and later independent edits; Undo/history must not overwrite newer prose or resurrect a dismissed finding. | Six selected existing revision repository/drawer/comparison guards passed. Complete contextual access and the full writer journey without repeating these unchanged checks. |
| 15 / CP02, CP06, P8-A/B | Manual character/place/object/world cards, partial | Same name for different subjects and conflicting manual facts remain distinct. | Deleted/changed linked source retains the card with an honest unavailable link. | Two manual-path/stale-signal workspace guards passed; complete card destinations and source lifecycle. No extraction or full card CRUD pass inferred. |
| 16 / OUT12 | Manual timeline, partial | Moving reader revelation never changes event truth or a character's mistaken belief. | Duplicate/unknown event times and missing sources remain explicit; navigation never guesses. | Existing protected/stale-source and uncertainty contracts passed. Full truth/belief/revelation manual journey remains implementation work. |
| 17 / GR01–GR06 | Unified Graph layers/scopes/subjects/source return, partial | Toggle one layer without clearing another selected layer or subject. | Stale/no-source/empty data must not display a made-up score or navigate to another subject. | Four existing Graph subject/source/stale/filter checks passed. Single-layer Emotion still does not implement multi-layer Graph. |
| 18 / ED02 | Real spelling/accepted names, missing usable dictionary proof | Accepted character names and intentional spelling stop being repeatedly flagged. | Offline dictionary unavailable, Unicode/apostrophes and language changes preserve writing and explain capability. | Inspect supported Electron dictionary owner; a saved preference alone does not pass. |
| 19 / ED04 | Durable font/spacing/indent, partial | Restart/project switch retain the declared preference scope without mutating prose. | Export to a format without those visual properties reports representation honestly and preserves all words. | Extend existing appearance owner; declare export behavior. |
| 20 / ED06, ED07 | Quiet counts/goals/optional guidance, partial | Empty, one-word and Unicode drafts produce understandable counts without blocking writing. | Unknown/zero/changed goals and project switching do not create misleading progress or stale guidance. | New punctuation-only and decomposed-Unicode tests failed before the counting repair, then passed. Goals/setup and tone-aware advice remain separate incomplete work. |
| 21 / OP01, OP02, WS09 | Reading/results/currentness, partial | Editing one source invalidates affected coverage, not unrelated current results. | Cancel/unavailable re-reading and returning to old findings do not claim new analysis happened. | Reuse coverage/result owners; no fake background job. |
| 22 / ED10, OP08 | Import/export/format qualification, partial | Duplicate titles, Unicode, empty sections and mixed supporting material preserve exact words/order. | Cancel dialog, stale revision or destination-created-after-preview cannot cause an unintended overwrite. | Selected Markdown Unicode/duplicate/empty-source and unconfirmed-destination checks passed; broader formats and purpose-specific export still need their own journey. |
| 23 / OP07, OP08 | Backup/recovery/named versions, partial | Interrupted write or corrupt snapshot preserves prior recoverable bytes. | Restore into changed writing/project scope requires an explicit correct target and retains the other version. | Selected recovery replacement-failure/prior-byte and wrong-project/path checks passed. Named versions and full recovery qualification remain open. |
| 24 / WS04, WS05, WS09, WS10, CP03/CP04 | Menus/help/two surfaces/two windows, partial | Tool switching and failed detached navigation retain unsaved work and exact context. | Closed secondary window, late event or project change must not apply stale context or expose a dead route. | Preserve Writing Studio prose authority; complete bridges, not duplicate stores. |

AI-dependent queue (no model/provider run authorized by these ordinary checks):

| Order | Work | Edge case 1 | Edge case 2 | State |
| --- | --- | --- | --- | --- |
| 25 | Useful local Companion/context retrieval/conversation expansion | Conflicting or deleted evidence must be cited as uncertain. | Reopen/switch projects and expand an older question without leaking another project's context. | Requires bounded route/quality proof, not a shell pass. |
| 26 | Active genre/form/tone/stage/story direction | Same forest text under different intentions must change useful advice without changing facts. | Unknown direction and a one-word idea must remain writable and must not be graded as failed finished prose. | Use existing direction behavior contract. |
| 27 | Extraction, development and contradiction proposals | Poison truth, telling, belief and reader knowledge remain distinct. | Repeated names, negation and intentional changes produce sourced possibilities rather than automatic canon. | Manual destinations must exist first. |
| 28 | Incremental/background reading | Change source while a job is running; stale output cannot become current. | Cancel/restart/resume never duplicates paid/local work or loses declared coverage. | Existing admission and job boundaries remain. |
| 29 | Local/provider route quality, budgets and batching | Failed/partial responses report actual use and no false success. | Budget exhaustion, unavailable model and canceled batch keep writing usable and do not silently reroute to paid service. | Needs separately authorized route/model evaluation. |

Packaging/release remains a separate known blocker, not an ordinary writer-tool
fix. Research browser integration, branching, submission calendar, media and
publishing remain later product decisions. No installed/candidate/catalog pass
is inferred from this plan.

Efficient execution: reuse current evidence for unchanged accepted behavior;
select the next unfinished row; specify normal outcome and at least two edges;
write the smallest meaningful failing check for a found defect; patch its existing
owner; run the affected checks; then do one representative native journey for a
UI/bridge change. Broaden to the full relevant suite at a coherent integration
checkpoint, not after each wording change. Save commands/results and changed
source hashes once and link them rather than re-reading history or rerunning
passed human batches. Keep product decisions and writing-value acceptance with
the author. No new agent platform, testing application or behavior-file change.

The first experiment improved repeatability and proved intentional wrong-source
detection. Its Playwright sequence took about 14 seconds including browser
startup, and one focused native journey took 10.1 seconds. Browser control worked
after a local-access correction, but needed more model-guided interactions.
There is no controlled before/after token measurement or guarantee of a bug-free
application. Measure new runs, defects caught, setup/retry effort and remaining
human actions; do not invent savings percentages. These focused-test and linked
context choices agree with the
[official workflow guidance](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex),
without introducing its optional extra document hierarchy.

### Execution evidence and remaining implementation

This pass added **20 meaningful unit/integration edge checks**, plus three
parameterized native stress cases, and extended the existing native Outline
journey with name preservation after Unpin/Undo. It did not rerun Batch A's
native journey or ask the author to repeat Batch A. Automatic related regressions
were run because source owners changed; existing author acceptance stays closed.

Five repairs were made in existing owners:

1. `useWritingPage.ts`: a deliberate rename updates the same identity in Pin
   history, so membership Undo cannot erase the later name. Existing source
   rebasing and metadata/prose separation remain.
2. `useWorkNavigation.ts`: recheck project identity after awaited surface/unit
   activation **before** publishing failures or restoring history. Success and
   failure paths now share the same project boundary.
3. `projectSessionCoordinator.ts`: word tokens start with a letter/number and
   retain combining marks/name punctuation. Punctuation-only text is zero words;
   decomposed Unicode and dialogue ratios are counted consistently. Body bytes
   and source fingerprints are unchanged.
4. `livingOutlineRepository.ts`: atomic replacement retries only EPERM/EACCES/
   EBUSY, at most three attempts with 25/50ms delays, inside the existing queue.
   Permanent failure retains prior bytes, removes only the temporary file and
   reports failure. No target deletion, guard relaxation or silent success.
5. `app.css`: reuse the existing compact-header wrapping through 900px while
   retaining the separate 720px revision-layout rules. The 760px save status
   previously began about 52px outside the viewport; 760px and the supported
   640px minimum now have direct header-control bounds checks.

The native rename sequence once reported WRITE_FAILED with its draft retained.
Its precise underlying OS error was not captured, so its historical cause
remains **uncertain**. Temporary-lock recovery was independently reproduced by
injected EPERM, and persistent EACCES preservation was independently checked.
Do not claim the injection proves the cause of that earlier native event.

Native test development also exposed invalid test assumptions, not additional
product bugs: an explicit writing click legitimately asks the outline to follow;
and CodeMirror virtualizes long content, making rendered-text-prefix length an
invalid source offset. Final fixtures use unique fixed-width words to recover
source independently of virtualization. The oracle accepts the actual visible
reading range or the deliberate end caret, and separately verifies manual
outline browsing survives duplicate selection notifications. Initial failures
remain in the `writer-remaining-*repro*`, `*follow*` and earlier native logs.

Verification in the checkout root:

- `writer-remaining-edge-repro-2026-10-25.log`: four failing-before Pin/Back cases.
- `writer-remaining-counts-repro-2026-10-25.log`: two failing-before count cases.
- `writer-remaining-write-repro-2026-10-25.log`: temporary/permanent replacement
  cases before bounded handling; original persistent failure already preserved
  bytes, but had no retry bound to test.
- `writer-remaining-header-repro-2026-10-25.log`: 760px clipping failure; existing
  640px case passed, so it was not silently reclassified as a prior failure.
- `writer-remaining-owner-regressions-2026-10-25.log`: **235 pass in six files**,
  including all 20 new unit/integration cases.
- `writer-remaining-owner-boundaries-2026-10-25.log`: **20 selected checks pass
  across ten existing partial owners**. Two each: Note concurrency/staleness;
  revision persistence; dirty/duplicate revision saves; exact/partial revision
  choice presentation; manual/stale Story Knowledge; timeline uncertainty/source
  guards; Graph subject/stale UI; Graph source/filter contracts; Markdown Unicode/
  destination guards; recovery prior-byte/project guards. Two tests overlap the
  six-file owner run; counts must not be added as unique coverage.
- `writer-remaining-electron-complete-2026-10-25.log`: **4/4 targeted actual-app
  journeys passed (20.3s)** after the final header repair: extended Outline/name
  Undo, 30,000 words/80 pins, 760px/120 pins and 640px/120 pins. Each stress
  journey verifies exact saved writing after an appended sentence, one retained
  Note identity, source/outline following, manual browsing, reopen of the rail
  and viewport bounds of the header controls. These are disposable HARNESS_ONLY
  app fixtures with local AI disabled; no installed or human acceptance inferred.
  Screenshots/traces are under the workspace's
  `outputs/testing-method-2026-10-25/electron-complete/test-results/`.
- `writer-remaining-vitest-final-2026-10-25.log`: **1,664 pass, 2 skip, 1 fail in
  164 files** at the core repair integration checkpoint. The only failure is the
  existing packaging-workflow exact-SHA policy. This is 20 new passing cases
  over the prior baseline, not a new-file or broad catalog acceptance.
- Renderer/main type checks, app lint, scoped main/native-test lint and builds
  have their `writer-remaining-*` logs. Two pre-existing lint errors in touched
  owners were corrected mechanically: unused test binding and an empty marker
  interface replaced by its equivalent type alias. No runtime refactor.

The full unit run was performed once after the core runtime repairs. The final
header CSS change is validated by the targeted actual-app geometry journeys,
not a claim that unit tests measure visual layout. No second full-suite rerun
was needed for that scoped CSS/type-only cleanup.

The existing packaging file remains SHA256
`9c4c97195ce5c6cb8fc49ef035727c2ac54b35d7c2248e11b2c782268b59cc33`.
The full gate remains non-green. Existing historical uncertain causes and
accepted human checks are preserved. No author project was opened, restarted,
reset or rewritten. No AI/provider, installation, release, commit/push, external
delivery plan or behavior/configuration file was changed.

All remaining rows have at least two **planned** edges. Only the observed checks
above are passes. In particular, actual writer-unit prose moves/split/gap work,
full Notebook management, paired manual concern UI, complete manual cards,
multi-layer Graph/belief-aware timeline, dictionary/font preferences/goals,
actual re-reading, broader import/export/version qualification and complete
detached continuity still require implementation or qualification as shown in
the matrix. These are not discharged by testing their partial underlying owners.
Proceed in that dependency order; further human review should focus on new
writing value and design choices, not a repeat of Batch A.

Final `git diff --check` passed with the existing tracker line-ending warning.
The branch and HEAD are unchanged; all inherited local work remains. Source
status/SHA256, the exact built main/renderer hashes, results and scope limits are
saved in the workspace's
`outputs/testing-method-2026-10-25/checkpoint.json`. Final 760px/30,000-word
screenshots were inspected; the save status is visible after the CSS repair.

### 2026-10-25 organization milestone — safe stopping checkpoint

The author superseded the catalog-wide instruction: **finish the current
milestone and stop**. This checkpoint completes the bounded actual-passage
move/preview/Undo and writer-unit split/join slice in the verified application
checkout. Gap fill/retirement, Notebook and later catalog items were **not
started** in this milestone. Continue only on a later request. Earlier wording
above that calls actual passage moves and split missing is historical; rows 09
and 10 and this checkpoint give their current status. Batch A remains completed
by the author before handover; no repeated human batch is requested.

Implementation stays in `WritingPage.tsx`, `useWritingPage.ts`, the shared
`writingRanges.ts` owner and the existing CSS. Markdown drafts remain the sole
prose store; the existing living-outline file stores group/Note anchors. No new
schema, storage journal, IPC route, renderer framework or HTTP mockup was added.

- In each pinned outline entry, open **Organize this writing**, choose another
  pinned unit under **Move before**, then **Preview passage move**. Exact raw
  before/after source is available per affected saved section. Cancel changes
  nothing. Apply updates the existing buffers; **Save writing** persists source
  and rebuilt links. Planning group-array order is retained.
- The move maps each original source character to its new position, preserves
  existing whitespace, joins source spans with explicit paragraph spacing and
  prevents adjacent non-whitespace text from fusing. Complete selected emphasis
  includes its hidden Markdown markers. Group IDs and Note IDs/bodies stay the
  same; cross-section Notes use the existing explicit reconnect save contract.
- Moves use the existing guarded replacement/editor history. Ordinary Undo/Redo
  restores all affected sections and linked anchors as one action; **Undo
  passage move** is also available. A later independent name is preserved. New
  prose discards the redo branch. Stale previews and newer Pin/Note links cannot
  be overwritten by the old move. Project identity scopes preview/history.
- **Split at writing cursor** retains the original identity for the first
  piece and creates a second pinned identity; exact prose and Notes are
  unchanged. **Join selected units** pins the outer range in actual writing
  order, including intervening writing/units; this consequence is stated beside
  the control. **Undo Pin** restores the preceding membership. Single-selection
  joins, outer-end splits and half-surrogate splits leave source unchanged.

Explicit bounds: a move that partially cuts a formatted passage or one linked
Note passage is refused before Apply; moving into the interior of those sources
is also refused. Zero-length removed groups cannot be moved. The current draft
envelope strips leading blank lines, so the preview refuses a result that would
begin a changed section with a newline, with directions to include the paragraph
spacing in the pinned passage. That save-format behavior was not rewritten.
The same existing sequential multi-section Save is used; this is **not a new
cross-file crash-atomic transaction**. Undo histories are session-local; reload
retains the saved writing/links but does not promise persisted Undo. Existing
analysis must be reread after source changes; no AI behavior was added or run.

Verification:

- **14 new unit/integration cases**: four exact source-mapping checks and ten
  real-editor organization checks. They cover cancel/no mutation, cross-section
  Note relocation/Save/Undo/Redo, stale previews, later typing and redo branches,
  later names, later Pin guards, complete/partial emphasis, partial linked Notes,
  leading-blank refusal, cross-section and nonadjacent join order, single
  selection, interior/outer-end/Unicode split and membership Undo. Each of move,
  split and join has at least two exercised edge cases.
- `writer-organization-regressions.log`: **251 pass across five affected files**
  (writer integration/ranges and existing DraftEditor/app regressions). These
  automatic checks were warranted by shared source-history changes; native
  accepted Batch A was excluded.
- `writer-organization-electron-complete.log`: **1 targeted journey passed,
  9.1s including fixture startup** (test body 7.0s). Disposable actual Electron
  fixture, local AI disabled: exact preview and cancel, styled cross-section
  move, byte/body checks, same Note identity/body/owner/offsets, ordinary
  Undo/Save/Redo/Save, reload, measured interior cursor split, split Undo,
  cross-section join and membership Undo. Planning order was unchanged. Both
  saved screenshots were visually inspected. Evidence is under the workspace's
  `outputs/writing-organization-2026-10-25/electron-complete/test-results/`.
- Initial native attempts remain in `writer-organization-electron*.log` and
  separate output directories. A word-navigation/key-count assumption did not
  place the caret where the test expected. Final test measures its actual DOM
  source position independently and asserts the saved split boundary equals
  it. A later test compared a Note's `updatedAt` with the snapshot taken before
  source Undo/Redo; the corrected oracle captures the complete Note after that
  source cycle and proves split/join leaves it unchanged. Neither test-authoring
  correction is recorded as a reproduced product bug.
- Renderer and main TypeScript/build, app lint, scoped shared/main/native-test
  lint and whitespace evidence use the `writer-organization-*` log prefix.
- `writer-organization-vitest-final.log`: **1,678 pass, 2 skip, 1 existing
  packaging-policy failure across 164 files** (140.12s). All 14 added cases pass.
  The failure remains artifact upload at line 101 not bound to the exact source
  SHA; it was not changed to make this writer checkpoint green.

The final full-suite result and source/build hashes are recorded in
`outputs/writing-organization-2026-10-25/checkpoint.json`. The unrelated packaging
workflow remains at SHA256
`9c4c97195ce5c6cb8fc49ef035727c2ac54b35d7c2248e11b2c782268b59cc33`.
No installed-release, author acceptance or complete-catalog claim is made.
All inherited uncommitted/untracked code remains; no project reset, commit/push,
installation, provider run or behavior-file work occurred.

**Stopped here.** Next queued catalog work is row 11 (manual gaps/retirement),
followed by row 12 (Notebook). Neither is active. An optional future author
review can focus on the new organization controls; earlier passed batches stay
closed. The checkout's current built renderer and saved evidence are the
continuation point, rather than the earlier experimental HTTP demo.


## Authorized B1–B8 campaign — engineering baseline preserved

Execution began after source/runtime hash verification. Recoverable baseline: `outputs/catalog-checkpoints/baseline-2026-10-25/` contains source.zip (2,099 files), runtime.zip (426 files), references.zip (59 files), exact manifests, tracked.patch/status and RECOVER.md. Source extraction verified against every manifest hash. No stage/commit/stash/reset/clean. Packaging-policy failure is unchanged and independently owned. B1 is in progress; no new behavior is marked passed. All 69 IDs and 36 journeys have delivery-plan cross-references in the existing coverage map and program sections. US English first and preserved filled-gap planning Note are settled.


## B1 engineering checkpoint — October 26, 2026

OUT05/T10 manual gap lifecycle implemented in the actual checkout. The original gap ID, label and planning body become an attached authored Note after fill. Exact source insertion creates one writer group. Preview/cancel, explicit relocation, ordinary/explicit Undo, Redo and reopen use current owners. Main validates both saved source and proposed ranges. One pending outline metadata record coordinates recovery with existing manuscript recovery checkpoints; it contains fingerprints/coordinates/link metadata, not another prose store. Other outline mutations refuse while the pending save needs completion.

`catalog-b1-owners-complete.log`: 81 passes in four affected files. This includes 10 added checks: five renderer lifecycle/fault cases, four repository prepare/finalize/reopen/Undo fault cases and one main source/authority case. `catalog-b1-electron-complete.log`: 2 passes (10.1s), one normal gap/Undo/Redo/reopen journey and one injected three-attempt EBUSY failure specifically during final metadata replacement, followed by renderer reload and Finish gap save. The exact saved prose is inserted once, original planning Note/ID retained, and pending state cleared. A fresh repository instance independently exercises durable pending records. This is not a fresh full-process installer qualification. Final screenshots inspected.

Initial failures retained: `catalog-b1-fault-final.log` exposed an old test waiting for Undo-button state instead of persisted plan order; its assertion now waits for the stored result. The first native fault injection used dynamic import unsupported by Playwright's main-process evaluation context; it now uses the actual built-in fs/promises module. Neither is recorded as a product defect. Three pre-existing test `any` annotations were replaced with equivalent narrow types for scoped lint. Renderer/main types/build, app lint and scoped lint pass. `catalog-b1-vitest-checkpoint.log`: 1,688 pass, 2 skip, one unchanged packaging-policy failure across 164 files (132.75s). The known packaging policy stays unchanged.

Recoverable checkpoint target: `outputs/catalog-checkpoints/b1-2026-10-26/`; baseline recovery already verified at `baseline-2026-10-25/`. No author acceptance or installed-release claim. B2 Notebook follows after this checkpoint; the overall B1–B8 campaign remains active.

### B2 engineering checkpoint — October 26, 2026

ED09 is delivered within its manual Notebook scope; OUT17 gains Notebook browsing while its direction/classification obligations remain. The existing Living Outline owner stores all Notes. New optional scope fields distinguish whole-story, deliberately unattached, passage and uncertain legacy origins. Deleted or collapsed passage links retain their original relationship; unverified excerpts and navigation are withheld. Search and edits address stable IDs even with duplicate labels. Dirty drafts block deletion/switching and survive rail closure and project return during this app session. Explicit Keep/Discard controls remain; unsaved drafts are not claimed durable after process exit.

Narrow restore inserts only the deleted Note and its placement into the current metadata revision. It refuses stale revision/identity collision and retains intervening edits/new Notes. Missing source refs are preserved rather than retargeted. Undo is session-local and resets on reload/project-session change. Existing accepted passage Notes/formatting behavior is not reopened for human retesting.

Evidence: `catalog-b2-owners-complete.log` — 88 passes across four affected files (7 new B2 checks over B1: four renderer, two repository, one IPC). `catalog-b2-electron-first.log` — one real Electron journey passes (5.7s including startup): duplicate labels/scopes, search, dirty-delete refusal, rail-close draft retention, edit/delete/intervening create/Undo, exact unchanged manuscript bytes and reload. Renderer/main types and build pass; app lint passes. Scoped lint initially found an empty-interface annotation from B1; changed to an equivalent type alias, no runtime behavior change. Initial B2 log retains the non-unique old removed-source assertion failure, corrected to accept both truthful visible statuses; no application defect counted. The known packaging failure remains unchanged; full shared-owner regression next occurs at B3 integration.

Recoverable checkpoint: `outputs/catalog-checkpoints/b2-2026-10-26/`. Human Gate A pending; no installed acceptance. B3 concern/evidence/revision integration follows.

### B3 engineering checkpoint — October 26, 2026

Delivered manual scope: OUT11, CR04–06; manual portions of OUT10, CR03/07 and CP07. The existing feedback repository owns the concern identity. Primary and optional related evidence keep independently verified coordinates/protection; related records contain metadata rather than copied prose. Manual concerns sharing the same range remain separate. Quiet per-concern Outline controls open Review, then Consider a revision uses the same concern ID in existing alternatives and History. Existing P7 partial/full acceptance, reservation/recovery journal and author dispositions remain the owners. Manual empty deletion proposals require an explicit choice and a nonempty exact source range; accidental empty input remains refused. Inline changes use labeled inert del/ins text and Unicode-safe boundaries.

Applied revisions now enter the existing bounded source-batch history. Explicit/ordinary Undo/Redo preserve linked Note identity/coordinates and cannot overwrite later typing or changed links. Save persists the resulting source/links. This Undo is session-local; an earlier acceptance remains a historical event rather than being silently rewritten. Author resolution is deliberate, even when the source has changed. Source checks record independent availability, never semantic resolution. Feedback decisions wait for source-check persistence, avoiding a rapid-click stale-revision race.

Native evidence: `catalog-b3-electron-qualified.log` passes one complete actual Electron journey (10.3s): two independent concerns on shared evidence; Outline row controls → Review pair → linked alternative; changed related source refuses Apply; source restore then deliberate Apply; linked Note/source Undo/Redo and later-edit guard; author resolution leaves its neighboring concern active; History returns to the visible correct record; reload; explicit deletion and source Undo. `catalog-b3-program7-regression.log` passes the existing no-AI P7 precise partial-application/drawer/fresh-process restart journey (9.9s); this automated shared-owner regression does not reopen accepted human work. B1/B2 native cases passed in the mixed integration invocation; its B3 failures are retained separately and superseded only by the named passing execution, not erased.

Owner evidence: `catalog-b3-owners-complete.log` 367 passes in 14 affected files; later comparison/currentness additions have focused evidence in `catalog-b3-compare-icons.log` and `catalog-b3-ui-qualified.log`. `catalog-b3-vitest-final.log` has 1,705 passes, 2 skips and the unchanged packaging-policy failure across 164 files; it precedes the last presentation/currentness checks and is not falsely described as a final all-catalog green suite. Renderer/main types/build and app/scoped lint pass, with currentness type/lint logs separately retained. Existing React act warnings remain test-harness qualifications.

Defects found/repaired: Outline compared unframed passage hashes with framed metrics retaining a final newline, hiding valid manual concern controls/highlights. It now uses the existing exact-source resolver and withholds unverified projections immediately. History focus previously selected a hidden duplicate view of the same concern; it now finds the visible record. A generic ready-to-open label contradicted a stale evidence result; the evidence projection is now the explicit source status. The new applied-revision Undo control was initially nested inside the gap disclosure; it is now on the writing toolbar. Rapid source-check/decision requests used the same metadata revision; decision controls now wait for the active owner write. Failing native traces/logs remain.

Test-oracle mistakes are separate: the initial source edit fixture built an invalid Markdown envelope (correctly rejected); a whole-section apply omitted its existing deliberate confirmation checkbox; selectors initially counted hidden views; early assertions read a sidecar before creation or candidate finalization; one later-edit test expected session history after its deliberate reload had cleared it. These corrected fixtures/assertions are not counted as application defects.

Gate A is prepared at `outputs/catalog-gate-a-2026-10-26/README.md`, with `Launch-GateA.ps1`, disposable fixtures and an exact frozen candidate. Current candidate hash: `341647c037dd0c74b50967e60f759a7a5218484e3bc787f461f91ef2475e6404`. Its launcher smoke passed using the copied candidate, not just the mutable checkout. Earlier candidate manifests and smoke records remain distinct. Human results are Pending; no installed acceptance or semantic/Graph/Companion completion is inferred.

Recoverable checkpoint: `outputs/catalog-checkpoints/b3-2026-10-26/`. B4–B8 remain active and continue independently. P8-R/P9-D/P10-B/C retain the missing Graph/Companion concern projections; P9-D retains fresh semantic re-evaluation; P9-A/D retains generated continuation with real task/provenance/quality evidence. Ordinary manual owners cannot supply those literary judgments by deterministic source matching. No behavior ID is removed.

### B4 engineering checkpoint — October 26, 2026

Completed the supportable Foundation/Outline Ideas destinations through their existing real owners. Destination previews now capture the expected destination metadata revision and retain a stable prepared-package identity. Foundation explicitly previews replacement of the aboutness guidance and its existing outer-whitespace formatting; Outline explicitly appends a planning Note without inserting manuscript prose. Closing a preview sends nothing. Both UI and commit choose the newest matching preview. Main independently validates current branch/premise/seed lineage, source protection, exact selected text and prepared destination revision. Project-switch completions are guarded.

Durable `sourcePromotionId` metadata is written atomically with the destination answer version or Note. A retry returns that original artifact, including after a fresh process, without duplicate Notes/answer versions or replacement of later author guidance. This uses the existing destination files, not another receipt/manuscript store. Historical Ideas previews remain readable after a premise revision; they are no longer allowed to invalidate the whole Ideas document or masquerade as eligible current previews. Character/Lore actions are labeled as deferred-package retention, not successful card creation. Owner receipt messages distinguish an actual copy from a retry that preserved later work.

Evidence: `catalog-b4-before.log` preserves the reproduced historical-preview validation failure. `catalog-b4-source-target.log`: 50 focused passes; `catalog-b4-owner-next.log`: 232 passes across seven affected owner/UI files before the final receipt-label refinement. Renderer/main types/build and app lint pass. `catalog-b4-electron-complete.log`: one actual Electron journey passes (9.1s): duplicate idea/direction names remain ID-independent; preview/close preserves exact manuscript bytes; an intervening Foundation edit refuses the obsolete copy; a new preview succeeds; repeat sends preserve answer versions and a subsequent author edit; Outline copy and fresh-process retry retain one original Note; revised-premise previews remain historical/unavailable; the other identically named branch stays untouched. `catalog-b4-program7-regression.log`: existing Foundation/Ideas/promotion/failure-path native journey passes (5.4s). Accepted P7 human results are not reopened. The initial native setup omitted required operation IDs, and a later run exposed newest-preview selection still using the first match in the renderer handler; the missing-ID fixture error and actual stale-selection defect are recorded separately.

B4 qualifications / exact carry-forward:

- CP02, CP06, OUT17 and T23 retain Character/Lore/World accepted-card writes and selected update batches in P8-0/A (B-07). The missing requirement is an adopted domain-owned card identity/field/write contract covering aliases, mixed card classes, accepted event truth versus belief, context/time and per-item recovery. Foundation stores guidance and Outline stores planning Notes; neither can safely become a card/fact owner. Minimum future completion: real owner writes with stable entity identity, source/destination version checks, inspectable old/new fields, selected batch outcomes and durable receipts/reopen. Edges: duplicate entity names remain independent; stale/protected or intentionally conflicting evidence cannot silently overwrite accepted facts. Automated owner/IPC/batch/failure/protection and actual Electron evidence are required, then human field-meaning/usability review. Manual Foundation/Outline copying is independently complete today.
- Ideas Writing-section meaning remains O-04, owned by the destination coordinator + author in P8-0/B: named Unit, explicit insertion, or another chosen object have different effects. Existing revision acceptance is source-first and cannot be fabricated into an Idea destination to bypass identity. Minimum: the adopted effect has exact source/target preview, cancel/apply, unchanged surroundings, lineage/retry and fresh-process persistence. Edges: source/target changes after preview refuse; duplicate labels/project switches cannot redirect the write. Plain preview remains available today; the real revision-alternative insertion path stays delivered.
- Project Memory destination remains P8-M/R and O-05, with its actual admission, retention, source/protection and purge contract; a Note is not admitted Memory. Minimum and edges remain in that package: attributed current/protected inputs and honest unavailable admission; source deletion/purge and contradictory retained claims require explicit policy. Genuine generated proposals/extraction remain P9-B/D and require task-quality evidence, not manual-fixture success.

Gate B will include the delivered manual destinations. Current Gate A remains its exact frozen B3 candidate; later shared-owner qualification will update its candidate reference at final campaign integration. Recoverable checkpoint: `outputs/catalog-checkpoints/b4-2026-10-26/`. B5–B8 continue; this is not catalog or installed-release acceptance.


### B5–B6 integration checkpoint — October 26, 2026

**Delivered existing-owner slices:** ED02 native accepted-vocabulary inspection/accept/removal and honest spelling availability; ED04 manuscript-wide display preferences; ED07/GR06 optional project word goal/count presentation; OP08/T29 UTF-8 text intake and saved source-text export. These do not close ED02 spelling detection, ED10 purpose scopes, archive restoration or T28 coordinated named versions. Gate B remains pending.

Project.json stores bounded display values with a revision; no manuscript whitespace is rewritten. Invalid preferences fall back visibly and require deliberate replacement, stale revisions/project identities refuse writes, metadata replacement failure preserves exact prior bytes, and dirty prose/history survives a settings write. Defaults remain until changed. Typography/line height/extra paragraph spacing/first-line indentation apply to active/inactive manuscript presentation. The optional story word goal counts current buffers, can be disabled and never prevents writing. Markdown export does not carry layout preferences.

Native vocabulary is the actual Electron session custom dictionary, not a separate application dictionary. A unique disposable word survived a fresh process and another project in the same session; removal restored the original entry list exactly. Invalid multiword input and stale project requests were refused. Electron documents that Windows can also share these words with the OS; the product does not promise project-only or OS isolation. See https://www.electronjs.org/docs/latest/api/session#sesaddwordtospellcheckerdictionaryword.

**ED02 qualification blocker remains explicit:** actual Electron 39.8.10 US-English language availability/enabled state does not establish loaded detection. Cold offline editor, online language reinitialization, official pinned dictionary cache plus fresh process, focused/plain-control and a native process without browser automation returned no misspelling/suggestions for `foorrrest`. A preliminary isolated-control attempt had no bridge and is not engine evidence. Original wrong webContents API and innerText/textContent test oracles are harness mistakes; subsequent real webFrame failures are retained. Official release dictionary archive SHA256 `63df0916adbd9f1c7fc627b2e10b6a73829f6ea2634a8b2b0c5accecb39d0db8`; two original US BDIC assets and upstream LICENSE are preserved under app/resources/dictionaries as diagnostic assets, not a qualified packaged provisioning path. No invented word list or cloud text service substitutes for native spelling. UI reports unavailable instead of calling a word correct. Conditional suggestions use exact source/body/editor guards and ordinary Undo; their native spelling usefulness is **not** accepted. Failure traces and logs under catalog-checkpoints/b5-dictionary-* remain Fail; no skip or relaxed oracle makes them green.

The exact unfulfilled ED02 requirement is reliable US-English detection/suggestions offline from first launch with accepted-word behavior. P75-B writer foundation/native Electron startup owns repair/qualification, with P8-Q carrying the release gate; the current owner can persist words but has not demonstrated detection. Root cause/provisioning compatibility remains unresolved in the pinned runtime. Do not force a major runtime replacement or counterfeit dictionary to close it. Minimum future completion: clean-profile offline real editor checks, deliberate correction, ordinary Undo/Save/reopen and honest unavailable state; edges: missing/corrupt dictionary and newly accepted/removed proper name across restart/another project. Owner/native automation and Gate B writing-comfort review are required. Original references: ED02, T32 and US-English-first O-02. Independently deliverable preferences/vocabulary/interchange were completed now.

UTF-8 .txt and Markdown intake uses the existing staged source/structure owner, never replaces the external source, normalizes CRLF to LF and strips an encoding BOM. Invalid UTF-8 or binary/UTF-16 input refuses before project creation. Text retains source characters; Markdown characters may display as emphasis/headings. Existing source-bound review/Apply controls remain. Export source text reuses the saved ProjectSpine snapshot and atomic export writer, includes every saved section (including unpinned ideas and whitespace-only writing), retains literal Markdown/body whitespace and adds section labels. Notes, separate Foundation/Ideas records and unapplied staged intake are explicitly outside manuscript export. No purpose-based omission has been invented.

**Reproduced and repaired:** existing manuscript CSS overrode both requested font and paragraph spacing; scoped preference variables/specificity now reach real editor layout. Initial text-content versus rendered-line test mismatch was a harness error, not source loss.

**Evidence:** catalog-b5-prefs-owners.log 68 passes/3 files; catalog-b5-b6-owners.log 101 passes/4 files (overlap, not additive); catalog-b6-interchange-initial.log 41 passes/3 files; catalog-b5-b6-native.log **3 passes,16.0s** actual application journeys (vocabulary restart/project scope, preferences/history/restart, UTF-8 intake/full source export/cancel). The export file picker was stubbed in the native journey; no native OS picker acceptance is inferred. Main/renderer types, build and app lint pass. Failed dictionary qualification logs remain separate and unresolved. Packaging workflow hash remains unchanged. Batch A/Program 7 human acceptance stays closed; no installed-release acceptance.

**B6 retained obligations:** ED10/T29 purpose-aware manuscript versus full working-page export needs O-08 explicit source-class and purpose exclusion rules under P8-E/P10-E; Pin/Note attachment is not a purpose label and cannot justify deleting text. Minimum: author-visible coverage inventory, deliberate scopes and all supported writing accounted for; edges: mixed idea/prose in one section and attached Note whose source is deleted. Verify exact included content/cancel/failure and human scope clarity. OP08 portable archive restoration and T28 named versions require versioned coverage of every adopted owner/asset, safe path validation, checksums, project/reference identity and coordinated recovery. Existing prose recovery checkpoints do not snapshot Notes/knowledge/decisions and cannot stand in for named whole-project versions. P8-E owns this O-08 contract; P10-E owns agreed format breadth and advanced version/restore integration. Minimum: independently open a validated archive/version without overwriting current work and with intact links/provenance; edges: corrupt/unsafe archive paths and cross-project identity collisions/partial restore failure. Automated every-owner round-trip/fault tests plus human restore/version choice are required. Existing Markdown and prose recovery remain available today. Original refs: ED10, OP08, T28–T30 and design-register/checklist descriptions; these obligations must remain in the requirement mapping.


### B7 retained work and truthful routes — October 26

Delivered bounded WS01/WS03/WS08/WS09/ED06/OP01/OP02 and T27 slices, with remaining conversational/background/detached obligations preserved. A real defect lost an unfinished Ideas form on tab switch (catalog-b7-retention-before.log:1 fail/4 pass). Develop now retains visited tabs through the same existing hidden-view approach as Command workspaces. Typed app-window draft maps bind Foundation questions/Ideas seeds, directions, premise answers and promotion fields to project identity **and path**. These contain unsaved forms only, never accepted guidance, canon or Memory. The existing writing owner similarly keeps a manual-concern draft through rail closure; frozen evidence remains source-checked before Save. Notebook draft retention remains B2. The UI states that unsaved forms must be saved before app close/reload; durable conversations are not implied.

History now labels stored references as recorded and checked on opening, rather than claiming original availability from a fingerprint alone. It explicitly separates past decisions/source checks from fresh analysis. Project Interchange connects the real existing staged intake/saved export actions inside the owning Writing window; the prose-free Command window routes back to Writing. Operations displays actual project/save context and explains that visiting the route grants no AI, Memory, provider or schedule authority. Contextual help explains the actual manual destinations and limitations.

Verification: catalog-b7-native-next.log **1 actual Electron pass,3.6s journey/5.4s total**: Ideas→Foundation→Ideas, tool return, concern draft rail close/reopen, duplicate project titles/paths with independent drafts and return to original questions/direction, useful Interchange/Operations routes. No accepted record was changed merely by navigation. Native initial failure targeted the hidden keyboard-only edge close control; using the visible rail-header Close repaired the harness action, not application behavior. catalog-b7-owners-final.log records the final owner/integration run; renderer types/build and app lint pass. Earlier export-notice assertions used the superseded Markdown-only caption after B6 generalized it; corrected label assertions preserve behavior.

Remaining WS03/CP04/CP05/T27/T35 conversation drafts, separate conversations and richer same-question results require the actual O-05 retained-conversation/source/privacy/forget contract (P8-0/M/R) before P9-D intake and P10-B/D integration. Existing temporary form state cannot become a governed conversation/Memory store. Minimum: reopen the same project-bound conversation/result/context with source versions and deliberate retention/forget controls, keeping author truth separate. Edges: duplicate thread names in different projects and changed/protected evidence before old-result expansion. Required: owner/project/privacy/purge/late-completion automation, native reopen/return, human context/usefulness judgment. Existing manual form/Note/question-orientation boundaries can be used now.

OP01/OP02/OP03/T26 retain P8-R coverage/source dependency contracts and P9-C/E genuine incremental reading/jobs, not a timer over source checks. Minimum: inspect declared fresh/partial/failed coverage, cancel/resume without duplicate effects, preserve author decisions and writing access. Edges: one source changes during a task; sleep/restart/unknown result does not report complete coverage or automatically repeat accepted effects. Owner/fault/native interruption checks and human trust/usefulness review required. No such job was started or admitted here. Full detached/context continuity WS01/WS04/WS05/WS08 remains P10-D with O-12 authority/focus/message/recovery contracts; current-window retention does not close a second-monitor promise. Original refs remain each named ID/T journey and the authoritative design/checklist.


### B8 and final catalog engineering checkpoint — October 26, 2026

B8 actual tiny-Pin growth (12 real input/Save stages, >35,000 words), 81-group rail/native drag, original Pin/Note/chapter links, dirty-writing secondary close/reopen and fresh-process exact-source comparison pass. Repaired native selection containing decorative glyphs and stale source-gesture suppression swallowing an unrelated pointer/keyboard action. Two suppression regressions failed before repair; 227 affected owner checks pass afterward. Earlier rail failures initially suspected to be harness-only are now explicitly qualified by the reproduced application cause; original failed logs remain. Viewport/fixture/revision/transition mistakes are recorded separately in the current register.

Final evidence: catalog-final-repaired-vitest.log **1,728 pass / 2 skip / 1 unchanged packaging-policy failure**,164 files,189.86s; catalog-final-repaired-native.log **17 supported Electron journeys pass,2.9m**. Known failed ED02 dictionary qualification/diagnostic tests were explicitly outside that supported run; detection is not accepted. Main/renderer types/build, renderer lint and scoped main/shared lint pass. The packaging workflow remains SHA256 9c4c97195ce5c6cb8fc49ef035727c2ac54b35d7c2248e11b2c782268b59cc33; policy/tests unchanged. No observed unresolved source-integrity defect is concealed.

All 69 IDs / 36 existing journeys retain explicit dispositions in outputs/BLACK_SKIES_CATALOG_RECONCILIATION_2026-10-25.md and the existing Program 7.5–10 coverage mapping. Supported manual slices are complete; real card owners, O-04/O-05/O-08, semantic AI, shared Graph/full detached work and remaining interchange/version breadth retain precise prerequisites/minima/two edges/acceptance. ED02 native repair remains P75-B/P8-Q. Return to P8-0 then established P8-A/B sequence. Batch A and P7 acceptance, five historical-cause uncertainties and original Fail executions stay closed/preserved.

Human Gate A candidate-v5 and Gate B candidate-v2 are prepared at workspace outputs/catalog-gate-a-2026-10-26 and catalog-gate-b-2026-10-26. Both frozen runtime hashes are 7171de486b95e5e20ff61d01f14023cf5ba4f7219911a38ac6bfde0256e8cf37; both launchers passed smoke, **human acceptance Pending**. Source/build/launch/evidence recovery is outputs/catalog-checkpoints/catalog-final-2026-10-26/RECOVER.md, extracted source hash-verified separately. No stage/commit/stash/reset/clean; no installed-release acceptance.

### Native source-change concern review — November 6

The approved playground interaction is adapted through the existing source/feedback owners. Optional originalEvidence stores bounded, author-shareable original excerpts. Optional dispositionHistory.sourceEvidence captures saved-source excerpts/fingerprints at an author decision; these are immutable historical evidence, separate from live source projections. Maximum two sources and4000 characters per quote, with truncation labelled. Legacy records retain their existing information without fabricated original quotes. Metadata-only/protected sources retain no excerpt.

Mark addressed uses the existing resolved lifecycle. Source edits are saved through Writing Studio's current coordinator before recording a decision; dirty or concurrently changed sources block the mutation. Main derives evidence from durable draft bodies, excluding frontmatter, rather than accepting renderer-provided text. Text Undo/Redo operates on writing history and does not erase concern decisions. Explicit reopening of resolved or intentional concerns is available from Command Center History and appends a reopened disposition to the same concern. Recurrence remains a separate existing action.

Outline marker projection can retain an identifiable edited-source marker while withholding verified prose highlighting. Whole-section source review refers to the stable saved section and is explicitly changed, not an inferred exact reattachment. Partial ambiguous/unavailable sources remain explicit in evidence review. The isolated review launcher supports BLACK_SKIES_REVIEW_CONCERN_EDIT=1 with title Black Skies · Concern Source Review; it prepares disposable cotton-edit evidence. Human steps live in the separate playground SELECTION-REVIEW.md. This is development review, not packaged-candidate acceptance.


### November 13 — concern save/recovery qualification

Mark addressed/intentional and History reopening now await the existing Writing Studio linked-state save before a lifecycle decision. Prose, rebased Pins and Note anchors must be durable together; failure leaves the concern open. The pinned ten-section native regression verifies exact saved anchors and a fresh-process restart, as well as source Undo and independent decision history. This repairs the observed stale Pin after the cotton decision.

The reported Undo-after-Addressed native renderer crash remains open: historical crashes are confirmed, while fresh November 13 pointer/accessibility/native checks pass without establishing a root cause. Do not equate those passes with crash repair or native author acceptance. After a renderer crash, renderer-only Reload does not restore split Command Center primary authority; preserve saved data and use a full process restart. The review launcher supports BLACK_SKIES_REVIEW_RESUME_PROJECT for an explicit saved path and a fresh isolated profile, skips all fixture seeding, closes DevTools and names the review window. Original review and recovery-copy paths/status are recorded in the separate playground recovery notes.

## Current portable checkpoint — November 14, 2026

This development checkpoint preserves the accumulated catalog implementation and later Writing Studio repairs before the next interaction changes. It is not an installed-release qualification or a claim that all69 behavior rows are complete. The inherited packaging workflow edit is retained unchanged and identified separately from Writing Studio work.

Author acceptance already recorded: A selection/formatting/Find-Replace/Save/Undo-Redo; scoped B grouping/merge/numbering/endpoints/naming/Split-Join functionality; the complete current C passage-Notes script; D outline-follow and concern/source/decision/History flow. Do not repeat these scripts unchanged. Broader Notebook and AI-dependent capabilities are not implied by a passage-Notes pass.

Approved next native interaction: nearby Pin/Join; named-word Split and Name unit; explicit whole-unit Extend with final extent/count and retained identity/name; one manuscript-linked Outline. Outline drag or writing Move then click destination moves the same unit with supported attached information and coherent Undo. The separate Writing/Planning order UI is superseded; legacy saved metadata and chapter decisions must remain safe. Split keeps the original custom name/identity on the first part, the other part gets opening words; Join retains/composes custom names in manuscript order, without silent truncation over240characters.

The existing WritingPage provider, useWritingPage, editor selection mapping, writingRanges, Living Outline repository and source-batch history remain owners. No new manuscript/Note store, framework, public IPC schema or AI/provider is authorized by this repair. Existing guards for stale/protected/ambiguous source, unsupported formatting/Note cuts, recovery and sequential saves remain required. Browser HTML snapshots are disposable reference evidence, never a native storage model.

Original review sequence remains A–F: C complete; finish remaining B/D edges, E rails/Focus, F Back/retained work/reopen; then only existing usable manual Command Center routes and one integrated writing workflow. No added nine-review campaign. P8 knowledge/destinations/search/retention, P9 real analysis/Companion/jobs and P10 full integration retain their existing scope and later meaningful AI-dependent review timing.

Current baseline evidence (November14, installed dependencies):1735 Vitest passes,2 skips,2 failures across164files. Failures are the inherited packaging-policy exact-SHA rule and the prior broad gradient ban conflicting with later pinned/unpinned Outline washes. Neither test was suppressed or changed for this preservation commit. Renderer types, main/renderer build and application lint pass. Four existing disposable Electron journeys pass: Notebook, writer tools/Notes/source return, arrangement/comparison, and actual prose movement with Notes/formatting/history/split-join persistence. External logs are baseline receipts, not author acceptance of the next native changes.

Open: historical native white-screen/renderer crash (not proven fixed), actual offline spelling detection, names/history/Extend integration gaps and the two baseline test failures. Native dictionary vocabulary and ordinary manual routes do not prove real analysis or offline detection. Preserve known failures and limit the next repair to the approved Writing Studio outcomes.

Source checkpoints, exact receipts and recovery archives remain local; no author manuscript, browser profile, personal reference ZIP, model credentials or temporary project is part of the source checkpoint. Next action after publication: implement the approved native interaction, extend the existing writing tests, then review only the changed outcome.

## Native Writing Studio interaction follow-up — November 14, 2026

Status: implementation and assistant verification; author acceptance of the changed native B workflow remains pending. A and the completed C Notes script remain closed. This development checkpoint does not finish the whole repair milestone or qualify an installed release.

The reviewed 87-path preservation checkpoint was explicitly approved and normally pushed as `2006a93ee4b071df4351f57199d245140d8857aa` on `codex/program7-5-stabilization` to `https://github.com/gray247/black-skies`. The named `github` remote was added; the existing local preservation `origin` was retained. No main merge, force-push, installation, provider execution or real-manuscript change occurred.

The existing native owners now provide nearby selection Pin/Join and explicit Extend; right-click or Shift+F10 opens named-word Split, Name unit and Move. Extend includes the complete original unit and previews the resulting word count, retains its identity and current displayed name, and freezes an opening-word label when needed to retain that name. Ordinary Pin remains separate. Split retains the first identity/custom name and gives the second a new identity/opening-word label. Join combines distinct custom names in manuscript order with ` / `, retains a sole custom name, and otherwise uses opening words. Overlong combined names require editing before mutation. Chronological Undo restores operation-owned names/identities while preserving a later independent rename.

There is one visible Outline in manuscript order, including unpinned writing. Legacy saved metadata ordering and chapter decisions are retained. Pinned rows and their exposed handles are draggable; activating the handle is a keyboard alternative. Local Move and Outline drag/drop use the same source-addressed preparation and apply path. Preparation returns a validated operation directly, rather than reading just-set React preview state. Marker/hint geometry does not reflow the drag source or target. A fast drop validates against the source ref rather than a pending render; drag-end cannot relabel an applied move canceled.

Existing emphasis, source, Note, stale-state, recovery and link guards remain. Moves refuse unsupported word/format/Note boundaries, protected sources, no-ops and serialization that cannot retain leading blank lines. Formatting, unit identity/names and supported Note links are relocated through the existing owners. Concern decisions and historical evidence are preserved; movement does not constitute fresh semantic analysis. No public IPC, persisted schema, storage owner or framework was added.

An immediate Move → Undo → Save can restore exact durable prose in a former source section without needing another prose write. The linked save now flushes the existing save/recovery owner for every operation-touched source, including restored durable prose, so a delayed recovery checkpoint cannot re-mark that section unsaved. Touched-source state is session-local and cleared on a successful save or project change. The native journey covers the previously failing sequence and requires all dirty receipts cleared before reopening.

Evidence uses installed dependencies and existing test systems. Final full offline suite: 1,745 passed, two skipped, one failure (1,748 total; 163 of 164 files passed). The remaining failure is the inherited packaging exact-source-SHA policy. The old broad gradient guard is repaired by explicitly allowing only the two approved Outline membership washes; the flat shell/canvas restriction remains. Renderer types, build and lint passed during integration; final receipts are retained locally. Relevant native journeys cover direct movement, actual foregrounded OS drag, source beginning/end, exact formatting/Note identity and links, chronological history, immediate Undo/Save, fresh-process project reopening, 640px/Focus access and cross-section selection. The source/target must both be visible for the pointer automation: its earlier target scroll caused it to pick up a different row; event receipts expose that failure rather than treating it as an application pass.

Existing manual-route journeys were reviewed within their current usable scope: manual sentence alternatives and partial acceptance/History through restart, Foundation/Ideas copies, preferences/goals, text intake/export cancellation, retained forms and local Companion help. One sentence History assertion needed the intended heading selector because a retained form showed the same text. A concern History reopen check failed once and passed unchanged on follow-up; no stability fix is inferred from that retry. This is assistant functional evidence, not author usefulness acceptance or missing AI-system evaluation.

Open: historical renderer/white-screen crash, actual offline US-English spelling qualification, inherited packaging policy, remaining changed B author review, any genuinely unaccepted D visibility edge, E rail/Focus/Companion comfort, F unfinished-work/Back/reading-position/save/reopen/recovery comfort, scoped usable manual-route author review and one integrated writing check. No added nine-batch campaign or fixed session count. P8 foundations, P9 grounded intelligence and P10 full integration retain their existing scope and acceptance timing; AI-dependent usefulness is reviewed after those systems exist. Installed-product qualification stays separate.

## Author acceptance and packaging-check correction — November 14, 2026

The author reports all four changed native Batch B checks passed against the development application based on `dcf6589b6e3ebf4fbd6c7982f70b98a04a5b5ec7`: named-word Split/Join and retained names; ten-word whole-unit Extend and Undo; direct Outline drag/Undo; local Move, Escape, Undo, Save and reopen. B is closed for this agreed interaction. A/C remain closed. The exact accepted disposable sample is preserved in a verified local recovery copy; its 52 words, one five-word Mother knows unit, identity and original order are retained. Reuse B4 as the accepted saved-manuscript reopen slice of F; do not ask the author to repeat it unchanged.

No additional authorization is needed for the scoped repair work or reviewed development commits/pushes already authorized. The earlier exact-publication approval was received and completed. Main/release/installation/provider execution remain outside this repair scope.

The reported packaging failure was a false positive in `scripts/stage19-packaging-workflow-policy.mjs`. The manual workflow checks out `inputs.qualification_ref`, derives its actual HEAD using `git rev-parse HEAD`, exports it as `steps.validate_source.outputs.sha` and uses that SHA in the qualified installer artifact name. The checker only recognized `${{ github.sha }}`, which identifies the workflow launch commit and can differ from the deliberately selected source. The checker now also recognizes the existing verified checkout/export chain, only before the upload and without a subsequent checkout. Four negative cases cover a missing validation step, an unverified SHA, an unbound output and another checkout after validation. Focused policy tests: 12 passed; the unchanged writing suite plus policy checks: 73 passed. No workflow, package job, installer, release, installed application or provider was changed or executed. One broader-run writing test hit its existing five-second timeout and passed unchanged on focused rerun; retain that receipt rather than claiming a product repair. The final full offline confirmation passed all 164 test files: 1,750 tests passed and two skipped; app lint and the standalone packaging-policy check also passed. No timeouts or assertions were weakened.

Next remains the original D/E/F sequence. A single explicitly labeled manual example concern was added through the current capture owner only to the disposable review sample, for the genuinely unaccepted highlight edge. Prose and writing-group metadata remain exactly equal to the accepted B backup; no concern resolution/history workflow is being replayed. Assistant desktop checks passed for independent manuscript washes, independent Story/Review locks and dismissal, Focus restoration, retained unsent local Companion text, and Back to the exact selected words. All highlight switches are restored on; Story is locked; Focus is off. Author comfort acceptance is still pending. Existing manual-route and recovery scope, the integrated writing check and P8–P10 boundaries are retained. Renderer crash and actual offline spelling remain open.
