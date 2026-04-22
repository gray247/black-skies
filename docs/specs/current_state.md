Status: Canonical current runtime reference
Version: 1.0.0
Last Reviewed: 2026-04-18
Owner: Services Team

# Current Runtime State

Purpose: describe the current backend/runtime baseline as observed in code. Use this document for current-state orientation before reading roadmap or phase-planning materials.

Primary runtime authority lives in code, especially:
- `services/src/blackskies/services/app.py`
- `services/src/blackskies/services/config.py`
- `services/src/blackskies/services/model_routing.py`
- `services/src/blackskies/services/model_router.py`
- `services/src/blackskies/services/model_adapters.py`
- `services/src/blackskies/services/prompt_pipeline.py`
- `services/src/blackskies/services/scene_memory.py`
- `services/src/blackskies/services/memory_lab/orchestrator.py`
- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/operations/long_form_execution.py`
- `services/src/blackskies/services/services.py`
- `services/src/blackskies/services/feature_flags.py`

Related runtime references:
- `./memory_runtime.md`
- `./model_runtime.md`
- `./feature_maturity_migration.md`
- `build/runtime_truth.json` (generated ledger; schema-validated/freshness-checked by `services/tests/unit/test_runtime_truth.py`)
- `docs/policies/runtime_truth_policy.md`
- `docs/policies/deferred_feature_policy.md`

## Shipped runtime

These are part of the standard backend surface today.

- FastAPI application assembly and health/reporting: `services/src/blackskies/services/app.py`
- Core config loading and defaults: `services/src/blackskies/services/config.py`
- Model router decision layer: `services/src/blackskies/services/model_routing.py`, `services/src/blackskies/services/model_router.py`
- Prompt/context assembly facade: `services/src/blackskies/services/prompt_pipeline.py`
- Continuity/carryover persistence: `services/src/blackskies/services/scene_memory.py`
- Draft and long-form operations: `services/src/blackskies/services/operations/draft_generation.py`, `services/src/blackskies/services/operations/long_form_execution.py`
- Analytics baseline flagging: `services/src/blackskies/services/feature_flags.py`
- Analytics maturity defaults to `production` unless explicitly reduced via `BLACKSKIES_ANALYTICS_MATURITY` or `BLACKSKIES_ENABLE_ANALYTICS=0`
- Legacy continuity compatibility writes when Memory Lab is off: `services/src/blackskies/services/config.py`

## Implemented but off by default

These systems exist in code and tests, but they are not part of the default runtime baseline unless configuration opts in.

- Provider adapter execution: `model_router_provider_calls_enabled` in `services/src/blackskies/services/config.py`
- Routing metadata in service responses: `model_router_metadata_enabled` in `services/src/blackskies/services/config.py`
- Provider-backed long-form execution loop: `long_form_provider_enabled` in `services/src/blackskies/services/config.py`
- Backup verification daemon: `services/src/blackskies/services/backup_verifier.py`, enabled through `backup_verifier_enabled`
- Advisory Memory Lab base system: `services/src/blackskies/services/memory_lab/`, enabled through `memory_lab_enabled`
- Plugin execution surface: `services/src/blackskies/services/plugins/registry.py`, gated by `BLACKSKIES_ENABLE_PLUGINS`

## Experimental

These are implemented feature paths that remain explicitly non-baseline.

- Memory Lab reinforcement: `memory_lab_reinforcement_enabled`
- Memory Lab interpretations: `memory_lab_interpretations_enabled`
- Memory Lab decay: `memory_lab_decay_enabled`
- Memory Lab experimental framework / Wave 1 lanes: `memory_lab_experimental_enabled`

Source of truth for these toggles: `services/src/blackskies/services/config.py`

## Deferred

These are not part of the current product surface.

- Voice note recording/transcription workflow: `docs/deferred/voice_notes_transcription.md`
- Smart merge workflow: `docs/deferred/smart_merge_tool.md`
- Accessibility toggle UI: `docs/gui/accessibility_toggles.md`

Some deferred ideas have runtime seams or feature flags. That does not make them baseline features.

Deferred seam containment snapshot:
- `voice_notes`: live seam exists (`disabled`) for archival verification + health maturity reporting; seam owners are `backup_verifier.py`, `routers/health.py`, and `feature_flags.py`.
- `smart_merge`: no live runtime seam.
- `accessibility_toggles`: no live runtime seam.

Runtime Truth Ledger note:
- `canonical_docs` and `deferred_docs` entries are curated policy metadata maintained by the generator, not runtime-import discovery.
- `providers.health_check_targets` is intentionally named to avoid live-health ambiguity: it records config-selected health-check targets, not observed provider health.
- `health_observed` is intentionally not part of the ledger schema.
- `deferred_docs` now includes explicit seam containment metadata (`live_runtime_dependency`, `seam_owners`, `seam_state`, `seam_type`).
- Runtime-truth freshness/schema checks are enforced in normal validation paths: `services/tests/unit/test_runtime_truth.py` is run in CI (`.github/workflows/eval.yml`) and in local default/mixed test lanes (`run_tests.ps1`).

## Prototype / archive / historical

These are useful records, not current runtime authority.

- Memory Prototype v1 spec: `docs/specs/memory_prototype_v1.md`
- Memory Prototype v1 findings: `docs/reviews/memory_prototype_v1_findings.md`
- Phase 10.5 memory readiness checkpoint: `docs/phases/phase10_5_memory_readiness.md`
- `services/src/blackskies/services/memory_prototype/` code

## Reading order

1. This document for current-state orientation
2. `docs/specs/memory_runtime.md` for memory boundaries
3. `docs/specs/model_runtime.md` for model/provider boundaries
4. Code for exact behavior
5. `docs/roadmap.md` and `docs/phases/phase_charter.md` for future scope, not runtime truth
