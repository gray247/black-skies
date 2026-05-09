# FastAPI/Starlette Compatibility Plan - 2026-04-29

## Scope
- planning-only lane for resolving the deferred Starlette advisory blocked by current FastAPI constraints
- no package upgrades, lockfile edits, or runtime/test code changes in this pass

## Current Version Facts
- Repo Python dependency specs:
  - `pyproject.toml` and `services/pyproject.toml` pin:
    - `fastapi>=0.118.3,<0.119`
    - `starlette>=0.48.0,<0.49`
- Lock/constraint pins:
  - `constraints.txt`: `fastapi==0.118.3`, `starlette==0.48.0`
  - `requirements.lock`: `fastapi==0.118.3`, `starlette==0.48.0`
  - `requirements.dev.lock`: `fastapi==0.118.3`, `starlette==0.48.0`
- Upstream dependency metadata (PyPI JSON):
  - `fastapi==0.118.3` requires `starlette<0.49.0,>=0.40.0`
  - `fastapi==0.119.0` requires `starlette<0.49.0,>=0.40.0`
  - `fastapi==0.119.1` requires `starlette<0.49.0,>=0.40.0`
  - `fastapi==0.120.0` requires `starlette<0.49.0,>=0.40.0`
  - `fastapi==0.121.0` requires `starlette<0.50.0,>=0.40.0`

## Confirmed Constraint Conflict
- Deferred advisory target requires `starlette>=0.49.1`.
- Current FastAPI lane (`0.118.x` through `0.120.x`) blocks that target because of `starlette<0.49.0`.
- First known FastAPI line that can admit `0.49.1` is `0.121.x` (`starlette<0.50.0,>=0.40.0`).

## Candidate Upgrade Path
- Primary candidate (smallest jump):
  - FastAPI `0.118.3 -> 0.121.x`
  - Starlette `0.48.0 -> 0.49.1` (or latest `0.49.x` patch)
- Secondary candidate (if 0.121.x has unresolved incompatibilities):
  - FastAPI `0.122.x` with Starlette `0.49.1+` (still under FastAPI Starlette upper bound)
- Avoid in first pass:
  - jumping directly to very recent FastAPI majors/minors without first proving the minimal compatibility lane

## Service Risk Areas To Watch
- Routes and request parsing:
  - broad APIRouter surface under `services/src/blackskies/services/routers/`
  - heavy request/response validation exercised in `services/tests/test_app.py`
- Middleware / ASGI behavior:
  - custom request tracing/header middleware in `services/src/blackskies/services/app.py`
  - direct Starlette types usage (`ASGIApp`, `Scope`, `Receive`, `Send`, `Message`, `MutableHeaders`)
- TestClient behavior:
  - many tests depend on `fastapi.testclient.TestClient` lifecycle semantics
  - potential upstream httpx/starlette TestClient behavior drift
- Exception handling and response shaping:
  - custom HTTP/validation exception handlers in `services/src/blackskies/services/app.py`
  - JSON envelope/trace header behavior in `services/src/blackskies/services/http.py`
- Response models/contracts:
  - typed response models across routers (`outline`, `draft`, `export`, `analytics`, `recovery`, etc.)

## Implementation Batches

### Batch A - Dependency Bump Only
- change scope:
  - update FastAPI/Starlette pins to target compatible versions only
  - regenerate/update Python lock artifacts accordingly
- non-goals:
  - no intentional behavior changes
  - no unrelated dependency churn
- expected risk:
  - medium (framework/runtime core)

### Batch B - Compatibility Fixes If Validation Fails
- trigger:
  - only if Batch A breaks tests/contracts
- allowed fixes:
  - narrow compatibility patches in service layer (middleware/handlers/TestClient assumptions)
  - no broad refactor
- expected risk:
  - medium to high depending on failure surface

### Batch C - Security Validation and Audit Proof
- objective:
  - confirm advisory closure and preserve existing green lanes
- outputs:
  - refreshed `pip-audit` evidence
  - tracker/doc updates with exact before/after vulnerability state

## Validation Plan
- Security/advisory:
  - `.\.venv\Scripts\python.exe -m pip_audit`
- Backend contract:
  - `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
  - targeted route smoke (`health`, draft generation/preflight, outline, recovery) via existing backend tests
- Static typing:
  - `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- App/e2e safety rails:
  - `pnpm test:e2e -- --workers=1`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`

## Rollback Plan
- keep the dependency bump as an isolated commit
- if regression appears:
  - revert dependency commit
  - rerun the same validation set to confirm baseline restoration

## Recommended First Implementation Batch
- Start with `Batch A` only (minimal FastAPI/Starlette bump to first compatible lane).
- Reason:
  - removes the hard constraint block with the smallest semantic jump and gives a clear signal on whether follow-up compatibility fixes are actually needed.

## Batch A Execution Evidence (2026-04-30)

### Applied Versions
- `fastapi`: `0.118.3 -> 0.121.3`
- `starlette`: `0.48.0 -> 0.49.3`

### Files Updated
- `constraints.txt`
- `pyproject.toml`
- `services/pyproject.toml`
- `requirements.lock`
- `requirements.dev.lock`
- `requirements.win.dev.txt`

### Advisory Delta
- before:
  - `pip-audit`: 3 vulnerabilities in 2 packages (`pip`, `starlette`)
- after:
  - `pip-audit`: 2 vulnerabilities in 1 package (`pip` only)
- result:
  - blocked Starlette advisory is resolved in Batch A

### Validation Results
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q` -> `64 passed`
- `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth` -> `Success: no issues found in 346 source files`
- `pnpm test:e2e -- --workers=1` -> `3 passed`
- port preflight for `9999` -> `PORT_FREE`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line` -> `11 passed`

### Compatibility Outcome
- no FastAPI/Starlette compatibility failures surfaced in the required validation lanes
- Batch B compatibility-fix lane is not required at this time

## Emergency CI Resolver Follow-up (2026-04-30)

### CI-Red Root Cause
- install failure was caused by stale package metadata for `black-skies 1.0.0rc1` still declaring:
  - `fastapi>=0.118.3,<0.119`
  - `starlette>=0.48.0,<0.49`
- stale declarations were present in:
  - `services/src/black_skies.egg-info/PKG-INFO`
  - `services/src/black_skies.egg-info/requires.txt`
- additional contributing factor:
  - prior lock snapshots had included an editable VCS line for the repo package; this can pull metadata from older commits and recreate the same conflict.

### Emergency Metadata Fix Applied
- updated egg-info dependency metadata to match Batch A lane:
  - `fastapi>=0.121.3,<0.122`
  - `starlette>=0.49.1,<0.50`
- removed stale editable VCS package line from:
  - `requirements.lock`
  - `requirements.dev.lock`
  - `requirements.win.dev.txt`

### Validation After Emergency Fix
- CI-shape install commands:
  - `.\.venv\Scripts\python.exe -m pip install -c constraints.txt -r requirements.lock` -> pass
  - `.\.venv\Scripts\python.exe -m pip install -e services -c constraints.txt` -> pass
- `pip check`:
  - FastAPI/Starlette package-conflict errors cleared
  - remaining non-blocking environment warnings unchanged (`httptools`/`mypy` platform markers)
- functional lanes remained green:
  - backend tests: `64 passed`
  - mypy: clean (`346` source files)
  - smoke e2e: `3 passed`
  - startup authority contract: `11 passed`

### Classification
- downstream canary/playwright failures observed in prior red runs are classified as cascading failures when occurring after resolver/install aborts.
