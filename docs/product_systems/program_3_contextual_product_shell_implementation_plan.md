# Program 3 Contextual Product Shell Implementation Plan

## 1. Status And Authority

- Status: `APPROVED; BOUNDED PROGRAM 3 RUNTIME AUTHORIZED`
- Prepared: `2026-08-10`
- Author approval and runtime authorization: `JASON APPROVED ON 2026-08-10`
- Planning model: `GPT-5.6 Sol`
- Planning reasoning effort: `high`
- Implementation model: `GPT-5.6 Sol`
- Implementation reasoning effort: `xhigh`
- Exact committed planning baseline: `1698a44604e8fab6c47948a5128e911bf8d9916b`
- Branch: `codex/foundation-audit`
- Current mutation authority: `PROGRAM 3 ONLY, WITH THIS PLAN'S INCLUDED SCOPE, EXCLUSIONS, BATCH GATES, TRUTH BOUNDARIES, AND HUMAN GATE 2 BOUNDARY IN FORCE`
- Runtime implementation: `P3-A DURABLE AT 4007e12a; P3-B DURABLE AT 2ff0361c; P3-C DURABLE AT 3de76ee1; P3-D DURABLE AT fb232066; P3-E DURABLE AT fec27147; P3-F GREEN AND AWAITING AUTHOR GIT CHECKPOINT`
- Git authority: `Jason alone stages, commits, and pushes under current repository governance`

This plan is the complete handoff from Control Point 1 into Program 3. It is
bounded by:

- [Author Experience Direction Lock](author_experience_direction_lock.md);
- [Control Point 1 Architecture And Maintainability Audit](control_point_1_architecture_maintainability_audit.md);
- [Control Point 1 Test-Strength Audit](control_point_1_test_strength_audit.md);
- [Control Point 1 Visual Design Foundation](control_point_1_visual_design_foundation.md);
- [Current Open Work Register](current_open_work_register.md); and
- [Post-V1 Execution Control And Handoff Plan](post_v1_execution_control_and_handoff_plan.md).

No implementation thread may widen this plan from a contextual shell into the
broader forty-five-dossier product.

## 2. Program Outcome

Program 3 produces one coherent contextual shell around the already-proven V1
foundation:

- a true-black, manuscript-first Writing Studio;
- a plain Living Outline that feels connected to the manuscript;
- thin, accessible, progressively disclosed edge controls;
- complete single-screen movement between Writing Studio and Command Center;
- optional second-monitor placement of those same logical surfaces;
- Focus mode that removes support without replacing the editor;
- a task-focused Command Center rather than a dashboard-card grid;
- rich Critique Review presentation in Command Center with a source return
  path; and
- restrained, professional, accessible presentation states.

Program 3 ends with automated qualification and a clean handoff to Program 4.
It does not request human visual validation on its own. Human Gate 2 occurs only
after Program 4 adds the minimal Companion and owner-routing workflow.

## 3. Foundation That Must Not Be Rebuilt

The following remain existing owners and are consumed rather than replaced:

- `ProjectSessionCoordinator` for active project, generation, revision, dirty,
  save, recovery, and structural tokens;
- Project Spine persistence and role-scoped IPC;
- manuscript unit and draft persistence;
- recovery and Markdown export;
- critique prepare, approve, execute, cancel, expire, invalidate, and
  selection-fingerprint lifecycle;
- Living Outline project-local sidecar and revision ownership;
- Feedback Notes project-local advisory sidecar;
- dedicated Stage 19 preload least-authority posture; and
- deterministic Stage 19 regression and installed V1 evidence.

Program 3 may place a new view over these owners. It may not create competing
project, manuscript, outline, critique, note, save, recovery, or truth state.

## 4. Scope

### 4.1 Included

- bounded controller/view separation needed by the new shell;
- logical-surface host independent of physical window placement;
- one-screen surface switching and optional secondary-window placement;
- approved visual tokens, typography roles, spacing, shape, motion, and states;
- Writing Studio central canvas and edge-rail shell;
- Focus mode integration;
- Living Outline ordinary direct interactions and advanced disclosure;
- Command Center workspace switcher and one-task canvas;
- sanitized Review projection for completed critique and bounded failure states;
- copy, owner-routed advisory-note save, dismiss, and return-to-source actions;
- Feedback Note write serialization before a second create caller is enabled;
- responsive, keyboard, large-font, reduced-motion, degraded, and offline
  behavior for the changed shell;
- truthful development, test, build, and package bridge/type boundaries;
- truthful supported-core coverage receipt scope; and
- topology-specific performance protocol preparation.

### 4.2 Excluded

- long-manuscript paste/import qualification or automatic chapter discovery;
- Emotion Graph, relationship maps, timelines, project-health scores, gauges,
  or decorative analytics;
- broad story-intelligence signals or maturity controls;
- full Companion request routing or conversation UI;
- rewrite, generation, structural apply, or manuscript-reorder execution;
- second provider, automatic model routing, background jobs, or durable memory;
- paid or outbound behavior beyond the already-bounded critique path;
- broad legacy App, preload, docking, Mosaic, project-loader, service, or
  stylesheet cleanup;
- schema migration unrelated to an exact Program 3 need;
- repository archive/delete work;
- new UI or state-management frameworks; and
- public-release or general multi-user product work.

## 5. Target Architecture

### 5.1 One stateful owner-facing controller

Extract the current Stage 19 renderer orchestration behind one explicit
controller boundary. It owns renderer-local buffers, active view selection,
request state, and calls to the existing bridges. It does not replace main
process or persistence ownership.

Views receive explicit state and actions. They do not call unrelated bridges,
read hidden global state, duplicate project validation, or persist product
truth themselves.

The exact implementation may be a bounded hook plus controller module or an
equivalent small composition. Introducing Redux, a general event bus, a plugin
host, or a new framework is out of scope.

### 5.2 Logical surface host

The host separates:

- `logical surface`: Writing Studio or Command Center;
- `physical placement`: current window, secondary window, or restored active
  display; and
- `workspace`: the currently open non-owning view within a logical surface.

The host must preserve one active project generation and must not duplicate
manuscript or durable workflow state when a surface is moved, closed, restored,
or shown on a second monitor.

Single-screen baseline:

- Writing Studio opens first;
- opening Command Center replaces the central work canvas;
- a persistent return action restores the prior writing anchor and focus;
- support loading or failure does not unmount or discard the live writing
  controller; and
- switching surfaces is navigation, not project or truth mutation.

Optional-secondary enhancement:

- the same Command projection may be hosted in the existing secondary window;
- losing that window returns Command access to the primary window;
- reopening it does not create a second result, project, note, or selection;
  and
- either physical monitor may host either logical surface as later placement
  support permits.

### 5.3 View boundaries

Starting view boundaries are:

- `WritingStudioShell`;
- `ManuscriptCanvas` using the current editor owner;
- `EdgeRail` and bounded edge-family definitions;
- `LivingOutlinePanel`;
- `CommandCenterShell`;
- `CommandWorkspaceSwitcher`;
- `ReviewWorkspace`;
- `SurfaceReturnAction`; and
- shared presentation-state and visual-token modules.

Names may change during implementation if responsibility remains equivalent.
Files should be split by responsibility, not by arbitrary line-count targets.

## 6. Required Contract Decisions

### 6.1 Surface host contract

The implementation must define a small versioned internal contract equivalent
to:

```text
LogicalSurface = writing | command

SurfaceContextV1
  projectId
  generation
  logicalSurface
  workspace
  sourceReturnAnchor?
  physicalPlacement
  focusReturnTarget?
```

`sourceReturnAnchor` and `focusReturnTarget` are navigation context. They are
not durable manuscript identity or project truth. Physical placement belongs
to application preference or session state, not `project.json`, manuscript,
or outline truth.

### 6.2 Sanitized Review projection

The Command Center Review workspace receives a versioned projection equivalent
to:

```text
CritiqueReviewProjectionV1
  schemaVersion
  projectId
  generation
  requestId
  unitId
  selectionFingerprint
  sourceLabel
  selectedCharacterCount
  lifecycleState
  advisoryLabel
  providerDisclosure
  modelDisclosure
  privacyAndCostDisclosure
  resultText?
  limitationText
  failureClass?
  completedAt?
  allowedActions
```

The projection must not contain:

- credentials or credential-derived values;
- raw hidden context;
- unrelated manuscript buffers;
- a generic Writing mutation bridge;
- provider request internals not approved for visible disclosure;
- durable memory; or
- authority to accept text into the manuscript.

The existing Writing-side outbound preview remains the authority for exact
payload approval. Command Center receives only what the completed Review task
needs.

### 6.3 Review action contract

Allowed first-slice actions are:

- copy visible result text;
- request Feedback Notes to create one author-selected advisory note;
- dismiss the current presentation; and
- return to the exact source context when still current.

Command Center does not receive the general manuscript, outline, or Feedback
Notes mutation bridge. Note creation uses a narrow owner-routed action bound to
the active project, generation, request, unit, selection fingerprint, visible
result, and selected note body.

### 6.4 Feedback Note concurrency contract

Before the Command surface can save a note:

- create operations are serialized per project or use an equivalent proven
  no-lost-update mechanism;
- two accepted concurrent creates cannot overwrite one another;
- stale, wrong-project, wrong-generation, missing-result, and failed-write
  cases fail honestly;
- malformed or missing note data remains non-gating for manuscript work; and
- no new note path gains prose or outline mutation authority.

### 6.5 Presentation-state vocabulary

Domain owners keep their specific error and lifecycle types. The shell maps
them into visible presentation roles:

- loading;
- available;
- advisory or proposed;
- stale;
- unavailable or degraded;
- failed with a truthful remedy;
- disabled with a visible reason; and
- offline where remote capability is optional.

This is a presentation vocabulary, not a universal global state machine.

## 7. Automated Batch Sequence

Each batch is independently reviewable, automatically qualified at its changed
boundary, and manually committed/pushed by Jason under current governance.
Failures are repaired inside the same batch. No hands-on product review occurs
between these batches.

### Batch P3-A - Contracts, evidence truth, and concurrency prerequisite

Purpose:

- define the surface-host, Review-projection, return-anchor, and owner-routed
  action contracts;
- correct the supported-core receipt so its Python percentage has a truthful
  denominator or add a separately truthful TypeScript changed-boundary lane;
- add per-project Feedback Note serialization and deterministic concurrency
  evidence; and
- add fixtures for Review states without provider calls.

Automated gate:

- contract/type checks;
- Feedback Notes persistence and IPC cases;
- concurrency, isolation, stale, missing, malformed, and failed-write cases;
- coverage-policy and receipt checks; and
- existing fixed regression cases affected by the boundary.

Exit:

- no misleading coverage claim;
- no second-writer lost-update risk; and
- later UI batches can consume stable contracts.

Implementation evidence is recorded in
[Program 3 Batch P3-A Evidence Receipt](program_3_batch_p3_a_evidence_receipt.md).
The implementation and automated gate are durable at `4007e12a`.

### Batch P3-B - Behavior-locked controller and view seam

Purpose:

- extract renderer-local orchestration behind explicit state/actions;
- render the current behavior through the new view seam before applying the
  visual redesign;
- preserve dirty buffers, save, recovery, project switch, editor history,
  critique state, outline state, and Focus behavior; and
- remove no legacy product surface yet.

Automated gate:

- existing high-value Stage 19 component behavior remains green;
- focused controller tests cover transitions without DOM implementation
  coupling;
- no duplicate bridge calls or project owners appear; and
- full typecheck and production build pass.

Exit:

- the new visual shell can change without rewriting workflow state machines;
- old source-regex layout confidence is no longer the sole layout guard.

Implementation evidence is recorded in
[Program 3 Batch P3-B Evidence Receipt](program_3_batch_p3_b_evidence_receipt.md).
The implementation and automated gate are durable at `2ff0361c`.

### Batch P3-C - Logical surface host and placement

Purpose:

- implement one-screen Writing/Command surface switching;
- preserve writing state and return context while Command is open;
- adapt the current optional secondary-window route to host the same logical
  Command surface; and
- recover safely when the secondary window or monitor disappears.

Automated gate:

- single-screen and optional-secondary behavior;
- wrong-role/project/generation rejection;
- surface close, reopen, loss, restore, and return focus;
- no duplicate mutation authority;
- dedicated preload parity in development, test, build, and package-safe
  configuration; and
- deterministic built-Electron cases with retries disabled.

Exit:

- two logical surfaces work completely on one screen;
- the second monitor is an enhancement rather than a requirement.

Implementation evidence is recorded in
[Program 3 Batch P3-C Evidence Receipt](program_3_batch_p3_c_evidence_receipt.md).
The implementation and automated gate are durable at `3de76ee1`.

### Batch P3-D - Writing Studio visual shell and edge rails

Purpose:

- introduce scoped Program 3 tokens and typography roles;
- implement the true-black manuscript-first canvas;
- implement top, left, right, and bottom edge-family behavior;
- preserve one-action Focus mode; and
- remove default form/dashboard weight from the writing path.

Automated gate:

- page remains directly writable with all support closed;
- opening and closing each implemented rail preserves manuscript content,
  selection, dirty state, and focus;
- Focus mode hides support and restores it without creating a new editor;
- semantic roles and keyboard paths exist;
- ordinary, hover, focus, selected, disabled, and failure fixtures render; and
- supported viewport and large-text behavior does not crush the manuscript.

Exit:

- the approved Writing Studio hierarchy is operational;
- no Command dashboard or future intelligence is smuggled into the batch.

Implementation evidence is recorded in
[Program 3 Batch P3-D Evidence Receipt](program_3_batch_p3_d_evidence_receipt.md).
The implementation and automated gate are durable at `fb232066`.

### Batch P3-E - Living Outline ecosystem interaction

Purpose:

- replace the ordinary outline form with the approved unboxed list;
- implement direct `+`, contextual default placement, inline naming,
  click-to-locate, drag planning placement, keyboard movement, and accessible
  advanced context;
- show `Not placed yet`, current manuscript context, and advisory/proposed state
  in plain language; and
- preserve the existing optional sidecar and manuscript non-mutation rules.

Automated gate:

- direct writing with no outline;
- outline-first and prose-first creation;
- cursor, selected-span, and global-unplaced defaults;
- bidirectional locate/highlight behavior;
- reorder of planning material without accepted-manuscript mutation;
- keyboard equivalent and focus return;
- missing/malformed sidecar, isolation, concurrent writer, save/reopen, and
  Focus-mode behavior; and
- no mandatory shape, status, provenance, or link ceremony.

Exit:

- manuscript and Living Outline read as one ecosystem;
- advanced ontology remains available without occupying the ordinary path.

Implementation evidence is recorded in
[Program 3 Batch P3-E Evidence Receipt](program_3_batch_p3_e_evidence_receipt.md).
The implementation and automated gate are green; the batch becomes durable
after Jason commits and pushes the exact P3-E file set. P3-F begins from that
exact pushed checkpoint.

### Batch P3-F - Command Center task canvas and Review workspace

Purpose:

- implement the six-family workspace switcher without building all six product
  families;
- provide one dominant Command task canvas;
- move rich critique result presentation into Review;
- implement sanitized projection, copy, owner-routed note save, dismiss, and
  return-to-source; and
- retain compact, truthful empty and unavailable states.

Automated gate:

- completed, failed, cancelled, expired, stale, dismissed, and unavailable
  Review states;
- project, generation, request, unit, and selection binding;
- no credentials, hidden context, unrelated prose, or generic mutation bridge;
- copy and note-save success/failure;
- Feedback Note survival and isolation;
- dismissal without owner-state destruction;
- return to the correct current source or truthful stale result; and
- Command remains optional and non-gating.

Exit:

- the Critique placement finding from Human Gate 1 is resolved;
- Command Center is a real task surface, not a dashboard mockup.

Implementation evidence is recorded in
[Program 3 Batch P3-F Evidence Receipt](program_3_batch_p3_f_evidence_receipt.md).
The implementation and automated gate are green; the batch becomes durable
after Jason commits and pushes the exact P3-F file set. P3-G begins from that
exact pushed checkpoint.

### Batch P3-G - Accessibility, responsive, degraded, and performance closure

Purpose:

- complete the changed-shell accessibility and presentation-state matrix;
- establish targeted visual-reference evidence under the approved strategy;
- version the performance protocol for the accepted surface topology while
  preserving the V1 two-window baseline;
- remove temporary implementation switches or duplicate presentation paths;
  and
- produce the Program 3 automated closure receipt.

Automated gate:

- keyboard traversal, focus visibility/return, large text or zoom, reduced
  motion, and non-color critical cues;
- wide, ordinary laptop, narrow, and optional-secondary arrangements;
- empty, loading, advisory, stale, degraded/offline, failed, disabled, and
  Focus states;
- targeted deterministic reference images on the approved host;
- full fixed Stage 19 regression;
- zero-warning lint, full typecheck, production build, and package-safe checks;
- exact project reopen, save truth, isolation, recovery, outline, note, and
  critique regressions; and
- a concise changed-boundary and deferral receipt.

Exit:

- Program 3 is mechanically complete and ready for Program 4;
- no Human Gate 2 review occurs yet.

## 8. Batch Dependency Map

```text
P3-A contracts/concurrency/evidence truth
  -> P3-B controller/view seam
      -> P3-C logical surface host
          -> P3-D Writing Studio shell
              -> P3-E Living Outline ecosystem
                  -> P3-F Command Review workspace
                      -> P3-G automated closure
                          -> Program 4 minimal Companion
                              -> exact packaged combined candidate
                                  -> Human Gate 2
```

P3-D and P3-E may overlap only after P3-B is stable and only if they do not
edit the same controller/view boundary concurrently. P3-F depends on P3-A and
P3-C. P3-G begins only after every prior batch is durably integrated.

## 9. Evidence Rules

- Automated tests inspect each changed boundary; Jason does not inspect every
  small change.
- Provider calls remain disabled in ordinary automation; deterministic critique
  fixtures are used.
- A test that reads source text or CSS may guard a policy but cannot stand in
  for visible behavior.
- Component tests prefer roles, labels, state, actions, and outcomes over class
  names or tree snapshots.
- Electron tests prove cross-process and cross-surface behavior; they remain
  explicitly labeled if they are harness-only.
- Visual evidence uses semantic viewport assertions plus targeted deterministic
  reference states; portable whole-page pixel equality is not required.
- Program 3 does not repeatedly build and install an installer after every
  batch.
- The exact Windows package/install lifecycle is run once after Program 4 joins
  the shell as the complete Human Gate 2 candidate.
- No evidence using a dirty-worktree override becomes an exact-candidate
  qualification claim.

## 10. Human Validation Boundary

There is no human product-validation stop inside Program 3.

Human Gate 2 occurs after:

- all Program 3 batches are green;
- Program 4's minimal Companion and owner-routing workflow is green;
- the combined exact candidate passes full regression and Windows
  package/install qualification; and
- a human checklist is written for the actual completed workflow rather than
  guessed in advance.

Human Gate 2 evaluates whether the Writing Studio, Living Outline, Command
Center, Focus mode, Companion, and return path feel like one understandable,
safe, non-intrusive product. It is not a general review of later graphs,
long-manuscript import, or AI quality.

## 11. Rollback And Failure Containment

- Each batch must leave the repository buildable and testable before commit.
- Controller extraction preserves the current view until the replacement path
  proves equivalent.
- Any temporary development-only presentation switch is removed before P3-G;
  it must not become a permanent duplicate product.
- Durable schemas do not change unless the batch names the version, reader,
  writer, failure, and rollback behavior.
- Missing or malformed optional UI state cannot block manuscript open, edit,
  or save.
- Surface-host failure returns to a single-screen Writing-first arrangement.
- Review projection failure leaves critique owner state intact and preserves
  direct writing.
- Visual regressions never justify replacing Project Session, Project Spine,
  recovery, or manuscript persistence.

## 12. File And Refactor Discipline

Expected changed areas include the active Stage 19 renderer, its scoped styles,
shared internal contracts, dedicated preload/main surface-host paths, Feedback
Notes concurrency owner, Review projection IPC, and focused tests.

The exact file list is established at each batch from the current tree. A
batch must stop if it discovers that completing its goal requires:

- broad legacy App or service refactoring;
- a new application framework;
- repository-wide CSS cleanup;
- a durable schema migration outside the named contract;
- deletion or archival of legacy code;
- provider, router, job, memory, import, graph, or analytics expansion; or
- a change to manuscript, outline, note, or project truth ownership.

The discovery becomes an open-work finding with an owner and trigger rather
than silent scope growth.

## 13. Model And Reasoning Handoff

This plan was written under the approved Visual Design Foundation setting:
`GPT-5.6 Sol`, `high` reasoning.

Before Program 3 runtime implementation begins, the executing task must issue:

> **MODEL CHANGE REQUIRED** - The next task is Program 3 architecture and
> bounded implementation. Change this task to `GPT-5.6 Sol` with `xhigh`
> reasoning, then confirm. Runtime work will not begin before confirmation.

This requirement was satisfied on `2026-08-10`. Jason confirmed the active
task as `GPT-5.6 Sol` with `xhigh` reasoning while approving the plan and
authorizing its bounded implementation. The authorization-record batch must be
committed and pushed before P3-A mutates runtime or test files.

Keeping `GPT-5.6 Sol` at `xhigh` through P3-G is permitted and avoids repeated
model handoffs. A later task may recommend a lower-cost model for a clearly
mechanical batch, but it must not silently change the active task's model or
reasoning setting.

## 14. Commit And Push Rhythm

Under current repository governance:

- Jason alone stages, commits, and pushes;
- the agent provides one exact file list, commit message, and evidence summary
  after each green batch;
- a commit/push checkpoint is repository control, not human product
  validation;
- Program 3 work does not pause for subjective review between green batches;
  and
- the next batch begins from the exact pushed commit.

Changing this rule requires a separately authorized repository-governance
revision. The Program 3 implementation task may not edit or bypass the
instruction file that imposes it.

## 15. Program 3 Closure Receipt

The Program 3 receipt must record:

- exact final commit and branch;
- batch commits and changed-boundary summaries;
- automated commands and outcomes;
- known harness-only evidence;
- supported-core receipt correction;
- surface-host, Review-projection, note-concurrency, accessibility, visual, and
  performance evidence;
- exact retained deferrals and reopening triggers;
- confirmation that no provider call, manuscript auto-mutation, broad cleanup,
  or later-program capability was introduced; and
- Program 4 handoff state.

The receipt may close Program 3 mechanically. It may not claim Human Gate 2,
installed combined-candidate acceptance, public release, or final visual
perfection.

## 16. Authorization Decision

Current decision: `JASON APPROVED AND AUTHORIZED ON 2026-08-10`

The required authorization is:

> I approve the Program 3 Contextual Product Shell Implementation Plan and
> explicitly authorize its bounded runtime, GUI, test, and qualification work
> on `codex/foundation-audit`. All exclusions, batch gates, truth boundaries,
> current Git controls, and the Human Gate 2 boundary remain in force.

Jason confirmed:

> I approve the Program 3 plan and authorize its bounded implementation. The
> model is GPT-5.6 Sol with xhigh reasoning.

This confirmation satisfies the required decision and model gate. It does not
relax any exclusion, truth boundary, batch gate, Git control, or the Human Gate
2 boundary. Program 3 begins with P3-A only after the exact documentation
baseline containing this record is committed and pushed.
