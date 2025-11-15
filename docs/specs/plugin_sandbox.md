# Plugin Sandbox Design
> **Status:** Deferred – Phase 11 Agents & Plugins sandbox plan; not shipping in v1.1.
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Phase:** Phase 11 (Agents & Plugins)

## Goals
- Execute third-party plugins with least privilege.
- Prevent plugins from exhausting system resources or exfiltrating data without approval.
- Provide consistent auditing for install, execution, and teardown events.

## Execution Model
1. **Package intake**: Plugins are unpacked into `plugins/{id}/` (read-only) with checksum verification.
2. **Sandbox runtime**: Each invocation launches a dedicated subprocess using a minimal Python runtime (`python -I -m plugin_runner`) with:
   - Dedicated virtual environment containing only approved dependencies.
   - Restricted `PYTHONPATH`.
   - Environment variables limited to `BLACKSKIES_PLUGIN_*` scope.
3. **IPC**: Host communicates over stdio with JSON-RPC payloads (`invoke`, `report`, `heartbeat`).
4. **Resource limits**:
   - CPU: `resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))`.
   - Memory: `RLIMIT_AS` capped (configurable per policy).
   - File descriptors: limit to sandbox pipes.
   - Wall clock timeout enforced by host (default 30s, override via manifest).
5. **Filesystem**: Working directory is a temp folder; only whitelisted paths (project snapshots, read only) mounted via symlinks. No network by default.

## Permission Enforcement
- Manifest declares permissions (`read:project`, `emit:report`, `network:https`).
- Host validates requested permissions against tenant policy; rejects on mismatch.
- Network access requires explicit allow-list and uses proxy shim to capture requests.
- File access mediated through host-provided APIs; plugins cannot call `open()` outside temp dir.

## Auditing
- Every lifecycle event yields a structured log entry:
  - `install`, `enable`, `disable`, `execute`, `terminate`.
- Execution log includes:
  - Timestamp, plugin ID/version, permissions granted, duration, exit code.
- On timeout or resource limit breach, host records termination reason and stack trace (if any).
- Audit handlers write to `history/plugins/{id}/audit.log` and main diagnostics log.

## Error Handling
- Plugin stdout/stderr captured; stderr truncated to 4KB per frame.
- Non-zero exit or invalid JSON → host emits `FAILED` status with reason.
- Timeout → host sends `SIGKILL`, marks execution as `TIMEOUT`.

## Future Enhancements
- Optional WebAssembly backend for languages other than Python.
- Quota system for total CPU/IO per plugin per day.
- Signing requirements for production deployment.

## Implementation Roadmap
1. **Phase 1**: build sandbox runner module, manifest validator, and audit logger; integrate with registry install/enable workflow.
2. **Phase 2**: wire hook execution (Planner/Drafter/etc.) through sandbox API with timeout/error propagation; add unit + contract tests.
3. **Phase 3**: introduce network proxy and permission gating; implement resource quota tracking.
4. **Phase 4**: add CLI tooling for admins (list, inspect, revoke) and CI tests verifying isolation guarantees.
