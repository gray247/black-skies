# Capability Ownership Map

Status: discovery and roadmap reconstruction only
Purpose: map current Black Skies product capabilities to owners, supporting systems, lifecycle stage, maturity, and overlap risk without implying implementation approval
Scope limit: no runtime design, no build order, no implementation planning
Current stage: product discovery and roadmap reconstruction, not implementation planning

## 1. Boundary Notes

This artifact is subordinate to:

- [current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md)
- [system_interaction_map.md](/C:/Dev/black-skies/docs/product_systems/system_interaction_map.md)
- [pre_code_discovery_plan.md](/C:/Dev/black-skies/docs/product_systems/pre_code_discovery_plan.md)
- [missing_systems_and_parked_concepts_recovery.md](/C:/Dev/black-skies/docs/product_systems/missing_systems_and_parked_concepts_recovery.md)
- [v1_foundation_scope_lock.md](/C:/Dev/black-skies/docs/product_systems/v1_foundation_scope_lock.md)
- the governance contracts under `docs/product_systems/`

Approved decisions applied in this map:

- `Author Intent / Story Setup` is an approved independent dossier.
- `Ideation / Premise Discovery` is a new optional dossier candidate.
- `Editorial Workflow` is a named cross-system workflow, not a new authority-owning system.
- `Branching / What-If` is an advanced roadmap lane and its dossier is deferred.
- `Research / Deep Research` is a cross-system workflow with a possible later dedicated dossier.
- `Voice Notes`, `Dictation`, `Transcription`, and `Voice Commands` remain future possibilities only.
- `Originality / Similarity` is a future research and validation program.
- `UI Identity / Delight` is a cross-system experience lane, not a single dossier.

Boundary reminder:

- [v1_foundation_scope_lock.md](/C:/Dev/black-skies/docs/product_systems/v1_foundation_scope_lock.md) is a provisional boundary reference only.
- It does not authorize implementation planning by itself.

## 2. Capability Group Map

### 2.1 Writing And Manuscript Authority

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| direct prose entry and editing | `Writing Surface` plus `Narrative Insertion / Narrative Assertion` | `Workflow Spine`, `Project Persistence / Local Save`, `Service Health`, `Snapshots`, `Command Center` | current manuscript editing path only | `Command Center`, `Critique`, `Continuity`, `Companion`, `Draft Generation`, `Snapshots`, and `Import Export` do not own manuscript truth | existing dossier | mature enough for now | none | save-state cues appear nearby but local-save confirmation is owned elsewhere |
| accepted manuscript truth | `Narrative Insertion / Narrative Assertion` | `Writing Surface`, `Snapshots`, `Import Export` | accepted manuscript text | projections, notes, signals, memory, critique, continuity, and restore previews are non-owners | existing dossier | mature enough for now | none | import, restore, and rewrite flows can appear to compete with truth ownership |
| accepted assertion truth | `Narrative Insertion / Narrative Assertion` | `Writing Surface`, `Command Center`, `Continuity`, `Outline` | accepted assertion truth | inserted prose, projections, critique, memory, and continuity findings are non-owners until explicitly accepted | existing dossier | mature enough for now | none | narrative truth can smear into cards, continuity, and projections |
| durable local current-save confirmation | `Project Persistence / Local Save` | `Writing Surface`, `Workflow Spine`, `Splash`, `Command Center`, `Service Health`, `Snapshots` | authoritative local current-save truth, unresolved pending or failed local-save posture, and close-safety confidence for current unsaved work | snapshots, health, startup, workflow, diagnostics, and surfaces do not become owners by display or support role | existing dossier | drafted / narrow | final writer-facing terminology and prominence remain open | can sprawl into recovery, sync, or storage implementation if boundaries loosen |
| direct-writing availability during degraded conditions | shared current ownership across `Writing Surface`, `Project Persistence / Local Save`, `Service Health / Offline / Degraded Mode`, `Workflow Spine`, and `Snapshots` | `Splash`, `Settings` | safe local writing posture and save-state cues | `Document Interchange` and any future sync path do not own local save-state doctrine | cross-system workflow | unresolved | none | degraded-state language can still drift into startup, save, and recovery language |

### 2.2 Story Foundation And Intent

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| accepted project goals, boundaries, and story setup | `Author Intent / Story Setup` | `Workflow Spine`, `Companion`, `Critique`, `Outline`, `Draft Generation`, `Settings` | accepted project truth only | must not become manuscript truth; must not gate writing; `Companion`, routing, critique, and settings are non-owners | existing dossier | shallow | none | overlaps with startup, settings, workflow, and old `Wizard` |
| optional setup questionnaire, likely 10 to 15 simple questions | `Author Intent / Story Setup`, likely surfaced as an optional `Settings` section | `Workflow Spine`, `Settings`, `Splash` | optional project-profile state only | skippable and editable; unknown, undecided, and blank remain valid; must not act as startup gate or hidden truth authority | existing dossier | unresolved | none | can blur into settings or onboarding rather than story foundation |

### 2.3 Ideation And Exploration

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| premise discovery and brainstorming | no current dossier owner yet | `Workflow Spine`, `Companion`, `Outline`, `Feedback Notes` | no current owner | ideation output must not auto-become project truth or manuscript truth | new dossier candidate | unresolved | none | overlaps with `Author Intent`, `Outline`, and notes |
| exploratory prompts and seed capture | no current dossier owner yet | `Feedback Notes`, future ideation support, `Workflow Spine` | no current owner | notes do not equal accepted project truth | new dossier candidate | unresolved | none | can disappear into manual notes without workflow clarity |

### 2.4 Organization And Navigation

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| project browsing and grouping | `Binder / Project Library` | `Workflow Spine`, `Splash`, `Project Index`, `File Manager` | project organization metadata | binder does not own manuscript truth, transfer authority, or file-state truth | existing dossier | mature enough for now | none | overlap with `File Manager` and `Project Index / Search / Retrieval` |
| workflow entry and resume posture | `Workflow Spine / Author Journey` | `Splash`, `Writing Surface`, `Command Center` | workflow progress state | workflow posture does not own manuscript truth outside parked project-truth subset | existing dossier | mature enough for now | none | can absorb story setup, startup, and editorial flow too broadly |
| support-surface navigation and tool entry | `Command Center Surface` | `Workflow Spine`, `Project Index`, `Binder`, `Diagnostics` | no primary truth ownership; support visibility only | visibility does not grant mutation authority | existing dossier | mature enough for now | none | risk of turning into junk drawer or pseudo-owner |

### 2.5 Structure And Projection

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| optional structural planning map and named prototype arrangements | `Outline` | `Workflow Spine`, `Command Center`, `Writing Surface`, `Prose / Scene Projection` | planning structure, intended order, and bounded advisory prototype arrangements | outline is not narrative truth and may not silently reorder accepted manuscript | existing dossier | shallow | none | overlap with `Story Unit`, projection organization, and visual arrangement views |
| prose rendering, chapter or scene organization, and compatibility projection views | `Prose / Scene Projection` | `Outline`, `Story Unit`, `Writing Surface` | projection state plus chapter or scene organizational metadata where supported | projection is not accepted manuscript truth or authoritative manuscript order | existing dossier | shallow | none | projection can appear to own scene truth or order if organization and truth boundaries blur |
| optional grouping, narrative-purpose anchors, and bounded lifecycle work containers | `Story Unit` | `Outline`, `Projection`, `Command Center` | grouping and narrative-purpose state only | Story Unit is optional and not mandatory foundation, and it does not own manuscript truth or authoritative order | existing dossier | shallow | none | overlap with outline structure and projection containers if grouping purpose becomes vague |
| reusable visual arrangement display and action-request layer | `Visual Arrangement View` | `Outline`, `Projection`, `Story Unit`, `Writing Surface`, `Command Center` | no structural truth or durable narrative state; display context and action requests only | view gestures do not determine mutation semantics; the active underlying owner does | existing dossier | shallow | none | can still duplicate outline navigation if underlying-owner cues stay vague |

### 2.6 Characters, Lore, Relationships, Emotion, And Theme

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| accepted character facts | `Character Cards` | `Writing Surface`, `Command Center`, `Continuity`, `Critique` | accepted structured character truth on a fact-by-fact basis | continuity, critique, memory, inference, manuscript wording, and support views do not own character truth | existing dossier | roadmap-sufficient | exact field grouping, time-state handling, and merge review remain open | overlap with relationship and emotion support |
| accepted lore and canon facts | `Lore Cards` | `Writing Surface`, `Command Center`, `Continuity`, `Critique` | accepted structured lore truth on a fact-by-fact basis | import, memory, critique, continuity, manuscript wording, and support views are non-owners | existing dossier | roadmap-sufficient | exact field grouping, time-state handling, and merge review remain open | overlap with continuity, relationship support, and research notes |
| relationship views and accepted relationship support | `Relationship Map` for advisory and view state; accepted truth still lands in explicit truth owner | `Character Cards`, `Lore Cards`, `Narrative Insertion / Narrative Assertion`, `Writing Surface`, `Command Center` | relationship view state, relationship references, candidate links, planning overlays, and projection preferences | map does not own canon by default; cross-domain accepted facts still require one explicit truth owner | existing dossier | shallow | exact primary-subject owner rule for cross-domain accepted facts remains open | overlap with character truth, lore truth, and continuity |
| emotional trajectory support | `Emotion Graph` for advisory and view state | `Author Intent / Story Setup`, `Story Unit`, `Outline`, `Character Cards`, `Narrative Insertion / Narrative Assertion`, `Writing Surface`, `Command Center`, `Theme System`, `Critique` | manuscript-observed movement projection, planned-target overlays, candidate interpretations, and graph preferences | inferred emotion is not author intent by default; emotional planning stays with its existing owner by scope | existing dossier | shallow | exact emotional planning taxonomy and display contract remain open | overlap with critique, theme, pacing, and character support |
| thematic organization and advisory theme support | `Theme System` for support state; accepted project-level thematic intent stays in `Author Intent / Story Setup` | `Author Intent / Story Setup`, `Story Unit`, `Outline`, `Narrative Insertion / Narrative Assertion`, `Writing Surface`, `Command Center`, `Critique` | thematic threads, motifs, planned thematic development, observed evidence references, candidate interpretations, and theme view state | Theme System does not own accepted project truth, manuscript truth, or reader interpretation as fact; story-theme support is distinct from cosmetic UI theme work | existing dossier | shallow | exact theme and motif taxonomy plus visibility defaults remain open | duplicate term `theme` already collides with UI theming |

### 2.7 Revision And Editorial Workflow

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| critique and evaluation findings | `Critique / Evaluation` | `Continuity`, `Theme System`, `Memory Lab`, `Companion`, `Command Center` | advisory findings, evidence bundles, issue ranking | critique does not own truth, durable notes, or durable signals | existing dossier | product-light | none | overlaps with continuity, notes, signals, and rewrite prompts |
| durable revision notes and note resolution | `Feedback Notes / Revision Resolution` | `Critique`, `Writing Surface`, `Command Center`, `Companion` | durable note state | notes are not accepted manuscript or accepted assertion truth | existing dossier | mature enough for now | none | overlap with signals and critique issue lists |
| rewrite-generation support | `Draft Generation / Rewrite Loop` | `Critique`, `Companion`, `Writing Surface`, `Narrative Insertion / Assertion` | advisory rewrite outputs only | generated or rewritten text is non-authoritative until explicitly accepted | existing dossier | product-light | none | overlap with critique, companion, and manuscript truth path |
| editorial end-to-end journey from finding to closure | no single durable-state owner by decision; workflow map defined in `editorial_workflow.md` | `Critique / Evaluation`, `Continuity`, `Feedback Notes`, `Signal Architecture`, `Draft Generation`, `Workflow Spine`, `Companion` | no durable state owned here; this is a cross-system journey map only | editorial workflow is not a truth owner and should not become a new monolith | cross-system workflow | drafted / mapped | default visibility, closed-history prominence, and recurrence surfacing remain open | split systems still require clear display and handoff cues, but the owner map is now explicit |

### 2.8 Continuity And Analysis

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| continuity review and continuity findings | `Continuity` | `Narrative Insertion / Assertion`, `Character Cards`, `Lore Cards`, `Signal Architecture`, `Command Center` | advisory continuity findings | continuity has no accepted-continuity kingdom and no canon ownership | existing dossier | product-light | none | overlap with signals, critique, and lore or character truth |
| timeline, pacing, and pressure analysis | `Timeline / Pacing / Pressure` | `Outline`, `Story Unit`, `Critique`, `Emotion Graph` | advisory pacing or structure analysis | not manuscript truth or structural authority | existing dossier | shallow | none | overlap with emotion, foreshadow, and critique |
| foreshadow and payoff review | `Foreshadow / Payoff` for advisory findings and author-approved durable support links | `Outline`, `Story Unit`, `Narrative Insertion / Narrative Assertion`, `Continuity`, `Critique` | candidate linkage review, saved support links, support-link posture, and view state | no truth ownership; saved links do not own prose, planning truth, or interpretation-as-fact | existing dossier | shallow | exact setup/payoff vocabulary and review-trigger defaults remain open | overlap with continuity and pacing |
| senses, overused words, and cliche analysis | `Senses Usage`, `Overused Words`, `Cliche Detection` | `Critique`, `Writing Surface`, `Command Center` | advisory craft analysis | no truth ownership and no taste-as-law authority | existing dossier | shallow | none | multiple craft analyzers can duplicate critique functionality |

### 2.9 Notes, Signals, And Memory

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| durable note state | `Feedback Notes / Revision Resolution` | `Writing Surface`, `Command Center`, `Critique` | durable revision-note state | note state is not signal state or memory state | existing dossier | mature enough for now | none | note, signal, and critique finding boundaries remain easy to blur |
| durable signal state and signal lifecycle | `Signal Architecture` | `Continuity`, `Critique`, `Command Center`, `Writing Surface`, `Outline` | durable signal state | signal visibility does not equal truth ownership | existing dossier | product-light | none | overlap with notes, continuity queues, and command-center blockers |
| governed recall and retained advisory memory | `Memory Lab` | `Companion`, `Continuity`, `Critique`, `Project Index` | durable memory | memory recall is not truth and must not become shadow canon | existing dossier | product-light | none | recall versus retrieval overlap with `Project Index / Search / Retrieval` |
| explanation and guided navigation over memory or findings | `Companion` | `Memory Lab`, `Critique`, `Signal Architecture`, `Workflow Spine` | no underlying truth or durable-state ownership | companion explains and routes; it does not own memory, signals, critique, or truth | existing dossier | product-light | none | can appear to own everything it narrates |

### 2.10 Research And Source Use

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| source-linked search and retrieval inside the project | `Project Index / Search / Retrieval` | `Binder`, `File Manager`, `Writing Surface`, `Command Center` | local index state, source labels, retrieval references, scopes, and freshness posture | retrieval does not own truth, memory, or note resolution | existing dossier | mature enough for now | exact default breadth and semantic depth remain open | overlap with `Memory Lab` recall and binder navigation |
| evidence citation and source-trace support | fragmented across `Project Index / Search / Retrieval`, `Memory Lab`, `Companion`, `Authorship Provenance AI Visibility` | `Critique`, `Signal Architecture` | no single owner today | citation traces do not auto-create truth or reliable guidance claims | cross-system workflow | unresolved | none | no clean end-to-end research flow exists yet |
| deep research workflow from source intake to writer use | no single dossier owner by decision | `Project Index`, `Memory Lab`, `Import Export`, `Companion` | no single owner | research workflow is not yet a dedicated dossier and must not be inferred from memory or retrieval alone | cross-system workflow | unresolved | whether later discovery keeps this as a workflow only or promotes it into a dedicated dossier | overlaps with import, retrieval, memory, and provenance |

### 2.11 Import, Export, And Interchange

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| human-readable import and export workflow | `Import Export Document Interchange` | `Binder`, `File Manager`, `Writing Surface`, `Command Center` | transfer history and interchange decisions | interchange does not own manuscript truth, save-state truth, or routing policy | existing dossier | mature enough for now | none | overlap with binder placement and file browsing |
| import destination classification and staging | `Import Export Document Interchange` | `Narrative Insertion / Assertion`, `Feedback Notes`, `Binder`, `File Manager` | staged import state and transfer metadata | import does not auto-canonize or auto-place truth, and Binder only exposes staging for navigation | existing dossier | shallow | none | current import object map remains a critical blocker |
| export protection, provenance visibility, and outbound distinctions | shared across `Import Export Document Interchange`, `Authorship Provenance AI Visibility`, and `Explicit Content Architecture` | `LLM Package Construction`, `Model Routing`, `Protected Content Permission Matrix` | transfer history, provenance state, and outbound masking decisions | raw local prose is distinct from outbound package material | cross-system workflow | product-light | none | export and outbound AI packaging remain easy to conflate |

### 2.12 Persistence, Recovery, And Degraded Operation

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| snapshots, backup, restore, and history | `Snapshots / Backup / Restore / History` | `Writing Surface`, `Service Health`, `Workflow Spine`, `Splash` | snapshot state and restore metadata | snapshots are historical state, not accepted truth | existing dossier | mature enough for now | none | overlap with save-state honesty and branching or what-if lanes |
| current local-save authority | `Project Persistence / Local Save` | `Writing Surface`, `Workflow Spine`, `Splash`, `Service Health`, `Snapshots`, `Command Center` | durable local current-save confirmation and unresolved local-save risk posture | local-save authority is distinct from manuscript truth, snapshot history, recovery review, startup posture, and health history | existing dossier | drafted / narrow | prominence of at-risk and blocked cues, startup exposure, and close interruption threshold remain open | can be mistaken for snapshots or degraded health if copy and ownership stay loose |
| health, offline, degraded, and blocked execution posture | `Service Health / Offline / Degraded Mode` | `Writing Surface`, `Diagnostics`, `Workflow Spine`, `Command Center` | health and degraded-state history | service health does not own manuscript truth or snapshots | existing dossier | mature enough for now | none | overlaps with startup, diagnostics, and save-state language |
| startup recovery posture and safe resume | `Splash / Startup Experience` plus `Workflow Spine` | `Service Health`, `Snapshots`, `Binder` | startup entry posture only | splash does not own recovery truth, save-state, or project truth | existing dossier | shallow | none | startup, workflow, and degraded cues can compete |
| settings-backed workspace persistence | `Settings / Preferences / Workspace Layout` | `Accessibility`, `Splash`, `Command Center` | settings and preferences state | settings do not override higher-risk approval or truth rules | existing dossier | mature enough for now | none | can absorb story setup or presentation identity accidentally |

### 2.13 Search, Files, And Assets

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| project search and retrieval | `Project Index / Search / Retrieval` | `Binder`, `File Manager`, `Writing Surface` | index state | search does not own memory or truth | existing dossier | mature enough for now | none | overlap with memory recall and file browsing |
| file browsing and asset metadata | `File Manager / Asset Pane` | `Binder`, `Import Export`, `Writing Surface` | file and asset metadata | file browsing does not own transfer authority or project truth | existing dossier | mature enough for now | none | overlap with binder and document interchange |
| project grouping and browse context | `Binder / Project Library` | `File Manager`, `Splash`, `Project Index` | project organization metadata | binder is not file-state authority and not search owner | existing dossier | mature enough for now | none | binder, file manager, and search boundaries can blur |

### 2.14 AI And Model Operations

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI lifecycle, approval, conversion, and retention rules | `AI Lifecycle And Approval Matrix` | all AI-adjacent dossiers | lifecycle and approval doctrine | no requesting surface or AI-producing system may bypass owner-governed conversion | existing dossier | mature enough for now | none | multiple AI-capable systems can imply unauthorized shortcuts |
| model routing, budget, and provider permission | `Model Routing And Budget Architecture` | `LLM Package Construction`, `Companion`, `Explicit Content`, `Service Health` | routing history and spend or refusal posture | routing does not own truth, package content, or surface authority | existing dossier | product-light | none | routing, provider policy, and budget are packed into one dossier |
| model-facing package assembly | `LLM Package Construction Architecture` | `Model Routing`, `Explicit Content`, `Companion`, `Memory Lab` | package construction rules | package construction does not own export doctrine or manuscript truth | existing dossier | product-light | none | package assembly overlaps with export and explicit-content outbound rules |
| explicit-content outbound masking and raw-versus-transformed distinction | `Explicit Content Architecture` | `Protected Content Permission Matrix`, `Package Construction`, `Routing`, `Document Interchange` | outbound content-classification rules | explicit-content transforms outbound packages, not local manuscript truth | existing dossier | product-light | none | overlap with provenance, export, and AI package rules |
| authorship and provenance visibility | `Authorship Provenance AI Visibility` | `Writing Surface`, `Command Center`, `Document Interchange`, `Companion` | provenance state | provenance visibility is not automatic truth acceptance | existing dossier | product-light | none | overlap with export, AI lifecycle, and writing-surface display |
| async execution and queued job state | `Async Job Queue / Task Runner` | `Command Center`, `Routing`, `Service Health` | job queue state | queue state is not product truth or critique authority | existing dossier | product-light | none | closest system to implementation plumbing rather than writer-facing product |

### 2.15 Validation And Benchmarking

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| test evidence and proof discipline | `Testing / Harness / Evidence Contract` | `Diagnostics`, `Service Health`, `Snapshots` | evidence expectations only | tests do not create product truth or implementation approval | existing dossier | mature enough for now | none | validation success can be overstated as readiness |
| runtime diagnostics and debug evidence | `Diagnostics / Error Visibility / Debug Console` | `Service Health`, `Testing / Harness` | diagnostic evidence state | diagnostics are witness state, not product doctrine | existing dossier | mature enough for now | none | diagnostics can leak into support UX or product semantics |
| local-versus-API model benchmarking | fragmented across `AI Lifecycle`, `Model Routing`, and `LLM Package Construction` | `Testing / Harness` | no single owner today | benchmarking is not a product promise | research/validation program | product-light | none | no dedicated program owner yet |
| long-form, trilogy, genre, and stress-test validation | `AI Lifecycle And Approval Matrix` as current doctrine host only | `Continuity`, `Memory Lab`, `Critique` | no user-facing owner | validation hooks do not authorize productization | research/validation program | product-light | none | can be confused with continuity or critique features |
| originality and similarity study | no single current program owner; policy boundary is already set | `Critique`, `Project Index`, future research lane | no current owner | Black Skies must not claim originality certification | research/validation program | product-light | none | easy to overclaim or duplicate critique |

### 2.16 Accessibility And Alternate Input

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| accessibility baseline, hotkeys, and large-font support | `Accessibility / Hotkeys / Large-Font Mode` | `Settings`, `Writing Surface`, `Command Center`, `Splash` | accessibility preferences and interaction rules | accessibility does not bypass confirmation or truth boundaries | existing dossier | mature enough for now | none | overlap with settings and workspace layout |
| voice notes, dictation, and transcription | no current dossier owner; preserved as a future possibility only | future `Feedback Notes`, `Workflow Spine`, `File Manager`, `Import Export` | no current owner | future voice support must not be smuggled into current scope | deferred possibility | product-light | none | overlap with notes, file assets, and AI routing |
| voice commands or command input | no current dossier owner; preserved as a future possibility only | future accessibility or workflow support only | no current owner | not approved as a standalone current system | deferred possibility | product-light | whether future voice scope stays note-centric or also includes command input | can be confused with command metadata or palette history |

### 2.17 Interface Identity And Personalization

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| settings, preferences, and layout personalization | `Settings / Preferences / Workspace Layout` | `Accessibility`, `Splash`, `Command Center` | settings and preferences state | settings do not own story-theme support or story foundation | existing dossier | mature enough for now | none | overlap with story setup and UI identity lane |
| startup feel and first-run posture | `Splash / Startup Experience` | `Settings`, `Workflow Spine`, `Accessibility` | startup presentation posture | splash is not product-truth owner or workflow gate | existing dossier | shallow | none | overlap with onboarding, workflow, and UI identity |
| cross-system product identity and delight | no single dossier owner by decision; current fragments live in `Settings`, `Splash`, and `Accessibility` | `Command Center`, `Writing Surface`, historical GUI docs | no single owner today | this is an experience lane, not a single truth or state owner | cross-system workflow | unresolved | none | cosmetic theming can be confused with story `Theme System` |

### 2.18 Advanced Authoring, Branching, And Series Work

| Capability | Current owner | Supporting systems | Authority or state owned | Explicit non-owner boundaries | Lifecycle stage | Maturity | Unresolved Jason decision | Important overlap or duplication risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| branching and what-if exploration | no singular current owner; nearest anchors are `Narrative Insertion / Assertion` and `Snapshots / Backup / Restore / History` | `Outline`, `Projection`, `Story Unit` | no settled current owner | advanced branching is deferred and must not be confused with snapshots | advanced roadmap lane | unresolved | whether branching becomes prose-level, structure-level, truth-level, or mixed | overlap with restore history, contradiction branches, and smart merge |
| series grouping and cross-story linking | `Series Binder / Cross-Story Linking` | `Binder`, `Continuity`, `Theme System`, `Character Cards`, `Lore Cards` | series grouping and accepted-link support | series containers do not own canon | existing dossier | shallow | none | overlap with binder, continuity, and lore |
| plugin or rubric extension analysis | `Plugin / Rubric System` | `Critique`, `Companion`, `Command Center` | plugin or rubric analysis support only | plugin paths do not own truth or critique authority by default | existing dossier | product-light | none | overlap with critique and companion workflows |

## 3. Capabilities Without A Current Dossier Owner

The following capabilities currently have no one-to-one dossier owner and still need a cleaner home:

- premise discovery and brainstorming
- exploratory prompt and seed capture as a distinct workflow

The following do not currently have a single dossier owner, but that is now an intentional classification rather than an ownership failure:

- editorial workflow as a cross-system workflow
- research / deep research as a cross-system workflow
- local-versus-API benchmarking as a research and validation program
- originality and similarity study as a research and validation program
- voice notes, dictation, transcription, and voice commands as deferred possibilities
- cross-system product identity and delight as an experience lane
- branching and what-if exploration as an advanced roadmap lane

## 4. Competing-Owner Conflicts

The strongest competing-owner conflicts are:

- `Project Persistence / Local Save`, `Writing Surface`, `Snapshots`,
  `Service Health`, and `Workflow Spine` all touch save-state language,
  but only `Project Persistence / Local Save` owns durable local
  current-save confirmation.
- `Workflow Spine` provisionally owns accepted project truth while also owning workflow state.
- `Binder`, `File Manager`, and `Project Index / Search / Retrieval` all touch navigation, browse context, and discovery.
- `Memory Lab` and `Project Index / Search / Retrieval` both use retrieval language but own different state categories; recall versus retrieval still needs clear writer-facing labeling.
- `Critique`, `Feedback Notes`, `Signal Architecture`, `Continuity`, `Draft Generation`, and `Companion` all touch the editorial lane.
- `Import Export Document Interchange`, `Authorship Provenance AI Visibility`, and `Explicit Content Architecture` all touch outbound behavior.
- `Model Routing And Budget Architecture`, `LLM Package Construction Architecture`, and `AI Lifecycle And Approval Matrix` all govern different slices of AI behavior and can look like one blurred system from outside.

## 5. Implementation Plumbing Incorrectly Treated As A Product System

No current dossier should be deleted on this basis alone, because the registry intentionally includes system and plumbing dossiers.

The closest cases are:

- `Async Job Queue / Task Runner`
- `LLM Package Construction Architecture`
- parts of `Model Routing And Budget Architecture`

These are valid governance or system dossiers, but they are weak candidates for early user-facing roadmap emphasis.

## 6. Dossiers That Own Too Much

- `Workflow Spine / Author Journey`
  It currently carries workflow posture and resume state, and it still risks looking more authoritative than it is.
- `Model Routing And Budget Architecture`
  It currently stands in for routing, provider policy, and budget or cost guardrails.
- `Companion`
  It can easily look like a universal owner because it routes, explains, highlights, and spans many systems.
- `Command Center Surface`
  It aggregates many workflows and can look more authoritative than it is.

## 7. Dossiers That Appear Redundant Or Boundary-Risky

- `Binder / Project Library` versus `File Manager / Asset Pane`
- `Binder / Project Library` versus `Project Index / Search / Retrieval`
- `Outline` versus `Story Unit` versus `Prose / Scene Projection` versus `Visual Arrangement View`
- `Critique / Evaluation` versus craft analyzers such as `Overused Words`, `Cliche Detection`, and `Senses Usage`
- `Theme System` versus UI theming or presentation lanes
- `Memory Lab` versus `Project Index / Search / Retrieval`

These should be treated as overlap risks, not automatic merge decisions.

## 8. Cross-System Workflows Missing An End-To-End Map

- research workflow from source intake to citation to use in writing
- save-state and degraded-writing workflow from healthy to pending to recoverable to blocked
- product-identity and personalization workflow across settings, startup, accessibility, and presentation
- future voice workflow if it ever becomes a real capability

## 9. Remaining Discovery Decisions

The following are still real implementation-neutral product questions, but the larger boundary decisions have already been made:

- exact final question wording and grouping inside the future `Author Intent / Story Setup` optional questionnaire
- whether later discovery keeps deep research as a workflow only or promotes it into a dedicated dossier
- whether future voice scope, if ever activated, stays note-centric or also includes command input
- eventual depth and form of branching or what-if work if that advanced lane is later promoted
- whether later benchmarking work remains entirely internal or exposes limited comparison controls without overclaiming quality

## 10. Remaining Critical Discovery Risks

- save-state display and workflow posture still span `Writing Surface`,
  `Snapshots`, `Service Health`, `Workflow Spine`, and `Splash`, even
  though durable local current-save confirmation now has a named owner
- `Workflow Spine / Author Journey` still carries too much by holding workflow posture plus provisional accepted project truth
- research and source-use capabilities still lack a clean end-to-end flow and citation path map
- the AI roadmap cluster still reads as blurred from a product perspective across lifecycle, routing, package construction, provenance, and explicit-content boundaries

## 11. Discovery-Level Takeaways

- The ownership map is strongest around manuscript truth, accepted assertion truth, durable note state, durable signal state, snapshot state, and routing or provenance governance.
- The weakest areas are project-intent ownership, ideation, research workflow, presentation identity, voice, and advanced branching.
- Several current conflicts are not missing-dossier problems. They are missing workflow-map problems.
- The provisional `v1` boundary remains small and useful, but it does not authorize implementation planning or close the broader capability inventory.
