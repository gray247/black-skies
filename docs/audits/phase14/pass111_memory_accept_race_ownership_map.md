# Pass 111 - Memory Accept Race Ownership Map

## 1. Scope

Pass 111 is ownership mapping only for:

- `services/tests/prototype/test_memory_accept_race.py::test_memory_accept_race_resolution`

This pass does not perform repair.

## 2. Evidence Base

Documents and prior passes inspected:

- `docs/audits/phase14/pass102_backend_validation_failure_classification.md`
- `docs/audits/phase14/pass109_backend_recovery_queue_reassessment.md`
- `docs/audits/phase14/pass110_env_example_service_settings_drift_repair.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/current_state.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

Code/test surfaces inspected:

- `services/tests/prototype/test_memory_accept_race.py`
- `services/src/blackskies/services/memory_prototype/storage.py`
- `services/src/blackskies/services/memory_prototype/canonical_state_reader.py`
- `services/src/blackskies/services/memory_prototype/schemas.py`
- `services/src/blackskies/services/memory_prototype/provider.py`
- `services/src/blackskies/services/io.py`

Search and reproduction evidence:

- `rg -n "memory_accept|accept_race|os.replace|replace\\(|atomic|prototype memory|Memory Lab|memory" services docs`
- `rg -n "atomic_write_json|os\\.replace|write_packet_artifact|ensure_scaffold|ThreadPoolExecutor|lock|mutex|filelock|portalocker" services/src/blackskies/services`
- `python -m pytest services/tests/prototype/test_memory_accept_race.py -q` (reproduced failure)

## 3. Failure Summary

Required question answers:

1. What exact behavior does the failing test expect?
   - It concurrently writes the same `rewrite` packet artifact 8 times and expects deterministic idempotent collapse:
     - all returned paths are identical (`len(set(paths)) == 1`)
     - only one packet file exists under `.blackskies/memory/packets/rewrite`
   - It also expects failed/conflicting lineage replay to raise `CanonicalInputEligibilityError` and not create extra artifacts.

2. What exact Windows failure occurs?
   - `PermissionError: [WinError 5] Access is denied` during `os.replace(...)` in `services/src/blackskies/services/io.py:20`
   - Failure is triggered while concurrent writers execute `MemoryPrototypeStorage.ensure_scaffold()` and attempt to write `.blackskies/memory/schema_version.json`.

## 4. Product/Prototype Status

Required question answers:

6. Is this product runtime behavior or prototype-only behavior?
   - Prototype-only behavior.
   - The failing path is under `services/src/blackskies/services/memory_prototype/`, and `docs/specs/memory_runtime.md` classifies `memory_prototype/` as prototype/historical, not current production runtime owner.

7. Is Memory Lab active baseline, deferred, or experimental?
   - Memory Lab base advisory system exists but is off by default (`implemented but off by default` in `docs/specs/current_state.md`).
   - Memory Lab reinforcement/interpretations/decay/experimental framework are explicitly experimental.
   - `memory_prototype/` remains prototype-only.

## 5. Ownership Map

Required question answers:

3. Which file owns memory accept behavior?
   - For this failing test’s “accepted lineage replay” contract, ownership is split:
     - lineage eligibility and accepted-snapshot read constraints: `services/src/blackskies/services/memory_prototype/canonical_state_reader.py`
     - lineage identity semantics (`live_accept`/`replay`/`eval`): `services/src/blackskies/services/memory_prototype/schemas.py`
   - The test’s concurrent write seam itself is owned by `MemoryPrototypeStorage.write_packet_artifact` in `services/src/blackskies/services/memory_prototype/storage.py`.

4. Which file owns persistence/write/replace behavior?
   - Prototype persistence orchestration: `services/src/blackskies/services/memory_prototype/storage.py`
   - Low-level atomic file replace primitive: `services/src/blackskies/services/io.py::atomic_write_json` (`os.replace`)

## 6. Persistence Boundary

- `MemoryPrototypeStorage` enforces allowed write roots (`.blackskies/memory`, `history/memory_prototype`) and writes advisory artifacts/status/diagnostics.
- `ensure_scaffold()` performs directory setup plus repeated writes to:
  - `.blackskies/memory/schema_version.json`
  - `history/memory_prototype/status.json`
- All writes use `atomic_write_json`, which is process/thread agnostic and does not include file-level lock coordination.

## 7. Concurrency Boundary

Required question answer:

5. Which file owns concurrency or locking behavior, if any?
   - Test-level concurrency driver: `services/tests/prototype/test_memory_accept_race.py` via `ThreadPoolExecutor(max_workers=4)`.
   - Prototype storage path (`memory_prototype/storage.py`) has no explicit lock/mutex around `ensure_scaffold()` or `write_packet_artifact()`.
   - `atomic_write_json` in `services/src/blackskies/services/io.py` has no cross-thread/cross-process locking; it only does temp-file write + `os.replace`.
   - Therefore, there is no explicit concurrency owner/guard in this prototype write path today.

## 8. Windows-Specific Risk

Required question answer:

8. Is the failure a real product risk, Windows environment risk, or prototype harness risk?
   - Primary classification: prototype harness risk with Windows-specific filesystem contention behavior.
   - Secondary classification: Windows environment risk for this prototype lane because concurrent replacement of the same scaffold file intermittently/consistently hits `WinError 5`.
   - Current evidence does not elevate this to baseline product runtime risk because the path is prototype-only.

## 9. Contract Drift / Ambiguity

- No major product-runtime contract drift identified in this pass.
- There is a prototype-lane contract mismatch:
  - test expects deterministic concurrent idempotent write behavior
  - implementation lacks explicit write locking around shared scaffold writes
- This is less product contract ambiguity and more prototype persistence-concurrency gap.

## 10. Repair-Readiness Assessment

- `OWNERSHIP MAP COMPLETE` for the current failing lane:
  - behavior owner, persistence owner, and missing concurrency guard boundary are identified
  - prototype-vs-runtime status is explicit

Repair planning can proceed without further contract clarification for this lane.

## 11. Smallest Safe Next Step

Required question answer:

9. What is the smallest safe next step?
   - Prepare a narrow repair plan limited to prototype storage write coordination in:
     - `services/src/blackskies/services/memory_prototype/storage.py`
     - and only if required by plan evidence, `services/src/blackskies/services/io.py`
   - Goal: serialize or make idempotent scaffold writes under concurrency without broad memory/runtime changes.
   - Keep scope explicitly prototype-only; do not mix with Memory Lab runtime or broader backend cleanup.

## 12. Final Verdict

`OWNERSHIP MAP COMPLETE — READY FOR REPAIR PLAN`
