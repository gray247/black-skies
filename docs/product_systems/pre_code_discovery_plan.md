# Pre-Code Discovery Plan

## Status

- Status: `Active` / `Planning Spine` / `Not Build Ready`
- Lifecycle: active during pre-code discovery
- Retirement rule: archive or supersede after `build_order.md`, `v1_scope_lock.md`, and implementation planning docs exist
- Scope: product or system planning only; no runtime permission

## Purpose

This doc exists to prevent drift between threads by recording the current pre-code roadmap in one reusable spine.

It documents:

- the current pre-code roadmap,
- the batch-stop process,
- the question classification method,
- reusable docs,
- temporary or patch docs,
- next-thread handover expectations.

It is a planning spine, not a product spec and not build permission.

## Current Doctrine Anchor

Current doctrine for pre-code discovery is:

- Writing Surface is sovereign.
- Direct writing must always be available.
- Command Center supports writing but does not gate it.
- Narrative Insertion / Narrative Assertion is the foundation.
- Scene is projection, container, view, or legacy compatibility only.
- Story Unit is optional.
- Outline is optional and not narrative truth.
- AI is advisory unless accepted by the user.
- Author authority controls final text.
- AI provenance serves the author and is not an undeletable scar.
- Accepted continuity truth lives in author-owned foundations, notes, lore, character facts, narrative assertions, or explicit author decisions.
- No shadow canon.
- Durable advisory history must be purposeful, relevant, and valuable.
- Memory Lab must not hoard data just because data exists.
- No silent paid API spend.
- Old code is evidence, not product authority.

## Batch Stop Rule

After every Codex batch, stop and report:

1. Files changed
2. Questions answered
3. New questions found
4. Fatal, Critical, Major, and Minor question changes
5. Questions moved to Answered / Superseded
6. Dossiers still blocked
7. User decisions needed
8. Recommended next batch
9. Validation results
10. Whether commit is safe

Do not continue into the next batch automatically.

## Question Classification Method

- Fatal Questions
  Questions that block architecture or code unless answered or downgraded by accepted doctrine.
- Critical Questions
  Questions that block implementation or wiring for the affected system.
- Major Questions
  Questions that affect design but do not block rough dossier work.
- Minor Questions
  Questions about naming, UI, wording, tuning, or polish.
- Answered / Superseded Questions
  Questions that should not keep resurfacing once doctrine already answers them.
- Deferred Questions
  Real questions that are intentionally not needed yet.

## Archive vs Intake Doctrine

- Archive = historical, raw, past material, lessons, mistakes, fossils, or old planning debris.
- Intake = selected future-facing candidate material after triage.
- Archive and intake are not interchangeable.
- Raw question banks are archive or raw capture by default.
- Active questions must live inside relevant dossiers after triage.

## Current Completed Work

Current product-system planning has already completed these steps:

- system dossier registry and template created,
- Writing Surface and Command Center Surface defined,
- Narrative Insertion / Narrative Assertion foundation defined,
- Prose / Scene Projection defined as projection or compatibility,
- Story Unit and Outline constrained as optional,
- first-wave rough dossiers created,
- centralized `Pre-Rough Alignment Questionnaire` added,
- `system_interaction_map.md` created,
- first fatal question decision patch applied,
- Fatal questions in first-wave dossiers reduced, resolved, or downgraded to Critical while dossiers remain rough and not build-ready,
- dossier inventory and missing-dossier reconciliation completed for the currently registered product-system set.
- controlled question-intake review completed for all `23 / 23` placeholder dossiers created in that reconciliation sweep.
- `Critique / Evaluation` now has a one-to-one dossier and is no longer only bridge-backed.
- human document interchange now has a one-to-one dossier in `import_export_document_interchange.md`, with autosave and AI-format questions still owned elsewhere.

## Current Horizon And Later Readiness Gates

The planning spine now preserves two horizons.

### Current Product-Definition Horizon

Current sequencing remains:

- no product-definition campaign is active
- `Draft Generation / Rewrite Loop`, `Craft Analyzer Family`, and
  `Accessibility / Hotkeys / Large-Font Mode` are complete
- `Testing / Harness / Evidence Contract` is complete
- `Plugin / Rubric System` is complete
- `Async Job Queue / Task Runner` is complete
- category `4` coverage is complete across all `45` registry targets
- keep implementation blocked throughout remaining dossier work
- Stage 1 — System Constellation Audit is complete.
- Stage 2 — System Composition and Emergent Capability Audit is
  complete.
- Stage 3 — `Dossier Regression and Doctrine Propagation Audit` is
  complete and closed.
- the initial Stage 3 read-only regression inventory was completed.
- DR-01 through DR-06 in
  `docs/product_systems/dossier_regression_doctrine_propagation_findings.md`
  were completed at doctrine level.
- the six bounded dossier corrections were performed and reviewed.
- no Category-4 demotion is required.
- no substantive dossier reopening is required.
- no unresolved Stage 3 finding remains.
- no connector has been admitted.
- Stage 4 — `Capability Ceiling and Breadth Audit` is complete and
  closed.
- Stage 4 began through explicit author approval.
- the initial Stage 4 read-only breadth inventory was completed.
- CB-01 through CB-07 in
  `docs/product_systems/capability_ceiling_breadth_audit_findings.md`
  were completed at doctrine level.
- the four approved author breadth decisions were propagated.
- both bounded breadth-propagation batches were performed and reviewed.
- the risk-based coverage sampling pass was completed.
- no missed material breadth gap was found.
- no additional propagation or sampling pass is required.
- no Category-4 demotion is required.
- no substantive dossier reopening is required.
- no unresolved Stage 4 finding remains.
- Stage 5 — `External Deep-Research Challenge Audit` is active.
- Stage 5 began through explicit author approval.
- external research Passes A through D were completed.
- findings were recorded in
  `docs/product_systems/external_deep_research_challenge_findings.md`.
- bounded doctrine propagation remains pending.
- Stage 5 is not closed.
- Stage 6 is not yet eligible.
- Stage 5 does not admit connectors automatically.
- Stage 5 does not unblock implementation.
- Stage 5 external challenge inputs remain preserved.
- Stage 6, Stage 9, and Stage 10 deferrals remain preserved.

This current-state wording remains in force unless Jason explicitly
changes the lane.

### Expanded Professional Pre-Code Sequence

The sequence below is the current controlling pre-code order.
It supersedes the older 12-step roadmap section that follows.

1. Complete System Constellation Audit
2. System Composition and Emergent Capability Audit
3. Dossier Regression and Doctrine Propagation Audit
4. Capability Ceiling and Breadth Audit
5. External Deep-Research Challenge Audit
6. Cross-System Workflow Proofs
7. Missing Connector Review
8. Front-Facing System and Message-Burden Audit
9. Product Experience and GUI Architecture Program
10. Data, Security, Performance, Accessibility, Packaging, and Operational Readiness Audits
11. Fatal Question Review
12. Architecture Readiness Contract
13. Salvage Completion Plan
14. Salvage Execution and Verification
15. Current-versus-Historical Separation
16. Repository Cleanup and Archive Milestone
17. Vertical Slice Plan
18. Final Pre-Code Build Readiness Review
19. Implementation

Implementation is not automatically authorized by Category `4`.
Implementation is not automatically authorized by the
`Architecture Readiness Contract`.
Implementation is not automatically authorized by the
`Vertical Slice Plan`.
Every earlier stage must close or explicitly transfer unresolved
blockers before later stages proceed.
The salvage subsequence is ordered:

1. `Salvage Completion Plan`
2. `Salvage Execution and Verification`
3. `Current-versus-Historical Separation`
4. `Repository Cleanup and Archive Milestone`

Separation and cleanup must not occur before salvage verification.
Repository cleanup and archive creation occur only after verified
salvage.
The milestone archive must support local backup and upload into the
Black Skies project folder.

### Governance/Orchestrator 10 Execution Horizon

GO10 originally intended to attempt Stages 1 through 5.

1. `Complete System Constellation Audit`
2. `System Composition and Emergent Capability Audit`
3. `Dossier Regression and Doctrine Propagation Audit`
4. `Capability Ceiling and Breadth Audit`
5. `External Deep-Research Challenge Audit`

GO10 ended early during Stage 1 as a continuity decision.
GO10 completed only the constellation work recorded before handoff.
GO10 did not complete Character Dynamics, constellation
consolidation, Stage 1 closure, or Stages 2 through 5.
GO11 completed Character Dynamics and the read-only constellation
consolidation.
Stage 1 — System Constellation Audit is complete.
Stage 2 — System Composition and Emergent Capability Audit is
complete.
Stage 3 — Dossier Regression and Doctrine Propagation Audit is complete
and closed.
The initial Stage 3 read-only regression inventory was completed.
DR-01 through DR-06 in
`docs/product_systems/dossier_regression_doctrine_propagation_findings.md`
were completed at doctrine level.
The six bounded dossier corrections were performed and reviewed.
No Category-4 demotion is required.
No substantive dossier reopening is required.
No unresolved Stage 3 finding remains.
No connector has been admitted.
Stage 4 — Capability Ceiling and Breadth Audit is complete and closed.
Stage 4 began through explicit author approval.
The initial Stage 4 read-only breadth inventory was completed.
CB-01 through CB-07 in
`docs/product_systems/capability_ceiling_breadth_audit_findings.md`
were completed at doctrine level.
The four approved author breadth decisions were propagated.
Both bounded breadth-propagation batches were performed and reviewed.
The risk-based coverage sampling pass was completed.
No missed material breadth gap was found.
No additional propagation or sampling pass is required.
No Category-4 demotion is required.
No substantive dossier reopening is required.
No unresolved Stage 4 finding remains.
Stage 5 — External Deep-Research Challenge Audit is active.
Stage 5 began through explicit author approval.
External research Passes A through D were completed.
Findings were recorded in
`docs/product_systems/external_deep_research_challenge_findings.md`.
Bounded doctrine propagation remains pending.
Stage 5 is not closed.
Stage 6 is not yet eligible.
Stage 5 does not admit connectors automatically.
Stage 5 does not unblock implementation.
Stage 5 external challenge inputs remain preserved.
Stage 6 remains the later Cross-System Workflow Proofs stage after
Stage 5.
Stage 6 candidates are tested according to their documented workflow
cases and reopening triggers.
Stage 9 and Stage 10 deferrals remain preserved.
All 45 dossiers remain recorded at Category `4`.
Category `4` is not build readiness.
Implementation remains blocked.

This is a working governance horizon, not permission to force
completion despite blocking evidence.

After Stage 3, run a `Post-Regression Scope Assessment`.
It must determine whether:

- category `4` dossiers remain valid
- dossiers must be reopened or demoted
- late doctrine caused material propagation failures
- stages `4` and `5` remain correctly sequenced
- an earlier handoff is safer

Outcomes:

- minor findings -> continue
- bounded dossier reopening -> correct and reassess
- major invalidation -> stop and prepare an earlier handoff

The handoff must include:

- current authority state
- findings ledger
- open deferrals
- reopened dossiers
- workflow-proof candidates
- loose-thread review
- exact next eligible action

### Post-Category-4 Architecture Horizon

Implementation requires completion of:

1. category `4` inventory coverage across all known category `2` and
   category `3` targets
2. `System Constellation Audit`
3. `Cross-System Workflow Proofs`
4. `Missing Connector Review`
5. `Fatal Question Review`
6. accepted `Architecture Readiness Contract`
7. approved `Vertical Slice Plan`

Reaching category `4` across the inventory does not authorize
implementation.
It activates the System Constellation and Architecture Readiness
sequence.

### Architecture Questions To Test Later

The later architecture sequence should test, not canonize:

- shared narrative substrate versus distributed ownership
- owner systems versus analyzers, projections, views, coordinators,
  and contracts
- evidence anchors and revision survival
- accepted versus inferred relationships
- chronology and arrangement ownership
- stale-analysis handling
- `Companion`-created views and workspaces without hidden durable state

### Local Runtime Hypotheses

The current planning spine preserves these later runtime hypotheses:

- local-first writing
- cached intelligence
- scheduled or overnight analysis
- optional API escalation
- manual truth approval
- tools own workflows
- models perform bounded tasks
- providers remain replaceable adapters
- `Ollama` is one adapter, not product authority

### Later AI Readiness Artifacts

Later AI-readiness work should use:

- `AI Model Capability Matrix`
- task-based evaluation fixtures
- measured routing decisions rather than permanent model-to-tool
  ownership

### Layered Memory Hypothesis

Later architecture review should test this layered-memory hypothesis:

- domain-owned accepted project records
- `Source Text Index`
- `Narrative Graph`
- `Episodic / Session Memory`
- `Procedural Memory`
- `Analysis Cache`
- vector search as one retrieval method

Boundary reminders:

- RAG is not the memory system
- vector search is not the memory system
- persistence does not replace domain ownership
- graph relationships do not automatically become canon
- cached analysis remains advisory

### Future Architecture Tests

Future architecture tests may include:

- `Story DNA`
- `Narrative X-Ray`
- `Emotional Terrain`
- `Narrative Physics`
- `Story Simulation`

These are later tests, not current implementation commitments.

### First-Slice Boundary Reminder

[v1_foundation_scope_lock.md](/C:/Dev/black-skies/docs/product_systems/v1_foundation_scope_lock.md)
remains provisional evidence for first-slice thinking only.
It is not the final vertical-slice plan.

## 12-Step Pre-Code Roadmap

### 1. Authority Anchor

- Purpose: prevent split-brain planning.
- Main docs: `current_truth_index.md`.
- Status: started or active.
- Reuse: keep.

### 2. Dossier Method

- Purpose: define dossier structure and question handling.
- Main docs: `README.md`, `_dossier_template.md`.
- Status: active.
- Reuse: keep.

### 3. First-Wave Rough Dossiers

- Purpose: capture major system areas without claiming build readiness.
- Main docs:
  - `continuity.md`
  - `signal_architecture.md`
  - `authorship_provenance_ai_visibility.md`
  - `model_routing_and_budget_architecture.md`
  - `llm_package_construction_architecture.md`
  - `explicit_content_architecture.md`
  - `memory_lab.md`
  - `companion.md`
- Status: rough or not build-ready.
- Reuse: keep and refine.

### 4. First-Wave Interaction Map

- Purpose: explain relationships without implying runtime wiring.
- Main doc: `system_interaction_map.md`.
- Status: rough or explanatory.
- Reuse: keep until superseded by fuller topology docs.

### 5. Fatal/Critical Decision Passes

- Purpose: answer or downgrade blockers before architecture or code.
- Status: started.
- Output location: affected dossiers, not a giant question register.
- Reuse: ongoing method.

### 6. Dossier Tightening Batches

- Purpose: improve rough dossiers until stable enough for planning.
- Status: not complete.
- Rule: do not mark build-ready while Critical questions remain.

#### Current Cluster Progress

These cluster notes are preserved as shaping history and partial
contract evidence.
They are no longer the main current sequencing authority.
Current sequencing is governed by the roadmap, the maturity inventory,
and the completed Draft Generation campaign history.

- Continuity / Signal / Routing / Package / Explicit-content cluster
  Status: historical shaping summary; implementation remains blocked and
  later dossier-completion work remains open.
  Current posture: stable enough to pause current tightening while exact future contract shaping and Jason decision follow-up continue later where applicable.
  Already shaped in this cluster: continuity truth boundaries; signal candidate versus durable signal-state boundaries; routing approval and spend guardrails; package and outbound clearance boundaries; explicit-content masking, exclusion, and fallback boundaries; rough `no-ai-route-available` doctrine; and resource-governed workload tier doctrine where routing touches it.

- Provenance / Memory Lab / Companion cluster
  Status: historical shaping summary; implementation remains blocked and
  later dossier-completion work remains open.
  Current posture: stable enough to pause current tightening while exact future contract shaping continues later.
  Already shaped in this cluster: provenance as private author-support metadata; clean default writing and export behavior; `Memory Lab` as governed recall rather than canon; `Memory Lab` retention and source tiers; `Companion` as workflow guide rather than system owner; `Companion` system-navigation support; temporary Writing Surface highlights or annotations; `Companion` plus `Memory Lab` workflow capability candidates; scheduled, idle, or overnight local-service candidate behavior; and resource-governed assistance plus workload tiers.

- Writing Cockpit cluster: `Writing Surface`, `Command Center Surface`, and `Narrative Insertion / Narrative Assertion`
  Status: historical shaping summary; implementation remains blocked and
  later dossier-completion work remains open.
  Current posture: stable enough to pause current tightening while exact future UI, state, and interaction contract shaping continues later.
  Already shaped in this cluster: Writing Surface sovereignty; direct writing always available; minimal default Writing Surface context; contextual or summonable insertion or assertion references; clean default writing view; lightweight, contextual, dismissible inline overlay boundaries; heavier context in summonable side or support surfaces; heavy-action prompts without silent execution; author-controlled masks and AI exclusion zones; raw excluded-text no-leak boundaries; manuscript, mask, exclusion, package-view, and outbound-payload distinctions; smallest useful default Command Center; Command Center anti-junk-drawer doctrine; Command Center visibility levels of always-visible, contextual, and summonable; Command Center action-permission boundaries; Command Center attention or blocker ownership boundaries; conceptual split between `Narrative Insertion` and `Narrative Assertion`; insertion without automatic assertion truth; assertion candidates requiring explicit author accept, save, or convert; narrative state or provenance distinctions; and consumer-boundary doctrine for `Continuity`, `Signal Architecture`, `Memory Lab`, `Companion`, `Outline`, Scene, Story Unit, and `Command Center Surface`.

- Structural Story System cluster: `Outline`, `Prose / Scene Projection`, and `Story Unit`
  Status: historical shaping summary; implementation remains blocked and
  later dossier-completion work remains open.
  Current posture: stable enough to pause current tightening while exact workflow, state, and interaction contract shaping continues later.
  Already shaped in this cluster: `Outline` as layered structural story map; flexible blobs, beats, scenes, chapters, and other containers; drag-and-drop planning movement; accepted-manuscript movement as preview or proposal only; projected order versus accepted manuscript order; mass, capacity, and word-pressure indicators without blocking writing; chronology versus telling or reading order; small default signal markers; `Signal Architecture` ownership of durable signal state; `Outline` as signal receiver or projector rather than signal owner; lightweight default Outline display; deeper hoverable, contextual, filterable, or summonable layers; prototype launcher behavior; safe prototype inputs; default-blocked prototype inputs; prototype outputs as advisory or generated planning artifacts; `Prose / Scene Projection` as view or projection rather than truth owner; `Story Unit` as optional flexible grouping or work container; smallest stable Story Unit payload; strongest lifecycle protection actions for delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material; and `Writing Surface`, `Outline`, and `Command Center Surface` action split.

- Character / Lore / Relationship / Emotion cluster: `Character Cards`, `Lore Cards`, `Relationship Map`, and `Emotion Graph`
  Status: historical shaping summary; implementation remains blocked and
  later dossier-completion work remains open.
  Current posture: stable enough to pause current tightening while exact state, workflow, protection, and display contract shaping continues later.
  Already shaped in this cluster: `Character Cards` showing accepted facts first by default; `Lore Cards` showing accepted lore or rules first by default; `Relationship Map` showing accepted or author-confirmed relationships first by default; `Emotion Graph` showing accepted or author-defined emotional intent first by default; candidate, advisory, or inferred material staying optional, hidden until needed, or visibly distinct; tiny candidate or signal indicators appearing without crowding default views; `Writing Surface` receiving small current-text actions such as show card, attach note, propose candidate, and view related facts; `Command Center Surface` receiving heavier review or management actions such as review candidates, accept or reject, bulk actions, unresolved candidates, conflicts, signals, and cleanup workflows; a shared state model distinguishing accepted author-owned fact or intent, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item; preserved source labels for candidate, advisory, or inferred items; direct small actions for create candidate, attach note, hide or dismiss advisory item, or open source; explicit confirmation requirements for accepting, updating, deleting, or restoring truth, exposing protected sources, converting advisory inference into accepted fact, bulk actions, and export or sync or publish; protection rules preventing deleted, hidden, masked, or AI-excluded material from appearing in default views, `Companion` context, `Memory Lab` recall, `Relationship Map` edges, `Emotion Graph` inference, prototype inputs, package previews, or outbound payloads unless explicitly permitted and allowed by owning-system rules; `Character Cards` and `Lore Cards` holding accepted facts or lore only when explicitly author-accepted; `Relationship Map` and `Emotion Graph` remaining primarily projection or visualization surfaces whose accepted relationship or emotional-intent records still require explicit author acceptance; no shadow canon; and no silent truth mutation.

- Critique / Evaluation / Author Intent / Companion routing cluster
  Status: historical shaping summary; implementation remains blocked and
  later dossier-completion work remains open.
  Current posture: stable enough to pause current tightening while exact routing, intake, and capability-boundary contract shaping continues later.
  Already shaped in this cluster: `Companion` routing requests to the owning system instead of absorbing every task; `Critique` treated as an evaluation capability rather than a universal surface; `Author Intent / Story Setup` treated as a living goal-and-boundary profile rather than a rigid startup gate; old `Wizard` concept preserved as a historical seed for `Author Intent / Story Setup` plus `Workflow Spine / Author Journey`; and old `Critique` concept preserved as a historical seed for `Critique`, `Feedback Notes`, `Signal Architecture`, `Draft Generation`, `Plugin / Rubric System`, `Continuity`, and `Companion` explanation.

#### Applied Routing / Resource Decisions

- Jason's accepted routing or resource decisions are now applied in the active dossiers:
  - session approval may cover bounded paid critique, bounded outbound model help, scheduled local-only jobs, and repeated low-risk approved workflow actions,
  - fresh approval is required for first outbound manuscript transfer, explicit-content outbound package, spend above cap, provider switch after refusal, export or sync or publish, deletion, truth mutation, raw excluded-span retention, and tool use outside safe local UI,
  - spending guardrails now include default cap `0` until set, estimated cost before paid work, visible session budget remaining, over-cap work blocked, and no silent paid retries,
  - `no-ai-route-available` now appears when the local route fails or refuses, the outbound route blocks or refuses, masking or substitution remains insufficient, required approval is denied, the budget cap blocks the task, or no permitted fallback remains,
  - precedence is now author authority -> masks or AI exclusion zones -> privacy or outbound rules -> spend rules -> routing preference -> `Companion` convenience.
- Remaining work for those decisions is future contract shaping around exact approval UX, persistence, revocation, audit behavior, telemetry, and cross-surface enforcement.

#### Next Candidate Cluster

- Current active campaign: Stage 4 —
  `Capability Ceiling and Breadth Audit`
- Sequencing authority: `current_product_roadmap.md` together with
  `dossier_maturity_inventory.md`
- Remaining objective before later architecture review: complete bounded
  breadth propagation while preserving full category `4` coverage

#### Dossier Inventory / Reconciliation Note

- The current registry contains `45` registered product systems.
- `41` one-to-one current dossier files exist under
  `docs/product_systems/`.
- `4` registry systems are currently represented by existing bridge or
  architecture dossiers rather than one-to-one filenames:
  - `Explicit-Content Marker / Send-Package Censor` -> `explicit_content_architecture.md`
  - `Local LLM vs Paid API Routing` -> `model_routing_and_budget_architecture.md`
  - `Model Router / Provider Execution Policy` -> `model_routing_and_budget_architecture.md` and `llm_package_construction_architecture.md`
  - `Budget / Token / Cost Guardrails` -> `model_routing_and_budget_architecture.md`
- Live maturity totals are now:
  - category `2`: `0`
  - category `3`: `0`
  - category `4`: `45`
  - category `5`: `0`
  - category `6`: `0`
  - total registry targets: `45`
- `0` registry targets remain fully unrepresented.
- Dossier creation and question-intake review were intermediate steps,
  not dossier completion or implementation readiness.
- Implementation remains blocked.

#### Current Follow-On Contract Needs

These are candidate contract artifacts revealed during Step 6 tightening.
Do not create new docs for them yet.
Capture them inside the existing dossiers unless a later controlled batch proves a separate artifact is necessary.

- Continuity / Signal shared lifecycle contract
  Candidate homes: `continuity.md`, `signal_architecture.md`, and `system_interaction_map.md` only if a relationship note is helpful.
- Durable advisory history retention contract
  Candidate homes: `continuity.md`, `signal_architecture.md`, `memory_lab.md`.
- Approval classes and spend guardrails contract
  Candidate homes: `model_routing_and_budget_architecture.md`, `companion.md`, `llm_package_construction_architecture.md`.
- Provider-neutral package contract
  Candidate homes: `llm_package_construction_architecture.md`, `model_routing_and_budget_architecture.md`.
- Redaction / mask-map / package-view contract
  Candidate homes: `llm_package_construction_architecture.md`, `explicit_content_architecture.md`, and relationship notes in `continuity.md` or `signal_architecture.md` if needed.
- Explicit-content preview and clearance contract
  Candidate homes: `explicit_content_architecture.md`, `llm_package_construction_architecture.md`, `model_routing_and_budget_architecture.md`.
- `no-ai-route-available` escalation contract
  Candidate homes: `model_routing_and_budget_architecture.md`, `explicit_content_architecture.md`, `llm_package_construction_architecture.md`, `companion.md`.
- Writing Surface exact overlay mechanics
  Candidate homes: `writing_surface.md`.
- Writing Surface focus, shortcut, and persistence behavior
  Candidate homes: `writing_surface.md`.
- Writing Surface heavy-action interaction mechanics
  Candidate homes: `writing_surface.md`, `model_routing_and_budget_architecture.md`, and `llm_package_construction_architecture.md` when needed.
- Writing Surface mask, exclusion, and package-view interaction details
  Candidate homes: `writing_surface.md`, `authorship_provenance_ai_visibility.md`, `explicit_content_architecture.md`, and `llm_package_construction_architecture.md`.
- Command Center exact layout mechanics
  Candidate homes: `command_center_surface.md`.
- Command Center action-routing mechanics
  Candidate homes: `command_center_surface.md`, `model_routing_and_budget_architecture.md`, and later owning-system dossiers as needed.
- Command Center notification and persistence behavior
  Candidate homes: `command_center_surface.md`, `signal_architecture.md`, and `memory_lab.md` if later needed.
- Command Center detailed workflow behavior
  Candidate homes: `command_center_surface.md`.
- Narrative Insertion exact confirmation UX
  Candidate homes: `narrative_insertion_assertion.md`.
- Narrative Insertion exact state machine
  Candidate homes: `narrative_insertion_assertion.md`.
- Narrative Insertion exact provenance fields
  Candidate homes: `narrative_insertion_assertion.md`, `authorship_provenance_ai_visibility.md`.
- Narrative Insertion persistence behavior
  Candidate homes: `narrative_insertion_assertion.md`.
- Narrative Insertion consumer API or contract details
  Candidate homes: `narrative_insertion_assertion.md`, with relationship notes later in `continuity.md`, `signal_architecture.md`, `memory_lab.md`, or structure dossiers if needed.
- Exact Outline drag-and-drop preview, confirmation, undo, and provenance contract
  Candidate homes: `outline.md`.
- Exact accepted-manuscript preview or proposal workflow
  Candidate homes: `outline.md`, `prose_scene_projection.md`, `command_center_surface.md`.
- Exact prototype launch, review, conversion, and protected-input approval contract
  Candidate homes: `outline.md`, `model_routing_and_budget_architecture.md`, `memory_lab.md`, and `explicit_content_architecture.md` when needed.
- Exact projection preview, proposal, duplication, and comparison workflow
  Candidate homes: `prose_scene_projection.md`, `outline.md`, `command_center_surface.md`.
- Exact accepted-manuscript versus projected-view labeling contract
  Candidate homes: `prose_scene_projection.md`, `writing_surface.md`, `authorship_provenance_ai_visibility.md`.
- Exact Story Unit payload and state contract
  Candidate homes: `story_unit.md`.
- Exact Story Unit lifecycle confirmation, undo, recovery, and provenance contract
  Candidate homes: `story_unit.md`, with routing or authority notes later if needed.
- Exact split, merge, archive, and promotion workflow contract
  Candidate homes: `story_unit.md`, `narrative_insertion_assertion.md`, `signal_architecture.md`, and `memory_lab.md` where later relationship notes are needed.
- Exact cross-surface interaction contract among `Writing Surface`, `Outline`, `Prose / Scene Projection`, `Story Unit`, and `Command Center Surface`
  Candidate homes: `writing_surface.md`, `outline.md`, `prose_scene_projection.md`, `story_unit.md`, `command_center_surface.md`, and `system_interaction_map.md` if a relationship note becomes necessary.
- Exact item-state contract for `Character Cards`, `Lore Cards`, `Relationship Map`, and `Emotion Graph`
  Candidate homes: `character_cards.md`, `lore_cards.md`, `relationship_map.md`, `emotion_graph.md`.
- Exact source-label contract for `Character Cards`, `Lore Cards`, `Relationship Map`, and `Emotion Graph`
  Candidate homes: `character_cards.md`, `lore_cards.md`, `relationship_map.md`, `emotion_graph.md`, and `authorship_provenance_ai_visibility.md` if a shared provenance note later becomes necessary.
- Exact create, update, hide, delete, accept, and reject workflow contracts for `Character Cards`, `Lore Cards`, `Relationship Map`, and `Emotion Graph`
  Candidate homes: `character_cards.md`, `lore_cards.md`, `relationship_map.md`, `emotion_graph.md`, and later relationship notes in `command_center_surface.md` or `writing_surface.md` when needed.
- Exact default-view indicator, expansion, and clutter contracts for `Character Cards`, `Lore Cards`, `Relationship Map`, and `Emotion Graph`
  Candidate homes: `character_cards.md`, `lore_cards.md`, `relationship_map.md`, `emotion_graph.md`.
- Exact accepted-versus-inferred visual distinction and filter contracts for `Relationship Map` and `Emotion Graph`
  Candidate homes: `relationship_map.md`, `emotion_graph.md`.
- Exact `Writing Surface` versus `Command Center Surface` action-routing contract for the Character / Lore / Relationship / Emotion cluster
  Candidate homes: `character_cards.md`, `lore_cards.md`, `relationship_map.md`, `emotion_graph.md`, `writing_surface.md`, `command_center_surface.md`.
- Exact protection and enforcement contract for deleted, hidden, masked, or AI-excluded material across views, recall, inference, prototypes, package previews, and outbound payloads
  Candidate homes: `character_cards.md`, `lore_cards.md`, `relationship_map.md`, `emotion_graph.md`, `memory_lab.md`, `explicit_content_architecture.md`, `llm_package_construction_architecture.md`, and `model_routing_and_budget_architecture.md` when needed.
- Exact state contracts
  Candidate homes: remaining active dossiers as applicable; keep shaping inside the relevant dossier rather than a new shared register unless a later controlled batch proves otherwise.
- Exact workflow contracts
  Candidate homes: remaining active dossiers as applicable; especially workflow-heavy product and system dossiers.
- Exact protection and enforcement contracts
  Candidate homes: remaining active dossiers as applicable; especially privacy, masking, retrieval, file, routing, and async-job dossiers.
- Exact display and default-view contracts
  Candidate homes: remaining active dossiers as applicable; especially user-facing product and intelligence dossiers.
- Exact cross-surface interaction contracts
  Candidate homes: `writing_surface.md`, `command_center_surface.md`, related consumer dossiers, and `system_interaction_map.md` only when relationship notes are helpful.
- Critique / Evaluation exact findings, evidence-bundle, ranking, and invocation contract
  Candidate homes: `critique_evaluation.md`.
- Autosave / instant-save feel and local persistence contract
  Candidate homes: `writing_surface.md`, `snapshots_backup_restore_history.md`, `service_health_offline_degraded_mode.md`, `workflow_spine_author_journey.md`.
- Human document interchange exact contract shaping
  Candidate homes: `import_export_document_interchange.md`.
- AI / memory transfer format contract
  Candidate homes: `llm_package_construction_architecture.md`, `model_routing_and_budget_architecture.md`, `memory_lab.md`, and later sections inside future `import_export_document_interchange.md` if needed.

Rule for these needs:

- keep product or system contract shaping inside existing dossiers first,
- do not create a new product dossier unless selected by a controlled batch,
- do not create a separate signal tracker or signal-state doc unless a later controlled batch proves `signal_architecture.md` and `system_interaction_map.md` are insufficient,
- if a later separate contract artifact is justified, classify it as reusable or temporary at creation time and define its later archive, merge, or supersede rule.

### 7. Ecosystem Review

- Purpose: compare dossiers for overlap, redundancy, missing systems, merge, shrink, or delete candidates.
- Status: not started.
- Future doc: `ecosystem_review.md` only if needed.
- Lifecycle: likely temporary; archive after build order.

### 8. System Topology Review

- Purpose: map whole-system structure, dependencies, authority boundaries, and data, signal, or model flows.
- Status: not started.
- Future doc: `system_topology.md` or expanded `system_interaction_map.md`.
- Reuse: likely keep.

### 9. Gap / Redundancy Review

- Purpose: identify missing tools, duplicate concepts, unclear ownership, dead features, and future-lane risks.
- Status: not started.
- Rule: prefer sections in existing docs unless a separate doc becomes necessary.

### 10. Old-Code Extraction Review

- Purpose: decide what old code proves, what it does not prove, what can be salvaged, and what should be ignored.
- Current docs:
  - `continuity_carry_forward_register.md`
  - `continuity_surface_to_dossier_crosswalk.md`
- Status: started for continuity only.
- Lifecycle: temporary or salvage support; later superseded by broader extraction or build planning.

### 11. Build Readiness / Build Order

- Purpose: define what can be coded, in what order, with dependencies and blockers clear.
- Status: not started.
- Future docs:
  - `build_order.md`
  - `v1_scope_lock.md`
  - `dependency_map.md` if needed
- Rule: do not create yet unless enough dossiers are stable.

### 12. Code

- Purpose: implementation.
- Status: blocked until relevant Fatal or Critical questions are resolved for the system being built.
- Rule: no code from rough dossier uncertainty.

## Reusable Docs

- `current_truth_index.md`
  Reusable because it is the doctrine anchor and precedence rulebook.
- `README.md`
  Reusable because it defines the dossier set, posture, and current planning spine.
- `_dossier_template.md`
  Reusable because it defines the standard dossier structure and question method.
- `system_interaction_map.md`
  Reusable because it explains current cross-system relationships without implying runtime wiring.
- first-wave dossiers
  Reusable because active doctrine and active questions now live inside them.
- `BLACK_SKIES_FIX_TRACKER.md`
  Reusable because it records planning and runtime continuity across batches and threads.

## Temporary / Patch Docs

- `docs/audits/phase32/continuity_carry_forward_register.md`
  Why it exists: temporary continuity-specific salvage-support for old-code extraction review.
  Obsolete when: broader extraction review, stable dossier integration, or build planning supersede continuity-only salvage work.
  Later disposition: archive, merge, or otherwise supersede after that handoff.
- `docs/audits/phase32/continuity_surface_to_dossier_crosswalk.md`
  Why it exists: temporary salvage-support that maps older continuity-bearing surfaces into dossier destinations.
  Obsolete when: dossier boundaries and later extraction, topology, or build-planning docs absorb this mapping.
  Later disposition: archive, merge, or otherwise supersede after that handoff.
- any future `ecosystem_review.md`, if created
  Why it exists: temporary ecosystem overlap or redundancy review support only if that review is actually started.
  Obsolete when: build order and stable dossier boundaries exist.
  Later disposition: archive, merge, or supersede after use.

## Docs Not To Create Yet

Do not create yet:

- `build_order.md`
- `v1_scope_lock.md`
- `dependency_map.md`
- `system_topology.md` unless topology review begins
- `ecosystem_review.md` unless ecosystem review begins
- new product dossiers unless selected by a controlled batch
- separate signal tracker or signal-state doc unless a controlled batch proves existing dossier homes are insufficient

## Stop Conditions

Stop and hand over when:

- the current batch is complete,
- repo is clean,
- commits are pushed,
- unresolved blockers are listed,
- the next safe batch is named,
- no untracked logs, raw dumps, or planning folders remain.

## Next-Thread Handover Header

Use this header template at the top of the next thread:

```md
Project: Black Skies
Branch:
Latest commit:
Current phase/lane:
Completed in previous thread:
Current doctrine:
Current blockers:
Current next batch:
Do not do:
Validation commands:
Expected clean state:
```

## Current Next Action

Stage 1 — System Constellation Audit is complete.
Stage 2 — System Composition and Emergent Capability Audit is
complete.
Stage 3 — Dossier Regression and Doctrine Propagation Audit is complete
and closed.
The initial Stage 3 read-only regression inventory was completed.
DR-01 through DR-06 in
`docs/product_systems/dossier_regression_doctrine_propagation_findings.md`
were completed at doctrine level.
The six bounded dossier corrections were performed and reviewed.
No Category-4 demotion is required.
No substantive dossier reopening is required.
No unresolved Stage 3 finding remains.
No connector has been admitted.
Stage 4 — Capability Ceiling and Breadth Audit is complete and closed.
Stage 4 began through explicit author approval.
The initial Stage 4 read-only breadth inventory was completed.
CB-01 through CB-07 in
`docs/product_systems/capability_ceiling_breadth_audit_findings.md`
were completed at doctrine level.
The four approved author breadth decisions were propagated.
Both bounded breadth-propagation batches were performed and reviewed.
The risk-based coverage sampling pass was completed.
No missed material breadth gap was found.
No additional propagation or sampling pass is required.
No Category-4 demotion is required.
No substantive dossier reopening is required.
No unresolved Stage 4 finding remains.
Stage 5 — External Deep-Research Challenge Audit is active.
Stage 5 began through explicit author approval.
External research Passes A through D were completed.
Findings were recorded in
`docs/product_systems/external_deep_research_challenge_findings.md`.
Bounded doctrine propagation remains pending.
Stage 5 is not closed.
Stage 6 is not yet eligible.
Stage 5 does not admit connectors automatically.
Stage 5 does not unblock implementation.
Stage 5 external challenge inputs remain preserved.
Stage 6, Stage 9, and Stage 10 deferrals remain preserved.
Implementation, GUI implementation, architecture selection, salvage
execution, current-versus-historical separation, and repository cleanup
remain blocked.
This planning spine records Stage 5 as active without closing it.
Findings ledger: [system_constellation_audit_findings_ledger.md](/C:/Dev/black-skies/docs/product_systems/system_constellation_audit_findings_ledger.md).
Every remaining constellation pass must update that ledger.
