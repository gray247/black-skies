# Project-Switch / Preload Continuity Followup

Status: Produced
Canonical role: Narrow follow-up audit for project-switch, preload-bridge, renderer-rebind, and stale-state continuity seams that can distort deeper implementation work.
Scope: Reclassify the highest-risk continuity seams around project load/switch, bridge state, renderer rebinding, floating-pane rebinding, cache/session carryover, and freshness after switch.
Owns: Follow-up classification for the scoped continuity surfaces and their immediate impact on `Phase 14A.1` and `Phase 14B+`.
Does not own: Runtime fixes, proof doctrine, phase sequencing, deferred-matrix governance beyond any recommendation, or human-verification execution.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

The broader continuity audit established that continuity is closure-critical. This follow-up narrows focus to the seams most likely to distort implementation planning:

- project load
- project switch
- preload bridge state
- renderer rebind
- floating-pane rebind
- localStorage and session continuity
- snapshot/report freshness after switch
- alias-root transition
- draft preview continuity

This pass classifies those seams more precisely. It does not implement fixes.

## Evidence Inspected

- `docs/audits/phase14/recovery_load_project_switch_continuity_audit.md`
- `docs/audits/phase14/human_verification_planning_for_continuity_sensitive_flows.md`
- `docs/audits/phase14/canonical_command_recipe_and_preflight.md`
- `docs/audits/phase14/wrapper_launcher_cwd_audit.md`
- `docs/audits/phase14/cross_system_operational_risk_sweep.md`
- `docs/specs/snapshot_state_vocabulary_and_evidence_contract.md`
- `docs/specs/current_state.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/error_visibility.md`
- `docs/specs/draft_preview_contract.md`
- `docs/specs/pane_lifecycle.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- source/doc search surfaces around:
  - `project switch`
  - `project load`
  - `loadProject`
  - `setDevProjectPath`
  - `overrideServices`
  - `preload`
  - `bridge`
  - `renderer`
  - `rebind`
  - `floating pane`
  - `hydration`
  - `localStorage`
  - `session`
  - `cache`
  - `snapshot`
  - `verified`
  - `stale`
  - `orphan`
  - `alias`
  - `Esther_Estate`
  - `proj_esther_estate`
  - `manifest`
  - `report`
  - `freshness`
  - `restore latest`
  - `draft preview`
  - `recovery`
  - `reload`
  - `continuity`

## Continuity Surfaces Inspected

- project loader and recent-project bootstrapping
- project-switch and active-scene rebinding
- preload bridge and harness-only startup hooks
- renderer hydration and project-ready assumptions
- floating-pane state and draft-preview sync
- localStorage/session persistence
- report and snapshot freshness after root changes
- alias-root transitions and path identity

## Risk Table

| Surface | Evidence found | Risk class | Authority layers affected | Known uncertainty | Impact on Phase 14A.1 | Impact on Phase 14B+ | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| project load | project-load remains `mixed` in the capability truth surfaces; recent-project and fallback loaders still influence which root gets loaded first | Observed risk | `A1`, `A3`, `A4` | load success may still depend on stale recent-project or fallback path assumptions | Does not block vocabulary planning | Constrains implementation claims involving current root truth | Keep under `RDM-CONTINUITY-001`; require later human verification |
| project switch | pane lifecycle and prior tracker history still show stale-pane and cross-project contamination risk | Observed risk | `A3`, `A4`, `A5` | active scene, critique state, and preview state may not rebind cleanly across project changes | Does not block vocabulary planning | Material constraint for continuity hardening and any broad implementation campaign | Treat as a formal continuity gate in later work |
| preload bridge state | preload exposes harness-only helpers such as `setDevProjectPath` and `overrideServices`; continuity can appear healthy under harness-only conditions | Observed risk | `A2`, `A4`, `A5`, `A6`, `A7` | live bridge rebind correctness remains less certain than harness-assisted paths | Does not block vocabulary planning | Constrains runtime alignment and any claim of bridge-truth continuity | Keep separate in audit language, but do not split new RDM yet |
| renderer rebind | renderer hydration, `data-project-loaded` assumptions, and state merges can make the UI believe the project is ready before deeper continuity truth is confirmed | Observed risk | `A3`, `A4` | current renderer gating may reflect stale state rather than live continuity | Does not block vocabulary planning | Constrains degraded, freshness, and continuity-facing implementation work | Require later human verification receipt coverage |
| floating-pane rebind | prior history and draft-preview contract explicitly warn that floated surfaces can drift or rehydrate wrongly across switch/reload | Observed risk | `A3`, `A4` | real runtime rebind remains unverified | Does not block vocabulary planning | Constrains future GUI simplification, continuity closure, and memory-adjacent work | Keep as explicit manual-checkpoint flow |
| localStorage/session/cache continuity | recent-project, last-project, and draft-preview sync all persist locally and can survive reload or switch incorrectly | Observed risk | `A3`, `A4` | cached renderer state may outlive correct root identity | Does not block vocabulary planning | Strong constraint for continuity, recovery, and post-restart validation | Enforce stale-state discipline in future receipts |
| snapshot/report freshness after switch | freshness semantics depend on loaded-root correctness; stale or historical records can appear current after path changes | Partially trusted | `A1`, `A2`, `A3`, `A4` | freshness after root change is not yet manually revalidated | Does not block vocabulary planning | Constrains `14B` freshness alignment and later restore work | Keep tied to snapshot vocabulary and continuity follow-up |
| alias-root transition | alias divergence remains a live semantic pressure point between `Esther_Estate` and `proj_esther_estate` | Partially trusted | `A1`, `A3`, `A4` | current path identity may still diverge across persisted and visible state | Does not block vocabulary planning | Constrains alias handling, restore continuity, and project-switch correctness | Keep explicit in `14A.1` wording and later continuity verification |
| draft preview continuity | project-path keyed sync is documented, but reload/switch correctness still depends on live continuity and cache discipline | Observed risk | `A3`, `A4` | draft-preview state may rehydrate correctly in one lane and still drift in another | Does not block vocabulary planning | Constrains continuity, editorial confidence, and floated preview correctness | Keep under continuity and later human-verification bundles |

## Specific Focus

### Project load

The main risk remains root selection and stale reopen context, not the existence of a load path.

### Project switch

The main risk remains cross-project contamination in panes, previews, and cached renderer state.

### Preload bridge state

The main risk remains overreading harness-only bridge health as live continuity truth.

### Renderer rebind

The main risk remains UI readiness and project-loaded markers appearing more authoritative than they are.

### Floating-pane rebind

The main risk remains pane-specific stale binding across reload, float, dock, or project changes.

### localStorage and session continuity

The main risk remains stale local state surviving longer than the active project identity.

### Snapshot and report freshness after switch

The main risk remains historical or stale evidence appearing current after a root change.

### Alias-root transition

The main risk remains path identity drift corrupting current-state claims.

### Draft preview continuity

The main risk remains a preview surface silently showing the wrong project's draft or scene state.

## Decision

- Does this block `Phase 14A.1`?
  - No.
  - These continuity seams do not invalidate vocabulary and evidence-contract planning.
- Does this constrain `Phase 14B`?
  - Yes.
  - `Phase 14B+` must not treat project-switch, preload, renderer rebind, or stale-state continuity as runtime-trusted.
- Does `RDM-CONTINUITY-001` need updates?
  - No structural update is required in this pass.
  - Existing scope already covers the audited follow-up seams.
