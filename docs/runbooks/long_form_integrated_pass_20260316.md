# Long-Form Integrated Pass

Date: 2026-03-16

## What changed technically

- Added Option C rewrite recovery: draft stays on the default path, first rewrite stays on the normal rewrite path, and a single retry-eligible borderline miss can escalate to a stronger rewrite model.
- Added rewrite guardrails that check outline/scene-anchor fidelity, practical rewrite length band, and uncertainty persistence.
- Extended chunk and diagnostic metadata with `guardrail_snapshot`, stronger-model retry metadata, and model snapshots per attempt.

## Model routing and rewrite recovery

- The stronger rewrite path is only available on the one bounded recovery retry after `borderline_quality_after_rewrite`.
- Hard failures still do not retry.
- Diagnostics now show whether the stronger rewrite path was used and why the retry did or did not rescue the chunk.

## Outline-faithful guardrails

- Rewrites must preserve scene anchors from the current chunk and outline context.
- Rewrites must stay within a practical length band rather than collapsing or ballooning.
- When authoritative outline context exists, rewrites that introduce unsupported story entities are blocked and recorded as uncertainty instead of being accepted silently.

## Evaluation reruns

Commands used:

```powershell
$env:PYTHONPATH = "services/src"
$env:BLACKSKIES_MODEL_ROUTER_PROVIDER_CALLS_ENABLED = "true"
$env:BLACKSKIES_LONG_FORM_PROVIDER_ENABLED = "true"
$env:BLACKSKIES_MODEL_ROUTING_POLICY = "api_only"
```

Repeated fresh-server sample:
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_integrated_clean_600_run1.json`
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_integrated_clean_600_run2.json`
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_integrated_clean_600_run3.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_integrated_adversarial_600_run1.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_integrated_adversarial_600_run2.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_integrated_adversarial_600_run3.json`

Final-code confirmation runs:
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_integrated_final_clean_600_run1.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_integrated_final_adversarial_600_run1.json`

## What the reruns showed

- Clean reliability improved in reach: fresh runs now sometimes progress to 2-4 chunks instead of failing uniformly at the first rewrite gate.
- Retry rescue is real but still not strong enough to make clean `600` stable.
- Adversarial rewrite behavior still activates naturally, and the final-code confirmation run completed all 5 chunks without fallback.
- The overall system still does not meet the phase exit bar because clean `600` remains unstable and still fails.

## Reliability judgment

Current judgment: partially improved, but not stable enough to leave the reliability/control phase.

## Remaining unresolved issues

- Clean `600` still falls variably on post-rewrite quality misses and rewrite guardrail failures.
- The stronger rewrite path improves inspection and some rescues, but not enough for near-zero unexpected failures.
- The next narrow milestone is stronger rewrite-quality capability under the existing bounded control layer, not broader autonomy.
