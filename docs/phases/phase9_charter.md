Status: Draft
Version: 1.1
Last Reviewed: 2026-03-31
Source of Truth: `docs/phases/phase_charter.md` defines the canonical phase sequence. Phase 9 begins only after Phase 8.5 is complete.

# Phase 9 Charter - Analytics, Visualization, and Insight Layer
> Implementation trace: `docs/roadmap.md` -> Phase 9 row.

This charter defines the first feature phase after the runtime has been stabilized. It is built on top of the service-first control plane and does not introduce a new orchestration layer.

## Scope
- **Emotion arc graph:** character and story emotion timelines derived from existing scene and critique data.
- **Pacing curve visualization:** scene intensity, length, and pacing trend views that help writers spot drag or spikes.
- **Conflict heatmap:** conflict density and coverage views for scenes and chapters.
- **Scene intensity timeline:** per-scene narrative intensity tracking for the existing draft surface.
- **Narrative flow diagnostics:** project-level flow, continuity, and progression signals surfaced through analytics views.
- **Outline validation engine:** validate outline and scene structure against the existing service layer and report issues clearly.
- **Project health dashboard:** summarize the analytics state, validation state, and recent writer feedback in one service-backed view.

## Out of Scope
- **Control-plane changes:** no new control plane, no Overseer, and no agent runtime.
- **Queue systems:** no job queue or background worker semantics unless a later design explicitly justifies them.
- **Plugin hooks:** no hook dispatch surface is implied by this phase.
- **Phase 11 features:** plugin sandbox hardening, backup verification visibility, and optional wrappers remain later work.
- **Voice notes/transcription:** still deferred.

## Deliverables
- **User-facing**
  - Emotion arc and pacing views in the analytics drawer.
  - Conflict heatmap and scene intensity timeline for project review.
  - Outline validation results and project health summaries.
- **Internal**
  - Service-backed analytics endpoints or service methods that reuse the existing service-first runtime.
  - Schema validation for analytics payloads.
  - Diagnostics and tests that prove the analytics layer does not become a hidden queue or control plane.

## Acceptance Criteria
- Analytics features use the existing service-first architecture.
- Budget decisions continue to come from `BudgetService`, not the analytics layer.
- Routers stay thin and only map requests to services.
- No batch/job/Overseer language is required to explain the implementation.
- Docs and tests agree on the same feature boundary.

## Done When
- Emotion arc, pacing, conflict, intensity, and project-health views are implemented on top of the stabilized runtime.
- Outline validation is wired to the existing service layer and produces deterministic diagnostics.
- The docs for analytics, GUI layout, and endpoints all describe the same non-queued service-first model.
- The roadmap clearly shows Phase 9 as the first feature phase after Phase 8.5.

## Testing Requirements
- Add service-level tests for the analytics payload builder and validation engine.
- Add GUI tests for the analytics drawer or dashboard surfaces once they exist.
- Add endpoint tests for any Phase 9 routes or service methods that are introduced.

## Risks & Mitigations
- **Scope drift:** keep analytics focused on insight surfaces, not orchestration.
- **Queue creep:** if a future refresh job is needed, document the coordinator decision separately before shipping code.
- **Validation churn:** keep analytics schemas versioned and test against the checked-in payload fixtures.

### Phase 9 Index
- [`docs/specs/analytics_service_spec.md`](../specs/analytics_service_spec.md) - Analytics payload and storage contract for the new insight surfaces.
- [`docs/phases/dashboard_initiatives.md`](./dashboard_initiatives.md) - Dashboard deliverables and dependencies for Project Health and outline validation.
- [`docs/specs/endpoints.md`](../specs/endpoints.md) - API contract notes for the deferred analytics surfaces.
- [`docs/gui/gui_layouts.md`](../gui/gui_layouts.md) - Renderer surfaces that consume analytics once Phase 9 lands.
- [`docs/specs/performance_telemetry_policy.md`](../specs/performance_telemetry_policy.md) - Telemetry targets and collection rules for analytics features.
- [`docs/ops/support_playbook.md`](../ops/support_playbook.md) - Operational runbook for the analytics dashboards once they ship.

## Future Work
- Phase 10 handles accessibility and professional exports.
- Phase 11 handles extensions and optional wrappers.
- Any job coordinator or hook dispatcher design remains future-only until explicitly implemented.
