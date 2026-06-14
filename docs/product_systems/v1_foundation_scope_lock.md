# V1 Foundation Scope Lock

## 1. Status Header

- Artifact name: `V1 Foundation Scope Lock`
- Status: `drafted`
- Artifact type: `scope lock`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-14`
- Scope: `constrained v1 foundation slice for implementation planning`
- Out of scope: `runtime implementation`, `AI routing`, `sync`, `background jobs`, `deferred intelligence systems`

## 2. Purpose

Define the smallest useful Black Skies implementation-planning slice without reopening broader product sprawl.

This scope lock exists so implementation planning can begin around a local-first writing foundation while keeping deferred AI, graph, memory, sync, and background systems out of the first build slice.

This artifact is subordinate to:

- [current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md)
- [system_interaction_map.md](/C:/Dev/black-skies/docs/product_systems/system_interaction_map.md)
- [pre_code_discovery_plan.md](/C:/Dev/black-skies/docs/product_systems/pre_code_discovery_plan.md)
- [truth_and_state_ownership_matrix.md](/C:/Dev/black-skies/docs/product_systems/truth_and_state_ownership_matrix.md)
- [surface_to_owner_action_handoff_contract.md](/C:/Dev/black-skies/docs/product_systems/surface_to_owner_action_handoff_contract.md)
- [protected_content_permission_matrix.md](/C:/Dev/black-skies/docs/product_systems/protected_content_permission_matrix.md)
- [document_interchange_source_destination_contract.md](/C:/Dev/black-skies/docs/product_systems/document_interchange_source_destination_contract.md)
- [snapshot_protected_recovery_contract.md](/C:/Dev/black-skies/docs/product_systems/snapshot_protected_recovery_contract.md)
- [provenance_state_model.md](/C:/Dev/black-skies/docs/product_systems/provenance_state_model.md)
- [degraded_mode_execution_contract.md](/C:/Dev/black-skies/docs/product_systems/degraded_mode_execution_contract.md)

## 3. V1 Foundation Purpose

The `v1` foundation slice is:

- a local-first prose editor,
- with a sovereign `Writing Surface`,
- with a separate non-gating `Command Center Surface`,
- with basic project and library navigation,
- with manuscript truth owned only by `Narrative Insertion / Narrative Assertion`,
- with honest save-state and degraded-state cues,
- with bounded snapshots and recovery,
- with bounded import staging,
- with clean manuscript export.

The `v1` foundation slice is not:

- an AI runtime,
- a sync product,
- a background-job platform,
- a shadow-canon system,
- a graph-runtime platform,
- a memory-runtime platform,
- an everything-at-once workstation shell.

## 4. V1 Core

The following systems are inside the locked `v1` core:

1. `Writing Surface`
   - sovereign direct prose entry
   - low-friction continuation of prose
   - minimal current-writing context
   - no mandatory Story Unit, Outline, or AI gate
2. `Narrative Insertion / Narrative Assertion`
   - sole owner of accepted manuscript truth
   - sole owner of accepted assertion truth
   - explicit author-owned acceptance or conversion path only
3. `Command Center Surface`
   - clearly separate support surface
   - non-gating
   - support-only identity
4. `Binder / Project Library`
   - basic project browsing and grouping
   - organization metadata only, not truth ownership
5. `Workflow Spine / Author Journey`
   - minimal optional workflow guidance
   - resume and support handoff posture only
6. `Snapshots / Backup / Restore / History`
   - basic snapshots
   - bounded history
   - preview, copy, and governed restore posture
7. `Service Health / Offline / Degraded Mode`
   - honest healthy, offline, degraded, blocked, and recovery-first cues
   - direct writing preserved whenever local editing is still safe
8. bounded `Import Export Document Interchange`
   - conservative import staging
   - visible destination classification
   - visible format-loss warnings
   - explicit clean manuscript export

## 5. V1 Support

The following systems are inside `v1` as bounded support only:

1. `Settings / Preferences / Workspace Layout`
   - core settings and layout persistence only
2. `Splash / Startup Experience`
   - basic open, resume, and degraded-state cues only
3. `Accessibility / Hotkeys / Large-Font Mode`
   - basic accessibility baseline only
4. `Diagnostics / Error Visibility / Debug Console`
   - basic error visibility and bounded diagnostics only
5. `Testing / Harness / Evidence Contract`
   - core evidence and verification expectations only
6. `Project Index / Search / Retrieval`
   - basic search and source-linked retrieval only
7. `Feedback Notes / Revision Resolution`
   - manual or local-only note capture, review, and explicit resolution only if the final anchor contract stays small and safe
8. `File Manager / Asset Pane`
   - browse, open, and bounded attach or link behavior only if the first-scope file-state contract stays narrow and protection-safe

Support systems in this slice must not become alternate truth owners, AI backdoors, or hidden workflow gates.

## 6. V1 Optional

The following systems may be included in later `v1` planning only if they remain clearly non-authoritative and do not delay the foundation slice:

1. `Outline`
   - optional planning map only
2. `Prose / Scene Projection`
   - optional projection or comparison view only
3. `Story Unit`
   - optional grouping or work container only
4. `Scene Cards / Corkboard`
   - only as a non-authoritative view over planning or projection state

If any optional system begins to reopen authority, recovery, or truth-mutation questions beyond the bounded foundation slice, it exits `v1`.

## 7. Explicit Deferrals

The following systems are explicitly deferred out of the `v1` foundation slice:

- `Companion`
- `Memory Lab`
- durable `Signal Architecture` runtime
- `Continuity`
- `Critique / Evaluation`
- `Draft Generation / Rewrite Loop`
- `Character Cards`
- `Lore Cards`
- `Relationship Map`
- `Emotion Graph`
- `Theme System`
- `Series Binder / Cross-Story Linking`
- `Async Job Queue / Task Runner`
- `Plugin / Rubric System`
- Google Docs sync or round-trip
- AI routing
- LLM package construction
- explicit-content outbound paths

Deferred means:

- not required for `v1` implementation planning,
- not allowed to arrive through a side door as “small helper” scope,
- not allowed to claim runtime authority inside the foundation slice,
- not allowed to redefine save-state, truth, transfer, or recovery behavior for `v1`.

## 8. V1 Hard Rules

The `v1` foundation slice must obey all of the following:

- no silent truth mutation
- no silent durable-state mutation
- no silent outbound transfer
- no silent paid spend
- no routed AI
- no background jobs
- no hidden `Companion` authority
- no shadow canon
- direct writing always available when local editing is safe

Additional `v1` hard rules:

- accepted manuscript truth lives only in `Narrative Insertion / Narrative Assertion`
- visible support surfaces do not gain ownership by display alone
- import defaults to staging, review, or explicit classification rather than truth placement
- snapshots are historical evidence, not truth authority
- degraded mode must fail closed for risky mutation and fail open for safe local writing where possible
- protection state must survive export, recovery, and inspection boundaries

## 9. Implementation Blockers Before Code Planning

Implementation planning for the `v1` foundation slice remains blocked until the following exact contracts are narrowed enough for build order and dependency planning:

1. Save-state honesty vocabulary
   - exact `saved`, `pending`, `degraded`, `recoverable`, `at risk`, `read-only`, and recovery-first posture across:
   - [writing_surface.md](/C:/Dev/black-skies/docs/product_systems/writing_surface.md)
   - [workflow_spine_author_journey.md](/C:/Dev/black-skies/docs/product_systems/workflow_spine_author_journey.md)
   - [snapshots_backup_restore_history.md](/C:/Dev/black-skies/docs/product_systems/snapshots_backup_restore_history.md)
   - [service_health_offline_degraded_mode.md](/C:/Dev/black-skies/docs/product_systems/service_health_offline_degraded_mode.md)

2. `Narrative Insertion / Narrative Assertion` state and provenance transitions
   - exact author workflow for manuscript edits, accepted assertions, candidate confirmation, restore acceptance, and import-to-truth handoff
   - exact distinctions among draft text, accepted manuscript text, accepted assertions, advisory suggestions, and package or context artifacts

3. Import staging object map
   - exact object types for first-scope intake paths across staging, review, source material, candidate material, notes, binder placement, and archive material
   - exact first-scope format-loss warning behavior

4. Snapshot object-bundle and anchor-repair contract
   - exact early snapshot bundles
   - exact restore-as-copy versus restore-as-current posture
   - exact anchor repair for restored notes or linked support objects

5. `Command Center Surface` visibility and action boundary
   - exact always-visible versus contextual versus summonable support state
   - exact action-permission boundary so support visibility never becomes hidden authority

6. `Writing Surface` inline versus off-surface display boundary
   - exact boundary for inline notes, warnings, provenance cues, and other support state
   - exact rule for what must leave the manuscript surface and open in support views instead

Until these contracts are tightened, the `v1` slice may be scoped, but it is not ready for detailed code-planning order.

## 10. Do-Not-Build-Yet List

Do not build yet:

- `Companion`
- `Memory Lab`
- durable `Signal Architecture` runtime
- `Continuity`
- `Critique / Evaluation`
- `Draft Generation / Rewrite Loop`
- `Character Cards`
- `Lore Cards`
- `Relationship Map`
- `Emotion Graph`
- `Theme System`
- `Series Binder / Cross-Story Linking`
- `Async Job Queue / Task Runner`
- `Plugin / Rubric System`
- Google Docs sync or round-trip
- AI routing
- LLM package construction
- explicit-content outbound paths
- any paid-model or outbound-model execution
- any background or scheduled job system
- any durable memory, signal, or graph runtime introduced through support-surface convenience

## 11. Acceptance Criteria

This `v1` scope lock is acceptable only if:

- the slice stays small
- the slice stays local-first
- the slice stays non-AI
- the slice stays non-sync
- the slice keeps `Writing Surface` sovereign
- the slice keeps `Command Center Surface` separate and non-gating
- accepted manuscript truth remains owned only by `Narrative Insertion / Narrative Assertion`
- import remains conservative and staging-first
- export remains explicit and bounded
- snapshots and recovery remain governed and non-authoritative
- deferred systems are not smuggled back in through “bounded helper” language
- implementation planning may start from this slice without requiring `Companion`, `Memory Lab`, graph systems, AI routing, sync, or background execution

If a later proposal widens `v1` by reintroducing deferred AI, memory, graph, sync, or background behavior before the listed blockers are resolved, that proposal conflicts with this scope lock.
