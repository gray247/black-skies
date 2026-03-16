# Long-Form Reliability Controls

## Retry-control rule

- A chunk gets one recovery retry only after a rewrite attempt fails for a `borderline` quality miss.
- Borderline means the rewrite stayed near the quality thresholds but did not clear them cleanly.
- The retry is not available for invalid output, adapter failures, meta contamination, weak or missing carryover, or continuation chunks that still only name-drop carryover without material use.

## Borderline vs hard failure

- `borderline`: near-threshold rewrite miss, recorded as `borderline_quality_after_rewrite`.
- `hard`: `meta_contamination`, `missing_carryover`, `material_carryover_missing`, or a wider `quality_threshold_miss`.
- Inspect `.blackskies/long_form/diagnostics/<chunk_id>.json` and check `retry_snapshot.failure_classification`.

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
