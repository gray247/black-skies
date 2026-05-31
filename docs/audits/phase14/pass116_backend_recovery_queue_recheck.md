# Pass 116 - Backend Recovery Queue Recheck

## 1. Closed Backend Lanes

Closed lanes confirmed from prior passes:

- `.env.example` service-settings drift closed in Pass 110.
- draft-generation timeout contract lane closed and accepted in Pass 108.
- memory accept race implementation audited and accepted with caveats in Pass 115.

Queue impact:

- the three deterministic failures called out in Pass 102 are no longer active failures in this recheck run.

## 2. Current Backend Validation Results

Required command results:

1. `python -m pytest services/tests -q`
   - result: `611 passed, 10 skipped in 97.16s`
2. `pnpm test:service-truth`
   - result: `19 passed, 1 warning in 11.71s`
   - warning: `PytestConfigWarning: Unknown config option: cache_dir`
3. `git diff --check`
   - result: pass
4. `pnpm lint:docs`
   - result: pass

Current state:

- broad backend validation is green in this pass.
- service-truth lane remains green with one known config warning.

## 3. Remaining Failures / Warnings

Active failures:

- none reproduced in this recheck.

Active warnings:

- PASS 2 service-truth warning persists:
  - `PytestConfigWarning: Unknown config option: cache_dir`

Previously known leftover not reproduced in this pass:

- service process launch flake under explicit services config did not reproduce in the required broad run (`python -m pytest services/tests -q`).
- classification is now monitor/watch rather than active failing queue item, pending any fresh reproduction.

## 4. Updated Recovery Queue

1. PASS 2 `cache_dir` warning
   - Classification: `LOW PRIORITY`
   - Status: open hygiene follow-up
   - Why: warning-only on a passing truth lane; does not currently indicate backend functional breakage.

2. Service-process launch flake (historical)
   - Classification: `MONITOR ONLY`
   - Status: no current repro in this pass
   - Why: known historical instability from prior explicit-config run, but no active failure signal in the current required runs.

3. Broad backend failure recovery lane
   - Classification: `CLOSED FOR NOW`
   - Status: no current failing tests in required broad backend command
   - Why: `611 passed, 10 skipped` in this recheck.

## 5. Recommended Next Lane

Recommended next lane:

- targeted warning hygiene pass for service-truth `cache_dir` configuration compatibility.

Reason:

- it is the only remaining concrete backend validation signal in this recheck.
- broad backend functionality is currently green, so warning cleanup offers the best trust gain per effort.

## 6. Stop Conditions

Stop-condition check:

- preflight tree was clean
- required commands completed
- no scope violation occurred (triage-only execution)

No stop condition was triggered.

## 7. Final Verdict

`BACKEND GREEN EXCEPT WARNINGS`
