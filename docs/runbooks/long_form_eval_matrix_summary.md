# Long-Form Eval Matrix Summary

## Commands
1. Baseline (600 words)
```powershell
python scripts/long_form_eval.py --project-id proj_esther_estate_verify_longform --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 600
```
2. Shorter chunk test (400 words)
```powershell
python scripts/long_form_eval.py --project-id proj_esther_estate_verify_longform --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 400
```
3. Stress/continuity test (600 words)
```powershell
python scripts/long_form_eval.py --project-id proj_esther_estate_verify_longform --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 600
```

## Summary artifacts
- Baseline: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_20260315T231531Z.json`
- Shorter: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_20260315T231615Z.json`
- Stress: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_20260315T231718Z.json`

## Comparison
| Run | Target Words | Chunks | Accepted | Rewrites | Fallbacks | Avg Quality | Avg Attempts | Continuity Warnings | Est. Cost | Stopped |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline | 600 | 5 | 5 | 0 | 0 | 32.4 | 1.0 | 0 | 0.05 | null |
| Shorter | 400 | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Stress | 600 | 5 | 5 | 0 | 0 | 32.2 | 1.0 | 0 | 0.05 | null |

## Recommendation (single next tuning target)
**Acceptance thresholds.**
All three runs passed with zero rewrites and zero continuity warnings, and average quality scores are tightly clustered. This suggests the current thresholds may be too permissive to trigger rewrites in borderline cases. Tightening acceptance gates (or raising minimum specificity/continuity cutoffs) is the most direct next lever to increase sensitivity without changing prompts or model policy.
