# Highest Waste-Risk Surface Families - Pass 6

## Purpose

This document classifies the highest waste-risk `Phase 20-24` surface families so future implementation effort does not harden unstable shell, command, layout, intelligence, detached-window, or Story Unit presentation assumptions.

It is a reconstruction-planning artifact only. These classifications are not implementation authorization, not topology approval, not detached-window approval, and not Story Unit persistence approval.

This pass focuses on high-risk surface families first because the current planning need is waste prevention, not forward implementation sequencing.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/roadmap_reconstruction_inventory_pass1.md`
- `docs/audits/phase_status_reconciliation_pass2.md`
- `docs/audits/phase20_27_survivability_classification_pass3.md`
- `docs/audits/phase20_24_maintenance_vs_redesign_pass4.md`
- `docs/audits/phase20_24_surface_subsystem_survivability_pass5.md`
- `docs/audits/phase20/phase20_split_command_gui_foundation_plan.md`
- `docs/audits/phase20/phase20_closure_review.md`
- `docs/audits/phase21/phase21_command_center_panels_plan.md`
- `docs/audits/phase21/phase21_closure_review.md`
- `docs/audits/phase22/phase22_execution_plan.md`
- `docs/audits/phase23/phase23_execution_plan.md`
- `docs/audits/phase24/phase24_execution_plan.md`

## Waste-Risk Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Pause`: do not extend this family beyond narrow safety or continuity work right now.
- `Maintenance Only`: safe to preserve or repair narrowly, but not to expand directionally.
- `Maintenance-Safe With Caution`: repair-scoped work is likely safe, but the family is structurally unstable enough that maintenance can still harden the wrong assumptions if it spreads.
- `Redesign-Bound`: the family likely survives only after substantial redesign.
- `Governance-Blocked`: expansion depends on unresolved authority boundaries.
- `Workflow-Blocked`: expansion depends on unresolved workflow-state or workflow-shape decisions.
- `Reconstruction-Dependent`: potentially useful, but cannot be trusted as a future base until broader reconstruction decisions land.
- `Historical Scaffolding`: useful as historical staging or conceptual evidence, not as a live surface direction.
- `Historical Only`: evidence value remains, but current planning should not treat the family as an active product direction.
- `Unsafe To Continue`: further implementation in the family is likely to waste effort or contaminate future workflow/governance.

## Executive Findings

- The highest waste-risk families are `shell framing`, `command/search`, `intelligence/readiness surfaces`, and `detached-window/routing`.
- `Layout/docking` survives best as reset/fallback/safety mechanics, not as durable workflow structure.
- `Story Unit` shell-visible presentation seams are highly promotion-sensitive and should remain tightly bounded.
- Across these families, underlying contracts survive more reliably than the shells and visible surfaces that currently carry them.

## Shell Framing Family

- What survives:
  - mode isolation
  - shell/stable separation discipline
  - invalidation rules
  - fallback classification
  - startup/default-path protection
- What is maintenance-safe:
  - regression fixes in shell-local persistence reset/invalidation
  - default-off protection
  - listener/subscription cleanup
  - same-project versus cross-project invalidation correctness
- What is redesign-bound:
  - one-window shell framing as a product spine
  - command-side versus writing-side workspace distribution
  - shell-local warnings and workspace identity as durable product structure
- What should pause:
  - any further shell taxonomy growth
  - any further shell-direction refinement presented as future structure
- What is unsafe to continue:
  - expanding shell hierarchy as if current GUI were stabilizing into the future workflow
- What underlying contract survives:
  - mode separation
  - fail-closed invalidation
  - stable/default-path protection
  - no-hidden-leakage between shell and stable GUI
- What current implementation effort would likely be wasted:
  - deeper investment in shell framing, visual hierarchy, and current workspace decomposition

Classification:
- `Maintenance-Safe With Caution` for safety/continuity mechanics
- `Redesign-Bound` for shell structure
- `Unsafe To Continue` for directional expansion

## Command/Search Family

- Command palette/search authority risks:
  - compresses many authority classes into one entry seam
  - can silently bypass review and visibility boundaries
- Bypass risks:
  - command access can become a second hidden application layer
  - search can widen authority while looking read-only or neutral
- State-governance risks:
  - unresolved workflow-state canon means command/search may act on the wrong authority assumptions
  - current shell organization can overprivilege command-side visibility
- Maintenance-safe areas:
  - read-only correctness
  - label honesty
  - deterministic metadata truth
  - regression repair that does not widen power
- Redesign-bound areas:
  - current command-center framing
  - command-side hierarchy
  - command-driven navigation prominence
- Unsafe expansion areas:
  - mutation authority
  - bulk or cross-surface command shortcuts
  - command/search as an ambient workflow control surface
- Underlying contracts that survive:
  - deterministic truth labeling
  - no-fake-authority constraints
  - explicit admission skepticism

Classification:
- `Governance-Blocked`
- `Workflow-Blocked`
- `Unsafe To Continue` for expansion
- `Maintenance Only` for narrow read-only or label repairs

## Layout/Docking Family

- Layout reset/fallback value:
  - strong value for safe reset, collapse recovery, and readability rescue
- Docking/pane flexibility risk:
  - pane flexibility can become workflow-shaping rather than merely ergonomic
  - docking may silently promote topology-like assumptions
- Persistence contamination risk:
  - layout persistence can become workflow canon if allowed to imply stable authority structure
- Maintenance-safe areas:
  - layout reset/fallback
  - collapse bug fixes
  - readability recovery
  - bounded pane usability repair
- Redesign-bound areas:
  - pane distribution as durable workflow shape
  - current collapse hierarchy as future authority model
  - docking persistence as a product-direction assumption
- Unsafe expansion areas:
  - adding more pane flexibility or persistence as if layout were neutral
  - hardening current split-pane behavior into product structure
- Underlying contracts that survive:
  - reset/fallback safety
  - containment of pane failure
  - readability over ornamental complexity

Classification:
- `Maintenance-Safe With Caution` for reset/fallback/safety work
- `Redesign-Bound` for workflow-shaping layout structure
- `Pause` for broader flexibility/persistence expansion

## Intelligence/Readiness Surface Family

- Provenance/trust rule survival:
  - strong
  - these rules are among the most durable contracts in the whole family
- Visible readiness surface risk:
  - the surface itself is historical scaffolding and risks being mistaken for future product direction
- Companion/advisory/intelligence authority risks:
  - intelligence can impersonate judgment
  - broader context can inflate authority
  - shell-visible readiness can overnormalize future intelligence presence
- Maintenance-safe areas:
  - preserving provenance vocabulary
  - preserving trust-language rules
  - preserving generated/verified/speculative/deferred distinctions
- Redesign-bound areas:
  - the visible Intelligence Readiness surface
  - any shell-facing intelligence staging surface that implies a durable workflow slot
- Unsafe expansion areas:
  - companion-like surface growth
  - advisory surface growth
  - confidence or insight expansion that widens visible authority
- Underlying contracts that survive:
  - provenance logic
  - trust logic
  - anti-fake-authority rules
  - fallback honesty

Classification:
- `Historical Scaffolding` for the visible surface
- `Governance-Blocked` for expansion
- `Maintenance Only` for preserving the underlying rules

## Detached-Window/Routing Family

- Phase 24 hidden-window infrastructure:
  - currently evidence only, not a future implementation foundation
- Authority-routing lessons:
  - explicit ownership
  - generation invalidation
  - bounded fallback/recovery
  - no-hidden-promotion skepticism
- Detached-window future risk:
  - detached workflow is not authorized
  - topology remains pressure-only
  - continued investment can easily waste effort
- Maintenance-safe areas:
  - preserving already-landed bounded routing correctness
  - preventing regressions in invalidation/fallback logic
- Redesign-bound areas:
  - hidden secondary-window path
  - detached-window product direction
  - routing structure tied to inactive workflow assumptions
- Historical-only candidates:
  - hidden-window launch foundation
  - secondary-window path if detached workflow remains inactive through later reconstruction
- Underlying contracts that survive:
  - ownership and invalidation rules
  - no-hidden-promotion logic
  - bounded rebuild/fallback discipline

Classification:
- `Reconstruction-Dependent` as evidence
- `Historical Only` candidate if inactivity persists
- `Unsafe To Continue` for extension

## Story Unit Presentation Seam Family

Strict scope:
This section covers shell-visible presentation seams only. It does not classify Story Unit persistence, topology, structural planning, or data-model design.

- Presentation risks:
  - shell-visible presentation can overpromote unresolved Story Unit pressure into apparent product structure
  - presentation can imply implementation anchors that governance has not approved
- Shell-coupling risks:
  - Story Unit presentation can inherit unstable shell assumptions
  - command-side or layout-side placement can make Story Units look more settled than they are
- Maintenance-safe areas:
  - honest labeling
  - non-promotional copy
  - pressure/evidence-only framing
- Redesign-bound areas:
  - any current shell slot or visual structure that implies Story Unit durability
  - any presentation that feels like a stable workflow pillar
- Unsafe expansion areas:
  - richer Story Unit shell presence
  - stronger Story Unit visual centrality
  - implied persistence or structural authority through presentation alone
- Underlying contracts that survive:
  - the rule that pressure does not equal authorization
  - the rule that presentation must not outrun governance

Classification:
- `Governance-Blocked`
- `Maintenance Only` for honesty/non-promotion
- `Unsafe To Continue` for expansion

## Highest Waste-Risk Areas

- command-side shell organization
- command/search expansion
- visible intelligence staging expansion
- detached-window continuation
- shell hierarchy growth
- layout persistence and pane flexibility expansion treated as neutral
- Story Unit presentation growth that implies durable structure

## Orchestrator Rulings After Pass 6

- Reconstruction Pass 7 should focus first on command/search.
- Reason: command/search has the highest bypass risk because it can route around workflow-state rules, hidden-surface boundaries, mutation gates, dev/test containment, and support/recovery separation.
- Pass 7 should include expected wasted-effort ranking if command/search is extended now.
- Classification should remain reconstruction-planning only and must not become implementation authorization.
- Detached-window routing should remain a `Historical Only candidate` for now.
- Do not move detached-window routing to explicit `Historical Only` until later reconstruction confirms detached workflow stays inactive.

## Maintenance-Only Safe Areas

- startup/default-path protection
- shell/stable isolation and invalidation correctness
- fail-closed reset/fallback repairs
- layout reset/fallback safety
- diagnostics/logging when fenced and non-authoritative
- proof/validation systems
- provenance/trust rule preservation
- deterministic truth labeling
- session/runtime continuity corrections

## Areas That Should Pause

- shell-direction refinement
- command/search power expansion
- layout/docking flexibility expansion
- visible intelligence/readiness elaboration
- detached-window extension
- Story Unit presentation growth beyond honest shell-visible seams

## Underlying Contracts That Survive Better Than Surfaces

- Surface survives:
  - some Writing Surface protection
  - some Story Navigation truth function
  - some support/recovery visibility
- Underlying contract survives:
  - proof/trust/provenance logic
  - fail-closed behavior
  - layout reset/fallback safety
  - session/runtime continuity
  - deterministic truth labeling
  - stale-state/invalidation handling
  - no-hidden-promotion logic

The main Pass 6 pattern is that surface survival is narrow and conditional, while underlying contract survival is broader and more durable.

## Contradictions Found

- `Phase 20` and `Phase 21` emphasize explicit authority boundaries while still encouraging shell and command-side organization that current reconstruction no longer trusts.
- `Phase 22` strengthens Focused Drafting in principle while still relying on unstable support-surface arrangements.
- `Phase 23` created durable governance logic through a visible surface now considered historically non-durable.
- `Phase 24` built disciplined routing evidence for a workflow direction that is still not authorized.

## Areas Too Ambiguous To Classify Reliably

- how much shell-local persistence is durable continuity logic versus temporary workspace shape
- how much current Story Navigation structure survives if command-side prominence is later reduced sharply
- whether support/recovery visibility can remain partially user-facing without becoming ambient workflow authority
- whether any detached-window routing code should be preserved long-term if the workflow stays inactive

## Questions For Orchestrator

- If detached-window infrastructure remains inactive through later reconstruction, should a later pass promote it from `Historical Only candidate` to explicit `Historical Only`?
- Within command/search, should Pass 7 treat search behavior and command palette behavior as one combined family unless evidence forces a split?

## Recommended Reconstruction Pass 7

Run a seventh reconstruction pass that drills into one highest waste-risk family at a time, starting with the family judged most likely to waste near-term implementation effort if extended now.

Pass 7 should:

- classify the chosen family at finer subsystem/detail level
- separate `maintenance-only` from `pause` from `unsafe-to-continue`
- keep `surface survives` separate from `underlying contract survives`
- preserve Story Unit presentation scope as shell-visible seams only

Pass 7 should not rewrite the roadmap, authorize detached-window workflow, authorize topology architecture, or authorize Story Unit persistence.

## Pass 7 Direction

Roadmap Reconstruction Pass 7 should classify command/search at finer subsystem detail, including:

- command palette
- search behavior
- command routing
- hidden command exposure
- mutation-capable command access
- dev/test command leakage
- support/recovery command access
- workflow-state authority inheritance
- expected wasted effort if extended now
