# Memory Lab: Phase 5 Contested Memory Spec

## Program and System
- Program: `Memory Lab`
- System: `Narrative Cognition Layer`
- Capability: `Phase 5 — Contested Memory`

## Scope
Phase 5 introduces deterministic contested advisory-memory selection where multiple interpretations may coexist and compete without mutating canon.

## Canonical Contested Key
Contested grouping uses the canonical key:

`{chapter_id}|{slot_type}|{source_kind}|{source_ref}|{interpretation_group_id}`

### Normalization Rules
- Trim leading/trailing whitespace.
- Lowercase.
- Collapse internal whitespace to a single space.
- Convert `null` to empty string before normalization.

### Invalid Metadata Rule
If contested metadata is missing or corrupt:
- Exclude artifact from contested grouping.
- Keep artifact eligible for non-contested path.
- Emit diagnostic reason code: `invalid_contested_group_metadata`.

## Scope Boundary
- Phase 5 scope is chapter-local contested continuity only.
- Cross-chapter contested continuity is out of scope.

## Selection Contract
- One winner per slot/type.
- Max one alternate per slot/type.
- Alternate appears only when:
  - `winner_score - runner_up_score <= alternate_threshold`
  - evaluated on final post-multiplier total score.

## Deterministic Comparator
Comparator tuple (in order):
1. Final total score (desc)
2. Anchor status (desc)
3. Recency (desc)
4. Reinforcement count (desc)
5. Artifact ID (asc)

### Field Provenance (Frozen)
- Recency source of truth: `last_touch_scene_order`.
- Recency fallback order:
  1. `last_touch_scene_order`
  2. `recency_order`
  3. `artifact_scene_order`
  4. Else sentinel `-1` (lowest contested recency priority)
- Reinforcement source of truth: `reinforcement_count`.
- Anchor status source of truth: explicit anchor boolean/enum field.
- No mixing derived/legacy alternatives for comparator inputs.

## Loser Contract
- No explicit loser penalty in Phase 5.
- Losing interpretations remain stored.
- Losers continue through ordinary lifecycle rules (active/fading/suppressed/archived).

## Revival Contract
- Revival is allowed when fading/suppressed memory is successfully selected.
- Anti-thrash rule: one-scene grace after revival.

## Persistence Contract
- Append one lightweight contested outcome event per slot decision.
- Persistence remains fail-soft.

## Prompt Contract
- Winner always surfaced.
- Alternate surfaced only if threshold qualifies.
- Max one alternate per slot.
- No hidden extra alternates.

## Non-Goals
- No canon mutation.
- No UI analytics.
- No cross-chapter contested continuity.
