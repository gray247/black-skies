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

- Continuity / Signal / Routing / Package / Explicit-content cluster
  Status: paused, still blocked for implementation, and still rough or investigative or not build-ready.
  Current posture: stable enough to pause current tightening while exact future contract shaping and Jason decision follow-up continue later where applicable.
  Already shaped in this cluster: continuity truth boundaries; signal candidate versus durable signal-state boundaries; routing approval and spend guardrails; package and outbound clearance boundaries; explicit-content masking, exclusion, and fallback boundaries; rough `no-ai-route-available` doctrine; and resource-governed workload tier doctrine where routing touches it.

- Provenance / Memory Lab / Companion cluster
  Status: paused, still blocked for implementation, and still rough or investigative or not build-ready.
  Current posture: stable enough to pause current tightening while exact future contract shaping continues later.
  Already shaped in this cluster: provenance as private author-support metadata; clean default writing and export behavior; `Memory Lab` as governed recall rather than canon; `Memory Lab` retention and source tiers; `Companion` as workflow guide rather than system owner; `Companion` system-navigation support; temporary Writing Surface highlights or annotations; `Companion` plus `Memory Lab` workflow capability candidates; scheduled, idle, or overnight local-service candidate behavior; and resource-governed assistance plus workload tiers.

- Writing Cockpit cluster: `Writing Surface`, `Command Center Surface`, and `Narrative Insertion / Narrative Assertion`
  Status: paused, still blocked for implementation, and still rough or investigative or not build-ready.
  Current posture: stable enough to pause current tightening while exact future UI, state, and interaction contract shaping continues later.
  Already shaped in this cluster: Writing Surface sovereignty; direct writing always available; minimal default Writing Surface context; contextual or summonable insertion or assertion references; clean default writing view; lightweight, contextual, dismissible inline overlay boundaries; heavier context in summonable side or support surfaces; heavy-action prompts without silent execution; author-controlled masks and AI exclusion zones; raw excluded-text no-leak boundaries; manuscript, mask, exclusion, package-view, and outbound-payload distinctions; smallest useful default Command Center; Command Center anti-junk-drawer doctrine; Command Center visibility levels of always-visible, contextual, and summonable; Command Center action-permission boundaries; Command Center attention or blocker ownership boundaries; conceptual split between `Narrative Insertion` and `Narrative Assertion`; insertion without automatic assertion truth; assertion candidates requiring explicit author accept, save, or convert; narrative state or provenance distinctions; and consumer-boundary doctrine for `Continuity`, `Signal Architecture`, `Memory Lab`, `Companion`, `Outline`, Scene, Story Unit, and `Command Center Surface`.

- Structural Story System cluster: `Outline`, `Prose / Scene Projection`, and `Story Unit`
  Status: paused, still blocked for implementation, and still rough or investigative or not build-ready.
  Current posture: stable enough to pause current tightening while exact workflow, state, and interaction contract shaping continues later.
  Already shaped in this cluster: `Outline` as layered structural story map; flexible blobs, beats, scenes, chapters, and other containers; drag-and-drop planning movement; accepted-manuscript movement as preview or proposal only; projected order versus accepted manuscript order; mass, capacity, and word-pressure indicators without blocking writing; chronology versus telling or reading order; small default signal markers; `Signal Architecture` ownership of durable signal state; `Outline` as signal receiver or projector rather than signal owner; lightweight default Outline display; deeper hoverable, contextual, filterable, or summonable layers; prototype launcher behavior; safe prototype inputs; default-blocked prototype inputs; prototype outputs as advisory or generated planning artifacts; `Prose / Scene Projection` as view or projection rather than truth owner; `Story Unit` as optional flexible grouping or work container; smallest stable Story Unit payload; strongest lifecycle protection actions for delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material; and `Writing Surface`, `Outline`, and `Command Center Surface` action split.

- Character / Lore / Relationship / Emotion cluster: `Character Cards`, `Lore Cards`, `Relationship Map`, and `Emotion Graph`
  Status: paused, still blocked for implementation, and still rough or investigative or not build-ready.
  Current posture: stable enough to pause current tightening while exact state, workflow, protection, and display contract shaping continues later.
  Already shaped in this cluster: `Character Cards` showing accepted facts first by default; `Lore Cards` showing accepted lore or rules first by default; `Relationship Map` showing accepted or author-confirmed relationships first by default; `Emotion Graph` showing accepted or author-defined emotional intent first by default; candidate, advisory, or inferred material staying optional, hidden until needed, or visibly distinct; tiny candidate or signal indicators appearing without crowding default views; `Writing Surface` receiving small current-text actions such as show card, attach note, propose candidate, and view related facts; `Command Center Surface` receiving heavier review or management actions such as review candidates, accept or reject, bulk actions, unresolved candidates, conflicts, signals, and cleanup workflows; a shared state model distinguishing accepted author-owned fact or intent, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item; preserved source labels for candidate, advisory, or inferred items; direct small actions for create candidate, attach note, hide or dismiss advisory item, or open source; explicit confirmation requirements for accepting, updating, deleting, or restoring truth, exposing protected sources, converting advisory inference into accepted fact, bulk actions, and export or sync or publish; protection rules preventing deleted, hidden, masked, or AI-excluded material from appearing in default views, `Companion` context, `Memory Lab` recall, `Relationship Map` edges, `Emotion Graph` inference, prototype inputs, package previews, or outbound payloads unless explicitly permitted and allowed by owning-system rules; `Character Cards` and `Lore Cards` holding accepted facts or lore only when explicitly author-accepted; `Relationship Map` and `Emotion Graph` remaining primarily projection or visualization surfaces whose accepted relationship or emotional-intent records still require explicit author acceptance; no shadow canon; and no silent truth mutation.

- Critique / Evaluation / Author Intent / Companion routing cluster
  Status: paused, still blocked for implementation, and still rough or investigative or not build-ready.
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

- Next candidate Step 6 cluster: not selected in this planning-spine sync.
- Current note: the previously listed structural story system cluster has now moved from next-candidate status into paused cluster status above.
- Future note: run a dossier inventory or missing-dossier reconciliation pass before choosing the next major Step 6 bundle.
- `Critique / Evaluation` now has a one-to-one dossier and is no longer only bridge-backed.
- Future note: `Author Intent / Story Setup` may remain inside `Workflow Spine / Author Journey` for now, with later review for whether it needs its own dossier.

#### Dossier Inventory / Reconciliation Note

- The current registry contains `42` registered or planned product systems.
- `18` dossier files existed before the reconciliation pass for this sweep.
- `23` missing one-to-one registered dossiers were created as placeholder dossiers in the reconciliation pass.
- `42` dossier files now exist under `docs/product_systems/`.
- `0` registered systems remain fully unrepresented only if bridge-backed coverage counts as representation for this sweep.
- `5` registry systems are currently represented by existing bridge or architecture dossiers rather than one-to-one filenames:
  - `Explicit-Content Marker / Send-Package Censor` -> `explicit_content_architecture.md`
  - `Import / Export / Google Docs` -> `explicit_content_architecture.md` and `authorship_provenance_ai_visibility.md`
  - `Local LLM vs Paid API Routing` -> `model_routing_and_budget_architecture.md`
  - `Model Router / Provider Execution Policy` -> `model_routing_and_budget_architecture.md` and `llm_package_construction_architecture.md`
  - `Budget / Token / Cost Guardrails` -> `model_routing_and_budget_architecture.md`
- `Critique / Evaluation` now has its own one-to-one dossier and is no longer only bridge-backed.
- `Import / Export / Google Docs` remains the strongest later one-to-one dossier candidate even though provisional bridge coverage exists now.
- The Critique / Evaluation / Author Intent / Companion routing cluster has now been captured across the existing docs, with `Critique / Evaluation` now represented by its own dossier.
- The external raw question-bank source currently lives at `C:\Dev\plan ideas\continuity\open_questions_register.md`.
- That raw register remains archive, intake, or triage source only rather than active planning spine.
- Active questions still belong inside the relevant dossier `Pre-Rough Alignment Questionnaire`.
- All `23 / 23` placeholder dossiers created in the inventory batch have now received controlled question-intake review across five intake batches:
  - Batch 1: workflow, scene, draft, timeline, and foreshadow or payoff
  - Batch 2: settings, snapshots, service health, diagnostics, and testing or harness
  - Batch 3: senses, overused words, cliche, theme, and plugin or rubric
  - Batch 4: binder, search or retrieval, series binder, file manager, and accessibility
  - Batch 5: feedback notes, splash or startup, and async job queue
- `0` placeholder dossiers remain unreviewed for this intake sweep.
- `Critique / Evaluation` now has a one-to-one dossier and is no longer only bridge-backed.
- Dossier creation and question-intake review are not dossier completion.
- All new dossiers remain rough, investigative, and not build-ready.
- Implementation remains blocked or not build-ready.

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
- Later bridge-backed dossier review for `Import / Export / Google Docs`
  Candidate homes: future one-to-one dossier decision; do not create in this pass.

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

After this doc is created and committed, run a Pre-Handover Audit to verify:

- fatal decisions are reflected,
- the plan doc matches current docs,
- no loose roadmap claims exist,
- no new docs are required before handover,
- the next thread can continue safely.
