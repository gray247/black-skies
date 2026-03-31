Status: Active (Canonical)
Version: 1.0.2
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

---

## Phase 8 - Reliability and editor quality

This phase is about keeping the existing writing flow stable.

Current focus:
- outline-faithful editorial quality
- bounded rewrite/retry behavior
- UI and layout stability
- recovery and export correctness

This phase is already mostly a runtime/runtime-quality problem, not a new architecture problem.

---

## Phase 9 - Analytics and visualization

This phase adds analytics surfaces on top of the existing service layer.

The analytics service is a separate service boundary. It is not a hidden agent system.

---

## Phase 10 - Accessibility and exports

This phase expands the current UI and export surfaces.

It should not introduce new orchestration assumptions.

---

## Phase 11 - Extensions and optional wrappers

Goal: define the future extension surface without pretending the agent system already exists.

Key deliverables:
- optional test-support wrappers around explicit service workers, if they remain useful
- plugin registry and sandbox behavior limited to the entrypoint-based implementation described in `docs/specs/plugin_sandbox.md`
- plugin safety and permission handling
- backup verification visibility and operational hardening
- multi-project dashboard with recent list
- smart merge tool for safe scene/chapter merges
- offline mode indicator and cache manager

Done when:
- plugin registry and sandbox tests cover the implemented entrypoint path
- backup verification and offline cache tooling ship with explicit runtime flags and documented behavior
- any future hook system is documented as future work until actual dispatch exists

Sequencing note: hook dispatch remains deferred until long-form reliability/control is closed and a real orchestration need exists.

---

## Future Work

- Voice input / notes remain deferred.
- A durable job coordinator only becomes necessary if the product adds queued jobs, cancellation, or cross-request orchestration.
- Plugin hook dispatch remains future design only until code exists.
