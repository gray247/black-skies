Status: Supporting reference for Phase 2 migration
Version: 1.0.0
Last Reviewed: 2026-04-18

# Feature Maturity Migration Table

Purpose: document the Phase 2 migration from legacy feature-exposure booleans to normalized maturity states.

This table covers only user-meaningful subsystem exposure. It does not apply to ordinary operational toggles or low-level plumbing booleans.

Runtime claim sources:
- `build/runtime_truth.json`
- `docs/specs/current_state.md`

| Current flag | Old meaning | New maturity state | Compatibility behavior |
|---|---|---|---|
| `backup_verifier_enabled` | background backup verifier on/off | `internal` or `off` | legacy boolean remains supported; explicit `backup_verifier_maturity` overrides it; boolean is normalized from maturity during the migration window |
| `memory_lab_enabled` | advisory memory subsystem on/off | `experimental` or `off` | legacy boolean remains supported; explicit `memory_lab_maturity` overrides it; boolean is normalized from maturity during the migration window |
| `BLACKSKIES_ENABLE_PLUGINS` | plugin execution on/off | `partial` or `off` | legacy env boolean remains supported; explicit `BLACKSKIES_PLUGINS_MATURITY` overrides it |
| `BLACKSKIES_ENABLE_VOICE_NOTES` | deferred voice workflow on/off | `internal` or `off` | legacy env boolean remains supported; explicit `BLACKSKIES_VOICE_NOTES_MATURITY` overrides it |
| `BLACKSKIES_ENABLE_ANALYTICS` | analytics available on/off | `production` or `off` | legacy env boolean remains supported; explicit `BLACKSKIES_ANALYTICS_MATURITY` overrides it |

Diagnostics contract note:
- maturity reporting in `/api/v1/healthz` is additive
- maturity reporting is diagnostics-only in v1
- maturity reporting is not yet a stable external API contract

Analytics consistency note:
- analytics execution limits remain in `services/src/blackskies/services/config.py`
- analytics exposure/default maturity is owned by `services/src/blackskies/services/feature_flags.py`
- runtime-truth ledger defaults for analytics (`build/runtime_truth.json`) are generated from the same feature-flag source and validated by `services/tests/unit/test_runtime_truth.py` in normal CI/local lanes

Runtime-truth naming note:
- provider health metadata in the ledger uses `providers.health_check_targets` (config-derived target selection), not a live-health field such as `health_observed`
