# Long-Form Reliability Matrix

## Scope

- Date: 2026-03-16
- Goal: determine whether long-form generation is stable enough to leave the current reliability/calibration phase
- Runs: 5 fresh-server runs for clean `600`, 5 fresh-server runs for adversarial `600`
- Routing path: `api_only`
- Provider model observed in all runs: `openai / gpt-4o-mini`

## Commands run

Environment used for every fresh-server run:

```powershell
$env:PYTHONPATH = "services/src"
$env:BLACKSKIES_MODEL_ROUTER_PROVIDER_CALLS_ENABLED = "true"
$env:BLACKSKIES_LONG_FORM_PROVIDER_ENABLED = "true"
$env:BLACKSKIES_MODEL_ROUTING_POLICY = "api_only"
```

Service launch template:

```powershell
.venv\Scripts\python.exe -m uvicorn blackskies.services.app:create_app --factory --host 127.0.0.1 --port <port>
```

Evaluator template:

```powershell
.venv\Scripts\python.exe scripts/long_form_eval.py --project-id <project_id> --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 600 --base-url http://127.0.0.1:<port> --output <artifact>
```

The fifth run for each dataset used `--compare` against the prior four run summaries so the saved artifact includes `details.variance`.

## Datasets

- Clean verification dataset: `sample_project/proj_esther_estate_verify_longform`
- Adversarial dataset: `sample_project/proj_esther_estate_eval_adversarial`

## Summary artifacts

Clean:

- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_reliability_clean_600_run1.json`
- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_reliability_clean_600_run2.json`
- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_reliability_clean_600_run3.json`
- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_reliability_clean_600_run4.json`
- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_reliability_clean_600_run5.json`

Adversarial:

- `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_reliability_adversarial_600_run1.json`
- `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_reliability_adversarial_600_run2.json`
- `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_reliability_adversarial_600_run3.json`
- `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_reliability_adversarial_600_run4.json`
- `sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_reliability_adversarial_600_run5.json`

## Per-run results

### Clean 600

| Run | Accepted | Rewrites | Fallbacks | Avg Attempts | Avg Quality | Stopped | Retry Used | Retry Rescues | Borderline Failures | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 2 | 1 | 2.5 | 30.5 | `quality_failed` | 1 | 1 | 1 | 0.02 |
| 2 | 0 | 1 | 1 | 3.0 | 29.0 | `quality_failed` | 1 | 0 | 1 | 0.01 |
| 3 | 0 | 1 | 1 | 3.0 | 29.0 | `quality_failed` | 1 | 0 | 1 | 0.01 |
| 4 | 0 | 1 | 1 | 3.0 | 29.0 | `quality_failed` | 1 | 0 | 1 | 0.01 |
| 5 | 1 | 1 | 1 | 1.5 | 27.5 | `quality_failed` | 0 | 0 | 0 | 0.02 |

Variance summary from run 5 `details.variance`:

- pass/fail consistency: `stable`, but stable failure
- pass rate: `0.0`
- stopped_reason distribution: `quality_failed = 5`
- borderline failure rate: `0.8`
- retry usage rate: `0.8`
- retry rescue rate: `0.2`
- succeeded only after retry count: `1`
- quality score range: `3.0`
- cost range across runs: `0.01 - 0.02`

### Adversarial 600

| Run | Accepted | Rewrites | Fallbacks | Avg Attempts | Avg Quality | Stopped | Retry Used | Retry Rescues | Borderline Failures | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 5 | 0 | 0 | 1.0 | 31.8 | `null` | 0 | 0 | 0 | 0.05 |
| 2 | 5 | 1 | 0 | 1.2 | 30.6 | `null` | 0 | 0 | 0 | 0.05 |
| 3 | 5 | 0 | 0 | 1.0 | 31.6 | `null` | 0 | 0 | 0 | 0.05 |
| 4 | 5 | 0 | 0 | 1.0 | 32.2 | `null` | 0 | 0 | 0 | 0.05 |
| 5 | 5 | 1 | 0 | 1.2 | 31.8 | `null` | 0 | 0 | 0 | 0.05 |

Variance summary from run 5 `details.variance`:

- pass/fail consistency: `stable`
- pass rate: `1.0`
- stopped_reason distribution: none
- borderline failure rate: `0.0`
- retry usage rate: `0.0`
- retry rescue rate: `0.0`
- succeeded only after retry count: `0`
- quality score range: `1.6`
- cost range across runs: `0.05 - 0.05`

## Reliability judgment

Current system status: `not stable enough yet`

Reason:

- clean `600` failed on all 5 fresh-server runs
- every clean failure stopped on `quality_failed`
- the new retry control helped once, but only produced one chunk-level rescue across 5 runs and did not produce a single full clean pass
- adversarial `600` is stable, but operational readiness cannot be claimed while the clean verification path remains a consistent failure mode

This is no longer a vague variance concern. It is a measured split-brain reliability profile: adversarial is stable, clean is stably failing.

## Single next milestone

Recommended next milestone: `stronger rewrite model path`

Why this is the best next step:

- the reliability layer is already exposing the failure shape clearly
- stronger retry policy is unlikely to be enough because clean still failed in all 5 runs
- another narrow threshold pass would be reacting to measurement after the real issue has shifted to rewrite effectiveness under model variance
- the clean failures are dominated by post-rewrite `quality_failed` outcomes, which points to rewrite recovery quality, not evaluator visibility, as the current bottleneck
