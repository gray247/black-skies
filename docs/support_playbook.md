# Support Playbook — Phase 9 Preview
**Status:** Draft · 2025-10-07

This playbook captures the day-2 operations for Phase 9 features. Update as the release stabilises.

## Contact & Intake
- **Primary channel:** `#black-skies-support`
- **Escalation:** tag @desktop-oncall for Electron/runtime issues, @services-oncall for FastAPI incidents.
- **Ticket triage:** log every customer incident in Linear (`SUP`) with repro steps, logs, and environment details.

## Log & Telemetry Collection
- Electron main logs: `%APPDATA%/BlackSkies/logs/main.log`
- Renderer diagnostics: `%APPDATA%/BlackSkies/history/diagnostics/renderer.log`
- Services: `~/.blackskies/services/*.log`
- Voice notes metadata: `<project>/history/voice_notes/index.json`
- Analytics cache: `<project>/.blackskies/cache/analytics_summary.json`

## Feature Runbooks

### Analytics Summary
1. Hit `GET /api/v1/analytics/summary?project_id=…` with `curl -v` (matches `docs/analytics_service_spec.md`).
2. If the payload is stale, delete `.blackskies/cache/analytics_summary.json` and retry; this forces cache regeneration for the Project Health drawer.
3. Inspect diagnostics under `history/diagnostics/*analytics*.json` for schema errors or missing Outline/Writing artifacts.
4. Verify Outline and Writing files exist; missing drafts surface as `VALIDATION` issues in the response.
5. When triaging regressions, rerun `pytest -m "analytics"` to confirm the analytics contract still holds.

### Backup Verification (Disabled in v1.1)
The daemon described in the charter is not shipping yet; `/api/v1/healthz` always reports `backup_status: "warning"` and zero counts. Leave this section as a placeholder until the verifier flag is enabled.

### Voice Notes & Transcription (Deferred)
Voice input/recording are not exposed in v1.1 builds. Ignore the legacy plan references until the feature ships.

### Plugin Sandbox
1. Ensure sandbox registry is enabled via Settings → Plugins (requires restart).
2. Audit log is written to `%APPDATA%/BlackSkies/history/plugin_audit.log`.
3. Permission errors return `403` with details in log; verify manifest scopes.
4. Network-denied plugins must whitelist domains in `config/runtime.yaml::plugin.proxy_allowlist`.

### Docking & Hotkeys
1. Toggle docking in `config/runtime.yaml::ui.enable_docking`; restart Electron.
2. Reset layout with `Ctrl+Alt+0` and ensure `.blackskies/layout.json` updates.
3. Accessibility: `Ctrl+Alt+]` cycles focus; confirm the focused pane acquires `data-pane-id` attribute.

## Escalation Matrix
- **Data loss / corruption:** escalate immediately to @services-lead.
- **Security incident (plugin escape, sandbox bypass):** page security on-call; capture logs and disable plugin runtime (`BLACKSKIES_DISABLE_PLUGINS=1`).
- **Budget overrun:** advise customer to adjust limits in `.env` or `project.json`, document manual refund if applicable.

## Post-Release Tasks
- Run smoke (`scripts/load.py --profile smoke --start-service`).
- Monitor metrics dashboard for error spikes during first 24h.
- Summarise incidents in the weekly support report.
