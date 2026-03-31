# Long-Form Backend Phase Closeout

Status: not yet ready to close the reliability/control phase for long-form execution.

## What Was Proven
- API-backed long-form chunk generation is working.
- Two accepted chunks exist with real prose, continuity, and routing metadata.
- Diagnostics are persisted per chunk and in history.
- UTF-8 markdown persistence works for saved long-form text.
- Local Qwen/Ollama is unsuitable for heavy long-form generation (reasoning output dominates).
- Borderline rewrite recovery, stronger rewrite-model retry escalation, and outline-faithful rewrite guardrails are now implemented and test-covered.
- Precision rescue mode is now implemented as span-level patch rescue on the stronger retry path, with rescue-specific diagnostics and evaluation metrics.

### Evidence (latest successful chunks)
- `sample_project/proj_esther_estate/.blackskies/long_form/chunks/lf_5d6da836.json`
  - `provider`: `openai`
  - `model`: `gpt-4o-mini`
  - `routing_snapshot.policy`: `api_only`
  - `continuity_snapshot.fallback_reason`: `null`
- `sample_project/proj_esther_estate/.blackskies/long_form/chunks/lf_52501598.json`
  - `provider`: `openai`
  - `model`: `gpt-4o-mini`
  - `routing_snapshot.policy`: `api_only`
  - `continuity_snapshot.fallback_reason`: `null`

## Established Routing Policy
Heavy long-form drafting should prefer API providers:
- `BLACKSKIES_LONG_FORM_PREFER_API=true`
- `BLACKSKIES_MODEL_ROUTING_POLICY=api_only`

Local models are still available for lighter/cheaper helper work, but not for heavy long-form drafting.

## Manual Verification (API-backed run)

### Run the execute endpoint
```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/long-form/execute" `
  -ContentType "application/json" `
  -InFile "longform.json"
```

### Latest verification run (2026-03-15)
Project: `proj_esther_estate_verify_longform`  
Scenes: `sc_0001`–`sc_0005` (chunk_size=1)

Accepted chunks (quality pass on first attempt):
- `lf_6daa7008`
- `lf_54a1d6c5`
- `lf_2414aa35`
- `lf_e4f7a592`
- `lf_71fb0c4e`

Observed metadata on accepted chunks:
- `attempt_count: 1`
- `rewrite_used: false`
- `acceptance_reason: quality_pass`
- `quality_snapshot` populated
- `critique_snapshot: null` (no rewrite needed)

Note: per-chunk diagnostics are only emitted on invalid output or rewrite passes; clean runs may not create new diagnostic files.

### Rewrite loop live proof (forced threshold)
To prove the rewrite/critique loop live, the quality threshold was temporarily raised to force a rewrite attempt, then reverted. The run produced:
- `attempt_count: 2`
- `rewrite_used: true`
- `critique_snapshot` populated
- `acceptance_reason: quality_failed` (expected due to forced threshold)

Artifacts:
- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_f4e03e8c.json`
- `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_f4e03e8c.json`

## How To Inspect Latest Artifacts

### Newest chunk JSON
```powershell
Get-ChildItem .\sample_project\proj_esther_estate\.blackskies\long_form\chunks |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  ForEach-Object { $_.FullName; Get-Content $_.FullName }
```

### Newest diagnostics JSON
```powershell
Get-ChildItem .\sample_project\proj_esther_estate\.blackskies\long_form\diagnostics |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  ForEach-Object { $_.FullName; Get-Content $_.FullName }
```

### Newest saved markdown
```powershell
Get-ChildItem .\sample_project\proj_esther_estate\.blackskies\long_form\texts |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  ForEach-Object { $_.FullName; Get-Content -Encoding UTF8 $_.FullName }
```

## Why The Phase Is Still Open
- Repeated fresh-server evaluation still does not show near-zero unexpected failures on clean `600`.
- The failure shape has improved and is more inspectable, but clean runs still stop variably on `quality_failed` or `rewrite_guardrail_failed`.
- The latest rescue-mode reruns kept adversarial healthy, but clean still failed (`adapter_error`, `quality_failed`) and the most recent failures did not consistently reach the rescue path.
- The latest post-patch-rescue rerun attempt from this environment was blocked by provider `401 Unauthorized`, so fresh-server evidence on the new rescue architecture is still incomplete.
- Reliability/control therefore remains the active closeout gate.

## Explicitly Deferred (Next Phase)
- Outline-faithful editorial-partner controls once reliability/control closes
- Controlled read-only extension hooks (human-applied diffs)
- Batch export / scene operations
- UI expansion or polish

## Sequencing Note
UI docking/accessibility polish remains important, but it is treated as non-blocking for engine progression. The immediate engine focus stays on reliability/control closeout for long-form rewrite recovery. The next engine milestone after that closeout is an outline-faithful editorial-partner phase.
