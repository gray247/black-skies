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
- result: `47 passed`

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
- After continuation-followthrough clean 600: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_continuation_followthrough_clean_600.json`
- After critique-parse fix clean 600 response: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_carryover_terms_clean_600_response.json`
- After carryover-term extraction adversarial 600: `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_carryover_terms_adversarial_600.json`

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
| Clean | After continuation-followthrough | 2 | 1 | 1 | 1 | 30.0 | 1.5 | 0 | 0.02 | quality_failed |
| Clean | Parser-fixed run on fresh server | 5 | 5 | 3 | 0 | 31.4 | 1.6 | 0 | 0.05 | null |
| Clean | Carryover-term run on next fresh server | 2 | 1 | 1 | 1 | n/a via harness response | n/a via harness response | 0 | 0.02 | quality_failed |
| Adversarial | Before | 5 | 5 | 0 | 0 | 32.6 | 1.0 | 0 | 0.05 | null |
| Adversarial | After sensitivity tune | 5 | 5 | 0 | 0 | 31.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After rewrite-recovery calibration | 5 | 5 | 0 | 0 | 30.4 | 1.0 | 0 | 0.05 | null |
| Adversarial | After rewrite-effectiveness tuning | 5 | 5 | 0 | 0 | 30.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After critique-targeted carryover calibration | 5 | 5 | 1 | 0 | 30.4 | 1.2 | 0 | 0.05 | null |
| Adversarial | After clean-recovery stabilization | 5 | 5 | 0 | 0 | 30.8 | 1.0 | 0 | 0.05 | null |
| Adversarial | After split recovery | 5 | 5 | 1 | 0 | 31.0 | 1.2 | 0 | 0.05 | null |
| Adversarial | After critique-parse fix | 3 | 2 | 1 | 1 | 29.33 | 1.33 | 2 | 0.03 | quality_failed |
| Adversarial | After carryover-term extraction | 5 | 5 | 1 | 0 | 32.4 | 1.2 | 0 | 0.05 | null |

## Result
Natural rewrites occur in end-to-end evaluation, but rewrite recovery is still not naturally stable.

- Yes: the clean `600` run still triggers `rewrite_count = 1`
- Yes: the split pass restored the adversarial `600` natural rewrite trigger to `rewrite_count = 1`
- No: rewrite recovery is still not stable enough because the clean `600` rerun still stopped with `quality_failed`

This means the loop is now dominated by generation variance rather than a single stable acceptance defect. The latest passes fixed several real logic bugs:

- continuation rewrite prompts now carry explicit replacement obligations and detected carryover terms
- continuation rewrite recovery now credits real improvement after generic risk clears
- critique parsing now accepts fenced JSON instead of collapsing to the generic fallback
- carryover extraction now prefers concrete scene anchors over emotional residue

But the same code still produces opposite clean outcomes across fresh runs:

- one parser-fixed clean run completed all 5 chunks with `rewrite_count = 3`, `fallback_count = 0`, and no `quality_failed`
- the next clean run on a fresh server failed after 2 chunks with `stopped_reason = quality_failed`
- the latest adversarial run on that same code completed with `rewrite_count = 1`, `fallback_count = 0`, and `stopped_reason = null`

That is a hard blocker for another narrow heuristic pass. The remaining instability is no longer tied to one reproducible scoring path; it comes from model-output variance changing which chunk class fails on a given run.

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

## Latest blocker evidence
- Clean success evidence from the parser-fixed run:
  - accepted chunk files: `lf_2704fc59`, `lf_42a959e4`, `lf_7549dc18`, `lf_b4b1843f`, `lf_3f884d44`
  - acceptance reasons: `quality_pass`, `quality_pass`, `rewrite_pass`, `rewrite_pass`, `rewrite_pass`
  - derived summary: `chunk_count 5`, `accepted_count 5`, `rewrite_count 3`, `fallback_count 0`, `avg_quality_score 31.4`, `avg_attempts 1.6`, `total_estimated_usd 0.05`
- Clean failure evidence from the next fresh-server run:
  - response artifact: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_carryover_terms_clean_600_response.json`
  - summary in response: `chunk_count 2`, `stopped_reason quality_failed`, `estimated_usd 0.02`
- Adversarial success evidence on the same code family:
  - `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_carryover_terms_adversarial_600.json`
  - summary: `chunk_count 5`, `accepted_count 5`, `rewrite_count 1`, `fallback_count 0`, `avg_quality_score 32.4`, `avg_attempts 1.2`, `stopped_reason null`

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
Next step requires a broader control change, not another narrow heuristic tweak.

Reason:
- the remaining clean miss is not reproducible as one stable chunk class anymore
- fenced-critique parsing and carryover-term extraction bugs are already fixed
- the same code now shows both clean success and clean failure on consecutive fresh runs, which means another small heuristic change would be chasing stochastic outputs instead of a deterministic defect
- the next reliable fix needs one of:
  - deterministic eval controls / frozen responses for calibration
  - a broader retry strategy with more than one rewrite attempt for failed continuation chunks
  - a stronger or more constrained rewrite generation path so critique-targeted improvements are less sample-sensitive
