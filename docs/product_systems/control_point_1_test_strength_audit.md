# Control Point 1 Test-Strength Audit

## 1. Status And Execution Identity

- Status: `BATCH CP1-C CLOSED; EVIDENCE COMMITTED AND PUSHED`
- Evidence commit: `1698a44604e8fab6c47948a5128e911bf8d9916b`
- Review date: `2026-08-10`
- Model: `GPT-5.6 Sol`
- Reasoning effort: `xhigh`
- Task identity: `Current Codex task - Control Point 1, Batch C`
- Exact starting commit: `fe73293e53086c2d8bc8e4d914add60a92714202`
- Branch: `codex/foundation-audit`
- Mutation authority: `documentation and governance only`
- Prohibited actions observed: no runtime, GUI, test, dependency, refactor,
  migration, cleanup, branch, worktree, staging, commit, push, merge, or
  destructive mutation

This ledger executes Section 7.3 of
[post_v1_execution_control_and_handoff_plan.md](post_v1_execution_control_and_handoff_plan.md).
It evaluates whether current evidence proves product behavior, records the
smallest test work needed by Program 3, and assigns later evidence to the
program where it becomes meaningful.

## 2. Result

The V1 foundation has strong behavioral evidence and is a suitable base for
Program 3. It does not need a blanket retest, a coverage-percentage campaign,
or human review after every implementation batch.

The fixed Stage 19 gate already combines clean-worktree policy, repository and
packaging checks, zero-warning lint, full TypeScript checking, production
build, thirty-seven focused unit/component/contract files, and seven serial
Electron workflow files with retries disabled. The Windows qualification lane
adds exact-candidate package, install, offline lifecycle, reopen, isolation,
export, recovery, uninstall/reinstall, process-survivor, and performance
evidence. Project identity, stale-operation rejection, recovery, critique
lifecycle, optional sidecars, failure behavior, and role boundaries are
covered unusually well for this stage of the product.

Five evidence repairs or additions are required before a Program 3/4 candidate
can claim qualification:

1. make the supported-core coverage receipt say exactly what it measures;
2. prove the new logical-surface host and Review projection without creating a
   second manuscript authority or leaking Writing-only data;
3. serialize and test Feedback Note creation before a second surface can save
   a note;
4. replace source-shaped layout confidence with behavior, accessibility, and
   an approved visual-reference strategy for the new shell; and
5. qualify one exact packaged Program 3/4 candidate after the complete shell
   and Companion workflow is green.

Long-manuscript performance, Emotion Graph evidence, live-provider quality,
legacy analytics skips, and broad professionalization remain assigned to their
later programs. Pulling those into Program 3 would create cost without proving
the shell workflow.

## 3. Review Method And Boundary

The audit was read-only and risk-led. It inspected:

- the fixed Stage 19 regression program and its exact test matrix;
- Linux regression and Windows package/install workflows;
- the supported-core coverage manifest, runner, and receipt contract;
- the intentional-skip inventory and the guarded test sites it describes;
- Stage 19 component, main-process, and Electron evidence;
- Project Spine, recovery, Living Outline, Feedback Notes, critique, and
  Command Center integrity tests;
- accessibility, layout, performance, failure, isolation, and package
  evidence; and
- the Human Gate 1 and Package `19.22` closure receipts.

The audit did not rerun the already-qualified V1 ladder, contact a provider,
change an evidence threshold, execute a destructive host cleanup, or treat a
historical harness as current product authority.

## 4. Current Evidence Map

| Evidence boundary | Current posture | Qualification meaning | Program 3 consequence |
| --- | --- | --- | --- |
| Fixed Stage 19 regression | Strong | Clean repository policy, lint, full typecheck, production build, focused contracts, and seven serial Electron workflows run with zero retries | Retain as the regression floor; add only changed-boundary cases |
| Project Spine and Project Session | Strong | Identity, generation, revision, dirty/save truth, stale tokens, isolation, close/switch, and failure behavior are exercised | New surfaces consume this owner; do not recreate its tests through a second state model |
| Recovery and export | Strong | Corruption, mixed origin, accept/reject, write/delete failure, crash/restart, deterministic export, and installed reopen are covered | Preserve unchanged unless Program 3 crosses the boundary |
| Living Outline | Strong for V1 mechanics | Missing/malformed sidecar, isolation, stale revisions, concurrent writers, linking, movement, reopen, and no manuscript mutation are covered | Test the new direct-manipulation presentation without rewriting persistence tests |
| Critique | Strong and deterministic | Preview, approval binding, expiry, replay, cancellation, stale selection, provider failure/redaction, and no hidden context are covered without live provider calls | Reuse fixtures; qualify only the new Review projection and source-return path |
| Feedback Notes | Strong single-writer behavior; one concurrency gap | Minimal advisory data, isolation, malformed data, role/project/request binding, and write failure are covered | Close `ARC-H1` before Command Center gains create authority |
| Command Center role boundary | Strong for mandatory two-window V1 | Writing-only mutation data is withheld and secondary-window loss is bounded | Add single-screen, optional-secondary, relocation, and projection ownership cases |
| Accessibility | Useful baseline, incomplete for new shell | One populated Writing/Command state passes Axe WCAG A/AA and selected editor focus semantics are covered | Add keyboard, focus return, zoom/large-font, reduced-motion, and state coverage for changed UI |
| Visual behavior | Weak as product evidence | One test regex-matches CSS source and the strict screenshot lane is intentionally disabled because host pixels are not portable | Adopt the Control Point 1 design baseline and a layered visual strategy before implementation |
| Performance | Strong for V1 package startup and 100-unit navigation | Installed startup has an exact two-window protocol; harness checks 100 empty units and selection | Preserve the old baseline; establish a new topology-specific baseline after the Program 3 host is accepted |
| Package and installed parity | Strong for the V1 foundation | Exact candidate, offline install lifecycle, project durability, isolation, uninstall/reinstall, and zero survivors are receipt-bound | Run once for the complete Program 3/4 candidate, not after every small batch |

## 5. Strengths To Preserve

### `TST-S1` - Exact-candidate evidence is layered and fail-closed

The fixed gate uses a clean worktree by default, zero retries, serial Electron
execution, production build, and explicit file lists. The Windows lane binds
the installer, receipt, lifecycle evidence, and performance measurement to an
exact source candidate. Failures are not hidden by retry or by protected test
data.

### `TST-S2` - Safety ownership is proven behaviorally

The highest-risk V1 boundaries are not represented only by snapshots or source
inspection. Project, role, generation, revision, selection, recovery,
isolation, cancellation, and failure contracts are exercised through explicit
calls and visible workflow assertions.

### `TST-S3` - Remote critique remains deterministic in normal automation

The automated path uses controlled fixtures, preserves explicit preview and
approval, and covers expiry, cancellation, late results, and provider failure.
Normal qualification does not need credentials, paid calls, or manuscript
content.

### `TST-S4` - Optional data cannot gate manuscript work

Living Outline and Feedback Note evidence covers missing and malformed
sidecars, project isolation, failed writes, and no manuscript mutation. This is
the correct evidence posture for advisory and planning layers.

### `TST-S5` - Intentional skips are named and owned

The five current skip families have reasons, owners, and reopening triggers.
No unowned Stage 19 skip was found in the inspected supported boundary. The
skip inventory remains a governance record; it is not currently an automatic
one-to-one check against every skip statement in source.

## 6. Current Evidence Weaknesses

### `TST-G1` - The supported-core coverage receipt overstates its denominator

`foundation_supported_core_coverage.json` lists five Python surfaces and three
TypeScript surfaces as included. The runner collects only entries with a
`pythonModule` and only service test paths, then writes the complete mixed list
into the receipt beside the Python branch percentage. The reported percentage
therefore measures the governed Python subset, not every listed supported-core
path.

This does not erase the extensive TypeScript behavior evidence in Vitest and
Electron. It does mean a later receipt must not imply that one Python
percentage measured TypeScript. Before the Program 3 exact-candidate claim,
either label and scope the receipt as Python supported core or add a separately
truthful TypeScript changed-boundary measurement. Do not raise a global
percentage merely to make the number look more professional.

### `TST-G2` - Layout source matching is not visual or interaction proof

`Stage19WritingSpineLayout.test.ts` reads stylesheet source and matches exact
grid and overflow declarations. That can detect an accidental source edit, but
it cannot prove usable layout, responsive behavior, focus, clipping, readable
density, or visual consistency. It is also coupled to the V1 implementation
that Program 3 is expected to replace.

Program 3 may retire or narrow this check only when semantic viewport behavior
and the approved visual evidence strategy replace the product claim it was
standing in for.

### `TST-G3` - Accessibility evidence covers only one normal populated state

The current Axe lane is valuable, but it does not prove a complete keyboard
journey, edge-rail focus behavior, focus return from summonable surfaces,
drag-and-drop alternatives, large text or zoom, reduced motion, or the empty,
loading, stale, degraded, failed, disabled, and Focus-mode states introduced by
the new shell.

### `TST-G4` - The installed protocol is tied to the old two-window topology

The current performance budget requires exactly two visible sandboxed windows.
Program 3 intentionally makes logical surfaces independent from mandatory
physical windows. Comparing a one-window or summonable-surface candidate
directly against the old two-window score would be misleading.

Keep the historical V1 baseline. Once Jason approves the new topology, record
a versioned protocol and exact baseline for that topology. Never rewrite the
old receipt to make unlike architectures appear comparable.

### `TST-G5` - Harness evidence is not installed-product evidence

The seven Stage 19 Electron specifications are explicitly marked
`HARNESS_ONLY`. They are appropriate for fast deterministic batches and have
clear retirement language. They do not by themselves prove that the complete
Program 3/4 workflow survived packaging. The efficient answer is one
receipt-bound installed qualification after the whole candidate is green,
not installation after every small change.

### `TST-G6` - Feedback Note concurrent creation is not yet qualified

Living Outline writers are serialized and tested. Feedback Note creation is
atomic but lacks the equivalent concurrent-create contract and deterministic
test. This is the test expression of architecture finding `ARC-H1`. It becomes
blocking only if a second surface can create notes.

## 7. Program 3 Changed-Boundary Evidence Plan

The Program 3 implementation plan must translate the following requirements
into bounded automated batches. Existing V1 tests remain the floor; they are
not all to be copied into every new component.

### `TST-P3-01` - Logical surface-host authority

Prove one active project and one Writing mutation authority in single-screen
and optional-secondary arrangements. Cover surface summon, move or reopen,
secondary loss, stale project generation, wrong role, wrong project, and return
to Writing without creating duplicate durable state.

### `TST-P3-02` - Sanitized Review projection

Prove that Command Center receives only the approved critique projection, can
identify advisory, stale, unavailable, and failed states, and can return the
writer to the source. It must not receive manuscript mutation authority, raw
hidden context, credentials, or unrelated project results. Copy, dismiss, and
owner-routed note save must preserve the manuscript.

### `TST-P3-03` - Feedback Note multi-surface safety

Before a second create caller is enabled, prove the chosen per-project
serialization or equivalent concurrency contract, deterministic conflict
behavior, project isolation, failure honesty, and no lost accepted note.

### `TST-P3-04` - Presentation-state and accessibility matrix

For the new shell, use deterministic state fixtures for meaningful empty,
loading, available, advisory, stale, degraded or offline, failed, and disabled
states. Exercise semantic roles, keyboard access, focus visibility and return,
Focus mode, large text or zoom, reduced motion, and a keyboard alternative for
direct manipulation. Do not multiply every state by every component when one
owner-level test and a few integration cases prove the invariant.

### `TST-P3-05` - Visual and responsive evidence

Use three layers:

1. semantic behavior assertions across the supported viewport and large-text
   boundaries;
2. deterministic targeted state images on the approved reference host for the
   stable shell regions that materially affect usability; and
3. Jason's Human Gate 2 review of the complete candidate.

Cross-platform whole-page pixel equality is not required. A source-regex test
is not a substitute. Control Point 1D must approve the tokens, states, and
reference direction before this requirement can be made exact.

### `TST-P3-06` - Development, test, build, and package parity

Prove that the dedicated Stage 19 preload, role restrictions, and active
TypeScript boundary are the same in development, focused automation,
production build, and packaged execution. Source-shape policy checks may guard
configuration, but critical authority claims also require executable evidence.

### `TST-P3-07` - Topology-specific performance evidence

Keep the V1 two-window record immutable. Add fast development ceilings only
where they catch a Program 3 regression, then establish a new exact installed
baseline after the accepted logical/physical surface topology is fixed. Measure
startup, steady memory, window/surface count, teardown, and the interaction
whose responsiveness materially affects the shell.

## 8. Efficient Evidence Rhythm

Program 3 may run for multiple automated batches before human validation.

After each implementation batch:

- run static policy, lint, type, and build checks relevant to the changed
  boundary;
- run focused unit, contract, component, and deterministic Electron cases;
- run the fixed Stage 19 regression when the batch reaches its declared
  evidence boundary; and
- provide Jason a concise evidence and file-scope receipt for manual commit and
  push.

Do not install the app or ask Jason to inspect each tiny change. After Programs
3 and 4 form one complete candidate, run the full regression and one exact
Windows package/install qualification. Human Gate 2 then reviews the complete
Writing Studio, Command Center, minimal Companion, and failure posture. A
failed human outcome creates a bounded repair batch and a new whole-candidate
review, not manual repetition after every small fix.

## 9. Deferred Evidence With Exact Homes

| Evidence need | Current disposition | Resolution stage | Reopening trigger |
| --- | --- | --- | --- |
| 200-page paste/import, first render, save/reopen, anchor stability, navigation, and memory | Deferred, owned | Program 5 before Human Gate 3 | Long-manuscript intake implementation begins |
| Emotion Graph accuracy, provenance, contradiction, and visualization | Deferred, owned | Program 6 before Human Gate 4 | Human Gate 3 proves stable structural anchors |
| Budget-indicator and snapshots-panel legacy UI skips | Deferred, owned | Program 9 or final qualification | The surface is admitted to the current product workflow |
| Real-service reference lane | Deferred, owned | Program 9 or earlier changed service boundary | A controlled real-service environment is provided |
| Live-provider qualification | Deferred, owned | Program 9 or a named provider package | Provider qualification is explicitly authorized |
| Schema migration framework | Deferred, conditional | First actual schema change, expected no earlier than Program 5 | A current durable schema version changes |
| Broad legacy test retirement | Deferred, owned | Cleanup Wave A/B after replacement proof | Accepted current workflow provides equivalent or stronger evidence |

The strict visual-snapshot skip is not carried unchanged. Control Point 1D and
Program 3 must resolve it through the layered visual strategy in `TST-P3-05`
or document a better approved replacement. A fixed cross-platform pixel gate
is not automatically required.

## 10. Host And Harness Constraints

Current evidence assumes controlled Node, Python, pnpm, Electron display,
temporary-directory, and Windows installer conditions. Local port conflicts,
ACLs, stale processes, and temp cleanup can invalidate a run without proving a
product defect.

Before a release-candidate or installed qualification, the executing task must
record the exact candidate, governed runtime versions, relevant host
preconditions, evidence paths, and whether any development override was used.
No evidence run using a dirty-worktree override may be represented as an exact
release-candidate qualification. Destructive host cleanup remains separately
authorized and is never implied by this audit.

## 11. Priorities And Owners

| Priority | Finding | Owner | Must close by |
| --- | --- | --- | --- |
| P1 | `TST-G1` truthful supported-core receipt scope | Program 3 qualification tooling | Before Program 3 exact-candidate evidence claim |
| P1 | `TST-P3-01` logical surface-host authority | Program 3 | Before Program 3 automated closure |
| P1 | `TST-P3-02` sanitized Review projection | Program 3 | Before Program 3 automated closure |
| P1 conditional | `TST-G6` / `ARC-H1` Feedback Note concurrency | Program 3 if Command can save | Before second-surface create authority |
| P1 | `TST-P3-04` changed-shell accessibility and states | Program 3 | Before combined Program 3/4 exact candidate |
| P1 | `TST-P3-05` approved visual evidence strategy | Control Point 1D and Program 3 | Design strategy before code; evidence before Human Gate 2 |
| P1 | `TST-P3-06` host and type-boundary parity | Program 3 | Before combined Program 3/4 exact candidate |
| P1 | `TST-P3-07` topology-specific package/performance protocol | Program 3 qualification | Before installed candidate claim |
| P2 | Long-manuscript evidence | Program 5 | Before Human Gate 3 |
| P2 | Legacy harness retirement and broad professionalization | Cleanup Wave A/B | After accepted replacement proof |
| P2 | Provider, real-service, budget, and snapshot deferred lanes | Program 9/final | Their recorded reopening trigger fires |

`P1` here means required for the named future candidate, not a defect in the
accepted V1 package and not authority to begin implementation now.

## 12. Control-Point Result

Batch CP1-C closes `TST-01` when this evidence is committed and pushed.

It establishes that:

- V1 evidence is strong enough to support Program 3 without a blanket retest;
- current automation should remain behavior-led and deterministic;
- the supported-core percentage needs truthful denominator repair rather than
  a higher arbitrary threshold;
- Program 3 receives seven bounded changed-boundary evidence requirements;
- one exact packaged qualification and one Human Gate 2 review occur only
  after Programs 3 and 4 form a complete candidate;
- long-manuscript, Emotion Graph, provider, service, and legacy evidence retain
  their exact later owners;
- the strict visual skip must be resolved through an approved layered strategy;
  and
- no runtime, test, package, cleanup, provider, or human visual decision has
  been authorized by this audit.

Jason committed and pushed this evidence at `1698a446`. The required model
change was confirmed before Batch CP1-D began. The proposed Visual Design
Foundation is recorded in
[control_point_1_visual_design_foundation.md](control_point_1_visual_design_foundation.md)
and now awaits Jason's human decision.
