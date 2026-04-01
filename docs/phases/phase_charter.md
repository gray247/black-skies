Status: Active (Canonical)
Version: 1.1.0
Last Reviewed: 2026-03-31

# Black Skies Phase Charter

Purpose: define the phase sequence, scope, and gating for the current roadmap.

Use [`control_plane.md`](../specs/control_plane.md) for runtime ownership.

Status tracking lives in [`docs/roadmap.md`](../roadmap.md).

Canonical Links:
- `docs/specs/control_plane.md`
- `docs/specs/architecture.md`
- `docs/specs/data_model.md`
- `docs/specs/endpoints.md`
- `docs/specs/rescue_pipeline_architecture.md`
- `docs/gui/gui_layouts.md`
- `docs/specs/analytics_service_spec.md`
- `docs/specs/agents_and_services.md`
- `docs/CHANGELOG.md`
- `docs/version_manifest.json`

---

## Glossary

| Term | Description |
| :--- | :---------- |
| Outline flow | Planning workflow for project structure and scene setup. |
| Writing flow | Draft generation and revision workflow. |
| Feedback flow | Critique and acceptance workflow. |
| Budget meter | Soft/hard budget indicator shown in the UI. |
| Feedback export bundle | Packaged Markdown/PDF output for review. |

---

## Core Flow

Project open -> Outline -> Draft generation -> Critique -> Snapshot/Recovery -> Export.

The current runtime backs this with:
- `/outline/build`
- `/draft/generate`
- `/draft/critique`
- `/draft/rewrite`
- `/draft/accept`
- `/history/*`
- `/export/*`

There is no batch critique job endpoint in the current runtime.

## Current Status

- Phase 8: complete
- Phase 8.5: complete (runtime hardening / control-plane alignment)
- Phase 9: ready to begin

The runtime is stabilized and service-first. Phase 9 builds on top of that system, not inside it.
Phase 9 builds understanding, Phase 10 enforces constraints, and Phase 11 enables customization.

---

## Phase 8 - Core system and editor quality

This phase delivered the core service-first writing flow.

Completed scope:
- outline-faithful editorial quality
- bounded rewrite/retry behavior
- UI and layout stability
- recovery and export correctness

Phase 8 is closed. Remaining runtime cleanup belongs to Phase 8.5.

---

## Phase 8.5 - Runtime hardening / control-plane alignment

This phase closed the gap between the docs and the runtime.

Completed:
- docs aligned with runtime
- removal of fake job-coordinator / background-worker / hook claims
- `AgentOrchestrator` removed from the runtime namespace
- execution policy centralized in `ExecutionPolicyRunner`
- budget authority centralized in `BudgetService`
- resilience layers explicitly separated

Architecture guarantees:
- service-first runtime
- no hidden orchestration layer
- explicit ownership:
  - control plane = app + services
  - execution policy = `ExecutionPolicyRunner`
  - budget authority = `BudgetService`
  - resilience = separated by layer

Exit criteria:
- no duplicate policy ownership
- no misleading agent/orchestrator abstractions
- no stale roadmap claims of unimplemented systems
- tests reflect actual architecture
- docs match runtime behavior

---

## Phase 9 - Control, visibility, and insight layer

This is the first feature phase after stabilization.

Phase 9 adds controlled execution, visibility, and interpretation surfaces on top of the stabilized service-first runtime.

The analytics service is one service boundary inside Phase 9. It is not a hidden agent system and it does not introduce a new control plane.

Scope:
- optional Pipeline Mode for outline -> draft -> critique -> optional rewrite
- story build timeline derived from history and revision data
- scene provenance panel showing inputs, outline nodes, prompt influences, and revisions
- safe regeneration modes that preserve locked facts
- emotion arc graph for character and story
- pacing curve visualization
- conflict heatmap
- scene intensity timeline
- narrative flow diagnostics
- outline validation engine
- project health dashboard

Constraints:
- no new control plane
- no agent runtime
- no background-worker system unless explicitly justified
- no queue or job system
- no duplicate execution or budget policy
- no UI-owned execution logic
- all features use the existing service-first architecture

Phase 9 begins only after Phase 8.5 is complete.

---

## Phase 10 - File ownership, continuity, and validation

This phase enforces story ownership and continuity constraints on top of the Phase 9 insight layer.

Scope:
- file ownership system
- continuity pressure warnings
- lore dependency graph
- stronger validation

---

## Phase 11 - Style, plugins, and multi-project support

Goal: define the future customization and extension surface without pretending an agent runtime already exists.

Key deliverables:
- style configs
- persona tuning
- plugin system
- multi-project support
- optional test-support wrappers around explicit service workers, if they remain useful
- plugin registry and sandbox behavior limited to the entrypoint-based implementation described in `docs/specs/plugin_sandbox.md`
- plugin safety and permission handling
- backup verification visibility and operational hardening
- smart merge tool for safe scene/chapter merges
- offline mode indicator and cache manager
- export surface polish, if still needed, stays subordinate to customization and plugin work

Done when:
- plugin registry and sandbox tests cover the implemented entrypoint path
- backup verification and offline cache tooling ship with explicit runtime flags and documented behavior
- any future hook system is documented as future work until actual dispatch exists

Sequencing note: hook dispatch remains deferred until long-form reliability/control is closed and a real orchestration need exists.

---

## Future Work

- Voice input / notes remain deferred.
- A durable job coordinator only becomes necessary if the product adds durable jobs, cancellation, or cross-request orchestration.
- Plugin hook dispatch remains future design only until code exists.
