# Long-Form Reliability Controls

## Retry-control rule

- A chunk gets one recovery retry only after a rewrite attempt fails for a `borderline` quality miss.
- A chunk may also get one recovery retry after a `targeted_editorial_miss_after_rewrite` when the scene is still coherent/fidelity-safe but the rewrite missed concentrated editorial targets such as dialogue grounding or concrete specificity.
- Borderline means the rewrite stayed near the quality thresholds but did not clear them cleanly.
- The recovery retry may escalate to a stronger rewrite model path while keeping the main draft path unchanged.
- The retry is not available for invalid output, adapter failures, meta contamination, weak or missing carryover, or continuation chunks that still only name-drop carryover without material use.

## Stronger rewrite path

- Draft generation stays on the default draft model path.
- First rewrite stays on the normal rewrite model path.
- Only the single recovery retry is allowed to escalate to the stronger rewrite model.
- Inspect `.blackskies/long_form/diagnostics/<chunk_id>.json` or chunk payloads for `retry_snapshot.stronger_model_used` and `retry_snapshot.model_snapshot`.

## Precision rescue mode

- The stronger retry path now uses span-level patch rescue rather than a full-scene rescue rewrite.
- Rescue mode identifies local weak spans, asks for replacement text for those spans only, validates the patches locally, and splices them back into the existing scene.
- Rescue mode is meant to edit the existing scene, not re-imagine it.
- Rescue mode explicitly preserves subject, scene premise, outline/scene anchors, and length band while targeting the unresolved weak dimensions from critique and scoring.
- Inspect `retry_snapshot.rescue_mode_used`, `retry_snapshot.rescue_model_used`, `retry_snapshot.patch_rescue_used`, `retry_snapshot.patch_rescue_success`, `retry_snapshot.rescue_delta_summary`, and `retry_snapshot.rescue_failure_class`.

## Local patch checks

- Patch rescue validates local replacements before full-scene rescoring.
- Generic patch targets must remove the targeted stock phrase and add some concrete/actionable detail locally.
- Dialogue patch targets must keep the spoken beat and add nearby action, gesture, object handling, or setting cue.
- Patches fail fast on unsupported new named entities, missing targets, or local length distortion.
- Inspect per-attempt diagnostics for `patch_targets`, `patch_response`, `patch_validation`, and `patch_snapshot`.

## Borderline vs hard failure

- `borderline`: near-threshold rewrite miss, recorded as `borderline_quality_after_rewrite`.
- `targeted_editorial`: concentrated rewrite miss recorded as `targeted_editorial_miss_after_rewrite`; this is retry-eligible only when coherence/continuity/fidelity remain intact.
- `hard`: `meta_contamination`, `missing_carryover`, `material_carryover_missing`, or a wider `quality_threshold_miss`.
- Inspect `.blackskies/long_form/diagnostics/<chunk_id>.json` and check `retry_snapshot.failure_classification`.

## Provider resilience

- Long-form calls now get one bounded retry for transient adapter/provider failures such as timeout or temporary upstream failure.
- Hard adapter failures are still not retried.
- Inspect attempt diagnostics for `adapter_failure_class`, `adapter_retry_used`, and `adapter_retry_count`.

## Rewrite guardrails

- Rewrites are checked against a practical length band before acceptance.
- Rewrites are also checked for outline/scene-anchor drift and unauthorized story-entity introduction when authoritative context is available.
- If the rewrite cannot satisfy those constraints confidently, the engine records an internal uncertainty/guardrail failure instead of silently accepting drift.
- Inspect `guardrail_snapshot` on chunk JSON or diagnostics for `failure_reason`, `within_length_band`, `scene_anchor_drift_detected`, and `blocking_new_story_elements`.

## Inspecting variance

- Each run summary now records `retry_used_count`, `retried_success_count`, and `borderline_failure_count`.
- To compare repeated runs, pass prior eval summaries into the evaluator:

```bash
python scripts/long_form_eval.py \
  --project-id proj_esther_estate_verify_longform \
  --chapter-id ch_0001 \
  --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 \
  --chunk-size 1 \
  --target-words 600 \
  --compare sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_run_a.json sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_run_b.json
```

- The saved eval payload will include `details.variance` with pass/fail consistency, stopped-reason counts, borderline failure rate, retry usage rate, retry rescue rate, and quality score range.

## Updated evaluator usage

- Standard single-run usage is unchanged.
- Use `--compare` with prior eval JSON files when you want a quick variance view without building a larger reporting layer.
- Run summaries now also expose rescue-specific aggregates:
  - `rescue_mode_used_count`
  - `rescue_model_used_count`
  - `rescue_guardrail_fail_count`
  - `rescue_under_improved_count`
  - `rescue_fidelity_risk_count`
  - `patch_rescue_used_count`
  - `patch_rescue_success_count`

## Provider setup note

- This service also supports OpenAI-compatible local endpoints exposed through legacy env names.
- `ServiceSettings.from_environment()` now maps:
  - `OPENAI_API_KEY` -> `openai_api_key`
  - `OPENAI_API_BASE` or `OPENAI_BASE_URL` -> `openai_base_url`
- Without the base-url alias, a dummy compatibility key such as `OPENAI_API_KEY=ollama` can be misrouted to the real OpenAI URL and fail with `401 Unauthorized`.
