# Phase 24 Execution Plan - True Two-Monitor Workspace Foundation

Canonical role: bounded planning contract for the true two-monitor Split Command workflow, including window authority, runtime truth, recovery, and cross-window synchronization rules.

Does not own: AI/intelligence work, writing-quality claims, broad renderer rewrites, speculative UX polish, or promotion of Split Command to default.

Downstream dependencies: Phase 20 shell authority baselines, Phase 21 command-center hardening, Phase 22 writing-surface scope, Phase 23 truth/provenance discipline, and any later closure review for unresolved monitor or window instability.

## Core Intent

Phase 24 is the first true two-monitor execution phase.

Its purpose is to make the split workspace honest about what is owned by which window, what survives a disconnect, what must be recomputed after invalidation, and what must always stay visible rather than being hidden behind a promoted fallback.

Phase 24 is not a promotion phase. It is a bounded workspace contract phase that proves the two-window model can remain truthful, stable, and recoverable under constrained failure conditions.

## Explicit Non-Goals

Phase 24 does not:

- promote Split Command to the stable/default GUI
- create a hidden promotion path for two-monitor behavior
- claim production readiness for detached windows before proof exists
- add AI/intelligence work
- add output-quality, creative-quality, or real-author workflow claims
- broaden persistence authority beyond the current project/session contract
- rewrite the launch stack, preload stack, or IPC architecture outside the narrow lanes required for this phase
- turn recovery placeholders into silent success states
- treat dock floating panes as equivalent to true two-monitor windows

## Window Authority Hierarchy

The workspace must always be able to answer which surface owns which truth.

Authority order:

1. runtime process truth
2. window-local truth
3. project/session truth
4. derived UI truth
5. placeholder/deferred truth

Rules:

- a window may only assert truth for the authority it actually owns
- the command window owns command-center truth and session coordination truth
- the writing window owns writing-surface truth and writing-side local focus truth
- derived UI truth must never outrank the underlying runtime or session source
- a hidden or detached surface may not present itself as the canonical workspace unless that promotion has been explicitly implemented and verified
- if two surfaces disagree, the higher authority wins and the lower authority must visibly reconcile or defer

## Persistence Authority Rules

Persistence must remain narrow and explicit.

Rules:

- project-scoped persistence may only be written by the authority that owns the data being persisted
- window-local state may not be promoted into cross-window persistence unless the shared contract explicitly allows it
- stable GUI persistence and Split Command persistence must remain isolated unless a documented bridge exists
- recovery state may be persisted only when its schema, invalidation rules, and owner are explicit
- persistence writes must be atomic at the semantic level: a project switch or session invalidation must not leave mixed-project state behind
- if persistence cannot prove ownership, it must fail closed rather than guessing

## Session Generation Invalidation

Every cross-window session must carry a generation token that can be invalidated.

Rules:

- a session generation represents the current authoritative pairing of windows and project context
- any project switch, reconnect, explicit reset, or recovery boundary may invalidate the active generation
- stale generations must not continue mutating state after invalidation
- invalidation must be visible to the owning surfaces so they can stop routing input into dead state
- recovery may only resume from a matching generation or from an explicitly rebuilt generation

## Single-Monitor Fallback Behavior

Phase 24 must define what happens when the true two-monitor arrangement cannot stay alive.

Rules:

- fallback must remain honest and visible
- the app may fall back to a single-monitor representation only if the fallback is explicitly designed and labeled
- fallback must not secretly promote itself to the default product shape
- if the second window cannot survive, the user must see that the workspace is degraded rather than silently normalized
- a fallback path must preserve the stable GUI as the sacred default path unless the user is already inside an explicit split-session contract

## Recovery Visibility Rules

Recovery is a truth surface, not a concealment surface.

Rules:

- recovery events must be visible to the user
- recovery must identify what was recovered, what was lost, and what was invalidated
- partial recovery must not be displayed as full continuity
- deferred recovery must remain labeled as deferred
- if recovery requires a rebuild, the rebuild must be acknowledged rather than hidden
- the system may not use a blank or silent state to imply success

## Atomic Project-Switch Semantics

Project switching must behave as a single semantic transition.

Rules:

- project switch must invalidate the old generation before the new project becomes authoritative
- no cross-window mutation may continue after the switch boundary
- partially updated UI state must not be exposed as a new project
- both windows must converge on the same project identity or visibly fail into a safe state
- project switch success means both authority and routing have landed on the new project, not merely that one surface refreshed

## Shared Mutation / Undo Authority

Shared mutations require a single owner.

Rules:

- shared state changes must be owned by one authoritative source
- undo must apply to the mutation owner, not to whichever window happened to display the change
- cross-window undo must not create divergent histories
- a mutation that can affect both windows must have a defined source of truth before it is allowed
- if ownership is ambiguous, the mutation stays deferred

## Hidden-Window Prevention

Phase 24 must not create a hidden window that behaves like a secret product path.

Rules:

- no hidden promotion of the second window
- no invisible window that mutates shared state without user-visible authority
- no offscreen or suppressed window may be treated as a normal runtime substitute unless the contract explicitly says so
- if a hidden surface exists for bootstrap or recovery, it must stay labeled as bootstrap or recovery infrastructure, not as the active product surface
- a hidden window may never silently become the user-facing truth source

## Retry / Recovery Bounds

Retry and recovery must be bounded.

Rules:

- retries must have explicit stop conditions
- recovery loops must not become unbounded resurrection attempts
- if the same failure repeats, the phase must classify it rather than looping forever
- recovery may retry only within the documented session, generation, or window lifecycle budget
- when the budget is exhausted, the system must stop and report the failure class

## Cross-Window Runtime Truth Rules

Runtime truth must be consistent across both windows.

Rules:

- a fact shown in one window must be consistent with the authoritative source used by the other window
- if a window is showing derived data, it must say so
- the command window and writing window may have different views, but not contradictory authority
- stale truth must be marked stale rather than left looking current
- runtime truth should prefer direct observation over inferred continuity

## Focus / Input Routing Rules

Keyboard and focus routing must follow authority, not convenience.

Rules:

- active input must route to the correct owning window
- focus changes must not break session ownership
- keyboard shortcuts must not send edits into the wrong surface
- if a surface is inactive, it must not pretend to own the current input stream
- focus restoration after recovery must respect the surviving window and current generation

## IPC / Synchronization Constraints

Inter-window communication must remain narrow and deterministic.

Rules:

- IPC messages must be explicit about ownership and intent
- synchronization messages must be idempotent where practical
- no message may mutate shared state without an owning contract
- stale messages must be ignored once the generation has changed
- synchronization must not rely on hidden side effects or implicit window state

## Survival Semantics

Survival means the workspace remains truthful enough to keep operating safely.

Rules:

- if one window dies, the system must classify what survives and what must be rebuilt
- survival is not the same as perfect continuity
- surviving state must remain internally consistent
- recovered state must not inherit stale authority claims
- the user must be told when the workspace survived in degraded form

## Human Truth Verification Requirements

Phase 24 requires human verification for any claim that depends on visible window truth.

Required human checks:

- verify which window owns which function
- verify the fallback path is visible when the second window cannot stay alive
- verify project switching does not leak stale state
- verify recovery labels are honest
- verify the stable GUI remains intact and unchanged as the default path

Human verification does not prove:

- hidden promotion is safe
- production readiness exists
- long-session durability is solved
- output-quality, creative-quality, or AI usefulness claims

## No Hidden Promotion Rules

Phase 24 must never smuggle true two-monitor behavior into the product.

Rules:

- the target workflow must be openly declared as the target workflow
- no runtime trick should make the hidden two-monitor path look like the default without a documented decision
- a recovery shim, bootstrap shim, or fallback shim is not a product promotion
- if the product shape changes, that change must be visible in docs, tests, and runtime evidence

## Performance / Stability Boundaries

Phase 24 is a stability phase first.

Boundaries:

- stability outranks polish
- correctness outranks smoothness
- visible truth outranks graceful deception
- any monitor or window churn that risks crashing the shell must be treated as a blocker
- performance work is allowed only when it supports stability, recovery, or truthful routing
- speculative optimization is out of scope

## Failure Classification Matrix

| Class | Meaning | Phase 24 action |
| --- | --- | --- |
| `authoritative break` | runtime truth, ownership, or routing is wrong | stop and fix the contract |
| `stale truth` | a surface shows old session or project data as current | invalidate and repair the generation path |
| `recovery lie` | recovery is shown as complete when it is not | relabel and bound recovery |
| `hidden promotion` | a hidden or fallback surface behaves like a default product surface | stop and remove the promotion behavior |
| `single-monitor fallback` | the split workspace degraded to one monitor as designed | keep visible and labeled, not silently normalized |
| `operator-visible failure` | the user can see a failure but authority remains intact | document, classify, and decide whether to retry |
| `unverified suspicion` | no proof that the issue exists in the runtime lane | defer until evidence exists |

## Scope and Batches

### `24A` Authority and truth contract

- define the window ownership hierarchy
- define runtime truth, derived truth, and deferred truth
- define session generation invalidation and project-switch semantics
- define what each window may read and mutate

24A status: complete as an authority, pairing, lifecycle, and secondary-launch foundation slice. This slice proved the experimental Split Command path can carry explicit authority, generation, and pair identity into a hidden secondary BrowserWindow launch hook without changing the stable/default GUI path. It did not prove physical two-monitor placement, reconnect/recovery, focus routing, or broad IPC synchronization; those remain deferred to later batches.

### `24B` Recovery and fallback contract

- define single-monitor fallback behavior
- define recovery visibility rules and survival semantics
- define retry / recovery bounds
- define hidden-window prevention rules for bootstrap and failure recovery

24B status: complete as a bounded recovery and fallback slice. The experimental Split Command path now classifies secondary loss, primary collapse, teardown/orphan prevention, and bounded rebuild blocking in the main process without adding reconnect choreography, monitor placement, focus routing, broad IPC synchronization, or visible recovery UI. This is not physical two-monitor proof; it is fallback-state and recovery-bound proof only.

### `24C` Cross-window routing and mutation contract

- define focus and input routing rules
- define shared mutation and undo authority
- define IPC and synchronization constraints
- define atomic cross-window update expectations

24C status: complete as a cross-window routing, mutation authority, and bounded IPC/sync slice. The experimental Split Command path now classifies focus ownership, input ownership, shared mutation/undo authority, and explicit ownership-sync messages in the main/preload seams with stale-generation rejection and atomic state transitions. No monitor placement, reconnect choreography, save/export routing, or broad IPC mesh was added, and the stable/default GUI path remains protected.

### `24D` Validation, proof, and closure review

- classify what is runtime-proven, harness-proven, and human-proven
- verify that no hidden promotion path exists
- verify the stable GUI remains sacred/default
- verify remaining gaps are explicitly deferred rather than hidden

24D status: complete as a validation/proof/closure review slice. Phase 24 now has explicit closure notes for 24A through 24D, the stable GUI remains the sacred/default path, and Split Command remains experimental and flag-gated. The documented proof claims stay bounded: no physical two-monitor proof, no monitor placement proof, no reconnect proof, and no broad IPC mesh proof.

## Files / Surfaces Expected During Implementation

The future implementation work for Phase 24 is expected to touch the runtime surfaces that own the split workspace, window orchestration, session truth, and recovery plumbing.

Likely surfaces include:

- `app/main/`
- `app/renderer/`
- `app/shared/`
- `app/types/`
- any explicit test or harness files needed to prove cross-window truth

This list is not exhaustive and does not limit implementation to documentation files.

## Validation / Proof Rules

Validation must match the risk.

Required proof lanes:

- runtime proof for actual window behavior
- harness proof for deterministic authority and routing behavior
- human proof for visible truth, fallback, and recovery behavior

Rules:

- docs-only planning does not count as runtime proof
- a green test lane does not prove hidden promotion safety unless the test actually exercises that contract
- human proof is required for any visible truth claim that cannot be fully asserted in automation
- if proof and runtime evidence conflict, runtime evidence wins and the claim stays deferred

## Exit Criteria

Phase 24 can only close when all of the following are true:

- window authority is explicit and stable
- persistence authority is explicit and stable
- session generation invalidation works and stale generations are not allowed to mutate state
- single-monitor fallback is visible and honest
- recovery states are visible and bounded
- project switches are atomic at the semantic level
- shared mutations and undo have a single authority owner
- hidden-window promotion does not exist
- cross-window truth stays consistent or visibly deferred
- focus and input routing follow the correct window authority
- IPC and synchronization stay constrained to explicit ownership
- survival semantics are documented and proven
- human truth verification is complete for the visible claims being made
- Phase 24A-24D evidence exists for the lane being claimed
- stable GUI remains the sacred/default path
- Split Command remains experimental and flag-gated unless a later explicit decision changes that status

## Assumptions

- The dock floating panes that already exist in the app are separate dock infrastructure, not evidence that true two-monitor behavior already exists.
- Phase 24 should treat the existing stable GUI as the canonical default until a new product decision is explicitly implemented and verified.
- If later inspection contradicts an initial classification, Phase 24 execution updates the matrix rather than forcing evidence to match the desired target.
