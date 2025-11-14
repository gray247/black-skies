# docs/settings.md — DRAFT

## Scope
Define global and per-project settings so the renderer, services, and Model Router share the same user preferences.

## Settings Categories
- **AI Mode** (`local_only`, `local_then_api`, `api_only`): controls Model Router routing (`docs/model_backend.md`). Stored globally and can be overridden per project for experimentation.
- **Theme selection:** references token manifests (`docs/gui_theming.md`). Global selection lives in `~/.black-skies/config.json`; per-project overrides land in `project-root/settings.json`.
- **Accessibility preferences:** large font, high contrast, reduced motion toggles persist globally; they interact with theme overrides (e.g., `high_contrast_overrides`).
- **Analytics / telemetry toggles:** `analytics.enabled`, `telemetry.perf.enabled`, `telemetry.critique.enabled` default to `true` for local JSONL writes but can be disabled per project for privacy.
- **Autosave cadence:** default 30s with a 5s debounce (see `docs/phase10_recovery_pipeline.md`); advanced users may adjust via this settings document.
- **Storage locations:** global settings file (`~/.black-skies/config.json`) and per-project file (`project-root/settings.json`). Projects may also include `settings.json` inside `.blackskies/`.

## Storage Conventions
- Global settings file (`~/.black-skies/config.json`) contains:
  ```json
  {
    "ai_mode": "local_then_api",
    "theme": "default",
    "accessibility": { "high_contrast": false, "large_font": false },
    "analytics": { "enabled": true },
    "autosave": { "interval": 30, "debounce": 5 }
  }
  ```
- Per-project overrides stored at `project-root/.blackskies/settings.json` or `project-root/settings.json` with the same schema; unspecified keys inherit from global values.
- Settings updates signal the renderer via the configuration service so hot overrides (e.g., switching AI mode) can flag UI changes and Model Router adjustments.

## References
- Gamer mode toggles and theme selection surfaced in the renderer from this doc.
- Telemetry toggles correlate with `docs/performance_telemetry_policy.md`.
