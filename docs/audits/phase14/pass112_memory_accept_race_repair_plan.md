# Pass 112 - Memory Accept Race Repair Plan

## 1. Scope

Pass 112 is narrow repair planning for the prototype memory accept race.

This pass does:

- define the smallest safe repair lane for the Windows `PermissionError` race
- constrain the implementation candidate
- define validation that proves the fix without overclaiming

This pass does not:

- modify source
- modify tests
- modify fixtures
- repair behavior

## 2. Failure Contract

Confirmed behavior from Pass 111:

- the failing test expects concurrent same-lineage packet writes to collapse to one deterministic artifact path/file
- the test also expects failed/conflicting replay lineage handling to remain intact
- the observed failure is Windows `PermissionError: [WinError 5] Access is denied`
- the failure happens during concurrent `os.replace(...)` while `ensure_scaffold()` writes `schema_version.json`

Required decisions:

1. Should the repair be in `memory_prototype/storage.py` only?
   - Yes.
2. Should `services/io.py` remain untouched?
   - Yes, unless new evidence proves the low-level primitive itself must change.
3. Should the fix serialize `ensure_scaffold()` calls?
   - Yes.
4. Should the fix make scaffold writes idempotent?
   - Yes.
5. Should the fix add a prototype-local lock rather than changing global `atomic_write_json`?
   - Yes.

## 3. Candidate Repair Location

Primary authorized candidate:

- `services/src/blackskies/services/memory_prototype/storage.py`

Why this file:

- it owns prototype scaffold creation
- it owns packet/delta/drift/status writes in the prototype lane
- it is the seam where concurrent writers race before the `os.replace(...)` primitive is reached

Conditional-only candidate:

- `services/src/blackskies/services/io.py`

Why conditional only:

- current evidence points to a missing prototype-local synchronization boundary, not a broken cross-project atomic write primitive
- changing the global helper would widen scope into unrelated persistence users

## 4. Rejected Repair Locations

Rejected for this pass:

- production memory architecture redesign
- Memory Lab promotion
- schema changes
- provider behavior changes
- broad persistence changes
- unrelated tests
- dependencies/lockfiles

Also rejected as first-edit targets:

- `services/src/blackskies/services/io.py`
- `services/src/blackskies/services/memory_lab/`
- `services/src/blackskies/services/scene_memory.py`
- any runtime memory architecture surface outside prototype storage

## 5. Smallest Repair Strategy

Planned minimal implementation move:

1. Add a prototype-local lock in `services/src/blackskies/services/memory_prototype/storage.py`.
2. Serialize `ensure_scaffold()` so only one writer initializes or refreshes the scaffold at a time.
3. Keep scaffold creation idempotent so repeated calls do not change the resulting layout or artifact identity.
4. Reuse the existing atomic write primitive instead of rewriting `atomic_write_json` globally.
5. Touch `services/io.py` only if later evidence shows the primitive itself needs a prototype-safe adjustment.

Expected effect:

- concurrent same-lineage callers no longer race while creating `.blackskies/memory/schema_version.json`
- packet artifact writes retain the existing idempotent contract
- prototype write coordination stays local to prototype storage

## 6. Validation Plan

Exact tests that should prove the repair:

1. `python -m pytest services/tests/prototype/test_memory_accept_race.py -q`
2. `python -m pytest services/tests/prototype/test_memory_idempotency.py -q`
3. If the repair changes shared scaffold/write coordination enough to warrant a wider prototype check, run the narrow prototype memory cluster:
   - `python -m pytest services/tests/prototype/test_memory_accept_race.py services/tests/prototype/test_memory_idempotency.py services/tests/prototype/test_memory_packet_assembly.py -q`

What this validation proves:

- the concurrent accept race no longer throws Windows `PermissionError`
- repeated same-lineage writes remain idempotent
- packet artifact collapse semantics still hold

What this validation does not prove:

- full backend suite health
- production memory architecture behavior
- Windows filesystem behavior outside the prototype lane
- absence of unrelated regressions in other prototype tests not exercised by the chosen cluster

## 7. Non-Proof Boundary

This repair plan does not prove:

- Memory Lab promotion
- schema redesign
- global atomic write behavior changes
- any provider or route behavior
- any broad persistence or runtime memory redesign

The scope stays explicitly prototype-only.

## 8. Risks

- A lock added too narrowly could serialize only one entrypoint while leaving another concurrent write path exposed.
- A lock added too broadly could become an accidental cross-instance bottleneck if implemented at the wrong scope.
- Changing `io.py` globally would widen blast radius beyond the prototype lane.

Risk control:

- keep the first repair move in `storage.py`
- keep `io.py` untouched unless conditional evidence appears
- validate with the race test and the existing prototype idempotency test together

## 9. Final Verdict

`READY FOR IMPLEMENTATION AUTHORIZATION`

Pass 112 conclusion:

- prototype-local storage coordination is the correct first repair seam
- global atomic write helper changes are not authorized by current evidence
- the next implementation pass can stay narrow and prototype-only
