# Phase 4.8A Mypy Reduction Plan

## Purpose
Create a safe, staged plan to reduce the current mypy debt without changing runtime behavior or widening CI gates.

## Current Baseline
- Command used: `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- Current mypy count: `175 errors in 49 files (checked 346 source files)`
- Baseline confirmed on 2026-04-29 before any reduction pass.

## Error Family Summary
Summary taken from the current baseline and the existing type debt inventory.

- Test payload shape/indexing debt
  - `Value of type "object" is not indexable`
  - `Unsupported operand types for / ("Path" and "object")`
  - `List comprehension has incompatible type List[object]`
- Argument contract debt
  - `arg-type` mismatches around dict shape, optional providers, and project-root arguments
- Attribute/name debt
  - `attr-defined`, `name-defined`, and missing pydantic symbol resolution in tests
- Return/misc debt
  - `return-value`, `misc`, `assignment`, `operator`, `valid-type`
- Runtime-sensitive service debt
  - router `Path | None` hazards
  - analytics/model-router/memory-lab typing drift

## Safest First Batch
Target the test-only errors first. These are mechanically safer because they do not change service/runtime behavior.

### Exact Files for First Batch
- `tests/test_tool_search.py`
- `services/tests/test_heuristics_pipeline.py`
- `services/tests/test_draft_read_endpoint.py`
- `services/tests/test_snapshot_endpoints.py`
- `services/tests/test_export_endpoints.py`
- `services/tests/test_export_consistency.py`
- `services/tests/test_async_concurrency.py`
- `services/tests/test_app.py`
- `services/tests/test_gui_bridge_contracts.py`
- `services/tests/unit/test_budget_loader.py`
- `services/tests/unit/test_snapshot_persistence_refactor.py`
- `services/tests/unit/test_diagnostics.py`
- `services/tests/unit/test_analytics.py`
- `services/tests/unit/test_agent_base.py`
- `services/tests/unit/test_backup_verifier.py`
- `services/tests/unit/test_scheduler_runner.py`
- `services/tests/unit/test_logging_redaction.py`
- `services/tests/unit/test_critique_adapter_validation.py`
- `services/tests/unit/test_project_export_service.py`
- `services/tests/prototype/test_memory_packet_precedence.py`
- `services/tests/prototype/test_memory_packet_assembly.py`
- `services/tests/prototype/test_memory_non_mutation.py`
- `services/tests/prototype/test_memory_delta_extraction.py`
- `services/tests/test_e2e_synthetic_switch.py`

### Why This Batch First
- test-only typing cleanup has the lowest regression risk
- these files already encode the expected API shape and can be tightened without changing production logic
- the batch should reduce the highest-volume noise before touching service code

## Second Batch
Utility/tooling scripts after the test-only batch.

### Exact Files
- `scripts/dependency_report.py`
- `scripts/security_sweep.py`

### Why Second
- these scripts affect developer tooling and reporting, not core runtime behavior
- they are still lower risk than service routers and memory/model internals

## Runtime-Sensitive Batch Deferred
Leave these for later because they can change request handling, path validation, or service semantics:

- `services/src/blackskies/services/routers/draft/generation.py`
- `services/src/blackskies/services/routers/draft/revision.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/src/blackskies/services/routers/draft/wizard.py`
- `services/src/blackskies/services/routers/draft/export.py`
- `services/src/blackskies/services/routers/long_form.py`
- `services/src/blackskies/services/routers/phase4.py`
- `services/src/blackskies/services/model_router.py`
- `services/src/blackskies/services/analytics_stub.py`
- `services/src/blackskies/services/memory_lab/*`
- `services/src/blackskies/services/memory_prototype/*`
- `services/src/blackskies/services/operations/long_form_execution.py`
- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/scheduler.py`

## Validation Commands
- `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- `.\.venv\Scripts\python.exe -m pytest tests/test_tool_search.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_gui_bridge_contracts.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/unit/test_budget_loader.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/unit/test_snapshot_persistence_refactor.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/unit/test_diagnostics.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/unit/test_analytics.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/unit/test_scheduler_runner.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_export_endpoints.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_snapshot_endpoints.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_draft_read_endpoint.py -q`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_heuristics_pipeline.py -q`

## Rollback Plan
- revert only the files changed in the current batch
- keep the mypy config and CI gate unchanged
- rerun the baseline mypy command before starting the next batch so any regression is localized to the last edit set

## Recommended First Implementation Pass
- start with `services/tests/test_app.py`, `tests/test_tool_search.py`, and `services/tests/test_gui_bridge_contracts.py`
- rationale: they are test-only, high-volume, and likely to collapse several `index` / `attr-defined` / `name-defined` errors with minimal runtime risk
- expand only after those files are rechecked with the baseline mypy command and the result remains localized to test-only debt

## Phase 4.8B Implementation Notes
- files changed:
  - `tests/test_tool_search.py`
  - `services/tests/test_heuristics_pipeline.py`
  - `services/tests/test_draft_read_endpoint.py`
  - `services/tests/test_snapshot_endpoints.py`
  - `services/tests/test_export_endpoints.py`
- mypy result after the first test-only batch: `158 errors in 44 files (checked 346 source files)`
- test-only files improved:
  - `tests/test_tool_search.py`
  - `services/tests/test_heuristics_pipeline.py`
  - `services/tests/test_draft_read_endpoint.py`
  - `services/tests/test_snapshot_endpoints.py`
  - `services/tests/test_export_endpoints.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
  - smoke lane: `3 passed`
- remaining high-volume test targets:
  - `services/tests/test_app.py`
  - `services/tests/test_gui_bridge_contracts.py`
  - `services/tests/unit/test_budget_loader.py`
  - `services/tests/unit/test_snapshot_persistence_refactor.py`
  - `services/tests/unit/test_diagnostics.py`
  - `services/tests/unit/test_analytics.py`
  - `services/tests/unit/test_critique_adapter_validation.py`
  - `services/tests/unit/test_logging_redaction.py`
- `services/tests/unit/test_project_export_service.py`
- `services/tests/test_export_consistency.py`
- `services/tests/test_async_concurrency.py`
- `services/tests/test_e2e_synthetic_switch.py`

## Phase 4.8C Implementation Notes
- files changed:
  - `services/tests/test_async_concurrency.py`
  - `services/tests/test_e2e_synthetic_switch.py`
  - `services/tests/unit/test_snapshot_persistence_refactor.py`
  - `services/tests/unit/test_scheduler_runner.py`
  - `services/tests/unit/test_logging_redaction.py`
- mypy result after the second test-only batch: `123 errors in 36 files (checked 346 source files)`
- test-only files improved:
  - `services/tests/test_async_concurrency.py`
  - `services/tests/test_e2e_synthetic_switch.py`
  - `services/tests/unit/test_snapshot_persistence_refactor.py`
  - `services/tests/unit/test_scheduler_runner.py`
  - `services/tests/unit/test_logging_redaction.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
  - smoke lane: `3 passed`
- infra notes:
  - contract lane was run only after confirming port `9999` was free
  - smoke lane emitted the existing `NO_COLOR` / `FORCE_COLOR` warning and the known dock-layout warning
  - smoke lane also logged an existing renderer unhandled `TypeError` noise while still passing
- remaining high-volume test targets:
  - `services/tests/test_app.py`
  - `services/tests/unit/test_analytics.py`
  - `services/tests/unit/test_agent_base.py`
  - `services/tests/unit/test_diagnostics.py`
  - `services/tests/unit/test_critique_adapter_validation.py`
  - `services/tests/unit/test_backup_verifier.py`
  - `services/tests/test_export_consistency.py`
  - `services/tests/test_project_export_service.py`
  - `services/tests/unit/test_project_export_service.py`
  - `services/tests/test_async_concurrency.py`
  - `services/tests/test_e2e_synthetic_switch.py`

## Phase 4.8E Implementation Notes
- files changed:
  - `services/tests/test_app.py`
  - `services/tests/unit/test_analytics.py`
  - `services/tests/unit/test_agent_base.py`
  - `services/tests/unit/test_diagnostics.py`
  - `services/tests/unit/test_critique_adapter_validation.py`
  - `services/tests/unit/test_backup_verifier.py`
  - `services/tests/unit/test_project_export_service.py`
  - `tests/test_eval_harness.py`
- mypy result after the large test-only batch: `75 errors in 28 files (checked 346 source files)`
- test-only files improved:
  - `services/tests/test_app.py`
  - `services/tests/unit/test_analytics.py`
  - `services/tests/unit/test_agent_base.py`
  - `services/tests/unit/test_diagnostics.py`
  - `services/tests/unit/test_critique_adapter_validation.py`
  - `services/tests/unit/test_backup_verifier.py`
  - `services/tests/unit/test_project_export_service.py`
  - `tests/test_eval_harness.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
  - smoke lane: `3 passed`
- infra notes:
  - port `9999` was confirmed free before launching the contract lane
  - smoke lane still shows the known `NO_COLOR` / `FORCE_COLOR` warning, dock-layout warning, and renderer `TypeError` noise without failing the suite
- remaining test-only targets:
  - `services/tests/prototype/test_memory_packet_precedence.py`
  - `services/tests/prototype/test_memory_packet_assembly.py`
  - `services/tests/prototype/test_memory_non_mutation.py`
  - `services/tests/prototype/test_memory_delta_extraction.py`

## Phase 4.8F Implementation Notes
- files changed:
  - `services/tests/prototype/test_memory_packet_precedence.py`
  - `services/tests/prototype/test_memory_packet_assembly.py`
  - `services/tests/prototype/test_memory_non_mutation.py`
  - `services/tests/prototype/test_memory_delta_extraction.py`
- mypy result after the final test-only batch: `71 errors in 24 files (checked 346 source files)`
- test-only files improved:
  - `services/tests/prototype/test_memory_packet_precedence.py`
  - `services/tests/prototype/test_memory_packet_assembly.py`
  - `services/tests/prototype/test_memory_non_mutation.py`
  - `services/tests/prototype/test_memory_delta_extraction.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - smoke lane: `3 passed`
- infra notes:
  - contract lane was not needed because the backend port was not being exercised for this cleanup pass
  - smoke lane still shows the known `NO_COLOR` / `FORCE_COLOR` warning, dock-layout warning, and renderer `TypeError` noise while still passing
- remaining errors are runtime/tooling/service areas only:
  - `services/src/blackskies/services/memory_lab/locking.py`
  - `scripts/dependency_report.py`
  - `services/src/blackskies/services/settings.py`
  - `services/src/blackskies/services/routers/phase4.py`
  - `services/src/blackskies/services/memory_prototype/task_packet_assembler.py`
  - `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py`
  - `services/src/blackskies/services/memory_lab/wave1.py`
  - `services/src/blackskies/services/memory_lab/storage.py`
  - `services/src/blackskies/services/memory_lab/resolver.py`
  - `services/src/blackskies/services/memory_lab/extractor.py`
  - `scripts/security_sweep.py`
  - `services/src/blackskies/services/model_router.py`
  - `services/src/blackskies/services/export_service.py`
  - `services/src/blackskies/services/backup_service.py`
  - `services/src/blackskies/services/routers/restore.py`
  - `services/src/blackskies/services/routers/draft/wizard.py`
  - `services/src/blackskies/services/routers/draft/export.py`
  - `services/src/blackskies/services/scheduler.py`
  - `services/src/blackskies/services/analytics_stub.py`
  - `services/src/blackskies/services/routers/draft/revision.py`
  - `services/src/blackskies/services/routers/draft/acceptance.py`
  - `services/src/blackskies/services/operations/long_form_execution.py`
  - `services/src/blackskies/services/routers/long_form.py`
  - `services/src/blackskies/services/routers/draft/generation.py`

## Phase 4.8G Implementation Notes
- files changed:
  - `scripts/dependency_report.py`
  - `scripts/security_sweep.py`
  - `services/src/blackskies/services/analytics_stub.py`
  - `services/src/blackskies/services/settings.py`
  - `services/src/blackskies/services/scheduler.py`
- mypy result after the low-risk tooling/runtime batch: `59 errors in 19 files (checked 346 source files)`
- files improved:
  - `scripts/dependency_report.py`
  - `scripts/security_sweep.py`
  - `services/src/blackskies/services/analytics_stub.py`
  - `services/src/blackskies/services/settings.py`
  - `services/src/blackskies/services/scheduler.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - targeted contract lane: `11 passed`
- skipped risky fixes:
  - `services/src/blackskies/services/memory_lab/locking.py`
  - `services/src/blackskies/services/memory_prototype/task_packet_assembler.py`
  - `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py`
  - `services/src/blackskies/services/memory_lab/wave1.py`
  - `services/src/blackskies/services/memory_lab/storage.py`
  - `services/src/blackskies/services/memory_lab/resolver.py`
  - `services/src/blackskies/services/memory_lab/extractor.py`
  - `services/src/blackskies/services/model_router.py`
  - `services/src/blackskies/services/export_service.py`
  - `services/src/blackskies/services/backup_service.py`
- remaining runtime/router errors grouped:
  - memory/runtime internals
  - service/router logic
  - export/backup payload typing
  - draft/long-form router path handling

## Phase 4.8H Implementation Notes
- files changed:
  - `services/src/blackskies/services/backup_service.py`
  - `services/src/blackskies/services/export_service.py`
  - `services/src/blackskies/services/model_router.py`
  - `services/src/blackskies/services/operations/long_form_execution.py`
- mypy result after the service-utility batch: `47 errors in 15 files (checked 346 source files)`
- files improved:
  - `services/src/blackskies/services/backup_service.py`
  - `services/src/blackskies/services/export_service.py`
  - `services/src/blackskies/services/model_router.py`
  - `services/src/blackskies/services/operations/long_form_execution.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - targeted contract lane: `11 passed`
- skipped risky fixes:
  - `services/src/blackskies/services/memory_lab/locking.py`
  - `services/src/blackskies/services/memory_prototype/task_packet_assembler.py`
  - `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py`
  - `services/src/blackskies/services/memory_lab/wave1.py`
  - `services/src/blackskies/services/memory_lab/storage.py`
  - `services/src/blackskies/services/memory_lab/resolver.py`
  - `services/src/blackskies/services/memory_lab/extractor.py`
  - `services/src/blackskies/services/routers/phase4.py`
  - `services/src/blackskies/services/routers/restore.py`
  - `services/src/blackskies/services/routers/draft/wizard.py`
  - `services/src/blackskies/services/routers/draft/export.py`
  - `services/src/blackskies/services/routers/draft/revision.py`
  - `services/src/blackskies/services/routers/draft/acceptance.py`
  - `services/src/blackskies/services/routers/draft/generation.py`
  - `services/src/blackskies/services/routers/long_form.py`
- remaining runtime/router errors grouped:
  - memory/runtime internals
  - service/router logic
  - memory-lab artifact typing
  - draft/restore/long-form router path handling

## Phase 4.8I Implementation Notes
- files changed:
  - `services/src/blackskies/services/memory_lab/locking.py`
  - `services/src/blackskies/services/memory_lab/wave1.py`
  - `services/src/blackskies/services/memory_lab/storage.py`
  - `services/src/blackskies/services/memory_lab/resolver.py`
  - `services/src/blackskies/services/memory_lab/extractor.py`
  - `services/src/blackskies/services/memory_prototype/task_packet_assembler.py`
  - `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py`
- mypy result after the memory-runtime batch: `27 errors in 8 files (checked 346 source files)`
- files improved:
  - `services/src/blackskies/services/memory_lab/locking.py`
  - `services/src/blackskies/services/memory_lab/wave1.py`
  - `services/src/blackskies/services/memory_lab/storage.py`
  - `services/src/blackskies/services/memory_lab/resolver.py`
  - `services/src/blackskies/services/memory_lab/extractor.py`
  - `services/src/blackskies/services/memory_prototype/task_packet_assembler.py`
  - `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
- infra notes:
  - contract lane completed successfully after port preflight confirmed `9999` was not occupied by a live listener
  - smoke lane continues to surface the known `NO_COLOR` / `FORCE_COLOR` warning, dock-layout warning, and renderer `TypeError` noise without failing
- remaining errors grouped:
  - router/control-flow typing only
    - `services/src/blackskies/services/routers/phase4.py`
    - `services/src/blackskies/services/routers/restore.py`
    - `services/src/blackskies/services/routers/draft/wizard.py`
    - `services/src/blackskies/services/routers/draft/export.py`
    - `services/src/blackskies/services/routers/draft/revision.py`
    - `services/src/blackskies/services/routers/draft/acceptance.py`
    - `services/src/blackskies/services/routers/long_form.py`
    - `services/src/blackskies/services/routers/draft/generation.py`

## Phase 4.8J Router/Control-Flow Cleanup Plan

### Remaining Error Count
- Current mypy count: `27 errors in 8 files (checked 346 source files)`
- Scope: router/control-flow typing only; no test-only or memory-runtime debt remains in the current baseline.

### Error Families by Router File
- `services/src/blackskies/services/routers/phase4.py`
  - 2 `return-value` mismatches
  - shape issue: dict literals returned where `Phase4CritiqueResponse` / `Phase4RewriteResponse` are expected
- `services/src/blackskies/services/routers/restore.py`
  - 1 `assignment` mismatch
  - shape issue: `str | None` assigned to `str`
- `services/src/blackskies/services/routers/long_form.py`
  - 2 `union-attr` / `arg-type` issues
  - shape issue: `Path | None` being used as a concrete `Path`
- `services/src/blackskies/services/routers/draft/wizard.py`
  - 2 `union-attr` / `arg-type` issues
  - shape issue: `Path | None` passed into snapshot creation and `.exists()`
- `services/src/blackskies/services/routers/draft/export.py`
  - 1 `union-attr` issue
  - shape issue: `Path | None` used before narrowing
- `services/src/blackskies/services/routers/draft/revision.py`
  - 5 issues total
  - family mix: `arg-type`, `operator`, and `Path | None` propagation into logging and scene-document access
- `services/src/blackskies/services/routers/draft/acceptance.py`
  - 5 issues total
  - family mix: `union-attr` and `arg-type` from `Path | None` plus logging calls
- `services/src/blackskies/services/routers/draft/generation.py`
  - 9 issues total
  - family mix: `arg-type` and logging calls, all rooted in `Path | None` being passed through before narrowing

### Safest Order
1. `services/src/blackskies/services/routers/phase4.py`
2. `services/src/blackskies/services/routers/restore.py`
3. `services/src/blackskies/services/routers/draft/export.py`
4. `services/src/blackskies/services/routers/long_form.py`
5. `services/src/blackskies/services/routers/draft/wizard.py`
6. `services/src/blackskies/services/routers/draft/revision.py`
7. `services/src/blackskies/services/routers/draft/acceptance.py`
8. `services/src/blackskies/services/routers/draft/generation.py`

Rationale:
- start with the isolated response-shape and assignment fixes
- then clean the simpler `Path | None` narrowing sites
- leave the broadest draft-generation file for last because it contains the most call-site propagation and logging paths

### Risky Areas
- `draft/generation.py`
  - highest fan-out for `Path | None`
  - several service calls and logging sites in one file
- `draft/revision.py`
  - mixes path narrowing with operator usage, so a narrow fix can accidentally shift runtime assumptions if overgeneralized
- `draft/acceptance.py`
  - same path-flow risk plus read/accept service calls
- `long_form.py`
  - path root checks feed execution service creation, so it should stay localized
- `phase4.py`
  - low behavioral risk, but keep response-shape changes strictly to typed response construction

### Validation Commands
- `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
- `pnpm test:e2e -- --workers=1`
- `Get-NetTCPConnection -LocalPort 9999 -ErrorAction SilentlyContinue`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`

### Rollback Plan
- revert only the router file(s) changed in the last batch
- keep mypy config and CI gates unchanged
- rerun the baseline mypy command after each batch so any regression is isolated to the latest edit set

### Recommended Implementation Batch
- Batch 1: `phase4.py` and `restore.py`
- Batch 2: `long_form.py`, `draft/export.py`, and `draft/wizard.py`
- Batch 3: `draft/revision.py` and `draft/acceptance.py`
- Batch 4: `draft/generation.py`

Reason:
- Batch 1 has the smallest, most local type-shape fixes
- Batch 2 concentrates the simplest `Path | None` narrowing cases
- Batch 3 handles the denser draft-router path/logging propagation
- Batch 4 isolates the largest remaining fan-out file until the rest of the control-flow surface is already cleaned up

## Phase 4.8K Implementation Notes
- files changed:
  - `services/src/blackskies/services/routers/phase4.py`
  - `services/src/blackskies/services/routers/restore.py`
- mypy result after router Batch 1: `24 errors in 6 files (checked 346 source files)`
- exact fixes:
  - `phase4.py`
    - wrapped the synthetic e2e dict payloads in `Phase4CritiqueResponse.model_validate(...)` and `Phase4RewriteResponse.model_validate(...)` so the declared response models are preserved without changing the returned API shape
  - `restore.py`
    - made `zip_name` explicitly `str | None` so the existing `find_latest_zip(...)` fallback path type-checks before the existing 404 guard
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
- infra notes:
  - contract lane completed successfully after port preflight confirmed `9999` was not occupied by a live listener
  - smoke lane continues to surface the known `NO_COLOR` / `FORCE_COLOR` warning, dock-layout warning, and renderer `TypeError` noise without failing
- remaining router/control-flow errors:
  - `services/src/blackskies/services/routers/long_form.py`
  - `services/src/blackskies/services/routers/draft/wizard.py`
  - `services/src/blackskies/services/routers/draft/export.py`
  - `services/src/blackskies/services/routers/draft/revision.py`
  - `services/src/blackskies/services/routers/draft/acceptance.py`
  - `services/src/blackskies/services/routers/draft/generation.py`

## Phase 4.8L Implementation Notes
- files changed:
  - `services/src/blackskies/services/routers/long_form.py`
  - `services/src/blackskies/services/routers/draft/wizard.py`
  - `services/src/blackskies/services/routers/draft/export.py`
- mypy result after router Batch 2: `19 errors in 3 files (checked 346 source files)`
- exact fixes:
  - `long_form.py`
    - split the optional error-path project root from the concrete execution root so the execution service only receives a definite `Path`
  - `draft/wizard.py`
    - split the optional validation-path project root from the concrete snapshot project root so `exists()` and snapshot creation only use a definite `Path`
  - `draft/export.py`
    - split the optional validation-path project root from the concrete export project root so downstream service calls and filesystem errors use a definite `Path`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
- infra notes:
  - contract lane completed successfully after port preflight confirmed `9999` was not occupied by a live listener
  - smoke lane continues to surface the known `NO_COLOR` / `FORCE_COLOR` warning, dock-layout warning, and renderer `TypeError` noise without failing
- remaining router/control-flow errors:
  - `services/src/blackskies/services/routers/draft/revision.py`
  - `services/src/blackskies/services/routers/draft/acceptance.py`
  - `services/src/blackskies/services/routers/draft/generation.py`

## Phase 4.8M Implementation Notes
- files changed:
  - `services/src/blackskies/services/routers/draft/revision.py`
  - `services/src/blackskies/services/routers/draft/acceptance.py`
- mypy result after router Batch 3: `9 errors in 1 file (checked 346 source files)`
- exact fixes:
  - `draft/revision.py`
    - restored the critique-path project-root flow to the payload-derived `project_root` value instead of assuming `DraftCritiqueRequest` carried `project_id`
    - kept the earlier rewrite-path narrowing cleanup intact
  - `draft/acceptance.py`
    - kept the localized `resolved_project_root` narrowing so filesystem and diagnostic calls receive a definite `Path`
- validation evidence:
  - `services/tests/test_app.py`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - `startup_authority_contract.spec.ts`: `11 passed`
- infra notes:
  - contract lane completed successfully after port preflight confirmed `9999` was not occupied by a live listener
  - smoke lane still surfaces the known `NO_COLOR` / `FORCE_COLOR` warning, dock-layout warning, and renderer `TypeError` noise without failing
- remaining router/control-flow errors:
  - `services/src/blackskies/services/routers/draft/generation.py`

## Phase 4.8N Implementation Notes
- files changed:
  - `services/src/blackskies/services/routers/draft/generation.py`
- mypy result after router Batch 4: `0 errors in 0 files (checked 346 source files)`
- exact fixes:
  - split optional validation-path `project_root` from concrete execution-path `resolved_project_root` in both `/generate` and `/preflight`
  - routed all strict-`Path` callsites through `resolved_project_root`:
    - `load_outline_artifact(...)`
    - `e2e_generate_response(...)`
    - `DraftGenerationService.generate(...)`
    - `DiagnosticLogger.log(...)`
    - `DraftGenerationService.preflight(...)`
  - preserved runtime behavior and response shapes; this is type narrowing only
- validation evidence:
  - `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`: success, no issues found
  - `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`: `64 passed`
  - `pnpm test:e2e -- --workers=1`: `3 passed`
  - port preflight (`Get-NetTCPConnection -LocalPort 9999 -ErrorAction SilentlyContinue`): no active listener
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`: `11 passed`
- completion status:
  - router/control-flow mypy cleanup is complete for Phase 4.8
  - mypy baseline is now fully clean for the configured command scope

## Phase 4.8O Final Mypy Closure
- starting baseline:
  - `175 errors in 49 files`
- final result:
  - `Success: no issues found in 346 source files`
- major cleanup phases:
  - test-only cleanup
  - tooling/service utility cleanup
  - memory-runtime cleanup
  - router/control-flow cleanup
- validation evidence:
  - `pytest services/tests/test_app.py`: `64 passed`
  - smoke lane: `3 passed`
  - contract lane: `11 passed`
- deferred non-mypy risks:
  - `NO_COLOR` / `FORCE_COLOR` warning
  - dock layout warning
  - Node/Electron advisories
  - `pip` / `starlette` advisory deferrals
- closure status:
  - Phase 4.8 is formally closed
  - configured mypy scope is clean with validation lanes still passing
