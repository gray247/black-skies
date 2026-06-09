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
- Fatal questions in first-wave dossiers reduced, resolved, or downgraded to Critical while dossiers remain rough and not build-ready.

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

#### Applied Routing / Resource Decisions

- Jason's accepted routing or resource decisions are now applied in the active dossiers:
  - session approval may cover bounded paid critique, bounded outbound model help, scheduled local-only jobs, and repeated low-risk approved workflow actions,
  - fresh approval is required for first outbound manuscript transfer, explicit-content outbound package, spend above cap, provider switch after refusal, export or sync or publish, deletion, truth mutation, raw excluded-span retention, and tool use outside safe local UI,
  - spending guardrails now include default cap `0` until set, estimated cost before paid work, visible session budget remaining, over-cap work blocked, and no silent paid retries,
  - `no-ai-route-available` now appears when the local route fails or refuses, the outbound route blocks or refuses, masking or substitution remains insufficient, required approval is denied, the budget cap blocks the task, or no permitted fallback remains,
  - precedence is now author authority -> masks or AI exclusion zones -> privacy or outbound rules -> spend rules -> routing preference -> `Companion` convenience.
- Remaining work for those decisions is future contract shaping around exact approval UX, persistence, revocation, audit behavior, telemetry, and cross-surface enforcement.

#### Next Candidate Cluster

- Next candidate Step 6 cluster: `Outline`, `Prose / Scene Projection`, and `Story Unit`.
- Purpose of that next candidate cluster: confirm `Outline` is optional and not narrative truth, confirm Scene is projection or container or view or legacy compatibility only, confirm Story Unit is optional grouping or work-container only, prevent structure tools from becoming hidden truth owners, and clarify how `Outline`, Scene, Story Unit, `Writing Surface`, `Narrative Assertion`, `Continuity`, `Signal Architecture`, `Memory Lab`, and `Companion` interact without shifting truth ownership away from the author.

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
