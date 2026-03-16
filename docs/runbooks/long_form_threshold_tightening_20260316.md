# Long-Form Threshold Tightening - 2026-03-16

## Change made

Applied a small acceptance-gate tightening in `LongFormExecutionService`:

- `specificity` minimum for automatic acceptance: `3 -> 5`

Rationale:

- the previous eval matrix showed `rewrite_count = 0`, `continuity_warnings = 0`, tightly clustered quality scores, and stable clean runs
- the old specificity gate of `3` was effectively permissive because long-form scoring only emitted `specificity` values of `1`, `2`, `4`, or `5`
- requiring `5` keeps clearly vivid chunks passing while making less concrete `specificity = 4` chunks eligible for critique/rewrite

## Test coverage

Focused unit coverage after the threshold change:

- borderline specificity chunk now rewrites and passes on rewrite
- clearly strong chunk still passes
- weak chunk still fails after max attempts

Command:

```powershell
pytest services/tests/unit/test_long_form.py services/tests/unit/test_long_form_execution.py -q
```

Result:

- `35 passed`

## Eval artifacts

Before:

- 600 words: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_20260315T231531Z.json`
- 400 words: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_20260315T231615Z.json`

After:

- 600 words: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_threshold_tightened_600_patched.json`
- 400 words: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_threshold_tightened_400_patched.json`

## Before/after comparison

| Run | Target Words | Rewrite Count | Avg Attempts | Avg Quality Score | Fallback Count | Continuity Warnings | Total Estimated USD |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Before | 600 | 0 | 1.0 | 32.4 | 0 | 0 | 0.05 |
| After | 600 | 0 | 1.0 | 32.6 | 0 | 0 | 0.05 |
| Before | 400 | 0 | 1.0 | 32.6 | 0 | 0 | 0.05 |
| After | 400 | 0 | 1.0 | 32.6 | 0 | 0 | 0.05 |

## Outcome

- Natural rewrites still did **not** occur on the current eval project for either the 600-word or 400-word rerun.
- The threshold change is safe and test-backed, but the current eval set remains strong enough to clear the tightened gate.

## Recommendation

Next tuning step should tighten the **first-attempt acceptance rule**, not just the static minimum:

- keep rewrite acceptance stable to avoid fallback blowups
- make initial draft acceptance slightly stricter, for example by combining a higher first-pass total threshold with the existing rewrite path
- alternatively, add a slightly stronger penalty for generic-but-usable prose so borderline `specificity = 4` chunks appear more often in live runs
