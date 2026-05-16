Canonical role: Phase 17 GUI authority simplification plan.
Scope: Plan and scope Phase 17 GUI authority cleanup before any implementation begins. This artifact defines the operational model, slice boundaries, proof expectations, human-verification rules, stop gates, and Phase 18 readiness criteria for the current GUI only.
Owns: Phase 17 slice structure, authority hierarchy, operation ownership rules, concurrency policy, stale-state invalidation rules, trust-surface standardization rules, trust severity classification, human-verification model, closure criteria, and Phase 18 readiness gate.
Does not own: Phase 18 hidden two-monitor GUI activation, Phase 19 hygiene/repository cleanup, backup/restore backend behavior, memory-system expansion, async/job architecture, or broad GUI redesign.
Upstream dependencies: [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase16_closure_review.md](/C:/Dev/black-skies/docs/audits/phase16/phase16_closure_review.md), [phase16_ui_runtime_drift_audit.md](/C:/Dev/black-skies/docs/audits/phase16/phase16_ui_runtime_drift_audit.md), [phase16_service_health_authority_audit.md](/C:/Dev/black-skies/docs/audits/phase16/phase16_service_health_authority_audit.md), [phase16_runtime_truth_audit.md](/C:/Dev/black-skies/docs/audits/phase16/phase16_runtime_truth_audit.md), [phase15_closure_review.md](/C:/Dev/black-skies/docs/audits/phase15/phase15_closure_review.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
Downstream dependencies: any bounded Phase 17 implementation slice, any future Phase 18 migration-gate work, and any later deferred-work reconciliation for GUI or identity cleanup.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 17 GUI Authority Simplification Plan

## 1. Purpose

Phase 17 simplifies the current GUI authority surface so the operator stops being told too much, too broadly, or too early.

The phase exists because prior work already showed the failure modes:

- renderer optimism
- preload timeout ambiguity
- backend completion after UI timeout
- stale health banners
- restore success language diverging from filesystem state

Phase 17 is not a redesign campaign. It is a truth-surface cleanup pass.

## 2. Authority and Operation Model

### 2.1 Authority hierarchy

Authority is resolved in this order:

1. Filesystem / materialized result
2. Backend route result
3. Preload / transport state
4. Renderer / UI state
5. Cosmetic banners / toasts

Rule: UI must never overrule backend or filesystem truth. If those disagree, the UI must reflect the lower-confidence state, not assert a stronger one.

### 2.2 Operation ownership

Operation ownership is separate from authority hierarchy:

- backend owns execution truth
- filesystem owns completion truth
- preload owns transport truth
- renderer owns presentation truth only

Rule: renderer must never synthesize completion independently.

### 2.3 Lifecycle states

Phase 17 standardizes the following operation lifecycle vocabulary for trust-sensitive flows:

- `idle`
- `checking`
- `running`
- `degraded`
- `timed_out_unknown`
- `completed_verified`
- `completed_unverified`
- `failed`
- `recovered`

These states are the shared language for backup, restore, recovery, snapshot verification, export, and any future trust-sensitive operation.

### 2.4 Freshness rules

Truth-sensitive labels must expose freshness context when timing matters.

- `verified`, `latest`, `current`, and `healthy` are time claims and must be scoped accordingly
- unknown freshness must display degraded or checking state, not success
- operations that mutate project state invalidate dependent UI state
- stale data must not present as current truth
- freshness ownership must be explicit when a flow can still be completing after the UI times out

### 2.5 Concurrency policy

Phase 17 must define contention behavior for every operator-visible operation it touches.

Policy requirements:

- define whether operations are serialized, rejected, or queued
- define visible busy-state ownership
- define duplicate-click behavior
- define recovery behavior after interrupted operations
- define what happens if restore overlaps with backup, verification, or another restore

### 2.6 Multi-surface contradiction rule

One operation may not communicate contradictory authority states across simultaneous surfaces.

Toast, banner, modal, pill, disabled state, and filesystem result must not tell different stories about the same action.

If surfaces disagree, the UI must downgrade to the least certain truthful state until the underlying operation is reconciled.

## 3. Trust Surface Standards

### 3.1 Trust surface standardization

Phase 17 does not merely replace `window.confirm`. It standardizes how the GUI expresses trust.

Rules:

- destructive or risky operations require scoped confirmation surfaces
- passive status changes do not
- timeout ambiguity must use warning-class styling
- degraded completion must never use success-class styling
- trust wording may clarify uncertainty, but it must not conceal unresolved runtime ambiguity
- wording fixes cannot substitute for lifecycle fixes

### 3.2 Trust severity classification

Phase 17 should prioritize trust issues by severity:

- `Critical`: wrong project identity, overwrite ambiguity, false restore completion, false success after timeout, stale state presented as current
- `Major`: stale verification state, misleading offline wording, interrupted-operation ambiguity, duplicate-operation ambiguity
- `Minor`: cosmetic inconsistency, vague labels without operational consequence

This classification is for prioritization, not for relabeling runtime truth.

### 3.3 Visual consistency classification

- authority-impacting inconsistency: a visual mismatch that changes operator trust or implies the wrong state
- cosmetic inconsistency: visual debt that does not affect trust semantics

Phase 17 fixes authority-impacting inconsistency only unless a cosmetic issue blocks authority clarity.

## 4. Slice Structure

### 17A - GUI Authority Inventory

Objective:

- inventory every user-facing label, banner, toast, modal, confirm, disabled state, and status indicator that implies operational truth
- classify each as accurate, misleading, stale, too broad, or deferred

Likely surfaces:

- `app/renderer/App.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/hooks/useRecovery.ts`
- `app/tests/e2e`
- `app/renderer/__tests__`

Allowed changes:

- inventory docs
- test mapping
- narrow follow-up fixes only after classification

Forbidden changes:

- runtime redesign
- hidden GUI enablement
- broad refactors

Required evidence:

- source inspection
- targeted tests
- operator-visible examples when needed

Runtime vs harness proof:

- read-only classification only

Human verification:

- not required for inventory alone

Stop gate:

- any trust-sensitive surface not classified

Closure criteria:

- every surface has a status and next action

### 17B - Service Health / Writing Tools Wording Simplification

Objective:

- separate backend-unavailable from writing-tools-unavailable
- stop global health wording from poisoning backup/restore/snapshot meanings

Likely surfaces:

- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/ServiceStatusPill.test.tsx`
- `app/renderer/__tests__/useServiceHealth.test.tsx`

Allowed changes:

- scoped copy changes
- state-label changes

Forbidden changes:

- backend behavior changes
- making local browsing look unavailable

Required evidence:

- unit tests
- one e2e health-state pass

Human verification:

- one click-through of each visible health state

Stop gate:

- any label still reads like a product-wide outage when only backend reachability is affected

Closure criteria:

- wording reflects actual runtime state and does not overstate scope

### 17C - Trust Surface Standardization

Objective:

- standardize how risky, destructive, ambiguous, interrupted, and completion-sensitive operations communicate authority

Scope includes:

- scoped confirmation surfaces for destructive or risky actions
- warning-class styling for timeout ambiguity
- degraded completion never using success-class styling
- interrupted-operation recovery audit
- consistent toast/banner/modal semantics across the same lifecycle
- visible busy-state ownership for concurrent or duplicate actions

Likely surfaces:

- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`

Allowed changes:

- narrow modal replacement
- scoped confirmation rules
- contention handling
- trust-surface wording alignment

Forbidden changes:

- global modal-system migration
- authority-neutral cosmetic rewrites

Required evidence:

- confirm-path unit coverage
- interrupted-operation recovery coverage
- an e2e restore-confirm path

Human verification:

- one real-project restore-confirm path
- one interrupted-operation recovery check if the current GUI can reproduce it

Stop gate:

- any risky action still bypasses the styled authority surface
- any timeout or degraded outcome is styled as success
- duplicate clicks create ambiguous completion state

Closure criteria:

- all trust-sensitive operations use one coherent authority language under contention and interruption

### 17D - Project Identity / Alias Presentation

Objective:

- make human-readable project identity distinct from technical ID, filesystem root, and restored-copy status

Explicit rules:

- display name: human-readable project title
- technical ID: hidden by default, visible only in diagnostics/details
- filesystem root: shown only when operationally relevant
- restored copies: visually labeled as restored clones and never made visually equivalent to the primary project
- restored copy identity must never be presented as the primary root without explicit context

Likely surfaces:

- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/App.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/tests/e2e/startup_authority_contract.spec.ts`
- `app/renderer/__tests__/ProjectHome.test.tsx` if present

Allowed changes:

- display-only copy and label/context changes

Forbidden changes:

- path normalization
- alias generation
- persistence semantics changes
- adding extra identifiers just to make the UI feel “clearer”

Required evidence:

- unit coverage
- e2e continuity coverage

Human verification:

- one reopen/switch pass confirming displayed identity matches the loaded root

Stop gate:

- the UI can still plausibly mislead the operator about which root is active

Closure criteria:

- identity is legible enough that the wrong project root is not easy to trust accidentally

### 17E - Snapshot / Restore / Export Trust Wording Polish

Objective:

- align trust-sensitive buttons, toasts, and modal text with Phase 14-16 authority rules without concealing runtime ambiguity

Rule:

- wording may clarify uncertainty, but it must not substitute for lifecycle correctness or hide unresolved runtime ambiguity

Likely surfaces:

- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- relevant e2e flows

Allowed changes:

- copy polish
- disabled-state polish
- status-language polish in snapshots, recovery, and export flows

Forbidden changes:

- hiding timeout uncertainty
- making degraded states sound successful
- changing runtime completion contracts

Required evidence:

- updated unit tests
- updated e2e flows

Human verification:

- one pass through backup, restore, recovery, export, and snapshot verification wording

Stop gate:

- any toast overclaims completion, verification, currentness, or safety

Closure criteria:

- all trust-sensitive verbs are bounded by actual evidence, freshness, and completion state

### 17F - Phase 18 Readiness Gate

Objective:

- define exactly what must be true before the hidden two-monitor GUI can be opened for experimental testing

Allowed changes:

- readiness documentation
- gate tests only

Forbidden changes:

- enabling the hidden GUI
- adding monitor-aware assumptions
- changing its architecture

Required evidence:

- a narrow gate proof that the feature stays off by default

Human verification:

- only confirming the flag remains disabled

Stop gate:

- any unresolved authority lie, unscoped confirm, identity ambiguity, stale-state exposure, or hidden dependency creep

Closure criteria:

- Phase 18 can start only when the current GUI is honest enough for controlled exposure

## 5. Execution Order

Recommended execution order:

1. `17A`
2. `17B`
3. `17C`
4. `17D`
5. `17E`
6. `17F`

Recommended first execution goal: `17A`, because the inventory removes ambiguity before any wording or control-surface edits start.

Parallel-safe only after `17A`:

- `17B` and `17D` can proceed in parallel if file ownership is kept disjoint
- `17C` can proceed alongside test updates once the trust-surface rules are fixed
- `17E` can be folded into the same implementation pass as `17B` or `17C` when the affected flow is the same

Not parallel-safe:

- any Phase 18 work before `17F`
- any GUI polish that hides uncertainty instead of naming it
- any broad refactor before the inventory exists
- any monitor-aware or pane-state assumption introduced under the banner of cleanup

## 6. Proof Model

- harness proof only proves the lane contract and enabled/disabled wiring
- runtime proof is required for any operator-visible claim about backup, restore, recovery, export, or identity
- human verification is mandatory whenever wording or control state could change operator behavior
- green means the targeted GUI surface matches the observed runtime contract for that lane, not that the entire app is trustworthy

### 6.1 Regression-proofing

Every corrected authority semantics change must gain coverage at the unit, e2e, or runtime-proof level appropriate to its risk class.

Future tests must assert the scoped truth boundary, not only the visible text.

Phase 17 is not complete if a corrected trust claim can regress silently in a later pass.

## 7. Human Verification

Keep verification lightweight:

- click the affected flow
- read the wording
- confirm enabled/disabled states
- confirm stale or interrupted states do not pretend to be success
- capture screenshots only for failures or weird states

One real-project pass is required for restore/reopen and any confirm-surface change that can affect operator safety. Interrupted-operation recovery is required if the current flow can be reproduced in the current GUI. The rest can be verified with focused local UI observation and targeted e2e.

## 8. Closure Criteria

Phase 17 closes only when:

- every trust-sensitive GUI surface is either corrected or explicitly deferred
- the global health wording no longer implies unrelated feature outage
- trust-surface standardization is consistent across toasts, banners, modals, confirms, and disabled states
- selected-backup restore no longer relies on an authority-breaking native confirm path
- project identity is visibly distinct enough to avoid root confusion
- stale-state invalidation rules are explicit and test-covered for the flows Phase 17 touches
- concurrency and duplicate-operation behavior are explicit and test-covered for the flows Phase 17 touches
- interrupted-operation recovery behavior is classified and covered where the current UI exposes it
- tests are green
- Phase 18 remains disabled

The phase does not close if the UI still contains unresolved operator-facing ambiguity that could cause opening, restoring, overwriting, or trusting the wrong project state.

## 9. Phase 18 Readiness Gate

Phase 18 may start only after:

- no known closure-blocking authority lies remain in the current GUI
- backup/restore/snapshot/export labels are scoped correctly
- service-health labels are split or documented narrowly
- confirm usage is resolved or explicitly accepted as deferred
- project identity confusion is reduced to a documented exception
- stale-state invalidation and concurrency behavior are explicit for the exposed flows
- tests are green
- the hidden GUI remains off
- there is no unresolved operator-facing ambiguity that could cause opening, restoring, overwriting, or trusting the wrong project state
- Phase 17 did not quietly introduce Phase 18 dependency creep

If any of those remain open, Phase 18 stays blocked.

## 10. Deferred Ownership

Phase 17 does not reassign the existing deferred work model unless the inventory shows a real conflict.

Current deferred ownership remains:

- `RDM-GUI-001`: degraded-state GUI semantics and control-surface simplification
- `RDM-FOCUS-001`: legacy Focus behavior deprecation or obsolescence check
- `RDM-MIGRATE-001`: Phase 18 migration gate
- `RDM-ALIAS-001`: alias / folder naming confusion
- `RDM-CONTINUITY-001`: recovery / project-switch continuity risk
- `RDM-RISK-001`, `RDM-DOCS-001`, and hygiene items remain outside Phase 17 unless the inventory proves otherwise

## 11. Non-Goals

Phase 17 does not:

- enable the hidden two-monitor GUI
- redesign the whole app
- add new story intelligence
- add memory-system expansion
- migrate layout architecture broadly
- rewrite state management
- introduce a CSS or design-system migration
- start animation-system work
- enter Phase 18 visual-systems work
- alter backend backup / restore semantics as a side effect of GUI cleanup
- hide runtime uncertainty with prettier wording

## 12. Assumptions

No roadmap restructuring is expected unless the inventory uncovers a real owner conflict. This planning pass does not change runtime code, does not flip the hidden GUI, and does not require tracker or roadmap edits unless a later execution slice changes ownership or sequencing.
