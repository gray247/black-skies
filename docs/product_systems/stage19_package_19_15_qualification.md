# Stage 19 Package 19.15 Markdown Export Qualification

Date: 2026-07-26

Task: `BS-19.15-05 — Qualify Markdown Export`

Status: `AUTOMATED_QUALIFICATION_PASS_HANDS_ON_ACCEPTED_CLOSURE_PENDING`

## 1. Authority and boundary

This record qualifies the bounded Markdown export defined by
`stage19_package_19_15_markdown_export_contract.md`.

It does not record Jason's hands-on acceptance, perform
`BS-19.15-06 — Close Package 19.15`, begin Package 19.16, qualify an
installer, or promote the legacy renderer or Python export paths.

No provider request, credential, internet access, Python export service, or
paid operation was used.

## 2. Qualified implementation commits

| Commit | Task | Qualified boundary |
| --- | --- | --- |
| `bfb05fd` | BS-19.15-03 | Main-owned dialog, deterministic byte construction, exact binding, replacement confirmation, atomic destination write, typed evidence, and Writing-only bridge exposure. |
| `138933f` | BS-19.15-04 | Writing Studio control, local clean-state gate and exact remedy, neutral cancellation, original-project attribution, success path/byte/unit reporting, and Command Center exclusion. |
| `6d283e4` | BS-19.15-05 | Expanded exact-byte, fingerprint, preload, stale-binding, immutable-snapshot, sync-failure, replacement-failure, and cleanup qualification coverage. |

## 3. Accepted automated evidence

### 3.1 Focused Package 19.15 and Project Spine matrix

The accepted aggregate covered:

- `main/__tests__/projectSpineMarkdownExport.test.ts`;
- `main/__tests__/projectSessionCoordinator.test.ts`;
- `main/__tests__/projectSpineIpc.test.ts`;
- `main/__tests__/splitCommandPreload.test.ts`;
- `main/__tests__/splitCommandSecondaryLaunchHook.test.ts`;
- `main/__tests__/projectLoaderDraftSave.test.ts`;
- `main/__tests__/projectSpineRecoveryCheckpoints.test.ts`;
- `main/__tests__/projectSpineRecoveryRepository.test.ts`; and
- `renderer/__tests__/Stage19WritingSpineApp.test.tsx`.

Accepted result:

```text
Test Files  9 passed (9)
Tests       174 passed (174)
```

This matrix includes exact whole-file assertions rather than substring-only
format qualification.

### 3.2 Build evidence

All three accepted build commands passed:

```text
pnpm --filter app run build:main
pnpm --filter app run build:renderer
pnpm --filter app run build:production
```

The main build includes the authoritative TypeScript compilation. The
renderer and production builds generated the current Stage 19 application
entries. These are build checks, not installer or clean-install acceptance.

### 3.3 Existing Stage 19 Electron regression evidence

The current Project Spine, recovery, and Command Center Electron suites ran
together with one worker:

```text
tests/e2e/stage19-project-spine.spec.ts
tests/e2e/stage19-recovery.spec.ts
tests/e2e/stage19-command-center-integrity.spec.ts

14 passed
electron_process_count=0
```

The native Save dialog itself remains a hands-on acceptance obligation.

## 4. Contract coverage disposition

| Contract area | Accepted evidence |
| --- | --- |
| Exact deterministic bytes | Exact output, repeat identity, UTF-8/no BOM, LF-only, one final LF, and exact SHA-256 assertions. |
| Titles and bodies | Project/unit normalization and escaping, tabs/newlines, Unicode, duplicate and blank titles, intentional body Markdown, empty and whitespace-only bodies, and front-matter removal. |
| Membership and order | Zero-unit and multi-unit manuscripts, authoritative order, all-unit inclusion, ordered unit identity evidence, and exact unit count. |
| Filename and destination | Invalid characters, reserved/empty fallback, Unicode, 120-code-point limit, trailing dot/space handling, exactly one `.md`, edited-name validation, and a destination outside the project. |
| Cancellation and replacement | Neutral dialog cancellation, neutral declined replacement, explicit accepted replacement, safe default, and preservation of an existing destination on failure. |
| Clean-state gate | Dirty, saving, save-failed, decision-required, degraded, and accepted-pending-save rejection with the exact governed remedy. |
| Binding and races | Project ID, canonical path, generation, revision, and operation validation; dialog-time revision change rejection; no retarget; immutable Project A completion after Project B becomes active. |
| Authority | Main-only filesystem path, Writing-Studio-only IPC/preload/UI exposure, and typed Command Center rejection. |
| Failure containment | Exclusive temporary creation, sync failure, unconfirmed destination race, rename/replacement failure, temporary cleanup, and no false success. |
| Evidence and non-mutation | Exact byte count, unit count, SHA-256, fingerprint, project/generation/revision/unit/operation/time evidence, plus unchanged dirty, Save, recovery, generation, revision, and manuscript truth. |
| Exclusions | Production construction consumes only the main-owned durable project title, ordered unit metadata, and durable drafts. Tests prove front matter and internal IDs do not enter Markdown; legacy export, AI, credentials, recovery, history, diagnostics, and other-project state are not reachable inputs. |

## 5. Defects found and corrected during qualification

1. **Unconfirmed destination race:** the no-replacement path now uses exclusive
   destination creation semantics, so a file that appears after selection is
   preserved rather than overwritten.
2. **Missing immutable-snapshot witness:** an injected file-write seam now
   proves that a validated Project A snapshot finishes as Project A after the
   active UI session switches to Project B.
3. **Incomplete failure-stage evidence:** sync and confirmed-replacement
   failure tests now prove existing-destination preservation and temporary-file
   cleanup.
4. **Incomplete preload witness:** permanent preload tests now prove the export
   method is present in Writing Studio and absent from Command Center.

No defect requiring Package 19.15 to stop or expand was found.

## 6. Out-of-scope observations retained for future work

These observations predate or exceed the bounded Markdown export path. They do
not block Package 19.15, but they must not be hidden:

### `BS-DEFERRED-APP-LINT-01`

The repository-wide app lint command reports 3 errors and 9 warnings in legacy
renderer surfaces. The errors are an unused helper and noninteractive
`tabIndex` in `app/renderer/App.tsx`, plus an unused React import in
`ProjectHomeDivergenceVisibilityWitness.test.tsx`. The warnings are existing
React-hook dependency/cleanup findings in legacy App, Project Home, and the
pre-existing recovery portions of `Stage19WritingSpineApp.tsx`.

Future work should repair and rebaseline the app lint gate as a separately
authorized repository-hygiene batch. Package 19.15 introduced no new targeted
lint error.

### `BS-DEFERRED-RENDERER-TYPECHECK-01`

The broad historical `app/tsconfig.json` no-emit diagnostic reports widespread
pre-existing type debt across legacy services, analytics, layout, tests, and
renderer components. The authoritative main build, current renderer build,
production build, and Package 19.15 tests pass.

Future work should define and repair a truthful renderer typecheck gate without
folding that repository-wide migration into Package 19.15.

### `BS-DEFERRED-VITEST-LISTENER-01`

The nine-file aggregate passed but emitted `MaxListenersExceededWarning` for
process-level Vitest listeners. No test failed and the Electron integration run
left zero Electron processes.

Future test-harness work should audit listener registration/cleanup or suite
isolation so larger aggregates remain warning-free.

### `BS-DEFERRED-WRITING-EDITOR-UNDO-01`

Jason's 2026-07-26 hands-on Package 19.15 pass found that `Ctrl+Z` does not
undo manuscript edits. Inspection confirmed that `DraftEditor.tsx` configures
CodeMirror language, wrapping, theme, placeholder, and change listeners but
does not install a history extension or undo keymap.

This is existing Writing Studio editor capability debt rather than Markdown
export authority. Future editor work should add and qualify undo/redo without
weakening dirty-state, recovery-checkpoint, Save, or AI-request invalidation
truth.

### `BS-DEFERRED-WRITING-EDITOR-FRAMING-01`

The same hands-on pass found that replacing visibly identical prose from a
copy/paste remained dirty. The durable body retained an invisible terminal
newline while the supplied visible example did not, so exact buffer comparison
correctly classified the bytes as different. A normal Save established a new
durable clean baseline and export then proceeded correctly.

Future Writing Studio usability work should make terminal framing behavior
unsurprising or recoverable without silently normalizing authored body content.
This observation does not authorize an export-time rewrite.

## 7. Hands-on acceptance checklist

Receipt owner: Jason

Receipt status: accepted by Jason on 2026-07-26

### 7.1 Hands-on observations recorded 2026-07-26

Jason reported successful results for:

- the clean-state export control;
- reserved `CON` fallback to `manuscript.md`;
- neutral native-dialog cancellation;
- destination outside the project;
- four-unit authoritative order and exact visible Markdown content;
- duplicate, blank, empty, whitespace-only, punctuation, link, and Unicode
  cases;
- absence of front matter and excluded operational content;
- dirty-state export blocking;
- successful Save followed by export eligibility;
- repeat-export byte identity;
- declined replacement preserving the original destination; and
- accepted replacement matching the qualified export.
- a user-edited Unicode filename; and
- normalization of `Night 星.md.md` to exactly `Night 星.md`.

On Windows, the native Save dialog displayed its own overwrite warning first.
After Jason confirmed that native warning, Black Skies displayed its separate
Replace/Cancel confirmation. Declining the Black Skies confirmation preserved
the destination; accepting it completed replacement. This ordering is
consistent with the contract's requirement that replacement never occur
without explicit confirmation.

The undo and terminal-framing observations are retained above as
`BS-DEFERRED-WRITING-EDITOR-UNDO-01` and
`BS-DEFERRED-WRITING-EDITOR-FRAMING-01`. They do not invalidate the successful
dirty-state gate or the later clean durable export.

Use a disposable project named `CON` so the reserved-name fallback can be
observed. Create and save these units in this order:

1. `Opening # [α]` with recognizable Unicode and intentional Markdown prose,
   such as `Saved A — Café 🌌 **bold**`.
2. `Duplicate *Title*` with a Markdown link in its body.
3. another `Duplicate *Title*` with a whitespace-only body.
4. a blank title with an empty body.

Then verify:

1. `Export Markdown…` is enabled only after every unit is successfully saved.
2. Editing any unit disables export and shows exactly
   `Save the project successfully before exporting.`
3. Cancelling the native dialog creates no file and reports a neutral
   cancellation.
4. The suggested reserved-name fallback is `manuscript.md`; an edited safe
   Unicode filename is accepted and ends in exactly one `.md`.
5. A destination outside the project folder is accepted.
6. Declining replacement preserves the existing file; accepting replacement
   changes only that selected file.
7. The exported file opens as ordinary Markdown and contains one project
   heading followed by all four units in order, including both duplicate
   headings, the blank-title `Untitled` heading, and both empty bodies.
8. Title punctuation is escaped only in headings; body Markdown and Unicode
   remain faithful; draft front matter, project/unit IDs, paths, AI, credential,
   recovery, and operational data are absent.
9. Exporting the unchanged project twice produces byte-identical files.
10. After a successful export, the UI reports the destination path, byte
    length, and four exported units, while the project remains clean and
    unchanged.

Saving/failure and recovery-blocked races that are impractical to stage
manually are covered by the permanent automated matrix. No API key or remote
service is needed.

## 8. Current disposition

```text
BS-19.15-03_COMPLETE
BS-19.15-04_COMPLETE
BS-19.15-05_AUTOMATED_QUALIFICATION_PASS
JASON_HANDS_ON_ACCEPTANCE_PASS
BS-19.15-06_AUTHORIZED
PACKAGE_19_16_BLOCKED_UNTIL_19_15_CLOSURE
```
