# Memory Lab: Spec Change Policy

## Scope
Applies to semantic contracts frozen in Phase 5A and later.

## Frozen Semantic Contracts
- contested key schema and normalization
- comparator tuple and field provenance
- alternate threshold math and evaluation stage
- prompt winner/alternate contract
- loser and revival anti-thrash contracts
- contested event minimum schema

## Change Rule
After Phase 5A:
- any semantic change requires:
  1. version bump
  2. migration note
  3. test update

Silent semantic changes are forbidden.

## Required Change Record
Every semantic change must document:
- previous behavior
- new behavior
- impact scope
- migration/compatibility implications
- updated acceptance criteria

## Approval Authority
Only the designated spec owner can approve semantic contract changes after Phase 5A freeze.

## Waivers
No waiver for silent semantic changes.
Gate waivers follow `phase-gates.md` rules and still require spec owner approval.

