# Long-Form Provider-Backed Run (Internal)

This runbook enables the controlled long-form execution loop. It is intended for internal testing only.

## Preconditions
- A project with an existing `outline.json`.
- Continuity artifacts can be empty; the loop will handle missing carryover safely.
- Provider access configured (Ollama recommended for first run).

## Required settings (.env)
```text
BLACKSKIES_MODEL_ROUTER_PROVIDER_CALLS_ENABLED=true
BLACKSKIES_MODEL_ROUTER_METADATA_ENABLED=true
BLACKSKIES_LONG_FORM_PROVIDER_ENABLED=true
BLACKSKIES_MODEL_ROUTING_POLICY=local_only
BLACKSKIES_LOCAL_PROVIDER=ollama
BLACKSKIES_LOCAL_MODEL=qwen3:4b
BLACKSKIES_LOCAL_LLM_AVAILABLE=true
BLACKSKIES_LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
```

## Notes
- The execution loop remains opt-in. If `BLACKSKIES_LONG_FORM_PROVIDER_ENABLED=false`, the loop returns `stopped_reason="disabled"`.
- Each chunk persists metadata under `.blackskies/long_form/chunks` and its text under `.blackskies/long_form/texts`.
- Invalid output or adapter failures trigger a deterministic fallback and stop the loop safely.

## Curl Example (Windows PowerShell)
```text
curl.exe -X POST http://127.0.0.1:8000/api/v1/long-form/execute -H "Content-Type: application/json" -d "{\"project_id\":\"proj_esther_estate\",\"chapter_id\":\"ch_0001\",\"scene_ids\":[\"sc_0001\",\"sc_0002\"],\"chunk_size\":1,\"target_words_per_chunk\":900,\"enabled\":true}"
```
