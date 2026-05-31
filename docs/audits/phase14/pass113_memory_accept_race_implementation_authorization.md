# Pass 113 - Memory Accept Race Implementation Authorization

Date: 2026-05-31  
Branch: `phase-b2-memory-lab`  
Mode: Authorization review only

## 1. Evidence Chain Review

Evidence reviewed in this pass:

- `docs/audits/phase14/pass111_memory_accept_race_ownership_map.md`
- `docs/audits/phase14/pass112_memory_accept_race_repair_plan.md`
- `services/tests/prototype/test_memory_accept_race.py`
- `services/src/blackskies/services/memory_prototype/storage.py`
- `services/src/blackskies/services/io.py`

Findings:

- The failure contract remains the same as Pass 111: Windows `PermissionError (WinError 5)` during concurrent scaffold writes that reach `os.replace(...)`.
- Current code confirms no prototype-local serialization around repeated `ensure_scaffold()` calls under concurrent packet writes.
- The failing lane is still prototype-only (`memory_prototype`) and not baseline runtime-memory ownership.

Conclusion:

- The ownership map and race location are sufficiently evidenced for a narrow implementation authorization.

## 2. Repair Plan Review

Pass 112 plan quality is acceptable and narrow:

- Primary repair seam is correctly placed in `memory_prototype/storage.py`, where scaffold orchestration is owned.
- Global helper edits in `services/io.py` are correctly held as conditional-only because current evidence does not prove a cross-project atomic write contract defect.
- Unauthorized expansion boundaries are explicit and align with the observed defect surface.

Plan consistency check against inspected code:

- `MemoryPrototypeStorage.ensure_scaffold()` and write entrypoints are the closest controllable race seam.
- `atomic_write_json` remains a generic primitive with no evidence in this pass that global behavior should be changed.

## 3. Scope Authorization

AUTHORIZED:

- `services/src/blackskies/services/memory_prototype/storage.py`

CONDITIONAL (do not open without new evidence):

- `services/src/blackskies/services/io.py` only if new implementation-pass evidence proves global atomic write behavior must change to satisfy the prototype race contract.

Authorization constraints:

- Keep implementation prototype-local.
- Keep interface/contract behavior unchanged outside this race lane.
- Prefer the smallest lock/idempotence patch that eliminates concurrent scaffold replacement contention.

## 4. Explicitly Unauthorized Scope

UNAUTHORIZED in this lane:

- schema changes
- provider behavior changes
- broad persistence changes
- Memory Lab promotion
- unrelated tests
- dependencies/lockfiles

Also unauthorized without a new authorization pass:

- broad runtime memory architecture edits outside `memory_prototype/storage.py`
- opening additional backend surfaces not directly required by new evidence from the authorized validation set

## 5. Validation Requirements

Implementation pass must provide reproducible evidence with:

1. `python -m pytest services/tests/prototype/test_memory_accept_race.py -q`
2. `python -m pytest services/tests/prototype/test_memory_idempotency.py -q`
3. Optional narrow expansion only if needed for confidence:
   - `python -m pytest services/tests/prototype/test_memory_accept_race.py services/tests/prototype/test_memory_idempotency.py services/tests/prototype/test_memory_packet_assembly.py -q`
4. Hygiene checks:
   - `git diff --check`
   - `pnpm lint:docs`

Evidence standard:

- Do not mark verified without command outputs showing the race lane and idempotency lane passing after implementation.
- If `io.py` is touched, include explicit new evidence proving `storage.py`-local coordination alone was insufficient.

## 6. Risks

- Under-locking risk: patch may serialize one path but leave another concurrent scaffold write path open.
- Over-scope risk: touching `io.py` without proof would increase blast radius across unrelated persistence users.
- Overclaim risk: passing prototype tests does not prove baseline runtime-memory health.

Risk control:

- Keep first implementation move limited to `storage.py`.
- Preserve `io.py` as conditional-only.
- Treat prototype validation as lane proof only, not global backend proof.

## 7. Final Verdict

`IMPLEMENTATION AUTHORIZED`

Authorization is granted for the narrow `storage.py` implementation lane described above, with `io.py` remaining conditional-only pending new evidence.
