# Pass 103 - Draft Generation Timeout/Fallback Ownership Map

## 1. Scope Declaration

Pass 103 is ownership mapping only for the deterministic backend failure:

- `services/tests/unit/test_draft_generation_experiment.py::test_provider_backed_draft_error_falls_back`

It maps the current timeout, fallback, routing, and test-contract owners for this lane.

It does not:

- modify backend source
- modify backend tests
- modify fixtures or configuration
- repair timeout handling

## 2. Starting Repo State

- Repo: `C:\Dev\black-skies`
- Branch: `phase-b2-memory-lab`
- Preflight `git status --short`: clean
- Preflight `git status -sb`: `## phase-b2-memory-lab...origin/phase-b2-memory-lab`
- Preflight `git log -1 --oneline`: `4841f4b docs: classify backend validation failures`

Pass 103 started because the working tree was clean, the branch matched, and the latest commit matched Pass 102.

## 3. Evidence Base

### Documents and specs inspected

- `docs/audits/phase14/pass102_backend_validation_failure_classification.md`
- `docs/specs/model_runtime.md`
- `docs/specs/model_backend.md`
- `docs/specs/current_state.md`
- `docs/specs/error_visibility.md`
- `docs/specs/endpoints.md`

### Tests inspected

- `services/tests/unit/test_draft_generation_experiment.py`
- `services/tests/unit/test_draft_generation_adapter.py`
- `services/tests/test_app.py`

### Runtime owners inspected

- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/model_router.py`
- `services/src/blackskies/services/model_adapters.py`
- `services/src/blackskies/services/routers/draft/generation.py`
- `services/src/blackskies/services/config.py`

### Commands run

- `git status --short`
- `git status -sb`
- `git log -1 --oneline`
- `rg -n "DraftGenerationProviderTimeoutError|provider.*fallback|fallback|timeout|draft generation|generate_draft|provider_backed" services docs`
- `rg -n "test_provider_backed_draft_error_falls_back|falls_back" services/tests`
- `python -m pytest services/tests/unit/test_draft_generation_experiment.py -k "provider_backed_draft_success or provider_backed_draft_empty_text_falls_back or provider_backed_draft_error_falls_back or provider_calls_disabled_skips_adapter" -q`
- `python -m pytest services/tests/unit/test_draft_generation_adapter.py -k "adapter_exception_falls_back or logs_provider_timeout_error or raises_provider_timeout_on_hung_adapter" -q`
- `python -m pytest services/tests/test_app.py -k "draft_generate_provider_timeout_returns_controlled_error" -q`

## 4. Failure Summary

The failing unit test expects this behavior:

- provider-backed draft generation is enabled
- the routed adapter raises `AdapterError("timeout")`
- the service falls back to local synthesis
- the returned draft text contains the default synthesized text (`"enters Scene 1"`)

The current code does not do that.

Current runtime behavior:

- `DraftGenerationService._execute_generation()` catches `AdapterError`
- if the error message contains `timeout` or `timed out`, it logs `provider-timeout`
- it then raises `DraftGenerationProviderTimeoutError`
- the fallback/local synthesis path is not used for timeout-shaped adapter errors

Observed narrow repro:

- `services/tests/unit/test_draft_generation_experiment.py` subset: `1 failed, 3 passed`
- adapter/timeout subset in `services/tests/unit/test_draft_generation_adapter.py`: `3 passed`
- route timeout subset in `services/tests/test_app.py`: `1 passed`

## 5. Expected Contract

The expected contract is not singular across the current evidence.

### Contract asserted by the failing test

- `test_provider_backed_draft_error_falls_back` expects timeout-shaped adapter error -> fallback text

### Contract asserted by adjacent service tests

- `test_draft_generation_adapter_exception_falls_back` expects generic `AdapterError("boom")` -> fallback text
- `test_draft_generation_logs_provider_timeout_error` expects timeout-shaped adapter error -> `DraftGenerationProviderTimeoutError`
- `test_draft_generation_raises_provider_timeout_on_hung_adapter` expects hung provider -> `DraftGenerationProviderTimeoutError`

### Contract asserted by route tests

- `test_draft_generate_provider_timeout_returns_controlled_error` expects provider timeout -> controlled HTTP `504`

### Contract asserted by docs

- `docs/specs/error_visibility.md` explicitly calls out preflight timeout and provider timeout messaging as required test coverage
- `docs/specs/model_runtime.md` treats provider quirks and provider-specific handling as adapter/runtime concerns
- no inspected canonical spec explicitly says draft generation timeouts must fall back to synthesized text

## 6. Current Behavior

### Generic adapter error path

Owner:

- `services/src/blackskies/services/operations/draft_generation.py`

Behavior:

- logs `provider-error`
- writes diagnostics entry with message `Draft adapter failed; falling back to local synthesis.`
- continues execution using the synthesizer output

### Timeout-shaped adapter error path

Owner:

- `services/src/blackskies/services/operations/draft_generation.py`

Behavior:

- if `AdapterError` message contains `timeout` or `timed out`, logs `provider-timeout`
- raises `DraftGenerationProviderTimeoutError`
- does not continue into synthesized fallback completion

### HTTP route behavior

Owner:

- `services/src/blackskies/services/routers/draft/generation.py`

Behavior:

- catches `DraftGenerationProviderTimeoutError`
- logs `PROVIDER_TIMEOUT`
- returns controlled `504` service error with code `PROVIDER_TIMEOUT`

## 7. Ownership Map

| Concern | Owner | Role |
| --- | --- | --- |
| failing service-level expectation | `services/tests/unit/test_draft_generation_experiment.py` | test contract owner for provider-backed experiment behavior |
| generic adapter fallback behavior | `services/src/blackskies/services/operations/draft_generation.py` | execution owner for local synthesized fallback on non-timeout adapter errors |
| timeout exception raising | `services/src/blackskies/services/operations/draft_generation.py` | execution owner for timeout escalation |
| provider adapter exception type | `services/src/blackskies/services/model_adapters.py` | adapter error boundary owner |
| provider/local routing choice | `services/src/blackskies/services/model_router.py` | routing owner |
| provider execution enablement and timeouts | `services/src/blackskies/services/config.py` | config owner |
| public HTTP timeout contract | `services/src/blackskies/services/routers/draft/generation.py` and `services/tests/test_app.py` | route-level contract owner |
| current runtime authority docs | `docs/specs/model_runtime.md`, `docs/specs/current_state.md` | runtime/doc authority |

## 8. Provider / Local Routing Boundary

Routing ownership lives in:

- `services/src/blackskies/services/model_router.py`
- `services/src/blackskies/services/model_routing.py`
- `services/src/blackskies/services/config.py`

Current routing truth:

- provider-backed draft generation is opt-in via `model_router_provider_calls_enabled`
- task routing chooses the provider and records route metadata
- routing does not own post-call timeout handling semantics

Important boundary:

- the router decides whether a provider adapter is used
- `DraftGenerationService` decides what to do after that adapter succeeds, returns unusable text, raises generic adapter error, or times out

## 9. Timeout / Exception Boundary

Timeout/exception ownership is concentrated in:

- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/model_adapters.py`
- `services/src/blackskies/services/routers/draft/generation.py`

Current timeout distinction:

- network/adapter failures surface as `AdapterError`
- draft-generation execution upgrades timeout-shaped adapter failures into `DraftGenerationProviderTimeoutError`
- the HTTP route converts `DraftGenerationProviderTimeoutError` into a controlled `504`

This makes timeout handling an explicit execution-and-route contract, not an incidental byproduct of the adapter layer.

## 10. Fallback Boundary

Fallback ownership lives in:

- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/draft_synthesizer.py` indirectly through `synthesizer.synthesize(...)`

Current fallback rules observed in code/tests:

- provider returns usable text -> use provider text
- provider returns empty/whitespace text -> keep synthesized fallback text
- provider raises generic adapter error -> keep synthesized fallback text
- provider times out or raises timeout-shaped adapter error -> escalate timeout instead of keeping fallback text

So fallback exists, but it is intentionally not universal across all provider failures.

## 11. Test Contract Assessment

The failing test is currently out of alignment with the stronger surrounding evidence.

Why:

- adjacent draft-generation adapter tests explicitly preserve timeout escalation
- the public route test explicitly preserves timeout-to-504 behavior
- the failing experiment test is the only inspected test asserting timeout-shaped provider error -> fallback text

This means the failing test owns a service-level expectation that currently conflicts with:

- the adapter-level timeout tests
- the route-level timeout tests
- the error-visibility draft spec that treats provider timeout as a visible error class

## 12. Contract Drift Assessment

Best current classification:

- `CONTRACT AMBIGUITY` with a strong `TEST DRIFT` signal

Why not plain implementation drift:

- current implementation is internally consistent with other tests for provider timeout escalation
- the route layer is also explicitly built around that escalation

Why not plain test drift only:

- the failing experiment test still exists and names a plausible service-level fallback expectation
- no single inspected canonical spec settles whether internal service callers should receive fallback text while the HTTP route still surfaces provider timeout

So the real conflict is:

- service experiment test says timeout should fall back
- service adapter tests and route tests say timeout should escalate

That is narrower than full design ambiguity, but broader than a single bad assertion.

## 13. Unknowns / Not Proven

- Whether the experiment test was written before the timeout escalation rules were introduced and simply never updated
- Whether an intended two-layer contract exists:
  - internal service call falls back
  - HTTP route still surfaces timeout separately
- Whether any current product workflow truly depends on timeout fallback instead of timeout visibility
- Whether any uninspected docs outside the current runtime/spec set explicitly require fallback for provider timeout in draft generation

## 14. Repair-Readiness Assessment

- `CONTRACT CLARIFICATION REQUIRED`

The seam is small and well mapped, but a repair plan should not begin until the timeout contract is explicitly chosen for this lane.

If implementation started immediately, it would risk breaking one of two already-proven expectations:

- service-level fallback expectation
- route-level timeout/504 expectation

## 15. Smallest Safe Next Repair-Planning Unit

Smallest safe next unit:

- timeout/fallback contract clarification for draft generation only

Bounded files/evidence:

- `services/tests/unit/test_draft_generation_experiment.py`
- `services/tests/unit/test_draft_generation_adapter.py`
- `services/tests/test_app.py`
- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/routers/draft/generation.py`

Decision required before repair planning:

- should timeout-shaped provider failures:
  - fall back to synthesized draft text, or
  - remain explicit timeout errors that surface through the route as `504`

## 16. Final Verdict

- `OWNERSHIP MAP PARTIAL — CONTRACT CLARIFICATION REQUIRED`

Pass 103 conclusion:

- timeout exception raising is clearly owned
- fallback behavior is clearly owned
- provider/local routing ownership is clear
- the failing test is not enough by itself to prove implementation drift
- current evidence shows a narrow but real timeout-contract conflict between one service-level test and the broader timeout-escalation path
