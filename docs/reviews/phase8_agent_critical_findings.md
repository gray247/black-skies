# Phase 8 Agent Critical Findings

## Findings

- **Undefined `run_dir` in `runs.start_run`.** The run ledger metadata previously referenced `run_dir` before it was defined, causing the ledger creation to fail with a `NameError` while the caller still emitted metadata.  
  *Fixed in:* `services/src/blackskies/services/runs.py` (start_run now computes `_run_dir` and ensures it exists before writing `run.json`).  
  *Validation:* `tests/test_runs.py` now exercises ledger creation and asserts the metadata file lives under `<project>/history/runs/<run_id>/run.json` (already existed but failed before the fix).

No other agent-discovered critical findings remain.
