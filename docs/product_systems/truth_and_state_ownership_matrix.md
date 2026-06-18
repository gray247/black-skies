# Truth And State Ownership Matrix

## 1. Status Header

- Artifact name: `Truth And State Ownership Matrix`
- Status: `drafted`
- Artifact type: `architecture governance`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-14`
- Scope: `truth ownership and durable state ownership only`
- Out of scope: `AI lifecycle`, `surface-to-owner action handoff`, `runtime schema`, `implementation`

## 2. Placement

This artifact belongs in `docs/product_systems/` because it governs cross-dossier ownership for the current product-system ecosystem.
It is architecture doctrine adjacent to [current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md) and [system_interaction_map.md](/C:/Dev/black-skies/docs/product_systems/system_interaction_map.md), not a runtime design or implementation schema.

## 3. Purpose

Define the first explicit ownership contracts for:

- accepted truth
- truth candidates
- durable support state

This artifact exists so product systems can observe, display, retain, transfer, or critique material without quietly becoming truth owners or durable-state owners by accident.

## 4. Core Rules

1. Accepted truth is always author-owned truth.
2. A system may display, compare, infer, package, retain, or transfer material without owning it.
3. `truth candidate` is not accepted truth.
4. `inferred truth` is not accepted truth.
5. `AI output` is not accepted truth.
6. `signal` is not accepted truth.
7. `note` is not accepted truth.
8. `memory` is not accepted truth.
9. `snapshot` is not accepted truth.
10. `projection` is not accepted truth.
11. `outline` is not accepted truth.
12. Accepted truth may change only through an explicit author-owned mutation path defined by the owning truth system.
13. Durable support state may be read by many systems, but ownership stays singular unless this artifact explicitly says otherwise.

## 5. Definitions

### 5A. Truth Definitions

- `author truth`: any accepted truth the author has explicitly written, accepted, saved, converted, or updated through the owning truth path
- `manuscript truth`: the current accepted authored manuscript text, not a suggestion, preview, projection experiment, snapshot preview, or outbound package
- `accepted narrative truth`: accepted story-bearing truth stored in author-owned foundations such as accepted narrative assertions and accepted manuscript text
- `accepted lore truth`: accepted world, setting, rule, history, or canon facts stored in author-owned lore records
- `accepted character truth`: accepted character facts, states, relationships, or biography facts stored in author-owned character records
- `accepted assertion truth`: explicit author-confirmed story truth, fact, or decision in `Narrative Insertion / Narrative Assertion`
- `accepted project truth`: explicit project-level goals, constraints, boundaries, intent, or story-setup decisions the author has confirmed for downstream systems

### 5B. Truth Role Definitions

- `truth owner`: the only system layer allowed to hold the accepted version of that truth object
- `truth consumer`: may read accepted truth for support work
- `truth observer`: may inspect accepted truth and produce advice, findings, or candidates
- `truth candidate`: a proposed, inferred, imported, recalled, or transformed item that is not yet accepted truth

## 6. Truth Sources, Consumers, Observers, Candidates

- `Truth sources`: `Narrative Insertion / Narrative Assertion`, `Lore Cards`, `Character Cards`, provisional `Author Intent / Story Setup` inside `Workflow Spine / Author Journey`
- `Truth consumers`: `Writing Surface`, `Continuity`, `Critique`, `Memory Lab`, `Companion`, `Outline`, `Story Unit`, `Projection`, `Document Interchange`
- `Truth observers`: `Continuity`, `Critique`, `Memory Lab`, `Companion`, `Project Index / Search / Retrieval`, later analytic systems
- `Truth candidates`: AI output, imported material, critique findings, continuity findings, notes, signals, memory recall, projection output, outline suggestions, package artifacts, snapshot restore previews

## 7. Truth Ownership Matrix

| Truth object | Qualifies as | Owner | Non-owners | Allowed mutation paths | Forbidden mutation paths |
| --- | --- | --- | --- | --- | --- |
| `accepted manuscript text` | current authored manuscript text and authoritative manuscript order | `Narrative Insertion / Narrative Assertion` via `Narrative Insertion` | `Companion`, `Critique`, `Continuity`, `Memory Lab`, `Signal Architecture`, `Feedback Notes`, `Draft Generation`, `Document Interchange`, `Snapshots`, `Routing`, `Package Construction`, `Outline`, `Projection`, `Command Center`, `Visual Arrangement View` | explicit author writing in `Writing Surface`; explicit author acceptance of rewrite text; explicit author-approved import placement into manuscript; explicit author-approved restore into current manuscript; explicit author-approved manuscript-order apply path through the truth owner | silent AI insertion; critique-to-prose auto-apply; continuity auto-repair; restore preview becoming current text; import drift overwrite; outline, prototype, projection, or visual-arrangement reorder becoming current text or order; signal resolution mutating text |
| `accepted assertion truth` | explicit author-confirmed story fact, event, decision, or claim | `Narrative Insertion / Narrative Assertion` via `Narrative Assertion` | all non-foundation systems | explicit author accept, save, or convert action through assertion-owning path; explicit author update of existing assertion | inserted prose silently creating accepted assertion; Companion promotion; Memory Lab recall promotion; critique finding promotion; continuity finding promotion; signal normalization promotion; import auto-canonization |
| `accepted narrative truth` | accepted story-bearing truth as a category | owning truth source for the specific object, usually `Narrative Insertion / Narrative Assertion` | `Continuity`, `Critique`, `Companion`, `Memory Lab`, `Signal Architecture`, `Outline`, `Projection`, `Command Center` | only through the owning truth source for the relevant object | any advisory or display system becoming a shadow canon store |
| `accepted continuity truth` | accepted continuity facts that the author wants treated as true | no separate continuity owner; truth must land in `Narrative Insertion / Narrative Assertion`, `Lore Cards`, `Character Cards`, or explicit author notes | `Continuity`, `Signal Architecture`, `Memory Lab`, `Companion`, `Critique` | explicit author accept plus explicit save, convert, or update into the proper truth owner | continuity findings remaining in Continuity and being treated as canon; signal state treated as continuity canon; Memory Lab recall treated as continuity canon |
| `accepted lore truth` | accepted world or canon facts | `Lore Cards` or other explicit author-owned lore records | `Continuity`, `Critique`, `Companion`, `Memory Lab`, `Signal Architecture`, `Document Interchange`, `Projection`, `Outline` | explicit author create, save, convert, or update action in lore-owning path; explicit author-approved import into lore records | import text silently becoming lore; critique or continuity silently updating lore; memory recall silently rewriting lore |
| `accepted character truth` | accepted character facts and states | `Character Cards` or other explicit author-owned character records | `Continuity`, `Critique`, `Companion`, `Memory Lab`, `Signal Architecture`, `Document Interchange`, `Projection`, `Outline` | explicit author create, save, convert, or update action in character-owning path; explicit author-approved import into character records | imported notes silently becoming character truth; continuity auto-fix; critique auto-fix; Memory Lab recall promotion |
| `accepted project truth` | explicit project goals, author intent, boundaries, story-setup decisions | provisional owner: `Workflow Spine / Author Journey` while `Author Intent / Story Setup` remains parked there | `Companion`, `Critique`, `Memory Lab`, `Signal Architecture`, `Document Interchange`, `Routing`, `Command Center` | explicit author confirm, save, or update action in the parked project-truth path | Companion silently setting goals; critique silently changing intent; routing silently changing project boundaries; workflow suggestion silently becoming project truth |

## 8. Direct Truth Mutation Matrix

| System | May directly mutate accepted truth? | Contract |
| --- | --- | --- |
| `Companion` | `No` | may explain, question, route, highlight, and propose; requires explicit author-owned truth path for any accepted change |
| `Critique / Evaluation` | `No` | may emit findings, signal candidates, note candidates, and rewrite-prompt candidates only |
| `Continuity` | `No` | may emit continuity findings and truth-support candidates only |
| `Memory Lab` | `No` | may retain governed recall and evidence; recall is not truth mutation |
| `Signal Architecture` | `No` | may own durable signal state, not accepted truth |
| `Feedback Notes / Revision Resolution` | `No` | may own note state and resolution state; accepted manuscript or assertion change still requires truth owner |
| `Draft Generation / Rewrite Loop` | `No` | generated or rewritten text remains advisory until the author accepts it through the owning truth path |
| `Import Export Document Interchange` | `No` | may stage or classify imports; imported truth requires explicit author-approved placement into a truth owner |
| `Snapshots / Backup / Restore / History` | `No` | may present restore candidates; restore to current truth requires explicit author approval |
| `Model Routing And Budget Architecture` | `No` | governs route permission only |
| `LLM Package Construction Architecture` | `No` | builds model packages only |
| `Writing Surface` | `Yes, but only for manuscript truth through explicit author input` | surface may author or edit manuscript text because it is the direct author entry path; it may not mutate other truth classes on behalf of support systems |
| `Narrative Insertion / Narrative Assertion` | `Yes` | foundation truth owner for accepted manuscript text and accepted assertion truth |
| `Workflow Spine / Author Journey` | `Yes, provisionally for accepted project truth only` | limited to parked `Author Intent / Story Setup` decisions confirmed by the author; requires future alignment |

## 9. Durable State Category Definitions

- `durable signal state`: signal lifecycle, provenance, mute, suppress, resolve, stale, expiry, and retained signal history
- `durable memory`: retained advisory memory, governed recall structures, evidence traces, and allowed durable memory classes
- `durable revision-note state`: note records, anchors, note history, resolution labels
- `local current-save state`: authoritative confirmation or unresolved risk posture for current author-owned editable work persisted locally
- `snapshot state`: restorable historical state, recovery metadata, restore markers
- `provenance state`: authorship metadata, AI-origin metadata, acceptance metadata, mask or exclusion provenance
- `workflow progress state`: resume markers, progress markers, workflow posture markers, provisional project-truth profile
- `preferences state`: global, project, or session preferences and layouts
- `index state`: search indexes, retrieval metadata, source labels, query preferences
- `project metadata`: organization metadata, grouping metadata, project-local browse state
- `routing history`: route decisions, approval records, budget history, blocked or refused run history
- `approval history`: explicit approvals or refusals attached to routing, export, masking, restore, or other governed actions
- `transfer history`: import or export metadata, document identity links, conflict markers

## 10. Durable State Ownership Matrix

| Durable state category | Owner | Consumers | Mutation rights | Storage expectations |
| --- | --- | --- | --- | --- |
| `durable signal state` | `Signal Architecture` | `Writing Surface`, `Command Center`, `Outline`, `Companion`, `Continuity`, `Critique`, `Memory Lab` | only `Signal Architecture`, the author, or an explicitly accepted workflow may create durable signal-state changes | durable, provenance-bearing, non-truth, local/private unless a later owner rule says otherwise |
| `durable memory` | `Memory Lab` | `Companion`, `Continuity`, `Critique`, later analytic systems | only `Memory Lab` may retain or delete memory under its retention rules; the author must explicitly save author-approved advisory memory or opt into raw excluded-span retention | durable only for allowed memory classes; must preserve memory type; must not collapse into canon |
| `durable revision-note state` | `Feedback Notes / Revision Resolution` | `Writing Surface`, `Command Center`, `Narrative Insertion / Narrative Assertion`, `Companion`, `Critique` | note creation, status changes, and resolution history belong here; downstream systems may propose note candidates only | durable advisory workflow state, not truth, anchored and source-labeled |
| `local current-save state` | `Project Persistence / Local Save` | `Writing Surface`, `Workflow Spine / Author Journey`, `Splash / Startup Experience`, `Command Center`, `Service Health / Offline / Degraded Mode`, `Snapshots / Backup / Restore / History` | only the local-save owner may confirm durable local current-save state or unresolved local-save risk posture; consumers may display or react, but not redefine ownership | durable operational state for current local-save truth, distinct from truth ownership, snapshot history, and health history |
| `snapshot state` | `Snapshots / Backup / Restore / History` | all storage-bearing systems | only snapshots owner may create snapshot records and restore metadata; restoring current truth requires author approval plus the owning truth path | historical, recoverable, clearly separated from current truth |
| `provenance state` | `Authorship Provenance AI Visibility` | `Writing Surface`, `Command Center`, `Companion`, `Critique`, `Document Interchange` | only provenance owner may persist provenance metadata; truth owners may emit source events that provenance records | local/private by default; not truth; must not leak masked or excluded raw content |
| `workflow progress state` | `Workflow Spine / Author Journey` | `Writing Surface`, `Command Center`, `Companion` | workflow markers and resume markers mutate here; accepted project truth remains a provisional subset requiring explicit author confirmation | durable where useful, bounded, non-truth except provisional parked project-truth fields |
| `settings and preferences state` | `Settings / Preferences / Workspace Layout` | all user-facing systems | settings owner only; no other system may silently persist high-risk preference changes | durable, user-controlled, subordinate to higher approval and privacy rules |
| `index state` | `Project Index / Search / Retrieval` | `Writing Surface`, `Command Center`, `Companion` | index owner may build, refresh, and prune indexes; retrieval consumers may query but not redefine index ownership | durable local reference state, non-canon, source-labeled, freshness-aware, and protection-aware |
| `outline planning and prototype state` | `Outline` | `Writing Surface`, `Command Center`, `Story Unit`, `Prose / Scene Projection`, `Draft Generation / Rewrite Loop` | only `Outline` may persist planning structure, intended order, and named prototype arrangements; applying a reorder or prototype to manuscript truth still requires the manuscript truth owner | durable planning metadata, advisory by default, may differ from manuscript order, not canon, not a branch, and no prose duplication by default |
| `projection container organization metadata` | `Prose / Scene Projection` | `Writing Surface`, `Command Center`, `Outline`, `Story Unit`, `Document Interchange`, `Snapshots / Backup / Restore / History` | only `Prose / Scene Projection` may persist chapter or scene container identity, metadata, and reference groupings where supported; moving or deleting containers may propose structure changes but may not directly mutate manuscript truth or order | durable organizational metadata for rendering and compatibility, reference-based, non-truth, and clearly separated from manuscript authority |
| `project organization metadata` | `Binder / Project Library` | `Writing Surface`, `Command Center`, `Project Index / Search / Retrieval`, `Document Interchange` | binder owner may mutate grouping, hierarchy, placement, and navigation metadata by reference only; organization is not truth mutation | durable navigation metadata, non-canon, may support multi-placement of the same underlying artifact |
| `file and asset metadata` | `File Manager / Asset Pane` | `Writing Surface`, `Command Center`, `Document Interchange`, `Project Index / Search / Retrieval` | file metadata, preview metadata, file identity, availability posture, linked-versus-local distinction, and repair posture mutate here; transfer authority still belongs elsewhere | durable browse state, must preserve hidden/protected boundaries and keep missing-file placeholders distinct from deletion |
| `routing history` | `Model Routing And Budget Architecture` | `Companion`, `Command Center`, `Service Health`, `Async Job Queue` | routing owner may record route decisions, caps, blocked states, refusals, and spend history | durable operational state, non-truth, audit-friendly |
| `approval history` | owning policy system for the action, with routing owning model-route approvals and document interchange owning transfer approvals | relevant surfaces and support systems | approvals must be recorded by the owner of the governed action, not by consumer surfaces | durable audit state, scope-labeled, never implied as blanket truth authority |
| `transfer history` | `Import Export Document Interchange` | `Command Center`, `Binder`, `File Manager`, `Companion` | only interchange owner may persist import or export history and document identity links | durable transfer metadata, not manuscript truth |
| `job queue state` | `Async Job Queue / Task Runner` | `Command Center`, `Companion`, background-capable systems | only queue owner may persist queue lifecycle and execution history | durable operational state, reviewable, non-authoritative |
| `health and degraded-state history` | `Service Health / Offline / Degraded Mode` | all runtime-dependent systems, `Command Center`, `Diagnostics` | only health owner may persist health-state records | durable operational state, not truth, honest about risk |
| `diagnostic evidence state` | `Diagnostics / Error Visibility / Debug Console` | operators, support surfaces, `Testing / Harness / Evidence Contract` | diagnostics owner may persist diagnostic bundles and evidence markers | durable but privacy-bounded witness state, not proof of product doctrine by itself |

## 11. Durable State Non-Ownership Rules

- `Writing Surface` may display notes, signals, provenance, memory recall, routing state, and workflow markers without owning them.
- `Writing Surface`, `Workflow Spine`, `Splash`, `Command Center`,
  `Service Health`, and `Snapshots` may display or consume local
  current-save state without owning it.
- `Command Center Surface` may aggregate state without becoming the owner of any aggregated category.
- `Companion` may explain state without owning the underlying durable state.
- `Continuity` and `Critique` may emit candidates and advisory records without owning signal state, note state, memory state, or truth state.
- `Document Interchange` may classify imports and record transfer history without owning manuscript truth, continuity truth, or memory.
- `Snapshots` may preserve history without owning current truth.

## 12. Ownership Violations Discovered

- `Workflow Spine / Author Journey` currently holds provisional `accepted project truth` while also being a workflow surface and durable-state owner. This is allowed for now, but it is not a clean long-term truth placement.
- `Memory Lab` and `Project Index / Search / Retrieval` both use indexing and retrieval language; state ownership is now split, but writer-facing labeling still needs to prevent recall versus retrieval drift.
- `Command Center Surface` surfaces blockers, prepared findings, routing state, memory summaries, and package state. It must keep reading rights without becoming an owner.
- `Document Interchange` still needs future alignment on import-created destination state before any import path can safely touch truth-bearing objects.
- `Snapshots / Backup / Restore / History` still needs future alignment for protected-content restore rules so historical state does not bypass truth and protection ownership.

## 13. Dossiers Requiring Future Alignment

- `workflow_spine_author_journey.md`
- `project_persistence_local_save.md`
- `narrative_insertion_assertion.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `authorship_provenance_ai_visibility.md`
- `import_export_document_interchange.md`
- `snapshots_backup_restore_history.md`
- `project_index_search_retrieval.md`
- `command_center_surface.md`
- `companion.md`
- `model_routing_and_budget_architecture.md`

## 14. Fatal And Critical Status Change

- `Fatal` downgraded: no explicit Truth Layer contract -> now addressed at architecture-governance level by this artifact
- `Fatal` downgraded: no explicit Durable State contract -> now addressed at architecture-governance level by this artifact
- `Critical` remains: provisional `accepted project truth` still parked inside `Workflow Spine / Author Journey`
- `Critical` remains: `Document Interchange` import destination truth paths are still unresolved at finer contract level
- `Critical` remains: restore rules for protected, deleted, masked, or excluded material are still unresolved at finer contract level

## 15. Acceptance Criteria

This artifact is acceptable only if:

- accepted truth owners are explicit
- durable state owners are explicit
- truth candidates are clearly separated from accepted truth
- consumer surfaces do not become owners by display alone
- advisory systems do not become truth owners by retention or explanation alone
- durable support state remains distinct from accepted truth
- future passes may refine action handoff and AI lifecycle without reopening the basic ownership map
