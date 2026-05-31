# Pass 105 - Draft Generation Timeout Repair Plan

## 1. Scope Declaration

Pass 105 is planning-only for the stale draft-generation timeout experiment test.

This pass does:

- define the smallest safe repair lane after Pass 104 contract clarification
- constrain authorized implementation scope
- define exact validation criteria for the eventual repair

This pass does not:

- modify backend source
- modify tests
- modify fixtures
- perform repair implementation

## 2. Contract Summary

Pass 104 established the active contract:

- timeout-shaped provider failures escalate as `DraftGenerationProviderTimeoutError`
- route behavior surfaces that timeout as controlled HTTP `504` with `PROVIDER_TIMEOUT`
- generic adapter failures (non-timeout) may fall back to local synthesized draft text

Current evidence remains aligned with that contract:

- `services/src/blackskies/services/operations/draft_generation.py` raises timeout-specific errors for timeout-shaped adapter failures and logs fallback only for generic adapter failures
- `services/tests/test_app.py::test_draft_generate_provider_timeout_returns_controlled_error` preserves controlled `504` / `PROVIDER_TIMEOUT`
- `services/tests/unit/test_draft_generation_adapter.py` preserves both sides of the split:
  - generic adapter failure fallback
  - timeout escalation

## 3. Stale Test Summary

Stale test:

- `services/tests/unit/test_draft_generation_experiment.py::test_provider_backed_draft_error_falls_back`

Why stale:

- it injects `AdapterError("timeout")`
- it currently expects synthesized fallback text (`"enters Scene 1"`)
- this expectation conflicts with Pass 104 and with current runtime/route/adapter timeout contract

Answer:

- Yes, the stale test should be rewritten to expect timeout escalation.
- Yes, a separate generic adapter failure fallback test should remain preserved to protect the non-timeout fallback contract.

## 4. Authorized Candidate File

Primary authorized implementation target:

- `services/tests/unit/test_draft_generation_experiment.py`

Conditional-only target (only if new contradiction evidence appears during implementation):

- `services/src/blackskies/services/operations/draft_generation.py`

Current Pass 105 evidence does not justify opening the conditional target.

## 5. Explicitly Unauthorized Files

Implementation in the follow-up repair pass is unauthorized to change:

- route behavior or route tests as behavior-changing vehicles
- adapter behavior
- config
- generic fallback behavior
- dependencies

Explicitly unauthorized runtime/config files include:

- `services/src/blackskies/services/routers/draft/generation.py`
- `services/src/blackskies/services/model_adapters.py`
- `services/src/blackskies/services/config.py`
- dependency manifests/lockfiles

## 6. Smallest Repair Strategy

Planned minimal implementation move:

1. Update only `test_provider_backed_draft_error_falls_back` in `services/tests/unit/test_draft_generation_experiment.py`.
2. Change expectation from fallback text assertion to timeout escalation assertion (`DraftGenerationProviderTimeoutError`).
3. Keep the rest of the experiment file intact, including:
   - provider success assertion
   - empty-text fallback assertion
   - provider-calls-disabled fallback assertion
4. Preserve existing generic adapter fallback coverage in `services/tests/unit/test_draft_generation_adapter.py::test_draft_generation_adapter_exception_falls_back`.
5. Do not modify runtime behavior unless a contradiction appears that invalidates Pass 104.

## 7. Validation Plan

Exact validation that proves the repair:

1. `python -m pytest services/tests/unit/test_draft_generation_experiment.py -k "provider_backed_draft_error_falls_back or provider_backed_draft_empty_text_falls_back or provider_backed_draft_success or provider_calls_disabled_skips_adapter" -q`
2. `python -m pytest services/tests/unit/test_draft_generation_adapter.py -k "draft_generation_adapter_exception_falls_back or draft_generation_logs_provider_timeout_error or draft_generation_raises_provider_timeout_on_hung_adapter" -q`
3. `python -m pytest services/tests/test_app.py -k "draft_generate_provider_timeout_returns_controlled_error" -q`
4. `git diff --check`
5. `pnpm lint:docs`

What this validation proves:

- the stale experiment timeout expectation was realigned to timeout escalation
- generic adapter fallback behavior remains preserved
- timeout-to-`504` route contract remains preserved
- documentation formatting/lint remains clean for this pass

What this validation does not prove:

- full backend suite health
- end-to-end provider/network timeout behavior against external providers
- absence of unrelated regressions outside the targeted draft-generation timeout/fallback lane

## 8. Risks

- Test-only repair may mask hidden runtime drift if uninspected code changed between planning and implementation.
- Over-broad edits to experiment tests could unintentionally alter non-timeout fallback coverage.
- Skipping the route-preservation check could permit accidental timeout-contract regression.

Risk control:

- keep edits to one test in one file
- run the exact bounded validation set above
- keep conditional runtime-file edits blocked unless new contradiction evidence appears

## 9. Final Verdict

`READY FOR IMPLEMENTATION AUTHORIZATION`

Pass 105 conclusion:

- repair scope is narrow and test-first
- authorized target is clear
- timeout escalation and generic fallback contracts are jointly preserved
