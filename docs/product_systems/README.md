# Black Skies Product System Dossier Registry

## Purpose

This registry defines the master document targets for Black Skies product-system planning.

It does not finalize product vision.
It does not implement product systems.
It identifies the dossier set that must exist before broader salvage implementation expands.

## Why The Dossier Registry Exists

The salvage rebuild needs a stable planning spine before more code lands.
Without a registry, large systems get built out of sequence, hidden dependencies become normal, and visible tools outrun the foundations that should govern them.

This registry exists to:

- keep the two-work-surface model explicit,
- keep `Narrative Insertion / Narrative Assertion` as the smallest narrative foundation,
- keep prose and scene as projection or compatibility concepts rather than base authority,
- prevent Story Units from becoming a mandatory entry gate,
- ensure system and plumbing dossiers are documented alongside visible writer-facing tools,
- stop product drift before it becomes runtime drift.

## Product / Intelligence / System Grouping

The full dossier set is grouped into three classes:

- `Product`
  - systems the writer directly touches or intentionally summons
- `Intelligence`
  - systems that analyze, evaluate, route, or interpret writing or narrative structure
- `System`
  - systems that keep the app stable, bounded, recoverable, and operational

## Full 42-Dossier List

### A. Product Dossiers

| ID | Dossier | Class | Initial status |
| --- | --- | --- | --- |
| 1 | Writing Surface | Product | planned |
| 2 | Command Center Surface | Product | planned |
| 3 | Workflow Spine / Author Journey | Product | planned |
| 4 | Binder / Project Library | Product | planned |
| 5 | Scene Cards / Corkboard | Product | planned |
| 6 | Story Unit | Product | planned |
| 7 | Narrative Insertion / Assertion | Product | planned |
| 8 | Prose / Scene Projection | Product | planned |
| 10 | Outline | Product | planned |
| 16 | Feedback Notes / Revision Resolution | Product | planned |
| 17 | Lore Cards | Product | planned |
| 18 | Character Cards | Product | planned |
| 19 | Project Index / Search / Retrieval | Product | planned |
| 20 | Series Binder / Cross-Story Linking | Product | planned |
| 28 | Theme System | Product | planned |
| 29 | Accessibility / Hotkeys / Large-Font Mode | Product | planned |
| 30 | Settings / Preferences / Workspace Layout | Product | planned |
| 31 | Splash / Startup Experience | Product | planned |
| 32 | Import / Export / Google Docs | Product | planned |
| 34 | File Manager / Asset Pane | Product | planned |

### B. Intelligence Dossiers

| ID | Dossier | Class | Initial status |
| --- | --- | --- | --- |
| 9 | Draft Generation / Rewrite Loop | Intelligence | planned |
| 11 | Timeline / Pacing / Pressure | Intelligence | planned |
| 12 | Relationship Map | Intelligence | planned |
| 13 | Emotion Graph | Intelligence | planned |
| 14 | Continuity | Intelligence | planned |
| 15 | Critique | Intelligence | planned |
| 21 | Senses Usage | Intelligence | planned |
| 22 | Overused Words | Intelligence | planned |
| 23 | Cliche Detection | Intelligence | planned |
| 24 | Foreshadow / Payoff | Intelligence | planned |
| 25 | Explicit-Content Marker / Send-Package Censor | Intelligence | planned |
| 26 | Companion | Intelligence | planned |
| 27 | Memory Lab | Intelligence | planned |
| 35 | Local LLM vs Paid API Routing | Intelligence | planned |
| 36 | Model Router / Provider Execution Policy | Intelligence | planned |
| 37 | Budget / Token / Cost Guardrails | Intelligence | planned |
| 41 | Plugin / Rubric System | Intelligence | planned |

### C. System Dossiers

| ID | Dossier | Class | Initial status |
| --- | --- | --- | --- |
| 33 | Snapshots / Backup / Restore / History | System | planned |
| 38 | Async Job Queue / Task Runner | System | planned |
| 39 | Service Health / Offline / Degraded Mode | System | planned |
| 40 | Diagnostics / Error Visibility / Debug Console | System | planned |
| 42 | Testing / Harness / Evidence Contract | System | planned |

## Dossier Status Fields

Allowed dossier statuses:

- `planned`
- `drafted`
- `reviewed`
- `accepted`
- `accepted with exceptions`
- `deferred`
- `rejected`

Registry rule:
- a dossier starts as `planned`
- it should not be treated as product authority until it is at least `reviewed`
- `accepted` means the planning boundary is approved, not that runtime implementation is complete

## Current Rough Dossier Blanks

The following rough dossiers now exist as first-wave `exploring` or `partial` working files.
They are not build-ready.
Some are direct dossier targets from the master list, and some are bridge or architecture dossiers that may later merge, shrink, or split back into the master list.

| File | Maps to registry target(s) | Current posture | Build-ready |
| --- | --- | --- | --- |
| `continuity.md` | `Continuity` | rough / exploring | no |
| `signal_architecture.md` | `Continuity`, `Critique`, `Companion`, `Command Center Surface`, `Writing Surface` | rough / exploring | no |
| `authorship_provenance_ai_visibility.md` | `Writing Surface`, `Command Center Surface`, `Explicit-Content Marker / Send-Package Censor`, `Companion`, `Import / Export / Google Docs` | rough / exploring | no |
| `model_routing_and_budget_architecture.md` | `Local LLM vs Paid API Routing`, `Model Router / Provider Execution Policy`, `Budget / Token / Cost Guardrails` | rough / exploring | no |
| `llm_package_construction_architecture.md` | `Model Router / Provider Execution Policy`, `Explicit-Content Marker / Send-Package Censor`, `Companion`, `Memory Lab` | rough / exploring | no |
| `explicit_content_architecture.md` | `Explicit-Content Marker / Send-Package Censor`, `Import / Export / Google Docs` | rough / exploring | no |
| `memory_lab.md` | `Memory Lab` | rough / exploring | no |
| `companion.md` | `Companion` | rough / exploring | no |
| `system_interaction_map.md` | first-wave cross-dossier interaction map | rough / exploring | no |

Question migration is now dossier-centered.
The raw question bank is archive or intake only and should not remain the main active planning spine.
The interaction map is explanatory only and does not imply runtime wiring, authority, or build readiness.

## Dependency Notes

Dependency posture:

- `Writing Surface`, `Command Center Surface`, `Workflow Spine / Author Journey`, `Narrative Insertion / Assertion`, and `Prose / Scene Projection` are the primary foundation dossiers.
- `Story Unit`, `Outline`, and timeline or pacing systems should not outrun the narrative-foundation dossiers.
- intelligence systems should not become hidden runtime authority over authored truth.
- system dossiers must exist early enough to constrain execution, evidence, storage, routing, and failure behavior before complex intelligence features expand.
- `Command Center Surface` supports writing and organizes support systems, but it does not gate direct writing.
- rough bridge dossiers may exist temporarily when they prevent question-bank sprawl, but they should later merge, shrink, split, or disappear once the permanent dossier boundaries are clearer.

## Not Good-Idea-Fairy Clarification

The following are not automatically good-idea-fairy items:

- themes
- splash pages
- emotion graph
- relationship maps
- lore cards
- character cards
- continuity
- critique
- senses usage
- overused words
- cliche detection
- foreshadow/payoff
- explicit-content markers
- Companion
- Memory Lab

These are candidate core, support, or product systems that require individual definition.

## Actual Good-Idea-Fairy Examples

Examples of actual tangential add-ons:

- book cover generator
- soundtrack generator
- trailer maker
- merch or social promo tools

## Acceptance Criteria

This registry is acceptable only if:

- it does not finalize product vision,
- it creates document targets rather than implementation claims,
- it prevents systems from being forgotten,
- it includes system and plumbing dossiers, not just visible writer-facing tools,
- it preserves the two-work-surface model,
- it keeps `Narrative Insertion / Narrative Assertion` as foundation,
- it keeps prose and scene inside projection or compatibility roles rather than base authority.
