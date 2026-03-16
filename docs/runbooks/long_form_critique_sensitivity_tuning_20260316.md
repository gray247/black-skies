# Long-Form Critique Sensitivity Tuning

## What changed
- continuity carryover now requires more than a single token overlap from prior excerpt or summary
- specificity scoring now distinguishes concrete scene detail from generic atmosphere words
- stock filler phrases now reduce clarity and specificity instead of being treated as harmless prose
- dialogue grounding still affects scoring, but no longer hard-fails a chunk by itself
- acceptance still rejects weak carryover, but the specificity floor was calibrated to `4` instead of forcing `5` on every chunk
- critique prompts now explicitly call out weak continuity carryover, generic phrasing, vague detail, and floating dialogue

## Focused verification
- `pytest services/tests/unit/test_long_form.py services/tests/unit/test_long_form_execution.py -q`
- result: `38 passed`

## Eval artifact paths
- Before clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_threshold_tightened_600_patched.json`
- Before adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_adversarial_600.json`
- After clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_sensitivity_tuned_clean_600_final3.json`
- After adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_sensitivity_tuned_adversarial_600.json`

## Before / after
| Dataset | Run | Chunks | Accepted | Rewrites | Fallbacks | Avg Quality | Avg Attempts | Continuity Warnings | Est. Cost | Stopped |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Clean | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Clean | After | 4 | 3 | 1 | 1 | 31.0 | 1.25 | 0 | 0.04 | quality_failed |
| Adversarial | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Adversarial | After | 5 | 5 | 0 | 0 | 31.8 | 1.0 | 0 | 0.05 | null |

## Result
Natural rewrites now occur in end-to-end evaluation, but only partially.

- Yes: the clean `600` run now triggered `rewrite_count = 1` and `avg_attempts = 1.25`
- No: the adversarial `600` run still produced `rewrite_count = 0`
- Stability is not yet fully acceptable because the clean run stopped with `quality_failed` after four chunks

This means the tuning pass moved the system off the previous flatline, but the remaining pressure is uneven. The scorer is now strong enough to catch at least one realistic borderline chunk, yet still not sensitive enough to produce rewrites on the harder adversarial outline. At the same time, one later clean chunk still falls off the loop instead of recovering through rewrite.

## Recommendation
Single next tuning target: calibrate the rewrite-pass acceptance path for continuation chunks with mild generic phrasing.

Reason:
- weak carryover detection is now doing useful work
- natural rewrite activation is no longer theoretical
- the remaining problem is not total insensitivity, but uneven recovery after rewrite
- the adversarial run suggests continuity and generic-language pressure still needs better coupling to rewrite success rather than another threshold increase
