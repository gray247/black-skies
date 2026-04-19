# Canon Court Admission Rules (v1)

## Purpose
Define the minimum bar for introducing future Canon Court contradiction types without widening Canon Court v1 behavior.

Canon Court v1 remains:
- advisory-only
- non-blocking
- log-first
- persistence-separate from canonical lore/state

## Current v1 Scope
- Allowed contradiction types: `locked_fact_contradiction` only.
- Adding any new contradiction type requires an explicit follow-up pass.

## What Qualifies As a Contradiction Worth Logging
A contradiction should be logged only when all are true:
1. A concrete runtime signal already exists (not speculative inference).
2. The signal can be tied to specific evidence snippets/fields.
3. Evidence is attributable to named source origins/subsystems.
4. The contradiction can be expressed as a reviewable claim, not a style preference.

## Minimum Evidence Required
Each candidate ruling must include shared evidence fields:
- `summary`: concise contradiction statement
- `source_hints`: direct machine-readable hints (issue code, field hint, etc.)
- `source_origins`: subsystem/source list that produced the hints
- `note` (optional): context caveat or confidence boundary

If these fields cannot be populated from runtime data, the contradiction type is not admissible yet.

## Too Fuzzy To Log (Not Admissible)
Do not admit contradiction types that depend on:
- tone/style disagreement without concrete canon anchors
- weak semantic guesses without explicit supporting signal
- user-intent speculation not reflected in runtime artifacts
- unverifiable inferences requiring hidden context

These remain advisory discussion topics, not Canon Court contradiction records.

## Advisory-Only Until Stronger Evidence Exists
Even admissible contradiction types remain advisory-only unless a future, separate decision explicitly changes governance.
Canon Court candidate rulings must not:
- mutate canonical lore/state
- mutate memory state
- block generation/critique/runtime flows

## Expansion Checklist For Future Contradiction Types
Before admitting a new contradiction type:
1. Define deterministic detection input signals.
2. Define required evidence mapping into shared evidence fields.
3. Add positive/negative detection tests.
4. Add non-mutation and non-blocking tests.
5. Document why the type is concrete (not speculative).
