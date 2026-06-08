# Phase 32 - Continuity Surface To Dossier Crosswalk

## Purpose

This crosswalk translates older Phase 29 surface, control, boundary, and intelligence evidence into the product dossier structure now governing Black Skies salvage planning.

It does not grant build permission.
It does not preserve old runtime authority by default.
It does not make any single old surface the owner of continuity truth.

## Why This Crosswalk Exists

Phase 29 captured old runtime truth.
Phase 32 and the product dossier registry define future authority.

Without a crosswalk:

- Phase 29 evidence stays trapped in inventory form,
- continuity-bearing surfaces may drift into new authority without review,
- old scene-oriented workflow gravity may re-enter the salvage shell,
- support and plumbing surfaces may be mistaken for product-authority systems.

## Source Inputs

This crosswalk uses the following canonical source docs:

- [authority_boundary_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/authority_boundary_matrix.md)
- [keep_merge_hide_defer_delete_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md)
- [gui_surface_inventory.md](/C:/Dev/black-skies/docs/audits/phase29/gui_surface_inventory.md)
- [tool_button_control_inventory.md](/C:/Dev/black-skies/docs/audits/phase29/tool_button_control_inventory.md)
- [intelligence_surface_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/intelligence_surface_matrix.md)

## Translation Rules

Translation follows these rules:

1. A runtime surface is not automatic future authority.
2. A Phase 29 surface can map to one or multiple future dossiers.
3. Mapping does not mean build permission.
4. Support surfaces may map to system dossiers instead of product dossiers.
5. Scene-oriented runtime surfaces must not re-establish scene-first architecture.
6. Continuity-bearing tools may become contextual Command Center systems instead of primary UI surfaces.
7. No single old surface owns continuity truth.
8. Old mixed-authority shells should be decomposed into product, intelligence, and system destinations.

## Current Product Doctrine Constraints

All mapping must preserve:

- Writing Surface sovereignty,
- Command Center non-gating behavior,
- Narrative Insertion / Narrative Assertion as foundation,
- Story Unit optionality,
- Outline optionality,
- prose and scene as projection or compatibility only,
- inferred or AI output as advisory unless accepted.

## Crosswalk Table

| Phase 29 id | Source surface or control | Current runtime role | Continuity relevance | Future dossier destination | Visibility class | Authority class | Build posture | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `P29-SURF-001` | Project Home | landing, open/create, status | low | `Workflow Spine / Author Journey`; `Binder / Project Library` | always visible | product | later | Useful for entry flow, not continuity authority |
| `P29-SURF-004` | Outline / Wizard Panel | planning surface | medium | `Outline`; `Workflow Spine / Author Journey` | contextual or summonable | product | later | Must not regain mandatory-gate authority |
| `P29-SURF-005` | Writing Surface / Draft Preview | authoring surface | medium-high | `Writing Surface`; `Prose / Scene Projection` | always visible | product | foundational | Continuity may be displayed here, but this surface does not own continuity truth |
| `P29-CTRL-003+004` | Generate Draft and generation scope | authoring-adjacent mutation | medium | `Draft Generation / Rewrite Loop`; `Local LLM vs Paid API Routing`; `Budget / Token / Cost Guardrails` | contextual | intelligence plus system | later | Generation controls belong near writing, but routing and budget concerns are separate dossiers |
| `P29-SURF-006` | Story Insights / Analytics Dashboard | analytics surface | high | `Continuity`; `Timeline / Pacing / Pressure`; `Emotion Graph`; `Critique` | contextual or summonable in Command Center | intelligence | later | Old dashboard framing must not survive as default authority |
| `P29-SURF-008` | Relationship Graph | hidden analytics relationship pane | medium | `Relationship Map` | advanced or future-only | intelligence | deferred | Graph form does not justify primary continuity authority |
| `P29-SURF-010` | Critique modal with rewrite/apply flow | critique and rewrite surface | high | `Critique`; `Draft Generation / Rewrite Loop`; `Feedback Notes / Revision Resolution` | contextual or summonable | intelligence | validate later | Interpretation and mutation must stay explicitly bounded |
| `P29-SURF-012` | Companion Overlay | advisory intelligence surface | high | `Companion`; `Local LLM vs Paid API Routing`; `Model Router / Provider Execution Policy`; `Budget / Token / Cost Guardrails` | contextual | intelligence | deferred | Does not own continuity truth or authorial truth |
| `P29-SURF-013` | Snapshots and Verification Panel | persistence and safety tooling | medium | `Snapshots / Backup / Restore / History` | support-only | system | later | May consume continuity artifacts later, but is not continuity authority |
| `P29-SURF-014` | Recovery, service health, offline, and toast surfaces | support and recovery status | medium | `Service Health / Offline / Degraded Mode`; `Diagnostics / Error Visibility / Debug Console` | support-only | system | later | Support and diagnostics remain separate from product-intelligence authority |
| `P29-SURF-015` | Split Command Workspace | experimental orchestration shell | high | `Command Center Surface`; `Workflow Spine / Author Journey` | deferred or experimental | product shell | deferred | Useful as reference for shell ideas, not current authority |
| `P29-CTRL-017` | command registry routing and zone metadata | advanced orchestration access | medium | `Workflow Spine / Author Journey`; `Settings / Preferences / Workspace Layout`; `Model Router / Provider Execution Policy`; `Plugin / Rubric System` | advanced or hidden | system plus orchestration | later | Metadata is real, but visible authority should stay narrow |
| `P29-BOUND-012` | docking, pane management, and layout machinery | support layout machinery | low-medium | `Settings / Preferences / Workspace Layout`; `Accessibility / Hotkeys / Large-Font Mode` | advanced or support | system | later | Layout machinery must not define product authority |

## Writing Surface Mappings

Writing-related Phase 29 items map as follows:

- `P29-SURF-005` remains the strongest ancestor of the future [writing_surface.md](/C:/Dev/black-skies/docs/product_systems/writing_surface.md), but only as a product-authority reference, not as salvage architecture shape.
- `P29-CTRL-003+004` map partly to `Draft Generation / Rewrite Loop` and partly to routing or budget dossiers rather than a single monolithic writing toolbar.
- Prose display and projection concerns map to [prose_scene_projection.md](/C:/Dev/black-skies/docs/product_systems/prose_scene_projection.md), not to a scene-first shell spine.
- Continuity effects may appear inside Writing Surface, but Writing Surface does not become the owner of continuity storage or continuity judgment.

## Command Center Mappings

Command-side planning and inspection items map as follows:

- `P29-SURF-006` Story Insights becomes a future Command Center-hosted intelligence family rather than a self-justifying dashboard.
- `P29-SURF-004` Outline or Wizard behavior maps to `Outline` and `Workflow Spine / Author Journey`, but must remain optional.
- `P29-SURF-015` Split Command remains reference evidence for command-side composition, not current authority.
- `P29-CTRL-017` command metadata may eventually support advanced Command Center behavior, but not as a hidden second application.

## Intelligence System Mappings

Key intelligence routing:

- `P29-SURF-006` and related analytics pressure map into:
  - `Continuity`
  - `Timeline / Pacing / Pressure`
  - `Emotion Graph`
  - `Critique`
- `P29-SURF-008` maps to `Relationship Map`
- `P29-SURF-010` maps to `Critique` and `Draft Generation / Rewrite Loop`
- `P29-SURF-012` maps to `Companion`
- Memory-bearing or forensic future work maps to `Memory Lab`
- routing and budget visibility map to:
  - `Local LLM vs Paid API Routing`
  - `Model Router / Provider Execution Policy`
  - `Budget / Token / Cost Guardrails`

No intelligence surface should silently claim authored truth.

## System/Plumbing Mappings

Support and plumbing items map into system dossiers instead of product-authority dossiers:

- `P29-SURF-013` and related snapshot controls:
  - `Snapshots / Backup / Restore / History`
- `P29-SURF-014` support and service health surfaces:
  - `Service Health / Offline / Degraded Mode`
  - `Diagnostics / Error Visibility / Debug Console`
- command registry and orchestration metadata:
  - `Testing / Harness / Evidence Contract`
  - `Plugin / Rubric System`
  - `Settings / Preferences / Workspace Layout`

These systems may constrain continuity behavior later, but they do not define continuity truth.

## Deferred Or Experimental Mappings

The following remain deferred or experimental:

- `P29-SURF-015` Split Command Workspace
- graph-heavy analysis surfaces such as `P29-SURF-008`
- autonomous rewrite or apply authority implied by `P29-SURF-010`
- visible promotion of command registry metadata from `P29-CTRL-017`
- any surface that would make Companion, Memory Lab, local AI runtime, paid API runtime, persistence writes, or Google Docs sync look build-ready before their dossiers exist

## Continuity-Specific Routing Notes

Continuity should route through the future product system like this:

- Writing Surface may display continuity effects, flags, or context.
- Command Center may inspect, compare, summarize, or route continuity concerns.
- The future `Continuity` dossier should own continuity system definition.
- `Story Unit`, `Outline`, `Critique`, and `Relationship Map` may consume continuity outputs later.
- `Snapshots / Backup / Restore / History` may preserve continuity artifacts later without becoming continuity truth.
- `Import / Export / Google Docs` may later consume continuity-aware projections without becoming continuity authority.

No single old surface, dashboard, graph, or modal owns continuity truth.

## Gaps And Missing Dossiers

Phase 29 evidence already points to dossier gaps that still need to be filled:

- `Continuity`
- `Critique`
- `Relationship Map`
- `Timeline / Pacing / Pressure`
- `Emotion Graph`
- `Draft Generation / Rewrite Loop`
- `Feedback Notes / Revision Resolution`
- `Snapshots / Backup / Restore / History`
- `Service Health / Offline / Degraded Mode`
- `Diagnostics / Error Visibility / Debug Console`
- `Local LLM vs Paid API Routing`
- `Model Router / Provider Execution Policy`
- `Budget / Token / Cost Guardrails`

## Recommended Follow-On Docs

The next follow-on docs should be:

- [continuity.md](/C:/Dev/black-skies/docs/product_systems/continuity.md)
- future `critique.md`
- future `relationship_map.md`
- future `snapshots_backup_restore_history.md`
- future `service_health_offline_degraded_mode.md`
- future `diagnostics_error_visibility_debug_console.md`

## Acceptance Criteria

This crosswalk is acceptable only if:

- it maps old evidence into future dossier destinations,
- it does not preserve legacy UI as future authority by default,
- it avoids scene-first drift,
- it keeps continuity distributed across proper product, intelligence, and system boundaries,
- it does not promote Companion runtime behavior, Memory Lab runtime integration, graph runtime surfaces, rewrite or apply automation, persistence writes, topology search, local AI runtime, paid API runtime, or Google Docs sync to build-ready status.
