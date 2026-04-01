Status: Draft
Version: 1.0
Last Reviewed: 2025-11-15
Phase: Phase 11 (Style, persona, plugin, and multi-project support)
Source of Truth: Align with `docs/phases/phase_charter.md` Phase 11 scope; do not diverge from that source.
Legacy filename retained; this doc now covers Phase 11 customization and extension work.

# docs/phases/phase11_export_pipeline.md - DRAFT
> Implementation trace: `docs/BUILD_PLAN.md` -> Phase 11 row.

## Scope
Deliver customization and extension surfaces for style configs, persona tuning, plugin support, and multi-project workflows.

Export behavior remains available as a supporting capability, but it is not the definition of this phase.

## Done When
- Style profiles can be loaded, edited, and persisted without changing execution policy.
- Persona tuning can influence prompt assembly and renderer presentation in a controlled way.
- Plugin support remains sandboxed and entrypoint-based, with no hook-dispatch fantasy.
- Multi-project workflows can summarize and switch between projects safely.

## Style and Persona
- Style configs define voice, tone, and presentation defaults.
- Persona tuning adjusts prompt assembly and downstream presentation while keeping service boundaries explicit.
- The UI should surface the current style/persona state clearly when a project is open.

## Plugin Support
- Plugins remain separate from the runtime control plane.
- Plugin registry, sandbox, and permission behavior stay entrypoint-based and test-covered.
- Any future hook dispatch stays future-only until actual dispatch code exists.

## Multi-Project Support
- The launcher should summarize recent projects and make switching explicit.
- Project summaries should surface health, backup, and support signals without introducing a job system.

## Export Behavior
- Existing export formats continue to work, but export polish is subordinate to customization and plugin work in this phase.
- Any export metadata changes must remain compatible with the service-first runtime.

## Acceptance
1. Style and persona settings persist without affecting the control plane.
2. Plugin support remains sandboxed and does not imply an agent runtime.
3. Multi-project summaries work without queue or background-worker assumptions.
