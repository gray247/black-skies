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
