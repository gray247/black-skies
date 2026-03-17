# Long-Form Integrated Pass

Date: 2026-03-16

## What changed technically

- Added Option C rewrite recovery: draft stays on the default path, first rewrite stays on the normal rewrite path, and a single retry-eligible borderline miss can escalate to a stronger rewrite model.
- Added rewrite guardrails that check outline/scene-anchor fidelity, practical rewrite length band, and uncertainty persistence.
- Extended chunk and diagnostic metadata with `guardrail_snapshot`, stronger-model retry metadata, and model snapshots per attempt.
- Added precision rescue mode on the stronger retry path, with rescue-specific prompt constraints, rescue delta summaries, and rescue failure classification.
- Added one bounded transient adapter retry and broadened rescue eligibility to include `targeted_editorial_miss_after_rewrite`.
- Replaced full-scene rescue/repair-only rewriting with span-level patch rescue: rescue now requests structured patch replacements, validates them locally, and splices them back into the scene before rescoring.

## Model routing and rewrite recovery

- The stronger rewrite path is only available on the one bounded recovery retry after `borderline_quality_after_rewrite`.
- Hard failures still do not retry.
- Diagnostics now show whether the stronger rewrite path was used, whether rescue mode was used, and why the retry did or did not rescue the chunk.
- Rescue-mode diagnostics now also record `patch_targets`, `patch_response`, `patch_validation`, `patch_rescue_used`, and `patch_rescue_success`.

## Span-level patch rescue

- Rescue no longer asks the stronger model to rewrite the whole scene.
- The engine now extracts local spans from the weak scene, asks for replacement text for those spans only, validates each patch locally, then splices the accepted replacements back into the existing scene.
- This preserves scene structure, dialogue order, and rough length by construction, which is the intended editing primitive for the clean-run rescue problem.

## Grounded diagnosis from the latest clean rescue miss

- Artifact inspected: `lf_df2bdeb3`
- Dominant failure class: under-improvement / weak rewrite followthrough, not guardrail failure
- Evidence:
  - guardrails passed on both rewrite and stronger retry
  - stronger retry used `openai / gpt-4o`
  - rewrite improved the score from `25` to `27`, but retry stayed flat at `27`
  - `dialogue_grounded` stayed `false`
  - `concrete_hits` stayed `0`
  - retry delta summary was effectively flat on the targeted weaknesses
- Conclusion: the blocker was a weak rescue edit that did not convert critique targets into concrete line-level changes.

## Outline-faithful guardrails

- Rewrites must preserve scene anchors from the current chunk and outline context.
- Rewrites must stay within a practical length band rather than collapsing or ballooning.
- When authoritative outline context exists, rewrites that introduce unsupported story entities are blocked and recorded as uncertainty instead of being accepted silently.
- Rescue mode now treats those constraints as an explicit editing contract instead of an implicit prompt preference.

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

Latest rescue-mode reruns:
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_rescue_clean_600_run1.json`
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_rescue_clean_600_run2.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_rescue_adversarial_600_run1.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_rescue_adversarial_600_run2.json`

Latest targeted-rescue reruns:
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_targeted_rescue_clean_600_run1.json`
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_targeted_rescue_clean_600_run2.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_targeted_rescue_adversarial_600_run1.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_targeted_rescue_adversarial_600_run2.json`

## What the reruns showed

- Clean reliability improved in reach: fresh runs now sometimes progress to 2-4 chunks instead of failing uniformly at the first rewrite gate.
- Retry rescue is real but still not strong enough to make clean `600` stable.
- Adversarial rewrite behavior still activates naturally, and the final-code confirmation run completed all 5 chunks without fallback.
- The overall system still does not meet the phase exit bar because clean `600` remains unstable and still fails.
- In the latest rescue-mode reruns, adversarial stayed stable (`2/2` passes), while clean remained `0/2`:
  - one run stopped on `adapter_error`
  - one run stopped on `quality_failed`
  - neither latest clean failure used rescue mode, which means the active blocker has shifted away from the original borderline-retry path on those runs
- In the latest targeted-rescue reruns, clean still remained `0/2`, but the failure surface became more controlled:
  - both runs stopped on `quality_failed`
  - both runs used rewrite plus rescue (`retry_used_count=1`, `rescue_mode_used_count=1`, `rescue_model_used_count=1`)
  - neither run hit guardrail/fidelity failure
  - adversarial remained healthy at `2/2` passes
- The first fresh reruns after the span-level patch rescue implementation were blocked in the current environment by `HTTP 401: Unauthorized` from the OpenAI path, so new clean/adversarial reliability evidence could not be completed from this machine until provider auth is restored.
- Root cause of the `401` was config aliasing: this environment exposes an OpenAI-compatible local endpoint via `OPENAI_API_BASE=http://127.0.0.1:11434/v1` and a dummy compatibility token via `OPENAI_API_KEY=ollama`. The service loader was honoring the key alias but ignoring the base-url alias, so it sent the dummy token to the real OpenAI URL and got `401 Unauthorized`.
- After fixing alias loading for `OPENAI_API_BASE`, the auth/config bug was resolved. The service correctly targeted the local compatibility endpoint instead of `api.openai.com`.
- Post-fix reruns on this machine are now operationally valid but still not phase-closeout evidence:
  - the compatible path had to be pointed at local Ollama-backed models (`qwen3:4b` draft path, `qwen3:8b` stronger retry path)
  - clean reruns stopped immediately on `invalid_output`
  - adversarial reruns also stopped immediately on `invalid_output`
  - because the only available provider in this environment is the local compatibility path, these reruns do not provide the intended OpenAI-backed reliability comparison that earlier evidence used

Post-fix eval artifacts:
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_span_patch_clean_600_run1.json`
- Clean `600`: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_span_patch_clean_600_run2.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_span_patch_adversarial_600_run1.json`
- Adversarial `600`: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_span_patch_adversarial_600_run2.json`

## Reliability judgment

Current judgment: partially improved, but not stable enough to leave the reliability/control phase.

## Remaining unresolved issues

- Clean `600` still falls variably on post-rewrite quality misses and rewrite guardrail failures.
- The stronger rewrite path and precision rescue mode improve inspection and rescue diagnosis, but not enough for near-zero unexpected failures.
- The broadened targeted-rescue path improves control and isolates the remaining blocker more clearly, but the stronger rescue model still does not produce enough editorial lift to clear clean `600`.
- Span-level patch rescue is now the active rescue architecture, but fresh-server pass-rate evidence on the new code is still incomplete because the current environment returned provider `401` failures during reruns.
- The next narrow milestone is stronger rewrite-quality capability under the existing bounded control layer, not broader autonomy.
