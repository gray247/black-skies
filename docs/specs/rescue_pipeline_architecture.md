Status: Active
Version: 1.0
Last Reviewed: 2026-03-18

# Rescue Pipeline Architecture

Purpose: define the current long-form rescue pipeline as a staged editing system for generation-side editorial repair.

This document describes the active rescue architecture after rescue-plumbing / reliability-control closeout. It is the canonical description of how weak local narrative segments are detected, repaired, validated, and escalated.

For final shipped Phase 8 writer-facing behavior, use [docs/phases/phase8_closeout.md](../phases/phase8_closeout.md) as the authority. This rescue architecture doc remains the authority for rescue staging and carryover principles, but not for the full final UI/workflow closeout state.

## Scope

This architecture covers:
- generation-side rescue behavior for weak local story segments
- slot detection and bounded local repair
- escalation from minimal repair to bounded local rewrite
- validation contracts and guardrails

This architecture does not reopen:
- slot binding / alias plumbing bugs
- stale-target rebinding as a normal success path
- followthrough-credit plumbing regressions
- broader routing, preflight, or provider-policy behavior

Those issues are treated as closed rescue-plumbing work unless a new artifact proves a deterministic regression.

## Design Principles

- Minimal intervention first.
- Expanded context only when required.
- Validation is mandatory at every repair stage.
- Rescue must behave like an outline-faithful editorial partner, not an autonomous co-author.
- Local edits must preserve subject, scene role, action intent, and story premise.

## Pipeline Stages

### 1. Generation

Initial content creation for a scene or chunk.

Output:
- raw narrative text

### 2. Detection

Detection identifies weak local narrative units that should be repaired.

Typical failure classes include:
- `patch_dialogue_grounding_unresolved`
- `patch_specificity_unresolved`
- `patch_length_distortion`

Output:
- structured rescue slot list

Each slot is an explicitly bounded local unit. The current rescue stack prefers exact local units and avoids broad rewrite scope during first-pass repair.

### 3. Primary Repair

Primary repair uses `slot_patch`.

Behavior:
- performs minimal, surgical edits on bounded local slots
- preserves tone and intent
- limits scope to the targeted span

Primary repair is the default rescue primitive because it is the most controlled local intervention.

### 4. Validation

Validation runs after every repair stage.

Validation has two roles:
- `slot_local_validation`: determine whether the repaired local unit actually resolved the targeted weakness
- `scene_level_guardrails`: reject repairs that create drift, distortion, or other broader problems

#### Dialogue Grounding Contract

If dialogue is present and grounding is targeted, the repaired local unit must include at least one concrete grounding cue such as:
- character reference
- physical action
- environmental anchor

If that contract is not met, the repair fails validation and may escalate.

#### Additional Local Contracts

Depending on the targeted weakness, validation may also require:
- literal concrete lift for specificity-targeted repairs
- bounded local length preservation
- no invented named entities or story events
- preserved local subject, action intent, and scene role

### 5. Escalation Repair

Escalation repair uses `local_rewrite_block`.

It triggers only when primary repair fails validation on a defined rescue failure class.

Behavior:
- rewrites one bounded local excerpt
- uses expanded immediate context around the weak local unit
- preserves narrative meaning and outline-faithful intent

Additional constraints:
- must explicitly resolve the validation failure that triggered escalation
- must not introduce length distortion
- must not broaden into full-scene rewriting

`local_rewrite_block` is a fallback strategy, not a peer default to `slot_patch`.

### 6. Scene State

`scene_state` is optional but recommended as structured rescue context.

When available, it may include:
- `characters_present`
- `location`
- `active_events`

Repairs should reference at least one applicable `scene_state` element when that materially helps grounding, fidelity, or local editorial accuracy.

## Execution Flow

`generation -> detection -> primary_repair -> validation`

If validation fails on an escalation-eligible class:

`primary_repair fail -> escalation_repair -> validation`

Then:
- accept
- retry within bounded limits
- or fail with a classified terminal reason

## Repair Outcome Taxonomy

Every rescue attempt should be interpretable under one of these outcomes:
- `accepted`
- `accepted_with_escalation`
- `rejected_generation_miss`
- `rejected_guardrail`
- `rejected_plumbing`

Interpretation:
- `accepted`: local repair succeeded without escalation
- `accepted_with_escalation`: bounded fallback rewrite succeeded after primary repair failed
- `rejected_generation_miss`: the model responded but did not solve the targeted editorial problem
- `rejected_guardrail`: the repair introduced drift, distortion, or another blocked quality regression
- `rejected_plumbing`: deterministic transport/binding/application failure; this should now be rare and treated as a regression class

## Carryover Approval

Editorial review flagging and carryover approval are separate decisions.

A chunk may be:
- acceptable enough to retain in the manuscript for now
- but still unsafe to use as normal continuity input for later chunks

The backend therefore tracks a carryover decision separately from rescue failure classification:
- `safe`: normal carryover allowed
- `restricted`: only reduced carryover is allowed
- `blocked_pending_review`: normal carryover is withheld until review

This protects downstream narrative continuity from unresolved generation-side rescue misses even when the rescue-plumbing path itself is behaving correctly.

## Guardrails

- `max_repair_attempts = 2`
- escalation is triggered only by defined failure classes
- validation is mandatory after every repair stage
- repairs must remain outline-faithful
- repairs must not invent new story turns, named entities, or major causal shifts

## Strategy Configuration

Current staged strategy:
- primary: `slot_patch`
- escalation: `local_rewrite_block`

This is a controlled escalation model. Minimal local patching is attempted first; bounded local rewriting is reserved for repair failures that need a wider local context window.

## Known Risks

- local length distortion during escalation repair
- tone drift inside expanded local rewrites
- validator false positives or false negatives
- generation-side underreach where the model responds but stays vague, floating, or editorially weak

## Current Phase Alignment

This architecture belongs to the active engine phase:
- **Outline-Faithful Editorial Reliability**

That phase focuses on:
- generation-side rescue variance
- outline-faithful local editing
- stable editorial repair quality under bounded rescue constraints

It is distinct from the closed rescue-plumbing phase, which addressed deterministic rescue-path bugs rather than generation quality.

## Future Improvements

- stronger `scene_state` enforcement when rescue context is available
- dialogue-specific repair strategy tuning
- adaptive repair strategy selection by failure class
