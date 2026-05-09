# Type/Lint Debt Inventory

## Purpose
Capture current mypy/type debt as a ranked, surgical inventory so future fixes can be batched by risk and effort without broad refactors or CI gate churn.

## Command Used
```text
.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth
```

## Baseline Result
- Total errors: `175`
- Files with errors: `49`
- Checked source files: `346`

## Error Families
Grouped by recurring mypy signatures from the baseline run.

1. Any/object indexing and shape assumptions (`[index]`) — ~47
- Pattern: `Value of type "object" is not indexable`
- Typical surface: service tests parsing API payloads as `object` instead of typed dict/model.

2. Argument type mismatches (`[arg-type]`) — ~46
- Pattern: function calls passing `dict[str, str]` where `dict[str, object]` expected, optional providers passed as non-optional, etc.
- Typical surface: routers/services and helper APIs with overly strict or inconsistent signatures.

3. Missing/incorrect attributes on inferred objects (`[attr-defined]`) — ~24
- Pattern: pydantic symbols not resolved in tests, `object` lacks `.get/.startswith/.lower`, module attributes missing.
- Typical surface: test doubles/fixtures and dynamic payload manipulation.

4. Operator/type misuse (`[operator]`) — ~17
- Pattern: `Path / object`, `in object`, `len(object)`, arithmetic/comparison against `object`.
- Typical surface: filesystem and payload handling in tests/services.

5. Incompatible assignments (`[assignment]`) — ~10
- Pattern: assigning `None` to non-optional, assigning `list[object]` to typed structured list.
- Typical surface: memory and analytics internals.

6. Return type mismatches (`[return-value]`) — ~7
- Pattern: declared return types not matching dict payloads/closures.

7. Import/name discovery issues (`[name-defined]`) — ~7
- Pattern: `httpx.AsyncClient` name resolution in tests.

8. Optional/None handling (`[union-attr]`) — ~5
- Pattern: `Path | None` accessed as guaranteed `Path`.
- Typical surface: draft/long-form router paths.

9. Misc variance/comprehension mismatch (`[misc]`) — ~3
10. Redefinition/type-form issues (`[no-redef]`, `[valid-type]`, `[var-annotated]`) — low count but noisy.

## Top 10 Ranked Fix Targets
Ranking balances concentration, fix effort, and runtime regression risk.

1. `services/tests/test_app.py`
- Error family: `index`, `operator`, `attr-defined`, `misc`
- Approximate count: ~29
- Fix effort: Medium-High
- Regression risk: Low-Medium (test-only)
- Suggested targeted validation: `pytest -q services/tests/test_app.py`

2. `services/src/blackskies/services/routers/draft/generation.py`
- Error family: `arg-type`, `union-attr`
- Approximate count: ~9
- Fix effort: Medium
- Regression risk: High (request handling path)
- Suggested targeted validation: draft generation/preflight endpoint tests + route smoke

3. `services/src/blackskies/services/model_router.py`
- Error family: repeated `arg-type` (optional provider contract)
- Approximate count: ~9
- Fix effort: Medium
- Regression risk: High (model selection/runtime behavior)
- Suggested targeted validation: model-router unit tests + truth/harness critical paths

4. `services/tests/test_gui_bridge_contracts.py`
- Error family: `name-defined`, `index`, `attr-defined`
- Approximate count: ~10
- Fix effort: Medium
- Regression risk: Medium (test contract integrity)
- Suggested targeted validation: `pytest -q services/tests/test_gui_bridge_contracts.py`

5. `services/tests/unit/test_budget_loader.py`
- Error family: `index`, `arg-type`
- Approximate count: ~10
- Fix effort: Medium
- Regression risk: Low-Medium (test-only, but core budget assumptions)
- Suggested targeted validation: `pytest -q services/tests/unit/test_budget_loader.py`

6. `services/src/blackskies/services/analytics_stub.py`
- Error family: `assignment`, `operator`, `attr-defined`, `no-redef`
- Approximate count: ~8
- Fix effort: Medium
- Regression risk: Medium-High (analytics fallback behavior)
- Suggested targeted validation: analytics service tests + app analytics smoke

7. `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py`
- Error family: `arg-type`, `assignment`, `attr-defined`
- Approximate count: ~6
- Fix effort: Medium
- Regression risk: Medium (memory prototype correctness)
- Suggested targeted validation: prototype memory tests subset

8. `services/src/blackskies/services/memory_lab/locking.py`
- Error family: `assignment`, `attr-defined`
- Approximate count: ~6
- Fix effort: Low-Medium
- Regression risk: Medium-High (cross-platform locking behavior)
- Suggested targeted validation: memory lab tests + OS-specific sanity checks

9. `services/src/blackskies/services/routers/draft/revision.py` and `acceptance.py` (pair)
- Error family: `arg-type`, `operator` with `Path | None`
- Approximate count: ~10 combined
- Fix effort: Medium
- Regression risk: High (accept/revision runtime paths)
- Suggested targeted validation: acceptance/revision endpoint tests + truth lane checks

10. `services/tests/unit/test_snapshot_persistence_refactor.py` + `test_diagnostics.py`
- Error family: `attr-defined` for pydantic symbols
- Approximate count: ~14 combined
- Fix effort: Medium
- Regression risk: Low-Medium (test-only but structural assertions)
- Suggested targeted validation: targeted unit tests for both files

## Highest-Risk Areas
Type fixes here can alter runtime behavior and must be batched carefully:
- `services/src/blackskies/services/routers/draft/*` (`generation`, `revision`, `acceptance`, `wizard`, `export`)
- `services/src/blackskies/services/model_router.py`
- `services/src/blackskies/services/operations/long_form_execution.py`
- `services/src/blackskies/services/analytics_stub.py`
- `services/src/blackskies/services/memory_lab/*` and `memory_prototype/*`

## Low-Risk Cleanup Areas
Likely safer for early mechanical cleanup:
- High-volume test indexing/type-shape issues in `services/tests/test_app.py`
- Test-only type-form/name issues (`valid-type`, `var-annotated`, some `name-defined`)
- Prototype/test helper variance mismatches where runtime code is untouched
- `tests/test_tool_search.py` arg-shape typing mismatch

## CI Narrowed-Gate Rationale
Current CI mypy gate should remain narrowed because:
- Debt is broad (`175` errors across `49` files) and spans runtime-sensitive routers/services.
- Expanding gate immediately would make CI red for unrelated work and encourage unsafe broad churn.
- A staged batch approach is required to avoid behavior regressions in draft/model routing and long-form flows.
- Maintaining narrow gate preserves delivery while debt burn-down proceeds with explicit batch ownership.

## Recommended Fix Order
1. Test-only high-volume cleanup batch:
- `services/tests/test_app.py`, `test_gui_bridge_contracts.py`, `test_budget_loader.py`, `tests/test_tool_search.py`
- Goal: reduce noise quickly with low runtime risk.

2. Router `Path | None` contract batch:
- `routers/draft/{generation,revision,acceptance,wizard,export}.py`, `routers/long_form.py`
- Goal: remove optional-path hazards with focused endpoint validation.

3. Model routing contract batch:
- `services/src/.../model_router.py`, related tests
- Goal: resolve optional provider arg-type mismatches without route behavior drift.

4. Analytics/memory internals batch:
- `analytics_stub.py`, `memory_lab/*`, `memory_prototype/*`
- Goal: clean structured typing while preserving behavior and cross-platform semantics.

5. Remaining structural/type-form cleanup:
- `settings.py` redefinition, return-value edge cases, residual attr/operator signatures.

## Commands Run
```text
.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth
```

## Exit Criteria
- [x] Error families grouped
- [x] Top 10 ranked by fix effort/risk
- [x] CI narrowed-gate rationale documented
- [x] No broad refactor started
