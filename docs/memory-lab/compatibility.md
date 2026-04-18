# Memory Lab: Compatibility Contract

## Compatibility Policy
Phase 5+ compatibility uses:
- legacy read support
- new write only

This rule is mandatory.

## Versioning Expectations
- Schema versioning must be explicit for artifacts and events.
- Semantic contract changes require version bump (see `spec-change-policy.md`).

## Corruption Safety
- Corrupt/unreadable event files must not be overwritten or truncated by normal append/load flows.
- Corrupt history does not become a rewrite trigger.

## Rollback Behavior
Rollback must preserve:
- canonical advisory storage safety
- ability to read legacy records
- no canon mutation

Rollback cannot require rewriting history into legacy format.

## Migration Notes
Any semantic or schema change post-5A must include:
- migration impact statement
- affected readers/writers
- fallback behavior in mixed-version state

