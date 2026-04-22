# Memory Lab: Diagnostics Contract

## Ownership Boundary
- Resolver diagnostics:
  - selection facts only
  - winner/runner-up relationships
  - score and tie-break basis
  - fallback lane usage
- Orchestrator diagnostics:
  - mutation/persistence/load/resolve outcomes
  - decay/revival effects and skip reasons
  - advisory availability/unavailability reason codes

## Required Phase 5 Selection Diagnostics
Per slot decision:
- slot/type identifier
- winner artifact id
- runner-up artifact id (if present)
- score delta
- fallback used (bool)
- tie-break tuple/rationale (if tie-break path used)

## Required Availability/Failure Diagnostics
- `invalid_contested_group_metadata`
- advisory unavailable due to load failure
- advisory unavailable due to resolver failure
- persistence failure (fail-soft)
- event file corruption/unreadable (if detected)

## Deterministic vs Informational Fields
Deterministic diagnostic fields (used in replay checks):
- winner artifact id
- runner-up artifact id
- score delta
- fallback used
- tie-break tuple/rationale
- advisory available/unavailable reason code

Informational-only fields (not in determinism contract):
- timestamps
- free-form strings
- environment notes

