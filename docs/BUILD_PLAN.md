Status: Active (Canonical)
Version: 1.0.0
Last Reviewed: 2025-11-15

# Build Plan – Phase 8–11 Implementation Bridge

Canonical Links:
- `docs/specs/architecture.md`
- `docs/specs/data_model.md`
- `docs/specs/endpoints.md`
- `docs/gui/gui_layouts.md`
- `docs/specs/analytics_service_spec.md`
- `docs/specs/agents_and_services.md`
- `docs/phases/phase_charter.md`
- `docs/CHANGELOG.md`
- `docs/version_manifest.json`

This bridge document ties the roadmap/phase charter into the canonical specs so every surface knows which doc to consult before shipping changes. Use it to trace Phase 8–11 deliverables back to their spec families (`docs/phases/`, `docs/specs/`, `docs/gui/`) and to the roadmap timeline (`docs/roadmap.md`). When BUILD_PLAN stabilizes, point tooling and agents back here to resolve scope debates.

## Phase Map (Canonical)

> **Status:** Source of truth for phases.  
> Every major feature or planning doc should attach to one or more phases below.  
> Advanced capture tooling is a hard gate—shipment waits until every core and extras item completes.

### Phase 1–3: Core Writer Loop
- Wizard/onboarding (`docs/onboarding.md`)
- Binder/Draft Board and core GUI layouts (`docs/gui/gui_layouts.md`)
- Companion loop orchestration with Overseer + Critique Service + Rewrite Service (`docs/specs/agents_and_services.md`, `docs/phases/phase9_companion_loop.md`)

### Phase 4–5: Integrity & Export
- Export pipeline (`docs/phases/phase11_export_pipeline.md`, `docs/gui/exports.md`)
- Recovery pipeline and snapshots (`docs/phases/phase10_recovery_pipeline.md`)
- Backup & migration ZIPs with verification (`docs/backup_and_migration.md`, `docs/specs/backup_verification_daemon.md`)

### Phase 6: Analytics & Telemetry
- Analytics Service and metrics (`docs/specs/analytics_service_spec.md`)
- Dashboard initiatives (`docs/phases/dashboard_initiatives.md`)
- Performance telemetry policy and wiring (`docs/specs/performance_telemetry_policy.md`)

### Phase 7: Advanced Tools & Capture (Required Before Final Wrap)
- Voice notes & transcription (`docs/specs/voice_notes_transcription.md`)
- Smart merge tool (`docs/deferred/smart_merge_tool.md`)
- Offline cache manager (`docs/offline_cache_manager.md`)
- Plugin sandbox (`docs/specs/plugin_sandbox.md`)

### Phase 8: GUI Polish & Accessibility
- GUI refinement and docking UX polish (`docs/gui/gui_layouts.md`, `docs/phases/phase8_gui_enhancements.md`)
- Theming, high contrast, and accessibility toggles (`docs/gui/gui_theming.md`, `docs/gui/accessibility_toggles.md`)

### Phase 9: Packaging & Final Wrap
- Packaging and installer (`docs/packaging.md`)
- Final release checklist / wrap-up (`docs/post_release_checklist.md`)
- Final documentation/plan pass to ensure planning docs match actual behavior and shipped feature set.

## Notes on scope
- The Phase Map above replaces the older table; use it (plus `docs/roadmap.md` and `docs/phases/phase_charter.md`) for status tracking and scope alignment.
- Refer to the spec index sections in `docs/specs/` and `docs/gui/gui_layouts.md` when jumping between architecture, data, endpoints, analytics, and services.
- Deferred or archival work lives under `docs/deferred/`; consult `docs/idea_backlog.md` before adding new future-facing items.
