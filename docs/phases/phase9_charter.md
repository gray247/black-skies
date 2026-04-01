Status: Draft
Version: 1.1
Last Reviewed: 2026-03-31
Source of Truth: `docs/phases/phase_charter.md` defines the canonical phase sequence. Phase 9 begins only after Phase 8.5 is complete.

# Phase 9 Charter - Control, Visibility, and Insight Layer
> Implementation trace: `docs/roadmap.md` -> Phase 9 row.

Phase 9 turns the stabilized service-first runtime into a controllable, inspectable storytelling engine. It is the first feature phase after hardening, and it builds on top of the existing control plane rather than introducing a new one.

This phase is about making system behavior visible, allowing controlled execution, and enabling surgical edits without destabilizing the story.

## Core Systems
1. **Pipeline Mode**
   - Optional execution mode that runs outline -> draft -> critique -> optional rewrite.
   - Synchronous only. No queue system, no background worker architecture, and no new control plane.
   - Reuses the existing service-first flow and service-layer validation.
2. **Story Build Timeline**
   - Chronological record of generation, critique, rewrite, and snapshot events.
   - Filterable and inspectable.
   - Derived from the existing history and revision systems.
3. **Scene Provenance Panel**
   - Shows the inputs that produced a scene, the outline node, prompt influences, and revisions applied.
   - Pairs with the story build timeline so writers can trace how a scene changed.
4. **Safe Regeneration Modes**
   - Controlled rewrite types: prose-only, pacing-only, structure-level, and full regeneration.
   - Preserves locked facts and other protected story state.

## Insight Layer
- **Emotion arc graph:** character and story emotion timelines derived from existing scene and critique data.
- **Pacing curve:** scene intensity, length, and pacing trend views that help writers spot drag or spikes.
- **Conflict heatmap:** conflict density and coverage views for scenes and chapters.
- **Scene intensity timeline:** per-scene narrative intensity tracking for the existing draft surface.
- **Narrative flow diagnostics:** project-level flow, continuity, and progression signals surfaced as interpretation layers over existing story data.
- **Project health dashboard:** a summary view that rolls up timeline, provenance, and insight data for project review.

## Constraints / Non-Goals
- No new control-plane abstraction.
- No agents or Overseer runtime.
- No queue or job system.
- No background-worker architecture.
- No duplicate execution or budget policy.
- No logic moved into the UI layer.
- No hook dispatcher unless a later design is implemented in code.

## Deliverables
- **User-facing**
  - Pipeline Mode entry points for controlled story execution.
  - Story build timeline and provenance views.
  - Insight surfaces for emotion, pacing, conflict, intensity, and project health.
- **Internal**
  - Service-backed methods or endpoints that reuse the existing service-first runtime.
  - Schema validation for insight payloads.
  - Diagnostics and tests that prove Phase 9 does not become hidden orchestration.

## Acceptance Criteria
- Phase 9 features use the existing service-first architecture.
- Budget decisions continue to come from `BudgetService`, not the insight layer.
- Routers stay thin and only map requests to services.
- No batch/job/coordinator language is required to explain the implementation.
- Docs and tests agree on the same feature boundary.

## Done When
- Pipeline Mode, story build timeline, provenance, safe regeneration, and insight views are implemented on top of the stabilized runtime.
- Outline validation and related diagnostics are wired to the existing service layer and produce deterministic results.
- The docs for control plane, GUI layout, endpoints, and phase charter all describe the same service-first model with no hidden background workers.
- The roadmap clearly shows Phase 9 as the first feature phase after Phase 8.5.

## Testing Requirements
- Add service-level tests for the insight payload builder, pipeline mode, and validation engine.
- Add GUI tests for the timeline, provenance, and insight surfaces once they exist.
- Add endpoint or service tests for any Phase 9 routes or service methods that are introduced.

## Risks & Mitigations
- **Scope drift:** keep Phase 9 focused on visibility and interpretation, not orchestration.
- **Queue creep:** if a future refresh job is needed, document the coordinator decision separately before shipping code.
- **Validation churn:** keep insight schemas versioned and test against the checked-in payload fixtures.

### Phase 9 Index
- [`docs/specs/analytics_service_spec.md`](../specs/analytics_service_spec.md) - Analytics payload and storage contract for the insight surfaces.
- [`docs/phases/dashboard_initiatives.md`](./dashboard_initiatives.md) - Dashboard and control-surface deliverables for Phase 9.
- [`docs/specs/endpoints.md`](../specs/endpoints.md) - API contract notes for the deferred Phase 9 surfaces.
- [`docs/gui/gui_layouts.md`](../gui/gui_layouts.md) - Renderer surfaces that consume Phase 9 timeline and insight data.
- [`docs/specs/performance_telemetry_policy.md`](../specs/performance_telemetry_policy.md) - Telemetry targets and collection rules for Phase 9 features.
- [`docs/ops/support_playbook.md`](../ops/support_playbook.md) - Operational runbook for the Phase 9 dashboards once they ship.

## Future Work
- Phase 10 handles file ownership, continuity pressure warnings, lore dependency graph work, and stronger validation.
- Phase 11 handles style configs, persona tuning, plugins, and multi-project support.
- Any job coordinator or hook dispatcher design remains future-only until explicitly implemented.
