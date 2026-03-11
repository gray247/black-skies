# Provider-Backed Draft Experiment (Local Ollama)

This runbook enables a safe, opt-in draft generation experiment using the local Ollama provider.

## Prereqs
- Ollama running locally.
- Model available: `qwen3:4b`.
- Draft generation only. Outline remains local/manual.

## Environment
Set the following before starting the services:

```
BLACKSKIES_MODEL_ROUTER_PROVIDER_CALLS_ENABLED=true
BLACKSKIES_LOCAL_PROVIDER=ollama
BLACKSKIES_LOCAL_MODEL=qwen3:4b
```

Optional:

```
BLACKSKIES_LOCAL_TIMEOUT_SECONDS=12
BLACKSKIES_LOCAL_LLM_HEALTH_CHECK=true
```

## Notes
- Fallback remains deterministic if the adapter fails, times out, or returns empty text.
- No prompts or secrets are logged.
