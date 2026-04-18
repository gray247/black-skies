Status: Canonical current model/runtime reference
Version: 1.0.0
Last Reviewed: 2026-04-18
Owner: Services Team

# Model Runtime

Purpose: describe the current model/provider runtime as observed in code.

## Runtime assembly

- `services/src/blackskies/services/app.py` creates the application-wide model router
- `services/src/blackskies/services/config.py` defines routing policy, provider settings, and opt-in provider execution flags

## Responsibility boundaries

### `model_routing.py`

File: `services/src/blackskies/services/model_routing.py`

Owns:
- routing policy definitions
- router configuration shape

Does not own:
- provider-specific request formatting
- provider response extraction
- prompt text construction

### `model_router.py`

File: `services/src/blackskies/services/model_router.py`

Owns:
- task-to-provider routing decisions
- route decision objects
- provider availability and policy evaluation

Does not own:
- provider-specific payload quirks beyond what is required to choose a route
- prompt construction

### `model_adapters.py`

File: `services/src/blackskies/services/model_adapters.py`

Owns:
- provider-specific request/response handling
- provider capability declarations
- provider-specific model/profile helpers
- normalized response extraction

This is the adapter boundary for provider quirks.

### Prompt modules

Files:
- `services/src/blackskies/services/prompt_pipeline.py`
- `services/src/blackskies/services/prompt_profile_resolver.py`
- `services/src/blackskies/services/prompt_compiler.py`

Current role:
- assemble prompt context
- resolve prompt profiles
- compile prompt text

Important limitation:
- provider abstraction exists, but prompt/profile behavior still matters at runtime
- upper layers should prefer routed capabilities/profiles rather than raw provider-name branching

## Current runtime truth

The model/provider layer is materially improved over direct provider calls, but it is not fully provider-neutral at every layer.

Current reality:
- routing policy/config lives in `model_routing.py`
- routing decisions live in `model_router.py`
- provider-specific quirks belong in `model_adapters.py`
- prompt/profile behavior remains a real runtime concern and still influences prompt selection

## Operational notes

Default baseline behavior from `config.py`:
- routing is active
- provider calls are disabled by default unless explicitly enabled
- routing metadata is disabled by default
- long-form provider loop is disabled by default

## Authority

Current runtime authority:
- this file
- `docs/specs/current_state.md`
- `services/src/blackskies/services/app.py`
- `services/src/blackskies/services/config.py`
- `services/src/blackskies/services/model_routing.py`
- `services/src/blackskies/services/model_router.py`
- `services/src/blackskies/services/model_adapters.py`
- prompt-related runtime modules listed above

Planning or draft reference only:
- `docs/specs/model_backend.md`
