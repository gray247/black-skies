# Long-Form Critique Sensitivity Tuning

## What changed
- continuity carryover now requires more than a single token overlap from prior excerpt or summary
- specificity scoring now distinguishes concrete scene detail from generic atmosphere words
- stock filler phrases now reduce clarity and specificity instead of being treated as harmless prose
- dialogue grounding still affects scoring, but no longer hard-fails a chunk by itself
- acceptance still rejects weak carryover, but the specificity floor was calibrated to `4` instead of forcing `5` on every chunk
- critique prompts now explicitly call out weak continuity carryover, generic phrasing, vague detail, and floating dialogue
- rewrite-pass acceptance now allows continuation chunks with mild generic residue to recover when continuity, clarity, total score, and concrete detail materially improve after rewrite
- rewrite prompts now explicitly require replacing generic filler with concrete detail instead of lightly paraphrasing it
- rewritten chunks now need a small but meaningful quality delta before they can count as recovered

## Focused verification
- `pytest services/tests/unit/test_long_form.py services/tests/unit/test_long_form_execution.py -q`
- result: `38 passed`

## Eval artifact paths
- Before clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_threshold_tightened_600_patched.json`
- Before adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_adversarial_600.json`
- After sensitivity tune clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_sensitivity_tuned_clean_600_final3.json`
- After sensitivity tune adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_sensitivity_tuned_adversarial_600.json`
- After rewrite-recovery calibration clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_rewrite_recovery_calibrated_clean_600.json`
- After rewrite-recovery calibration adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_rewrite_recovery_calibrated_adversarial_600.json`
- After rewrite-effectiveness clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_rewrite_effectiveness_clean_600.json`
- After rewrite-effectiveness adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_rewrite_effectiveness_adversarial_600.json`
- After critique-targeted carryover calibration clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_critique_targeted_clean_600.json`
- After critique-targeted carryover calibration adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_critique_targeted_adversarial_600.json`

## Before / after
| Dataset | Run | Chunks | Accepted | Rewrites | Fallbacks | Avg Quality | Avg Attempts | Continuity Warnings | Est. Cost | Stopped |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Clean | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Clean | After sensitivity tune | 4 | 3 | 1 | 1 | 31.0 | 1.25 | 0 | 0.04 | quality_failed |
| Clean | After rewrite-recovery calibration | 1 | 0 | 1 | 1 | 29.0 | 2.0 | 0 | 0.01 | quality_failed |
| Clean | After rewrite-effectiveness tuning | 2 | 1 | 1 | 1 | 28.5 | 1.5 | 0 | 0.02 | quality_failed |
| Clean | After critique-targeted carryover calibration | 1 | 0 | 1 | 1 | 29.0 | 2.0 | 0 | 0.01 | quality_failed |
| Adversarial | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Adversarial | After sensitivity tune | 5 | 5 | 0 | 0 | 31.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After rewrite-recovery calibration | 5 | 5 | 0 | 0 | 30.4 | 1.0 | 0 | 0.05 | null |
| Adversarial | After rewrite-effectiveness tuning | 5 | 5 | 0 | 0 | 30.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After critique-targeted carryover calibration | 5 | 5 | 1 | 0 | 30.4 | 1.2 | 0 | 0.05 | null |

## Result
Natural rewrites occur in end-to-end evaluation, but rewrite recovery is still not naturally stable.

- Yes: the clean `600` runs still trigger `rewrite_count = 1`
- Yes: the adversarial `600` run now produces `rewrite_count = 1`
- No: rewrite recovery is still not stable enough because the clean `600` rerun still stopped with `quality_failed`

This means the loop is no longer flatlined, and rewrites are now held to a real improvement standard. The new critique-target alignment and material-carryover signal are strong enough to push at least one realistic adversarial chunk into rewrite without destabilizing that run. The clean dataset, however, still does not recover reliably under normal generation.

## This pass
- critique payloads now include `replacement_targets`, `grounding_targets`, and `carryover_targets`
- rewritten chunks must improve at least one critique-targeted dimension, not just an unrelated score
- continuation carryover now distinguishes material reuse from token reuse
- continuation chunks with generic atmosphere plus non-material carryover take an extra specificity hit before rewrite

## Failed continuation evidence
Chunk that rewrote and failed during the sensitivity run:

- chunk id: `lf_74964e3a`
- source file: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_74964e3a.json`

Before rewrite quality snapshot:

```json
{
  "scores": {
    "coherence": 5,
    "continuity": 4,
    "clarity": 3,
    "pacing": 5,
    "specificity": 4,
    "dialogue": 4,
    "meta_free": 5
  },
  "total_score": 30,
  "generic_risk": true,
  "stock_phrase_hits": 4,
  "carryover_hits": 4,
  "weak_carryover": false
}
```

After rewrite quality snapshot:

```json
{
  "scores": {
    "coherence": 5,
    "continuity": 5,
    "clarity": 3,
    "pacing": 5,
    "specificity": 4,
    "dialogue": 4,
    "meta_free": 5
  },
  "total_score": 31,
  "generic_risk": true,
  "stock_phrase_hits": 3,
  "carryover_hits": 3,
  "weak_carryover": false
}
```

Critique snapshot:

```json
{
  "summary": "In a dimly lit cafe, Elara encounters a mysterious man who seems to have been observing her. Their conversation reveals a tension filled with curiosity and vulnerability as they discuss her state of mind and his interest in her presence.",
  "weaknesses": [
    "Generic stock phrases like 'dimly lit cafe' and 'muffled conversations' detract from the uniqueness of the scene.",
    "Vague descriptions of emotions and physical sensations make it difficult to fully engage with the characters.",
    "Dialogue often lacks grounding in physical action or the setting, making it feel disconnected from the environment."
  ],
  "continuity_issues": [
    "The transition from Elara's internal thoughts to her interaction with the man feels abrupt, lacking a smooth flow.",
    "The description of the cafe shrinking around them is metaphorical but not visually supported by the surrounding details."
  ],
  "rewrite_goals": [
    "Replace generic phrases with more vivid, specific imagery that enhances the uniqueness of the cafe and the characters.",
    "Ground dialogue in physical actions or setting to create a stronger connection between characters and their environment.",
    "Clarify emotional responses and internal thoughts to provide a deeper understanding of Elara's character and her interactions."
  ]
}
```

## Recommendation
Single next tuning target: harden clean-run rewrite recovery by making replacement targets more concrete and excerpt-bound for opening and early continuation chunks.

Reason:
- weak carryover detection is now doing useful work
- natural rewrite activation is no longer theoretical
- the adversarial run now confirms rewrite triggering under realistic pressure
- the remaining problem is concentrated in clean-run rewrite recovery, not overall trigger sensitivity
