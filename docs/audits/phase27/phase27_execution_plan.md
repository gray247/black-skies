# Phase 27 Execution Plan: Runtime Truth, Session Lifecycle, and Authoring Continuity

Status: Planning
Date: 2026-05-20

## Phase Objective

Phase 27 defines the authoritative boundaries for runtime truth, session lifecycle, draft authority, persistence authority, and authoring continuity before deeper authoring workflow work begins.

This phase is a contract-definition phase, not an AI quality phase and not a broad persistence rewrite.

## Operating Rules

- Stable GUI behavior remains sacred and default unless a concrete failure proves otherwise.
- Loader/bootstrap authority from Phase 26 remains intact.
- Split Command stays experimental unless later justified with explicit evidence and a separate scope change.
- Fail-closed semantics from Phases 24-25 remain the default for unsupported, partial, corrupt, or recovery-required states.
- No originality, output-quality, or "better writing" claims are part of this phase.
- No broad renderer architecture rewrite is in scope.
- No broad persistence rewrite is in scope.

## 1. Runtime Truth vs Project Truth

Phase 27 must distinguish these two domains explicitly:

- `runtime truth`: what is live in the current session, renderer, main process, and active windows right now
- `project truth`: what is persisted in the project folder and should survive reload, reopen, or session restart

Rules:

- runtime truth may be dirty, partial, unsaved, transient, or recovery-required without changing project truth
- project truth changes only when a persistence boundary accepts a change and writes it durably
- runtime-only state must never be mistaken for persisted project truth
- persisted project truth must not be re-labeled as runtime success until the session actually rehydrates it

Required contract language:

- `runtime-only`: exists only in memory, window state, IPC state, or session-local caches
- `exported`: has left the runtime via an explicit export/save boundary
- `accepted`: runtime state that has crossed the project-authority boundary and is now the persisted truth
- `stale`: runtime state no longer matches current project truth

## 2. Session Lifecycle Ownership

Phase 27 must define which process owns each lifecycle step.

Ownership model:

- `main process`: session bootstrap, window lifecycle coordination, loader authority handoff, recovery classification, and persistence gating
- `renderer`: local UI state, draft editing, visible status, and user intent capture
- `backend/services`: draft generation, critique, accept, export assistance, and any service-side persistence only if explicitly routed through the accepted authority boundary

Session lifecycle steps:

1. bootstrap
2. session attach
3. project load
4. draft hydrate
5. edit/critique/accept
6. save/export
7. reload/reopen
8. recover/fail closed

Rules:

- the main process owns session boundaries and failure classification
- the renderer owns the visible authoring session surface but not persistence authority
- the backend owns service computation, not project truth

## 3. Draft-State Lifecycle and Authority

Draft state must be classified independently from project state.

Allowed draft-state classes:

- `generated`
- `critiqued`
- `accepted`
- `stale`
- `orphaned`
- `partial`
- `dirty`
- `unsaved`
- `runtime-only`

Lifecycle rules:

- `generated` means a draft was produced in the current session or recovery path and has not yet been accepted
- `critiqued` means a draft has been evaluated but not necessarily accepted
- `accepted` means the draft became authoritative project truth
- `dirty` means the runtime draft diverges from the last accepted or persisted truth
- `unsaved` means there is a local change that has not crossed the save/export boundary
- `stale` means the runtime draft no longer matches the latest accepted project truth
- `orphaned` means the draft exists without a valid active scene/project owner
- `partial` means the draft or its backing state exists, but not enough to treat it as fully authoritative
- `runtime-only` means the draft has no persisted counterpart yet

Authority rules:

- acceptance is the only state transition that can promote a draft to project truth
- critique never overwrites project truth by itself
- generation never overwrites project truth by itself
- a stale or orphaned draft must not be silently promoted

## 4. Recovery Semantics and Failure Classifications

Phase 27 must keep recovery explicit and fail-closed by default.

Required recovery classes:

- `recovery-required`
- `partial`
- `unsupported-version`
- `corrupt`
- `invalid`
- `orphaned`
- `stale`

Semantics:

- `recovery-required`: the data may be recoverable, but a normal load must not silently repair it
- `partial`: the state is incomplete or truncated and needs a deterministic repair/recovery decision
- `unsupported-version`: load must fail closed unless a documented migration path exists
- `corrupt`: load must fail closed and surface corruption, not normalize it away
- `invalid`: bootstrap or persistence contract violation
- `orphaned`: the state has lost its owner or project context
- `stale`: the runtime copy is behind the persisted truth or authoritative session state

Recovery rules:

- recovery is explicit, not implicit
- repair may happen only through a named recovery path
- normal load must never mutate data into success silently
- recovery success must preserve the original failure classification in audit logs

## 5. Save / Export Authority Boundaries

Phase 27 must define the difference between save and export.

Definitions:

- `save`: persist the current accepted project truth back into the project authority boundary
- `export`: produce a derivative artifact or package without changing the authoritative project truth unless explicitly defined

Rules:

- save authority belongs to the project/persistence boundary, not the renderer
- export authority belongs to the export workflow and may be read-only with respect to project truth
- a successful export does not imply the draft was accepted
- a successful save does not imply the authoring session is complete
- export must not silently repair project data
- save must not be treated as a quality judgment

## 6. Autosave vs Accepted-Truth Semantics

Phase 27 must define autosave as a persistence convenience, not a truth promotion.

Rules:

- autosave may persist `dirty` or `unsaved` runtime draft changes
- autosave does not convert `generated` into `accepted`
- autosave does not clear `stale` unless the stale source was the local unsaved runtime copy
- autosave does not resolve `recovery-required`
- accepted truth remains the explicit boundary where author intent becomes project truth

Required semantics:

- `accepted` is the authoritative state for project truth
- `autosaved` is a storage state, not a truth-class state
- `unsaved` remains true until the persistence boundary completes successfully

## 7. Dirty-State and Stale-State Rules

Dirty and stale must not be conflated.

Rules:

- `dirty` means local runtime changes are not yet persisted
- `stale` means the local runtime copy is behind the accepted or persisted truth
- a state may be both `dirty` and `stale`, but the system must report both terms distinctly
- a dirty state can be saved
- a stale state may require reload, refresh, or conflict resolution
- stale state must not be silently overwritten without classification

## 8. Runtime vs Persisted Memory Boundaries

Phase 27 must define where memory lives.

Allowed buckets:

- `runtime memory`: React state, window state, in-memory caches, IPC-derived session state
- `persisted memory`: project files, saved metadata, durable story data, explicit recovery artifacts

Rules:

- runtime memory may be discarded on reload or window close
- persisted memory must survive session restart
- cached runtime hints must never overwrite persisted truth unless routed through save/accept
- runtime memory may reference persisted truth, but it must preserve provenance

## 9. Renderer / Backend / Main-Process Authority Ownership

Authority ownership must remain explicit:

| Surface | Owns | Does not own |
| --- | --- | --- |
| Main process | bootstrap, window lifecycle, load/recover classification, persistence gatekeeping | draft authoring semantics, content quality claims |
| Renderer | visible workflow, local editing state, user intent capture | durable truth promotion, silent repair, project identity authority |
| Backend/services | generation, critique, accept assistance, analysis | session authority, project truth authority, window authority |

Rules:

- the renderer can request actions, but it cannot unilaterally redefine project truth
- the backend can compute suggestions, but it cannot silently persist truth outside the accepted contract
- the main process remains the arbiter for project load/recovery/persistence boundaries

## 10. Cross-Window Authoring Continuity Expectations

Phase 27 must define authoring continuity if more than one window or window-like surface is present.

Default rule:

- stable GUI remains the default single-window authoring baseline
- Split Command stays experimental and must not be assumed to exist for the core continuity contract

Continuity expectations:

- the same project truth must be visible across windows when a shared session is intended
- a secondary window must not invent its own competing truth
- draft ownership must be explicit when multiple surfaces can edit or inspect the same project
- cross-window state handoff must classify whether it is live, stale, dirty, or recovered

If Split Command is involved:

- continuity must be documented as experimental
- window-to-window synchronization must preserve authority ownership
- one window cannot promote draft truth without the same persistence boundary as the other

## 11. Explicit Non-Goals and Deferred Items

Phase 27 does not:

- redesign the whole renderer architecture
- add AI quality claims
- claim originality or better writing
- add a broad persistence rewrite
- promote Split Command to default
- change loader/bootstrap authority from Phase 26
- relax fail-closed semantics from Phases 24-25
- implement broad authoring workflow expansion beyond the contract definitions

Deferred items:

- deeper authoring workflow UI redesign
- multi-window product promotion
- broad autosave implementation changes
- new backend persistence model
- quality metrics for generated content

## 12. Human-Validation Requirements

Human validation must prove runtime behavior, not just unit or harness behavior.

Required smoke lanes:

1. launch the app and verify stable GUI baseline
2. load a project and verify project truth matches the visible session
3. make a draft change and verify dirty/unsaved state is visible
4. accept a draft and verify accepted truth is visible after reload
5. trigger a recoverable or recovery-required scenario and verify the classification is honest
6. verify cross-window continuity only if a two-window or split-command path is explicitly in scope for the lane

Human smoke must not rely only on mocked Electron behavior.

## 13. Proof Classifications

Phase 27 must classify evidence explicitly:

- `generated`: produced by the system, not yet promoted
- `critiqued`: reviewed but not accepted
- `accepted`: promoted to project truth
- `stale`: no longer matches current truth
- `orphaned`: missing owner or project context
- `partial`: incomplete but recognizable
- `recovery-required`: requires explicit recovery
- `dirty`: local runtime changes exist
- `unsaved`: not yet persisted
- `exported`: emitted as a derivative artifact
- `runtime-only`: exists only in the live session

Proof classifications for validation:

- `runtime-proven`
- `harness-proven`
- `human-smoke-proven`
- `policy-only`
- `docs-only`

Rules:

- harness proof cannot be overstated as operator proof
- docs-only planning does not count as runtime proof
- human-smoke proof is required for any operator-visible contract claim

## 14. Stop / Escalation Triggers

Stop work and escalate if any of the following appear:

- a persisted state is silently repaired
- a dirty draft is promoted without acceptance
- a stale draft is treated as fresh truth
- an orphaned or partial state is normalized into success
- save/export boundaries become ambiguous
- runtime-only state leaks into persisted truth without an explicit boundary
- cross-window state starts competing rather than synchronizing
- a contract definition would require a broad architecture rewrite
- a contract definition would weaken fail-closed semantics

Escalation rule:

- if the next implementation step would require redesigning persistence or renderer architecture, stop and re-scope before coding

## 15. Definition of Done

Phase 27 is done when:

- runtime truth vs project truth is documented and used consistently
- session ownership is explicit by process/surface
- draft lifecycle states are named and separated from project truth
- recovery semantics are explicit and fail-closed
- save/export authority is bounded
- autosave, accepted truth, dirty, stale, unsaved, and runtime-only semantics are defined
- renderer/backend/main ownership boundaries are unambiguous
- cross-window continuity expectations are documented without assuming Split Command promotion
- non-goals and deferred items are explicit
- human-validation requirements are written before implementation starts
- proof classifications are written before implementation starts
- stop/escalation triggers are written before implementation starts

## 16. Phase 27 Proof Status After Implementation

This section is a planning aid only. It does not broaden scope or claim operator validation.

### Runtime-proven

- None yet from this phase set unless a human runtime smoke is recorded separately.

### Harness / test-lane proven

- `runtime truth` vs `project truth` contract types and validators.
- Renderer read-only session-truth summary in `ProjectHome`.
- Narrow `stale` and `recovery-required` signal mapping from existing loader warnings and failure codes.
- Main-process lifecycle classification snapshots for startup, load success/failure, and graceful shutdown.
- Dirty/unsaved continuity overlay across the renderer/main classification seam.

### Policy-only

- Ownership boundaries between main process, renderer, backend/services, and persisted project files.
- Session-lifecycle naming, draft-state naming, recovery semantics, save/export boundaries, autosave semantics, and cross-window continuity expectations.
- Tracker notes and implementation-plan text.

### Deferred

- Save/export routing.
- Autosave behavior.
- Recovery repair or recovery runtime proof.
- Multi-window promotion and Split Command promotion.
- Backend accept/persistence rewrites.

### Unproven

- Human-visible session truth from an operator launch.
- Stable-GUI smoke confirmation.
- Accepted-truth after reload/reopen.
- Reproducible live stale/recovery-required smoke confirmation.
- Production readiness and output-quality claims.

## High-Risk Files for the Next Phase

Likely files to review first when implementation begins:

- `app/main/main.ts`
- `app/main/projectLoaderIpc.ts`
- `app/main/preload.ts`
- `app/shared/config/runtime.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/docking/*`
- `app/renderer/utils/*` that cache, persist, or classify draft/session state
- `services/src/blackskies/services/*` that touch draft generation, critique, accept, or recovery
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## Expected Validation Lanes

Phase 27 implementation should expect:

- targeted renderer tests for visible session/draft state
- targeted main-process tests for recovery and authority gates
- service tests only if persistence or accept semantics cross into backend contracts
- app lint
- main build
- repo hygiene
- targeted Playwright or Electron smoke for human-visible session truth

## Likely Future Risks If These Contracts Stay Undefined

- accepted truth may be confused with draft generation
- autosave may silently override the wrong authority
- stale or orphaned drafts may be promoted accidentally
- recovery-required states may be flattened into false success
- cross-window continuity may drift into competing truth sources
- export may be treated as save, or save may be treated as export
- runtime-only memory may leak into persisted state without an explicit boundary

## Phase Boundary Note

Phase 27 may begin implementation only after this plan is committed and the implementation slices are mapped to the defined authority boundaries.
