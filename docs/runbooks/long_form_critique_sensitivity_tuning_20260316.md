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
- result: `43 passed`

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
- After clean-recovery stabilization clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_clean_recovery_stabilized_600.json`
- After clean-recovery stabilization adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_clean_recovery_guard_adversarial_600.json`
- After split recovery clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_split_recovery_clean_600.json`
- After split recovery adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_split_recovery_adversarial_600.json`

## Before / after
| Dataset | Run | Chunks | Accepted | Rewrites | Fallbacks | Avg Quality | Avg Attempts | Continuity Warnings | Est. Cost | Stopped |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Clean | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Clean | After sensitivity tune | 4 | 3 | 1 | 1 | 31.0 | 1.25 | 0 | 0.04 | quality_failed |
| Clean | After rewrite-recovery calibration | 1 | 0 | 1 | 1 | 29.0 | 2.0 | 0 | 0.01 | quality_failed |
| Clean | After rewrite-effectiveness tuning | 2 | 1 | 1 | 1 | 28.5 | 1.5 | 0 | 0.02 | quality_failed |
| Clean | After critique-targeted carryover calibration | 1 | 0 | 1 | 1 | 29.0 | 2.0 | 0 | 0.01 | quality_failed |
| Clean | After clean-recovery stabilization | 2 | 1 | 1 | 1 | 29.5 | 1.5 | 0 | 0.02 | quality_failed |
| Clean | After split recovery | 2 | 1 | 1 | 1 | 27.5 | 1.5 | 0 | 0.02 | quality_failed |
| Adversarial | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Adversarial | After sensitivity tune | 5 | 5 | 0 | 0 | 31.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After rewrite-recovery calibration | 5 | 5 | 0 | 0 | 30.4 | 1.0 | 0 | 0.05 | null |
| Adversarial | After rewrite-effectiveness tuning | 5 | 5 | 0 | 0 | 30.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After critique-targeted carryover calibration | 5 | 5 | 1 | 0 | 30.4 | 1.2 | 0 | 0.05 | null |
| Adversarial | After clean-recovery stabilization | 5 | 5 | 0 | 0 | 30.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After split recovery | 5 | 5 | 1 | 0 | 31.0 | 1.2 | 0 | 0.05 | null |

## Result
Natural rewrites occur in end-to-end evaluation, but rewrite recovery is still not naturally stable.

- Yes: the clean `600` run still triggers `rewrite_count = 1`
- Yes: the split pass restored the adversarial `600` natural rewrite trigger to `rewrite_count = 1`
- No: rewrite recovery is still not stable enough because the clean `600` rerun still stopped with `quality_failed`

This means the loop is still generation-sensitive. Splitting opening recovery from continuation rewrite triggering fixed the cross-coupling regression on the adversarial dataset, but the clean live failure remains and is now clearly isolated to a continuation chunk whose rewrite still fails to improve the critique-targeted dimensions that matter in scoring. This pass should still be treated as incomplete.

## This pass
- opening and continuation rewrite recovery now branch explicitly in the acceptance path
- opening rewrites use their own recovery checks instead of inheriting continuation-oriented heuristics
- continuation rewrites preserve the earlier material-carryover and generic-continuation trigger logic
- critique payloads now include `generic_phrase_targets`, `detail_targets`, `dialogue_grounding_targets`, `emotional_show_targets`, `replacement_targets`, `grounding_targets`, and `carryover_targets`
- rewritten chunks must improve at least one critique-targeted dimension for their chunk type instead of passing on unrelated score movement

## Split-pass evidence
Clean `600` still failed on continuation chunk `lf_937507fa`:

- first pass: `total_score 26`, `clarity 2`, `specificity 2`, `stock_phrase_hits 4`, `carryover_hits 5`, `material_carryover_hits 0`
- rewrite pass: `total_score 26`, `clarity 2`, `specificity 2`, `stock_phrase_hits 5`, `carryover_hits 6`, `material_carryover_hits 0`
- acceptance reason: `quality_failed`

This failure mode is narrower than the previous mixed-path behavior:

- the continuation trigger regression is fixed in the adversarial dataset
- the remaining clean failure is a continuation rewrite that preserves token carryover but does not materially improve specificity, clarity, or stock-phrase load after critique

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
Single next tuning target: improve continuation rewrite follow-through so critique-targeted continuation rewrites materially raise specificity or clarity while reducing stock phrasing, instead of relying on path separation alone.

Reason:
- the split patch restored adversarial rewrite triggering without increasing fallbacks
- the clean failure is now isolated to a continuation rewrite that changed wording but not the scored weaknesses
- the next pass should target continuation rewrite effectiveness on critique-called weaknesses, not the opening/continuation branching itself
