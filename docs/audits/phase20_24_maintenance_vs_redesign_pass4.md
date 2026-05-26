# Phase 20-24 Maintenance vs Redesign - Pass 4

## Purpose

This document classifies `Phase 20-24` work by maintenance-safe value, redesign-bound risk, survivability under reconstruction-era governance, and implementation waste risk.

It is a reconstruction-planning artifact only. These classifications are not implementation authorization, not roadmap law, not topology approval, and not detached-window authorization.

`Phase 20-24` are treated here as historical execution evidence and reconstruction input, not as current planning authority by themselves.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/roadmap_reconstruction_inventory_pass1.md`
- `docs/audits/phase_status_reconciliation_pass2.md`
- `docs/audits/phase20_27_survivability_classification_pass3.md`
- `docs/audits/phase20/phase20_split_command_gui_foundation_plan.md`
- `docs/audits/phase20/phase20_closure_review.md`
- `docs/audits/phase21/phase21_command_center_panels_plan.md`
- `docs/audits/phase21/phase21_closure_review.md`
- `docs/audits/phase22/phase22_execution_plan.md`
- `docs/audits/phase23/phase23_execution_plan.md`
- `docs/audits/phase24/phase24_execution_plan.md`

## Classification Model

These are reconstruction-planning classifications only. They are not implementation approval, not product workflow states, and not long-term roadmap commitments.

- `Maintenance-Safe`: safe to preserve or repair narrowly without expanding product direction.
- `Maintenance-Safe With Caution`: likely safe only if the work stays repair-scoped and does not reinforce transitional workflow assumptions.
- `Transitional`: useful for continuity, but exposed to later replacement or reshaping.
- `Redesign-Bound`: likely to require redesign under current governance and workflow reconstruction.
- `Governance-Blocked`: should not expand until authority boundaries are clearer.
- `Workflow-Blocked`: should not expand until workflow-state or workflow-shape decisions stabilize.
- `Reconstruction-Dependent`: cannot be trusted as a future foundation until broader reconstruction decisions land.
- `Historical Scaffolding`: helpful as past scaffolding or conceptual guardrail, but not a live surface direction.
- `Unsafe To Continue`: extension now is likely to waste effort or contaminate future workflow authority.
- `Historical Only`: useful as evidence, not as a basis for current product direction.

## Phase-by-Phase Analysis (20-24)

### Phase 20

- Original execution intent:
  - establish a one-window Split Command shell foundation with explicit shell-owned authority, persistence, fallback classification, and mode separation
- Maintenance-safe elements:
  - stable/default GUI protection
  - mode isolation and invalidation discipline
  - shell persistence reset/corruption handling
  - observer/listener cleanup discipline
  - layout diagnostic dedupe and same-project invalidation behavior
- Redesign-bound elements:
  - one-window Split Command shell as a product-shape foundation
  - command-side versus writing-side spatial framing
  - pane ownership and collapse logic as future workflow canon
  - diagnostics as a named shell-side surface direction
- Transitional assumptions:
  - Writing Studio primary, Command Center degrades first
  - explicit shell-local persistence and shell-local warnings as the current workspace spine
- Governance pressure:
  - command/search compression risk
  - diagnostics and layout surfaces can become competing authority
  - visibility does not equal authority
- Workflow pressure:
  - focused drafting visibility rules are still unresolved
  - current shell framing risks hardening the wrong workflow-state model
- Implementation waste risk:
  - High if work expands shell framing, panel identity, or layout commitments
  - Lower if work stays inside bug-fix, fallback, and isolation lanes
- Survivability level:
  - `Maintenance-Safe With Caution` for isolation/fallback/cleanup work
  - `Redesign-Bound` for shell framing and layout-direction work

### Phase 21

- Original execution intent:
  - build deterministic Command Center panels and panel-admission rules inside the one-window Split Command shell
- Maintenance-safe elements:
  - deterministic/current-project truth discipline
  - placeholder demotion
  - metadata-only honesty
  - Story Navigation no-fake-hierarchy rule
- Redesign-bound elements:
  - command-center information architecture as future product structure
  - command-side panel ordering and collapse model
  - narrative overview / stats / structure overview as a stable sidecar panel family
  - panel-admission enforcement tied to the current shell shape
- Transitional assumptions:
  - Story Navigation as the command-side anchor
  - deterministic overview lane and tertiary stats lane
  - command-side hierarchy as the dominant organization model
- Governance pressure:
  - command/search and navigation are governance-sensitive
  - panel visibility can impersonate authority even when data is deterministic
- Workflow pressure:
  - command-side prominence depends on unresolved workflow-state canon
  - writing versus structure-review transitions remain unresolved
- Implementation waste risk:
  - High for further panel growth, navigation structuring, and sidecar hierarchy hardening
  - Moderate for narrow label/truth repairs
- Survivability level:
  - `Workflow-Blocked` for command-side structure expansion
  - `Maintenance-Safe With Caution` for honesty, placeholder, and deterministic-label repairs

### Phase 22

- Original execution intent:
  - make the Writing Studio side more useful and deterministic while preserving stable GUI safety and Split Command isolation
- Maintenance-safe elements:
  - writing-surface primacy as a governance-aligned pressure
  - placeholder honesty for deferred writing tools
  - deterministic current-project writing context
  - narrow focus/density improvements that do not imply final workflow shape
- Redesign-bound elements:
  - current writing-side support-surface arrangement
  - one-window shell composition for editor-adjacent utilities
  - any durable assumption about where notes, quick insert, writing tools, or contextual supports should live
- Transitional assumptions:
  - the current writing-side shell is an acceptable host for future drafting support
  - local density tuning can stand in for broader workflow correction
- Governance pressure:
  - Focused Drafting protection is explicit, but surrounding support surfaces still risk contamination
  - contextual versus persistent support remains unresolved
- Workflow pressure:
  - what remains visible during drafting is still under reconstruction
  - writing-side support placement is not stable workflow law yet
- Implementation waste risk:
  - Medium for narrow drafting-surface maintenance
  - High if current support placements are treated as future product structure
- Survivability level:
  - `Maintenance-Safe With Caution` for drafting-surface safety and honesty work
  - `Redesign-Bound` for durable support-surface arrangement assumptions

### Phase 23

- Original execution intent:
  - define intelligence authority, provenance, trust-language, fallback, and admission rules before future intelligence surfaces grow
- Maintenance-safe elements:
  - provenance rules
  - generated/verified/speculative/deferred/unavailable vocabulary
  - trust-language constraints
  - anti-fake-authority intelligence boundaries
- Redesign-bound elements:
  - the visible Intelligence Readiness surface
  - any shell-visible intelligence staging surface that looks like future product authority
  - any assumption that a visible readiness panel is the correct long-term delivery shape
- Transitional assumptions:
  - a visible scaffolding surface is the right way to teach or hold intelligence governance
- Governance pressure:
  - intelligence authority is explicitly high-risk
  - broader context and polished copy can silently become fake judgment authority
- Workflow pressure:
  - contextual versus persistent intelligence presentation remains unresolved
  - intelligence visibility during Focused Drafting is still not settled
- Implementation waste risk:
  - High for any continued visible-surface elaboration
  - Low for maintaining the underlying provenance/trust rules as documentation or narrow labels
- Survivability level:
  - `Historical Scaffolding` for the visible Intelligence Readiness surface
  - `Governance-Blocked` for intelligence-surface expansion
  - `Maintenance-Safe` for provenance/trust rules as guardrails

### Phase 24

- Original execution intent:
  - build a bounded true two-monitor Split Command foundation with explicit window authority, fallback, routing, recovery, and synchronization rules
- Maintenance-safe elements:
  - authority-routing lessons
  - generation invalidation discipline
  - hidden-promotion skepticism
  - bounded retry/recovery thinking
  - cross-window ownership vocabulary as evidence
- Redesign-bound elements:
  - detached-window workflow as a current implementation foundation
  - hidden secondary-window path as future product structure
  - monitor-placement and split-workspace product assumptions
  - command-window versus writing-window topology as direction
- Transitional assumptions:
  - true two-monitor behavior is still a likely future workflow spine
  - bounded hidden-window groundwork is future-safe enough to extend
- Governance pressure:
  - topology remains pressure-only
  - hidden promotion risk is severe
  - support/recovery visibility versus concealed normalization remains sensitive
- Workflow pressure:
  - detached-window workflow is not currently authorized
  - cross-window structure depends on unresolved workflow-state and authority model
- Implementation waste risk:
  - Very high for any continued detached-window or hidden-window extension
  - Moderate only for preserving evidence and avoiding regressions in already-landed bounded routing logic
- Survivability level:
  - `Reconstruction-Dependent` as historical authority-routing evidence
  - `Unsafe To Continue` as a current detached-window implementation foundation

## Maintenance-Safe Work Categories

- crash prevention
- startup reliability and default-path protection
- corruption/reset/fallback safety
- dependency hygiene
- diagnostics/logging when kept non-authoritative
- verification tooling and proof-boundary coverage
- recovery basics and fail-closed classification
- safe layout reset/fallback behavior
- validation infrastructure
- current-project deterministic truth labels
- provenance/trust rules from `Phase 23`

## Redesign-Bound Work Categories

- shell framing assumptions
- docking/layout and collapse assumptions
- panel distribution assumptions
- command-side shell assumptions
- detached-window workflow assumptions
- visible intelligence-surface assumptions
- topology-adjacent assumptions
- Story Unit presentation assumptions where shell surfaces imply future structure
- toolbar/navigation assumptions that presuppose a stable workflow-state set

## Work Safe Only As Transitional Maintenance

- narrow shell bug fixes in `Phase 20`
- label and placeholder honesty fixes in `Phase 21-23`
- current writing-surface density cleanup in `Phase 22`
- regressions in shell-local persistence reset/invalidation
- bounded fallback and recovery-truth repairs
- metadata-only/deterministic-surface copy corrections

These lanes are safe only when they preserve continuity without strengthening current shell or workflow direction.

## Work Likely Unsafe To Continue Prematurely

- expanding command-side panel families
- hardening current shell layout as if it were final workflow
- promoting visible intelligence scaffolding into a durable product surface
- extending hidden secondary-window behavior
- adding more detached-window routing, placement, or topology assumptions
- embedding command/search mutation authority into current shell surfaces
- treating current panel arrangement as stable navigation architecture

## Historical Assumptions Under Highest Reconstruction Pressure

- Split Command shell shape is a future product spine
- command-side organization is inherently safer or clearer than workflow-state governance
- deterministic panels are harmless regardless of placement and prominence
- visible intelligence scaffolding can later be promoted with minimal redesign
- detached-window groundwork is automatically future-safe
- layout persistence and pane distribution are mostly cosmetic rather than authority-bearing

## Waste-Risk Findings

- Likely wasted implementation effort areas:
  - more command-side shell organization
  - more detached-window groundwork
  - richer visible intelligence staging surfaces
  - stronger current-shell panel taxonomy
- Likely maintenance-only areas:
  - mode isolation
  - startup/default-path protection
  - corruption/invalidation handling
  - proof infrastructure
  - deterministic truth-label honesty
- Likely redesign traps:
  - treating `Phase 20` shell boundary as future architecture
  - treating `Phase 21` panel lanes as future navigation canon
  - treating `Phase 22` support placements as final drafting workflow
  - treating `Phase 24` hidden-window foundation as a live strategic base
- Likely false-stability zones:
  - current one-window layout rules
  - command-side panel hierarchy
  - visible intelligence readiness shell
  - hidden secondary-window path that looks bounded enough to keep extending

## Dependency Discoveries

- `Phase 20` contributes the most maintenance-safe value when read as isolation/fallback discipline, not shell-direction approval.
- `Phase 21` depends on `Phase 20` but is more exposed because it turns shell assumptions into visible product structure.
- `Phase 22` is the least governance-hostile of the visible shell-facing phases because it aligns with writing-surface primacy, but its exact support arrangement is still unstable.
- `Phase 23` splits cleanly:
  - rules survive
  - visible scaffolding does not
- `Phase 24` also splits cleanly:
  - authority-routing evidence survives
  - detached-window product direction does not

## Orchestrator Rulings After Pass 4

- Reconstruction Pass 5 should focus on subsystem/surface-level survivability classification before deferred-work-family reconciliation.
- Surface/subsystem clarity is currently more valuable than deferred-family bookkeeping.
- If detached-window workflow remains inactive through reconstruction, `Phase 24` hidden-window infrastructure should likely later downgrade from `Reconstruction-Dependent` to `Historical Only`.
- `Phase 24` hidden-window infrastructure is not currently authorized as future implementation direction.
- `Phase 23` provenance/trust rules appear more durable than the visible readiness surface that introduced them.
- The surviving `Phase 23` provenance/trust rules should likely later be extracted into a non-surface-specific governance artifact rather than remaining tied to historical scaffolding surfaces.

## Contradictions Found

- `Phase 20` and `Phase 21` emphasized authority discipline while also normalizing a shell structure that current reconstruction now treats as workflow-sensitive.
- `Phase 22` is aligned with Focused Drafting pressure, but it is still expressed through a shell family that remains transitional.
- `Phase 23` correctly warns against fake authority, yet its executed visible surface still risks being read as a future product precedent.
- `Phase 24` aggressively guards against hidden promotion while also building hidden-window groundwork that is now explicitly low-weight for current planning.

## Areas Too Ambiguous To Classify Reliably

- how much of `Phase 20` condensed-mode and layout-reset behavior is pure safety versus latent workflow-shape commitment
- whether `Phase 21` Story Navigation improvements can later survive in a very different workflow shape
- how much of `Phase 22` density and support cleanup can be preserved if the future drafting workflow becomes much more contextual
- whether any `Phase 24` bounded routing infrastructure is worth preserving if detached workflow stays inactive for an extended period

## Questions For Orchestrator

- Which `Phase 20-24` subsystem family should be classified first in Pass 5: shell systems, command systems, or intelligence/routing systems?
- Should `Story Unit` presentation surfaces be classified in Pass 5 only where they are visibly embedded in `Phase 20-24` shell surfaces, or held for a later dedicated reconstruction pass?

## Recommended Reconstruction Pass 5

Run a fifth reconstruction pass that classifies `Phase 20-24` at the surface/subsystem level, especially:

- shell boundary and shell-local persistence surfaces
- command-side navigation and panel surfaces
- writing-side support surfaces
- visible intelligence scaffolding surfaces
- hidden-window and cross-window routing surfaces

Pass 5 should stay below the phase-summary level and above implementation planning. It should identify which existing surfaces are:

- maintenance-safe to preserve narrowly
- redesign-bound and likely temporary
- governance-blocked
- workflow-blocked
- historical scaffolding only
- unsafe-to-continue

Pass 5 should not rewrite the roadmap, authorize detached-window workflow, or convert any safe-maintenance classification into long-term approval.

## Pass 5 Direction

Roadmap Reconstruction Pass 5 should classify major `Phase 20-24` surfaces/subsystems by:

- survives
- maintenance-safe
- redesign-bound
- governance-blocked
- workflow-blocked
- historical-only
- unsafe-to-continue

with special attention to:

- shell systems
- command systems
- layout/docking systems
- intelligence surfaces
- support surfaces
- routing/window systems
- navigation systems
- Story Unit presentation surfaces
