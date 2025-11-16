Status: Active (Canonical)
Version: 1.0.0
Last Reviewed: 2025-11-15

# docs/specs/architecture.md — System Architecture v1.1

Spec Index:
- Architecture (`./architecture.md`)
- Data Model (`./data_model.md`)
- Endpoints (`./endpoints.md`)
- GUI Layouts (`../gui/gui_layouts.md`)
- Analytics Spec (`./analytics_service_spec.md`)
- BUILD_PLAN (TBD)
- Phase Charter (`../phases/phase_charter.md`)

Phase 11 analytics pipelines and Companion agents are defined in detail in [Agents & Services](./agents_and_services.md); the sections below highlight where those modules slot into the runtime topology.

---

## New Components Added Post-RC1 (shipping in v1.1)
- **Analytics Service Module:** aggregates emotion/pacing/conflict metrics (see [Agents & Services](./agents_and_services.md#agent-roles) for producer responsibilities).
- **Agent Sandbox:** isolated execution for plugins/agents (see [Plugin sandbox plan](./plugin_sandbox.md)).  

## Deferred / Flagged Features
- **Voice Input Handler (Deferred):** The dictation & voice-note workflow described in [Voice Notes plan](../deferred/voice_notes_transcription.md) remains on the roadmap but no recorder/transcription endpoints ship in v1.1.
- **Backup Verifier Daemon (Flagged Off):** The daemon exists behind `backup_verifier_enabled`, but it is disabled in all builds and the UX mentioned in [Backup Verification Daemon plan](./backup_verification_daemon.md) is not surfaced. Health responses continue to report static `"warning"` status until the verifier ships.
- **Plugin Runner (Deferred):** Plugin/agent execution sits behind the `BLACKSKIES_ENABLE_PLUGINS` guard and remains disabled for Phase 8; no plugin process is invoked in the production surface described here.

---

## Updated Data Flow
Project open → Outline planning (Wizard) → Draft generation → Critique → Snapshots & recovery → Exports  
→ **Model Router** → **Analytics/Agents** → Exports.  
This mirrors the running services: `/outline/build`, `/draft/generate`, `/draft/critique`, `/batch/critique`, `/history/*`, and `/export/*` form the current backend surface that the renderer consumes.

---

## Model Router Boundary (Phase 2+)
All AI calls (outline, draft, critique, and automation endpoints) traverse the Model Router before reaching `local_llm`, `openai`, or future providers such as `deepseek`. This layer enforces budgets, Insights Overlay privacy, and policy-aware routing so FastAPI services never directly invoke external APIs.

---

## Process Boundaries (Expanded)
Renderer ⇄ FastAPI ⇄ Filesystem ⇄ Model Router ⇄ Analytics/Agent Sub-services (orchestrated per [Agents & Services](./agents_and_services.md#plugin-registry-spec)).
---

## Desktop UI Layout Notes
- The desktop shell ships with the locked preset described in [gui_layouts.md](./gui_layouts.md) (`Outline | Writing view | Feedback notes | Timeline`) plus the floating Story insights pane. Panes can be resized inside those bands but cannot yet be re-docked or detached.
- Phase 8 "GUI Enhancements" + Phase 9 dashboards are captured in [Docking plan](./phase8_gui_enhancements.md), [Dashboard initiatives](./dashboard_initiatives.md), and phase_log.md.

---

## Future Enhancements (Not yet implemented)
- **Voice Input Handler:** The dictation/voice-note workflow described in [Voice Notes plan](../deferred/voice_notes_transcription.md) remains scoped but not shipped; no recorder/transcription endpoints or UI exist in production.
- **Backup Daemon UX:** Backup verification operates only through backend scripts; the described daemon UX is still planned and should not be treated as shipping today.
- **GUI Layout experiments:** Floating Story insights, additional panes, docking, and other layout promises are experimental flags and have not shipped; they belong in future updates rather than the current default experience.
