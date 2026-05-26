# Phase 20-24 Surface / Subsystem Survivability - Pass 5

## Purpose

This document classifies major `Phase 20-24` surfaces and subsystems by survivability, maintenance safety, redesign pressure, governance compatibility, workflow compatibility, and implementation waste risk.

It is a reconstruction-planning artifact only. These classifications are not implementation authorization, not roadmap law, and not approval for detached-window workflow, topology architecture, or Story Unit persistence.

This pass distinguishes governance logic from the shell and surface structures that currently express it. Historical execution evidence is used here as reconstruction input, not as current planning authority by itself.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/roadmap_reconstruction_inventory_pass1.md`
- `docs/audits/phase_status_reconciliation_pass2.md`
- `docs/audits/phase20_27_survivability_classification_pass3.md`
- `docs/audits/phase20_24_maintenance_vs_redesign_pass4.md`
- `docs/audits/phase20/phase20_split_command_gui_foundation_plan.md`
- `docs/audits/phase20/phase20_closure_review.md`
- `docs/audits/phase21/phase21_command_center_panels_plan.md`
- `docs/audits/phase21/phase21_closure_review.md`
- `docs/audits/phase22/phase22_execution_plan.md`
- `docs/audits/phase23/phase23_execution_plan.md`
- `docs/audits/phase24/phase24_execution_plan.md`

## Surface / Subsystem Classification Model

These are reconstruction-planning classifications only. They are not implementation approval or long-term product commitments.

- `Survives`: likely remains valid across reconstruction with little conceptual change.
- `Survives With Redesign`: the core need survives, but the current expression likely does not.
- `Maintenance-Safe`: safe to preserve or repair narrowly without expanding product direction.
- `Transitional`: useful for continuity, but exposed to later reshaping or replacement.
- `Governance-Blocked`: cannot safely expand until authority boundaries are clearer.
- `Workflow-Blocked`: cannot safely expand until workflow-state or workflow-shape decisions stabilize.
- `Reconstruction-Dependent`: potentially useful, but cannot be trusted as a future foundation until reconstruction settles related areas.
- `Historical Scaffolding`: useful as temporary historical scaffolding or conceptual evidence, but not as a live surface direction.
- `Historical Only`: useful as evidence, not as an active planning or implementation direction.
- `Unsafe To Continue`: likely to waste effort or contaminate future workflow/governance if extended now.

## Major Surface / Subsystem Inventory

- Writing Surface
- shell framing systems
- command systems
- search systems
- layout/docking systems
- detached-window/routing systems
- intelligence/readiness surfaces
- support/recovery surfaces
- navigation systems
- Story Navigation
- Story Unit presentation surfaces
- diagnostics surfaces
- export systems
- validation systems
- proof/trust/provenance systems
- session/runtime continuity systems

## Surface / Subsystem Survivability Analysis

### Writing Surface

- Original role:
  - primary authoring surface, especially in `Phase 20-22`, with explicit primacy over command-side support
- Current reconstruction pressure:
  - low on the need for a protected drafting surface
  - high on the exact support arrangement wrapped around it
- Survivability level:
  - `Survives`
- Redesign pressure:
  - Medium
- Governance compatibility:
  - High, because Focused Drafting protection aligns with current governance truth
- Workflow compatibility:
  - Medium, because the protected core survives better than the current shell framing
- Maintenance-safe value:
  - strong value in preserving drafting stability, honesty, and local continuity
- Implementation waste risk:
  - low for protecting core drafting
  - higher if current surrounding support layout is treated as final

### Shell framing systems

- Original role:
  - provide the Split Command shell boundary, mode identity, shell-local persistence, and one-window workspace structure
- Current reconstruction pressure:
  - very high, because current GUI is transitional and workflow-state authority remains unresolved
- Survivability level:
  - `Transitional`
- Redesign pressure:
  - High
- Governance compatibility:
  - Medium for isolation/fallback logic
  - Low for shell shape as a product direction
- Workflow compatibility:
  - Low
- Maintenance-safe value:
  - safe for mode isolation, invalidation, and fail-closed repairs
- Implementation waste risk:
  - high if expanded beyond safety and continuity

### Command systems

- Original role:
  - provide command-side organization, deterministic command-center surfaces, and future command-entry seams
- Current reconstruction pressure:
  - very high, because command/search authority remains unresolved
- Survivability level:
  - `Workflow-Blocked`
- Redesign pressure:
  - High
- Governance compatibility:
  - Low to Medium
- Workflow compatibility:
  - Low
- Maintenance-safe value:
  - limited to honesty, non-authoritative labels, and regression repair
- Implementation waste risk:
  - very high for any structural expansion

### Search systems

- Original role:
  - implied future discovery/access seam adjacent to command systems rather than a fully ratified surface in `Phase 20-24`
- Current reconstruction pressure:
  - very high, because search is explicitly governance-sensitive
- Survivability level:
  - `Governance-Blocked`
- Redesign pressure:
  - High
- Governance compatibility:
  - Low unless strictly read-only and bounded
- Workflow compatibility:
  - Low
- Maintenance-safe value:
  - minimal, mainly read-only correctness or future classification prep
- Implementation waste risk:
  - very high if promoted now

### Layout/docking systems

- Original role:
  - provide pane ownership, collapse rules, condensed mode, and current spatial workspace organization
- Current reconstruction pressure:
  - high, because layout and docking can contaminate workflow authority
- Survivability level:
  - `Survives With Redesign`
- Redesign pressure:
  - High
- Governance compatibility:
  - Medium for safe reset/fallback behavior
  - Low for durable workflow-shaping layout commitments
- Workflow compatibility:
  - Low to Medium
- Maintenance-safe value:
  - safe for resets, collapse bug fixes, readability recovery, and containment
- Implementation waste risk:
  - high if current pane distribution is hardened as product structure

### Detached-window/routing systems

- Original role:
  - provide hidden secondary-window launch hooks, routing ownership, generation invalidation, and bounded cross-window recovery logic
- Current reconstruction pressure:
  - very high, because detached-window workflow is not authorized and topology remains pressure-only
- Survivability level:
  - `Reconstruction-Dependent`
- Redesign pressure:
  - High
- Governance compatibility:
  - Medium for authority-routing logic
  - Low for detached-window direction
- Workflow compatibility:
  - Low
- Maintenance-safe value:
  - limited to preserving evidence and avoiding regressions in already-landed bounded routing logic
- Implementation waste risk:
  - very high for any continued extension

### Intelligence/readiness surfaces

- Original role:
  - provide a visible Intelligence Readiness surface and staged shell-facing articulation of intelligence rules
- Current reconstruction pressure:
  - very high, because intelligence authority remains unresolved
- Survivability level:
  - `Historical Scaffolding`
- Redesign pressure:
  - High
- Governance compatibility:
  - Low for the visible surface
- Workflow compatibility:
  - Low
- Maintenance-safe value:
  - only for narrow wording honesty if the historical surface still exists
- Implementation waste risk:
  - very high for any further elaboration

### Support/recovery surfaces

- Original role:
  - express fallback, recovery visibility, degraded states, and support-oriented truth in `Phase 20` and `Phase 24`
- Current reconstruction pressure:
  - moderate, because support/recovery survive but remain exceptional and governance-sensitive
- Survivability level:
  - `Survives With Redesign`
- Redesign pressure:
  - Medium
- Governance compatibility:
  - Medium
- Workflow compatibility:
  - Medium if kept clearly exceptional
- Maintenance-safe value:
  - strong value in fail-closed behavior, honest degraded states, and visible recovery classification
- Implementation waste risk:
  - moderate if support surfaces start acting like ambient workflow peers

### Navigation systems

- Original role:
  - provide project/scene movement and command-side orientation within the current shell
- Current reconstruction pressure:
  - high, because workflow/navigation depends on unresolved workflow-state governance
- Survivability level:
  - `Workflow-Blocked`
- Redesign pressure:
  - High
- Governance compatibility:
  - Medium for deterministic truth
  - Low for current navigation prominence assumptions
- Workflow compatibility:
  - Low
- Maintenance-safe value:
  - narrow truth and ordering repairs only
- Implementation waste risk:
  - high if expanded as current workflow canon

### Story Navigation

- Original role:
  - deterministic project-navigation surface and command-side anchor
- Current reconstruction pressure:
  - moderate to high, because the underlying function survives better than the current command-side anchoring
- Survivability level:
  - `Survives With Redesign`
- Redesign pressure:
  - Medium to High
- Governance compatibility:
  - Medium to High for no-fake-hierarchy and deterministic truth
- Workflow compatibility:
  - Medium
- Maintenance-safe value:
  - clear value in truthful scene/outline orientation
- Implementation waste risk:
  - moderate if work stays truthful
  - high if command-side anchoring is hardened

### Story Unit presentation surfaces

- Original role:
  - mostly indirect in `Phase 20-24`; pressure appears through presentation and shell-era expectations rather than approved persistence
- Current reconstruction pressure:
  - very high, because Story Unit persistence remains unresolved
- Survivability level:
  - `Governance-Blocked`
- Redesign pressure:
  - High
- Governance compatibility:
  - Low unless clearly framed as pressure/evidence only
- Workflow compatibility:
  - Low to Medium
- Maintenance-safe value:
  - minimal beyond honest labeling and non-promotion
- Implementation waste risk:
  - very high if promoted through surface design before governance settles

### Diagnostics surfaces

- Original role:
  - debug-only foundation and possible operator-truth support surface
- Current reconstruction pressure:
  - moderate, because diagnostics can become competing authority if exposed badly
- Survivability level:
  - `Maintenance-Safe`
- Redesign pressure:
  - Medium
- Governance compatibility:
  - Medium if fenced and non-authoritative
- Workflow compatibility:
  - Medium if kept out of ambient drafting flow
- Maintenance-safe value:
  - high for debugging, support, logs, and truth-lane witness work
- Implementation waste risk:
  - moderate if promoted into a primary product surface

### Export systems

- Original role:
  - mostly outside `Phase 20-24` scope, but still referenced as a durable authority boundary in surrounding reconstruction docs
- Current reconstruction pressure:
  - relatively low compared with shell and command systems
- Survivability level:
  - `Survives`
- Redesign pressure:
  - Medium around UI placement, not around the capability itself
- Governance compatibility:
  - High
- Workflow compatibility:
  - Medium
- Maintenance-safe value:
  - strong
- Implementation waste risk:
  - low for maintenance, moderate for UI framing assumptions

### Validation systems

- Original role:
  - proof lanes, renderer tests, smoke checks, bounded validation gates, and witness discipline
- Current reconstruction pressure:
  - low
- Survivability level:
  - `Survives`
- Redesign pressure:
  - Low
- Governance compatibility:
  - High
- Workflow compatibility:
  - High
- Maintenance-safe value:
  - very strong
- Implementation waste risk:
  - low

### Proof/trust/provenance systems

- Original role:
  - enforce no-overclaim, provenance labeling, trust-language discipline, and proof-boundary honesty
- Current reconstruction pressure:
  - low on the logic itself, high only on some historical surface embodiments
- Survivability level:
  - `Survives`
- Redesign pressure:
  - Low for the logic
  - High for some visible shells that carried it
- Governance compatibility:
  - High
- Workflow compatibility:
  - High
- Maintenance-safe value:
  - extremely high
- Implementation waste risk:
  - low if preserved as logic
  - high if tied to the wrong visible surface

### Session/runtime continuity systems

- Original role:
  - maintain identity, invalidation, continuity, and truth across reload/reopen and bounded shell transitions
- Current reconstruction pressure:
  - moderate, because the logic survives better than the shell that exposed it
- Survivability level:
  - `Survives`
- Redesign pressure:
  - Medium
- Governance compatibility:
  - High
- Workflow compatibility:
  - Medium to High
- Maintenance-safe value:
  - very strong
- Implementation waste risk:
  - low for continuity logic
  - moderate if wrapped in unstable shell assumptions

## Surfaces Most Likely To Survive Reconstruction

- Writing Surface core protection
- export systems
- validation systems
- proof/trust/provenance systems
- session/runtime continuity systems
- support/recovery logic when kept exceptional and fail-closed
- Story Navigation’s deterministic truth function, though not necessarily its current command-side prominence

## Surfaces Most Likely To Require Major Redesign

- shell framing systems
- command systems
- search systems
- layout/docking systems as workflow structure
- detached-window/routing systems as product direction
- intelligence/readiness surfaces
- Story Unit presentation surfaces
- navigation systems as currently emphasized in the shell

## Surfaces Likely Safe Only As Transitional Maintenance

- shell framing bug fixes
- layout/collapse fixes
- Story Navigation readability and truth repairs
- metadata-only and placeholder honesty repairs
- diagnostics fencing and non-authoritative status repairs
- support/recovery visibility fixes that do not expand ordinary workflow authority

## Surfaces Likely Unsafe To Continue Prematurely

- command-side expansion
- search/command mutation expansion
- visible intelligence-surface elaboration
- detached-window extension
- topology-adjacent workflow shaping
- Story Unit surface promotion before governance settles
- shell taxonomy growth that assumes current structure is durable

## Governance Logic That Survives Better Than Its Surface

- provenance rules
- trust-language rules
- fail-closed behavior
- continuity contracts
- session authority rules
- proof discipline
- deterministic truth-label honesty
- no-hidden-promotion logic
- invalidation and stale-state handling

These logics consistently survive better than the shells, panels, and staging surfaces that originally carried them.

## Shell / Layout Assumptions Under Highest Pressure

- one-window Split Command shell as a future product spine
- command-side prominence as a neutral organizational choice
- current collapse hierarchy as a workflow truth rather than a temporary ergonomic choice
- current pane distribution as mostly cosmetic rather than authority-bearing
- hidden or detached-window groundwork as inherently future-safe
- current support-surface placement as a stable drafting model

## Waste-Risk Findings

- Highest likely waste zones:
  - command-side shell organization
  - detached-window continuation
  - visible intelligence staging
  - stronger current-shell taxonomy
- Strongest maintenance-safe zones:
  - proof/validation systems
  - continuity/invalidation logic
  - provenance/trust logic
  - startup/default-path safety
- Most likely redesign traps:
  - assuming stable logic implies stable surface structure
  - preserving current shell distribution because it already exists
  - treating hidden-window groundwork as a strategic base rather than contingent evidence
- False-stability zones:
  - command-side hierarchy
  - condensed layout rules
  - visible readiness scaffolding
  - hidden secondary-window path

## Orchestrator Rulings After Pass 5

- Reconstruction Pass 6 should focus first on the highest waste-risk family rather than the most durable logic-first family.
- Reason: durable contracts are now sufficiently identified; the next planning value is preventing wasted implementation around unstable shell, command, search, layout, and intelligence surfaces.
- Story Unit presentation surfaces in Pass 6 must be limited strictly to shell-visible presentation seams and must not expand into broader Story Unit structure, persistence, or topology planning.
- A later reconstruction template should explicitly separate `surface survives` from `underlying contract survives`.
- This distinction should become a standard reconstruction lens for remaining roadmap work.
- Current Pass 5 conclusion: in `Phase 20-24`, underlying contracts often survive better than the visible surface or shell structure that introduced them.

## Contradictions Found

- `Phase 20-21` use strong authority language while still treating shell distribution as if it could safely grow.
- `Phase 22` supports Focused Drafting goals, but does so through support placements that may not survive workflow reconstruction.
- `Phase 23` survives best as governance logic, yet historically expressed itself through a visible surface now judged non-durable.
- `Phase 24` treated hidden-window groundwork as bounded and disciplined, but current reconstruction still gives that groundwork little future implementation weight.

## Areas Too Ambiguous To Classify Reliably

- how much current shell-local persistence belongs to durable continuity logic versus temporary workspace shape
- how much of Story Navigation’s current surface structure survives if the future workflow reduces command-side prominence
- whether support/recovery surfaces can remain partially visible without becoming ambient workflow peers
- whether some detached-window routing logic still deserves preservation if detached workflow stays inactive for a long time

## Questions For Orchestrator

- Which highest waste-risk family should Pass 6 classify first: shell framing, command/search, layout/docking, intelligence/readiness, or detached-window/routing?
- When Pass 6 reaches Story Unit presentation seams, should they be treated strictly as shell-visible authority/presentation risk rather than content-structure planning?

## Recommended Reconstruction Pass 6

Run a sixth reconstruction pass that applies this same split at a tighter level to the highest-risk families first:

- shell framing systems
- command/search systems
- layout/docking systems
- detached-window/routing systems
- intelligence/readiness surfaces

Pass 6 should explicitly separate:

- surface survives
- underlying contract survives
- maintenance-safe continuity work
- redesign-bound structure
- governance-blocked expansion
- workflow-blocked expansion

It should not rewrite the roadmap, authorize detached-window workflow, or convert survivability findings into build approval.

## Pass 6 Direction

Roadmap Reconstruction Pass 6 should focus on the highest waste-risk surface families:

- shell framing
- command/search
- layout/docking
- intelligence/readiness surfaces
- detached-window/routing
- Story Unit presentation seams

The goal is to classify what should pause, remain maintenance-only, or require redesign before further implementation effort.
