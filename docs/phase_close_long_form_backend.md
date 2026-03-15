# Long-Form Backend Phase Closeout

Status: complete enough to close the backend-heavy phase for long-form execution.

## What Was Proven
- API-backed long-form chunk generation is working.
- Two accepted chunks exist with real prose, continuity, and routing metadata.
- Diagnostics are persisted per chunk and in history.
- UTF-8 markdown persistence works for saved long-form text.
- Local Qwen/Ollama is unsuitable for heavy long-form generation (reasoning output dominates).

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

## Explicitly Deferred (Next Phase)
- Controlled agent hooks (read-only by default, human-applied diffs)
- Deeper rewrite/critique workflows
- Batch export / scene operations
- Additional quality tuning beyond the current prompt and validation hardening
- UI expansion or polish
