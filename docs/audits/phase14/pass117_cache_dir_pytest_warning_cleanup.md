# Pass 117 - cache_dir Pytest Warning Investigate / Trivial Repair / Audit

## 1. Scope

Pass 117 is a bundled low-risk warning cleanup lane for the remaining pytest warning:

- `PytestConfigWarning: Unknown config option: cache_dir`

This pass does:

- inspect pytest config and service-truth invocation sources
- apply a trivial repair if the source is clearly stale/invalid
- validate that warning removal does not regress required backend lanes

This pass does not:

- change runtime behavior
- change tests
- change dependencies or lockfiles
- broaden into general backend cleanup

## 2. Warning Summary

Prior signal (Pass 116):

- `pnpm test:service-truth` passed with warning
- warning text: `PytestConfigWarning: Unknown config option: cache_dir`

Observed cause in current source:

- `scripts/run_service_truth.py` invoked pytest with:
  - `-o cache_dir=<...>`
  - `-p no:cacheprovider`
- With cacheprovider explicitly disabled, `cache_dir` is not a recognized option and triggers the warning.

## 3. Config Source Found

Source ownership:

- warning source is script-level CLI override in `scripts/run_service_truth.py`, not `pytest.ini`, root `pyproject.toml`, or `services/pyproject.toml`.

Inspected files:

- `pytest.ini`
- `pyproject.toml`
- `services/pyproject.toml`
- `package.json`
- `scripts/run_service_truth.py`
- `docs/audits/phase14/pass116_backend_recovery_queue_recheck.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## 4. Repair Decision

Decision: trivial repair applied.

Why repair is safe:

- `cache_dir` override is dead/invalid under `-p no:cacheprovider`.
- Removing it does not enable/disable any new plugin behavior (cacheprovider remains disabled).
- Change is limited to PASS 2 service-truth runner script and does not alter runtime or test logic.

Repair made:

- removed `cache_dir` path creation and `-o cache_dir=...` from `scripts/run_service_truth.py`.

## 5. Files Changed

- `scripts/run_service_truth.py`
- `docs/audits/phase14/pass117_cache_dir_pytest_warning_cleanup.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## 6. Validation Results

Required command results:

1. `rg -n "cache_dir|pytest" pytest.ini pyproject.toml services/pyproject.toml package.json scripts docs`
   - located warning source at `scripts/run_service_truth.py` (`-o cache_dir=...` with `-p no:cacheprovider`)
2. `pnpm test:service-truth`
   - result: `19 passed`
   - warning status: warning removed (no `PytestConfigWarning` emitted)
3. `python -m pytest services/tests -q`
   - result: `611 passed, 10 skipped`
4. `git diff --check`
   - result: pass
5. `pnpm lint:docs`
   - result: pass

## 7. Non-Proof Boundary

This pass proves the warning cleanup for the PASS 2 service-truth lane and preserves current broad backend green status.

This pass does not prove:

- full pytest-plugin governance decisions beyond this lane
- behavior of other optional/legacy test runner wrappers not executed here
- broader backend hardening beyond warning cleanup

## 8. Final Verdict

`WARNING CLEANED UP`
