# Pass 104 - Draft Generation Timeout Contract Clarification

## 1. Scope Declaration

Pass 104 is contract clarification only for draft-generation provider timeout behavior.

It resolves the ambiguity recorded in Pass 103 between:

- one service-level experiment test expecting fallback
- adapter/service timeout tests expecting escalation
- the route test expecting a controlled `504`

It does not:

- modify backend source
- modify backend tests
- repair timeout handling

## 2. Evidence Base

### Prior audit inputs

- `docs/audits/phase14/pass102_backend_validation_failure_classification.md`
- `docs/audits/phase14/pass103_draft_generation_timeout_fallback_ownership_map.md`

### Test surfaces

- `services/tests/unit/test_draft_generation_experiment.py`
- `services/tests/unit/test_draft_generation_adapter.py`
- `services/tests/test_app.py`

### Runtime surfaces

- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/routers/draft/generation.py`
- `services/src/blackskies/services/model_adapters.py`

### Runtime/spec authority

- `docs/specs/model_runtime.md`
- `docs/specs/model_backend.md`
- `docs/specs/error_visibility.md`
- `docs/specs/endpoints.md`
- `docs/specs/current_state.md`

## 3. Existing Test Contract Conflict

Current inspected tests do not agree.

### Fallback expectation

- `services/tests/unit/test_draft_generation_experiment.py::test_provider_backed_draft_error_falls_back`
  - expects `AdapterError("timeout")` to produce synthesized fallback draft text

### Timeout escalation expectation

- `services/tests/unit/test_draft_generation_adapter.py::test_draft_generation_logs_provider_timeout_error`
  - expects timeout-shaped adapter failure to raise `DraftGenerationProviderTimeoutError`
- `services/tests/unit/test_draft_generation_adapter.py::test_draft_generation_raises_provider_timeout_on_hung_adapter`
  - expects hung adapter to raise `DraftGenerationProviderTimeoutError`
- `services/tests/test_app.py::test_draft_generate_provider_timeout_returns_controlled_error`
  - expects provider timeout to surface as controlled HTTP `504`

The fallback expectation is the outlier inside the current tree.

## 4. Runtime/Product Contract Evidence

Current runtime code distinguishes timeout from generic adapter failure.

### Generic adapter failure

In `services/src/blackskies/services/operations/draft_generation.py`:

- generic `AdapterError` logs `provider-error`
- diagnostics say `Draft adapter failed; falling back to local synthesis.`
- generation continues with synthesized/local draft text

### Timeout-shaped adapter failure

In the same file:

- message containing `timeout` or `timed out` logs `provider-timeout`
- the service raises `DraftGenerationProviderTimeoutError`
- it does not continue into local synthesized fallback

### Route/public behavior

In `services/src/blackskies/services/routers/draft/generation.py`:

- `DraftGenerationProviderTimeoutError` is caught explicitly
- diagnostics record `PROVIDER_TIMEOUT`
- route returns controlled `504` with message `Provider/model timed out.`

This is an intentional runtime distinction, not an accidental mismatch.

## 5. Error Visibility Contract Evidence

`docs/specs/error_visibility.md` supports explicit timeout visibility, not hidden fallback.

Relevant evidence:

- timeout messages are treated as a visible failure class
- test requirements explicitly include `Preflight timeout and provider timeout messaging`
- anti-patterns reject collapsing distinct failure classes into generic hidden failure text

This supports user-facing exposure of provider timeout rather than silently returning fallback text as if the provider path had succeeded.

## 6. Timeout vs Generic Adapter Failure Distinction

Timeout should be treated differently from generic provider error.

Reasoning:

- generic adapter error can still safely degrade to local synthesized text without misrepresenting an explicit timeout condition
- timeout is already modeled in code as its own execution failure class
- route and error-visibility evidence both preserve timeout as user-visible and retry-relevant

So the intended distinction is:

- generic provider failure -> fallback/local synthesis is acceptable
- provider timeout -> explicit controlled timeout error is acceptable and preferred

## 7. Recommended Contract

- Recommended contract: `B) Provider timeout escalates as controlled timeout error / HTTP 504.`

### Clarified contract

- timeout-shaped provider failures should remain distinct from generic adapter failures
- internal draft-generation execution may fall back for:
  - unusable/empty provider text
  - non-timeout generic adapter failures
- internal draft-generation execution should not silently convert provider timeout into synthesized success
- user-facing route should expose provider timeout as controlled `504`

### Layer posture

This is not `C` in the sense of conflicting semantics by layer.

The contract is consistent across layers:

- service execution raises timeout-specific error
- route surfaces timeout-specific error
- UI/error layer shows timeout-specific feedback

The current ambiguity comes from one stale test, not from a valid split-layer design.

## 8. Tests That Should Remain Valid

These tests align with the clarified contract and should remain valid:

- `services/tests/unit/test_draft_generation_adapter.py::test_draft_generation_adapter_exception_falls_back`
- `services/tests/unit/test_draft_generation_adapter.py::test_draft_generation_logs_provider_timeout_error`
- `services/tests/unit/test_draft_generation_adapter.py::test_draft_generation_raises_provider_timeout_on_hung_adapter`
- `services/tests/test_app.py::test_draft_generate_provider_timeout_returns_controlled_error`
- `services/tests/unit/test_draft_generation_experiment.py::test_provider_backed_draft_empty_text_falls_back`
- `services/tests/unit/test_draft_generation_experiment.py::test_provider_calls_disabled_skips_adapter`

## 9. Tests That Should Change

Likely stale test:

- `services/tests/unit/test_draft_generation_experiment.py::test_provider_backed_draft_error_falls_back`

Why it should change:

- it expects timeout fallback
- current runtime, adjacent service tests, and route contract all preserve timeout escalation instead

Potential additional follow-up candidate:

- `docs/specs/endpoints.md`

Reason:

- current route behavior exposes `PROVIDER_TIMEOUT` as a distinct controlled error
- the draft-generate error list shown in the endpoint doc does not currently spell that out

This is documentation parity follow-up, not a blocker to contract clarification.

## 10. Repair-Readiness Assessment

- `READY FOR REPAIR PLAN`

The repair-planning scope is now narrow:

- update the stale service-level experiment expectation
- verify it aligns with:
  - `services/src/blackskies/services/operations/draft_generation.py`
  - `services/tests/unit/test_draft_generation_adapter.py`
  - `services/tests/test_app.py`

Candidate files for the next repair plan:

- `services/tests/unit/test_draft_generation_experiment.py`
- `services/src/blackskies/services/operations/draft_generation.py` only if new evidence contradicts the clarified contract
- `services/tests/test_app.py` for preservation checks, not expected first-edit scope

Current evidence does not justify changing:

- `services/src/blackskies/services/routers/draft/generation.py`
- `services/src/blackskies/services/model_adapters.py`

## 11. Final Verdict

- `CONTRACT CLARIFIED — READY FOR REPAIR PLAN`

Pass 104 conclusion:

- timeout should be treated differently from generic provider error
- user-facing route should expose provider timeout as controlled `504`
- the failing experiment test is best classified as stale
- the next repair plan can be constrained to the stale test seam first, with runtime edits remaining conditional only if new contradiction evidence appears
