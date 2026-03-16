# Long-Form Adversarial Eval Comparison

## Harder dataset design
Project: `sample_project/proj_esther_estate_eval_adversarial`

This adversarial outline keeps the existing Esther Estate story frame but adds scenes that should naturally stress the critique and rewrite loop:

- continuity carryover pressure across a lantern, soaked coat, parlor key, chained door, and ceramic fox
- dialogue-heavy confrontation that can drift into generic prose
- abrupt emotional pivots from suspicion to urgency to grief
- low-specificity spaces that need concrete sensory grounding
- location transitions where object state and movement should remain coherent

The goal was not to break the engine with nonsense prompts. The goal was to create plausible scenes that make weak specificity, continuity drift, and flat description more likely if the acceptance loop is calibrated tightly enough.

## Commands
```powershell
python scripts/long_form_eval.py --project-id proj_esther_estate_eval_adversarial --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 600 --base-url http://127.0.0.1:8010 --output sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_adversarial_600.json
python scripts/long_form_eval.py --project-id proj_esther_estate_eval_adversarial --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 400 --base-url http://127.0.0.1:8010 --output sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_adversarial_400.json
```

## Summary artifacts
- Clean baseline 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_threshold_tightened_600_patched.json`
- Clean baseline 400: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_threshold_tightened_400_patched.json`
- Adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_adversarial_600.json`
- Adversarial 400: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_adversarial_400.json`

## Comparison
| Dataset | Target Words | Chunk IDs | Chunks | Accepted | Rewrites | Fallbacks | Avg Quality | Avg Attempts | Continuity Warnings | Est. Cost | Providers | Models | Stopped |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Clean | 600 | `lf_5c8d48cc`, `lf_8dcbbb81`, `lf_a031a2eb`, `lf_a12222d9`, `lf_ea50fe32` | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | openai | gpt-4o-mini | null |
| Clean | 400 | `lf_0930efbd`, `lf_7886bc5b`, `lf_ca24a58d`, `lf_cfd295b3`, `lf_eff9d5b3` | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | openai | gpt-4o-mini | null |
| Adversarial | 600 | `lf_18a619d9`, `lf_71e00527`, `lf_80baf61c`, `lf_8958fb43`, `lf_91db206f` | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | openai | gpt-4o-mini | null |
| Adversarial | 400 | `lf_5ab76acb`, `lf_9576ad9d`, `lf_9d5b1404`, `lf_c29fec08`, `lf_d349db44` | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | openai | gpt-4o-mini | null |

## Result
Natural rewrites still did not occur. Continuity warnings also remained at zero.

That matters because the adversarial dataset was intentionally designed to increase pressure on specificity, object carryover, emotional continuity, and dialogue handling. The fact that these runs are indistinguishable from the clean verification dataset suggests the limiting factor is no longer just dataset cleanliness.

## Recommendation
Single next tuning target: tighten critique sensitivity for continuity and specificity signals inside the acceptance loop.

Evidence for that recommendation:

- the eval harness now covers a harder but still realistic dataset
- focused unit tests already prove borderline chunks can rewrite
- end-to-end eval still accepts every chunk on the first attempt
- continuity warning generation appears too insensitive for this level of scene pressure

The next pass should target the critique or acceptance logic that converts soft continuity and specificity weaknesses into rewrite pressure, rather than building yet another harder dataset.
