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
1. Hit `GET /api/v1/analytics/summary?project_id=…` with `curl -v`.
2. If the payload is stale, delete `.blackskies/cache/analytics_summary.json` and retry.
3. Inspect diagnostics under `history/diagnostics/*analytics*.json` for schema errors.
4. Verify outline/draft files exist; missing drafts surface as `VALIDATION`.

### Backup Verification
1. Probe `GET /api/v1/healthz` and confirm `backup_status`, `backup_checked_snapshots`, and `backup_voice_note_issues` are healthy (`ok`, zero counts).
2. For warnings/errors, read `_runtime/backup_verifier_state.json` to identify the snapshot or voice note flagged (checksum deltas included).
3. Review `history/diagnostics/BACKUP_VERIFIER_*.json` for per-project context (missing includes, retry flags, voice note gaps).
4. If a snapshot reports a checksum mismatch, copy the directory to a quarantine location before attempting manual repairs or restores.
5. Voice note issues typically pair with `"transcript missing"` or `"audio file missing"`; reconcile by re-running transcription or re-uploading the audio source.

### Voice Notes & Transcription
1. Confirm microphone permissions in the OS and the app's Settings → Voice Notes toggle.
2. Use the backup verifier diagnostics to locate recent `"voice_note:*"` issues before diving into raw files.
3. Check `history/voice_notes/<note_id>/audio.ogg` for corruption (ffprobe).
4. Retry `POST /api/v1/voice/transcribe` with `provider=local`; external providers require `BLACKSKIES_ALLOW_EXTERNAL_TRANSCRIPTION=1` in env.
5. Budget errors surface as `402` — inspect `project.json::budget` before re-running.

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
