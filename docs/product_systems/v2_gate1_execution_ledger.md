# V2 Human Gate 1 Execution Ledger

Status: active implementation evidence ledger  
Started from: `8fff84434ef138444df45be424cac386ddf5589e`  
Human validation: deferred until the complete Critique Workbench and Living
Outline workflow is ready  
Git control: the author alone stages, commits, and pushes

## Governing Outcome

Prepare one combined V2 human review in which the author can:

1. run the selected-prose Critique Workbench workflow and optionally save an
   advisory Feedback Note without changing manuscript or structural truth;
2. use the Writing Surface and Living Outline as one optional bidirectional
   workflow without requiring outline-first or scene-first writing;
3. verify project isolation, reopen durability, honest failure behavior, Focus
   mode, build, regression, and packaging-safe boundaries.

## Non-Negotiable Boundaries

- The manuscript and author-approved truth remain sovereign.
- Outline planning state is not manuscript truth and creates no new truth owner.
- Planning movement can be durable while accepted-manuscript movement remains a
  preview only in this slice.
- Critique, Feedback Notes, inferred structure, and proposed structure never
  alter prose automatically.
- Provider calls stay disabled in automated tests; deterministic fixtures prove
  the workflow.
- No second provider, routing, background jobs, automatic prose rewriting,
  durable AI memory, paid-operation expansion, connector admission, or unrelated
  cleanup is in scope.

## Requirement Evidence Matrix

| Requirement | Current evidence | Status |
| --- | --- | --- |
| Critique exact preview and explicit approval | Targeted suite and two built Electron journeys green | Automation passed |
| Critique completed, failed, cancelled, expired, stale, and dismissed states | Renderer state evidence green | Automation passed |
| Copy and advisory-note success/failure | Renderer failures plus built save/reopen journey green | Automation passed |
| Critique cannot change prose or structural files | Boundary tests and byte-for-byte built-workflow assertions green | Automation passed |
| Optional lightweight Living Outline material | Project-local v1 sidecar, repository, IPC, and contextual pane implemented | Automation passed |
| Outline-to-writing and writing-to-outline location/highlight | Component and built reopen navigation evidence green | Automation passed |
| Outline-first and prose-first paths | Outline-first and linked prose-first evidence green | Automation passed |
| Planning fragments, gaps, and empty nodes stay quiet | Explicit kinds and quiet empty/gap behavior tested | Automation passed |
| Authored, planned, inferred, and proposed state stays distinct | Persisted state union and visible labels tested | Automation passed |
| Structural movement preview cannot reorder accepted prose | Planning move leaves manifest and drafts byte-for-byte unchanged | Automation passed |
| Project isolation and reopen durability | Built Electron create/save/relaunch/reopen/second-project journey green | Automation passed |
| Focus mode hides support panes immediately | Component and built Electron evidence green with editor content preserved | Automation passed |
| Full type, lint, build, component, Electron, regression, and packaging-safe checks | Full ladder and unpacked-package verification green | Automation passed |
| Combined evidence receipt and 20-minute human checklist | `v2_human_gate_1_evidence_receipt.md` | Ready |

## Checkpoint Log

### Checkpoint 0 - Clean-State And Authority Audit

- Worktree confirmed clean at the starting commit.
- Current post-V1 program, roadmap, truth index, and the six structural dossiers
  were inspected before implementation.
- Critique Workbench batches 1-3 are present in commits `9a9c5fed`, `dc6b3a01`,
  and `c9c45dac`.
- The current `OutlineSchema v1` `scenes` collection is also the durable
  manuscript-unit manifest. It cannot represent planning-only fragments or gaps
  without manufacturing manuscript drafts.
- The bounded implementation direction is therefore an optional project-local
  Living Outline planning artifact owned by the existing Outline system. It
  references manuscript-unit identities but does not replace `outline.json`,
  manuscript drafts, or narrative truth.

Checks passed:

- `git status --short` returned clean before this ledger was created.
- Starting revision matched the author-pushed Human Gate consolidation commit.

Known failures: none yet; automated qualification has not started.

Next action: run the targeted Critique Workbench evidence suite, identify real
coverage gaps, repair them, and update this ledger with reproducible commands.

### Checkpoint 1 - Critique Requalification And Coverage Repair

- The existing Critique Workbench implementation was requalified before the
  Living Outline implementation was allowed to depend on the same Writing
  Studio surface.
- Renderer evidence now explicitly exercises failed, cancelled, expired,
  dismissed, copy-failure, note-write-failure, stale-result, and Focus-mode
  behavior in addition to the existing exact-preview and explicit-approval path.
- No provider call is used by these tests; all critique outcomes are deterministic
  fixtures.

Checks passed:

- `node scripts/run-vitest-offline.mjs --maxWorkers=1 renderer/__tests__/Stage19WritingSpineApp.test.tsx main/__tests__/feedbackNotesRepository.test.ts main/__tests__/feedbackNotesIpc.test.ts main/__tests__/aiCritiqueCoordinator.test.ts main/__tests__/aiCritiqueGateway.test.ts main/__tests__/aiCritiqueIpc.test.ts main/__tests__/aiCritiqueQualification.test.ts main/__tests__/aiCritiqueQualificationArtifacts.test.ts`
  - 8 files passed; 373 tests passed; 2 tests skipped by their existing policy.

Known failures repaired during this checkpoint:

- The first direct package-script spelling was invalid; the repository-owned
  offline Vitest runner above is the reproducible command.

### Checkpoint 2 - Living Outline Contract, Persistence, IPC, And First UI

- Added an optional `living-outline.json` project-local planning artifact.
- Missing data opens as a quiet empty outline. Malformed or wrong-project data
  is reported as degraded and is never overwritten; manuscript editing remains
  available.
- Atomic writes, monotonic revisions, stale-write rejection, and per-project
  mutation serialization prevent silent lost planning changes.
- The role-scoped bridge is exposed only to Writing Studio and binds every
  operation to the active project path, identity, and generation.
- The contextual pane creates fragments, gaps, and planning areas; preserves the
  authored/planned/inferred/proposed distinction; links either before or after
  writing exists; locates linked writing in either direction; and previews linked
  order without invoking accepted-manuscript reorder.
- One-click Focus mode hides binder, Living Outline, critique controls, and an
  open Critique Workbench while preserving editor state and restoring panes on
  exit.

Checks passed so far:

- `node scripts/run-vitest-offline.mjs --maxWorkers=1 main/__tests__/livingOutlineRepository.test.ts main/__tests__/livingOutlineIpc.test.ts`
  - 2 files passed; 9 tests passed before the concurrency case was added.
- `node scripts/run-vitest-offline.mjs --maxWorkers=1 main/__tests__/stage19PreloadChannels.test.ts main/__tests__/splitCommandPreload.test.ts`
  - 2 files passed; 10 tests passed.
- `node scripts/run-vitest-offline.mjs --maxWorkers=1 renderer/__tests__/Stage19WritingSpineApp.test.tsx -t "locates linked writing"`
  - targeted bidirectional test passed.
- `node scripts/run-vitest-offline.mjs --maxWorkers=1 renderer/__tests__/Stage19WritingSpineApp.test.tsx -t "keeps completed critique failures"`
  - targeted failure/Focus test passed.

### Checkpoint 3 - Combined Workflow And Reopen Evidence

- Feedback Notes now have a writing-role-only list/read path so an author can
  find a deliberately saved advisory note after reopening a project. Missing or
  malformed feedback data remains non-gating for manuscript work.
- The built Electron Gate 1 journey creates and saves two manuscript units,
  creates two linked planning items, changes planning order, and proves the
  manuscript manifest and draft files remain byte-for-byte unchanged.
- The same journey enters and exits Focus mode, executes a deterministic
  critique with no provider request or charge, saves one concise advisory note,
  restarts the app, reopens the project, locates prose from the Living Outline,
  finds the saved note, and proves a second project receives none of the first
  project's planning or advisory data.

Checks passed:

- `node scripts/run-vitest-offline.mjs --maxWorkers=1 renderer/__tests__/Stage19WritingSpineApp.test.tsx main/__tests__/feedbackNotesRepository.test.ts main/__tests__/feedbackNotesIpc.test.ts main/__tests__/livingOutlineRepository.test.ts main/__tests__/livingOutlineIpc.test.ts main/__tests__/stage19PreloadChannels.test.ts main/__tests__/splitCommandPreload.test.ts`
  - 7 files passed; 102 tests passed.
- `pnpm --dir app exec playwright test tests/e2e/stage19-gate1-workflows.spec.ts --project=electron --workers=1 --reporter=list --trace=retain-on-failure`
  - 1 built Electron workflow passed.

Known failures repaired during this checkpoint:

- The first built-workflow assertion used a text-input matcher against the
  CodeMirror editing surface. It now checks the rendered editor text.
- The first clearance-checkbox locator described an older fixture label. It now
  locates the exact current protected-content confirmation by accessible name.
- The first reopened-note component check exposed that the note-open control was
  nested behind AI availability. The saved-note control is now independent of
  provider availability, preserving the separation between durable author notes
  and optional provider execution.

Next action: run type, lint, production build, the existing critique Electron
journey, full Stage 19 regression, and packaging-safe qualification before
writing the combined evidence receipt and 20-minute checklist.

### Checkpoint 4 - Full Regression And Packaging-Safe Qualification

- TypeScript, both lint boundaries, and the production renderer/main build pass.
- The original Critique Workbench Electron journey passes independently of the
  combined Gate 1 workflow.
- The complete Stage 19 regression passes, including all existing recovery,
  project-spine, Command Center integrity, accessibility, performance, critique,
  and new Gate 1 workflows.
- The first full regression exposed one stale performance-test selector after
  the binder gained its truthful Living Outline name. The product behavior was
  healthy; the test was updated to use the new accessible region name. Its
  isolated rerun and the repeated full regression both pass.
- Packaging preflight and unpacked Windows package inspection pass. The package
  contains every required runtime path and zero forbidden paths. It remains
  intentionally unsigned under the existing internal-RC policy.

Checks passed:

- `pnpm run typecheck:all`
- `pnpm run stage19:lint`
- `pnpm --dir app run lint`
- `pnpm --dir app run build:production`
- `pnpm --dir app run package:verify:preflight`
- `pnpm --dir app exec playwright test tests/e2e/stage19-ai-critique.spec.ts --project=electron --workers=1 --reporter=list --trace=retain-on-failure`
  - 1 Critique Workbench Electron journey passed.
- `pnpm --dir app exec playwright test tests/e2e/stage19-performance.spec.ts --project=electron --workers=1 --reporter=list --trace=retain-on-failure`
  - 1 performance journey passed; 100 units created in about 1.8 seconds and
    final-unit selection completed in about 57 milliseconds in the isolated run.
- `node scripts/stage19-regression.mjs --allow-dirty`
  - 36 files passed; 615 tests passed; 2 tests retained their existing policy
    skip; all 22 Electron journeys passed; `STAGE19_REGRESSION_PASS`.
- `pnpm --dir app run package:dir`
  - unpacked Windows x64 package verified; zero forbidden paths; executable SHA-256
    `a6f3d23047e7edd79f56a7dc08ba1764cebda1200d3a3071f5cbe854b5eb3df9`;
    app.asar SHA-256
    `1e2157a4b47b7cb5cda7445b49dbcbadccd2c35c009ad8011c19fb9a9412bf64`.

Automation status: passed. Human acceptance status: not yet performed.

Next action: use `v2_human_gate_1_evidence_receipt.md` for the single combined
20-minute author review. A failure creates one bounded repair batch, followed by
automation and one complete-workflow retest rather than tiny manual checks.
