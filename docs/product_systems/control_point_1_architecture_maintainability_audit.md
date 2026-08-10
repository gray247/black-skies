# Control Point 1 Architecture And Maintainability Audit

## 1. Status And Execution Identity

- Status: `BATCH CP1-B CLOSED; EVIDENCE COMMITTED AND PUSHED`
- Evidence commit: `fe73293e53086c2d8bc8e4d914add60a92714202`
- Review date: `2026-08-10`
- Model: `GPT-5.6 Sol`
- Reasoning effort: `xhigh`
- Task identity: `Current Codex task - Control Point 1, Batch B`
- Exact starting commit: `8351ff5ee3b59976181b72bb579ea9cbc12f8630`
- Branch: `codex/foundation-audit`
- Mutation authority: `documentation and governance only`
- Prohibited actions observed: no runtime, GUI, test, dependency, refactor,
  migration, cleanup, branch, worktree, staging, commit, push, merge, or
  destructive mutation

This ledger executes Section 7.2 of
[post_v1_execution_control_and_handoff_plan.md](post_v1_execution_control_and_handoff_plan.md).
It reviews the supported Stage 19 foundation as evidence, identifies the
smallest architecture work that Program 3 may require, and keeps legacy
professionalization separate from product-shell construction.

## 2. Result

The V1 foundation should be extended, not replaced.

The active product boundary has strong safety ownership for project identity,
generation and revision, saves, recovery, role-scoped IPC, critique lifecycle,
and non-gating sidecars. No current P0 architecture defect or justification
for a repository-wide rewrite was found.

Program 3 does have five bounded architecture needs:

1. separate logical Writing Studio and Command Center surfaces from physical
   BrowserWindow placement;
2. separate the current renderer's stateful workflow controller from the new
   visual shell and workspace views;
3. add a sanitized, role-scoped Review projection so completed critique can
   appear in Command Center without granting it manuscript authority;
4. make the dedicated Stage 19 preload and typecheck boundaries truthful in
   development and packaged execution; and
5. serialize Feedback Note writes before more than one surface can create
   them.

Those needs are narrow seams, not permission to rewrite Project Session,
Project Spine, critique coordination, persistence, or the legacy application.

## 3. Review Method And Boundary

The review was read-only and risk-led. It inspected:

- the active Stage 19 renderer and render-role split;
- main-process startup, window creation, IPC registration, and packaged
  runtime policy;
- the dedicated and legacy preloads;
- Project Session, Project Spine, Living Outline, Feedback Notes, and critique
  ownership;
- current shared IPC contracts and error vocabularies;
- layout and Split Command shell state;
- active and legacy TypeScript boundaries;
- focused persistence tests for missing, malformed, isolated, stale, and
  failed-write behavior; and
- large responsibility concentrations and direct cross-layer imports.

The review did not execute code, change tests, infer product authority from
legacy reachability, prove all possible dependency cycles, or authorize any
refactor.

## 4. Current Architecture Map

| Boundary | Current owner | Verified posture | Program 3 consequence |
| --- | --- | --- | --- |
| Active project identity and generation | `ProjectSessionCoordinator` through Project Spine | Centralized generation, revision, active-project binding, dirty-unit, recovery, save, and stale-token truth | Preserve this owner; the new shell consumes its projection rather than creating parallel state |
| Durable manuscript and structure mutations | Writing-role Project Spine IPC | Role, project, canonical path, generation, revision, and mutation sequencing are checked in main | Command Center stays non-authoritative; all new actions route through explicit owners |
| Writing Studio / Command Center split | Stage 19 renderer role plus Split Command main-process lifecycle | Writing owns shared mutation; Command owns local presentation and navigation only | Preserve authority but stop equating a logical surface with a mandatory separate monitor |
| Critique lifecycle | Main-process critique coordinator | Prepare, approve, execute, cancel, expire, invalidate, selection fingerprint, and late-result handling are explicit | Reuse lifecycle; add a read-only Review projection rather than exposing the writing mutation bridge |
| Living Outline | Project-local sidecar and writing-only bridge | Revisioned, serialized, atomic, optional, and non-gating | Preserve as planning state; Program 3 changes presentation and direct-manipulation language, not truth ownership |
| Feedback Notes | Project-local sidecar and writing-only bridge | Atomic, minimal, advisory, isolated, and non-gating | Add per-project serialization before Command Center can save notes |
| Packaged renderer bridge | `stage19Preload.ts` | Narrow and role-scoped; Command receives only project status/navigation and Split Command | Use the same narrow bridge whenever the dedicated host is active, including development and test hosts |
| Legacy renderer and services | legacy `App`, legacy preload, project loader, layout, and optional service runtime | Retained but not the supported packaged product surface | Keep quarantined until a proven replacement map exists after Human Gate 2 |

## 5. Verified Strengths To Preserve

### `ARC-S1` - One project-session truth owner

`ProjectSessionCoordinator` owns active project identity, canonical path,
generation, revision, dirty buffers, recovery decisions, save tokens, and
structure tokens. `projectSpineIpc.ts` binds renderer requests to that state.
This is the correct foundation for the Writing Surface and Living Outline
loop.

### `ARC-S2` - Narrow packaged authority bridge

`stage19Preload.ts` exposes a reduced Command bridge and exposes critique,
Feedback Notes, Living Outline, and manuscript mutation only to Writing. This
is a useful least-authority boundary and must not be weakened merely to move a
result visually.

### `ARC-S3` - Non-gating project-local sidecars

Living Outline and Feedback Notes are separate from manuscript drafts,
`project.json`, and `outline.json`. Missing or malformed optional data does not
claim to change manuscript truth. Both use temporary-file replacement for
atomic writes; Living Outline additionally has revision and mutation-queue
protection.

### `ARC-S4` - Explicit asynchronous critique lifecycle

The critique coordinator records project, path, generation, unit, request,
selection fingerprint, status, cancellation, invalidation, expiry, and result.
Late or stale work cannot silently become current advice. Program 3 should
project this state, not recreate it in UI components.

### `ARC-S5` - Supported core is distinguishable from legacy reachability

Packaged runtime policy selects the dedicated Stage 19 host and does not start
legacy Python services. The legacy renderer and service tree remain visible
for evidence, but their reachability does not make them product authority or a
Program 3 dependency.

## 6. Responsibility Concentrations

The following measurements are risk indicators, not automatic refactor
orders:

| File | Lines reviewed | Concentration |
| --- | ---: | --- |
| `app/renderer/Stage19WritingSpineApp.tsx` | 2,426 | project lifecycle, recovery, units, outline, editor, critique, notes, focus, and both role views; 19 state hooks, 19 effects, and 42 callbacks |
| `app/renderer/styles/app.css` | 5,195 | legacy and Stage 19 styling in one global file; 67 unique Stage 19-prefixed selectors |
| `app/main/main.ts` | 1,442 | configuration, optional services, logging, window pair, lifecycle, navigation, and IPC registration |
| `app/main/projectSpineIpc.ts` | 1,194 | active project repository operations and IPC ownership |
| `app/main/projectLoaderIpc.ts` | 1,030 | overlapping legacy load/save concerns outside the active Stage 19 owner |
| `app/main/projectSessionCoordinator.ts` | 859 | intentionally centralized session and mutation truth |
| `app/main/preload.ts` | 2,663 | broad legacy/development bridge |
| `app/main/stage19Preload.ts` | 498 | narrow active product bridge |

Size alone is not a defect. The primary Program 3 risk is that visual-shell
work currently requires editing the same renderer component that owns proven
workflow state machines. The coordinator and Project Spine concentrations are
more defensible because they centralize correctness.

## 7. Program 3 Architecture Findings

| ID | Priority | Finding and evidence | Required disposition | Exit evidence |
| --- | --- | --- | --- | --- |
| `ARC-P3-01` | required before Program 3 mutation | Logical surface identity is coupled to physical window role. The renderer chooses Writing or Command from Split Command role, and startup normally creates the secondary Command BrowserWindow whenever the dedicated host is active. | Specify one logical surface-host contract: Writing Studio and Command Center can occupy one window as summonable layers or separate windows as an optional placement. Project Session and writing mutation authority remain singular. Do not replace Split Command authority wholesale. | Contract tests prove identical project/generation truth, one mutation owner, safe secondary loss, and single-screen availability. |
| `ARC-P3-02` | first Program 3 implementation batch | `Stage19WritingSpineApp.tsx` combines workflow state machines with all presentational markup. New visual composition would otherwise create a big-bang edit. | Keep one stateful session/workflow controller initially; extract behavior-locked Writing shell, Command shell, outline, editor-support, and review views in small batches. No state-management framework change. | Existing behavior remains green while presentation components receive explicit data/actions and no independent project truth. |
| `ARC-P3-03` | required before moving rich results | Command's preload has project status/navigation but no critique or Feedback Notes projection. The completed workbench is rendered in Writing. | Define a sanitized main-owned Review projection and explicit owner-routed actions. Preserve project, generation, source unit, request, selection fingerprint, advisory status, stale state, and return-to-writing source. Do not expose Writing's complete critique bridge to Command. | Wrong-role, wrong-project, stale, missing-source, Command-loss, and return-path cases fail safely; no action can mutate prose or outline truth. |
| `ARC-P3-04` | required before Program 3 qualification | Dedicated-host activation and preload selection use different conditions: the dedicated host can be enabled in development, while preload selection uses the broad legacy preload whenever the app is not packaged. | Select the narrow Stage 19 preload whenever the dedicated Stage 19 host is active. Keep the legacy preload only for the actual legacy host. Lock development, test, and package parity. | Dedicated development and packaged hosts expose the same allowed bridge shape and role restrictions. |
| `ARC-P3-05` | required before Program 3 qualification | `app/tsconfig.stage19-renderer.json` excludes current Living Outline and Feedback Notes contracts and future shell modules, although the full root typecheck currently includes them. | Repair or replace the named active-surface typecheck boundary so it truthfully covers every active shell source and shared contract. Keep the full typecheck. | A deliberately broken active contract fails both the focused active-surface check and the full check. |
| `ARC-P3-06` | with Program 3 styling | Stage 19 selectors are scoped by naming but live inside the 5,195-line global legacy stylesheet. | Establish a scoped Program 3 shell stylesheet and restrained token layer. Do not perform a global CSS cleanup or import legacy layout tokens as product authority. | New shell states have one token source, do not leak into legacy selectors, and cover true black, focus, hover, selection, drag, advisory, failure, disabled, degraded, and large-font states. |
| `ARC-P3-07` | with Program 3 presentation | Project Spine, critique, Living Outline, Feedback Notes, and legacy services correctly use domain-specific error codes, but there is no one presentation vocabulary for unavailable, stale, failed, degraded, proposed, advisory, or disabled states. | Add a UI translation seam that maps domain outcomes into consistent visible states without merging all domain error enums. | Equivalent states read and render consistently while original diagnostic codes remain available to their owners. |

## 8. Cross-Surface Persistence Finding

### `ARC-H1` - Feedback Note lost-update risk

`FeedbackNotesRepository.create()` performs read, append, and atomic replace,
but it has no project/file mutation queue or revision check. Two concurrent
repository instances can read the same prior envelope and the later rename can
replace the earlier new note. Existing focused tests cover isolation,
malformed data, and normal persistence, but not concurrent creation.

Current severity is bounded because only Writing exposes note creation. It
becomes a Program 3 prerequisite if Command Center also receives the author
action.

Required disposition: use one main-process per-project serialization owner,
or an equivalent compare-and-retry contract, before enabling cross-surface
note creation. Add deterministic concurrent-create evidence. Do not turn
Feedback Notes into durable AI memory or manuscript truth.

## 9. Duplication, Dependency, And Migration Findings

### `ARC-D1` - Active and legacy project paths overlap

`projectSpineIpc.ts` and legacy `projectLoaderIpc.ts` both contain project
metadata, path validation, draft persistence, and atomic-write concerns. This
does not justify consolidation before Program 3 because the legacy renderer is
not the supported product baseline. Program 3 must use Project Spine and must
not add a third project loader. Cleanup Wave A owns replacement comparison and
the first deletion or consolidation decision.

### `ARC-D2` - Small active-binding validation is duplicated

Living Outline and Feedback Notes repeat role, project, path, and generation
checks. If the Review projection needs the same boundary, Program 3 may add a
small main-process active-project binding guard and adopt it only where
behavior is locked. Mechanical rewriting of every IPC handler is not required.

### `ARC-D3` - Legacy dependency direction is not a new-shell precedent

The direct cross-layer search found legacy `app/main/preload.ts` importing the
renderer test-mode manager. Shared layout contracts also depend on the legacy
Mosaic layout package. No direct active Stage 19 circular dependency was
observed, but no structural boundary check presently proves that future code
cannot create one.

Program 3 should lock the active direction `renderer -> shared` and
`main -> shared`, forbid active `main -> renderer` and `shared -> main/renderer`
imports, and keep legacy exceptions explicitly quarantined. This is an
architecture/test rule, not permission to repair the legacy tree now.

### `ARC-D4` - Schema migration is safe only while schemas remain stable

Project metadata, Living Outline, Feedback Notes, recent projects, and shell
state are versioned and fail safely on unsupported or malformed data. They do
not yet provide a general forward/backward migration path. Program 3 should
preserve current schemas where possible. Any schema change requires its own
compatibility and recovery package. Program 5 long-manuscript anchors are the
first expected checkpoint likely to justify explicit migration design.

### `ARC-D5` - Main-process decomposition is not a free-standing prerequisite

`main.ts` has broad lifecycle responsibility, but its product-critical window
and IPC ownership is coherent. Program 3 may extract only the bounded surface
host seam needed by `ARC-P3-01`. General service lifecycle, logging, and
startup decomposition remain a later professionalization task.

## 10. Error And Degraded-State Rule

The audit rejects one global error enum. Domain errors express different
owners and remedies and should remain specific.

Program 3 instead needs a presentation-state vocabulary with at least:

- loading,
- available,
- advisory or proposed,
- stale,
- unavailable or degraded,
- failed with a truthful remedy,
- disabled with a visible reason,
- and offline where remote capability is optional.

The visible state must never upgrade advisory data into story truth, turn a
missing optional sidecar into manuscript failure, or show Command Center as a
second mutation owner.

## 11. Bounded Refactor Budget

### Decide before the first Program 3 code batch

- logical surface-host and physical-window relationship;
- Review projection fields, authority, actions, and source return path;
- active Stage 19 preload-selection rule;
- truthful active-surface typecheck boundary; and
- Program 3 component and style ownership boundaries.

### Implement only as needed with Program 3

- behavior-locked controller/view extraction;
- single-screen and optional-secondary surface host;
- sanitized Review projection and owner-routed actions;
- Feedback Note write serialization;
- small active-project binding helper if it removes new duplication;
- scoped shell styling and presentation-state translation; and
- risk-led tests for every changed boundary.

### Do not do during Program 3 by default

- rewrite Project Session, Project Spine, critique coordination, or recovery;
- merge legacy App with Stage 19;
- consolidate legacy preload, project loader, docking, Mosaic, or floating
  panes;
- refactor the optional Python/service tree;
- introduce a new state-management or UI framework;
- build a general migration framework without a schema change;
- clean the complete 5,195-line stylesheet;
- delete historical, retained, or unreachable code; or
- convert Feedback Notes into durable memory or accepted story truth.

## 12. Milestone Ownership

| Finding family | Owner | Reopening trigger |
| --- | --- | --- |
| `ARC-P3-01` through `ARC-P3-07` | Program 3 planning and bounded implementation | Program 3 cannot produce the accepted single-screen/optional-monitor shell without the seam |
| `ARC-H1` | Program 3 if Command can save a note; otherwise first multi-surface Feedback Note workflow | A second surface or concurrent caller gains create authority |
| `ARC-D1`, legacy half of `ARC-D3`, and broad `ARC-D5` | Cleanup Wave A, Cleanup Wave B, or final professionalization as assigned by reachability | Accepted replacement map and recovery path make consolidation or removal provable |
| `ARC-D2` | Program 3 only if new IPC would create a third copy | A new active project-bound handler is specified |
| `ARC-D4` | First actual schema change, expected no earlier than Program 5 | A current sidecar or project schema must change |

## 13. Control-Point Result

Batch CP1-B closes `ARC-01` when this evidence is committed and pushed.

It establishes that:

- the V1 foundation remains the correct platform for Program 3;
- no broad rewrite or pre-Program-3 legacy cleanup is justified;
- five architecture seams must be decided before or with the new shell;
- one bounded Feedback Note concurrency weakness must be closed before
  cross-surface note creation;
- legacy code remains quarantined and reviewable at the approved cleanup
  waves;
- Program 3 receives a strict refactor budget rather than an open-ended
  professionalization campaign; and
- no implementation, cleanup, migration, provider, connector, or human visual
  decision has been authorized by this audit.

Batch CP1-C was performed from this exact committed evidence baseline. Its
result is recorded in
[control_point_1_test_strength_audit.md](control_point_1_test_strength_audit.md).
