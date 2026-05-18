# Phase 20 - Split Command GUI Foundation Plan

Status: Canonical scope artifact
Date: 2026-05-18

## Summary

Phase 20 is a one-window shell-foundation phase. It does not add story intelligence, AI panels, notes/chat, or two-monitor behavior.

Its purpose is to turn Split Command from a flagged wrapper into a stable shell foundation with:

- explicit shell-owned authority boundaries
- enforceable mutation rules
- defined subscription and event lifecycle ownership
- predictable one-window layout behavior
- a shell-specific persistence and invalidation model
- safe stable-GUI fallback and mode separation
- enough diagnostics and truth visibility to support later phases without inventing feature surfaces early
- explicit lint and test closure rules before the phase can close

Phase 20 extracts ownership boundaries incrementally from `app/renderer/App.tsx`. It is not a renderer rewrite, hidden-app migration, or broad hierarchy replacement campaign.

## Execution Progress - 2026-05-18

Completed grouped pass:

- `20B` layout and pane ownership first implementation
- `20E` spatial breathing and constrained-width degradation first implementation
- `20D` flicker classification and lightweight layout instrumentation only
- `20D` continuation pass for shell event-lifecycle governance and narrow churn bounding
- `20D` continuation pass for shared observer classification and project/scene synchronization churn bounding
- `20C` and `20G` validation-hardening pass for shell persistence, reset, invalidation, and mode separation
- `20G` shell failure classification and fallback-state pass

Implemented runtime decisions in this pass:

- Writing Studio is the primary one-window working surface.
- Command Center degrades first when viewport width is constrained.
- The first degraded surfaces are secondary and tertiary placeholder/supporting panels, not Story Navigation and not the wrapped stable writing surface.
- Condensed mode is shell-owned layout state driven by the Split Command shell boundary in `App.tsx`.
- The shell emits a narrow layout-mode diagnostic event when condensed/full mode changes.

Deferred from this pass:

- finer command-panel admission rules beyond the current placeholder cluster boundary
- any richer diagnostics console
- any broad flicker remediation not proven by narrow instrumentation
- any attempt to make shared service-health observers shell-owned instead of explicitly inherited
- any promotion of Split Command beyond explicit flag-on mode

## Shell Lifecycle Ownership Table

| Surface | Owner | Creation point | Cleanup point | Project switch | Flag off / mode exit | Renderer reload | Current posture |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Split Command resize listener | Split Command shell boundary in `App.tsx` | Split Command mode effect in `App.tsx` | same effect cleanup removes `resize` listener | stays active, recomputes from live viewport | listener removed and shell refs reset | recreated cleanly on remount | governed in this pass |
| Shell persistence hydration read | Split Command shell boundary in `App.tsx` | Split Command mode effect on activation/path change | no live subscription; one-shot read only | re-read by project path | skipped when mode is off | re-read on fresh mount | governed in first-cut plus this pass |
| Shell persistence write | Split Command shell boundary in `App.tsx` | shell-state write effect after hydration | no listener; effect stops when mode is off | writes new project-keyed payload | stopped when mode is off | resumes from fresh state on mount | governed with duplicate-write guard in this pass |
| Project/scene synchronization | Split Command shell boundary in `App.tsx` | shell effects reacting to project path and active scene | effect cleanup by React lifecycle only | invalidates on project change | disabled when mode is off | recreated on remount | governed, still a flicker risk candidate |
| Layout-mode diagnostics emission | Split Command shell boundary in `App.tsx` | resize handler when condensed/full mode actually changes | piggybacks on resize-listener cleanup | continues with current project because it is viewport-owned | disabled when mode is off | recreated on remount | governed in this pass |
| Draft preview storage listener | stable writing surface / existing draft sync lane in `App.tsx` | draft sync effect | removes `storage` listener in cleanup | keyed by project path | not Split Command-specific | recreated on remount | classified as inherited, unchanged |
| Service-health polling interval | `useServiceHealth.ts` shared service-health hook | polling effect in `useServiceHealth.ts` | clears interval in cleanup | shared health state continues independent of shell mode | disabled by stable-home/visual-home/test freeze paths, not by Split Command mode alone | recreated on remount | classified, unchanged in this pass |
| Service-health test event listeners | `useServiceHealth.ts` shared service-health hook | event-listener effect in `useServiceHealth.ts` | removes window/document listeners in cleanup | independent of project | disabled by stable-home/visual-home paths, not Split Command mode alone | recreated on remount | classified, unchanged in this pass |

Current ownership conclusion:

- `useServiceHealth.ts` remains a shared inherited observer lane.
- Split Command may consume its derived health state, but does not own its polling interval or test-event listeners.
- Future shell-specific health diagnostics must wrap the shared lane explicitly rather than mutating or duplicating it inside the shell boundary.

Future rule:

- Any future Split Command-specific observer must declare owner, create path, cleanup path, project-switch behavior, mode-exit behavior, and whether it persists or resets before admission.

## Hard Architectural Rules

- No component may mutate shell-owned state except through named shell-owned actions or reducers.
- Every shell state surface must be classified as one of:
  - `authoritative shell state`
  - `mutation-authorized shell state`
  - `derived shell state`
  - `read-only inherited state`
- No panel-local persistence may write directly into shell-owned persistence.
- No diagnostics surface may mutate shell-owned layout, mode, or persistence state.
- No future panel may be admitted without explicit ownership, persistence, authority, and spatial-priority rules.
- Stable GUI and Split Command are separate application modes, not alternate render branches of one mutable state world.

## Mutation Authority Model

### State Classes

- `authoritative shell state`
  - shell mode identity
  - shell-local persistence payload
  - shell-local collapse and visibility decisions
  - shell-local warnings and degraded-mode notices
- `mutation-authorized shell state`
  - shell state that may change only through named shell actions or reducers
- `derived shell state`
  - values recomputed from authoritative shell state or inherited inputs
  - never written directly
- `read-only inherited state`
  - project data, stable GUI internals, and bridge data still owned elsewhere

### Required panel declaration

Every current or future shell surface must declare:

- what state it reads
- what state it writes
- whether it may dispatch shell mutations
- what invalidates it

This rule applies to Story Navigation, diagnostics, future Command Center panels, future Writing Studio adjunct surfaces, and future AI/intelligence surfaces.

## Subscription and Event Lifecycle Governance

Every subscription, poll, listener, interval, and future stream must declare:

- owner
- creation point
- cleanup point
- project-switch behavior
- flag-off behavior
- renderer reload behavior
- whether it persists or resets

Hard rule: no long-lived shell observer may exist without an explicit invalidation and cleanup path.

Phase 20 treats flicker investigation as partly a subscription-lifecycle problem, not only a render-performance problem.

## Shell Mode Identity

Stable GUI and Split Command are separate application modes.

### Shared state

- loaded project data from stable internals
- shared bridge health inputs
- existing workflow data that remains owned by stable internals

### Mode-specific state

- Split Command shell-local persistence
- Split Command shell warnings and degraded notices
- Split Command shell layout and panel decisions
- stable GUI local persistence owned by existing stable surfaces

### Never leak between modes

- shell-local persistence into stable GUI persistence
- stable GUI persistence assumptions into Split Command shell state
- panel-local shortcuts into shell persistence

### Mode rules

- flag off: stable GUI remains canonical startup mode
- flag on: Split Command may activate only through the explicit runtime flag
- mode switches must define carry or clear behavior explicitly
- the operator must be able to tell which mode is active
- tests must keep proving stable GUI remains the default
- current proof:
  - stable GUI ignores shell-local persistence entirely when the Split Command flag is off
  - valid same-project shell state restores under Split Command reopen
  - flag-off after Split Command returns cleanly to stable GUI mode without reusing shell-local status surfaces

## Diagnostics Classification

Diagnostics is:

- `debug-only foundation` in Phase 20
- a possible future runtime-truth or operator-visibility surface later

Phase 20 does not build a full diagnostics system. It does define that diagnostics may later surface:

- active project state
- runtime config
- backend/service state
- recent operations
- warnings
- shell mode
- layout and persistence status

Hard rules:

- diagnostics must not become an always-on noisy panel
- diagnostics must not become a second service-health system
- diagnostics must not become a hidden mutation source
- diagnostics must not become a competing truth surface with different authority rules

Reuse or controlled wrapping of the existing diagnostics concept in `ProjectHome` is preferred over inventing a second diagnostics lineage.

## Anti-Fragmentation Rule

Before any new panel or surface is added in Phase 21+, it must justify:

- owner
- authority level
- data source
- persistence behavior
- spatial priority
- cognitive cost
- fallback behavior
- why it should not be merged into an existing surface

Hard rule: every feature does not automatically deserve its own panel.

This rule exists to prevent panel sprawl, redundant side surfaces, mode confusion, and low-authority widgets masquerading as core workspace structure.

## Shell Failure Classification

Phase 20 recognizes these shell failure classes:

- `recoverable shell failure`
- `non-recoverable shell failure`
- `corrupted shell persistence`
- `unsupported shell schema`
- `unsafe shell state`
- `forced stable-GUI fallback`
- `degraded shell mode`

### Fallback policy

- corrupted or unsupported shell persistence: reset shell-local state and continue safely; never reuse stable GUI state implicitly
- unsafe shell state: do not keep running with ambiguous truth; prefer controlled fallback
- non-recoverable shell failure: force stable fallback if possible; never continue silently in bad state
- degraded shell mode: operator-visible and non-promotional, never hidden
- current proof:
  - corrupted persistence triggers a shell-local reset notice and rewrites shell persistence from fresh state
  - unsupported schema triggers a shell-local reset notice and rewrites shell persistence from the current project and active scene
  - stale cross-project shell state resets selected scene and diagnostics-open state instead of leaking them into the next project

### Failure classification table

| Failure class | Current handling | Proof posture |
| --- | --- | --- |
| `recoverable-shell-failure` | implemented as a shell-local reset for project-identity mismatch; selected scene and diagnostics-open state reset, stable GUI remains isolated | proven in tests |
| `corrupted-shell-persistence` | implemented as a shell-local reset plus shell-local notice; persistence is rewritten from fresh shell state | proven in tests |
| `unsupported-shell-schema` | implemented as a shell-local reset plus shell-local notice; persistence is rewritten from fresh shell state | proven in tests |
| `unsafe-shell-state` | classified only; intended future policy is controlled fallback rather than ambiguous continued shell execution | policy-only |
| `non-recoverable-shell-failure` | classified only; intended future policy is safe fallback rather than silent bad shell state | policy-only |
| `forced-stable-gui-fallback` | classified only; no broader runtime fallback path is implemented in this pass | policy-only |
| `degraded-shell-mode` | classified only; no broader degraded-mode runtime surface is implemented in this pass | policy-only |

## Incremental Extraction Constraint

Phase 20 may extract a shell-owned composition boundary incrementally.

Phase 20 must not:

- rewrite the renderer hierarchy in one pass
- fork the whole app shell
- migrate all stable GUI internals
- create a parallel app architecture
- destabilize the stable GUI

Hard constraint: shell-boundary extraction is incremental ownership work, not a renderer rewrite campaign.

## Slice Structure

### 20A - Shell Architecture Truth Audit and Mutation Authority Model

- Objective: map the current Split Command branch, define the target shell boundary, and formalize state and mutation authority
- Closure: explicit shell boundary plus explicit mutation-authority matrix

### 20B - Layout and Pane Ownership Model plus Anti-Fragmentation Rule

- Objective: define pane ownership, visibility, collapse behavior, and future-surface admission rules
- Current first-cut decision:
  - Writing Studio owns primary width.
  - Story Navigation remains the durable command surface.
  - Supporting placeholder panels are the first surfaces to collapse under width pressure.
  - On narrow one-window layouts, Writing Studio may render ahead of Command Center in spatial order.
- Closure: pane ownership map, space-priority rules, anti-fragmentation rule

### 20C - Workspace State and Persistence Model

- Objective: define shell persistence across reload, reopen, project switch, restore, flag toggle, and incompatible schema
- Current proven behavior:
  - same-project reopen restores valid shell-local scene selection
  - project-path changes invalidate project-specific shell state before rewrite
  - corrupted and unsupported shell persistence reset safely
  - shell-local diagnostics-open state is project-scoped and does not survive project-path changes
- Closure: persist/reset/never-persist matrix plus invalidation and version rules

### 20D - Render Stability, Flicker Investigation, and Subscription Governance

- Objective: classify flicker sources and define lifecycle governance for subscriptions, polling, and listeners
- Current classification:
  - likely source 1: shell layout-mode churn from viewport/listener transitions
  - likely source 2: shell re-render cascades from project/scene synchronization in `App.tsx`
  - likely source 3: service-health and debug observers, which remain outside this pass unless evidence ties them directly to Split Command churn
- Current implementation posture:
  - add only lightweight layout-mode instrumentation with explicit listener cleanup
  - do not claim flicker fixed without reproducible proof
- Current narrow fixes:
  - resize-listener ownership now stays on a single Split Command effect instead of rebinding on shell layout-state changes
  - shell persistence writes now skip duplicate payload writes when nothing material changed
  - layout-mode diagnostics now emit only when condensed/full state actually changes
  - scene-selection state writes now bail out when project/scene identity is unchanged across Story Navigation, active-scene callbacks, and inherited draft-preview sync
  - `scene.select.commit` diagnostics now emit only when the committed project/scene snapshot actually changes
- Current shared-observer classification:
  - `useServiceHealth.ts` polling and test listeners are inherited/shared observers, not shell-owned observers
  - Split Command-specific work in Phase 20 is limited to not adding duplicate health listeners and not misclassifying shared observer churn as shell-local cleanup debt
- Closure: ranked flicker hypotheses and a shell subscription governance model

### 20E - Spatial Breathing, Density, and Responsive Layout

- Objective: define one-window spatial rules that stop layout cramming and panel fighting
- Default: Writing Studio remains the primary working surface; Command Center degrades first
- Current first-cut rule:
  - desktop wide: two-column shell with a capped Command Center width and primary Writing Studio width
  - constrained desktop: shell-owned condensed mode narrows Command Center and hides supporting placeholder panels
  - narrow/mobile: Writing Studio renders first, Command Center second, and command-side height is capped before writing-space collapse
- Closure: explicit priority and collapse model

### 20F - Diagnostics and Operator Debug Surface Assessment

- Objective: classify diagnostics correctly for Phase 20 and later phases
- Closure: clear current posture plus future-authority note

### 20G - Fallback, Deactivation, Safety Model, and Shell-Mode Identity

- Objective: define shell/stable mode identity, separation, fallback, and failure handling
- Current proven behavior:
  - stable GUI remains the default and ignores shell-local storage when the Split Command flag is off
  - Split Command reset notices stay inside the shell mode and do not appear on the stable GUI path
  - turning the Split Command flag off after shell use returns the renderer to stable GUI mode without shell-state poisoning
- Current policy-only gaps:
  - no broader runtime forced-stable fallback path exists yet for non-recoverable shell activation failure
  - no dedicated degraded-shell runtime surface exists yet beyond classification and documentation
  - unsafe shell state is classified, but there is no broader runtime detector beyond the narrow persistence and project-identity resets already implemented
- Closure: explicit mode identity model and shell failure classification model

### 20H - Phase 21 Readiness Gate

- Objective: block Command Center expansion until foundation truth is complete
- Closure: written readiness contract

### 20I - Closure and Architecture Decision

- Objective: end with an explicit architecture decision and execution posture
- Current recommended outcome: continue shell as foundation, but only with incremental ownership extraction and explicit shell-state governance

## Failure Prevention Matrix

| Likely failure | Prevention rule | Detection method | Owning slice |
| --- | --- | --- | --- |
| Flicker loop | Every poll/listener has lifecycle ownership and invalidation | targeted instrumentation, operator witness, targeted renderer checks | `20D` |
| Layout cramming | Writing Studio priority and collapse rules are explicit | viewport checks, operator smoke | `20E` |
| Corrupted persisted shell state | shell persistence is versioned and invalidated safely | reload/reopen tests, bad-state reset tests | `20C`, `20G` |
| Stable/Split mode leakage | mode-specific vs shared state is declared | mode-switch tests, fallback smoke | `20C`, `20G` |
| Duplicate subscriptions | no shell observer without owner/create/cleanup rules | instrumentation, render diagnostics | `20D` |
| Stale project identity | shell state keys and invalidates by project identity | reload/reopen/project-switch tests, operator smoke | `20C`, `20G` |
| Placeholder appearing real | placeholder honesty remains explicit and non-authoritative | renderer assertions, operator smoke | `20A`, `20F`, `20H` |
| Diagnostics becoming noisy truth competitor | diagnostics stays debug-only and cannot become a second truth surface | visibility review, operator smoke | `20F` |
| Panel sprawl | new surfaces require panel-admission justification | plan gate review | `20B`, `20H` |
| Fallback failure | each shell failure class maps to explicit fallback | flag-off and bad-state tests, operator smoke | `20G` |

## Hard Non-Goals

Phase 20 must not:

- build emotional pulse, narrative health, constellation, thread timeline, or other Phase 21 panels
- build AI Companion, contextual intelligence, trust-calibration surfaces, or analysis warnings
- build notes/chat/quick insert/focus mode/right-side writing tools
- build true two-monitor or detached Split Command workflow
- migrate Split Command to default
- replace the stable GUI
- rewrite the whole renderer
- perform broad CSS or design-system migration
- change generation, backup, restore, or export contracts unless a direct shell-foundation bug forces a narrow fix
- create panel-local mutation or persistence shortcuts around shell authority paths

## Test Strategy

Execution proof remains narrow:

- runtime config default-off remains `false`
- flag-on Split Command still launches in renderer tests and packaged Electron smoke
- stable GUI remains default and unaffected
- shell-owned state changes only through defined authority paths
- shell subscriptions and listeners do not duplicate or survive invalidation incorrectly where testable
- shell layout renders predictably in one-window mode
- shell persistence obeys persist/reset/never-persist rules
- project identity survives reload/reopen/project switch as defined
- shell failure classes fall back as defined
- stable GUI state is unaffected by shell mode use

Recommended proof lanes:

- renderer tests for authority-path mutations
- renderer tests for mode-leak prevention
- narrow Playwright smoke for reload, reopen, project identity, and fallback
- targeted instrumentation assertions for service-health and listener cleanup where practical

## Validation Closure Rule

Phase 20 cannot close unless validation includes:

- `pnpm --filter app lint`
- targeted renderer and shell-helper tests for touched shell surfaces
- `pnpm --filter app test -- AppPreflight.test.tsx SplitCommandWorkspace.test.tsx splitCommandShellState.test.ts useServiceHealth.test.tsx`
- targeted Playwright smoke if E2E surfaces change
- `git diff --check`
- `git diff --cached --check`
- `git status --short`

If Python or docs are touched during execution, include repo-correct Python or docs checks as applicable.

## Human Verification Model

- launch stable GUI without flag
- confirm stable GUI is still default and identity is correct
- launch Split Command under temporary `BLACKSKIES_CONFIG_PATH`
- observe flicker and layout pressure for a few minutes
- check Story Navigation clarity
- check diagnostics usefulness versus noise
- reload or reopen if persistence changes are implemented
- remove flag and confirm stable GUI returns
- capture screenshots only for weird or failure states

## Phase 21 Readiness Gate

Phase 21 implementation must not start until all are true:

- Split Command has a shell-owned composition boundary in `App.tsx`
- shell state is classified into authoritative, mutation-authorized, derived, and read-only inherited
- no shell-owned state mutates outside defined authority paths
- shell subscription lifecycle ownership is defined and implemented
- shell persistence, reset, and invalidation rules are implemented and tested
- shell/stable mode identity separation is implemented and tested
- implemented shell fallback paths are proven, and policy-only fallback classes are explicitly documented as not yet runtime-backed
- project identity survives reload, reopen, and project switch cleanly for the implemented shell persistence lane
- worst flicker source is classified; long-session durability may remain an explicit deferred risk, but it must not be misrepresented as solved
- layout priority rules prevent panel fighting in one-window mode
- diagnostics posture is chosen and does not fork into competing surfaces
- anti-fragmentation rule is in place for any new panel proposal

Phase 21 planning may begin once Phase 20 closure review is accepted and the remaining policy-only or deferred items are explicitly carried forward without being hidden.

## Recommended First Execution Goal

`20A + 20C + 20G first cut`

- extract a shell-owned boundary incrementally from `App.tsx`
- define shell authority paths
- isolate shell/stable mode identity
- define shell-local persistence and invalidation contract
- implement safe fallback for bad shell state and flag-off mode
- leave diagnostics debug-only
- do not add new feature panels yet

## Assumptions and Defaults

- Phase 20 extracts a shell-owned boundary, not merely a harder wrapper
- extraction is incremental and must not become a renderer rewrite
- diagnostics is debug-only now, but may later evolve into a truth or authority surface
- Writing Studio retains spatial priority under constrained width
- backend drops remain Phase 25 unless stable GUI reproduces them too
